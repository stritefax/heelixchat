import {
  Box,
  Flex,
  Text,
  Switch,
  Select,
  VStack,
  Input,
} from "@chakra-ui/react";
import { useGlobalSettings } from "../Providers/SettingsProvider";

export const GeneralSettings = () => {
  const { settings, update } = useGlobalSettings();

  const handleAutoStartChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    await update({ ...settings, auto_start: isChecked });
  };

  type ApiChoice = "claude" | "openai";
  const handleApiChoiceChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const api_choice = event.target.value as ApiChoice;
    await update({ ...settings, api_choice });
  };

  const onChangeApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (settings.api_choice === "claude") {
      update({ ...settings, api_key_claude: event.target.value });
    }
    if (settings.api_choice === "openai") {
      update({ ...settings, api_key_open_ai: event.target.value });
    }
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box>
          <Flex alignItems="center" mb={2}>
            <Text fontSize="md" mr={4}>
              Autostart Heelix:
            </Text>
            <Switch
              size="md"
              isChecked={settings.auto_start}
              onChange={handleAutoStartChange}
            />
          </Flex>
          <Text fontSize="sm" color="gray.500">
            Enable this option to automatically start the application on system
            startup.
          </Text>
        </Box>

        <Box>
          <Flex alignItems="center" mb={2}>
            <Flex flex={1}>
              <Text fontSize="md" mr={4}>
                API Choice:
              </Text>
            </Flex>
            <Flex flex={2}>
              <Select
                size="md"
                value={settings.api_choice}
                onChange={handleApiChoiceChange}
              >
                <option value="claude">Claude</option>
                <option value="openai">OpenAI</option>
              </Select>
            </Flex>
          </Flex>
          <Flex alignItems="center" mb={2}>
            <Flex flex={1}>
              <Text fontSize="md" mr={4}>
                API Key:
              </Text>
            </Flex>
            <Flex flex={2}>
              <Input
                value={
                  settings.api_choice === "claude"
                    ? settings.api_key_claude
                    : settings.api_key_open_ai
                }
                onChange={onChangeApiKey}
              />
            </Flex>
          </Flex>
          <Text fontSize="sm" color="gray.500">
            Select the API to use for natural language processing tasks.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
