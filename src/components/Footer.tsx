import { FC } from "react";
import { Flex } from "@chakra-ui/react";
import { Text, Title } from "@heelix-app/design";
import { PlayStopButton } from "./PlayStopButton";
import { motion } from "framer-motion";
import { useRecordingState } from "../Providers/RecordingStateProvider";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

const variants = {
  start: { opacity: 1 },
  stop: { opacity: 0 },
};

export const Footer: FC = () => {
  const { isRecording, activityTimeActive, activityTitle, toggleRecording } =
    useRecordingState();

  return (
    <Flex justifyContent={"space-between"} paddingInline={2}>
      <Flex flex={1} p={2} justifyContent="space-between" alignItems={"center"}>
        <Flex
          as={motion.div}
          flex={1}
          flexDirection={"row"}
          justify={"space-between"}
          variants={variants}
        >
          <Flex gap={2}>
            <PlayStopButton
              isRecording={isRecording}
              onClick={toggleRecording}
            />
            <Flex
              as={motion.div}
              flexDirection={"column"}
              variants={variants}
              animate={isRecording ? "start" : "stop"}
              opacity={0}
            >
              <Title type="s">{activityTitle}</Title>
              <Text type="xs">Current task</Text>
            </Flex>
          </Flex>
          <Flex
            as={motion.div}
            flexDirection={"column"}
            alignItems={"flex-end"}
            animate={isRecording ? "start" : "stop"}
            opacity={0}
            variants={variants}
            minWidth={"100px"}
          >
            <Title type="s">
              {dayjs.duration(activityTimeActive * 1000).format("HH:mm:ss")}
            </Title>
            <Text type="xs">Current Session</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};