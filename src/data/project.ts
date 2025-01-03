import { invoke } from "@tauri-apps/api/tauri";

export type Project = {
  id: number;
  name: string;
  activities: number[];   
  activity_ids: number[];    // Array of activity IDs
  activity_names: string[];   // Array of document names
};

export const fetchProjects = async (offset: number): Promise<any[]> => {
  return await invoke<any[]>("get_projects", {
    offset,
    limit: 50,
  });
};

export const saveProject = async (project: Omit<Project, "id">) => {
  return await invoke("save_app_project", project);
};

export const updateProject = async (project: Project) => {
  return await invoke("update_app_project", project);
};

export const deleteProject = async (projectId: Project["id"]) => {
  return await invoke("delete_app_project", { projectId });
};

export const updateActivityName = async (activityId: number, name: string) => {
  return await invoke("update_project_activity_name", { 
    activityId,
    name 
  });
};

export const projectService = {
  fetch: fetchProjects,
  save: saveProject,
  update: updateProject,
  delete: deleteProject,
  updateActivityName
};