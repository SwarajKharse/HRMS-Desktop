# Mobile Conventions

This document describes how mobile layouts are actually built in this codebase today. Every pattern below is drawn from working code — no generic responsive-design advice. If you're building or fixing a mobile view, copy the pattern from the referenced file rather than inventing a new one.

Target viewports: **393×830 (OnePlus 9)** and **360px wide** as the strict minimum case. No horizontal scrolling at either. Desktop layouts must never change — every mobile adaptation is additive, gated behind Tailwind's `md:` breakpoint.

---

## 1. Primary reference: `src/components/Projects/NewProjects.js`

This is the canonical "desktop table → mobile cards" conversion. Read it end to end before building any other list/table view.

### 1.1 The breakpoint split

Two sibling blocks, mutually exclusive by breakpoint — **not** one block with responsive column hiding:

```jsx
{/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">...</table>
</div>

{/* Mobile Card View */}
<div className="md:hidden">
  <div className="divide-y divide-gray-200">
    {unassignedleads.map((project) => ( ... ))}
  </div>
</div>
```

`hidden md:block` and `md:hidden` are the only two classes needed for the split. Both blocks live in the same render — React mounts both, CSS decides which one paints. This is deliberate: it means both views always read from the *same* data/state (`unassignedleads`, `progressMap`, `pendingRequisitionProjectIds`, etc.), so they cannot drift out of sync with each other. See §1.7 for what is and isn't duplicated.

### 1.2 What becomes the card heading vs. sub-line vs. action row

The table has six columns: Project ID, Project Name, Project Initiation, Scope of Work (BOQ/DC/Progress buttons), Summary, Actions (edit). The mobile card collapses this into three zones:

```jsx
<motion.div className="p-4 relative" style={getProgressRowStyle(project.id)}>
  {/* Edit - standalone pen icon, top-right corner */}
  <button className="absolute top-3 right-3 text-gray-400 active:text-indigo-600" ...>
    <FiEdit2 size={18} />
  </button>

  {/* Title */}
  <div className="mb-3 pr-8">
    <div className="text-base font-semibold text-gray-900">{project.lead?.lead_code || "N/A"}</div>
    <div className="text-sm text-gray-600 mt-0.5">{project.project_name}</div>
  </div>

  {/* Actions – full-width, finger-sized */}
  <div className="grid grid-cols-5 gap-1">...</div>
</motion.div>
```

- **Heading** = the first/most-identifying table column (`lead_code`) — bold, `text-base`.
- **Sub-line** = the next most important column (`project_name`) — `text-sm text-gray-600`, directly under the heading.
- **Action row** = every button-bearing column (Project Initiation, BOQ, DC History, Progress, Summary) collapsed into one `grid-cols-5` row at the bottom of the card.
- **Edit** is pulled out of the flow entirely and floated top-right (see §1.4).

Anything that doesn't fit this heading/sub-line/action-row split (a long description, secondary metadata) does **not** get crammed into the card — see §6 below on the "detail modal" escape hatch.

### 1.3 Wide buttons → compact icon+label buttons (the key pattern)

This is the single most important transformation in the file. Desktop buttons carry full text and sit in a horizontal `flex gap-4` row:

```jsx
{/* Desktop */}
<button
  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-sm font-medium ${
    pendingRequisitionProjectIds.has(project.id)
      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 pending-blink"
      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
  }`}
  onClick={(e) => guardAssignedAction(e, project, (ev) => handleBOQEdit(ev, project))}
  title={pendingRequisitionProjectIds.has(project.id) ? "Requisition pending your approval" : "Edit BOQ"}
>
  <FiFileText size={14} /> BOQ
</button>
```

Mobile keeps **the exact same color-coding logic** (same conditional className, same `bg-*-100`/`text-*-700` pairs, same pending/blink state) but restructures the button into a stacked icon-over-label tile inside a grid:

```jsx
{/* Mobile */}
<button
  className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg ${
    pendingRequisitionProjectIds.has(project.id)
      ? "bg-amber-50 text-amber-800 active:bg-amber-100 pending-blink"
      : "bg-blue-50 text-blue-700 active:bg-blue-100"
  }`}
  onClick={(e) => guardAssignedAction(e, project, (ev) => handleBOQEdit(ev, project))}
>
  <FiFileText size={16} />
  <span className="text-[10px] font-medium">BOQ</span>
</button>
```

