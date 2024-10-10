import { FC } from "react";
import { Button } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { PlayIcon, SquareIcon } from "@heelix-app/design";

const variants = {
  start: { backgroundColor: "var(--danger-color)" },
  stop: { backgroundColor: "var(--primary-color)" },
};

type PlayStopButtonrops = {
  onClick: () => void;
  isRecording: boolean;
};
export const PlayStopButton: FC<PlayStopButtonrops> = ({
  onClick,
  isRecording,
}) => {
  return (
    <Button
      as={motion.button}
      w={"44px"}
      h="44px"
      backgroundColor={"var(--primary-color)"}
      borderRadius={"50%"}
      animate={isRecording ? "start" : "stop"}
      variants={variants}
      onClick={() => onClick()}
    >
      {isRecording ? <SquareIcon /> : <PlayIcon w="28px" h="28px" />}
    </Button>
  );
};
