import { type FC, useState, useEffect, useMemo } from "react";
import { Input, Switch, Tooltip } from "@chakra-ui/react";
import styled from "styled-components";
import { invoke } from "@tauri-apps/api/tauri";
import { Title, Text } from "@heelix-app/design";

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  gap: var(--space-s);
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const EmptyResultsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: var(--space-s);
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: var(--space-default) 0;
  margin: 0 var(--space-s);
  border-bottom: 1px solid var(--default-border-color);

  &:last-child {
    border-bottom: none;
  }
`;

const PrivacyMessage = styled.div`
  font-size: 12px;
  color: #000;
  margin-bottom: var(--space-s);
`;

type App = {
  app_path: string;
  app_name: string;
  icon_path: string;
  allow: boolean;
};

export const PrivacySettings: FC = () => {
  const [appList, setAppList] = useState<App[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [showPrivate, setShowPrivate] = useState<boolean>(false);

  const fetchAppList = async () => {
    const allApps = await invoke<App[]>("get_app_permissions");
    setAppList(allApps);
  };

  const updateApp = async (app: App, allow?: boolean) => {
    await invoke("update_app_permissions", {
      appPath: app.app_path,
      allow: allow === undefined ? !app.allow : allow,
    });
    fetchAppList();
  };

  const filterApps = () => {
    const searchFiltered = appList.filter((app) =>
      app.app_name.toLowerCase().includes(searchValue.toLowerCase())
    );
    if (showPrivate) {
      return searchFiltered.filter((app) => !app.allow);
    }
    return searchFiltered;
  };

  const filteredApps = useMemo(
    () => filterApps(),
    [appList, searchValue, showPrivate]
  );

  useEffect(() => {
    fetchAppList();
  }, []);

  return (
    <ContentContainer>
      <FilterContainer>
        <Switch
          size="lg"
          onChange={(event) => setShowPrivate(event.target.checked)}
        >
          <Text type="m">Private apps</Text>
        </Switch>
        <Input
          placeholder="Search for app"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </FilterContainer>

      <PrivacyMessage>
        All data only stored locally and private browsing is never captured.
      </PrivacyMessage>

      {filteredApps.length ? (
        <List>
          {filteredApps.map((app) => (
            <Tooltip label={app.app_path} key={app.app_path}>
              <ListItem>
                <Title type="xs">{app.app_name}</Title>
                <Switch
                  size="md"
                  isChecked={app.allow}
                  onChange={() => updateApp(app)}
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>
      ) : (
        <EmptyResultsContainer>
          <Text secondary bold type="xl">
            No results
          </Text>
        </EmptyResultsContainer>
      )}
    </ContentContainer>
  );
};