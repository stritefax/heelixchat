import { type FC } from "react";
import { IconProps } from "./type";
import { defaultColor, defaultWidth, defaultHeight } from "./contants";

export const ClockIcon: FC<IconProps> = ({
  color = defaultColor,
  width = defaultWidth,
  height = defaultHeight,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.0002 20.1666C16.0628 20.1666 20.1668 16.0626 20.1668 11C20.1668 5.93737 16.0628 1.83331 11.0002 1.83331C5.93755 1.83331 1.8335 5.93737 1.8335 11C1.8335 16.0626 5.93755 20.1666 11.0002 20.1666Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 5.5V11L14.6667 12.8333"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