What changed, systematically, across every button:
| Aspect | Desktop | Mobile |
|---|---|---|
| Layout | `flex items-center gap-1.5` (icon + text inline) | `flex flex-col items-center justify-center gap-0.5` (icon over text) |
| Label | Full text, sometimes with dynamic data (`Progress: {pct}%`) | Short fixed word (`Progress`) — dynamic value dropped from the label, not truncated |
| Color intensity | `bg-blue-100` / `hover:bg-blue-200` | `bg-blue-50` / `active:bg-blue-100` (one shade lighter — `hover:` becomes `active:` since there's no hover on touch) |
| Sizing | `px-3 py-1`, icon `size={14}` | `py-2` full grid cell, icon `size={16}` (slightly larger, since it's now the primary visual element) |
| `title` tooltip | Present (hover-revealed) | Dropped (meaningless on touch) |
| Handler | Identical `onClick` | **Identical `onClick`** — same guard function, same state setters |

The rule: **color identity and click behavior are never re-derived for mobile** — the same conditional expression is copied verbatim into the mobile button's className. Only the layout primitive (row → column) and label verbosity change.

**A dropped value must resurface somewhere else — it must never simply vanish.** Dropping `{pct}%` from the button's own label is only safe because the number is still conveyed through a different channel on the same card. There are exactly three legitimate places for a value that no longer fits in the label:

1. **Color-coding on a container the value already controlled.** This is what `NewProjects.js` actually does with the progress percentage — the number was never solely "in the label" to begin with. Both the desktop `<tr>` and the mobile card apply the same inline style, independent of the button's own text:
   ```jsx
   const getProgressRowStyle = (projectId) => {
     const pct = progressMap[projectId] || 0
     return { background: `linear-gradient(to right, #86efac ${pct}%, #ffffff ${pct}%)` }
   }
   // ...
   <motion.tr style={getProgressRowStyle(project.id)} ...>          {/* desktop row */}
   <motion.div style={getProgressRowStyle(project.id)} className="p-4 relative" ...>  {/* mobile card */}
   ```
   Dropping `Progress: 45%` down to just `Progress` on the mobile button is safe specifically because the 45% is still visible as a green-fill gradient across the entire card background, on both breakpoints, completely independent of the button label. If a value has no such second channel already in place, dropping it from the label is **not** safe — see options 2 and 3.
2. **A small badge elsewhere on the same card**, when the value doesn't already drive a background/color (e.g. the overtime-minutes and LC/EC/LCE badges in `AttendanceCalendar.js` — kept as their own compact element rather than folded into a label, precisely because there's no existing color channel to hide the number in).
3. **The detail modal**, when neither 1 nor 2 has room (see §6's "dense info → modal" rule). This is the fallback for anything that doesn't already have a visual home elsewhere on the compact view.

Before dropping any dynamic value from a mobile label, check whether it already has a home in 1 or 2 on the same view. If it doesn't, it isn't safe to drop — either give it a badge or push it to the detail modal instead of deleting it outright.

### 1.4 The edit/actions column

Desktop: a plain icon button inside its own `<td>`, at the end of the row:
```jsx
<button className="text-gray-400 hover:text-indigo-600 transition-colors" onClick={(e) => handleEdit(e, project.lead.id)} title="Edit">
  <FiEdit2 size={18} />
</button>
```

Mobile: the same icon button, same handler, but **repositioned out of the action grid** and absolutely positioned in the card's top-right corner, since there's no separate "column" concept in a card:
```jsx
<button className="absolute top-3 right-3 text-gray-400 active:text-indigo-600" onClick={(e) => handleEdit(e, project.lead.id)} title="Edit">
  <FiEdit2 size={18} />
</button>
```
The card's title block gets `pr-8` to reserve space so the heading text never runs under the floated icon.

### 1.5 Search behavior on mobile

There is no separate mobile search implementation. One `<input>`, full width, taller than a typical desktop input for easier tapping:
```jsx
<input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search by project code or name..."
  className="w-full h-11 rounded-lg border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>
```
`h-11` (44px) satisfies the tap-target minimum (§6). `text-base` (not `text-sm`) avoids iOS Safari's auto-zoom-on-focus behavior for inputs under 16px. This same input renders identically on both breakpoints — search is one of the few UI pieces in this file that is **not** split by `md:`.

### 1.6 Pagination — a partial split, not a full duplicate

Pagination shows how to split *only the piece that doesn't fit*, not the whole component:
```jsx
{/* Mobile pagination - just show current/total */}
<div className="md:hidden px-3 py-1 text-sm">
  Page {currentPage} of {totalPages}
</div>

{/* Desktop pagination - show page numbers */}
<div className="hidden md:flex">
  {/* ...numbered page buttons... */}
</div>
```
The Prev/Next buttons around this block are shared, unsplit. Only the "which pages" indicator — which doesn't fit as a row of number buttons at 360px — gets a mobile-specific compressed form (plain text instead of a button row).

### 1.7 Is markup duplicated or shared?

Both — deliberately split by what varies:
- **Shared, not duplicated:** all state (`unassignedleads`, `progressMap`, `pendingRequisitionProjectIds`, `unfilledProgressProjectIds`), all handlers (`handleBOQEdit`, `handleSummary`, `handleEdit`, `guardAssignedAction`), and complex sub-components used as-is on both sides (`<ProjectInitiationIntegration project={project} />` on desktop, `<ProjectInitiationIntegration project={project} compact />` on mobile — same component, a `compact` prop toggles its own internal layout rather than the parent re-implementing it).
- **Duplicated on purpose:** the actual JSX shape of each row/card, because a `<tr><td>` and a `<div className="p-4">` card are structurally incompatible — there's no responsive-only way to turn one into the other. Duplicating markup here is correct; duplicating *state or business logic* would not be, and the file never does that.

---

## 2. `src/components/Attendance/AttendanceCalendar.js`

Contributes patterns for dense grid/data views where cards don't apply (a calendar, not a list):

- **Collapsible disclosure instead of an always-visible dense block.** The status legend (9 items) is `hidden md:flex` on desktop (always visible, inline). On mobile it becomes a closed-by-default toggle:
  ```jsx
  <button onClick={() => setLegendOpen((open) => !open)} className="flex items-center justify-between w-full min-h-[44px] px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
    <span>Legend</span>
    <FiChevronDown className={`w-4 h-4 transition-transform ${legendOpen ? "rotate-180" : ""}`} />
  </button>
  {legendOpen && <div className="flex flex-wrap items-center gap-3 text-sm mt-2 p-3 bg-gray-50 rounded-lg">...</div>}
  ```
  Both the inline desktop version and the disclosure's expanded content render from one `LegendContent()` helper (see next point) — never two copies of the legend items.

- **`LegendContent()` — a shared-render-helper, not a shared-state pattern.** When the same set of JSX items needs to appear in two structurally different containers (an always-open `<div>` vs. a conditionally-rendered disclosure body), extract a tiny function component with no props/state that just returns the repeated items, and call it from both places:
  ```jsx
  function LegendContent() {
    return (
      <>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => ( ... ))}
        {Object.entries(STATUS_INDICATORS).map(([status, config]) => ( ... ))}
      </>
    )
  }
  ```
  This is the right tool specifically when the *only* thing duplicated would be static-shaped markup with no local state of its own — contrast with §1.7, where the table row and card are too structurally different to share via a helper.

- **Square, tappable grid cells, minimum 44px.** Desktop cells are `md:min-h-[100px]` (tall, room for inline hover detail). Mobile cells are `aspect-square` — square rather than a fixed pixel height, so they scale correctly across 360-393px without ever dropping under the tap-target floor:
  ```jsx
  className={`relative bg-white aspect-square md:aspect-auto md:min-h-[100px] p-1 md:p-2 ${!isCurrentMonth ? "opacity-50" : "cursor-pointer"}`}
  ```

- **Detail-in-modal instead of detail-in-cell.** Desktop shows check-in/out time info inline on `:hover`. Touch has no hover, so mobile cells show only a date number + a color/status indicator, and a tap opens a modal with the full detail instead:
  ```jsx
  onClick={() => handleDateClick(date)}
  ...
  {isSameDay(date, hoveredDate) && <div className="hidden md:block">{renderTimeInfo(date)}</div>}
  ```
  The modal (`DayDetailModal`) reuses the same `motion.div` backdrop + inner-card + `stopPropagation` convention as every other modal in this app (see §6). This is the general rule for anything that used to rely on `:hover` to reveal information: touch has no hover, so that information needs a tap target and a modal, not a smaller hover zone.

- **Badges that would clip get repositioned, not shrunk into illegibility.** The LC/EC/LCE status badge sat top-right, colliding with the date number once the number was centered in a small square cell. Fix: reposition per-breakpoint, not redesign the badge:
  ```jsx
  className={`absolute bottom-1 right-1 md:top-1 md:bottom-auto ${statusIndicator.color} text-[10px] md:text-xs px-1 py-0.5 rounded font-medium`}
  ```
  Badges that still don't fit legibly after repositioning (holiday name, overtime minutes) are dropped from the cell entirely on mobile (`hidden md:block`) and are only ever visible in the day's detail modal.

---

## 3. `src/components/Home/Activities.js`

Contributes the pattern for **compacting a header**, and for a **shortcut tile grid** as a mobile-only supplement to primary navigation:

- **Compact mobile header via two sibling blocks**, same split convention as §1.1, applied to a hero/greeting block instead of a table:
  ```jsx
  <div className="md:hidden flex justify-between items-center gap-2">
    <span className="text-sm font-semibold text-gray-900 truncate">{getGreeting()}, {getValue(employee?.firstName)}</span>
    <span className="text-lg font-bold text-gray-900 shrink-0">{format(currentTime, "HH:mm")}</span>
  </div>
  <div className="hidden md:flex justify-between items-center">
    {/* full two-line greeting + full date, unchanged */}
  </div>
  ```
  A card that took two rows on desktop (name+message stacked, date+time stacked) becomes a single row on mobile: `truncate` on the name (so a long name never pushes the time off-screen) and `shrink-0` on the time (so it's never the thing that gets clipped).

- **Tile grid as a mobile-only navigation supplement, never a duplicate source of what's shown.** The tile grid renders from the exact same permission-derived list the sidebar uses (see §4) — it does not hardcode which modules appear:
  ```jsx
  const moduleTiles = getNavItems(permissions).filter((item) => item.path !== "/");
  ...
  <div className="md:hidden bg-white rounded-lg shadow-md p-4">
    <div className="grid grid-cols-3 gap-3">
      {moduleTiles.map((item) => (
        <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-1.5 min-h-[64px] rounded-lg bg-gray-50 active:bg-gray-100 p-2 text-center">
          <item.icon className="w-6 h-6 text-gray-700" />
          <span className="text-xs font-medium text-gray-700 leading-tight">{item.label}</span>
        </Link>
      ))}
    </div>
  </div>
  ```
  The primary, most-used action on the page (Check In / Check Out via `PunchAction`) stays directly reachable above the fold, not buried behind a tile — the tile grid is for secondary navigation only, and sits below it.

---

## 4. `src/config/navItems.js`

Contributes the **single-source-of-truth-for-permission-gated-lists** pattern:

```js
export function getNavItems(permissions) {
  const navItems = [{ icon: HiHome, label: "Home", path: "/" }];
  if (permissions?.webReports) navItems.push({ icon: HiChartPie, label: "Reports", path: "/reports" });
  // ...one `if` per permission flag...
  return navItems;
}
```

`Sidebar.js`, `Navbar.js`'s mobile dropdown, and `Activities.js`'s tile grid all call this one function instead of each maintaining their own `if (permissions?.webX) push(...)` block. Before this was extracted, the same list existed independently in `Sidebar.js` and `Navbar.js` and had already started drifting (different ordering, one missing an icon import). **Any UI that shows "which modules can this user reach" must call `getNavItems(permissions)` — never re-derive the list from `permissions` directly.** If the module list needs to change, it changes in exactly one file.

---

## 5. Forms

Reviewed the three real forms in this codebase: `src/components/Leave/LeaveForm.js` (Apply Leave modal), `src/components/Attendance/MissPunchForm.js` (Miss Punch Request modal), and `src/pages/AddLead.js` (full-page Add New Lead form). **These do not follow one consistent pattern.** What follows documents what each actually does, calls out which parts are safe to copy and which are gaps, and marks anything that isn't already established practice as a recommendation.

### 5.1 Multi-column desktop → single column on mobile

- **`LeaveForm.js`** — the only place a real collapse happens is the Start/End Date pair: `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` — two columns on desktop, stacked on mobile. Everything else in that form (leave type select, half-day checkbox, reason textarea) was already single-column on desktop too, so there was nothing else to collapse.
- **`MissPunchForm.js`** — no `md:` breakpoint appears anywhere in the file. The Check In/Check Out time inputs sit in a flat `grid-cols-2` with no `md:` prefix — side by side at every width, including 360px. This isn't a deliberate mobile pattern; it works only because two `<input type="time">` fields happen to be narrow enough to fit two-up even at the strict-case width.
- **`AddLead.js`** — **inconsistent, and the one to flag.** The top "Lead Details" section properly collapses `grid-cols-1 md:grid-cols-2` → single column. But the five repeated "contact person" sub-sections (client, middle man, architect, MEP, PMC) are built as raw `<table>` elements, and the entire form is wrapped once in `<div className="overflow-x-auto scrollToTop">`. On mobile, those tables do not restack into cards the way §1 describes — they horizontally scroll inside that wrapper instead. **This violates the no-horizontal-scroll rule (§6) and does not follow this codebase's own table→card convention.** Treat this as a known gap in `AddLead.js`, not a pattern to copy into a new form.

### 5.2 Label placement and input height

All three forms agree on label placement: a `<label className="block text-sm font-medium text-gray-700 ...">` directly above its input, never beside it. This already works at every width without any `md:` overrides and is safe to copy as-is.

Input sizing is where they're accidentally correct rather than deliberately correct: none of the three declares an explicit height or a `text-sm`/`text-xs` override on its `<input>`/`<select>`/`<textarea>` elements, so every field renders at the browser's default control size (effectively ≥16px). That happens to already satisfy the iOS auto-zoom-on-focus rule from §1.5 — but only by omission, not by a declared rule. Nothing stops a future edit from adding `text-sm` to one of these fields and silently reintroducing the zoom-on-focus problem. **Recommendation:** make it explicit — add `text-base` to every text/date/time/select input in a form, the same way §1.5 already specifies for the search input, instead of relying on the default going unnoticed.

### 5.3 Native date and select inputs

All three forms use plain native `<input type="date">`, `<input type="time">`, and `<select>` throughout — no custom date-picker or dropdown library anywhere. The one exception is `AddLead.js`'s Lead Type / Product Type fields, a custom checkbox-list dropdown with local `useState` and a click-outside handler — justified because it needs multi-select with removable chips, which native `<select multiple>` doesn't provide, not because native inputs were found lacking. **This is worth keeping as the default:** native controls hand the OS its own date/time picker and keyboard on mobile for free. Don't reach for a JS date-picker library without a concrete requirement (like the multi-select case) that native inputs genuinely can't cover.

### 5.4 Where submit/cancel go, and whether they stick

- `LeaveForm.js` and `MissPunchForm.js` (both modals): a `<div className="flex justify-end space-x-4 pt-4">` (or `space-x-3 pt-4 border-t`) with Cancel and Submit side by side, right-aligned — as the last element inside the form's own normal document flow.
- `AddLead.js` (a full page, not a modal): `<div className="flex justify-center gap-3 py-4 px-4">`, the last element after a roughly 2000-line form.
- **None of the three makes this row sticky.** On `LeaveForm`/`MissPunchForm`, if the modal content is taller than the viewport, the buttons scroll away with the rest of the form. On `AddLead.js` the consequence is worse: reaching Save means scrolling through the entire form first. This is a real gap in all three, not a style choice worth preserving.

**Recommendation:** anchor Cancel/Submit in a `sticky bottom-0 bg-white border-t` footer inside the form's scroll container (see 5.5) for anything longer than a couple of fields. This codebase already has the right pattern for anchoring primary actions to the bottom of the viewport, just not inside a form — `PunchAction.js`'s camera modal renders `<div className="fixed inset-0 z-50 bg-black flex flex-col">` with the video feed as `flex-1` and the Capture/Retake/Use-this-photo controls in a fixed-position `<div className="p-4 bg-black/80 flex flex-col gap-3">` footer that never scrolls out of view. That's the anchoring approach to borrow — a `flex flex-col` container with a fixed-height footer — not the plain-scrolling-flow layout the three form examples currently use.

### 5.5 How long forms handle scrolling inside a modal

**Neither `LeaveForm.js` nor `MissPunchForm.js` constrains its own height or scroll.** Both modals are just `<motion.div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">` (or `max-w-md`) — no `max-h-[...]`, no `overflow-y-auto` on that inner card — and the outer backdrop (`fixed inset-0 ... flex items-center justify-center p-4`) doesn't scroll either. On a viewport shorter than the modal's natural height — a small phone in landscape, or a normal-height phone once the on-screen keyboard has consumed the bottom third of the screen — the modal can render taller than what's visible, with no way to reach the parts (including Submit) that fall outside it. **This is a confirmed gap in the only two modal-forms in this codebase — it is not a pattern to copy.**

