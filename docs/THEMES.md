# Lentopallo — Theme Specification

Design tokens for dark and light themes. Both share fonts, spacing, and layout — only CSS custom properties change. Theme toggle button (moon/sun) persists choice to `localStorage` key `lentopallo-theme`.

## Shared

| Property | Value |
|----------|-------|
| Body font | `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif` |
| Mono font | `'DM Mono', 'SF Mono', 'Cascadia Code', monospace` |
| Google Fonts | `DM+Mono:wght@400;500` + `Plus+Jakarta+Sans:wght@400;500;600;700` |
| Min contrast | WCAG AA (4.5:1) for all text on its background |
| Touch targets | 48px minimum |
| Border radius | 6–14px (buttons 8px, cards 10–12px, score buttons 14px) |

## Dark Theme (default — "Broadcast Dark")

Neutral grays, no blue cast. Accent colors are bright/saturated for contrast on dark surfaces.

```css
:root {
  --bg: #1c1c1c;
  --surface: #262626;
  --surface2: #303030;
  --surface3: #3a3a3a;
  --glass: rgba(34, 211, 238, 0.06);

  --border: #404040;
  --border2: #565656;
  --border-glow: rgba(34, 211, 238, 0.25);

  --text: #f0f0f0;       /* 15.0:1 on bg — AAA */
  --text2: #bfbfbf;      /*  9.3:1 on bg — AAA */
  --text3: #8e8e8e;      /*  5.2:1 on bg — AA  */

  --cyan: #22d3ee;       /*  9.6:1 on bg — AAA */
  --cyan-dim: rgba(34, 211, 238, 0.15);
  --blue: #3b82f6;
  --green: #34d399;      /*  9.1:1 on bg — AAA */
  --green-dim: rgba(52, 211, 153, 0.12);
  --red: #f87171;        /*  6.3:1 on bg — AA  */
  --red-dim: rgba(248, 113, 113, 0.12);
  --amber: #fbbf24;      /* 10.4:1 on bg — AAA */
  --amber-dim: rgba(251, 191, 36, 0.12);

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4);
  --shadow-glow-cyan: 0 0 20px rgba(34, 211, 238, 0.15), 0 0 4px rgba(34, 211, 238, 0.3);
  --shadow-glow-green: 0 0 20px rgba(52, 211, 153, 0.15), 0 0 4px rgba(52, 211, 153, 0.3);
  --shadow-glow-red: 0 0 20px rgba(248, 113, 113, 0.15), 0 0 4px rgba(248, 113, 113, 0.3);

  --overlay: rgba(0, 0, 0, 0.7);
  --score-btn-text: #fff;
  --grain-opacity: 0.03;
  --popup-glow: 0 0 20px currentColor;
  --green-gradient: #059669;
  --red-gradient: #dc2626;
}
```

### Dark theme details

- Grain overlay: SVG feTurbulence at 3% opacity on `body::before`
- Score popup: neon glow via `text-shadow: 0 0 20px currentColor`
- Rotate button: `linear-gradient(135deg, var(--cyan), var(--blue))`
- Score +1: `linear-gradient(135deg, var(--green), var(--green-gradient))`
- Score -1: `linear-gradient(135deg, var(--red), var(--red-gradient))`
- Court cell hover: cyan border glow via `--shadow-glow-cyan`
- Net line: dashed repeating-linear-gradient with `--text2` at 0.8 opacity
- Overlays: `backdrop-filter: blur(4px)` over `var(--overlay)`

## Light Theme (current — "Hunaja Warm")

Warm cream background, hunaja-yellow court cells, murrettu accents. Warm navy rotation button.

```css
[data-theme="light"] {
  --bg: #f5f3ef;
  --surface: #f5e6c8;         /* hunaja court cells */
  --surface2: #e8e2d8;
  --surface3: #ddd6ca;
  --glass: rgba(45, 92, 84, 0.06);

  --border: #c8bfb0;
  --border2: #a09688;
  --border-glow: rgba(45, 92, 84, 0.20);

  --text: #1a1a1a;            /* 15.7:1 on bg — AAA */
  --text2: #4a4040;           /*  9.0:1 on bg — AAA */
  --text3: #6b6058;           /*  5.5:1 on bg — AA  */

  --cyan: #0f766e;            /* teal accent (focus, hovers, active set) */
  --cyan-dim: rgba(15, 118, 110, 0.12);
  --blue: #115e58;
  --green: #2d8659;           /* murrettu green +1 button */
  --green-dim: rgba(45, 134, 89, 0.08);
  --red: #a33030;             /* murrettu red -1 button */
  --red-dim: rgba(163, 48, 48, 0.08);
  --amber: #7a5818;           /* murrettu amber */
  --amber-dim: rgba(122, 88, 24, 0.08);

  --rotate-from: #3d5288;     /* warm navy rotation button */
  --rotate-to: #2f4070;
  --green-gradient: #237548;
  --red-gradient: #8a2424;
}
```

### Light theme fixed indicator colors (CSS overrides)

These override `--red`/`--cyan`/`--amber` for specific elements to keep them vivid:

| Element | Color | Purpose |
|---------|-------|---------|
| `.role-dot.libero` | `#dc2626` | Vivid red dot on court |
| `.role-dot.passari` | `#2563eb` | Vivid blue dot on court |
| `.serve-ticks` | `#c2710c` | Orange serve indicators |
| `.streak-badge` | `#c2710c` | Orange streak markers |

### Light theme details

- No grain overlay (`--grain-opacity: 0`)
- No score popup glow (`--popup-glow: none`)
- Warm overlay backdrop (`rgba(40, 30, 15, 0.3)`)
- Warm shadow tint (`rgba(80,60,30,...)`)

---

## Archived: "Crisp Gray" Light Theme (v1)

Previous light theme — neutral grays, no warmth. Kept for reference.

```css
[data-theme="light"] {
  --bg: #eeeeee;
  --surface: #fafafa;
  --surface2: #e0e0e0;
  --surface3: #d2d2d2;

  --border: #b8b8b8;
  --border2: #909090;

  --text: #0a0a0a;
  --text2: #303030;
  --text3: #555555;

  --cyan: #0e7490;
  --blue: #1d4ed8;
  --green: #047857;
  --red: #b91c1c;
  --amber: #b45309;
}
```

## Switching

Dark is default (`:root`). Light activates via `data-theme="light"` on `<html>`.

```js
// Toggle
const isLight = document.documentElement.dataset.theme === 'light'
if (isLight) {
  delete document.documentElement.dataset.theme
  localStorage.setItem('lentopallo-theme', 'dark')
} else {
  document.documentElement.dataset.theme = 'light'
  localStorage.setItem('lentopallo-theme', 'light')
}

// Restore on load
const saved = localStorage.getItem('lentopallo-theme')
if (saved === 'light') document.documentElement.dataset.theme = 'light'
```

## Color semantics (both themes)

| Role | Dark | Light | Usage |
|------|------|-------|-------|
| Positive | `#34d399` | `#047857` | +1 score, success states |
| Negative | `#f87171` | `#b91c1c` | -1 score, destructive confirmations |
| Primary action | `#22d3ee` | `#0e7490` | Rotate button, active set, focus rings |
| Navigation | `#3b82f6` | `#1d4ed8` | Links, secondary actions |
| Serve indicator | `#fbbf24` | `#b45309` | Serve ticks, streak badges |
