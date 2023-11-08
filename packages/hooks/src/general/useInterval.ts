import { useEffect, useRef } from "react";

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// Will use a minimum of 1ms delay to avoid infinite loops
export const useInterval = (callback: () => void | Promise<void>, delayInMs = 1000) => {
  const savedCallback = useRef(callback);

  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => {
      savedCallback.current()?.catch(console.log);
    }, Math.max(1, delayInMs));

    return () => clearInterval(id);
  }, [delayInMs]);
};
