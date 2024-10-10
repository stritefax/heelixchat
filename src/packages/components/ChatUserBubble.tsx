import { FC } from "react";
import styled from "styled-components";

const UserBubble = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #f0f0f0;
  font-size: 16px;
  font-weight: 600;
`;

type ChatUserBubbleProps = {
  name: string;
};

export const ChatUserBubble: FC<ChatUserBubbleProps> = ({ name }) => {
  const getInitials = () => {
    const nameSplit = name.split(" ");
    const firstInitial = nameSplit[0]?.[0] || "";
    const lastInitial = nameSplit[1]?.[0] || "";
    return `${firstInitial}${lastInitial}`;
  };

  return <UserBubble>{getInitials()}</UserBubble>;
};
