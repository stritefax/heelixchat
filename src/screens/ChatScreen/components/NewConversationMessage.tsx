import { type FC } from "react";
import styled from "styled-components";
import { Image } from "@chakra-ui/react";
import { Text } from "@heelix-app/design";
import logoBlack from "@heelix-app/design/logo/logo-black.png";

const NewConversationContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-l);
  justify-content: center;
`;

export const NewConversationMessage: FC = () => (
  <NewConversationContainer>
    <Image width="40px" height="40px" src={logoBlack} />
    <Text type="m" bold>
      What can I help you with?
    </Text>
  </NewConversationContainer>
);
