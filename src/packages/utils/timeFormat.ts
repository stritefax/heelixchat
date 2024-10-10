import dayjs from "dayjs";
export const formatSecondsToHourMinute = (durationSeconds: number) => {
  if (durationSeconds >= 60 * 60) {
    return dayjs.duration(durationSeconds * 1000).format("H[h] m[min]");
  }
  return dayjs.duration(durationSeconds * 1000).format("m[min]");
};
