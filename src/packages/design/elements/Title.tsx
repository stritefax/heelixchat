import { type FC, type PropsWithChildren } from "react";
import styled, { css } from "styled-components";
import type { SizeType } from "./types";

const getTitleSize = (type: SizeType) => {
  switch (type) {
    case "xs":
      return 16;
    case "s":
      return 18;
    case "m":
      return 22;
    case "l":
      return 28;
    case "xl":
      return 34;
    default:
      return 34;
  }
};
const titleStyle = (type: SizeType, $maxLines: number) => css`
  line-height: ${getTitleSize(type) + 4}px;
  font-size: ${getTitleSize(type)}px;
  font-weight: 600;
  /* white-space: nowrap; */
  overflow: hidden;
  text-overflow: ellipsis;

  ${$maxLines &&
  css`
    display: -webkit-box;
    -webkit-line-clamp: ${$maxLines}; /* number of lines to show */
    line-clamp: ${$maxLines};
    -webkit-box-orient: vertical;
  `}
`;

type StyledTitleProps = {
  type: SizeType;
  $maxLines: number;
};
const StyledTitle1 = styled.h1<StyledTitleProps>`
  ${({ type, $maxLines }) => titleStyle(type, $maxLines)}
`;
const StyledTitle2 = styled.h2<StyledTitleProps>`
  ${({ type, $maxLines }) => titleStyle(type, $maxLines)}
`;
const StyledTitle3 = styled.h3<StyledTitleProps>`
  ${({ type, $maxLines }) => titleStyle(type, $maxLines)}
`;

type TitleProps = {
  type: SizeType;
  level?: 1 | 2 | 3;
  maxLines?: number;
} & PropsWithChildren;
export const Title: FC<TitleProps> = ({
  type,
  level = 1,
  maxLines = 1,
  children,
}) => {
  switch (level) {
    case 1:
      return (
        <StyledTitle1 type={type} $maxLines={maxLines}>
          {children}
        </StyledTitle1>
      );
    case 2:
      return (
        <StyledTitle2 type={type} $maxLines={maxLines}>
          {children}
        </StyledTitle2>
      );
    case 3:
      return (
        <StyledTitle3 type={type} $maxLines={maxLines}>
          {children}
        </StyledTitle3>
      );
    default:
      return (
        <StyledTitle1 type={type} $maxLines={maxLines}>
          {children}
        </StyledTitle1>
      );
  }
};

const StyledTitleSecondary = styled(StyledTitle2)<StyledTitleProps>`
  ${({ type, $maxLines }) => titleStyle(type, $maxLines)}
  color: var(--text-table-header-color);
`;

export const TitleSecondary: FC<TitleProps> = ({
  type,
  maxLines = 1,
  children,
}) => (
  <StyledTitleSecondary type={type} $maxLines={maxLines}>
    {children}
  </StyledTitleSecondary>
);

const StyledTitleError = styled(StyledTitle1)<StyledTitleProps>`
  ${({ type, $maxLines }) => titleStyle(type, $maxLines)}
  color: var(--title-failure-color);
`;

export const TitleError: FC<TitleProps> = ({
  type,
  maxLines = 1,
  children,
}) => (
  <StyledTitleError type={type} $maxLines={maxLines}>
    {children}
  </StyledTitleError>
);
