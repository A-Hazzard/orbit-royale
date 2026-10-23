"use client";
import { fx } from "@/lib/fx";
import { useEffect } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ remaining, ready }: { remaining: number; ready: boolean }) {
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const tone = remaining <= 60 ? "crit" : remaining <= 600 ? "warn" : "calm";

  useEffect(() => {
    if (ready && remaining > 0 && remaining <= 10) fx.tick();
  }, [remaining, ready]);

  const units: [string, string][] = [
    [ready ? pad(h) : "--", "HRS"],
    [ready ? pad(m) : "--", "MIN"],
    [ready ? pad(s) : "--", "SEC"],
  ];

  return (
    <div className={`cd cd-${tone}`} aria-live="off" aria-label={`Bets close in ${h} hours ${m} minutes ${s} seconds`}>
      <div className="cd-label">
        <span className="cd-dot" />
        {tone === "crit" ? "LAST CALL" : "BETS CLOSE IN"}
      </div>
      <div className="cd-row">
        {units.map(([v, l], i) => (
          <div key={l} className="cd-unit">
            <div className="cd-digits">
              <span key={v} className="cd-digit">{v}</span>
            </div>
            <div className="cd-cap">{l}</div>
            {i < 2 && <span className="cd-colon">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Single-line clock used inside the roulette wheel. */
export function MiniClock({ remaining, ready }: { remaining: number; ready: boolean }) {
  const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
  const tone = remaining <= 60 ? "crit" : remaining <= 600 ? "warn" : "calm";
  return (
    <div className={`mini-clock cd-${tone}`}>
      <small>BETS CLOSE IN</small>
      <b className="cd-digit" key={remaining}>{ready ? `${pad(h)}:${pad(m)}:${pad(s)}` : "--:--:--"}</b>
    </div>
  );
}
