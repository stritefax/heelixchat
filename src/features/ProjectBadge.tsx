import { useMemo, type FC } from "react";
import { Flex } from "@chakra-ui/react";
import { useProject } from "../state";
import { FaBookOpen } from "react-icons/fa";

export const ProjectBadge: FC = () => {
  const { state, getSelectedProject } = useProject();
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
      }}
    >
      <FaBookOpen />
      <span>{project.name}</span>
    </Flex>
  );
};
