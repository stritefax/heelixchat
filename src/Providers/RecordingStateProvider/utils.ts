import type { ActivityLogItem } from "./types";
export const buildActivityLogFromResponse = (response: unknown) => {
  let activityLog: ActivityLogItem[] = [];
  let responseArray = response as [];
  responseArray.forEach((item) => {
    let itemAsActivityLog = item as ActivityLogItem;
    activityLog.push({
      timestamp: itemAsActivityLog.timestamp,
      window_app_name: itemAsActivityLog.window_app_name,
      window_title: itemAsActivityLog.window_title,
    });
  });

  return activityLog;
};
