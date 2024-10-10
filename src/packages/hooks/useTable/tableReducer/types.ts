import type {
  SelectAllStates,
  SortDirection,
  TypeCastOptions,
  BaseType,
} from "../types";

export type SortState<T extends BaseType> = {
  sortKey: keyof T;
  sortDirection: SortDirection | null;
};

export type State<T extends BaseType> = {
  selectAllState: SelectAllStates;
  currentPage: number;
  sortState: SortState<T> | undefined;
  nrOfPages: number;
  selectedRows: T[];
  filterKeys: (keyof T)[];
  search: string;
  rows: T[];
  filter: unknown;
  filterConditionFn: ((data: T, filter: unknown) => boolean) | undefined;
};

type DataUpdateAction<T> = {
  type: "onDataUpdate";
  payload: { data: T[] };
};

type SearchUpdatedAction<T> = {
  type: "onSearchUpdated";
  payload: { data: T[]; search: string };
};

type SetFilterAction<T> = {
  type: "setFilter";
  payload: {
    data: T[];
    filter: unknown;
    filterConditionFn?: (data: T, filter: unknown) => boolean;
  };
};
type SortAction<T> = {
  type: "onSort";
  payload: {
    data: T[];
    sortKey: keyof T;
    typecast?: TypeCastOptions;
  };
};

type SetCurrentPageAction<T> = {
  type: "setCurrentPage";
  payload: { currentPage: number; data: T[] };
};

type SelectRowAction<T> = {
  type: "selectRow";
  payload: {
    row: T;
  };
};
type ToggleSelectAllAction = {
  type: "toggleSelectAll";
  payload: { clearSelection: boolean };
};

export type Action<T> =
  | DataUpdateAction<T>
  | SearchUpdatedAction<T>
  | SetFilterAction<T>
  | SortAction<T>
  | SetCurrentPageAction<T>
  | SelectRowAction<T>
  | ToggleSelectAllAction;

export type Reducer<T extends BaseType> = {
  (state: State<T>, action: Action<T>): State<T>;
};

export type FilterData<T extends BaseType> = {
  (
    data: T[],
    filterKeys: (keyof T)[],
    searchTerm: string,
    sort?: { sortKey: string; sortDirection: SortDirection | null },
    filterProps?: {
      filter: unknown;
      filterConditionFn: (data: T, filter: unknown) => boolean;
    }
  ): T[];
};
export type FilterDataProps<T extends BaseType> = {
  data: T[];
  filterKeys: (keyof T)[];
  searchTerm: string;
  sort?: { sortKey: keyof T; sortDirection: SortDirection | null };
  filterProps?: {
    filter: unknown;
    filterConditionFn: (data: T, filter: unknown) => boolean;
  };
};
