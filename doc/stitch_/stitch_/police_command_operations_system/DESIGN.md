---
name: Police Command & Operations System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e6e8ef'
  surface-container-highest: '#e0e2e9'
  on-surface: '#181c20'
  on-surface-variant: '#404752'
  inverse-surface: '#2d3136'
  inverse-on-surface: '#eef1f7'
  outline: '#707784'
  outline-variant: '#c0c7d4'
  surface-tint: '#0060a9'
  primary: '#0060a9'
  on-primary: '#ffffff'
  primary-container: '#409eff'
  on-primary-container: '#003460'
  inverse-primary: '#a2c9ff'
  secondary: '#4f6076'
  on-secondary: '#ffffff'
  secondary-container: '#d2e4ff'
  on-secondary-container: '#55667c'
  tertiary: '#286c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#55af28'
  on-tertiary-container: '#133b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a2c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004881'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#b6c8e2'
  on-secondary-fixed: '#0a1c30'
  on-secondary-fixed-variant: '#37485d'
  tertiary-fixed: '#9bfa6b'
  tertiary-fixed-dim: '#80dd52'
  on-tertiary-fixed: '#072100'
  on-tertiary-fixed-variant: '#1d5200'
  background: '#f8f9ff'
  on-background: '#181c20'
  surface-variant: '#e0e2e9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 16px
  margin: 20px
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-lg: 16px
  space-xl: 24px
---

## Brand & Style

This design system is engineered specifically for mission-critical police coordination, command dispatch, asset surveillance, and administrative operations. The aesthetic draws upon the proven, high-density principles of enterprise desktop suites (Element Plus / Vue Element Admin architecture), prioritized around high legibility, strict status distinction, and rapid operator triage.

### Brand Personality & Philosophy
- **Authoritative & Trustworthy:** A disciplined, institutional visual structure with deep navy-slate navigation anchors (`#304156`), clean white card surfaces, and crisp 1px delineation.
- **Clarity Under Pressure:** Zero-distraction UI. Minimalist ornamentation, high data density, structured grid alignments, and distinct functional color semantics allow dispatchers and law enforcement administrators to assess critical alerts in split seconds.
- **Systematic & Predictable:** Familiar component models, standard 4px boundary radii, uniform control heights (32px / 40px), and clear interactive visual cues (hover, active, focus states).

## Colors

The palette adheres to standard enterprise police administration conventions, combining high-contrast operational status tokens with low-fatigue workspace neutrals.

### Primary & Navigation Accents
- **Primary (`#409EFF`):** Focus triggers, primary operational actions, active menu highlights, and active breadcrumbs.
- **Primary Hover (`#66b1ff`):** Interactive mouseover state for interactive primary controls.
- **Primary Active (`#3a8ee6`):** Depressed button states and operational locks.
- **Sidebar Slate (`#304156`):** Navigation background anchoring the operational hierarchy.
- **Sidebar Hover (`#263445`) & Submenu (`#1f2d3d`):** Strict progressive disclosure for multi-tier police bureau organizational units.
- **Sidebar Text (`#bfcbd9`) & Sidebar Active (`#409EFF`):** High contrast legibility in variable lighting environments.

### Operational Status Tokens
- **Success (`#67C23A`):** Normal patrol status, verified personnel, active GPS link, cleared incident, and authenticated badge.
- **Warning (`#E6A23C`):** Pending patrol handover, medium-level perimeter trigger, geofence exit, low battery alert on field bodycam.
- **Danger / Severe Alert (`#F56C6C`):** Red alert dispatch, emergency beacon, perimeter breach, armed response request, system lockout.
- **Info (`#909399`):** Routine audit log, standby vehicle, passive checkpoint telemetry.

### Surfaces & Typography Tones
- **Workspace Background (`#f0f2f5`):** Low-glare canvas offering distinct depth separation from white panels.
- **Card & Header Canvas (`#ffffff`):** Pure light background for maximum tabular and metric legibility.
- **Border Dividers (`#dcdfe6` base, `#e4e7ed` light):** Crisp structural dividers.
- **Title Text (`#303133`):** High-density headers, modal captions, metric values.
- **Regular Text (`#606266`):** Body content, table cells, form labels.
- **Secondary Text (`#909399`):** Timestamps, badge serial numbers, helper notes.

## Typography

Typography prioritizes tabular legibility, rapid data scanning, and clear visual hierarchy for Chinese and Western alphanumeric strings.

### Font Hierarchy & Font Stack
The primary font token is systematically paired with platform system fallbacks:
`"Inter", "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`.

