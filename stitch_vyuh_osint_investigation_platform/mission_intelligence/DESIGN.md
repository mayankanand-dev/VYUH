---
name: Mission Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f75'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0e1c2f'
  on-primary-container: '#77849c'
  inverse-primary: '#bac7e1'
  secondary: '#9a4600'
  on-secondary: '#ffffff'
  secondary-container: '#ff842e'
  on-secondary-container: '#642b00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00174b'
  on-tertiary-container: '#497cff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3fe'
  primary-fixed-dim: '#bac7e1'
  on-primary-fixed: '#0e1c2f'
  on-primary-fixed-variant: '#3a475c'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68c'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#753400'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  mono-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes an authoritative, high-integrity environment for open-source intelligence analysts, state actors, and disinformation investigators. The visual language balances rigorous institutional credibility with modern algorithmic speed, dispensing with sci-fi tropes, glowing lines, and fictional cyber aesthetics in favor of documentary clarity and forensic precision.

### Aesthetic Foundation
- **Discipline & Clarity**: Clinical off-white canvases paired with deep maritime navy foundations create an uncompromising reading environment engineered for 10-hour investigative sessions.
- **Evidentiary Hierarchy**: Color and shape strictly encode epistemic certainty—distinguishing raw factual observations from probabilistic heuristics and synthetic inference.
- **Restraint**: Saffron and warm amber accents are applied with surgical economy, reserved exclusively for active analytical focus, critical alerts, and investigative confirmations.

## Colors

The palette operates under a high-contrast analytical mandate, optimized for data-dense visualization and direct sunlight legibility on mission workstations.

### Primary & Slate Structure
- **Canvas Base**: `#FFFFFF` for primary work surfaces; `#F8FAFC` for analytical canvas backdrops and master layout frames.
- **Deep Navy Structural (`#0B192C`, `#1E293B`)**: Anchors primary text headers, global navigation bars, evidentiary headers, and active high-priority container borders.
- **System Slates (`#CBD5E1`, `#E2E8F0`)**: Crisp, low-noise border demarcations ensuring distinct cell, panel, and card boundaries without visual fatigue.

### Operational Accents & Epistemic Tags
- **Strategic Amber (`#E06D14`, `#D97706`)**: Reserved for platform identity markers, target focus states, flagged coordinated anomalies, and verified critical insights.
- **Epistemic Classifications**:
  - *Observed Fact*: `#059669` (Emerald 600) on `#ECFDF5` background with `#A7F3D0` border.
  - *Heuristic Inferred*: `#2563EB` (Blue 600) on `#EFF6FF` background with `#BFDBFE` border.
  - *AI Model Assessment*: `#7C3AED` (Violet 600) on `#F5F3FF` background with `#DDD6FE` border.
  - *Tampered / Disinformation Confirmed*: `#DC2626` (Red 600) on `#FEF2F2` background with `#FECACA` border.

## Typography

Typography enforces absolute visual differentiation between investigative narrative, contextual metadata, and cryptographic machine parameters.

### Font Roles
- **Inter (Primary & UI)**: Drives all structural navigation, dossiers, evidentiary logs, narrative summaries, and high-level analytical metrics. Tabular numerals (`tnum`) must be toggled on across all statistical tables.
- **JetBrains Mono (Technical Evidence & Machine Data)**: Applied strictly to raw forensics: UTC epoch timestamps, SHA-256 integrity hashes, IP addresses, autonomous system numbers (ASNs), GPS coordinates, platform user IDs, and raw packet strings.
- **Micro-Labels**: Case markers and evidentiary tags use uppercase tracking (+0.04em) at 11px to retain scannability at ultra-compact vertical density.

## Layout & Spacing

The layout is engineered around a multi-pane, density-driven workbench model designed for multi-monitor workstations and high-resolution laptops.

### Grid & Density Architecture
- **Desktop (1440px+)**: 12-column master grid with fluid sub-panels. Structural workspaces use persistent 3-pane splits: Case Dossier Index (280px fixed), Graph/Map/Timeline Investigation Stage (flexible fill), and Evidence Inspection Panel (360px-440px collapsable).
- **Gutters & Spacing Rhythms**: A compact base scale (4px/8px) governs inner component elements, packing maximum tabular evidence above the fold without sacrificing click-target accuracy.
- **Responsive Adaptations**:
  - *Tablet (768px-1024px)*: Evidence drawer converts to an overlay slide-out; navigation collapses to an icon-rail.
  - *Mobile (<768px)*: Viewport shifts to single-column alert and approval card views; full-table forensics lock to horizontal pan containers with frozen identity columns.

