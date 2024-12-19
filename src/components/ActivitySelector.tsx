import { useEffect, useState, type FC } from "react";
import {
  Box,
  Flex,
  Input,
  VStack,
  Text,
  IconButton,
  Heading,
} from "@chakra-ui/react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { type Activity } from "../data/activities";

type ActivitySelectorProps = {
  activities: Activity[];
  selectedActivities: Activity[];
  onSelectedActivitiesUpdated: (activities: Activity[]) => void;
};
export const ActivitySelector: FC<ActivitySelectorProps> = ({
  activities,
  selectedActivities,
  onSelectedActivitiesUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const isSelected = (item: Activity): boolean => {
    const activityIndex = selectedActivities.findIndex(
      (selectedItem) => item.id === selectedItem.id
    );
    return activityIndex >= 0;
  };

  const nonSelectedItems = activities.filter((item) => !isSelected(item));
  // Filter items based on search query
  const filteredItems = nonSelectedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addActivity = (activity: Activity) => {
    onSelectedActivitiesUpdated([...selectedActivities, activity]);
  };
  
  const removeActivity = (activity: Activity) => {
    onSelectedActivitiesUpdated(
      selectedActivities.filter((item) => item.id !== activity.id)
    );
  };

  return (
    <Box
      width="100%"
      p={4}
      border={"1px solid var(--chakra-colors-chakra-border-color)"}
      borderRadius="md"
    >
      <Heading size="md" mb={4}>
        Select activities to add to project
      </Heading>
      <Input
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb={4}
      />
      <VStack align="start" spacing={3} maxHeight={"260px"} overflow={"scroll"}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Flex gap={"8px"} key={item.id}>
              <IconButton
                aria-label="Add row"
                icon={<FaPlus />}
                size="sm"
                onClick={() => addActivity(item)}
              />

              {item.title}
            </Flex>
          ))
        ) : (
          <Text>No items found</Text>
        )}
      </VStack>
      <Box padding={"12px 0 0 0"}>
        <Heading size="s">Selected Items:</Heading>
        <VStack
          align="start"
          mt={4}
          spacing={3}
          maxHeight={"300px"}
          overflow={"scroll"}
        >
          {selectedActivities.map((item) => (
            <Flex gap={"8px"} key={item.id}>
              <IconButton
                aria-label="Add row"
                icon={<FaMinus />}
                size="sm"
                onClick={() => removeActivity(item)}
              />
              {item.title}
            </Flex>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};
