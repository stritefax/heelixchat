import { type FC, type PropsWithChildren, type ReactNode } from "react";
type ConditionalWrapperProps = {
  shouldWrap: boolean;
  wrapper: (children: ReactNode) => JSX.Element;
};
export const ConditionalWrapper: FC<
  PropsWithChildren<ConditionalWrapperProps>
> = ({ children, wrapper, shouldWrap }) =>
  shouldWrap ? wrapper(children) : <>{children}</>;
