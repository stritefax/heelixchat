import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Box,
  Button,
} from "@chakra-ui/react";
import { Title } from "@heelix-app/design";
import {
  PrivacySettings,
  HistorySettings,
  GeneralSettings,
} from "../../../features";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeCategory,
  setActiveCategory,
}) => {
  const renderSettingsContent = () => {
    switch (activeCategory) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        width="100%"
        maxWidth="800px"
        height="70vh"
        minHeight={"300px"}
        css={`
          @media (max-width: 1024px) {
            max-width: 90%;
          }
        `}
      >
        <ModalHeader>
          <Title type="m">Settings</Title>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex height={"100%"}>
            <Box
              flex="0 0 200px"
              borderRight="1px solid"
              borderColor="gray.200"
              pr={4}
            >
              <Box mb={4}>
                <Button
                  variant={activeCategory === "general" ? "solid" : "ghost"}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => setActiveCategory("general")}
                  width="100%"
                  justifyContent="flex-start"
                >
                  General
                </Button>
              </Box>
              <Box mb={4}>
                <Button
                  variant={activeCategory === "privacy" ? "solid" : "ghost"}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => setActiveCategory("privacy")}
                  width="100%"
                  justifyContent="flex-start"
                >
                  Privacy
                </Button>
              </Box>
              <Box mb={4}>
                <Button
                  variant={activeCategory === "history" ? "solid" : "ghost"}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => setActiveCategory("history")}
                  width="100%"
                  justifyContent="flex-start"
                >
                  History
                </Button>
              </Box>
            </Box>
            <Box flex="1" pl={8} height={"100%"}>
              {renderSettingsContent()}
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
