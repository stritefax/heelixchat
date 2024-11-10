import styled from "styled-components";
import type { CSSProperties } from "react";

type GridLayoutProps = {
  template: CSSProperties["gridTemplate"];
};
export const GridLayout = styled.div<GridLayoutProps>`
  display: grid;
  gap: 18px;
  grid-template: ${({ template }) => template};
  grid-template-columns: auto;
  grid-template-rows: auto;
  width: 100%;
`;
