import { type FC } from "react";
import styled from "styled-components";

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
`;

const PageButton = styled.button`
  background-color: var(--paginator-background);
  border: 1px solid var(--default-border-color);
  padding: 8px 14px;
  margin: 0 5px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover-color);
  }

  &:focus {
    outline: none;
  }

  &.active {
    background-color: var(--primary-color);
    color: white;
  }
`;

type PaginatorProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
};
export const Paginator: FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <PaginationWrapper>
      {pageNumbers.map((pageNumber) => (
        <PageButton
          key={pageNumber}
          className={pageNumber === currentPage ? "active" : ""}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </PageButton>
      ))}
    </PaginationWrapper>
  );
};
