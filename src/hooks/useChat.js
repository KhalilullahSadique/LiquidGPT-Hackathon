import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage } from "../utils/api";

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  // Never leave a request running against an unmounted component.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback(async (messages, model) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      return await sendMessage(messages, model, { signal: controller.signal });
    } catch (err) {
      // A cancellation is a user action, not a failure to report.
      if (err?.kind !== "aborted") {
        setError(err?.message || "An unexpected error occurred.");
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
