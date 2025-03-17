import { type FC, useMemo } from "react";
import { Flex, IconButton } from "@chakra-ui/react";
import { useProject } from "../state";
import { Folders, X } from 'lucide-react'; // Changed from FaBookOpen

export const ProjectBadge: FC = () => {
  const { state, getSelectedProject, selectProject } = useProject();
  const project = useMemo(() => getSelectedProject(), [state]);

  if (!project) {
    return null;
  }

  return (
    <Flex
      style={{
        border: "1px solid var(--default-border-color)",
        borderRadius: "8px",
        padding: "2px 8px",
        gap: "8px",
        alignItems: "center",
        position: "relative", // Added for positioning the X button
      }}
    >
      <Folders size={16} /> {/* Changed from FaBookOpen, added size */}
      <span>{project.name}</span>
      <IconButton
        aria-label="Unselect project"
        icon={<X size={14} />}
        size="xs"
        variant="ghost"
        onClick={() => selectProject(undefined)}
        ml={1}
        _hover={{ bg: 'gray-100' }}
      />
    </Flex>
  );
};