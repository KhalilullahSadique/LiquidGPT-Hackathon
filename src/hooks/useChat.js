import { useCallback, useEffect, useRef, useState } from "react";
import { ChatError, sendMessage } from "../utils/api";

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  // Holds the ChatError itself, not a flattened string, so the UI can translate it at render
  // time and a language switch retranslates an error that is already on screen.
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  // Never leave a request running against an unmounted component.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback(async (messages, model, { language } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      return await sendMessage(messages, model, { signal: controller.signal, language });
    } catch (err) {
      // A cancellation is a user action, not a failure to report.
      if (err?.kind !== "aborted") {
        setError(
          err instanceof ChatError
            ? err
            : new ChatError(err?.message || "An unexpected error occurred.", {
                kind: "unknown",
                messageKey: "error.unexpected",
                cause: err,
              }),
        );
      }
      throw err;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  const clearError = useCallback(() => setError(null), []);

  return { send, cancel, isLoading, error, clearError };
};
