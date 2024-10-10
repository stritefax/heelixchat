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
    await update({ ...settings, autoStart: isChecked });
  };

  const handleApiChoiceChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const apiChoice = event.target.value;
    await update({ ...settings, apiChoice });
  };

  const handleApiKeyChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const apiKey = event.target.value;
    await update({ ...settings, apiKey });
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
              isChecked={settings.autoStart}
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
                value={settings.apiChoice}
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
              <Input value={settings.apiKey} onChange={handleApiKeyChange} />
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
