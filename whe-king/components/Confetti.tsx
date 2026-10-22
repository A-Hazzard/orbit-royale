"use client";
import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number };
const COLORS = ["#ffd54a", "#ffb300", "#ff3d8b", "#7c4dff", "#18e0ff", "#ffffff"];

export default function Confetti({ burst }: { burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!burst) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const ps: P[] = Array.from({ length: 160 }, () => {
      const a = (Math.random() * Math.PI) - Math.PI; // upward fan
      const sp = 8 + Math.random() * 14;
      return {
        x: innerWidth / 2, y: innerHeight * 0.55,
        vx: Math.cos(a) * sp * 0.9, vy: Math.sin(a) * sp - 4,
        r: 4 + Math.random() * 6, c: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1,
      };
    });
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = false;
      for (const p of ps) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
        if (p.life <= 0 || p.y > innerHeight + 20) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [burst]);

  return <canvas ref={ref} className="confetti" aria-hidden />;
}
