import { type FC, PropsWithChildren } from "react";
import styled from "styled-components";

const Container = styled.div`
 display: grid;
  height: 100%;
  align-items: center;
  overflow-y: auto;
  grid-template-columns: 300px auto;
  grid-template-rows: 56px auto;
  grid-template-areas:
    "sidebar header"
    "sidebar content";
  background: var(--card-content-background);
  flex-direction: column;
  position: relative;
  font-weight: normal;
`;

export const ScreenContainer: FC<PropsWithChildren> = ({ children }) => (
  <Container>{children}</Container>
);
