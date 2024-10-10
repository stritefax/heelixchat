import styled from "styled-components";
export const TableHeader = styled.div`
  display: flex;
  height: 35px;
  padding: 0 18px; //add scrollbar width to match Content box
  align-items: center;
  background: var(--table-header-background);
  border-bottom: 1px solid var(--default-border-color);
`;

export const TableHeaderText = styled.p`
  font-size: 14px;
  font-weight: 600;
  line-height: 17px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--text-table-header-color);
  text-transform: uppercase;
`;

export const TableHeaderWrapper = styled.div<{ $columns: number[] }>`
  display: grid;
  width: 100%;
  grid-template-columns: ${({ $columns }) =>
    $columns.map(($column) => `${$column}fr `)};
`;
