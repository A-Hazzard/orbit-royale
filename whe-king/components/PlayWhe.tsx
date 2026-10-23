"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  ATTACH_TIERS, CHIPS, CURRENT_ISSUE, DRAWS, HOT, LAST_DRAW, MARKS, MOCK_WINNERS, payoutFor,
} from "@/lib/data";
import { fx, setMuted } from "@/lib/fx";
import { useDrawClock } from "@/lib/useDraw";
import { LAYOUTS, THEMES, useLayout, useTheme } from "@/lib/prefs";
import Countdown, { MiniClock } from "./Countdown";
import Confetti from "./Confetti";

type Tier = (typeof ATTACH_TIERS)[number]["id"];
type Ticket = { id: string; draw: string; issue: number; picks: number[]; base: number; attach: number; tier: Tier; total: number; max: number };

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const secs = (i: number) => DRAWS[i].h * 3600 + DRAWS[i].m * 60;
const MAX_PICKS = 10;
const ROULETTE_RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const START_BALANCE = 500;
// European roulette wheel order (without the zero) for the wheel layout.
const WHEEL = [26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];
const STEP_NAMES = ["Pick numbers", "Set stakes", "Review & lock"];
const noop = () => () => {};

function StakeRow({ label, value, onChange, allowOff }: { label: string; value: number; onChange: (v: number) => void; allowOff?: boolean }) {
  const [custom, setCustom] = useState("");
  const preset = (CHIPS as readonly number[]).includes(value);
  return (
    <div className="stake">
      <div className="stake-label">{label}</div>
      <div className="chips">
        {allowOff && (
          <button className={`chip chip-off ${value === 0 ? "on" : ""}`} onClick={() => { fx.chip(); setCustom(""); onChange(0); }}>Off</button>
        )}
        {CHIPS.map((c) => (
          <button key={c} className={`chip ${value === c ? "on" : ""}`} onClick={() => { fx.chip(); setCustom(""); onChange(c); }}>{c}</button>
        ))}
        <input
          className={`chip-input ${!preset && value > 0 ? "on" : ""}`}
          inputMode="numeric"
          placeholder="Other"
          value={custom}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setCustom(v);
            onChange(v ? Math.max(1, Number(v)) : allowOff ? 0 : 1);
          }}
        />
      </div>
    </div>
  );
}

