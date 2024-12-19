import { type FC, useState } from "react";
import styled from "styled-components";
import { useProject } from "../../state";
import { ProjectList } from "@/components/ProjectList";
import { ProjectModal } from "@/components";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const Projects: FC = () => {
  const { state, selectProject, addProject, deleteProject, updateProject } =
    useProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [project, setProject] = useState<null | number>(null);

  const onClose = () => {
    setModalOpen(false);
    setProject(null);
  };
  const onNewProjectClicked = () => setModalOpen(true);

  const onEditProjectClicked = (projectId: number) => {
    setProject(projectId);
    setModalOpen(true);
  };

  return (
    <Container>
      <ProjectList
        projects={state.projects}
        selectedProjectId={state.selectedProject}
        onClickProject={selectProject}
        onClickNew={onNewProjectClicked}
        onClickEdit={onEditProjectClicked}
        onDelete={deleteProject}
      />
      <ProjectModal
        isOpen={modalOpen}
        projectId={project}
        onClose={onClose}
        onUpdate={updateProject}
        onSave={addProject}
      />
    </Container>
  );
};
