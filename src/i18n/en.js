/**
 * English strings. This is the reference dictionary: every key must exist here, because the
 * other locales are merged on top of it and fall back to it key by key.
 *
 * Keys are flat and dot-grouped by the component that renders them. `{name}` placeholders are
 * interpolated by the translator; `date.daysAgo.*` is selected by Intl.PluralRules.
 */
export const suggestions = [
  "Who is Khalil?",
  "Who built you?",
  "What does Khalilullah Sediq work with?",
  "What projects has Khalil built?",
  "Explain closures in JavaScript with an example",
  "Write a Python script to rename files in a folder",
  "What is the difference between SQL and NoSQL?",
];

export default {
  "header.toggleSidebar": "Toggle sidebar",
  "header.newChat": "New Chat",
  "header.newChatAria": "New chat",
  "header.deleteChat": "Delete Chat",
  "header.deleteChatAria": "Delete chat",
  "header.confirmTitle": "Delete this conversation?",
  "header.confirmBody":
    "This removes the conversation and all of its messages from this browser. It cannot be undone.",
  "header.cancel": "Cancel",
  "header.delete": "Delete",

  "sidebar.history": "Conversation history",
  "sidebar.close": "Close sidebar",
  "sidebar.newChat": "New Chat",
  "sidebar.emptyTitle": "No conversations yet",
  "sidebar.emptyBody": "Start a new chat to see it here",
  "sidebar.confirmDelete": 'Confirm deleting "{title}"',
  "sidebar.cancelDelete": "Cancel delete",
  "sidebar.delete": 'Delete "{title}"',

  "date.today": "Today",
  "date.yesterday": "Yesterday",
  "date.daysAgo.one": "{count} day ago",
  "date.daysAgo.other": "{count} days ago",

  "empty.welcome": "Welcome to LiquidGPT",
  "empty.body": "Start a conversation by typing a message below.",
  "empty.developedBy": "Developed by",

  "chat.thinking": "Thinking...",
  "chat.storageFull":
    "Browser storage is full. This chat is no longer being saved - delete some conversations to free space.",
  "chat.storageFailed": "This chat could not be saved to browser storage.",

  "input.label": "Message LiquidGPT",
  "input.placeholder": "Message LiquidGPT...",
  "input.send": "Send message",
  "input.stop": "Stop generating",
  "input.counter": "{count}/{max} characters",
  "input.hintSuggesting": "Press End or pick a prompt, then Enter to send",
  "input.hintTyping": "Press Enter to send, Shift+Enter for new line",
  "input.hintMobile": "Tap a prompt to start",
  "input.truncated": "Trimmed to the {max} character limit.",
  "input.nearLimit": "Approaching character limit",
  "input.suggestionsLabel": "Suggested prompts",

  "message.assistant": "AI Assistant",
  "message.fellBack": "AI Assistant · fell back to {model}",
  "message.copy": "Copy",
  "message.copied": "Copied",
  "message.copyFailed": "Failed",

  "model.label": "Model:",
  "model.aria": "Model",

  "theme.label": "Dark mode",
  "theme.toggle": "Toggle dark mode",

  "language.label": "Language:",
  "language.aria": "Interface language",

  "banner.dismiss": "Dismiss message",

  "crash.title": "Something went wrong",
  "crash.body": "The app hit an unexpected error. Your saved conversations are untouched.",
  "crash.reload": "Reload",

  "error.cancelled": "Request cancelled.",
  "error.provider": "The provider returned an error.",
  "error.noCompletions": "The provider returned no completions.",
  "error.truncated": "The reply hit the token limit before producing any text.",
  "error.empty": "The provider returned an empty reply.",
  "error.timeout": "The server did not respond within {seconds}s while calling {provider}.",
  "error.network":
    "Could not reach the LiquidGPT server. Check your connection and try again.",
  "error.exhaustedRetries": "Exhausted retries.",
  "error.noModel": "No usable model is configured.",
  "error.notConfigured":
    "No API key is configured on the server. Add GEMINI_API_KEY to your .env file (or to your Vercel environment variables) and restart.",
  "error.allFailed": "All {count} models failed. Last error: {message}",
  "error.unexpected": "An unexpected error occurred.",
};
