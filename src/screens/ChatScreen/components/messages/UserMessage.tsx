import { FC } from "react";
import { ChatUserBubble } from "@heelix-app/components";
import styled from "styled-components";
import type { StoredMessage } from "../../types";
import { MessageMarkdown } from ".";

const MainContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const MessageContainer = styled.div`
  display: flex;
  background-color: var(--primary-color);
  border-radius: var(--default-radius);
  padding: 8px;
  max-width: 80%;
  text-align: left;
`;
const MessageText = styled.div`
  color: white;
`;
type UserMessageProps = {
  name: string;
  message: StoredMessage;
};
export const UserMessage: FC<UserMessageProps> = ({ message, name }) => {
  return (
    <MainContainer>
      <MessageContainer>
      <MessageText>
          {message.content}
          </MessageText>
          </MessageContainer>
      <ChatUserBubble name={name} />
    </MainContainer>
  );
};
