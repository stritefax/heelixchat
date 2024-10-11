import { FC, ReactElement, useMemo } from "react";
import { UserProfileInitials } from "@heelix-app/components";
import { IconHistory, IconPlus, IconX } from "@tabler/icons-react";
import { IconButton, Tooltip } from "@chakra-ui/react";
import styled, { css } from "styled-components";
import { useUser } from "@/state/userState";
import { useRecordingState } from "../../../Providers/RecordingStateProvider";

const MainContainer = styled.div`
  position: fixed;
  display: flex;
  width: 100%;
  background-color: var(--card-header-background);
  z-index: 100;
`;

const HistoryTitle = styled.div`
  display: none;
  align-items: center;
  flex: 1;

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0 0 var(--space-default);
  gap: var(--space-default);
`;

const HistoryContainer = styled.div`
  display: block;
  @media (min-width: 1024px) {
    display: none;
  }
`;

const HistoryButtonContainer = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  padding: var(--space-s);
`;

type ChatHeaderProps = {
  profileMenu: ReactElement;
  onClickNewChat: () => void;
  toggleChatHistory: () => void;
  toggleHistory: () => void;
};

export const ChatHeader: FC<ChatHeaderProps> = ({
  profileMenu,
  onClickNewChat,
  toggleChatHistory,
  toggleHistory,
}) => {
  const { user } = useUser();
  const { isRecording } = useRecordingState();
  return (
    <MainContainer>
      <LeftContainer>
        <HistoryContainer>
          <Tooltip label="Chat History" placement="bottom">
            <IconButton
              aria-label="Chat History"
              icon={<IconHistory size={20} />}
              onClick={toggleChatHistory}
              variant="ghost"
            />
          </Tooltip>
        </HistoryContainer>
        <HistoryButtonContainer>
          <Tooltip label="Chat History" placement="bottom">
            <IconButton
              aria-label="Chat History"
              icon={<IconHistory size={20} />}
              onClick={toggleHistory}
              variant="ghost"
            />
          </Tooltip>
        </HistoryButtonContainer>
        <Tooltip label="New Chat" placement="bottom">
          <IconButton
            aria-label="New Chat"
            icon={<IconPlus size={20} />}
            onClick={onClickNewChat}
            variant="ghost"
          />
        </Tooltip>
      </LeftContainer>
      <ContentContainer>
        <UserProfileInitials
          picture={user.imageUrl}
          name={user.name}
          isRecording={isRecording}
        >
          {profileMenu}
        </UserProfileInitials>
      </ContentContainer>
    </MainContainer>
  );
};
