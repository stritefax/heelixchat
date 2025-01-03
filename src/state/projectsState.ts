import { useAtom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import { useEffect } from "react";
import { projectService, type Project } from "../data/project";
import { getFullActivityText } from "../data/activities";

type ProjectState = {
  projects: Project[];
  selectedProject: Project["id"] | undefined;
  selectedActivityId: number | null;
};

type ProjectAction =
  | { type: "set"; payload: Project[] }
  | { type: "select"; payload: Project["id"] | undefined }
  | { type: "update"; payload: Project }
  | { type: "delete"; payload: Project["id"] }
  | { type: "selectActivity"; payload: number | null }
  | { type: "updateActivityName"; payload: { projectId: number; activityId: number; name: string } };

// Reducer
const projectReducer = (prev: ProjectState, action: ProjectAction): ProjectState => {
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
    case "selectActivity":
      return {
        ...prev,
        selectedActivityId: action.payload,
      };

    case "updateActivityName":
      return {
        ...prev,
        projects: prev.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                activity_names: project.activity_names.map((name, idx) =>
                  project.activities[idx] === action.payload.activityId
                    ? action.payload.name
                    : name
                ),
              }
            : project
        ),
      };

    default:
      return prev;
  }
};

// Atom
export const projectAtom = atomWithReducer<ProjectState, ProjectAction>(
  {
    projects: [],
    selectedProject: undefined,
    selectedActivityId: null,
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

  const selectProject = (projectId: Project["id"] | undefined) =>
    dispatch({ type: "select", payload: projectId });

  const selectActivity = (activityId: number | null) =>
    dispatch({ type: "selectActivity", payload: activityId });

  const updateActivityName = async (activityId: number, name: string) => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      await projectService.updateActivityName(activityId, name);
      dispatch({
        type: "updateActivityName",
        payload: { projectId: selectedProject.id, activityId, name },
      });
    }
  };

  const getSelectedProject = () => {
    return state.projects.find((project) => project.id === state.selectedProject);
  };

  const getSelectedProjectActivityText = async () => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      const promises = selectedProject?.activities.map((activityId) =>
        getFullActivityText(selectedProject.id, activityId)
      );
      const fullTextActivities = await Promise.all(promises);
      return fullTextActivities
        .map((text, index) => `${index + 1}. Activity: \n ${text}`)
        .join(", ");
    }
    return "";
  };
  
  const fetchSelectedActivityText = async () => {
    if (state.selectedActivityId) {
      const selectedProject = getSelectedProject();
      if (selectedProject) {
        return getFullActivityText(selectedProject.id, state.selectedActivityId);
      }
    }
    return "";
  };

  return {
    state,
    getSelectedProject,
    getSelectedProjectActivityText,
    fetchSelectedActivityText,
    selectProject,
    selectActivity,
    addProject,
    deleteProject,
    updateProject,
    updateActivityName,
  };
};