- **Numeric Display & IDs:** Badge IDs, vehicle plates, case numbers, and coordinates leverage tabular numerals (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during live telemetry refreshes.
- **Hierarchy Structure:**
  - `display-lg` (28px / SemiBold): Top-level emergency operations center metrics and live alert counters.
  - `headline-lg` (20px / SemiBold): Module title and incident dispatch details.
  - `headline-md` (16px / SemiBold): Card headers, drawer headers, filter section grouping.
  - `headline-sm` / `body-lg` (14px): Standard table headers, default form fields, operational logs.
  - `body-md` / `label-md` (13px / 12px): Standard dense data tables, micro-badges, device status flags, timeline secondary annotations.

## Layout & Spacing

The architecture operates on an 8px/4px atomic grid designed for dense multi-monitor desktop stations (1920x1080 and above) while cleanly adapting to standard laptop displays.

### Layout Model
- **Dual-Pane Shell:** Fixed-width collapsable dark sidebar (210px expanded, 64px icon-only rail collapsed) combined with a horizontal utility top navigation bar (50px height).
- **Workspace Canvas:** Outer margins are set at a uniform `20px` (`margin`) across desktop surfaces, separating the `#f0f2f5` background from pure white container surfaces.
- **Grid Gutters:** Grid layouts utilize a `16px` (`gutter`) spacing between operational cards, map splits, and KPI metric tiles.
- **Component Padding & Gaps:**
  - `space-xs` (4px): Inline icon-to-text spacing, compact tag inner padding.
  - `space-sm` (8px): Button horizontal internal padding, tag spacing, form row compact gaps.
  - `space-md` (12px): Standard table cell vertical padding, dropdown menu item heights.
  - `space-lg` (16px): Card body padding, filter bar internal padding.
  - `space-xl` (24px): Modal content padding, complex multi-step dispatch workflows.

## Elevation & Depth

Visual hierarchy employs low-contrast outlines supplemented by disciplined, subtle ambient diffusion to maintain focus on complex law enforcement data.

### Elevation Levels
- **Canvas Base (Level 0):** `#f0f2f5` main layout surface.
- **Card & Data Surface (Level 1):** `#ffffff` panels bordered by `1px solid #e4e7ed` with a soft baseline shadow: `box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)`. This keeps distinct data blocks isolated without heavy dropshadow clutter.
- **Hover & Active Panels (Level 2):** Quick-action tiles, asset cards on hover: `box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1)`.
- **Overlays, Popovers & Dropdowns (Level 3):** Autocomplete results, date pickers, department selector dropdowns: `box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)`.
- **Modals & Command Center Drawers (Level 4):** Emergency dispatch modal, criminal record review, video stream overlay: `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15)` paired with a `rgba(0, 0, 0, 0.5)` structural backdrop.

## Shapes

The design system standardizes on a disciplined **4px** roundedness rule (`roundedness: 1` equivalent to enterprise soft geometry), matching classic Element Plus conventions.

### Geometry Specifications
- **Base Geometry (`4px`):** Applied across all interactive buttons, text inputs, selects, table container borders, modal windows, and information cards.
- **Compact Geometry (`2px`):** Used strictly for micro tags, status indicators, and miniature pagination blocks.
- **Circular (`50%`):** Reserved solely for officer profile avatars, patrol map radar beacons, and pulsating emergency broadcast pins.

## Components

### Buttons
- **Primary:** Background `#409EFF`, border `#409EFF`, text `#ffffff`. Hover `#66b1ff`, active `#3a8ee6`. Border-radius `4px`.
- **Success / Warning / Danger:** Solid fills `#67C23A`, `#E6A23C`, `#F56C6C` with matching hover tints. Danger is reserved for high-stakes triggers (Dispatch SWAT, Lock Down Zone, Revoke Credentials).
- **Default / Secondary:** Background `#ffffff`, border `1px solid #dcdfe6`, text `#606266`. Hover text & border `#409EFF`, background `#ecf5ff`.
- **Sizes:** Default (32px height, 14px font), Small (28px height, 12px font), Large (40px height, 14px font).

### Form Inputs & Selects
- **Text Inputs:** Height 32px (standard), background `#ffffff`, border `1px solid #dcdfe6`, border radius `4px`, text `#606266`, placeholder `#c0c4cc`.
- **Focus State:** Border `#409EFF`, outline none, transition `border-color .2s cubic-bezier(.645,.045,.355,1)`.
- **Error State:** Border `#F56C6C` with validation text rendered in 12px below input.

### Data Tables
- **Header:** Background `#f5f7fa`, text `#909399`, font size `12px` or `14px`, weight `600`, border bottom `1px solid #ebeef5`.
- **Body Rows:** Height 44px (regular) or 36px (compact density). Border bottom `1px solid #ebeef5`. Zebra striping optional on dense tables (`#fafafa`).
- **Hover State:** Row background `#f5f7fa`.
- **Selection:** Checkbox cell alignment strictly centered.

### Tags & Chips (Incident & Asset States)
- Height 24px, radius `4px`, padding `0 8px`, font size `12px`.
- **Primary (Patrol In Progress):** Background `#ecf5ff`, border `#d9ecff`, text `#409EFF`.
- **Success (Online / Regular):** Background `#f0f9eb`, border `#e1f3d8`, text `#67C23A`.
- **Warning (Attention / Review):** Background `#fdf6ec`, border `#faecd8`, text `#E6A23C`.
- **Danger (Emergency Dispatch / Critical Alarm):** Background `#fef0f0`, border `#fde2e2`, text `#F56C6C`.

### Cards & Container Panels
- White background (`#ffffff`), `1px solid #ebeef5`, border-radius `4px`.
- **Header Section:** Height 48px, horizontal padding 16px, bottom border `1px solid #ebeef5`, flex-aligned with title on left and operational action tools on right.

### Specialized Police System Components
- **Dispatch Action Drawer:** Right-sliding panel (width 480px or 640px) with header status pill, real-time map preview thumbnail, unit timeline audit list, and bottom-anchored command action bar.
- **Incident Badge & Pulsing Radar Dot:** 8px circular status indicator with continuous radial ping animation using Danger (`#F56C6C`) or Warning (`#E6A23C`) for unassigned or escalating emergency dispatches.
- **Plate & ID Tag:** Monospaced alphanumeric display with subtle inset background `#f4f4f5`, border `#e9e9eb`, text `#303133`, optimized for fast visual pattern matching.