import { type FC, type CSSProperties } from "react";
import { Tooltip } from "@chakra-ui/react";
import styled from "styled-components";

type CategoryTagContainerProps = {
  $bgColor: CSSProperties["color"];
};
const CategoryTagContainer = styled.div<CategoryTagContainerProps>`
  height: 35px;
  gap: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 6px;
`;

type DotProps = {
  color: CSSProperties["color"];
};
const Dot = styled.span<DotProps>`
  height: 7px;
  width: 7px;
  min-width: 7px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

const CategoryText = styled.p`
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  color: var(--text-default-color);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

type CategoryColor = {
  color: string;
  bgColor: string;
};
type CategoryTagProps = {
  categoryColor: CategoryColor;
  text: string;
};
export const CategoryTag: FC<CategoryTagProps> = ({ categoryColor, text }) => {
  return (
    <Tooltip label={text}>
      <CategoryTagContainer $bgColor={categoryColor.bgColor}>
        <Dot color={categoryColor.color} />
        <CategoryText>{text}</CategoryText>
      </CategoryTagContainer>
    </Tooltip>
  );
};
