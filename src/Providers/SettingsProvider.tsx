import {
  createContext,
  useContext,
  type FC,
  type PropsWithChildren,
  useState,
  useEffect,
} from "react";
import { invoke } from "@tauri-apps/api";
import { enable, disable, isEnabled } from "tauri-plugin-autostart-api";
import {
  type SettingDbItem,
  settingDbItemsZod,
} from "./RecordingStateProvider";

export const DEFAULT_SETTINGS: Settings = {
  isDevMode: false,
  useTrelloPoc: false,
  interval: "10",
  autoStart: false,
  apiChoice: "claude",
  apiKeyClaude: "",
  apiKeyOpenAi: "",
};

type Update = {
  (settings: Settings): Promise<void>;
};

type ApiChoice = "claude" | "openai";
export type Settings = {
  isDevMode: boolean;
  interval: string;
  useTrelloPoc: boolean;
  autoStart: boolean;
  apiChoice: ApiChoice;
  apiKeyClaude: string;
  apiKeyOpenAi: string;
};

type SettingsContextType = {
  settings: Settings;
  update: Update;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const getSettingOrEmpty = (
    settings: SettingDbItem[],
    settingKey: string
  ): string => {
    const filtered = settings
      .filter((setting) => setting.setting_key == settingKey)
      .map((setting) => setting.setting_value);
    if (filtered != null && filtered.length > 0) {
      return filtered[0];
    }
    return "";
  };

  const buildSettings = (response: SettingDbItem[]): Settings => {
    console.log(getSettingOrEmpty(response, "interval"));
    return {
      interval: getSettingOrEmpty(response, "interval") || "20",
      useTrelloPoc: getSettingOrEmpty(response, "useTrelloPoc") == "true",
      isDevMode: getSettingOrEmpty(response, "isDevMode") == "true",
      autoStart: getSettingOrEmpty(response, "autoStart") == "true",
      apiChoice:
        (getSettingOrEmpty(response, "apiChoice") as ApiChoice) || "claude",
      apiKeyClaude: getSettingOrEmpty(response, "apiKeyClaude") || "",
      apiKeyOpenAi: getSettingOrEmpty(response, "apiKeyOpenAi") || "",
    };
  };

  useEffect(() => {
    invoke("get_latest_settings").then(async (response) => {
      const parsed = settingDbItemsZod.safeParse(response);
      if (parsed.success) {
        const builtSettings = buildSettings(parsed.data);
        const autoStartEnabled = await isEnabled();
        setSettings({
          ...builtSettings,
          autoStart: autoStartEnabled,
        });
      } else {
        console.error("invoke get_latest_settings Error:", parsed.error);
      }
    });
  }, []);

  const update: Update = async (newSettings) => {
    if (newSettings.autoStart !== settings.autoStart) {
      if (newSettings.autoStart) {
        await enable();
      } else {
        await disable();
      }
    }
    updateSettingsOnRust(newSettings);
    setSettings(newSettings);
    return Promise.resolve();
  };

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
};

const updateSettingsOnRust = (settings: Settings) => {
  invoke("update_settings", { settings }).then();
};

export const useGlobalSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw Error("SettingsContext must be used within a SettingsProvider");
  }
  return context;
};
