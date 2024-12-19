import { invoke } from "@tauri-apps/api/tauri";
import { z } from "zod";

const activityResultZod = z.array(
  z.tuple([z.number(), z.string(), z.string()])
);
export type ActivityResult = z.infer<typeof activityResultZod>;

export type Activity = {
  id: number;
  title: string;
  date: string;
};

const mapResultToActivity = (items: ActivityResult): Activity[] =>
  items.map((item) => {
    const id = item[0] ? item[0] : 0;
    const title = item[1] ? item[1] : "";
    const date = item[2] ? item[2] : "";
    return {
      id,
      title,
      date,
    };
  });

type fetchActivities = {
  (offset: number, limit?: number): Promise<Activity[]>;
};
export const fetchActivities: fetchActivities = async (
  offset,
  limit = 50
): Promise<Activity[]> => {
  const result = await invoke<ActivityResult>("get_activity_history", {
    offset,
    limit,
  });
  const parsed = activityResultZod.safeParse(result);
  if (parsed.error) {
    // TODO: Log errors remotely
    console.error(`${fetchActivities.name}_error: `, parsed.error);
    return mapResultToActivity(result as unknown as ActivityResult);
  }
  return mapResultToActivity(parsed.data);
};

export const deleteActivity = async (id: number) => {
  try {
    const deleted = await invoke<boolean>("delete_activity", { id });
    return !!deleted;
  } catch (error) {
    console.error("Error deleting activity:", error);
  }
};
