import { z } from "zod";

export const activityLogItemZod = z.object({
  timestamp: z.string(),
  ocr_text: z.string().optional(),
  window_app_name: z.string(),
  window_title: z.string(),
});
export type ActivityLogItem = z.infer<typeof activityLogItemZod>;

export const settingDbItemZod = z.object({
  setting_key: z.string(),
  setting_value: z.string(),
});
export const settingDbItemsZod = settingDbItemZod.array();
export type SettingDbItem = z.infer<typeof settingDbItemZod>;
