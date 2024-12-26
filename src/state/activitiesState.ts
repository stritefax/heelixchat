import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { fetchActivities, type Activity } from "../data/activities";

type ActivityState = Activity[];

const activityAtom = atom<ActivityState>([]);

export const useActivities = () => {
  const [activities, setActivities] = useAtom(activityAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchActivities(0, 20000);
      setActivities(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch activities'));
      console.error('Error fetching activities:', e);
    } finally {
      setIsLoading(false);
    }
  }, [setActivities]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    activities,
    isLoading,
    error,
    fetch,
    // Helper method to check if an activity exists
    hasActivity: useCallback(
      (id: number) => activities.some(activity => activity.id === id),
      [activities]
    ),
  };
};