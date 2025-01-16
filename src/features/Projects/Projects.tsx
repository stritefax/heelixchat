import { type FC, useState, useMemo } from "react";
import styled from "styled-components";
import { 
  Box, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  IconButton, 
  Flex, 
  Badge,
  Tooltip,
  ButtonGroup,
  Divider,
  Input,
  InputGroup,
  InputLeftElement
} from "@chakra-ui/react";
import { Search, Plus, File, Trash2, Edit, X, MoreHorizontal } from 'lucide-react';
import { Text } from "@heelix-app/design";
import { useProject } from "../../state";
import { ProjectModal } from "@/components";
import { type Project } from "../../data/project";

const Container = styled(Box)`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--space-l);
  gap: var(--space-l);
  max-width: var(--breakpoint-medium);
  margin: 0 auto;
  width: 100%;
`;

const StyledMenuButton = styled(MenuButton)`
  background-color: white;
  border: 1px solid var(--chakra-colors-gray-200);
  border-radius: var(--chakra-radii-md);
  padding: 8px 12px;
  height: 40px;
  display: flex;
  align-items: center;
  width: 100%;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--chakra-colors-gray-50);
    border-color: var(--chakra-colors-gray-300);
  }
  
  &:focus {
    box-shadow: 0 0 0 2px var(--chakra-colors-blue-100);
    border-color: var(--chakra-colors-blue-500);
  }
`;

