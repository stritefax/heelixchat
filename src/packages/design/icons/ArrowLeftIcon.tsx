import { type FC } from "react";
import { IconProps } from "./type";
import { defaultColor, defaultWidth, defaultHeight } from "./contants";

export const ArrowLeftIcon: FC<IconProps> = ({
  color = defaultColor,
  width = defaultWidth,
  height = defaultHeight,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.1665 10H15.8332"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 4.16669L15.8333 10L10 15.8334"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
