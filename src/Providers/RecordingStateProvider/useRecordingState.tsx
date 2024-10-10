import { useContext } from "react";
import { RecordingStateContext } from "./RecordingStateContext";
export const useRecordingState = () => {
  const context = useContext(RecordingStateContext);
  if (context === undefined) {
    console.error(
      "RecordingStateContext must be used within a RecordingStateProvider"
    );
  }
  return context;
};
