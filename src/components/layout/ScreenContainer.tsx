import { type FC, PropsWithChildren } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  overflow-y: auto;
  background: var(--card-content-background);
  flex-direction: column;
  position: relative;
  font-weight: normal;
`;

export const ScreenContainer: FC<PropsWithChildren> = ({ children }) => (
  <Container>{children}</Container>
);
