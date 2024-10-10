import { type FC } from "react";
import { IconProps } from "./type";
import { defaultColor, defaultHeight, defaultWidth } from "./contants";

export const ShareIcon: FC<IconProps> = ({
  color = defaultColor,
  width = defaultWidth,
  height = defaultHeight,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 19 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 6.5C15.2426 6.5 16.25 5.49264 16.25 4.25C16.25 3.00736 15.2426 2 14 2C12.7574 2 11.75 3.00736 11.75 4.25C11.75 5.49264 12.7574 6.5 14 6.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 11.75C6.24264 11.75 7.25 10.7426 7.25 9.5C7.25 8.25736 6.24264 7.25 5 7.25C3.75736 7.25 2.75 8.25736 2.75 9.5C2.75 10.7426 3.75736 11.75 5 11.75Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 17C15.2426 17 16.25 15.9926 16.25 14.75C16.25 13.5074 15.2426 12.5 14 12.5C12.7574 12.5 11.75 13.5074 11.75 14.75C11.75 15.9926 12.7574 17 14 17Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.94238 10.6324L12.0649 13.6174"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.0574 5.38245L6.94238 8.36745"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
