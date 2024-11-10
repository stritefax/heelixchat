import { type FC, type CSSProperties } from "react";
import { Skeleton } from "@chakra-ui/react";

type LoadingListProps = {
  height: CSSProperties["height"];
  items: number;
};
export const LoadingList: FC<LoadingListProps> = ({ height, items }) => (
  <>
    {[...Array(items)].map((item, index) => (
      <Skeleton height={height} key={index} />
    ))}
  </>
);
