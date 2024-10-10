import type { FC, PropsWithChildren } from "react";
import styled from "styled-components";

const StyledNavButton = styled.button`
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  align-items: center;
  border-radius: var(--default-radius);
  &:hover {
    background-color: var(--primary-hover-color);
  }
`;

type NavButtonProps = {
  onClick: () => void;
} & PropsWithChildren;
export const NavButton: FC<NavButtonProps> = ({ onClick, children }) => {
  return <StyledNavButton onClick={onClick}>{children}</StyledNavButton>;
};
