import { type FC, useState, useEffect, useRef, useMemo, Fragment } from "react";
import { type } from "@tauri-apps/api/os";
import {
  Flex,
  Text as ChakraText,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image,
  useDisclosure,
  Tooltip,
  Box,
  IconButton,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { Text, Title, NavButton } from "@heelix-app/design";
import logoBlack from "@heelix-app/design/logo/logo-black.png";
import styled from "styled-components";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import type { StoredMessage, Chat } from "./types";
import { debounce } from "lodash";
import { FileText, X } from "lucide-react";
import {
  UserMessage,
  AssistantMessage,
  ChatHeader,
  ChatInput,
  ChatHistoryList,
  SettingsModal,
  SelectActivityModal,
} from "./components";
import { PrivacySettings } from "../../widgets";
import { HistorySettings } from "../../widgets";
import { GeneralSettings } from "../../widgets";
import { useGlobalSettings } from "../../Providers/SettingsProvider";

const ScreenContainer = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  overflow-y: auto;
  background: var(--card-content-background);
  flex-direction: column;
  position: relative;
  font-weight: normal;
`;

const NewConversationContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-l);
  justify-content: center;
`;

const ReponsiveContainer = styled.div`
  display: grid;
  grid-template-areas: "chat";
  grid-template-columns: 1fr;
  width: 100%;
  height: 100%;
  padding-top: 56px;
  overflow: hidden;

  @media (min-width: 1024px) {
    grid-template-areas: "history chat";
    grid-template-columns: auto 1fr;
  }
`;

const HistoryContainer = styled.div`
  display: none;
  flex-direction: column;
  grid-area: history;
  height: 100%;
  width: 270px;
  overflow-y: auto;
  transition: width 0.5s ease-in-out;

  &.hidden {
    width: 0px;
  }

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const ChatContainer = styled.div`
  display: flex;
  grid-area: chat;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const MessagesScrollContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  justify-content: center;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 8px;
  }
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--breakpoint-medium);
  flex: 1;
  padding: var(--space-l) var(--space-l) 0 var(--space-l);
  gap: var(--space-xl);
  overflow-anchor: none;
`;

const DocumentFootnote = ({ windowTitles }: { windowTitles: string[] }) => {
  return (
    <Box display="inline" ml={1}>
      {windowTitles.map((title, index) => (
        <Tooltip key={index} label={title}>
          <ChakraText as="sup" fontSize="xs" color="blue.500" cursor="pointer">
            {index + 1}
            {index < windowTitles.length - 1 && ","}
          </ChakraText>
        </Tooltip>
      ))}
    </Box>
  );
};

const ActivityIcon = styled.div`
  width: 40px;
  height: 50px;
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const ActivityPreview = styled.div`
  width: 180px;
  height: 50px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
`;