export default function PlayWhe() {
  const clock = useDrawClock();
  const [theme, setTheme] = useTheme();
  const [layout, setLayout] = useLayout();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [step, setStep] = useState(0);
  const [drawIdx, setDrawIdx] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [base, setBase] = useState(5);
  const [attach, setAttach] = useState(1);
  const [tier, setTier] = useState<Tier>("MB");
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(START_BALANCE);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [burst, setBurst] = useState(0);
  const [muted, setMute] = useState(false);
  const [spinning, setSpinning] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A tab the player picked that has since closed falls back to the live draw.
  const sel = drawIdx !== null && !(clock.ready && drawIdx < clock.nextIdx) ? drawIdx : clock.nextIdx;
  const closedBefore = clock.nextIdx;
  const remaining = clock.remaining + (secs(sel) - secs(clock.nextIdx));
  const issue = CURRENT_ISSUE + (sel - clock.nextIdx);
  const locked = remaining <= 0;

  useEffect(() => setMuted(muted), [muted]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const total = (base + attach) * picks.length;
  const maxWin = useMemo(
    () => picks.reduce((s, n) => s + base * payoutFor(n) + attach * (ATTACH_TIERS.find((t) => t.id === tier)?.odds ?? 0), 0),
    [picks, base, attach, tier],
  );

  const toggle = (n: number) => {
    setPicks((p) => {
      if (p.includes(n)) { fx.drop(); return p.filter((x) => x !== n); }
      if (p.length >= MAX_PICKS) { say(`Max ${MAX_PICKS} numbers per ticket`); return p; }
      fx.pick(p.length);
      setPop(n);
      setTimeout(() => setPop(null), 450);
      return [...p, n];
    });
  };

  const luckyPick = () => {
    if (spinning !== null) return;
    fx.spin();
    let i = 0;
    const id = setInterval(() => {
      setSpinning(1 + Math.floor(Math.random() * 36));
      if (++i > 16) {
        clearInterval(id);
        const n = 1 + Math.floor(Math.random() * 36);
        setSpinning(null);
        setPicks((p) => (p.includes(n) ? p : [...p, n].slice(-MAX_PICKS)));
        setPop(n);
        setTimeout(() => setPop(null), 450);
        fx.pick(2);
        setBurst((b) => b + 1);
      }
    }, 60);
  };

  const lockIn = () => {
    if (!picks.length) { setShake(true); setTimeout(() => setShake(false), 500); say("Pick at least one lucky number"); return; }
    if (total > balance) { setShake(true); setTimeout(() => setShake(false), 500); say("Not enough balance (prototype)"); return; }
    fx.lock();
    setBurst((b) => b + 1);
    setBalance((b) => b - total);
    setTicket({
      id: "WK-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      draw: DRAWS[sel].label, issue, picks: [...picks].sort((a, b) => a - b), base, attach, tier, total, max: maxWin,
    });
  };

  const urgent = remaining > 0 && remaining <= 10;
  const odds = ATTACH_TIERS.find((t) => t.id === tier)?.odds ?? 0;
  const sorted = [...picks].sort((a, b) => a - b);

  const ballBtn = (n: number, icon: string, name: string) => {
    const on = picks.includes(n);
    const hot = n in HOT;
    return (
      <button key={n} data-c={ROULETTE_RED.has(n) ? "r" : "b"} onClick={() => toggle(n)} aria-pressed={on} aria-label={`${n} ${name}, pays ${payoutFor(n)} to 1`}
        className={`ball-wrap ${on ? "on" : ""} ${hot ? "hot" : ""} ${pop === n ? "pop" : ""} ${spinning === n ? "spin" : ""}`}>
        <span className="ball">
          <span className="ball-num">{n}</span>
          <span className="ball-icon">{icon}</span>
          {hot && <span className="flame">🔥</span>}
        </span>
        <span className="pay">{money(payoutFor(n))}</span>
      </button>
    );
  };

  const pot = (
    <div className="jackpot">
      <span>CURRENT POT</span>
      <b>TT$ 1,284,350</b>
      <i>🔥 312 players locked in this draw</i>
    </div>
  );

  const hero = (
    <div className="hero card">
      <Countdown remaining={Math.max(0, remaining)} ready={clock.ready} />
      {pot}
    </div>
  );

  const tabs = (
    <div className="tabs" role="tablist">
      {DRAWS.map((d, i) => {
        const closed = clock.ready && i < closedBefore;
        return (
          <button key={d.label} role="tab" aria-selected={sel === i} disabled={closed}
            className={`tab ${sel === i ? "on" : ""}`} onClick={() => { fx.chip(); setDrawIdx(i); }}>
            <span>{d.label}</span>
            <small>{closed ? "CLOSED" : i === clock.nextIdx ? "NEXT" : "OPEN"}</small>
          </button>
        );
      })}
    </div>
  );

  const last = (
    <div className="last card">
      <div className="last-head">
        <span>LAST DRAW · #{LAST_DRAW.issue}</span>
        <button className="link">How to play</button>
      </div>
      <div className="last-row">
        <div className="win-ball">
          <em>WINNER</em>
          <b>{LAST_DRAW.winning}</b>
          <small>{MARKS[LAST_DRAW.winning - 1].icon} {MARKS[LAST_DRAW.winning - 1].name}</small>
        </div>
        <div className="bonus">
          {(Object.keys(LAST_DRAW.bonus) as Tier[]).map((k) => (
            <span key={k} className={`bonus-pill ${LAST_DRAW.bonus[k] ? "hit" : ""}`}>{k}{LAST_DRAW.bonus[k] ? " ✓" : ""}</span>
          ))}
        </div>
        <div className="trail">
          {LAST_DRAW.trail.map((n) => (<span key={n} className="mini">{n}</span>))}
        </div>
      </div>
    </div>
  );

  const gridHead = (
    <div className="grid-head">
      <h2>Pick your lucky numbers</h2>
      <button className="lucky" onClick={luckyPick}>🎲 Lucky Pick</button>
    </div>
  );

  const legend = <p className="legend"><span className="flame">🔥</span> Hot number — payout reduced · Payouts shown per 1 stake</p>;

  const numberGrid = (
    <>
      <div className="grid card" role="group" aria-label="Lucky numbers 1 to 36">
        {MARKS.map(({ n, icon, name }) => ballBtn(n, icon, name))}
      </div>
      {legend}
    </>
  );

  const chartBoard = (
    <>
      <div className="chart" role="group" aria-label="Marks 1 to 36">
        {MARKS.map(({ n, icon, name }) => {
          const on = picks.includes(n);
          const hot = n in HOT;
          return (
            <button key={n} data-c={ROULETTE_RED.has(n) ? "r" : "b"} onClick={() => toggle(n)} aria-pressed={on} aria-label={`${n} ${name}, pays ${payoutFor(n)} to 1`}
              className={`mark ${on ? "on" : ""} ${hot ? "hot" : ""} ${pop === n ? "pop" : ""} ${spinning === n ? "spin" : ""}`}>
              <span className="ball mark-n"><span className="ball-num">{n}</span></span>
              <span className="mark-icon">{icon}</span>
              <span className="mark-name">{name}</span>
              <span className="mark-pay">{hot && "🔥 "}{money(payoutFor(n))}</span>
              {on && <span className="mark-tick">✓</span>}
            </button>
          );
        })}
      </div>
      {legend}
    </>
  );

  const wheelBoard = (
    <div className="wheel-wrap">
      <div className="wheel" role="group" aria-label="Lucky numbers wheel">
        <div className="wheel-rim" aria-hidden />
        {WHEEL.map((n, i) => {
          const m = MARKS[n - 1];
          const on = picks.includes(n);
          return (
            <button key={n} data-c={ROULETTE_RED.has(n) ? "r" : "b"} onClick={() => toggle(n)} aria-pressed={on} aria-label={`${n} ${m.name}, pays ${payoutFor(n)} to 1`}
              style={{ "--a": `${i * 10}deg` } as CSSProperties}
              className={`ball-wrap wheel-num ${on ? "on" : ""} ${n in HOT ? "hot" : ""} ${pop === n ? "pop" : ""} ${spinning === n ? "spin" : ""}`}>
              <span className="ball"><span className="ball-num">{n}</span>{n in HOT && <span className="flame">🔥</span>}</span>
            </button>
          );
        })}
        <div className="wheel-center">
          <MiniClock remaining={Math.max(0, remaining)} ready={clock.ready} />
          <div className="wheel-pot">{pot}</div>
          <button className="lucky" onClick={luckyPick}>🎲 Spin a number</button>
        </div>
      </div>
      <p className="legend">Tap the wheel to pick · 🔥 hot numbers pay less · Order matches a roulette wheel</p>
    </div>
  );

  const stakeControls = (
    <>
      <div className="tiers">
        <div className="stake-label">Attach bonus</div>
        <div className="tier-row">
          {ATTACH_TIERS.map((t) => (
            <button key={t.id} className={`tier ${tier === t.id ? "on" : ""}`} onClick={() => { fx.chip(); setTier(t.id); }}>
              <b>{t.id}</b><span>{t.odds}:1</span>
            </button>
          ))}
        </div>
      </div>
      <StakeRow label="Base stake (TTD)" value={base} onChange={setBase} />
      <StakeRow label="Attach stake (TTD)" value={attach} onChange={setAttach} allowOff />
    </>
  );

  const pickChips = picks.length === 0 ? (
    <span className="hint">Tap numbers to build your ticket</span>
  ) : (
    <>
      {picks.map((n) => (<button key={n} className="pick" onClick={() => toggle(n)} title="Remove">{n}<small>×</small></button>))}
      {picks.length >= 3 && <span className="combo">🔥 {picks.length} NUMBER COMBO</span>}
    </>
  );

  const slip = (
    <aside className={`slip ${open ? "open" : ""} ${shake ? "shake" : ""}`}>
      <button className="slip-grab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle stake settings"><i /></button>
      <div className="slip-picks">{pickChips}</div>
      <div className="slip-body">{stakeControls}</div>
      <div className="slip-sum">
        <div><span>Total stake</span><b>TT${money(total)}</b></div>
        <div className="win"><span>Win up to</span><b key={maxWin}>TT${money(maxWin)}</b></div>
      </div>
      <div className="slip-actions">
        <button className="btn ghost" onClick={() => { setPicks([]); fx.drop(); }}>Cancel</button>
        <button className="btn ghost" onClick={() => { setPicks([12, 22, 8]); fx.chip(); say("Loaded your last ticket"); }}>Recent</button>
        <button className="btn lock" onClick={lockIn} disabled={locked}>
          <span>{locked ? "DRAW CLOSED" : "LOCK IT IN"}</span>
          <small>{picks.length ? `TT$${money(total)}` : "pick a number"}</small>
        </button>
      </div>
    </aside>
  );

  const goNext = () => {
    if (step === 0 && !picks.length) { setShake(true); setTimeout(() => setShake(false), 500); say("Pick at least one lucky number"); return; }
    fx.chip();
    setStep((x) => Math.min(2, x + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepsBody = (
    <>
      <ol className="stepper">
        {STEP_NAMES.map((nm, i) => (
          <li key={nm} className={i === step ? "cur" : i < step ? "done" : ""}>
            <button onClick={() => (i === 0 || picks.length) && setStep(i)} aria-current={i === step}>
              <i>{i < step ? "✓" : i + 1}</i><span>{nm}</span>
            </button>
          </li>
        ))}
      </ol>
      {step === 0 && (<>{gridHead}{numberGrid}</>)}
      {step === 1 && (
        <div className="card step-card">
          <h2>Set your stakes</h2>
          <div className="slip-picks wrap">{pickChips}</div>
          {stakeControls}
          <div className="slip-sum"><div><span>Per number</span><b>TT${money(base + attach)}</b></div><div className="win"><span>Total stake</span><b>TT${money(total)}</b></div></div>
        </div>
      )}
      {step === 2 && (
        <div className="card step-card receipt">
          <h2>Review your ticket</h2>
          <p className="stub-sub">{DRAWS[sel].label} · Issue #{issue}</p>
          <ul className="review">
            {sorted.map((n) => (
              <li key={n}>
                <span className="ball mark-n"><span className="ball-num">{n}</span></span>
                <div><b>{MARKS[n - 1].icon} {MARKS[n - 1].name}</b><small>Base {money(base)} × {payoutFor(n)} · {tier} {money(attach)} × {odds}</small></div>
                <em>TT${money(base * payoutFor(n) + attach * odds)}</em>
              </li>
            ))}
          </ul>
          <div className="slip-sum"><div><span>Total stake</span><b>TT${money(total)}</b></div><div className="win"><span>Win up to</span><b>TT${money(maxWin)}</b></div></div>
        </div>
      )}
    </>
  );

  const stepBar = (
    <div className={`stepbar ${shake ? "shake" : ""}`}>
      <button className="btn ghost" onClick={() => (step === 0 ? setPicks([]) : setStep(step - 1))}>{step === 0 ? "Clear" : "Back"}</button>
      <div className="stepbar-sum"><span>{picks.length} picked</span><b>TT${money(total)}</b></div>
      {step < 2 ? (
        <button className="btn lock" onClick={goNext}><span>CONTINUE</span><small>{STEP_NAMES[step + 1]}</small></button>
      ) : (
        <button className="btn lock" onClick={lockIn} disabled={locked}><span>{locked ? "DRAW CLOSED" : "LOCK IT IN"}</span><small>TT${money(total)}</small></button>
      )}
    </div>
  );

  return (
    <div className={`app layout-${layout} ${urgent ? "urgent" : ""} ${mounted ? "" : "hydrating"}`}>
      <Confetti burst={burst} />
      <div className="aurora" aria-hidden />

      {/* Live winners ticker */}
      <div className="ticker" aria-hidden>
        <div className="ticker-track">
          {[...MOCK_WINNERS, ...MOCK_WINNERS].map((w, i) => (<span key={i}><b>🏆</b> {w}</span>))}
        </div>
      </div>

      <div className="pickers">
        <nav className="themes" aria-label="Layout">
          <span>LAYOUT</span>
          {LAYOUTS.map((l) => (
            <button key={l.id} className={`theme-btn ${layout === l.id ? "on" : ""}`} aria-pressed={layout === l.id} onClick={() => { fx.chip(); setLayout(l.id); }}>
              <i className="glyph">{l.glyph}</i>{l.name}
            </button>
          ))}
        </nav>
        <nav className="themes" aria-label="Template">
          <span>TEMPLATE</span>
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-btn ${theme === t.id ? "on" : ""}`} aria-pressed={theme === t.id} onClick={() => { fx.chip(); setTheme(t.id); }}>
              <i style={{ background: t.swatch }} />{t.name}
            </button>
          ))}
        </nav>
      </div>

      <header className="top">
        <div className="brand">
          <div className="logo">W</div>
          <div>
            <h1>WHE KING</h1>
            <p>Single Number · Issue <b>#{issue}</b></p>
          </div>
        </div>
        <div className="top-actions">
          <div className="bal" title="Demo balance">
            <span>BALANCE</span>
            <b>TTD {money(balance)}</b>
          </div>
          <button className="icon-btn" onClick={() => setMute((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🔊"}</button>
        </div>
      </header>

      <main className="layout">
        <section className="col-main">
          {layout === "grid" && (<>{hero}{tabs}{last}{gridHead}{numberGrid}</>)}
          {layout === "chart" && (<>{hero}{tabs}{last}{gridHead}{chartBoard}</>)}
          {layout === "wheel" && (<>{tabs}{wheelBoard}{last}</>)}
          {layout === "steps" && (<>{hero}{tabs}{stepsBody}</>)}
        </section>
        {layout !== "steps" && slip}
      </main>
      {layout === "steps" && stepBar}

      <footer className="foot">
        Prototype only — no real money, no real draws. 18+ · Play responsibly.
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}

      {ticket && (
        <div className="modal" onClick={() => setTicket(null)}>
          <div className="stub" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ticket locked in">
            <div className="stamp">LOCKED IN</div>
            <h3>You&apos;re in the draw!</h3>
            <p className="stub-sub">{ticket.draw} · Issue #{ticket.issue}</p>
            <div className="stub-balls">
              {ticket.picks.map((n, i) => (
                <span key={n} className="stub-ball" style={{ animationDelay: `${i * 90}ms` }}>
                  {n}<small>{MARKS[n - 1].icon}</small>
                </span>
              ))}
            </div>
            <dl>
              <div><dt>Base</dt><dd>TT${money(ticket.base)} ×{ticket.picks.length}</dd></div>
              <div><dt>Attach ({ticket.tier})</dt><dd>TT${money(ticket.attach)} ×{ticket.picks.length}</dd></div>
              <div><dt>Total</dt><dd>TT${money(ticket.total)}</dd></div>
              <div className="big"><dt>Win up to</dt><dd>TT${money(ticket.max)}</dd></div>
            </dl>
            <code>{ticket.id}</code>
            <button className="btn lock" onClick={() => { setTicket(null); setPicks([]); setOpen(false); setStep(0); }}><span>PLAY AGAIN</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
