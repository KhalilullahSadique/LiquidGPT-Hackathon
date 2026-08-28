import React from "react";
import ChatContainer from "./components/ChatContainer";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ChatContainer />
    </ErrorBoundary>
  );
}

export default App;
