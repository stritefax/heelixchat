import { type FC } from "react";
import styled, { css } from "styled-components";
import { Text } from "@heelix-app/design";
import {
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import {
  useGlobalSettings,
  type Settings,
} from "../../Providers/SettingsProvider";
import { PrivacySettings } from "../../widgets";

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* gap: var(--space-default); */
  padding: 0 var(--page-padding) var(--page-padding) var(--page-padding);
  background-color: var(--card-content-background);
  flex: 1;
  height: 100%;
`;

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  grid-auto-rows: 50px;
`;

type GridItemProps = {
  colSpan?: number;
};
const GridItem = styled.div<GridItemProps>`
  display: flex;
  align-items: center;
  ${({ colSpan }) =>
    colSpan &&
    css`
      grid-column: span ${colSpan};
    `}
`;

export const SettingsScreen: FC = () => {
  const toast = useToast();
  const { update, settings } = useGlobalSettings();

  const updateSettings = (settings: Settings) => {
    const updatePromise = update(settings);
    toast.promise(updatePromise, {
      success: { title: "Settings saved!", duration: 3000 },
      error: {
        title: "Failed to save settings",
      },
      loading: { title: "Saving settings", description: "Please wait..." },
    });
  };
  return (
    <MainContainer>
      <Tabs style={{ height: "100%" }}>
        <TabList>
          <Tab>General</Tab>
          <Tab>Privacy settings</Tab>
        </TabList>

        <TabPanels style={{ height: "calc(100% - 42px)" }}>
          <TabPanel>
            <PageContainer>
              <GridItem colSpan={1}>
                <Text type="m">Developer mode</Text>
              </GridItem>
              <GridItem colSpan={1}>
                <Switch
                  isChecked={settings.isDevMode}
                  onChange={() =>
                    updateSettings({
                      ...settings,
                      isDevMode: !settings.isDevMode,
                    })
                  }
                />
              </GridItem>
              <GridItem colSpan={1}>
                <Text type="m">Use trello integration POC</Text>
              </GridItem>
              <GridItem colSpan={1}>
                <Switch
                  isChecked={settings.useTrelloPoc}
                  onChange={() =>
                    updateSettings({
                      ...settings,
                      useTrelloPoc: !settings.useTrelloPoc,
                    })
                  }
                />
              </GridItem>
              {settings.isDevMode && (
                <>
                  <GridItem colSpan={1}>
                    <Text type="m">Screenshot interval (seconds)</Text>
                  </GridItem>
                  <GridItem colSpan={1}>
                    <NumberInput
                      defaultValue={10}
                      value={settings.interval}
                      min={10}
                      max={99999}
                      onChange={(interval) =>
                        updateSettings({ ...settings, interval })
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </GridItem>
                </>
              )}
            </PageContainer>
          </TabPanel>
          <TabPanel style={{ height: "100%" }}>
            <PrivacySettings />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </MainContainer>
  );
};
