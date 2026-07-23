"use client";

import { useEffect, useState } from "react";

/** Raw-frames toggle, shared via localStorage across live and replay views. */
export function useRawFrames(): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(localStorage.getItem("inspector.rawFrames") === "1");
  }, []);
  function toggle() {
    setOn((v) => {
      localStorage.setItem("inspector.rawFrames", v ? "0" : "1");
      return !v;
    });
  }
  return [on, toggle];
}

export function isRpcEvent(e: { type: string }): boolean {
  return e.type.startsWith("rpc.");
}
