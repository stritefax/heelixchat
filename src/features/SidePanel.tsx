import { type FC } from "react";
import { Tabs } from "@chakra-ui/react";
import { FaHistory } from "react-icons/fa";

export const SidePanel: FC = () => {
  return (
    <Tabs.Root defaultValue="members">
      <Tabs.List>
        <Tabs.Trigger>
          <FaHistory />
        </Tabs.Trigger>
        <Tabs.Trigger>
          <FaHistory />
        </Tabs.Trigger>
        <Tabs.Trigger>
          <FaHistory />
        </Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Content>Manage your team members</Tabs.Content>
    </Tabs.Root>
  );
};
