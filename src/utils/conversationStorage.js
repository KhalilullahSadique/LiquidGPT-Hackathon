export const CONVERSATIONS_KEY = "liquidgpt-conversations";
export const CURRENT_CONVERSATION_KEY = "liquidgpt-current-conversation";

const MAX_CONVERSATIONS = 50;

const isQuotaError = (error) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED");

/** A stored record must have an id and a message array; anything else is not ours. */
const isConversation = (value) =>
  Boolean(value) && typeof value.id === "string" && Array.isArray(value.messages);

/**
 * Older records only carried `timestamp`, which was overwritten on every save — so the
 * creation time was lost. Read it as the update time and let createdAt start from there.
 */
const normalise = (conversation) => ({
  ...conversation,
  createdAt: conversation.createdAt ?? conversation.timestamp ?? null,
  updatedAt: conversation.updatedAt ?? conversation.timestamp ?? null,
});

export const getAllConversations = () => {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isConversation).map(normalise);
  } catch (error) {
    console.warn("Failed to load conversations:", error);
    return [];
  }
};

export const getConversation = (conversationId) =>
  getAllConversations().find((conversation) => conversation.id === conversationId) ?? null;

/**
 * Save a conversation, newest first.
 *
 * Ordering is by `updatedAt`, not insertion order. The previous version unshifted new
 * records and updated existing ones in place, so the 50-record cap evicted by creation
 * date — quietly deleting a chat you used daily in favour of one you opened once.
 *
 * @returns {{ok: true, conversation: object} | {ok: false, reason: "quota"|"error"}}
 */
export const saveConversation = (conversationId, messages) => {
  try {
    const conversations = getAllConversations();
    const existing = conversations.find((item) => item.id === conversationId);
    const now = new Date().toISOString();

    const conversation = {
      id: conversationId,
      messages,
      title: generateTitle(messages),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const next = [
      conversation,
      ...conversations.filter((item) => item.id !== conversationId),
    ]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, MAX_CONVERSATIONS);

    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next));
    return { ok: true, conversation };
  } catch (error) {
    console.warn("Failed to save conversation:", error);
    return { ok: false, reason: isQuotaError(error) ? "quota" : "error" };
  }
};

export const deleteConversation = (conversationId) => {
  try {
    const remaining = getAllConversations().filter(
      (conversation) => conversation.id !== conversationId,
    );
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(remaining));

    if (getCurrentConversationId() === conversationId) {
      clearCurrentConversationId();
    }
    return true;
  } catch (error) {
    console.warn("Failed to delete conversation:", error);
    return false;
  }
};

export const setCurrentConversationId = (conversationId) => {
  try {
    localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
  } catch (error) {
    console.warn("Failed to set current conversation:", error);
  }
};

export const getCurrentConversationId = () => {
  try {
    return localStorage.getItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.warn("Failed to get current conversation:", error);
    return null;
  }
};

export const clearCurrentConversationId = () => {
  try {
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.warn("Failed to clear current conversation:", error);
  }
};

export const generateTitle = (messages) => {
  const firstUserMessage = messages?.find(
    (message) => message.role === "user" && typeof message.content === "string",
  );
  if (!firstUserMessage) return "New Chat";

  // Split on runs of whitespace so double spaces and newlines don't produce empty "words".
  const words = firstUserMessage.content.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  const title = words.join(" ");
  if (!title) return "New Chat";

  // Count by code point, so truncation can't slice an emoji in half.
  const characters = Array.from(title);
  return characters.length > 40 ? `${characters.slice(0, 40).join("")}…` : title;
};

export const generateConversationId = () =>
  globalThis.crypto?.randomUUID
    ? `conv_${globalThis.crypto.randomUUID()}`
    : `conv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
