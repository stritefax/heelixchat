import React, { useState, useEffect } from "react";
import { RecordingStateProvider } from "./Providers/RecordingStateProvider";
import { SettingsProvider } from "./Providers/SettingsProvider";
import { ChatScreen } from "./screens";
import { OnboardingScreen } from "./screens";
import "./chat.css";

export const ChatEntry: React.FC = () => {
  return (
    <SettingsProvider>
      <RecordingStateProvider>
        <ChatApp />
      </RecordingStateProvider>
    </SettingsProvider>
  );
};

const ChatApp: React.FC = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (onboardingCompleted) {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem("onboardingCompleted", "true");
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return <ChatScreen />;
};

export default ChatEntry;
