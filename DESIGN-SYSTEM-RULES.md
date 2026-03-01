# Soundmap Time Capsule — Design System Rules

A concise guide to applying the design system across all components.

---

## Color Palette

### Backgrounds
- `bg-bg-primary` — Main background (#1A1815, warm dark)
- `bg-bg-secondary` — Secondary fill (#242218, slightly lighter)
- `bg-surface` — Card/panel surface (#2D2823, prominent)
- `bg-surface-hover` — Surface hover state (#363129)

### Text Hierarchy
- `text-text-primary` — Headlines, primary text (#F5F0EB, warm cream)
- `text-text-secondary` — Body text, labels (#9A9389, muted)
- `text-text-muted` — Captions, disabled text (#7A7169, very muted)

### Accent (Forest Green)
- `text-accent` — Primary action, highlights (#3D7850)
- `text-accent-secondary` — Deeper shade for hover (#2F5F40)
- `text-accent-light` — Lighter shade for tags (#5A9668)

### Borders & Status
- `border-border` — Default border color (#3A342F)
- `border-border-strong` — Emphasized borders (#4A423D)
- `text-error` — Error text (#D97563)

---

## Typography

### Headings
```
Use: font-serif text-text-primary
Sizes: text-5xl (h1), text-3xl (h2), text-xl (h3)
Weight: Default (400) — serif carries the elegance
```

### Body Text
```
Use: font-sans text-text-secondary or text-text-primary
Sizes: text-base (default), text-sm (secondary)
Weight: 400 (regular), 500 (emphasis)
```

### Stats & Metrics
```
Use: font-mono-stat text-accent (for numerical values)
Apply: font-variant-numeric: tabular-nums (automatic via .font-mono-stat)
Sizes: text-lg, text-sm, text-xs
```

### Labels & Overlines
```
Use: .label-overline class (includes uppercase, tracking, font-medium)
Or manually: text-text-secondary text-xs uppercase tracking-widest font-medium
```

---

## Components

### Cards & Surfaces
```
Use: .surface-card + .surface-card-hover
Applies: bg-surface border border-border rounded-md
Add hover with: .surface-card-hover
```

### Buttons
```
Primary action: .btn-accent (green fill, white text)
Secondary: .btn-ghost (border, transparent fill, hover fill)
```

### Tags & Badges
```
Use: .tag-accent
Applies: px-3 py-1 bg-accent/20 text-accent-light rounded-full border border-accent/30
```

### Track Rows & Lists
```
Use pattern: flex items-start gap-3 p-3 rounded-md bg-surface hover:bg-surface-hover transition-colors
Or create: .card-row utility if repeating
```

### Borders
```
Default: border border-border (all sides)
Strong emphasis: border border-border-strong
No color modifier: border inherits from token
```

---

## Spacing & Radius

### Radius Scale
```
xs: 2px   — minimal radius
sm: 4px   — small elements
md: 8px   — default (cards, buttons)
lg: 12px  — large surfaces
pill: 9999px — badges, tags
```

### Spacing
- Use Tailwind defaults: px-4, py-3, gap-4, mb-6, etc.
- Consistent padding: 3 (12px) or 4 (16px) for cards
- Consistent gaps: 3 (12px) or 4 (16px) between elements

---

## Animation & Motion

### Fade Transitions
```
Root screen entry: initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
Content stagger: delay: 0.1, 0.2, 0.3, ... (100ms increments)
```

### Micro-animations
```
Track rows (slide in from left): initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
Card reveal (from below): initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
Spring underlines: layoutId="tab-indicator" (for animated underlines)
```

### Transition Timing
```
Hover/focus: transition-colors (150ms default)
Modal/panel open: duration: 0.3
Screen transitions: duration: 0.4
```

---

## Texture & Aesthetic

### Pixelated Grain
- Applied via `.grain-overlay` class (on root motion.div)
- Visible halftone pattern (editorial/print aesthetic)
- Opacity: 6% (subtle but present)
- Purpose: Adds texture, warmth, tactile feel

### Gradients
```
Background fills: bg-gradient-to-br from-bg-primary to-bg-secondary
Panel highlights: bg-gradient-to-r from-accent/10 to-accent/5
```

---

## Accessibility & Contrast

✓ All text uses `text-text-primary` or `text-text-secondary` for sufficient contrast
✓ Accent color (#3D7850) passes WCAG AA on dark surfaces
✓ Error color (#D97563) passes WCAG AA on dark surfaces
✓ Focus states should use `ring-2 ring-accent` (border outline)

---

## Application Checklist

When applying this system to a component:

- [ ] Replace hardcoded colors with tokens (`text-accent`, `bg-surface`, etc.)
- [ ] Use `.label-overline` for all labels and section titles
- [ ] Use `.font-mono-stat text-accent` for all numeric/stat values
- [ ] Apply `.surface-card + .surface-card-hover` to all panels/cards
- [ ] Use `.tag-accent` for all badges (or create accent/secondary variants)
- [ ] Check contrast ratios on custom colors
- [ ] Ensure pixelated grain is visible and adds to the aesthetic (not competing)
- [ ] Motion: fade entries, directional micro-animations, spring for interactive elements

---

## Design Tokens Quick Reference

```css
/* Use these in className strings */
Backgrounds:  bg-bg-primary, bg-bg-secondary, bg-surface, bg-surface-hover
Text:         text-text-primary, text-text-secondary, text-text-muted
Accent:       text-accent, text-accent-secondary, text-accent-light
Borders:      border-border, border-border-strong
Status:       text-error
```

```css
/* Use these utilities */
.glass-panel — blur backdrop
.surface-card — surface with border
.accent-glow — box-shadow glow
.font-mono-stat — monospace tabular nums
.label-overline — uppercase label style
.tag-accent — green badge/pill
.btn-accent — primary button
.btn-ghost — secondary button
.grain-overlay — visible pixelated texture
```
