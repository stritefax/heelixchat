import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { fetchActivities, type Activity } from "../data/activities";

type ActivityState = Activity[];

const activityAtom = atom<ActivityState>([]);

export const useActivities = () => {
  const [activities, setActivities] = useAtom(activityAtom);

  const fetch = () => {
    fetchActivities(0, 20000).then((result) => {
      setActivities(result);
    });
  };

  useEffect(() => {
    fetch();
  }, []);

  return { activities, fetch };
};
