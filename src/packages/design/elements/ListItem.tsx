import { type FC, type PropsWithChildren, type CSSProperties } from "react";
import styled from "styled-components";

type MainWrapperProps = {
  height?: CSSProperties["height"];
};
const MainWrapper = styled.div<MainWrapperProps>`
  display: flex;
  height: ${({ height }) => (height ? height : "96px")};
  padding: 12px;
  border-radius: var(--card-radius);
  background-color: var(--card-content-background);
  max-width: 100%;
  width: 100%;
`;
type ListItemProps = {
  height?: CSSProperties["height"];
} & PropsWithChildren;
export const ListItem: FC<ListItemProps> = ({ children, height }) => {
  return <MainWrapper height={height}>{children}</MainWrapper>;
};
