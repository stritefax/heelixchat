import styled from "styled-components";
import { type FC } from "react";
import { Tooltip } from "@chakra-ui/react";
import chrome from "../../icons/apps/chrome.svg";
import heelix from "../../icons/apps/heelix.png";
import vscode from "../../icons/apps/vscode.svg";
import spotify from "../../icons/apps/spotify.svg";
import slack from "../../icons/apps/slack.svg";
import docker from "../../icons/apps/docker.svg";
import insomnia from "../../icons/apps/insomnia.svg";
import postman from "../../icons/apps/postman.svg";
import safari from "../../icons/apps/safari.svg";
import teams from "../../icons/apps/teams.svg";
import telegram from "../../icons/apps/telegram.svg";
import pycharm from "../../icons/apps/pycharm.svg";
import webstorm from "../../icons/apps/webstorm.svg";
import intellij from "../../icons/apps/intellij.svg";
import msOutlook from "../../icons/apps/ms-outlook.svg";
import excel from "../../icons/apps/excel.svg";
import powerpoint from "../../icons/apps/powerpoint.svg";
import word from "../../icons/apps/word.svg";
import defaultApp from "../../icons/apps/default.svg";
import { type AppName } from "./appConfig";

const Image = styled.img`
  width: 32px;
`;

type AppIcon = {
  name: AppName;
  windowName?: string;
};
export const AppIcon: FC<AppIcon> = ({ name, windowName }) => {
  const getAppSvg = () => {
    switch (name) {
      case "chrome":
        return chrome;
      case "docker":
        return docker;
      case "heelix":
        return heelix;
      case "insomnia":
        return insomnia;
      case "intellij":
        return intellij;
      case "ms-excel":
        return excel;
      case "ms-outlook":
        return msOutlook;
      case "ms-power":
        return powerpoint;
      case "ms-word":
        return word;
      case "postman":
        return postman;
      case "pycharm":
        return pycharm;
      case "safari":
        return safari;
      case "slack":
        return slack;
      case "spotify":
        return spotify;
      case "teams":
        return teams;
      case "telegram":
        return telegram;
      case "vscode":
        return vscode;
      case "webstorm":
        return webstorm;
      default:
        return defaultApp;
    }
  };
  return (
    <Tooltip label={windowName || name}>
      <Image src={getAppSvg()} alt={name} />
    </Tooltip>
  );
};
