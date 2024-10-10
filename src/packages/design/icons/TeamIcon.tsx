import { type FC } from "react";
import { IconProps } from "./type";
import { defaultColor, defaultHeight, defaultWidth } from "./contants";

export const TeamIcon: FC<IconProps> = ({
  color = defaultColor,
  width = defaultWidth,
  height = defaultHeight,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.3333 19V17.3333C16.3333 16.4493 15.9821 15.6014 15.357 14.9763C14.7319 14.3512 13.8841 14 13 14H6.33333C5.44928 14 4.60143 14.3512 3.97631 14.9763C3.35119 15.6014 3 16.4493 3 17.3333V19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.66585 10.6667C11.5068 10.6667 12.9992 9.17428 12.9992 7.33333C12.9992 5.49238 11.5068 4 9.66585 4C7.8249 4 6.33252 5.49238 6.33252 7.33333C6.33252 9.17428 7.8249 10.6667 9.66585 10.6667Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.3333 18.9999V17.3333C21.3327 16.5947 21.0869 15.8773 20.6344 15.2935C20.1819 14.7098 19.5484 14.2929 18.8333 14.1083"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5007 4.10828C16.2177 4.29186 16.8533 4.70886 17.3071 5.29354C17.7609 5.87821 18.0073 6.5973 18.0073 7.33744C18.0073 8.07759 17.7609 8.79668 17.3071 9.38135C16.8533 9.96603 16.2177 10.383 15.5007 10.5666"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
