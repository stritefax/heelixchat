import type { FC, PropsWithChildren } from "react";
import styled from "styled-components";

const StyledNavButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #e9e9eb;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #e9e9eb;
  }
`;

type NavIconButtonProps = {
  onClick: () => void;
} & PropsWithChildren;
export const NavIconButton: FC<NavIconButtonProps> = ({ onClick, children }) => {
  return <StyledNavButton onClick={onClick}>{children}</StyledNavButton>;
};