## Elevation & Depth

Visual hierarchy uses architectural delineation rather than heavy atmospheric layering. Surfaces rely on high-precision hairpins and restrained ambient shadows.

### Elevation Levels
- **Level 0 (Base Canvas)**: Background `#F8FAFC`. Zero elevation, structured solely by 1px `#E2E8F0` solid perimeter borders.
- **Level 1 (Panels & Cards)**: Surface `#FFFFFF` encased in 1px `#CBD5E1`. Used for active forensic tables, inspection inspectors, and dossier tabs. Drops a feather-light neutral shadow: `0 1px 2px rgba(11, 25, 44, 0.04)`.
- **Level 2 (Dropdowns, Filters & Tooltips)**: Surface `#FFFFFF` with `0 4px 6px -1px rgba(11, 25, 44, 0.08), 0 2px 4px -2px rgba(11, 25, 44, 0.04)`.
- **Level 3 (Modals, Chain of Custody Proofs, Overlays)**: Surface `#FFFFFF` enclosed in 1px `#94A3B8`, anchored by `0 10px 15px -3px rgba(11, 25, 44, 0.12), 0 4px 6px -4px rgba(11, 25, 44, 0.06)`. Backdrops use a neutral scrim: `rgba(11, 25, 44, 0.45)` with subtle 2px backdrop blur.

## Shapes

The geometric framework is crisp, structured, and disciplined. Soft, organic shapes are explicitly excluded to maintain an austere, institutional atmosphere.

### Radius System
- **Base (0.25rem / 4px)**: Applied to input elements, metadata chips, monospace tags, checkbox tiles, and inline code blocks.
- **Containers (0.375rem - 0.5rem / 6px - 8px)**: Applied to cards, table outer wrappers, inspector panels, and modal shells.
- **Pill (Fully Rounded)**: Reserved strictly for dynamic status pulses and binary operational indicators (e.g., Live Sync Active).

## Components

### Buttons & Action Controls
- **Primary Operational**: Solid `#0B192C` fill, white `#FFFFFF` Inter 13px weight 600 text, 6px border radius, 32px height. Hover: `#1E293B`.
- **Investigative Accent**: Solid `#E06D14` fill, white text, 32px height. Used for "Export Dossier", "Escalate Actor", and "Confirm Cluster".
- **Ghost / Outlined**: Transparent fill, 1px `#CBD5E1` border, `#1E293B` text. Hover: `#F1F5F9`.

### Evidentiary Chips & Badges
- **Triple-Tier Classification Badges**:
  - `OBSERVED`: Emerald text, 1px `#A7F3D0` border, `#ECFDF5` background. Prefixed with a solid dot `●`. Indicates verifiable ground truth (e.g., direct API output, notarized raw media).
  - `HEURISTIC`: Blue text, 1px `#BFDBFE` border, `#EFF6FF` background. Prefixed with a geometric diamond `◆`. Indicates algorithmic cluster matching and relational graphing.
  - `MODEL INFERENCE`: Violet text, 1px `#DDD6FE` border, `#F5F3FF` background. Prefixed with a spark icon `✦`. Accompanied by confidence percentage formatted in `JetBrains Mono` (e.g., `✦ 88.4% CONF`).

### Compact Forensic Data Tables
- Row height fixed at 36px for high density.
- Header row: `#F8FAFC` background, 1px solid bottom border `#CBD5E1`, 11px uppercase Inter text with tracking.
- Monospace values (hashes, coordinates, timestamps) render in 12px `JetBrains Mono` with muted `#475569` tone, turning `#0B192C` on hover with a quick-copy clipboard trigger.
- Hover states: `#F1F5F9` row highlight with zero layout shift.

### Chain-of-Custody & Audit Indicators
- Pinned to the base of all forensic cards and detail inspectors.
- Formatted as a horizontal chain: SHA-256 digest truncated to `8...8` chars, paired with an immutable UTC timestamp (`YYYY-MM-DDTHH:mm:ssZ`) and cryptographic seal verification badge.

### Notice Review & Alert Banners
- Non-intrusive 1px bordered horizontal alerts spanning panel headers.
- Critical Disinformation Flood: `#FEF2F2` background, `#DC2626` left 3px accent stroke, `#991B1B` typography, accompanying "Review Coordinated Ring" immediate action link.