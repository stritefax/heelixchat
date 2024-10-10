import { type FC } from "react";
import { IconProps } from "./type";
import {defaultColor, defaultHeight, defaultWidth} from "./contants";

export const PersonIcon: FC<IconProps> = ({
  color = defaultColor,
  width = defaultWidth,
  height = defaultHeight,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 21.2745V19.2745C20 18.2136 19.5786 17.1962 18.8284 16.4461C18.0783 15.6959 17.0609 15.2745 16 15.2745H8C6.93913 15.2745 5.92172 15.6959 5.17157 16.4461C4.42143 17.1962 4 18.2136 4 19.2745V21.2745"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 11.2745C14.2091 11.2745 16 9.48364 16 7.27451C16 5.06537 14.2091 3.27451 12 3.27451C9.79086 3.27451 8 5.06537 8 7.27451C8 9.48364 9.79086 11.2745 12 11.2745Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