export const ChatScreen: FC = () => {
  const [userInput, setUserInput] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number>();
  const [dialogue, setDialogue] = useState<StoredMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [windowTitles, setWindowTitles] = useState<string[]>([]);
  const [isLoadingExistingChat, setIsLoadingExistingChat] = useState(false);
  const [dailyOutputTokens, setDailyOutputTokens] = useState(0);
  const [lastResetTimestamp, setLastResetTimestamp] = useState("");
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);
  const [selectedActivityTexts, setSelectedActivityTexts] = useState<string[]>(
    []
  );
  const [combinedActivityText, setCombinedActivityText] = useState("");
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleActivityHistoryToggle = () => {
    setIsActivityHistoryOpen(!isActivityHistoryOpen);
  };

  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const [activeSettingsCategory, setActiveSettingsCategory] =
    useState("privacy");
  const { settings } = useGlobalSettings();

  const debouncedScroll = useMemo(
    () =>
      debounce((ref: HTMLDivElement) => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          ref.scrollTo({
            top: ref.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }, 100),
    []
  );

  const isNewDay = (lastCheckedDate: Date): boolean => {
    const currentDate = new Date();
    return currentDate.toDateString() !== lastCheckedDate.toDateString();
  };

  useEffect(() => {
    fetchChats();
    setDialogue([]);

    const unlisten1 = listen("llm_response", (event: any) => {
      // Handle the llm_response event
      // ...
    });

    const unlisten2 = listen("output_tokens", (event: any) => {
      setDailyOutputTokens((prevTokens) => {
        const updatedTokens = prevTokens + event.payload;
        saveTokenData(updatedTokens);
        return updatedTokens;
      });
    });

    const unlisten3 = listen("window_titles", (event: any) => {
      const windowTitles = JSON.parse(event.payload);
      setWindowTitles(windowTitles);
    });

    retrieveTokenData();
    resetDailyOutputTokens();

    return () => {
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
      unlisten3.then((f) => f());
    };
  }, []);

  const renderSettingsContent = () => {
    switch (activeSettingsCategory) {
      case "general":
        return <GeneralSettings />;
      case "privacy":
        return <PrivacySettings />;
      case "history":
        return <HistorySettings />;

      default:
        return null;
    }
  };

  const fetchChats = async () => {
    try {
      messageRef.current = null;
      const allChats = await invoke<Chat[]>("get_all_chats");
      setChats(allChats);
      if (
        selectedChatId &&
        !allChats.some((chat) => chat.id === selectedChatId)
      ) {
        setSelectedChatId(undefined);
        setDialogue([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      setIsLoadingExistingChat(true);
      const messages = await invoke<StoredMessage[]>(
        "get_messages_by_chat_id",
        { chatId }
      );
      setDialogue(messages);
      setIsFirstMessage(messages.length === 0);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingExistingChat(false);
    }
  };

  const handleActivitySelect = (
    selectedActivities: Array<{ id: number; text: string }>
  ) => {
    const newTexts = selectedActivities.map((activity) => activity.text);
    setSelectedActivityTexts((prevTexts) => {
      const updatedTexts = [...prevTexts, ...newTexts];
      // Combine all texts into a single string
      const combined = updatedTexts.join("\n\n");

      setCombinedActivityText(combined);
      return updatedTexts;
    });
    setIsActivityHistoryOpen(false);
  };

  const handleRemoveActivity = (index: number) => {
    setSelectedActivityTexts((prevTexts) => {
      const updatedTexts = prevTexts.filter((_, i) => i !== index);
      // Recombine the remaining texts
      const combined = updatedTexts.join("\n\n");
      setCombinedActivityText(combined);
      return updatedTexts;
    });
  };

  useEffect(() => {
    if (selectedChatId) {
      setDialogue([]);
      fetchMessages(selectedChatId);
    } else {
      setDialogue([]);
    }
  }, [selectedChatId]);

  const generateName = async (chatId: number, userInput: string) => {
    try {
      const name = await invoke<string>("name_conversation", { userInput });
      await invoke<boolean>("update_chat_name", { chatId, name });
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? { ...chat, name } : chat))
      );
    } catch (error) {
      console.error("Error generating conversation name:", error);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, name: "Unnamed Chat" } : chat
        )
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getChatId = async (): Promise<number> => {
    if (selectedChatId) {
      return selectedChatId;
    }
    try {
      const chatId = await invoke<number>("create_chat", { name: "New Chat" });
      console.log("New chat created with ID:", chatId);
      const currentTime = new Date().toISOString();
      generateName(chatId, userInput);
      setChats([
        {
          id: chatId,
          name: "New Chat",
          created_at: currentTime,
          updated_at: currentTime,
        },
        ...chats,
      ]);
      return chatId;
    } catch (error) {
      console.error("Error creating new chat:", error);
      throw new Error("Error creating new chat");
    }
  };

  const sendPromptToLlm = async (chatId: number, isFirstMessage: boolean) => {
    try {
      const currentDate = new Date();
      const lastResetDate = new Date(lastResetTimestamp);

      if (
        currentDate.getDate() !== lastResetDate.getDate() ||
        currentDate.getMonth() !== lastResetDate.getMonth() ||
        currentDate.getFullYear() !== lastResetDate.getFullYear()
      ) {
        // It's a new day, reset the tokens
        setDailyOutputTokens(0);
        setLastResetTimestamp(currentDate.toISOString());
        saveTokenData(0);
      }

      const conversationHistory = dialogue.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const userMessage = {
        role: "user",
        content: userInput,
      };

      const fullConversation = [...conversationHistory, userMessage];

      console.log("Sending conversation history to LLM:", fullConversation);

      const estimatedTokens = 1000; // Adjust this value based on your estimation
      if (dailyOutputTokens + estimatedTokens > 130000) {
        setDialogue((prevDialogue) => [
          ...prevDialogue,
          {
            id: Date.now(),
            chat_id: chatId,
            role: "assistant",
            content:
              "You have reached your daily token limit. The limit resets at 12am.",
            created_at: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        setIsGenerating(false);
        return;
      }
      console.log("Sending combinedActivityText to LLM:", combinedActivityText);

      if (settings.api_choice === "openai") {
        await invoke("send_prompt_to_openai", {
          conversationHistory: fullConversation,
          isFirstMessage,
          combinedActivityText, // Add this line
        });
      } else {
        await invoke("send_prompt_to_llm", {
          conversationHistory: fullConversation,
          isFirstMessage,
          combinedActivityText, // Add this line
        });
      }

      console.log("Conversation history sent to LLM");

      await invoke("create_message", {
        chatId,
        role: "user",
        content: userInput,
      });

      setSelectedActivityTexts([]);
      setCombinedActivityText("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Error from Claude API:", errorMessage);
      setDialogue((prevDialogue) => [
        ...prevDialogue,
        {
          id: Date.now(),
          chat_id: chatId,
          role: "assistant",
          content: errorMessage,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setFirstTokenReceived(false);

    try {
      let chatId: number;
      if (dialogue.length > 0) {
        chatId = dialogue[dialogue.length - 1].chat_id;
      } else {
        chatId = await getChatId();
      }
      setDialogue((prevDialogue) => [
        ...prevDialogue,
        {
          id: Date.now(),
          chat_id: chatId,
          role: "user",
          content: userInput,
          created_at: new Date().toISOString(),
        },
      ]);
      setUserInput("");
      setWindowTitles([]);

      let assistantMessage = "";

      const unlisten = await listen("llm_response", (event: any) => {
        console.log("Received llm_response event:", event);

        assistantMessage = event.payload as string;

        if (!firstTokenReceived) {
          setFirstTokenReceived(true);
        }

        setDialogue((prevDialogue) => {
          const lastMessage = prevDialogue[prevDialogue.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            return prevDialogue.map((message, index) =>
              index === prevDialogue.length - 1
                ? { ...message, content: assistantMessage }
                : message
            );
          } else {
            const newMessage = {
              id: Date.now(),
              chat_id: chatId,
              role: "assistant" as "assistant",
              content: assistantMessage,
              created_at: new Date().toISOString(),
            };
            return [...prevDialogue, newMessage];
          }
        });
      });

      await sendPromptToLlm(chatId, isFirstMessage);
      setIsFirstMessage(false);

      unlisten();
      setUserInput("");
      setIsLoading(false);
      setIsGenerating(false);
      await invoke("create_message", {
        chatId,
        role: "assistant",
        content: assistantMessage,
      });
    } catch (error) {
      console.error("ChatScreen: handleSubmit has failed");
      return;
    }
  };

  const handleChatHistoryToggle = () => {
    setIsChatHistoryOpen(!isChatHistoryOpen);
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await invoke("delete_chat", { chatId });
      setChats(chats.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(undefined);
        setDialogue([]);
        setIsFirstMessage(true);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };
  const isMacOS = useRef<boolean | null>(null);
  const osCheckComplete = useRef<boolean>(false);

  useEffect(() => {
    const checkOSTypeAndScroll = async () => {
      if (!osCheckComplete.current) {
        const osType = await type();
        isMacOS.current = osType === "Darwin";
        osCheckComplete.current = true;
      }

      if (messageContainerRef.current && isGenerating) {
        if (isMacOS.current) {
          messageContainerRef.current.scrollTo(
            0,
            messageContainerRef.current.scrollHeight
          );
        } else {
          debouncedScroll(messageContainerRef.current);
        }
      } else if (messageRef.current) {
        messageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    };

    checkOSTypeAndScroll();
  }, [messageRef, dialogue, isGenerating, debouncedScroll]);

  const saveTokenData = (tokens: number) => {
    localStorage.setItem("dailyOutputTokens", tokens.toString());
    localStorage.setItem("lastResetTimestamp", new Date().toISOString());
  };

  const retrieveTokenData = () => {
    const storedTokens = localStorage.getItem("dailyOutputTokens");
    const storedTimestamp = localStorage.getItem("lastResetTimestamp");

    if (storedTokens && storedTimestamp) {
      const lastResetDate = new Date(storedTimestamp);
      const currentDate = new Date();

      if (
        lastResetDate.getDate() === currentDate.getDate() &&
        lastResetDate.getMonth() === currentDate.getMonth() &&
        lastResetDate.getFullYear() === currentDate.getFullYear()
      ) {
        setDailyOutputTokens(parseInt(storedTokens, 10));
        setLastResetTimestamp(storedTimestamp);
      } else {
        setDailyOutputTokens(0);
        setLastResetTimestamp(currentDate.toISOString());
        saveTokenData(0);
      }
    } else {
      setDailyOutputTokens(0);
      setLastResetTimestamp(new Date().toISOString());
      saveTokenData(0);
    }
  };

  const resetDailyOutputTokens = () => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    );
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      setDailyOutputTokens(0);
      setLastResetTimestamp(midnight.toISOString());
      saveTokenData(0);
    }, timeUntilMidnight);
  };

  return (
    <ScreenContainer>
      <ChatHeader
        profileMenu={
          <>
            <NavButton onClick={onSettingsOpen}>Settings</NavButton>
          </>
        }
        onClickNewChat={() => {
          setSelectedChatId(undefined);
          setDialogue([]);
          setIsFirstMessage(true);
          setIsGenerating(false);
          setFirstTokenReceived(false);
          setSelectedActivityTexts([]);
        }}
        toggleChatHistory={handleChatHistoryToggle}
        toggleHistory={toggleHistory}
      />
      <ReponsiveContainer>
        <HistoryContainer className={isHistoryOpen ? "" : "hidden"}>
          <ChatHistoryList
            chatHistory={chats}
            selectedChatId={selectedChatId}
            deleteChat={handleDeleteChat}
            selectChatId={(chatId) => {
              setSelectedChatId(chatId);
              setIsChatHistoryOpen(false);
              setSelectedActivityTexts([]);
            }}
          />
        </HistoryContainer>
        <ChatContainer>
          {dialogue.length === 0 && !isLoadingExistingChat ? (
            <NewConversationContainer>
              <Image width="40px" height="40px" src={logoBlack} />
              <Text type="m" bold>
                What can I help you with?
              </Text>
            </NewConversationContainer>
          ) : (
            <MessagesScrollContainer ref={messageContainerRef}>
              <MessagesContainer>
                {dialogue.map((message, index) => {
                  const messageProps =
                    index === dialogue.length - 1
                      ? {
                          ref: messageRef,
                        }
                      : {};
                  return (
                    <Fragment key={message.id}>
                      {message.role === "user" && (
                        <UserMessage
                          key={message.id}
                          message={message}
                          name={"You"}
                          {...messageProps}
                        />
                      )}
                      {message.role === "assistant" && (
                        <>
                          <AssistantMessage
                            key={message.id}
                            message={message}
                            isGenerating={isGenerating}
                            {...messageProps}
                          />
                          {index === 1 && windowTitles.length > 0 && (
                            <DocumentFootnote windowTitles={windowTitles} />
                          )}
                        </>
                      )}
                    </Fragment>
                  );
                })}
                {!firstTokenReceived && isGenerating && (
                  <Flex justify="center" mt={2}>
                    <Text type="s">Assistant is typing...</Text>
                  </Flex>
                )}
                {isGenerating && (
                  <Flex justify="center" mt={2}>
                    <Spinner />
                  </Flex>
                )}
              </MessagesContainer>
              {isLoadingExistingChat && (
                <Flex justify="center" mt={2}>
                  <Spinner />
                </Flex>
              )}
            </MessagesScrollContainer>
          )}
          {selectedActivityTexts.length > 0 && (
            <Box mt={4} p={4} maxWidth="var(--breakpoint-medium)" mx="auto">
              <Wrap spacing={4}>
                {selectedActivityTexts.map((text, index) => (
                  <WrapItem key={index}>
                    <Flex>
                      <ActivityIcon>
                        <FileText size={24} />
                        <IconButton
                          icon={<X size={16} />}
                          size="xs"
                          aria-label="Remove activity"
                          position="absolute"
                          top="-8px"
                          right="-8px"
                          borderRadius="full"
                          onClick={() => handleRemoveActivity(index)}
                        />
                      </ActivityIcon>
                      <ActivityPreview>
                        {text.length > 50
                          ? `${text.substring(0, 50)}...`
                          : text}
                      </ActivityPreview>
                    </Flex>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}
          <ChatInput
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onSubmit={handleSubmit}
            onActivityHistoryToggle={handleActivityHistoryToggle}
            isGenerating={isGenerating}
            isLoading={isLoading}
          />
        </ChatContainer>
      </ReponsiveContainer>
      <Drawer
        isOpen={isChatHistoryOpen}
        placement="left"
        onClose={handleChatHistoryToggle}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Title type="m">Chat History</Title>
          </DrawerHeader>
          <DrawerBody>
            <ChatHistoryList
              chatHistory={chats}
              selectedChatId={selectedChatId}
              deleteChat={handleDeleteChat}
              selectChatId={(chatId) => {
                setSelectedChatId(chatId);
                setIsChatHistoryOpen(false);
                setSelectedActivityTexts([]);
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onSettingsClose}
        activeCategory={activeSettingsCategory}
        setActiveCategory={setActiveSettingsCategory}
      />
      <SelectActivityModal
        isOpen={isActivityHistoryOpen}
        onClose={handleActivityHistoryToggle}
        onSelect={handleActivitySelect}
      />
    </ScreenContainer>
  );
};
