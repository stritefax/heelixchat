import { FC, CSSProperties } from "react";
import styled from "styled-components";

type DotBackgroundProps = {
  color: string;
};
const DotBackground = styled.div<DotBackgroundProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ color }) => color};
  width: 16px;
  height: 16px;
  border-radius: 16px;
`;

type DotProps = {
  color: CSSProperties["color"];
};
const Dot = styled.div<DotProps>`
  background-color: ${({ color }) => color};
  width: 6px;
  height: 6px;
  border-radius: 6px;
`;

type Color = {
  color: string;
  bgColor: string;
};
type ColoredDotProps = {
  color: Color;
};
export const ColoredDot: FC<ColoredDotProps> = ({ color }) => {
  return (
    <DotBackground color={color.bgColor}>
      <Dot color={color.color} />
    </DotBackground>
  );
};
