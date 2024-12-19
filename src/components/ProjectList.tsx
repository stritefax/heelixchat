import { type FC } from "react";
import styled from "styled-components";
import { IconButton, Flex } from "@chakra-ui/react";
import { type Project } from "../data/project";
import { Text } from "@heelix-app/design";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

const ListItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  flex: 1;
  cursor: pointer;
  padding: var(--space-default);
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: var(--default-radius);
  align-items: center;
  background-color: ${({ isActive }) =>
    isActive ? "var(--chakra-colors-gray-200)" : "none"};
  &:hover {
    background-color: var(--chakra-colors-gray-100);
  }
`;

type ProjectListProps = {
  projects: Project[];
  onClickProject: (projectId: number) => void;
  selectedProjectId?: Project["id"];
  onClickNew: () => void;
  onClickEdit: (projectId: Project["id"]) => void;
  onDelete: (projectId: Project["id"]) => void;
};

export const ProjectList: FC<ProjectListProps> = ({
  projects,
  onClickProject,
  selectedProjectId,
  onClickNew,
  onClickEdit,
  onDelete,
}) => {
  return (
    <Container>
      <ListItem onClick={onClickNew}>
        <Flex gap={2}>
          <FaPlus size={20} />
          <Text type="m" bold>
            New Project
          </Text>
        </Flex>
      </ListItem>
      {projects.map((project) => (
        <ListItem
          key={project.id}
          isActive={project.id === selectedProjectId}
          onClick={() => onClickProject(project.id)}
        >
          <Text type="m" bold>
            {project.name}
          </Text>
          <Flex gap={2}>
            <IconButton
              aria-label="Edit"
              icon={
                <FaEdit
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickEdit(project.id);
                  }}
                />
              }
            />
            <IconButton
              aria-label="Delete"
              icon={
                <FaTrash
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                />
              }
            />
          </Flex>
        </ListItem>
      ))}
    </Container>
  );
};
