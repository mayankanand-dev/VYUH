# Changelog

All notable changes to the **Social Signal Lab** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-10-23

### Added
- **Startup Automation**: Created `START.bat` one-click Windows launcher that runs prerequisite environment checks (`node`, `npm`), installs dependencies if missing, launches the default browser at `http://localhost:3000`, and starts the Next.js development server.
- **Pure Black ("Lights Out") Theme**: Implemented authentic X dark mode with high-contrast `#000000` background, `#e7e9ea` primary text, `#71767b` secondary metadata, `#2f3336` borders, and `#16181c` card surfaces.
- **Dedicated Forensic Dashboard Dark Theme**: Unified the `/investigations` intelligence console to seamlessly match the pure black aesthetic with custom telemetry charts, cluster lists, and evidence inspectors.

### Fixed
- **Left Navigation Sticky Anchor & Independent Scroll**: Fixed left navigation rail position so it remains fixed to the top-left of the viewport while browsing the timeline, and added independent vertical scrolling (`overflow-y-auto` with thin dark scrollbar) so that all navigation items, the Post button, the Workspace Switcher, and the User Card are accessible on any screen height.
- **Batch Script Syntax and PATH Resolution**: Fixed unescaped `&` characters in `START.bat` header titles that caused command parsing errors, and added self-healing PATH resolution for Windows `System32` and `Program Files\nodejs` so Node.js and system utilities are reliably detected.

### Changed
- Converted all feed surfaces (`XTimeline`, `XPostCard`, `XPostComposer`, `XLeftNav`, `XRightSidebar`, `WorkspaceSwitcher`, `PostDetailModal`, `DetectionModal`, `PlaceholderView`) from light mode to authentic X dark mode.
- Updated scrollbars in `app/globals.css` to match the dark `#2f3336` thumb and `#000000` track styling.
- Configured HTML and body elements in `app/layout.tsx` with dark mode classes and `color-scheme: dark`.

---

## [0.2.0] - 2026-10-23

### Added
- **Faithful X Desktop Layout**: Rebuilt the main user interface with a 3-column desktop layout (`w-[275px]` left rail, `w-[600px]` timeline, `w-[350px]` discovery column).
- **Interactive Timeline Controls**:
  - Functional **"For you"** (all public signals) and **"Following"** (curated followed creators) tabs with active blue pill indicators.
  - Borderless **"What is happening?!"** post composer with media, poll, emoji, and schedule controls.
  - Slim horizontal post dividers (`border-b border-[#2f3336]`) eliminating heavy dashboard card containers.
- **Authentic Navigation Rail**:
  - X mark branding with Home, Explore, Notifications, Messages, Grok (Sim), Bookmarks, Communities, Premium, Profile, and More.
  - Circular profile badge for `@lab_analyst_01` with evaluator status.
- **Right Discovery Column**:
  - Rounded pill search bar with real-time text, handle, and hashtag filtering.
  - "What's happening" section with realistic trending topics and post volume counts.
  - "Who to follow" widget with suggested fictional accounts and working Follow/Following toggle buttons.
- **Analysis Mode Overlay (`AnalysisModeContext`)**:
  - React 19 external store (`useSyncExternalStore`) providing a discreet toggle for researchers.
  - When disabled: feed timeline is 100% clean and identical to production X.
  - When enabled: subtle simulated anomaly pills appear on flagged posts with direct links to forensic evidence.
- **Dedicated Forensic Analyst Dashboard (`/investigations`)**:
  - Relocated all threat intelligence, coordination metrics, and suspicious clusters out of the public feed.
  - Telemetry bar with Monitored Signals, Flagged Clusters, and Coordination Index metrics.
  - 4 sub-views: Suspicious Narrative Clusters, Coordinated Inauthentic Behavior (CIB) Actor Matrix, Campaign Timelines, and Signal Forensic Inspector.
  - Support for URL query parameter deep-linking (`/investigations?signal=<id>`).

### Changed
- Decoupled cybersecurity threat monitoring tools from the social timeline.
- Updated routing architecture to keep `/` as the pure social simulator while preserving access to `/scenarios`, `/evaluation`, and `/investigations` via `WorkspaceSwitcher`.

---

## [0.1.0] - 2026-10-23

### Added
- **Initial Testbed Setup**: Initialized Next.js App Router project with TypeScript and Tailwind CSS v4.
- **Synthetic Data Corpus (`data/mockPosts.ts`)**:
  - 9 realistic fictional posts simulating disinformation vectors (temporal burst panic, medical panaceas, astroturfing swarms, synthetic media) and control samples.
  - 5 simulated narrative trends with risk severity markers.
  - Detailed heuristic explanations and simulated confidence scores.
- **Basic Feed Interactions**:
  - Post creation with hashtag extraction and simulated anomaly tagging.
  - Working Like and Repost state toggles with numerical counters.
  - Post detail inspection modal with threaded replies and reply submission.
  - Detection explanation modal displaying synthetic heuristics and benchmark disclaimer notices.
- **Placeholder Views**: Scaffolded routes for `/explore`, `/notifications`, `/profile`, `/scenarios`, `/investigations`, and `/evaluation`.
