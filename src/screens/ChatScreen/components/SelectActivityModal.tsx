import  { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Checkbox,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import styled from "styled-components";
import { invoke } from "@tauri-apps/api/tauri";

type SelectActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedActivities: Array<{ id: number; text: string }>) => void;
};

const ScrollableContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--default-border-color);
  border-radius: var(--border-radius-m);
`;

const TruncatedText = styled(Text)`
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const SelectActivityModal: FC<SelectActivityModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [activities, setActivities] = useState<Array<[number, string, string]>>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const result = await invoke<Array<[number, string, string]>>(
        "get_activity_history",
        {
          offset,
          limit: 50,
        }
      );
      if (result.length > 0) {
        setActivities((prevActivities) => [...prevActivities, ...result]);
        setOffset((prevOffset) => prevOffset + result.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedActivities(new Set());
    } else {
      setActivities([]);
      setOffset(0);
      setHasMore(true);
    }
  }, [isOpen]);

  const handleToggleSelect = (activityId: number) => {
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleAddSelected = async () => {
    const selectedActivityData = await Promise.all(
      Array.from(selectedActivities).map(async (id) => {
        const text = await invoke<string>("get_activity_full_text_by_id", {
          id,
        });
        return { id, text };
      })
    );
    onSelect(selectedActivityData);
    onClose();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight && !isLoading && hasMore) {
      fetchActivities();
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedActivities(new Set());
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add content to Heelix</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <ScrollableContainer onScroll={handleScroll}>
            <Table variant="simple">
              <Thead
                position="sticky"
                top={0}
                backgroundColor="white"
                zIndex={1}
              >
                <Tr>
                  <Th>Select</Th>
                  <Th>Window Title</Th>
                  <Th>Date of Entry</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activities.map(([id, windowTitle, dateOfEntry]) => (
                  <Tr key={id} height="48px">
                    <Td>
                      <Checkbox
                        isChecked={selectedActivities.has(id)}
                        onChange={() => handleToggleSelect(id)}
                      />
                    </Td>
                    <Td>
                      <TruncatedText>{windowTitle || "N/A"}</TruncatedText>
                    </Td>
                    <Td>{formatDate(dateOfEntry)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {isLoading && (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="md"
                mt={4}
              />
            )}
          </ScrollableContainer>
          <Flex justifyContent="space-between" mt={4}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleAddSelected}
              colorScheme="blue"
              isDisabled={selectedActivities.size === 0}
            >
              Add Selected ({selectedActivities.size})
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};