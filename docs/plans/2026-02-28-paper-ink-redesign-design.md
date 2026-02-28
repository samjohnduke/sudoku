# Paper & Ink — Minimal Refined Redesign

## Aesthetic Direction

Sudoku on fine stationery. The app feels like an elegant notebook — warm cream paper, precise ink-black numbers, one understated accent. Every element earns its place.

## Typography

- **Display/Logo:** DM Serif Display — serif character for "ink on paper" feel
- **Board numbers:** JetBrains Mono — precise, tabular, mathematical
- **Body/UI:** DM Sans — geometric, clean, pairs with the serif

## Color Palette

### Light Mode
- Background (linen): `hsl(40, 30%, 97%)`
- Foreground (ink): `hsl(30, 10%, 12%)`
- Accent (slate-blue): `hsl(220, 25%, 50%)`
- Muted text: `hsl(30, 10%, 55%)`
- Board thick lines: ink at 50% opacity
- Board thin lines: ink at 15% opacity
- Selected cell: accent at 12% opacity
- Same row/col/box: ink at 3% opacity
- Highlighted matching: accent at 8% opacity
- Error: `hsl(0, 55%, 55%)`
- Success: `hsl(150, 30%, 45%)`

### Dark Mode
- Background: deep warm charcoal `hsl(30, 8%, 10%)`
- Foreground: warm cream `hsl(40, 15%, 88%)`
- Accent: brighter slate-blue `hsl(220, 35%, 62%)`
- Muted: `hsl(30, 8%, 50%)`
- Card/surface: `hsl(30, 8%, 13%)`
- Board thick lines: foreground at 45% opacity
- Board thin lines: foreground at 12% opacity

## Play Screen (Core Experience)

Fully immersive — no header or bottom nav during gameplay.

### Layout (top to bottom)
1. **Floating info bar:** Back arrow (left), difficulty label (center), timer mono (right). Small, quiet text.
2. **Board:** Hero element. Full width minus small padding. Square aspect ratio. Thick 2-3px lines between 3x3 boxes, thin 1px between cells.
3. **Hint card:** Only visible when hint requested. Subtle accent border.
4. **Mode toggle:** Pill-shaped segmented control (Value / Corner / Center). Filled indicator slides between options.
5. **Number pad:** 4-column grid. Numbers are text on rounded-rect backgrounds, no borders. Row 1: 1-4, Row 2: 5-8, Row 3: 9, delete icon, undo icon, redo icon.

### Cell States
- Selected: accent fill at 12%
- Same row/col/box: barely-there 3% tint
- Highlighted (matching number): accent at 8%
- Hint: warm amber tint
- Error: muted rose text
- Initial (given): bold ink
- User-entered: accent color text

### Completion
Board cells do a staggered ripple animation, then a centered overlay slides up with time and "New Puzzle" button.

## Home Screen

### Layout (centered, vertically stacked)
1. **Logo:** "SUPER SUDOKU" in DM Serif Display, large, letter-spaced, two lines
2. **Resume card:** Only if in-progress puzzle exists. Shows difficulty + elapsed time + resume button.
3. **Difficulty chips:** Tappable pills (Beginner / Easy / Medium / Hard / Expert). Selected one is filled with accent, others are outlined.
4. **New Puzzle button:** Wide primary CTA
5. **Bottom nav:** Visible on home (hidden on play)

No total puzzle count. No slider.

## Bottom Navigation (Mobile)

- Icons + labels using Lucide icons
- Tabs: Play (grid-3x3), Learn (book-open), Stats (bar-chart-2), Settings (settings)
- "Bible" renamed to "Learn"
- Active: accent color icon + label. Inactive: muted grey
- Thin top border, frosted glass (backdrop-blur)
- Hidden on play screen

## Desktop Header

Same links as bottom nav, horizontal layout. Serif logo left, nav center/right. Frosted glass sticky header.

## Settings & Stats Pages

Same structure, new design language:
- Warm paper background, ink typography
- Cards: very subtle 1px borders at 8% opacity
- Section headings in DM Serif Display
- Switches use accent color
- Charts use new palette

## Bible/Learn Pages

- Rename "Bible" to "Learn" throughout
- Same card-list structure, refined typography
- Category badges use subtle fills instead of outlined badges

## Micro-interactions (CSS-only)

- **Cell tap:** scale pulse 0.95 -> 1.0, 100ms
- **Number entry:** fade-in + scale-up 0 -> 1, 150ms ease-out
- **Number pad tap:** background briefly brightens then fades
- **Page transitions:** simple 200ms fade between routes
- **Mode toggle:** filled indicator slides smoothly
- **Completion ripple:** staggered cell animation via animation-delay

## Fonts to Load

```
https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap
```
