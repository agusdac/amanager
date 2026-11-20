---
name: Hilko
description: Your digital infrastructure map
colors:
  ink: "#1c1917"
  ink-hover: "#292524"
  ink-body: "#44403c"
  ink-soft: "#57534e"
  ink-muted: "#78716c"
  ink-faint: "#a8a29e"
  paper: "#fafaf9"
  card: "#ffffff"
  mist: "#f5f5f4"
  rule: "#e7e5e4"
  rule-strong: "#d6d3d1"
  confirmed: "#047857"
  confirmed-wash: "#ecfdf5"
  confirmed-line: "#a7f3d0"
  confirmed-ink: "#064e3b"
  notice-wash: "#fffbeb"
  notice-line: "#fde68a"
  fault: "#dc2626"
  fault-ink: "#b91c1c"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.025em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  base: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.card}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "8px 16px"
  button-wizard:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-wizard-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.card}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.base}"
    padding: "8px 12px"
  input-wizard:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink-hover}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  stepper-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  stepper-done:
    backgroundColor: "{colors.confirmed-wash}"
    textColor: "{colors.confirmed-ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  stepper-upcoming:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
---

# Design System: Hilko

## Overview

**Creative North Star: "The Field Notebook"**

Hilko looks like a field notebook for infrastructure facts. The page is warm paper. Entries sit on white cards, separated from the page by a thin stone rule. Actions are written in ink. The voice is quiet, literal, and warm: the screen records a fact and does not sell it.

Density is comfortable. A page title is 24px and semibold. Working text is 14px. Sections stack on a 32px rhythm inside a 64rem column. There is no display size and no custom typeface. The system font is the hand of the notebook.

Color is rationed. Ink is the only color that acts, and it is writing, not a brand accent. Green, amber, and red appear only when a state changes: confirmed, unfinished, or failed. Confirmed visual rejection: no chromatic brand accent, no gradient, and no colored app sidebar.

**Key Characteristics:**

- Warm paper with white cards and a 1px stone rule
- Ink as the only action color
- Status color used only for confirmed, unfinished, and failed
- Flat surfaces, with a hairline shadow as a rest
- System sans, 14px working text, 24px titles
- 4px corners on compact tools, 8px corners in the wizard

## Colors

The palette is a warm mineral gray. Chromatic color is a margin note, not a theme.

### Primary

