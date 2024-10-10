import type { FC, PropsWithChildren, ComponentType } from "react";
import { NavLink as DomNavLink } from "react-router-dom";
import styled from "styled-components";
import { type IconProps } from "@heelix-app/design/icons";
import { Tooltip } from "@chakra-ui/react";

const StyledNavLink = styled(DomNavLink)`
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

  &.active {
    background-color: var(--primary-color);
    border: 1px solid var(--primary-color);
    &:hover {
      background-color: var(--primary-button-hover-color);
    }
  }
`;

type NavLinkProps = {
  to: string;
  tooltip: string;
  active?: boolean;
  icon: ComponentType<IconProps>;
} & PropsWithChildren;
export const NavLink: FC<NavLinkProps> = ({ to, tooltip, icon: Icon }) => {
  return (
    <Tooltip label={tooltip}>
      <StyledNavLink to={to}>
        {({ isActive }) => (
          <Icon
            color={
              isActive
                ? "var(--active-button-text-color)"
                : "var(--text-table-header-color)"
            }
          />
        )}
      </StyledNavLink>
    </Tooltip>
  );
};
