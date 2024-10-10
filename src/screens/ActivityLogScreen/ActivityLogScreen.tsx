import { type FC, useEffect } from "react";
import { Flex, Text, Image, Box } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import icon from "../../assets/icon.png";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { useRecordingState } from "../../Providers/RecordingStateProvider";
import {
  type ActivityLogItem,
  buildActivityLogFromResponse,
} from "../../Providers/RecordingStateProvider";

export const ActivityLogScreen: FC = () => {
  const { activityLog, setActivityLog } = useRecordingState();

  const columnHelper = createColumnHelper<ActivityLogItem>();
  const columns = [
    columnHelper.accessor("timestamp", {
      // cell: (info: any) => formatDate(info.getValue()),
      cell: (info: any) => info.getValue(),
      header: "Timestamp",
    }),

    columnHelper.accessor("window_app_name", {
      cell: (info: any) => info.getValue(),
      header: "Active Window App Name",
    }),
    columnHelper.accessor("window_title", {
      cell: (info: any) => info.getValue(),
      header: "Active Window Title",
    }),
  ];

  useEffect(() => {
    invoke("refresh_activity_log", { action: "refresh_activity_log" }).then(
      (response) => {
        let activityLog = buildActivityLogFromResponse(response);
        setActivityLog(activityLog);
      }
    );
  }, []);

  return (
    <Box textAlign={"center"} style={{ height: "100%" }}>
      <Flex
        background="white"
        alignItems="center"
        flexDirection="column"
        padding={5}
      >
        <Image src={icon} alt="logo" />
        <Text fontWeight="bold" marginTop="15" fontSize="20">
          Desktop Agent
        </Text>

        <Flex>
          <DataTable columns={columns} data={activityLog} />
        </Flex>
      </Flex>
    </Box>
  );
};
