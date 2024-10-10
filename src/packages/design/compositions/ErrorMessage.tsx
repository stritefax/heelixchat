import { type FC } from "react";
import styled from "styled-components";
import { TitleError } from "@heelix-app/design";
const Container = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

type NoDataMessageProp = {
  text?: string;
};
export const ErrorMessage: FC<NoDataMessageProp> = ({
  text = "Something went wrong!",
}) => {
  return (
    <Container>
      <TitleError type="m">{text}</TitleError>
    </Container>
  );
};
