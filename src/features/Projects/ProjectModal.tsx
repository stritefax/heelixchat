import React, { useEffect, useState } from "react";
import {
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  Button,
  Input,
} from "@chakra-ui/react";
import { Title } from "@heelix-app/design";
import { ActivitySelector } from "../../components/ActivitySelector";
import { useForm } from "react-hook-form";
import { type Activity } from "../../data/activities";
import { useActivities, useProject } from "../../state";
import { type Project } from "../../data/project";
import { useMemo } from "react";

type FormValues = {
  name: string;
};

interface ProjectModalProps {
  isOpen: boolean;
  projectId: null | number;
  onClose: () => void;
  onSave: (data: Omit<Project, "id">) => void;
  onUpdate: (data: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onUpdate,
  onSave,
}) => {
  const {
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const { activities } = useActivities();
  const [projectActivities, setProjectActivities] = useState<Activity[]>([]);
  const { state } = useProject();

  useEffect(() => {
    if (!isOpen) {
      reset();
      setProjectActivities([]);
    }
  }, [isOpen]);
  const currentProject = useMemo(
    () => state.projects.find((project) => project.id === projectId),
    [projectId, state.projects]
  );

  console.log("THE_CURRENT_PROJECT", currentProject, projectId);
  useEffect(() => {
    if (currentProject) {
      setProjectActivities(
        activities.filter((activity) =>
          currentProject.activities.includes(activity.id)
        )
      );
      setValue("name", currentProject.name);
    }
  }, [currentProject]);

  const onSubmit = (data: FormValues) => {
    onSave({
      name: data.name,
      activities: projectActivities.map((activity) => activity.id),
    });
    onClose();
  };

  const onSubmitUpdate = (data: FormValues) => {
    onUpdate({
      id: currentProject!.id,
      name: data.name,
      activities: projectActivities.map((activity) => activity.id),
    });
    onClose();
  };

  const getTitle = () => {
    return "Create New Project";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        width="100%"
        maxWidth="800px"
        height="70vh"
        minHeight={"300px"}
        css={`
          @media (max-width: 1024px) {
            max-width: 90%;
          }
        `}
      >
        <ModalHeader>
          <Title type="m">{getTitle()}</Title>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex gap="8px" flexDirection={"column"}>
            <FormControl>
              <Input
                id="name"
                placeholder="name"
                {...register("name", { required: "Name is required" })}
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <ActivitySelector
                activities={activities}
                selectedActivities={projectActivities}
                onSelectedActivitiesUpdated={setProjectActivities}
              />
            </FormControl>
            {currentProject ? (
              <Button
                colorScheme="blue"
                type="submit"
                width="full"
                onClick={handleSubmit(onSubmitUpdate)}
              >
                Update
              </Button>
            ) : (
              <Button
                colorScheme="blue"
                type="submit"
                width="full"
                onClick={handleSubmit(onSubmit)}
              >
                Create
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
