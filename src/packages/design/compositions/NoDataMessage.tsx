import { type CSSProperties, type FC } from "react";
import styled from "styled-components";
import { TitleSecondary } from "@heelix-app/design";
type ContainerProps = {
  height?: CSSProperties["height"];
};
const Container = styled.div<ContainerProps>`
  display: flex;
  flex: 1;
  height: ${({ height }) => (height ? height : "100%")};
  width: 100%;
  justify-content: center;
  align-items: center;
`;
type NoDataMessageProp = {
  text?: string;
  height?: CSSProperties["height"];
};
export const NoDataMessage: FC<NoDataMessageProp> = ({
  text = "Empty",
  height,
}) => {
  return (
    <Container height={height}>
      <TitleSecondary type="m">{text}</TitleSecondary>
    </Container>
  );
};
