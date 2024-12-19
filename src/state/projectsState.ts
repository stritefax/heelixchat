import { useAtom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import { useEffect } from "react";
import { projectService, type Project } from "../data/project";
import { getFullActivityText } from "../data/activities";

type ProjectState = {
  projects: Project[];
  selectedProject: Project["id"] | undefined;
};

type ProjectAction =
  | { type: "set"; payload: Project[] }
  | { type: "select"; payload: Project["id"] }
  | {
      type: "update";
      payload: Project;
    }
  | {
      type: "delete";
      payload: Project["id"];
    };

const projectReducer = (prev: ProjectState, action: ProjectAction) => {
  switch (action.type) {
    case "set":
      return {
        ...prev,
        projects: action.payload,
      };
    case "select":
      return {
        ...prev,
        selectedProject: action.payload,
      };
    case "update":
      const projectIndex = prev.projects.findIndex(
        (project) => project.id === action.payload.id
      );
      if (projectIndex >= 0) {
        prev.projects[projectIndex] = action.payload;
      }
      return { ...prev };
    case "delete":
      const projectDeleteIndex = prev.projects.findIndex(
        (project) => project.id === action.payload
      );
      if (projectDeleteIndex >= 0) {
        prev.projects.splice(projectDeleteIndex, 1);
      }
      return { ...prev };
  }
};

// Define the atom with the reducer
export const projectAtom = atomWithReducer<ProjectState, ProjectAction>(
  {
    projects: [],
    selectedProject: undefined,
  },
  projectReducer
);

export const useProject = () => {
  const [state, dispatch] = useAtom(projectAtom);

  const fetch = () => {
    projectService.fetch(0).then((result) => {
      dispatch({ type: "set", payload: result });
    });
  };

  useEffect(() => {
    fetch();
  }, []);

  const addProject = async (project: Omit<Project, "id">) => {
    await projectService.save(project);
    fetch();
  };

  const updateProject = async (project: Project) => {
    await projectService.update(project);
    fetch();
  };

  const deleteProject = async (projectId: Project["id"]) => {
    await projectService.delete(projectId);
    fetch();
  };

  const selectProject = (projectId: number) =>
    dispatch({ type: "select", payload: projectId });

  const getSelectedProject = () => {
    return state.projects.find(
      (project) => project.id === state.selectedProject
    );
  };

  const getSelectedProjectActivityText = async () => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      const promises = selectedProject?.activities.map((activityId) =>
        getFullActivityText(activityId)
      );
      const fullTextActivities = await Promise.all(promises);
      return fullTextActivities
        .map((text, index) => `${index + 1}. Activity: /n ${text}`)
        .join(", ");
    }
    return "";
  };
  
  return {
    state,
    getSelectedProject,
    getSelectedProjectActivityText,
    selectProject,
    addProject,
    deleteProject,
    updateProject,
  };
};
