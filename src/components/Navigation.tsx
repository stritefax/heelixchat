import type { FC, PropsWithChildren } from "react";
import { Grid, GridItem, Flex } from "@chakra-ui/react";
import { UserProfile } from "@heelix-app/components";
import { useRecordingState } from "../Providers/RecordingStateProvider";
// import { RecordingIndicator } from "../components";

type NavigationProps = {} & PropsWithChildren;

export const Navigation: FC<NavigationProps> = ({ children }) => {
  const { isRecording } = useRecordingState();

  return (
    <Grid
      height={"100%"}
      templateAreas={`"navheader" "content"`}
      gridTemplateRows={"70px 1fr"}
      color="blackAlpha.700"
      bg="var(--page-background-color)"
      fontWeight="bold"
    >
      <GridItem
        bg="white"
        borderBottom={"1px solid"}
        borderBottomColor={"gray.300"}
        area={"navheader"}
      >
        <Flex justifyContent={"space-between"} align={"center"}>
          <Flex p={2} gap={2} alignItems={"center"}>
            <UserProfile />
            {/* <RecordingIndicator isRecording={isRecording} /> */}
          </Flex>
        </Flex>
      </GridItem>
      <GridItem area={"content"} overflowY={"auto"}>
        {children}
      </GridItem>
    </Grid>
  );
};
