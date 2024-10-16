import { type FC, useRef, useEffect } from "react";
import { Box, IconButton, List, ListItem, Flex } from "@chakra-ui/react";
import { Text } from "@heelix-app/design";
import styled from "styled-components";
import { IconTrash } from "@tabler/icons-react";
import type { Chat } from "../types";

type ChatHistoryListProps = {
  chatHistory: Chat[];
  selectChatId: (id: number | undefined) => void;
  selectedChatId: number | undefined;
  deleteChat: (id: number) => void;
};
export const ChatHistoryList: FC<ChatHistoryListProps> = ({
  chatHistory,
  selectChatId,
  selectedChatId,
  deleteChat,
}) => {
  const selectedChatRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (selectedChatRef.current?.scrollIntoView) {
      selectedChatRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedChatRef]);

  return (
    <List zIndex={101}>
      {chatHistory.map((chat) => {
        const itemProps =
          selectedChatId === chat.id
            ? { backgroundColor: "gray.100", ref: selectedChatRef }
            : { backgroundColor: "white" };
        return (
          <ListItem
            key={chat.id}
            cursor="pointer"
            onClick={() => selectChatId(chat.id)}
            padding="var(--space-default)"
            borderRadius="md"
            marginBottom={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            {...itemProps}
          >
            <Flex alignItems="flex-start" flexGrow={1} paddingRight={4}>
              <Box
                width="200px"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                <Text type="m" bold>
                  {chat.name}
                </Text>
                <Text type="s">
                  {new Date(chat.updated_at).toLocaleString()}
                </Text>
              </Box>
            </Flex>
            <IconButton
              aria-label="Delete Chat"
              icon={<IconTrash size={20} />}
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
              variant="ghost"
              size="sm"
              width={10}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