- **Ink Stone** (#1c1917): Page titles, the primary action, the current wizard step, and the selected side of the locale switch.
- **Ink Hover** (#292524): The primary action on hover. Also the text on a mist chip.

### Neutral

- **Paper** (#fafaf9): The page background. At 80% opacity it tints inset groups and the wizard footer.
- **Card** (#ffffff): Cards, the header bar, fields, and secondary buttons.
- **Mist** (#f5f5f4): Hover fills, disabled fields, icon wells, chip grounds, and quiet dividers.
- **Rule** (#e7e5e4): Card borders, the header rule, and the focus ring.
- **Rule Strong** (#d6d3d1): Field borders and secondary button borders.
- **Ink Body** (#44403c): Form labels and list copy that should read as text.
- **Ink Soft** (#57534e): Navigation and supporting sentences.
- **Ink Muted** (#78716c): Meta lines, uppercase stat labels, and the border of a focused field.
- **Ink Faint** (#a8a29e): Optional marks, skipped rows, and the loading hint.

### Semantic

- **Confirmed Green** (#047857): The "saved" line in the wizard.
- **Confirmed Wash** (#ecfdf5): Ground of a completed stepper step.
- **Confirmed Line** (#a7f3d0): Border of a completed stepper step.
- **Confirmed Ink** (#064e3b): Text of a completed stepper step.
- **Notice Wash** (#fffbeb): Ground of the unfinished-onboarding banner.
- **Notice Line** (#fde68a): Border of that banner.
- **Fault Red** (#dc2626): Form and step errors.
- **Fault Ink** (#b91c1c): Destructive text, such as revert.

**The Ink Rule.** Ink Stone is the only action color. Green, amber, and red mark state. They never become a brand accent, a gradient, or a sidebar.

## Typography

**Display Font:** none. Page titles are the headline role.
**Body Font:** ui-sans-serif, system-ui, sans-serif
**Label/Mono Font:** the same sans for labels. ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas for imported text and raw previews.

**Character:** One plain system sans. Nothing is displayed larger than a page title. The notebook is read at working size.

### Hierarchy

- **Headline** (semibold, 24px / 1.5rem, line-height 32px / 2rem): The page title. The wizard title also tightens tracking to -0.025em. Other titles do not.
- **Title** (semibold, 18px / 1.125rem, line-height 28px / 1.75rem): Section headings inside a page or a wizard step. Some inventory sections drop to weight 500.
- **Body** (regular, 14px / 0.875rem, line-height 20px / 1.25rem): Navigation, form copy, buttons, and list rows. Wizard introductions may open the line-height to 1.625.
- **Label** (semibold, 12px / 0.75rem, line-height 16px / 1rem, tracking 0.025em, uppercase): Category labels in the wizard. Stat labels use the same size at regular weight, uppercase, in Ink Muted, without the extra tracking.
- **Mono** (regular, 12px / 0.75rem): CSV import and raw preview text only.

**The One Family Rule.** Interface text uses the system sans. Mono is for imported or raw text, never for labels or navigation.

## Layout

The page is a single column on warm paper, with a white header ruled off along the bottom. Header and main content share a 64rem measure (max-w-5xl) and 16px of side padding. The header is 12px tall in padding. The main column starts 32px below the header.

Page sections stack with 32px between them. Inside a card, padding is 16px on dashboard stats and list forms, 24px on auth forms, and 24px expanding to 32px from 640px wide on wizard steps. The wizard footer reverses its button order below that width and lays them in a row from 640px up.

Auth forms sit in a 28rem column. The wizard sits in a 48rem column. Dashboard counts are one column, two from 640px, and four from 1024px, with 16px gaps.

**The Narrow Page Rule.** App content stays inside 64rem. Auth stays inside 28rem. The wizard stays inside 48rem. Do not invent a wider canvas for an ordinary screen.

## Elevation & Depth

The notebook is flat. Depth comes from a change of tone and a 1px rule: Paper behind, Card on top, Rule between them. Buttons do not rise, and nothing gains a shadow on hover.

A hairline rest shadow appears under auth forms, the wizard shell, and wizard fields. Dashboard stat cards and list rows do not use it. Disabled primary buttons fade to 60% opacity. Disabled fields fill with Mist.

### Shadow Vocabulary

- **Rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): A hairline under auth cards, the wizard shell, and wizard fields. It is present at rest. It does not grow on hover.

**The Flat-By-Default Rule.** Surfaces are flat. Separate them with a 1px rule and a tone change. The rest shadow never becomes a lift.

## Shapes

Corners are small and squared to the notebook. Compact tools — auth, home, and inventory buttons and fields — use a 4px corner. The locale switcher's outer shell uses 6px; its selected segment uses 4px. Wizard controls, cards, list rows, and stepper cells use 8px. The wizard shell alone uses 12px. Chips and the small numbered wells in the wizard welcome use a pill.

Borders are 1px. Empty wizard groups use a dashed Rule. Icons are project-owned strokes on a 24px grid, 1.75px wide, with round caps and joins, colored with currentColor. Decorative icons stay hidden from assistive tech. A control that is only an icon needs an accessible name on the control.

**The Two Corners Rule.** Compact tools stay at 4px. The wizard stays at 8px, and its shell at 12px. Do not introduce a third family of corners.

## Components

Buttons, cards, and fields are restrained and literal. A button is a solid ink rectangle. A card is a white sheet with a rule. A field sits on the paper. Nothing glows, and nothing lifts.

### Buttons

- **Shape:** Compact actions use a 4px corner. Wizard actions use an 8px corner. Both are 14px text.
- **Primary:** Ink Stone on Card. Compact padding is 8px 16px, at regular weight. The wizard primary is 10px 20px, at weight 500, with a trailing stroke icon. Hover moves the fill to Ink Hover. Disabled opacity is 60%. There is no press translation.
- **Hover / Focus:** Background darkens one stone step. The wizard's visible focus is the field ring, not a button halo.
- **Secondary:** Card fill, Ink Body text, 1px Rule Strong border. Hover fills with Paper. A quiet text action has no border and turns from Ink Soft to Ink Stone, or fills with Mist.

### Chips

- **Style:** A pill of Mist with Ink Hover text, 2px 10px, for chosen providers on the review step. A verification badge is the same Mist, at 4px corners and 12px text, not a pill.
- **State:** Selection of a provider row is not a chip. The row itself becomes Ink Stone with Card text.

### Cards / Containers

- **Corner Style:** 8px for stats, lists, and auth forms. 12px for the wizard shell only.
- **Background:** Card on Paper.
- **Shadow Strategy:** Rest shadow on auth forms and the wizard shell. Stats and plain lists are border only. See Elevation & Depth.
- **Border:** 1px Rule. List rows divide with Rule or Mist.
- **Internal Padding:** 16px on stats and compact forms. 24px on auth. 24px, or 32px from 640px, on wizard steps.

### Inputs / Fields

- **Style:** Card fill, 1px Rule Strong border, Ink text. Compact fields are 4px and padded 8px 12px. Wizard fields are 8px, padded 10px 12px, with the rest shadow.
- **Focus:** Wizard fields drop the rest shadow for a 2px Rule ring and move the border to Ink Muted. Compact fields have no ring.
- **Error / Disabled:** Errors are 14px Fault Red under the field. Disabled fields fill with Mist. A destructive text button uses Fault Ink.

### Navigation

The header is a Card bar with a bottom Rule. The wordmark is semibold Ink Stone at 14px, preceded by a 20px folder stroke. Links are 14px Ink Soft, with 16px gaps, and turn Ink Stone on hover. There is no active fill and no sidebar. Below the header's comfortable width the links wrap; they do not collapse into a drawer.

The locale switch is a segmented control: 6px outer corner, 1px Rule, Card ground, 2px padding. The active locale is a 4px Ink Stone segment with Card text. The inactive locale is Ink Soft and fills with Mist on hover.

### Stepper

The wizard progress is a row of five cells, one column until 640px and five from there, with 8px gaps. Each cell has an 8px corner, 8px 12px padding, and a 12px uppercase index over a 14px label. Current is Ink Stone with Card text. Upcoming is Card with a Rule border and Ink Muted text. Done is Confirmed Wash, Confirmed Line, and Confirmed Ink, with a 14px check stroke. Color transition is 150ms, on the standard ease.

## Do's and Don'ts

### Do:

- **Do** use Ink Stone for the primary action, the current step, and the selected segment.
- **Do** keep the page on Paper and the entry on Card, separated by a 1px Rule.
- **Do** use Confirmed Green, Notice Amber, and Fault Red only to mark state.
- **Do** draw icons as 24px strokes at 1.75px with round caps, in currentColor.
- **Do** keep compact corners at 4px and wizard corners at 8px.

### Don't:

- **Don't** introduce a chromatic brand accent, a gradient, or a colored app sidebar.
- **Don't** lift a button or a card on hover. The rest shadow stays a rest.
- **Don't** add a corner radius outside 4px, 6px, 8px, 12px, and the pill.
- **Don't** set interface text in a second family. Mono stays on imported and raw text.

## Dark appearance (notebook at night)

Applied via `html.dark` (`class` strategy). User preference `light` | `dark` on account + cookie `hilko_theme`.

### Dark tokens (Tailwind stone)

| Role | Light | Dark |
| --- | --- | --- |
| Paper / page | stone-50 | stone-950 |
| Card / surface | white | stone-900 |
| Ink primary | stone-900 | stone-100 |
| Muted body | stone-600 | stone-300 |
| Subtle meta | stone-500 | stone-400 |
| Rule | stone-200 | stone-700 |
| Primary button | stone-900 on white text | stone-100 on stone-900 text |
| Checkbox checked | stone-900 fill, light check | stone-200 fill, dark check |

Semantic utilities: `text-ink`, `text-muted`, `text-subtle`, `bg-surface`, `border-rule`, `notice-wash` (amber callouts).

### Dark-specific rules

- **Do** invert ink for primary actions (light fill, dark text in dark mode).
- **Do** keep verification/status chips with muted washes, not neon.
- **Do** use `brandIconFill` for Simple Icons that are too dark on stone-900.
- **Don't** leave light-only `bg-white` / `text-stone-700` on runbook or guide surfaces.
