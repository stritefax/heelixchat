import type { FC } from "react";
import styled from "styled-components";
import { isString } from "../utils";
import { ConditionalWrapper } from "./ConditionalWrapper";
import { Tooltip } from "@chakra-ui/react";
import { TableHeader, Paginator } from "@heelix-app/components";

const ContentWrapper = styled.div`
  display: grid;
  width: 100%;
  grid-template-rows: auto;
  :last-child {
    border-bottom: none;
  }
`;

type RowWrapperProps = {
  $columns: number[];
};
const RowWrapper = styled.div<RowWrapperProps>`
  padding: 12px 8px;
  display: grid;
  grid-template-columns: ${({ $columns }) =>
    $columns.map((column) => `${column}fr `)};
  border-bottom: 1px solid var(--default-border-color);
`;

const CellWrapper = styled.div`
  padding: 0 8px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type ScrollableTableProps = {
  data: (string | number)[][];
  columns: [string, number][];
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (pageNumber: number) => void;
  };
};
export const SimpleTable: FC<ScrollableTableProps> = ({
  data,
  columns,
  pagination,
}) => {
  return (
    <>
      <TableHeader columns={columns} />
      <ContentWrapper>
        {data.map((row, rowIndex) => (
          <RowWrapper key={rowIndex} $columns={columns.map(([, span]) => span)}>
            {row.map((cell, cellIndex) => (
              <ConditionalWrapper
                key={cellIndex}
                shouldWrap={isString(cell) && cell.length > 16}
                wrapper={(children) => (
                  <Tooltip label={cell}>{children}</Tooltip>
                )}
              >
                <CellWrapper key={cell}>{cell}</CellWrapper>
              </ConditionalWrapper>
            ))}
          </RowWrapper>
        ))}
      </ContentWrapper>
      {pagination && pagination.totalPages > 1 && <Paginator {...pagination} />}
    </>
  );
};
