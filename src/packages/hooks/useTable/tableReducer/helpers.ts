import { SortDirection, TypeCastOptions, BaseType } from "../types";
import { SortState } from "./types";

export const filterOnField = <T extends BaseType>(
  row: T,
  key: keyof T,
  searchTerm: string
): boolean => {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  const item = row[key];
  if (typeof item === "string") {
    return item.toLowerCase().includes(trimmedSearchTerm);
  }
  if (typeof item === "number") {
    return item.toString().includes(trimmedSearchTerm);
  }
  return false;
};

export const sortOnField = <T extends BaseType>(
  key: keyof T,
  sortDirection: SortDirection,
  typecast?: TypeCastOptions
) => {
  // Sets sorting direction by preselecting return values.
  const [aBig, aSmall] = sortDirection == "asc" ? [1, -1] : [-1, 1];
  const parse = parseValue(typecast);
  return (a: T, b: T): number => {
    const aAtKey = a[key];
    const bAtKey = b[key];
    if (typeof aAtKey === "boolean" && typeof bAtKey === "boolean") {
      if (aAtKey === bAtKey) return 0;
      return aAtKey > bAtKey ? aBig : aSmall;
    }
    if (typeof aAtKey === "string" && typeof bAtKey === "string") {
      if (parse(aAtKey) > parse(bAtKey)) return aBig;
      if (parse(aAtKey) < parse(bAtKey)) return aSmall;
      return 0;
    }
    if (typeof aAtKey === "number" && typeof bAtKey === "number") {
      return aBig == 1 ? aAtKey - bAtKey : bAtKey - aAtKey;
    }
    return 0;
  };
};

export const getSortState = <T extends BaseType>(
  key: keyof T,
  currentSortState: SortState<T>
): SortState<T> => {
  let sortDirection: SortDirection = "desc";
  if (key === currentSortState.sortKey) {
    sortDirection = currentSortState.sortDirection === "desc" ? "asc" : "desc";
  }
  return {
    sortKey: key,
    sortDirection,
  };
};

type ParseValue = {
  (typecast?: TypeCastOptions): (value: string | number) => string | number;
};
const parseValue: ParseValue = (typecast) => {
  return (value) => {
    if (!typecast) {
      return value;
    }
    if (typecast && typecast === "string") {
      return `${value}`;
    }
    if (typecast && typecast === "integer" && typeof value === "string") {
      const parsedValue = parseInt(value);
      if (typeof parsedValue === "number") {
        return parsedValue;
      } else {
        return value;
      }
    }
    if (typecast && typecast === "float" && typeof value === "string") {
      const parsedValue = parseFloat(value);
      if (typeof parsedValue === "number") {
        return parsedValue;
      } else {
        return value;
      }
    }
    return value;
  };
};

export const shouldClearSelected = <T extends BaseType>(
  clearSelection = false,
  selectedRows: T[],
  totalRows: number
): boolean =>
  clearSelection ||
  (selectedRows.length > 0 && selectedRows.length === totalRows);
