import { useEffect, useReducer, Reducer } from "react";
import {
  SelectAllStates,
  SortButtonState,
  TypeCastOptions,
  type BaseType,
} from "./types";
import { reducer } from "./tableReducer";
import { Action, State } from "./tableReducer/types";

type UseTableReturnType<T extends BaseType> = {
  getColumnSortState: (key: keyof T) => SortButtonState;
  nrOfPages?: number;
  page?: number;
  rows: T[];
  rowsSelectedState: SelectAllStates;
  selectedRows: T[];
  selectRow: (row: T) => void;
  setFilter: (filter: any) => void;
  setPage: (pageNr: number) => void;
  sort: (sortByKey: keyof T, typecast?: TypeCastOptions) => void;
  toggleAllRowSelection: (clearSelection?: boolean) => void;
};
export const useTable = <T extends BaseType>(
  data: T[],
  search = "",
  filterKeys: (keyof T)[],
  filterConditionFn?: (data: T, filter: any) => boolean
): UseTableReturnType<T> => {
  const initialState: State<T> = {
    selectAllState: "none",
    selectedRows: [],
    sortState: undefined,
    filterKeys: [],
    currentPage: 1,
    nrOfPages: 1,
    rows: [],
    search: "",
    filter: undefined,
    filterConditionFn: undefined,
  };

  const [state, dispatch] = useReducer<Reducer<State<T>, Action<T>>, State<T>>(
    reducer,
    { ...initialState, filterKeys: filterKeys || [] },
    (state: State<T>) => {
      return state;
    }
  );
  const { selectedRows, rows, currentPage, selectAllState, nrOfPages } = state;

  useEffect(() => {
    dispatch({ type: "onDataUpdate", payload: { data } });
  }, [JSON.stringify(data)]);

  useEffect(() => {
    dispatch({ type: "onSearchUpdated", payload: { data, search } });
  }, [search]);

  const sort = (sortByKey: keyof T, typecast?: TypeCastOptions) => {
    dispatch({
      type: "onSort",
      payload: { data, sortKey: sortByKey, typecast },
    });
  };

  const getColumnSortState = (key: unknown): SortButtonState => {
    if (state.sortState?.sortKey === key && state.sortState?.sortDirection) {
      return state.sortState?.sortDirection;
    }
    return "inactive";
  };

  const setFilter = (filter: any) => {
    dispatch({
      type: "setFilter",
      payload: { data, filter, filterConditionFn },
    });
  };
  return {
    rows,
    page: currentPage,
    nrOfPages: nrOfPages,
    sort,
    getColumnSortState,
    setFilter,
    setPage: (pageNr) =>
      dispatch({
        type: "setCurrentPage",
        payload: { currentPage: pageNr, data },
      }),
    rowsSelectedState: selectAllState,
    selectedRows,
    selectRow: (row) => dispatch({ type: "selectRow", payload: { row } }),
    toggleAllRowSelection: (clearSelection = false) =>
      dispatch({ type: "toggleSelectAll", payload: { clearSelection } }),
  };
};
