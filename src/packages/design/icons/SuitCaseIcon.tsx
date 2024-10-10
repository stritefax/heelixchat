import { type FC } from "react";
import { IconProps } from "./type";
import { defaultColor, defaultHeight, defaultWidth } from "./contants";

export const SuitCaseIcon: FC<IconProps> = ({
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
      d="M20 7.27451H4C2.89543 7.27451 2 8.16994 2 9.27451V19.2745C2 20.3791 2.89543 21.2745 4 21.2745H20C21.1046 21.2745 22 20.3791 22 19.2745V9.27451C22 8.16994 21.1046 7.27451 20 7.27451Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.0026 21.2745V5.27451C16.0026 4.74407 15.7918 4.23536 15.4168 3.86029C15.0417 3.48522 14.533 3.27451 14.0026 3.27451H10.0026C9.47213 3.27451 8.96342 3.48522 8.58835 3.86029C8.21328 4.23536 8.00256 4.74407 8.00256 5.27451V21.2745"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
