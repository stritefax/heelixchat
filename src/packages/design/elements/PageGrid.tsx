import styled from "styled-components";

export const PageGrid = styled.div<{ fixedRow?: boolean }>`
  position: relative;
  display: grid;
  min-height: 100%;
  gap: 18px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: ${({ fixedRow }) =>
    fixedRow ? `var(--content-header-height)` : "auto"};
`;

export const GridItem = styled.div<{ span?: number }>`
  grid-column: span ${({ span }) => span || 2};
`;