**Recommendation:** give the inner modal card `max-h-[90vh] overflow-y-auto`, or better, make it `flex flex-col` with a fixed header, a `flex-1 overflow-y-auto` body, and a sticky footer per §5.4 — so the modal scrolls internally once it's taller than the viewport, independent of whatever the keyboard or device orientation does to the available height.

### 5.6 Validation error placement on a narrow screen

`LeaveForm.js` is the only one of the three with per-field validation, and its placement is correct for narrow screens: each error renders directly beneath the field it belongs to —
```jsx
{errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
```
— never collected into a summary block elsewhere on the page. This matters specifically once the layout goes single-column: an error shown anywhere other than directly under its own field would force the user to map it back across a layout that no longer has side-by-side columns to anchor that association visually.

All three forms also show one form-level error (submission failed for a reason not tied to a single field) near the top: `<div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>` (`MissPunchForm`), a near-identical `motion.div` in `LeaveForm`, and in `AddLead.js` the same pattern plus an explicit `scrollToTop()` call on submit failure — worth keeping deliberately, since a top-anchored error is invisible if the user is scrolled to the bottom of a long form when it appears.

`MissPunchForm.js` and `AddLead.js` skip per-field inline errors and rely on native `<input required>` validation plus the one form-level message. That's a defensible simplification for a short form (the browser's native validation UI already points at the exact field), but it's inconsistent with `LeaveForm.js`. **Recommendation:** for any new form with more than 2-3 fields, follow `LeaveForm.js`'s per-field state-driven error pattern rather than relying only on native `required` popups — native validation UI doesn't reliably reposition itself for a single-column mobile relayout, and a form-level-only error is easy to lose track of on a long scrolling page.

