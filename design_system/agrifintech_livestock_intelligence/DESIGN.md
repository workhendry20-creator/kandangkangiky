---
name: AgriFintech & Livestock Intelligence
colors:
  surface: '#fcf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fcf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ec'
  surface-container: '#f0eee7'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e5e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#31312c'
  inverse-on-surface: '#f3f0e9'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#fcf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e5e2db'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system pairs the warmth of rural husbandry with the precision of contemporary financial technology. The interface serves farm owners, livestock co-investors, veterinarians, and supply chain operators who require immediate, granular insight into animal welfare, capital health, and yields.

The aesthetic fuses **Modern Tactile Minimalism** with **Organic High-Tech Dashboarding**. Instead of stark corporate grays or unpolished rustic motifs, the UI embraces a light, sunlit pastoral baseline balanced with rigorous typography and clear informational hierarchy. Visual clarity conveys dependability, financial transparency, and humane stewardship.

## Colors

The color architecture grounds financial precision within living agricultural environments:

- **Primary (`#059669` / `#10B981`)**: Rich emerald green signals biological vitality, positive yield, and fiscal growth. Used for primary calls-to-action, positive growth rates, verified livestock status tags, and focal telemetry indicators.
- **Secondary (`#D97706`)**: Warm golden amber highlights liquidity states, investment milestones, quarantine notices, and actionable warnings without triggering panic.
- **Tertiary (`#64748B`)**: Slate neutral provides support for metadata, axis marks, telemetry units, and contextual tooltips.
- **Neutral Canvas (`#FDFBF7` / `#F8F5EE`)**: A soft, warm parchment tint reduces eye strain during extended outdoor and tablet usage, establishing an organic and grounding surface.
- **Card & Layer Surfaces (`#FFFFFF`)**: Pure white elevated surfaces offer crisp contrast against the warm cream canvas, framing livestock health cards and financial ledgers cleanly.
- **Borders & Dividers (`#E9E4D9`)**: A sun-warmed bone line defines structural boundaries without high-contrast visual noise.
- **Typography Bases**: Dark slate (`#0F172A`) commands high-contrast headlines, while secondary slate (`#334155`) anchors descriptive copy and tabular numbers.

## Typography

The typography uses **Plus Jakarta Sans** across all levels to balance geometric legibility with humanist warmth. Its wide apertures ensure critical veterinary and financial indicators remain legible across outdoor displays, tablet mounts in barns, and high-density desk monitors.

Tabular figures (`tnum`) should be enabled for all livestock IDs, weights, health telemetry metrics, and financial currency values. Display and large headline styles carry subtle negative letter spacing to retain tightness and authority in analytical views.

## Layout & Spacing

The platform applies a responsive 12-column fluid grid system pinned to a maximum canvas width of 1440px to retain readability on ultra-wide monitoring stations.

- **Desktop (>= 1024px)**: 12-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) margins. Supports multi-column telemetry graphs, side-by-side pens, and synchronized cash flow schedules.
- **Tablet (768px - 1023px)**: 8-column layout with 20px gutters and 24px margins. Sidebar transitions into an off-canvas drawer or top status bar.
- **Mobile (< 768px)**: 4-column layout with 16px (`1rem`) gutters and 16px (`1rem`) margins. Complex livestock comparison tables convert to stacked status cards with horizontal swipe actions for quick pen-side updates.

## Elevation & Depth

Visual hierarchy is communicated through a mixture of **tonal layering** and **warm ambient drop shadows**. High-contrast pitch-black shadows are avoided in favor of warm, low-opacity umber-slate casts:

- **Level 0 (Floor/Base)**: `#FDFBF7` canvas.
- **Level 1 (Card/Container)**: Pure `#FFFFFF` surface accompanied by a fine `1px` solid `#E9E4D9` border and an ambient shadow: `0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hover/Active Panes)**: Lifted card effect with `0 10px 24px -4px rgba(15, 23, 42, 0.07), 0 4px 8px -2px rgba(15, 23, 42, 0.03)` and border transition to `#D6CEBE`.
- **Level 3 (Modals/Flyouts/Drawers)**: `#FFFFFF` surface with `0 20px 32px -6px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)`, framed against a backdrop blur overlay (`rgba(15, 23, 42, 0.3)` with `backdrop-filter: blur(4px)`).

## Shapes

The design system employs a **Rounded** shape philosophy (`roundedness: 2`). Standard controls, buttons, and input fields use `0.5rem` (8px) radius, while data cards, livestock status monitors, and financial modules use `1rem` (16px) radius. Pill geometry is reserved for status badges, RFID tags, and active micro-chips. This creates an inviting, accessible atmosphere while preserving structural discipline across data-dense views.

## Components

### Buttons
- **Primary**: Solid emerald `#059669` fill with white text, 8px corner radius, and subtle inward highlight. On hover, deepens to `#047857` with elevation lift.
- **Secondary**: Pure `#FFFFFF` surface with `#E9E4D9` perimeter border and `#0F172A` text. Hover shifts background to `#F8F5EE`.
- **Tertiary/Ghost**: Transparent fill with `#059669` or `#334155` text; hover reveals a `#F4EFE6` wash.
- **Destructive/Urgent**: Coral crimson background (`#DC2626`) with crisp white text for quarantine declarations or emergency asset liquidation.

### Chips & Badges
- **Livestock Status Badges**: Pill-shaped (`rounded-full`), 4px vertical / 10px horizontal padding.
  - *Healthy / Growing*: Soft emerald surface (`#ECFDF5`), border `#A7F3D0`, emerald copy (`#065F46`).
  - *Under Observation / Vaccination Pending*: Soft amber surface (`#FFFBEB`), border `#FDE68A`, amber copy (`#92400E`).
  - *Quarantine / Attention*: Soft rose surface (`#FEF2F2`), border `#FECACA`, red copy (`#991B1B`).
- **RFID & Pen Identifiers**: Subtle sage tint (`#F1F5F0`) with monospaced digit formatting and slate text.

### Cards
- **Livestock Card**: Pure `#FFFFFF` background, 16px radius, bordered with `#E9E4D9`. Displays animal ID, breed indicator, current weight, feed conversion ratio, and an ambient growth sparkline. Hover softly expands elevation.
- **Fintech Yield Summary Card**: Includes a top 3px accent stroke in primary emerald or secondary amber, large tabular metrics, and inline return-on-investment (ROI) tags.

### Inputs & Controls
- **Text Inputs**: Crisp white container with 8px radius, `1px solid #E9E4D9`, slate text, and warm placeholder tone (`#94A3B8`). Focus ring displays a soft `0 0 0 3px rgba(5, 150, 105, 0.18)` emerald halo with border snapping to `#059669`.
- **Checkboxes & Radios**: 8px rounded checkbox / full-round radio with `#E9E4D9` border. Selected state applies `#059669` solid fill with sharp white indicator markings.

### Lists & Ledger Tables
- Alternating subtle rows using `#FFFFFF` and `#FAF7F2`. 
- Header rows set in uppercase `caption` typography with `#64748B` slate tint and bottom border in `#E9E4D9`.
- Numerical columns align right with monospace figures enabled.

### Domain-Specific Components
- **Livestock Telemetry Gauge**: Semi-circular meter highlighting weight gain, body temperature, and vaccination cycles with dynamic emerald-to-amber progress fills.
- **Investment Pool Ledger**: Multi-layered card detailing share percentage, projected slaughter/sales yield dates, insurance coverage tags, and real-time feed cost deductions.