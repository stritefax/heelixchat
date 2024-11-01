import { Text, Tooltip, Box } from "@chakra-ui/react";
export const DocumentFootnote = ({
  windowTitles,
}: {
  windowTitles: string[];
}) => {
  return (
    <Box display="inline" ml={1}>
      {windowTitles.map((title, index) => (
        <Tooltip key={index} label={title}>
          <Text as="sup" fontSize="xs" color="blue.500" cursor="pointer">
            {index + 1}
            {index < windowTitles.length - 1 && ","}
          </Text>
        </Tooltip>
      ))}
    </Box>
  );
};
