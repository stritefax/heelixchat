import { type ReactElement, memo } from "react";
import { type UseQueryResult } from "@tanstack/react-query";
import {
  NoDataMessage,
  ErrorMessage,
  LoadingSpinner,
} from "@heelix-app/design";

type RenderResultsProps<TData> = {
  results: UseQueryResult<TData>;
  isLoading?: boolean;
  success: (data: TData) => ReactElement;
  tableData?: TData;
  hasData?: (data: TData) => boolean;
  error?: ReactElement;
  noData?: ReactElement;
  loading?: ReactElement;
};
export const RenderResults = function <T>({
  results: { isFetching, isFetched, data, isError },
  tableData,
  success,
  isLoading,
  error,
  noData,
  hasData,
  loading,
}: RenderResultsProps<T>): ReactElement {
  if ((!isFetched && isFetching) || isLoading) {
    return loading ? <>{loading}</> : <LoadingSpinner />;
  }
  if (
    !data ||
    (Array.isArray(data) && !data.length) ||
    (hasData && !hasData(data))
  ) {
    return noData ? <>{noData}</> : <NoDataMessage />;
  }
  if (isError) {
    return error ? <>{error}</> : <ErrorMessage />;
  }

  return success(tableData ? tableData : data);
};

const typedMemo: <T>(c: T) => T = memo;
export const MemoizedRenderResults = typedMemo(RenderResults);
