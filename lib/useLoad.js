"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Runs an async loader on mount and whenever deps change.
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const latestRun = useRef(0);

  const reload = useCallback(async () => {
    const run = ++latestRun.current;
    try {
      const data = await loader();
      if (run === latestRun.current) setState({ loading: false, data, error: "" });
    } catch (err) {
      if (run === latestRun.current) setState({ loading: false, data: null, error: err.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