---

## 6. Rules that generalize across all of the above

- **Target viewports:** 393×830 (OnePlus 9) for the primary check, 360px wide as the strict minimum. No horizontal scroll at either — if content would overflow, it must wrap, truncate, move to a modal, or collapse into a disclosure. It must never be handled by letting the page scroll sideways.
- **Minimum tap target: 44px.** Applies to every mobile-visible interactive element — buttons, disclosure toggles, modal close icons, grid tiles. `min-h-[44px]` / `h-11` (44px) are the concrete values used across this codebase; icon-only buttons should have equivalent padding even if the icon itself is smaller.
- **Nested modals must `stopPropagation()` on the inner backdrop.** Every modal-in-this-app uses the same three-layer structure:
  ```jsx
  <motion.div className="fixed inset-0 bg-black bg-opacity-50 ..." onClick={onClose}>
    <motion.div className="bg-white rounded-xl ..." onClick={(e) => e.stopPropagation()}>
      {/* content */}
    </motion.div>
  </motion.div>
  ```
  When a second modal (e.g. a photo lightbox) is opened from inside a first modal, its own backdrop click handler must **also** call `e.stopPropagation()` before closing itself — otherwise the click bubbles up to the outer modal's backdrop and closes both at once. This bit exactly once in `AttendanceCalendar.js`'s `DayDetailModal` → lightbox nesting; the fix is always the same:
  ```jsx
  onClick={(e) => {
    e.stopPropagation() // nested inside the parent modal's own backdrop
    setLightboxUrl(null)
  }}
  ```
