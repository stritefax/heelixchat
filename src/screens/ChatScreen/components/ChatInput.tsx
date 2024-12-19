import {
  type FC,
  type ChangeEvent,
  type KeyboardEvent,
  useRef,
  useEffect,
} from "react";
import {
  Text,
  Textarea,
  Button,
  Flex,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { PaperclipIcon } from "lucide-react";
import { ProjectBadge } from "../../../features/ProjectBadge";

type ChatInputProps = {
  value: string;
  onSubmit: () => void;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onActivityHistoryToggle: () => void;
  isLoading: boolean;
  isGenerating: boolean;
};

export const ChatInput: FC<ChatInputProps> = ({
  value,
  onSubmit,
  onChange,
  onKeyDown,
  onActivityHistoryToggle,
  isLoading,
  isGenerating,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset to initial height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height =
        scrollHeight > 40 ? `${scrollHeight}px` : "40px";
    }
  };

  useEffect(() => {
    handleInput();
  }, [value]);

  const handleSubmit = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset the height to the initial value
    }
    onSubmit();
  };

  return (
    <Flex
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      flexDirection={"column"}
      alignItems={"flex-start"}
      width="100%"
      gap={"4px"}
      maxWidth="var(--breakpoint-medium)"
      mx="auto"
      p={4}
    >
      <ProjectBadge />
      <Flex alignItems="flex-end" width="100%">
        <Textarea
          value={value}
          ref={textareaRef}
          onChange={(e) => {
            onChange(e);
            handleInput();
          }}
          onKeyDown={onKeyDown}
          placeholder="Type your message here..."
          resize="none"
          rows={1}
          mr={2}
          flex={1}
          disabled={isGenerating}
          height="40px"
          overflow="hidden"
        />
        <Tooltip label="Add content to Heelix prompt" placement="top">
          <IconButton
            icon={<PaperclipIcon size={20} />}
            aria-label="Add content"
            onClick={onActivityHistoryToggle}
            mr={2}
            variant="ghost"
            isRound
          />
        </Tooltip>
        <Button
          type="submit"
          isLoading={isLoading || isGenerating}
          loadingText="Sending"
          isDisabled={isGenerating || !value}
        >
          Send
        </Button>
      </Flex>
    </Flex>
  );
};
