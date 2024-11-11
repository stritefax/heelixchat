import { FC, ReactElement } from "react";
import { UserProfileInitials } from "@heelix-app/components";
import styled from "styled-components";
import { useUser } from "@/state/userState";
import { useRecordingState } from "../../../Providers/RecordingStateProvider";

const MainContainer = styled.div`
  /* position: fixed; */
  display: flex;
  grid-area: header;
  width: 100%;
  background-color: var(--card-header-background);
  z-index: 100;
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
};

export const ChatHeader: FC<ChatHeaderProps> = ({ profileMenu }) => {
  const { user } = useUser();
  const { isRecording } = useRecordingState();
  return (
    <MainContainer>
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
