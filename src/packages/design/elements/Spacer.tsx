import { type FC } from "react";
import styled from "styled-components";
import type { SizeType } from "./types";

const getSize = (type: SizeType) => {
  switch (type) {
    case "xs":
      return "var(--space-xs)";
    case "s":
      return "var(--space-s)";
    case "m":
      return "var(--space-default)";
    case "l":
      return "var(--space-l)";
    case "xl":
      return "var(--space-xl)";
    default:
      return "var(--space-default)";
  }
};
type StyledSpacerProps = {
  type: SizeType;
};
const StyledSpacer = styled.div<StyledSpacerProps>`
  height: ${({ type }) => getSize(type)};
`;
type SpacerProps = {
  type: "xs" | "s" | "m" | "l" | "xl";
};
export const Spacer: FC<SpacerProps> = ({ type }) => {
  return <StyledSpacer type={type} />;
};
