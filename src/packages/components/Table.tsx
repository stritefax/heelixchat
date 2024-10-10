import { type FC } from "react";
import {
  TableHeader as TableHeaderElement,
  TableHeaderText,
  TableHeaderWrapper,
} from "@heelix-app/design";

type TableHeaderProps = {
  columns: [string, number][];
};
export const TableHeader: FC<TableHeaderProps> = ({ columns }) => (
  <TableHeaderElement>
    <TableHeaderWrapper $columns={columns.map(([, span]) => span)}>
      {columns.map(([title], index) => (
        <TableHeaderText key={title + index}>{title}</TableHeaderText>
      ))}
    </TableHeaderWrapper>
  </TableHeaderElement>
);
