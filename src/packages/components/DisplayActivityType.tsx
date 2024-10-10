import { type FC } from "react";
import styled from "styled-components";
import { PersonIcon } from "@heelix-app/design/icons/PersonIcon";
import { SuitCaseIcon } from "@heelix-app/design/icons/SuitCaseIcon";
const IconWrapper = styled.div`
  width: 34px;
  height: 34px;
  background-color: var(--icon-background);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export type ActivityType = "personal" | "work";
type ActivityTypeProps = {
  type: ActivityType;
};
export const DisplayActivityType: FC<ActivityTypeProps> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case "personal":
        return <PersonIcon color="var(--text-default-color)" />;
      case "work":
        return <SuitCaseIcon color="var(--text-default-color)" />;
      default:
        return <></>;
    }
  };
  return <IconWrapper>{getIcon()}</IconWrapper>;
};
