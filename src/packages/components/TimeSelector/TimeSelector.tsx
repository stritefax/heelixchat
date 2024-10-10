import { type FC } from "react";
import styled from "styled-components";
import dayjs, { type Dayjs } from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isBetween);

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  Text,
} from "@heelix-app/design";

const Container = styled.div`
  display: flex;

  align-items: center;
  justify-content: space-between;
  background-color: var(--card-content-background);
  border: 1px solid var(--default-border-color);
  border-radius: var(--card-radius);
  overflow: hidden;
  width: 262px;
  height: 46px;
`;

const WhenContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 0 12px;
`;

const VerticalBorder = styled.div`
  border-right: 1px solid var(--default-border-color);
  height: 20px;
`;

const PrevNextContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  &:hover {
    ${VerticalBorder} {
      opacity: 0;
    }
  }
`;

const PrevNextButton = styled.button`
  background: none;
  height: 100%;
  padding: 0 12px;
  border: none;
  &:hover {
    background-color: var(--primary-hover-color);
  }

  &:hover:disabled {
    background: none;
  }

  &:disabled path {
    stroke: var(--text-dissabled);
  }
`;

export type TimeInterval = {
  startTime: Dayjs;
  endTime: Dayjs;
};
type TimeSelectorProps = {
  setValue: (interval: TimeInterval) => void;
  value: TimeInterval;
};
export const TimeSelector: FC<TimeSelectorProps> = ({ setValue, value }) => {
  const getDayName = () => {
    if (value.startTime.isToday()) {
      return "Today";
    }
    if (value.startTime.isYesterday()) {
      return "Yesterday";
    }
    return `last ${value.startTime.format("dddd")}`;
  };

  const goBack = () => {
    setValue({
      startTime: value.startTime.subtract(1, "day"),
      endTime: value.endTime.subtract(1, "day"),
    });
  };

  const goForward = () => {
    setValue({
      startTime: value.startTime.add(1, "day"),
      endTime: value.endTime.add(1, "day"),
    });
  };

  const isGoForwardDissabled = value.startTime.isToday();
  const isGoBackDissabled = !value.startTime.isBetween(
    dayjs(),
    dayjs().subtract(7, "day"),
    "day",
    "[]"
  );

  return (
    <Container>
      <WhenContainer>
        <ClockIcon />
        <Text type="m" emphasize>
          {getDayName()}
        </Text>
      </WhenContainer>
      <PrevNextContainer>
        <PrevNextButton onClick={goBack} disabled={isGoBackDissabled}>
          <ArrowRightIcon />
        </PrevNextButton>
        <VerticalBorder />
        <PrevNextButton onClick={goForward} disabled={isGoForwardDissabled}>
          <ArrowLeftIcon />
        </PrevNextButton>
      </PrevNextContainer>
    </Container>
  );
};
