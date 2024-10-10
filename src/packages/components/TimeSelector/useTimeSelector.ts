import { useState } from "react";
import dayjs from "dayjs";
import { type TimeInterval } from "./TimeSelector";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const useTimeSelector = () =>
  useState<TimeInterval>({
    startTime: dayjs().startOf("day"),
    endTime: dayjs().endOf("day"),
  });
