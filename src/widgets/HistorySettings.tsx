import { type FC, useState, useEffect } from "react";
import styled from "styled-components";
import { invoke } from "@tauri-apps/api/tauri";
import { Title, Text } from "@heelix-app/design";
import { Table, Thead, Tbody, Tr, Th, Td, IconButton } from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

const ContentContainer = styled.div`
  display: flex;
  gap: var(--space-s);
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const ActivityHistoryTable = styled(Table)`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: var(--space-s);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    font-weight: bold;
  }
`;

const TitleContainer = styled.div`
  height: 22px;
`;
const HistoryListContainer = styled.div`
  display: flex;
  overflow-y: auto;
`;
type ActivityHistoryListProps = {
  activities: Array<[number, string, string]>;
  onDelete: (id: number) => void;
  onLoadMore: () => void;
  isLoading: boolean;
};

const ActivityHistoryList: FC<ActivityHistoryListProps> = ({
  activities,
  onDelete,
  onLoadMore,
  isLoading,
}) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight && !isLoading) {
      onLoadMore();
    }
  };

  return (
    <HistoryListContainer onScroll={handleScroll} style={{ overflowY: "auto" }}>
      <ActivityHistoryTable>
        <Thead>
          <Tr>
            <Th>Window Name</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {activities.map(([id, windowName, timestamp]) => (
            <Tr key={id}>
              <Td>
                {windowName.slice(0, 25) +
                  (windowName.length > 25 ? "..." : "")}
              </Td>
              <Td>{new Date(timestamp).toLocaleDateString()}</Td>
              <Td>
                <IconButton
                  aria-label="Delete"
                  icon={<DeleteIcon />}
                  size="sm"
                  onClick={() => onDelete(id)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </ActivityHistoryTable>
      {isLoading && <Text type={"s"}>Loading...</Text>}
    </HistoryListContainer>
  );
};

export const HistorySettings: FC = () => {
  const [activityList, setActivityList] = useState<
    Array<[number, string, string]>
  >([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivityHistory = async () => {
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
        setActivityList([...activityList, ...result]);
        setOffset(offset + result.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching activity history:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteActivity = async (id: number) => {
    try {
      const deleted = await invoke<boolean>("delete_activity", { id });
      if (deleted) {
        setActivityList(
          activityList.filter(([activityId]) => activityId !== id)
        );
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  useEffect(() => {
    fetchActivityHistory();
  }, []);

  return (
    <ContentContainer>
      <TitleContainer>
        <Title type="s">Activity History</Title>
      </TitleContainer>
      <ActivityHistoryList
        activities={activityList}
        onDelete={handleDeleteActivity}
        onLoadMore={fetchActivityHistory}
        isLoading={isLoading}
      />
    </ContentContainer>
  );
};