- **Long text: `truncate` / `break-words` / `min-w-0`.** A flex child that might contain unpredictable-length text (a name, an address, a project title) needs `min-w-0` on itself (flex children default to a min-width based on content, which defeats `truncate`/wrapping) plus `truncate` (single line, ellipsis) or `break-words` (multi-line, wraps instead of overflowing) depending on whether the content is one semantic unit (name — truncate) or free text (an address, a note — break-words).
- **Dense info that won't fit goes into a detail modal — it never shrinks below legibility.** This is the resolution used consistently: don't make a badge 8px to force it into a cell, don't truncate a status label into meaninglessness. Drop it from the compact view (`hidden md:block`) and surface the same information, in full, in a tap-triggered modal (`AttendanceCalendar.js`'s day modal, `EmployeeAttendance.js`'s `AttendanceDetailsModal`). If nothing needs to be dropped, the compact view is allowed to just be smaller/differently arranged (§1.3) — dropping content is the last resort, not the first.

---

## 7. Checklist before calling a mobile page done

Run through this at 360px width and at 393×830 before considering any page finished:

1. **No horizontal scroll** at 360px or 393px — check the full page, not just the viewport-width containers (a single unwrapped long string or a fixed-width child is enough to break this).
2. **Every interactive element is ≥44px** in its tappable dimension (buttons, toggles, tiles, modal close icons) — not just the icon glyph, the actual hit area.
3. **Desktop is pixel-identical to before your change.** Every new mobile rule is behind `md:` in the correct direction (`hidden md:block`, `md:hidden`, `md:flex-none`, etc.) — diff the desktop viewport specifically, don't just eyeball mobile.
4. **No wide, always-visible block sits above the primary action.** If there's one thing the user came to this page to do (check in, search, submit), it must be reachable without scrolling past a tall header/legend/summary block first — collapse or compact those blocks (§1, §2) instead.
5. **Any list/table has an explicit mobile equivalent** — either a card layout (§1) or, if the data is inherently grid-shaped (a calendar), a compacted grid with detail pushed to a modal (§2). Never an untransformed table left to horizontally scroll.
6. **Wide action buttons follow the icon+short-label conversion** (§1.3), preserving the exact same color-coding and click handler as desktop — never re-derived, never dropped. Any dynamic value dropped from a label has a confirmed second home — color-coding, a badge, or the detail modal — not silence (§1.3).
7. **Permission-gated navigation/module lists come from `getNavItems(permissions)`** (§4) — never a second hardcoded list.
8. **Nested modals (lightbox-in-modal, confirm-in-modal) stop propagation on their own backdrop** (§6) so closing the inner one never silently closes the outer one too.
9. **Long/unpredictable text is truncated or wrapped, never left to overflow** — check a long name, a long address, a long note field specifically, not just the happy-path short values used while developing.
10. **Nothing was shrunk past legibility to make it fit.** If a badge, label, or detail had to get smaller than is comfortably readable, it should have been moved to a modal instead (§6) — re-check whether that's still true after your change.
11. **Forms collapse to a single column on mobile** (`grid-cols-1 md:grid-cols-2`, never a raw `<table>` left to horizontally scroll — §5.1), every text/date/time/select input is `text-base` or larger (§5.2), and native `<input type="date"/"time">`/`<select>` are used unless there's a concrete reason they can't work (§5.3).
12. **A modal form's Cancel/Submit row is reachable at any content length and any viewport height** — sticky footer inside a scroll container for anything longer than a couple of fields, and the modal card itself scrolls internally (`max-h-[...] overflow-y-auto` or `flex flex-col` with a scrolling body) rather than relying on the page/backdrop to scroll (§5.4, §5.5).
13. **Validation errors render directly under the field they belong to**, not just as a single form-level message, once a form has more than 2-3 fields (§5.6).
