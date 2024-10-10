import { atom, useAtom } from "jotai";

type SettingsState = {
  AI_API_KEY: string;
};

const settingsAtom = atom<SettingsState>({
  AI_API_KEY: "",
});

export const useSettings = () => {
  const [settingsState, setSettingsState] = useAtom(settingsAtom);

  const setApiKey = (key: string) => {
    setSettingsState((prevState) => {
      return {
        ...prevState,
        AI_API_KEY: key,
      };
    });
    //TODO: Send key to tauri
  };

  return { settingsState, setSettingsState, setApiKey };
};
