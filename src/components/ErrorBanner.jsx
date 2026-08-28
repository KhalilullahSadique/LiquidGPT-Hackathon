import React from "react";

const TONES = {
  error: {
    container:
      "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-200",
    dismiss: "hover:bg-red-100 dark:hover:bg-red-900/50 focus-visible:ring-red-500",
  },
  warning: {
    container:
      "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
    dismiss: "hover:bg-amber-100 dark:hover:bg-amber-900/50 focus-visible:ring-amber-500",
  },
};

const ErrorBanner = ({ message, onDismiss, tone = "error" }) => {
  const styles = TONES[tone] ?? TONES.error;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles.container}`}
    >
      <svg
        className="w-5 h-5 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>

      <p className="flex-1 leading-relaxed break-words">{message}</p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className={`shrink-0 rounded-lg p-1 cursor-pointer transition-colors focus:outline-hidden focus-visible:ring-2 ${styles.dismiss}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default ErrorBanner;
