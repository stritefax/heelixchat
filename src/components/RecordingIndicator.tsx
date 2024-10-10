import { FC } from "react";
import styled from "styled-components";

const variants = {
  inactive: { color: "var(--danger-color)", bgColor: "" },
  active: { color: "var(--recording-active-color)", bgColor: "" },
};

const Container = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  color: ${({ color }) => color};
`;

type RecordingIndicatorProps = {
  isRecording: boolean;
};
export const RecordingIndicator: FC<RecordingIndicatorProps> = ({
  isRecording,
}) => {
  const getColor = () => (isRecording ? variants.active : variants.inactive);

  return <Container color={getColor().color}></Container>;
};
