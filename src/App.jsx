import React from "react";
import ChatContainer from "./components/ChatContainer";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./i18n/LanguageProvider";

function App() {
  return (
    // The boundary sits outside the provider so a crash inside the provider still renders a
    // usable fallback screen (in English, which is the correct degradation).
    <ErrorBoundary>
      <LanguageProvider>
        <ChatContainer />
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
