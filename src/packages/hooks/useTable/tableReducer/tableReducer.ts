import type { TypeCastOptions, SelectAllStates, BaseType } from "../types";
import { MAX_PAGE_SIZE } from "../constants";
import { FilterDataProps, Action, State } from "./types";
import {
  filterOnField,
  sortOnField,
  getSortState,
  shouldClearSelected,
} from "./helpers";

export const reducer = <T extends BaseType>(
  state: State<T>,
  action: Action<T>
): State<T> => {
  switch (action.type) {
    case "onDataUpdate":
      return onDataUpdate(state, action.payload);
    case "onSearchUpdated":
      return onSearchUpdated(state, action.payload);
    case "setFilter":
      return setFilter(state, action.payload);
    case "onSort":
      return onSort(state, action.payload);
    case "setCurrentPage":
      return setCurrentPage(state, action.payload);
    case "selectRow":
      return selectRow(state, action.payload);
    case "toggleSelectAll":
      return toggleAllRowSelection(state, action.payload);
    default:
      throw new Error("Unhandled reducer type");
  }
};

const setFilter = <T extends BaseType>(
  state: State<T>,
  payload: {
    data: T[];
    filter: unknown;
    filterConditionFn?: (data: T, filter: unknown) => boolean;
  }
) => {
  return onDataUpdate(
    {
      ...state,
      filter: payload.filter,
      filterConditionFn: payload.filterConditionFn,
    },
    { data: payload.data }
  );
};

const onSort = <T extends BaseType>(
  state: State<T>,
  payload: {
    data: T[];
    sortKey: keyof T;
    typecast?: TypeCastOptions;
  }
) => {
  if (!state) {
    throw new Error("Missing state prop");
  }
  if (!payload || !payload.sortKey) {
    throw new Error("Missing sortKey payload props");
  }
  let rows = [...state.rows];
  const sortState = getSortState(
    payload.sortKey,
    state.sortState || { ...payload, sortDirection: null }
  );
  if (sortState.sortDirection) {
    rows.sort(
      sortOnField<T>(
        sortState.sortKey,
        sortState.sortDirection,
        payload.typecast
      )
    );
  } else {
    rows = filterData(
      payload.data,
      state.filterKeys,
      state.search,
      state.sortState
    );
  }
  return {
    ...state,
    rows,
    sortState,
  };
};

const toggleAllRowSelection = <T extends BaseType>(
  state: State<T>,
  payload: { clearSelection: boolean }
): State<T> => {
  if (!state) {
    throw new Error("Missing state prop");
  }

  const selectedRows = shouldClearSelected(
    payload.clearSelection,
    state.selectedRows,
    state.rows.length
  )
    ? []
    : state.rows;

  const selectAllState = getSelectedState(selectedRows, state.rows);

  return {
    ...state,
    selectedRows,
    selectAllState,
  };
};

const selectRow = <T extends BaseType>(
  state: State<T>,
  payload: {
    row: T;
  }
): State<T> => {
  if (!state) {
    throw new Error("Missing state prop");
  }

  const indexOfRow = state?.selectedRows?.indexOf(payload.row) ?? -1;
  const selectedRows =
    indexOfRow === -1
      ? // not found in selected list, concat with selected to select.
        state.selectedRows.concat(payload.row)
      : // slice out the selected row to unselect it
        state.selectedRows
          .slice(0, indexOfRow)
          .concat(state.selectedRows.slice(indexOfRow + 1));

  return {
    ...state,
    selectedRows,
    selectAllState: getSelectedState(selectedRows, state.rows),
  };
};

const setCurrentPage = <T extends BaseType>(
  state: State<T>,
  payload: { currentPage: number; data: T[] }
): State<T> => {
  const currentPage = payload.currentPage;
  return onDataUpdate(
    {
      ...state,
      currentPage,
      selectedRows: [],
    },
    { data: payload.data }
  );
};

const onSearchUpdated = <T extends BaseType>(
  state: State<T>,
  payload: { data: T[]; search: string }
): State<T> => {
  if (!state) {
    throw new Error("Missing state prop");
  }
  const filteredData: any[] = filterData(
    payload.data,
    state.filterKeys,
    payload.search,
    state.sortState
  );

  return { ...paginate<T>(state, filteredData, true), search: payload.search };
};

const onDataUpdate = <T extends BaseType>(
  state: State<T>,
  payload: { data: T[] }
): State<T> => {
  const filteredData: T[] =
    state.filter && state.filterConditionFn
      ? filterData(
          payload.data,
          state.filterKeys,
          state.search,
          state.sortState,
          { filter: state.filter, filterConditionFn: state.filterConditionFn }
        )
      : filterData(
          payload.data,
          state.filterKeys,
          state.search,
          state.sortState
        );

  return paginate(state, filteredData);
};

const filterData = <T extends BaseType>(
  data: FilterDataProps<T>["data"],
  filterKeys: FilterDataProps<T>["filterKeys"],
  searchTerm: FilterDataProps<T>["searchTerm"],
  sort: FilterDataProps<T>["sort"],
  filterProps?: FilterDataProps<T>["filterProps"]
): T[] => {
  let filteredData = [...data];
  if (filterProps) {
    filteredData = filteredData.filter((row) =>
      filterProps.filterConditionFn(row, filterProps.filter)
    );
  }
  if (filterKeys.length && searchTerm) {
    filteredData = filteredData.filter((row) => {
      const initialValue = false;
      const results = filterKeys.reduce(
        (previousValue, currentDataField) =>
          previousValue || filterOnField(row, currentDataField, searchTerm),
        initialValue
      );
      return results;
    });
  }
  if (sort && sort.sortKey && sort.sortDirection) {
    filteredData.sort(sortOnField(sort.sortKey, sort.sortDirection));
  }
  return filteredData;
};

const paginate = <T extends BaseType>(
  state: State<T>,
  filteredData: T[],
  resetCurrentPage = false
): State<T> => {
  const nrOfPages = Math.max(Math.ceil(filteredData.length / MAX_PAGE_SIZE), 1);
  const currentPage = Math.min(
    resetCurrentPage ? 1 : state.currentPage,
    nrOfPages
  ); // currentPage must never be > nrOfPages.
  const startIndex = (currentPage - 1) * MAX_PAGE_SIZE;
  const endIndex = startIndex + MAX_PAGE_SIZE;

  return {
    ...state,
    currentPage,
    nrOfPages,
    rows: filteredData.slice(startIndex, endIndex),
  };
};

const getSelectedState = <T extends BaseType>(
  selectedRows: T[],
  rows: T[]
): SelectAllStates => {
  if (
    selectedRows.length > 0 &&
    rows.length === selectedRows.length &&
    rows.length <= MAX_PAGE_SIZE
  ) {
    return "all";
  } else if (selectedRows.length > 0) {
    return "some";
  }
  return "none";
};