export const Projects: FC<{
  selectedActivityId: number | null;
  onSelectActivity: (activityId: number | null) => void;
}> = ({ selectedActivityId, onSelectActivity }) => {
  const { 
    state, 
    selectProject, 
    addProject, 
    deleteProject, 
    updateProject,
    updateActivityName,
    addBlankActivity 
  } = useProject();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<null | number>(null);

  const currentProject = useMemo(() => 
    state.projects.find(p => p.id === state.selectedProject),
    [state.projects, state.selectedProject]
  );

  const handleProjectSelect = (project: Project) => {
    selectProject(project.id);
  };

  const handleUnselectProject = () => {
    selectProject(undefined);
  };

  const handleNewProject = () => {
    setSelectedProjectId(null);
    setModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    deleteProject(project.id);
    if (state.selectedProject === project.id) {
      selectProject(undefined);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedProjectId(null);
  };

  const handleActivitySelect = (activityId: number) => {
    onSelectActivity(activityId);
  };

  return (
    <Container>
      <ProjectSelector
        projects={state.projects}
        selectedProject={currentProject}
        onSelectProject={handleProjectSelect}
        onUnselectProject={handleUnselectProject}
        onNewProject={handleNewProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        selectedActivityId={selectedActivityId}
        onSelectActivity={handleActivitySelect}
        onUpdateActivityName={updateActivityName}
        onAddBlankActivity={addBlankActivity}
      />
      
      <ProjectModal
        isOpen={modalOpen}
        projectId={selectedProjectId}
        onClose={handleClose}
        onUpdate={updateProject}
        onSave={addProject}
      />
    </Container>
  );
};

const ProjectSelector: FC<{
  projects: Project[];
  selectedProject: Project | undefined;
  onSelectProject: (project: Project) => void;
  onUnselectProject: () => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  selectedActivityId: number | null;
  onSelectActivity: (activityId: number) => void;
  onUpdateActivityName: (activityId: number, name: string) => void;
  onAddBlankActivity: () => Promise<number | undefined>;
}> = ({
  projects,
  selectedProject,
  onSelectProject,
  onUnselectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  selectedActivityId,
  onSelectActivity,
  onUpdateActivityName,
  onAddBlankActivity
}) => {
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  
  // 1) Add local search term state:
  const [searchTerm, setSearchTerm] = useState("");

  // 2) Filter projects by name:
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    return projects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const projectActivities = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.activities.map((_, index) => ({
      id: selectedProject.activities[index],
      activity_id: selectedProject.activity_ids[index],
      name: selectedProject.activity_names[index] || `Document ${selectedProject.activities[index]}`
    }));
  }, [selectedProject]);

  const handleStartEdit = (activity: { id: number; name: string }) => {
    setEditingActivityId(activity.id);
    setEditingName(activity.name);
  };

  const handleSaveEdit = () => {
    if (editingActivityId && editingName.trim()) {
      onUpdateActivityName(editingActivityId, editingName.trim());
      setEditingActivityId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingActivityId(null);
    }
  };

  const handleAddNewDocument = async () => {
    const newActivityId = await onAddBlankActivity();
    if (newActivityId) {
      handleStartEdit({ id: newActivityId, name: "New Document" });
    }
  };

  return (
    <Flex direction="column" w="full" gap={4}>
      <Flex gap={2} w="full" align="center">
        <Menu>
          <Flex position="relative" w="full">
            <StyledMenuButton w="full">
              <Text type="m" bold>
                {selectedProject ? selectedProject.name : 'Select a Project'}
              </Text>
            </StyledMenuButton>
            {selectedProject && (
              <IconButton
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                aria-label="Unselect project"
                icon={<X size={14} />}
                size="xs"
                variant="ghost"
                zIndex="1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnselectProject();
                }}
                _hover={{ bg: 'gray.100' }}
              />
            )}
          </Flex>
          <MenuList minW="240px" w="240px" py={0}>
            {/* 3) Our search input at the top of the MenuList */}
            <Box p={2} h="56px" display="flex" alignItems="center">
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                <Search size={14} color="var(--chakra-colors-gray-400)" />
                </InputLeftElement>
                <Input
                  placeholder="Search Projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"       // Disables suggestions from browser
                  autoCorrect="off"        // Disables autocorrect
                  spellCheck="false"       // Disables spell checking
                />
              </InputGroup>
            </Box>
            <Divider my={0} />

            {/* 4) Render filtered projects */}
            {filteredProjects.map((project) => (
              <MenuItem 
                key={project.id}
                onClick={() => onSelectProject(project)}
                p={3}
                h="40px"  // Set fixed height
              >
                <Flex justify="space-between" align="center" w="full">
                  <Text type="m">{project.name}</Text>
                  <Badge colorScheme="blue" ml={2}>
                    {project.activities.length} docs
                  </Badge>
                </Flex>
              </MenuItem>
            ))}

            <Divider my={2} />
            <MenuItem 
              icon={<Plus size={16} />}
              onClick={onNewProject}
              p={3}
              h="40px"  // Maintain consistent height
            >
              <Text type="m">Create New Project</Text>
            </MenuItem>
          </MenuList>
        </Menu>

        <Tooltip label="Create New Project">
          <IconButton
            aria-label="Create new project"
            icon={<Plus size={16} />}
            size="sm"
            variant="ghost"
            onClick={onNewProject}
          />
        </Tooltip>

        {selectedProject && (
          <Menu placement="bottom-end">
            <MenuButton 
              as={IconButton}
              aria-label="Project options"
              icon={<MoreHorizontal size={16} />}
              size="sm"
              variant="ghost"
            />
    <MenuList minW="240px" w="240px">
              <MenuItem onClick={() => onEditProject(selectedProject)}>
                Edit Project
              </MenuItem>
              <MenuItem 
                onClick={() => onDeleteProject(selectedProject)}
                color="red.500"  
              >
                Delete Project
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {selectedProject && (
        <Box 
          borderWidth="1px" 
          borderRadius="md" 
          overflow="hidden"
        >
          <Flex 
            bg="gray.50" 
            p={3} 
            borderBottomWidth="1px"
            justify="space-between"
            align="center"
          >
            <Text type="m" bold>Project Documents</Text>
            <IconButton
              aria-label="Add new document"
              icon={<Plus size={16} />}
              size="sm"
              variant="ghost"
              onClick={handleAddNewDocument}
            />
          </Flex>
          <Box>
            {projectActivities.map((activity) => (
              <Flex
                key={activity.id}
                p={3}
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
                _last={{ borderBottomWidth: 0 }}
                align="center"
                justify="space-between"
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
                bg={selectedActivityId === activity.id ? 'blue.50' : 'white'}
                onClick={() => editingActivityId !== activity.id && onSelectActivity(activity.id)}
                cursor="pointer"
              >
                <Flex align="center" gap={2} flex={1}>
                  <File size={16} />
                  {editingActivityId === activity.id ? (
                    <Input
                      value={editingName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      autoFocus
                      size="sm"
                      variant="unstyled"
                      px={2}
                    />
                  ) : (
                    <div 
                      onDoubleClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleStartEdit(activity);
                      }}
                    >
                      <Text type="m">
                        {activity.name}
                      </Text>
                    </div>
                  )}
                </Flex>
                {!editingActivityId && (
                  <IconButton
                    aria-label="Edit document name"
                    icon={<Edit size={14} />}
                    size="xs"
                    variant="ghost"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleStartEdit(activity);
                    }}
                  />
                )}
              </Flex>
            ))}
            {projectActivities.length === 0 && (
              <Flex 
                justify="center" 
                align="center" 
                p={8}
                color="gray.500"
                flexDirection="column"
                gap={2}
              >
                <File size={24} />
                <Text type="m">No documents added yet</Text>
              </Flex>
            )}
          </Box>
        </Box>
      )}
    </Flex>
  );
};
