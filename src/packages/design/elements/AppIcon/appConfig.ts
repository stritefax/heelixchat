const appNamesConst = [
  "chrome",
  "default",
  "docker",
  "heelix",
  "heelixchat",
  "insomnia",
  "intellij",
  "ms-excel",
  "ms-outlook",
  "ms-power",
  "ms-word",
  "postman",
  "pycharm",
  "safari",
  "slack",
  "spotify",
  "teams",
  "telegram",
  "vscode",
  "webstorm",
] as const;

export type AppName = (typeof appNamesConst)[number];
type AppConfig = {
  keys: string[];
  name: AppName;
}[];
const appNamesConfig = [
  {
    keys: ["google chrome", "chrome"],
    name: "chrome",
  },
  {
    keys: ["Heelix", "heelix"],
    name: "heelix",
  },
  {
    keys: ["Heelix chat", "heelix chat"],
    name: "heelixchat",
  },
  {
    keys: ["Telegram"],
    name: "telegram",
  },
  {
    keys: ["Spotify"],
    name: "spotify",
  },
  {
    keys: ["Slack"],
    name: "slack",
  },
  {
    keys: ["Docker"],
    name: "docker",
  },
  {
    keys: ["Code"],
    name: "vscode",
  },
  {
    keys: ["Insomnia"],
    name: "insomnia",
  },
  {
    keys: ["Postman"],
    name: "postman",
  },
  {
    keys: ["Safari"],
    name: "safari",
  },
  {
    keys: ["Microsoft Teams"],
    name: "teams",
  },
  {
    keys: ["PyCharm"],
    name: "pycharm",
  },
  {
    keys: ["WebStorm"],
    name: "webstorm",
  },
  {
    keys: ["IntelliJ", "IntelliJ IDEA"],
    name: "intellij",
  },
  {
    keys: ["Microsoft Outlook"],
    name: "ms-outlook",
  },
  {
    keys: ["Microsoft Excel"],
    name: "ms-excel",
  },
  {
    keys: ["Microsoft Word"],
    name: "ms-word",
  },
  {
    keys: ["Microsoft PowerPoint"],
    name: "ms-power",
  },
] satisfies AppConfig;

export const getNameFromWindow = (windowName?: string) => {
  if (windowName) {
    const appConfig = appNamesConfig.find((config) =>
      config.keys
        .map((key) => key.toLowerCase())
        .includes(windowName.toLowerCase())
    );
    if (appConfig) {
      return appConfig.name;
    }
  }
  return "default";
};
