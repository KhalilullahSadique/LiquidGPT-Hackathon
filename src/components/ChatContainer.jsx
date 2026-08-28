import React, { useCallback, useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import logo from "../assets/logo.jfif";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Sidebar from "./Sidebar";
import ErrorBanner from "./ErrorBanner";
import { useChat } from "../hooks/useChat";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  clearCurrentConversationId,
  deleteConversation,
  generateConversationId,
  getAllConversations,
  getConversation,
  getCurrentConversationId,
  saveConversation,
  setCurrentConversationId,
} from "../utils/conversationStorage";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "../constants/models";
import { useTranslation } from "../i18n/useTranslation";

const SELECTED_MODEL_KEY = "liquidgpt-model";
const STICK_TO_BOTTOM_THRESHOLD_PX = 120;

const loadSelectedModel = () => {
  try {
    const saved = localStorage.getItem(SELECTED_MODEL_KEY);
    // A model that no longer exists in the catalog must not be restored.
    return AVAILABLE_MODELS.some((model) => model.id === saved) ? saved : DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
};

/**
 * Read the last session straight out of storage for the initial render.
 *
 * A pointer with no record means "New Chat was clicked but nothing was sent yet" - an
 * empty chat is the correct result. The previous version treated that miss as a legacy
 * migration and loaded the whole conversation index into the message pane.
 */
const restoreSession = () => {
  const savedId = getCurrentConversationId();
  if (!savedId) return { id: null, messages: [] };
  const conversation = getConversation(savedId);
  if (!conversation) return { id: null, messages: [] };
  return { id: savedId, messages: conversation.messages ?? [] };
};

/**
 * Turn a ChatError into display text.
 *
 * A null messageKey means the text came from a provider and is shown verbatim — translating
 * it would misreport what the server actually said. The one recursion handles the exhausted
 * chain, so a Russian "all models failed" sentence does not end in an English clause.
 */
const describeError = (error, t) => {
  if (!error) return "";
  if (!error.messageKey) return error.message ?? "";
  const params = { ...(error.messageParams ?? {}) };
  if (error.lastError) params.message = describeError(error.lastError, t);
  return t(error.messageKey, params);
};

const createMessageId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const ChatContainer = () => {
  const [initialSession] = useState(restoreSession);
  const [messages, setMessages] = useState(initialSession.messages);
  const [conversations, setConversations] = useState(getAllConversations);
  const [selectedModel, setSelectedModel] = useState(loadSelectedModel);
  const [currentConversationId, setCurrentConversationIdState] = useState(
    initialSession.id,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [storageWarning, setStorageWarning] = useState(null);

  const { send, cancel, isLoading, error, clearError } = useChat();
  const { isDark, toggleDarkMode } = useDarkMode();
  const { t, lang } = useTranslation();

  const messagesEndRef = useRef(null);
  const stickToBottomRef = useRef(true);
  // Lets an in-flight reply tell whether the user has since switched conversations.
  const conversationIdRef = useRef(initialSession.id);

  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  /**
   * Write a new message list to state and to storage in one place.
   *
   * Deliberately not an effect: saving is a consequence of a user action, and driving it
   * from an effect updated the conversation list and the quota warning in a cascading
   * second render.
   */
  const commitMessages = useCallback((conversationId, nextMessages) => {
    setMessages(nextMessages);
    const result = saveConversation(conversationId, nextMessages);
    if (result.ok) {
      setConversations(getAllConversations());
      setStorageWarning(null);
      return;
    }
    // A key, not a sentence: the banner must follow a later language switch.
    setStorageWarning(
      result.reason === "quota" ? "chat.storageFull" : "chat.storageFailed",
    );
  }, []);

  // Follow new messages only when the user is already at the bottom, so reading history
  // isn't interrupted by an arriving reply.
  useEffect(() => {
    if (stickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Keep the overlay sidebar from covering the screen after a rotate or resize.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => setIsSidebarOpen(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handleScroll = useCallback((event) => {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    stickToBottomRef.current =
      scrollHeight - scrollTop - clientHeight < STICK_TO_BOTTOM_THRESHOLD_PX;
  }, []);

  const handleSendMessage = async (userMessage) => {
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = generateConversationId();
      setCurrentConversationIdState(conversationId);
      conversationIdRef.current = conversationId;
      setCurrentConversationId(conversationId);
    }

    const userMsg = {
      id: createMessageId(),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const history = [
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: "user", content: userMessage },
    ];

    const nextMessages = [...messages, userMsg];
    stickToBottomRef.current = true;
    commitMessages(conversationId, nextMessages);
    clearError();

    try {
      const reply = await send(history, selectedModel, { language: lang });
      const aiMsg = {
        id: createMessageId(),
        role: "assistant",
        content: reply.content,
        timestamp: new Date().toISOString(),
        model: reply.model,
        usedFallback: reply.usedFallback,
      };

      if (conversationIdRef.current === conversationId) {
        commitMessages(conversationId, [...nextMessages, aiMsg]);
      } else {
        // The user moved on while this was in flight. Persist the reply where it belongs
        // rather than dropping it into whatever chat happens to be open now.
        const origin = getConversation(conversationId);
        if (origin) {
          saveConversation(conversationId, [...origin.messages, aiMsg]);
          setConversations(getAllConversations());
        }
      }
    } catch {
      // Failures surface in the error banner. They deliberately never enter the transcript:
      // a stored "Error: ..." bubble is indistinguishable from a real reply and gets
      // replayed to the model as conversation history on the next turn.
    }
  };

  const handleClearChat = () => {
    if (currentConversationId) deleteConversation(currentConversationId);
    setMessages([]);
    setCurrentConversationIdState(null);
    conversationIdRef.current = null;
    clearCurrentConversationId();
    setConversations(getAllConversations());
    clearError();
  };

  // No conversation id is minted until the first message, so New Chat cannot leave a
  // pointer behind that references a record which was never written.
  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationIdState(null);
    conversationIdRef.current = null;
    clearCurrentConversationId();
    clearError();
  };

  const handleConversationSelect = (conversationId) => {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    setMessages(conversation.messages ?? []);
    setCurrentConversationIdState(conversationId);
    conversationIdRef.current = conversationId;
    setCurrentConversationId(conversationId);
    stickToBottomRef.current = true;
    clearError();
  };

  const handleDeleteConversation = (conversationId) => {
    deleteConversation(conversationId);
    setConversations(getAllConversations());
    if (currentConversationId === conversationId) handleNewChat();
  };

  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    try {
      localStorage.setItem(SELECTED_MODEL_KEY, newModel);
    } catch {
      // A browser with storage disabled just loses the preference; not worth interrupting.
    }
  };

  return (
    <div className="flex h-dvh bg-gray-50 dark:bg-[var(--bg-primary)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onConversationDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        disabled={isLoading}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onClearChat={handleClearChat}
          onNewChat={handleNewChat}
          onToggleSidebar={toggleSidebar}
          disabled={isLoading}
          canClear={messages.length > 0}
        />

        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <img
                  src={logo}
                  alt=""
                  className="w-24 h-24 mx-auto mb-6 rounded-full object-cover shadow-lg"
                />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("empty.welcome")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{t("empty.body")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  {t("empty.developedBy")}{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Khalilullah Sediq
                  </span>
                </p>
              </div>
            ) : (
              <>
                <div aria-live="polite" aria-atomic="false">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isUser={message.role === "user"}
                    />
                  ))}
                </div>
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-3xl mr-12">
                      <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[var(--bg-tertiary)] text-gray-900 dark:text-[var(--text-primary)]">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1" aria-hidden="true">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span
                            className="text-sm text-gray-600 dark:text-gray-400"
                            role="status"
                          >
                            {t("chat.thinking")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="max-w-3xl w-full mx-auto px-4 space-y-2">
          {storageWarning && (
            <ErrorBanner
              tone="warning"
              message={t(storageWarning)}
              onDismiss={() => setStorageWarning(null)}
            />
          )}
          {error && (
            <ErrorBanner message={describeError(error, t)} onDismiss={clearError} />
          )}
        </div>

        <ChatInput
          onSend={handleSendMessage}
          onCancel={cancel}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
