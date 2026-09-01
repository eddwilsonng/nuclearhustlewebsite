# Nuclear Hustle Design

## Product character

Nuclear Hustle is a specialist operating surface for nuclear careers, not a
generic SaaS job board.

The visual signature is **nuclear operations manual meets modern editorial
marketplace**:

- warm cream canvas
- graphite typography
- safety yellow reserved for decisive action
- sharp geometry and precise rules
- real plant, shift, location, credential, and reactor context
- confident editorial scale with compact operational metadata

Linear, Vercel, Attio, Mercury, Raycast, Ramp, Resend, and Stripe set the
quality bar for hierarchy, interaction, and finish. They are not visual
templates. Nuclear Hustle must remain recognisable with the logo removed.

## Experience principles

1. **Answer the user's decision first.** A job page first answers: is this role
   relevant, am I qualified, and how do I apply?
2. **One dominant action.** Yellow marks the primary candidate action. Secondary
   actions never compete with Apply or Browse jobs.
3. **Information creates personality.** Plant identifiers, shift patterns,
   credentials, map coordinates, and status language are stronger brand
   material than decorative effects.
4. **Two reading speeds.** Headlines, facts, and CTAs support a fast scan. Clear
   sections and readable prose support careful review.
5. **Still by default.** Motion only confirms an action, explains state, or
   preserves spatial continuity.
6. **Accessibility is visual quality.** WCAG 2.2 AA is the floor, not a cleanup
   pass.

## Visual system

### Colour

All UI colour must use semantic tokens from `src/app/globals.css`.

| Role | Token | Value |
| --- | --- | --- |
| Canvas | `--canvas` | `#EDE8DF` |
| Secondary surface | `--surface` | `#E5DFD5` |
| Raised surface | `--surface-raised` | `#F7F4EE` |
| Primary text | `--ink` | `#1C1917` |
| Secondary text | `--ink-secondary` | `#57534E` |
| Muted decoration | `--ink-muted` | `#78716C` |
| Decorative rule | `--rule` | `#CFC8BC` |
| Interactive border | `--control-border` | `#78716C` |
| Primary action | `--signal` | `#FACC15` |
| Primary action hover | `--signal-hover` | `#FDE047` |
| Focus | `--focus` | `#1C1917` |
| Inverse surface | `--inverse` | `#1C1917` |
| Inverse text | `--inverse-ink` | `#F5F2EB` |

Rules:

- Normal text must meet 4.5:1 contrast.
- UI boundaries and focus indicators must meet 3:1 contrast.
- Pale rules are decorative only and never define an input by themselves.
- Yellow is a fill or supporting mark, not body/link text on cream.
- Never communicate status by colour alone.

### Typography

Geist Sans carries reading and hierarchy. Geist Mono carries operational
texture.

| Role | Face | Minimum treatment |
| --- | --- | --- |
| Display | Sans | responsive `40–64px`, tight leading |
| Page title | Sans | responsive `32–48px`, tight leading |
| Section title | Sans | `24–32px` |
| Card/job title | Sans | `16px`, semibold |
| Body/description | Sans | `16px`, `1.65` line-height |
| Compact UI | Sans | `14px`, `1.45` line-height |
| Metadata/identifier | Mono | `12px`, normal case by default |
| Eyebrow/status label | Mono | `12px`, uppercase only when short |

Do not use 9px or 10px text. Do not set long prose, job titles, or navigation
in Mono. Keep reading lines near 60–68 characters.

### Layout

- Shared content width: `72rem`.
- Desktop grid: 12 columns. Tablet: 6. Mobile: 4.
- Mobile source order is the reading order.
- Use spacing and alignment before borders or cards.
- A surface must represent interaction, selection, warning, or a real grouping.
- Keep sharp corners. Circles are allowed only for genuinely circular controls
  or indicators.
- One subtle elevation is allowed for sticky conversion surfaces and overlays.

### Motion

- CSS transitions first; no baseline animation library.
- Interactive transitions: 100–180ms.
- Drawers and dialogs: up to 240ms.
- Animate explicit properties, never `transition: all`.
- No scroll reveals, marquees, parallax, pulsing decoration, typing effects, or
  animated keyboard actions.
- Under `prefers-reduced-motion: reduce`, remove transforms and nonessential
  transitions.

### Nuclear motif kit

Use selectively:

- plant/site identifiers and coordinates
- operational status language
- shift, travel, clearance, and licence data
- restrained technical linework
- simplified plant silhouettes or diagrams
- tabular facts and section indexing where they improve navigation

Avoid hazard stripes, radiation-symbol wallpaper, atom icons, fake control
panels, terminal cosplay, and decorative gauges.

## Component contracts

### Primary button

- Yellow fill, graphite text, strong weight.
- Minimum 44px height.
- Visible 2px focus outline with canvas offset.
- Labels state the outcome: `Apply on Duke Energy`, not `Continue`.

### Secondary button

- Strong interactive border, primary or secondary text.
- Used for Save, Share, Post a job, and alternative navigation.
- Never visually equal to the primary action in the same region.

### Field

- Persistent visible label.
- 16px input text on mobile.
- Strong boundary plus visible focus outline.
- Help and error text are associated with the control.
- Errors and submission results use live-region semantics.

### Badge and fact

- Badges communicate a meaningful state such as Featured, Direct employer, or
  Verified active.
- Ordinary job facts are aligned text, not pills.
- Icons supplement labels and never replace them without an accessible name.

### Job card

- Semantic article with a title link and a sibling Save control.
- Never nest interactive controls.
- Prioritise title, company, location/site, salary, work mode, and freshness.
- Mobile retains Save and all decision-critical facts.

### Job detail

First viewport order:

1. company and listing status
2. job title
3. salary, location/site, work mode, schedule, and freshness
4. key requirement or credential
5. Apply, then Save and Share

Main content order:

1. good-fit facts
2. required credentials and qualifications
3. role summary
4. responsibilities
5. preferred qualifications
6. location, schedule, travel, and benefits
7. company context and related roles

Missing facts are omitted, never guessed.

### Navigation and overlays

- Use Base UI for Dialog, Drawer, Popover, Menu, and Combobox behaviour.
- Focus moves into overlays, remains trapped when modal, and returns to the
  trigger on close.
- Every navigation landmark has a unique accessible name.
- Active state uses `aria-current`; toggles expose their state.

## Accessibility baseline

- Exactly one `main` landmark and one descriptive `h1` per page.
- A skip link is the first focusable element.
- Ordered headings with no level jumps.
- Every interactive element is keyboard operable.
- Focus is always visible and not hidden by sticky UI.
- Pointer targets meet WCAG 2.2 AA; primary controls target 44px.
- Forms have labels, descriptions, errors, and status announcements.
- Layout reflows at 200% zoom without concealed content.
- The experience remains complete with reduced motion.
- Automated axe scans cover the homepage, listings, and job detail flows.

## Required workflow

Before implementing a new public component:

1. Name its user job and visual role.
2. Reuse an existing primitive or add a documented variant.
3. Include keyboard, focus, disabled, loading, error, empty, and narrow-screen
   states where applicable.
4. Test with real long Nuclear Hustle content.
5. Add or update its documented component state.

Do not introduce raw colour values, arbitrary type sizes, new radius/shadow
recipes, or a second headless component library.
