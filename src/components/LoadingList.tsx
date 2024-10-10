import { type FC, type CSSProperties } from "react";
import { Skeleton } from "@chakra-ui/react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  width: 100%;
`;

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
