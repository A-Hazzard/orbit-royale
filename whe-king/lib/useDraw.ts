"use client";
import { useEffect, useState } from "react";
import { DRAWS } from "./data";

const TT_OFFSET_MS = -4 * 3600_000; // Trinidad & Tobago is UTC-4, no DST

export type DrawClock = { nextIdx: number; remaining: number; ready: boolean };

function compute(now: number): DrawClock {
  const tt = new Date(now + TT_OFFSET_MS);
  const secOfDay = tt.getUTCHours() * 3600 + tt.getUTCMinutes() * 60 + tt.getUTCSeconds();
  let nextIdx = DRAWS.findIndex((d) => d.h * 3600 + d.m * 60 > secOfDay);
  let target: number;
  if (nextIdx === -1) {
    nextIdx = 0;
    target = 86400 + DRAWS[0].h * 3600 + DRAWS[0].m * 60; // tomorrow's first draw
  } else {
    target = DRAWS[nextIdx].h * 3600 + DRAWS[nextIdx].m * 60;
  }
  return { nextIdx, remaining: target - secOfDay, ready: true };
}

export function useDrawClock(): DrawClock {
  const [clock, setClock] = useState<DrawClock>({ nextIdx: 3, remaining: 0, ready: false });
  useEffect(() => {
    const tick = () => setClock(compute(Date.now()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);
  return clock;
}
