import { type FC } from "react";
import styled, { css } from "styled-components";
import { DisplayActivityType, type ActivityType } from "../DisplayActivityType";

const Wrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ $active?: boolean }>`
  border-radius: var(--icon-radius);
  border: 2px solid transparent;
  ${({ $active }) =>
    $active &&
    css`
      border: 2px solid var(--active-border-color);
    `}
  &:hover {
    cursor: pointer;
    background-color: var(--icon-active-background);
  }
`;

type ActivityTypeSelectorProps = {
  type: ActivityType | undefined;
  setType: (type: ActivityType | undefined) => void;
};
export const ActivityTypeSelector: FC<ActivityTypeSelectorProps> = ({
  type,
  setType,
}) => {
  const isActive = (localType: ActivityType) => localType === type;

  const setActivityType = (localType: ActivityType) => {
    if (isActive(localType)) {
      setType(undefined);
    } else {
      setType(localType);
    }
  };
  return (
    <Wrapper>
      <Button
        $active={isActive("personal")}
        onClick={() => setActivityType("personal")}
      >
        <DisplayActivityType type="personal" />
      </Button>
      <Button
        $active={isActive("work")}
        onClick={() => setActivityType("work")}
      >
        <DisplayActivityType type="work" />
      </Button>
    </Wrapper>
  );
};
