import { type FC, type PropsWithChildren } from "react";
import styled, { css } from "styled-components";
import type { SizeType } from "./types";

const getSize = (type: SizeType) => {
  switch (type) {
    case "xs":
      return 12;
    case "s":
      return 14;
    case "m":
      return 16;
    case "l":
      return 18;
    case "xl":
      return 22;
    default:
      return 22;
  }
};

type StyledParagraphProps = {
  type: SizeType;
  $maxLines?: number;
  $emphasize?: boolean;
  $bold?: boolean;
  $secondary?: boolean;
};
const StyledParagraph = styled.p<StyledParagraphProps>`
  font-weight: ${({ $emphasize, $bold }) =>
    $bold ? 600 : $emphasize ? 500 : 400};
  font-size: ${({ type }) => getSize(type)}px;
  overflow: hidden;
  text-overflow: ellipsis;

  ${({ $secondary }) =>
    $secondary &&
    css`
      opacity: 0.5;
    `}

  ${({ $maxLines }) =>
    $maxLines &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: ${$maxLines}; /* number of lines to show */
      line-clamp: ${$maxLines};
      -webkit-box-orient: vertical;
    `}
`;

type TextProps = {
  type: SizeType;
  secondary?: boolean;
  maxLines?: number;
  emphasize?: boolean;
  bold?: boolean;
} & PropsWithChildren;
export const Text: FC<TextProps> = ({
  type,
  maxLines,
  children,
  emphasize,
  bold,
  secondary,
}) => (
  <StyledParagraph
    type={type}
    $maxLines={maxLines}
    $emphasize={emphasize}
    $bold={bold}
    $secondary={secondary}
  >
    {children}
  </StyledParagraph>
);
