import { FC, CSSProperties } from "react";
import styled from "styled-components";

const BarHeight: CSSProperties["height"] = "6px";
const BarRadius: CSSProperties["borderRadius"] = "10px";
type BarBackgroundProps = {
  color: CSSProperties["color"];
};
const BarBackground = styled.div<BarBackgroundProps>`
  position: relative;
  width: 100%;
  height: ${BarHeight};
  border-radius: ${BarRadius};
  background-color: ${({ color }) => color};
`;

type BarProps = {
  color: CSSProperties["color"];
  percent: number;
};
const Bar = styled.div<BarProps>`
  @keyframes ${({ percent }) => `fillBar${percent}`} {
    from {
      width: 0;
    }
    to {
      width: ${({ percent }) => percent}%;
    }
  }

  position: absolute;
  height: ${BarHeight};
  border-radius: ${BarRadius};
  background-color: ${({ color }) => color};
  width: ${({ percent }) => percent}%;
  animation: ${({ percent }) => `fillBar${percent}`} 1.5s ease-out;
`;

type Color = {
  color: string;
  bgColor: string;
};
type ProgressBarProps = {
  percent: number;
  color: Color;
};
export const ProgressBar: FC<ProgressBarProps> = ({ percent, color }) => {
  return (
    <BarBackground color={color.bgColor}>
      <Bar percent={percent} color={color.color} />
    </BarBackground>
  );
};
