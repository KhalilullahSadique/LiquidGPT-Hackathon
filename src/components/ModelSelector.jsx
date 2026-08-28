import React from "react";
import { AVAILABLE_MODELS } from "../constants/models";
import { PROVIDERS } from "../constants/providers";
import { useTranslation } from "../i18n/useTranslation";

const ModelSelector = ({ selectedModel, onModelChange, disabled }) => {
  const { t } = useTranslation();

  const byProvider = Object.entries(PROVIDERS).map(([id, provider]) => ({
    label: provider.label,
    models: AVAILABLE_MODELS.filter((model) => model.provider === id),
  }));

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <label
        htmlFor="model-select"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block"
      >
        {t("model.label")}
      </label>
      {/* text-base below sm: anything under 16px makes iOS Safari zoom the page on focus
          and never zoom back out. */}
      <select
        id="model-select"
        aria-label={t("model.aria")}
        value={selectedModel}
        onChange={(event) => onModelChange(event.target.value)}
        disabled={disabled}
        className="px-2 sm:px-3 py-1.5 min-h-11 w-full min-w-0 sm:w-auto sm:max-w-none cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-base sm:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100"
      >
        {byProvider.map(({ label, models }) => (
          <optgroup key={label} label={label}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
