import React, { useEffect, useState, useMemo } from "react";
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
  Spinner,
  Text,
  ModalFooter,
} from "@chakra-ui/react";
import { Title } from "@heelix-app/design";
import { ActivitySelector } from "../../components/ActivitySelector";
import { useForm } from "react-hook-form";
import { type Activity } from "../../data/activities";
import { useActivities, useProject } from "../../state";
import { type Project } from "../../data/project";

type FormValues = {
  name: string;
};

interface ProjectModalProps {
  isOpen: boolean;
  projectId: number | null;
  onClose: () => void;
  onSave: (data: Omit<Project, "id">) => Promise<void>;
  onUpdate: (data: Project) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onUpdate,
  onSave,
}) => {
  // Form handling
  const {
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  // State management
  const { activities, fetch: fetchActivities, isLoading: isLoadingActivities } = useActivities();
  const [projectActivities, setProjectActivities] = useState<Activity[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const { state } = useProject();

  // Memoized current project
  const currentProject = useMemo(
    () => state.projects.find((project) => project.id === projectId),
    [projectId, state.projects]
  );

  // Reset form and fetch fresh data when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    } else {
      reset();
      setProjectActivities([]);
    }
  }, [isOpen, fetchActivities, reset]);

  // Populate form when editing existing project
  useEffect(() => {
    if (currentProject) {
      setValue("name", currentProject.name);
      setProjectActivities(
        activities.filter((activity) =>
          currentProject.activity_ids.includes(activity.id)
        )
      );
    }
  }, [currentProject, activities, setValue]);

  // Form submission handlers
  const handleCreate = async (data: FormValues) => {
    setIsSubmittingForm(true);
    try {
      await onSave({
        name: data.name,
        activities: projectActivities.map((activity) => activity.id),
        activity_ids: projectActivities.map((activity) => activity.id), // Add this line
        activity_names: projectActivities.map((activity) => activity.title), // Add this line
      });
      onClose();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleUpdate = async (data: FormValues) => {
    if (!currentProject) return;
  
    setIsSubmittingForm(true);
    try {
      await onUpdate({
        id: currentProject.id,
        name: data.name,
        activities: projectActivities.map((activity) => activity.id),
        activity_ids: projectActivities.map((activity) => activity.id), // Add this line
        activity_names: projectActivities.map((activity) => activity.title), // Add this line
      });
      onClose();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Error handling for required name field
  const nameError = errors.name?.message;

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
        height="80vh"
        minHeight="300px"
        css={`
          @media (max-width: 1024px) {
            max-width: 90%;
          }
        `}
      >
        <ModalHeader>
          <Title type="m">{currentProject ? "Edit Project" : "Create New Project"}</Title>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex gap="8px" flexDirection="column">
            <FormControl isInvalid={!!nameError}>
              <Input
                id="name"
                placeholder="Project Name"
                {...register("name", { 
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" }
                })}
              />
              {nameError && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {nameError}
                </Text>
              )}
            </FormControl>

            <FormControl isRequired mb={4}>
              {isLoadingActivities ? (
                <Flex justify="center" align="center" height="200px">
                  <Spinner />
                </Flex>
              ) : (
                <ActivitySelector
                  activities={activities}
                  selectedActivities={projectActivities}
                  onSelectedActivitiesUpdated={setProjectActivities}
                />
              )}
            </FormControl>

            <Button
              colorScheme="blue"
              type="submit"
              width="full"
              isLoading={isSubmittingForm || isSubmitting}
              onClick={handleSubmit(currentProject ? handleUpdate : handleCreate)}
              isDisabled={projectActivities.length === 0}
            >
              {currentProject ? "Update" : "Create"}
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};