# Whe King — prototype

A Play Whe–style lucky-number game, rebuilt with a high-energy UI. **Prototype only: nothing is wired to a backend, no real money, no real draws.** Everything on screen is mock data and client-side state.

```bash
npm install
npm run dev     # http://localhost:3000
```

Stack: Next.js (App Router) · TypeScript · Tailwind v4 (plus hand-written CSS) · no other runtime deps.

## Templates

Switch live with the **Template** bar at the top, or deep-link with `?theme=`:

| `?theme=` | Name | Look |
|---|---|---|
| `gold` | Midnight Gold | Glossy Vegas-night gold, violet/pink glow (the original look) |
| `felt` | Green Felt | Card-table baize, ivory casino chips with edge spots, brass trim, red lock button |
| `deco` | Noir Deco | Black + champagne gold, Art Deco chamfered corners, onyx pieces |
| `velvet` | Red Velvet | Crimson velvet, roulette red/black numbers, ivory selection, brass |
| `booth` | Heritage Booth | Light cream paper, ink outlines, hard shadows, old lottery-booth ticket |

The choice is saved in `localStorage`. Themes are pure CSS tokens in `app/globals.css` (base) and `app/themes.css` (overrides), so adding a sixth is one block.

## What it does (UI only)

- **Countdown timer** to the next draw (10:30 AM / 1:00 PM / 4:00 PM / 7:00 PM, Trinidad time). Goes gold → amber → red; final 10 seconds add a pulsing red vignette and tick sound.
- **Draw tabs** with CLOSED / NEXT / OPEN states and a per-draw issue number.
- **Last draw** strip: winning number, MB/MU/MX bonus hits, recent trail.
- **36-number grid** with glossy balls, per-number payout (35.00), "hot" numbers with reduced payout (like #21 on the original), and each number's traditional mark.
- **Bet slip**: Base stake + Attach stake (chips 1–100 or custom), attach tier MB 70:1 / MU 100:1 / MX 125:1, live total stake and "win up to".
- **Cancel / Recent / Lock it in**. Locking in drops a confetti burst and a stamped ticket.
- **Lucky Pick** slot-style random pick, winners ticker, sound + haptics (mute toggle).

## Notes / assumptions to verify

- The mark names/icons in `lib/data.ts` are from memory; check them against the official chart.
- MB/MU/MX meaning, "win up to" maths and the hot-number payouts are my reading of the original screenshots, not real game rules.
- Total stake = (base + attach) × numbers picked.
