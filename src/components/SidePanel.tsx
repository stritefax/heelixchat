import { ReactNode, type FC, type CSSProperties } from "react";
import { FaHistory } from "react-icons/fa";
import styled from "styled-components";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

// const Container = styled.div<{ gridArea: CSSProperties["gridArea"] }>`
//   grid-area: ${({ gridArea }) => gridArea};
// `;

const TabHeaderContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

type SidePanelProps = {
  gridArea: CSSProperties["gridArea"];
  pages: { text?: string; icon: ReactNode; content: ReactNode }[];
};
export const SidePanel: FC<SidePanelProps> = ({ pages, gridArea }) => {
  return (
    <Tabs variant={"soft-rounded"} style={{ gridArea, height: "100%" }}>
      <TabList style={{ padding: "12px" }}>
        {pages.map((page) => (
          <Tab>
            <TabHeaderContent>
              {page.icon}
              {page.text}
            </TabHeaderContent>
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {pages.map((page) => (
          <TabPanel>{page.content}</TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};
