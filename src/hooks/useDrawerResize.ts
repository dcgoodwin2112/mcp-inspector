"use client";

import { useEffect, useState } from "react";

const KEY = "inspector.drawerHeight";
const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;

/**
 * Persisted, drag-resizable height for the bottom drawers (Context inspector
 * and Raw frames) — shared across live and replay so the drawer feels like
 * one surface.
 */
export function useDrawerResize() {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const h = Number(localStorage.getItem(KEY));
    if (h >= MIN_HEIGHT) setHeight(h);
  }, []);

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    setDragging(true);
    const startY = e.clientY;
    const startHeight = height;
    function move(ev: PointerEvent) {
      setHeight(
        Math.min(
          window.innerHeight - 200,
          Math.max(MIN_HEIGHT, startHeight - (ev.clientY - startY)),
        ),
      );
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragging(false);
      setHeight((h) => {
        localStorage.setItem(KEY, String(h));
        return h;
      });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function reset() {
    setHeight(DEFAULT_HEIGHT);
    localStorage.setItem(KEY, String(DEFAULT_HEIGHT));
  }

  return { height, dragging, startDrag, reset };
}
