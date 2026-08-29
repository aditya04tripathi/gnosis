import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ActionResult = { error?: string };

export function useOptimisticAction<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const snapshotRef = useRef(initialValue);

  const sync = useCallback((next: T) => {
    setValue(next);
    snapshotRef.current = next;
  }, []);

  useEffect(() => {
    sync(initialValue);
  }, [initialValue, sync]);

  const run = useCallback(
    async (
      applyOptimistic: (current: T) => T,
      action: () => Promise<ActionResult>,
    ): Promise<ActionResult> => {
      const previous = snapshotRef.current;
      const optimistic = applyOptimistic(previous);
      setValue(optimistic);
      snapshotRef.current = optimistic;

      try {
        const result = await action();
        if (result.error) {
          setValue(previous);
          snapshotRef.current = previous;
          toast.error(result.error);
        }
        return result;
      } catch {
        setValue(previous);
        snapshotRef.current = previous;
        toast.error("Something went wrong");
        return { error: "Something went wrong" };
      }
    },
    [],
  );

  return { value, setValue: sync, run };
}
