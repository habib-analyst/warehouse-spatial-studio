# Guided Warehouse Canvas Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic warehouse canvas with a guided, correctly scaled hierarchy editor that can create hall-to-bin locations entirely on canvas.

**Architecture:** A pure projection module selects floor-plan, aisle-detail, rack-elevation, or shelf-detail mode and derives presentation boxes without mutating real dimensions. A new scoped canvas renderer consumes those projections, while a guidance overlay exposes valid child actions, breadcrumbs, Back, dimensions, and capacity information. Store placement is changed from centre-stacking to deterministic next-free slots.

**Tech Stack:** React 19, TypeScript, Zustand, Konva/react-konva, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-18-level-specific-warehouse-visuals-design.md`

## Global Constraints

- Preserve canonical real dimensions and the existing `StudioDocument` hierarchy.
- The complete manual workflow must work through canvas controls.
- Do not integrate into `ERP2.0_Frontend`.
- No server persistence or inventory behavior.
- This standalone directory is not a Git repository; verification checkpoints replace commit steps.

---

### Task 1: Deterministic manual placement

**Files:**
- Create: `src/studio/placement.ts`
- Create: `src/studio/placement.test.ts`
- Modify: `src/studio/store.ts`

**Interfaces:**
- Produces: `nextPlacement(document, parentId, type, size): { x; y; width; depth } | null`
- Consumes: physical parent/child sizes and existing siblings.

- [ ] **Step 1: Write failing placement tests** for multiple halls, aisles, racks, shelves, and bins; assert literal non-overlapping positions and `null` when capacity is exhausted.
- [ ] **Step 2: Run `npm test -- --run src/studio/placement.test.ts`** and verify failure because `nextPlacement` does not exist.
- [ ] **Step 3: Implement typed placement strategies**: grid for halls, lanes for aisles, alternating banks for racks, vertical levels for shelves, horizontal cells for bins.
- [ ] **Step 4: Update `addNode`** to use `nextPlacement` and return an informative notice when no slot fits.
- [ ] **Step 5: Re-run placement and store tests** and verify green.

### Task 2: Level-specific projections

**Files:**
- Create: `src/studio/canvas/visualProjection.ts`
- Create: `src/studio/canvas/visualProjection.test.ts`

**Interfaces:**
- Produces: `projectionKind(scopeType)`, `projectScope(document, scopeId)`, and `ProjectedNode` boxes/labels.
- Consumes: unchanged real `StudioNode` dimensions and hierarchy.

- [ ] **Step 1: Write failing projection tests** asserting hall=`floor`, aisle=`aisle`, rack=`rack-elevation`, shelf=`shelf-detail`, and hand-derived display boxes.
- [ ] **Step 2: Run the focused test** and verify missing-module failure.
- [ ] **Step 3: Implement pure projection functions** with presentation-only minimum hit boxes and no document mutation.
- [ ] **Step 4: Assert real dimensions are unchanged** after every projection.
- [ ] **Step 5: Re-run focused tests** and verify green.

### Task 3: New guided canvas renderer

**Files:**
- Create: `src/studio/canvas/GuidedCanvas.tsx`
- Create: `src/studio/canvas/GuidedCanvas.test.tsx`
- Create: `src/studio/canvas/GuidanceOverlay.tsx`
- Create: `src/studio/canvas/ScopedNode.tsx`
- Modify: `src/studio/StudioShell.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `projectScope`, store `addNode/setScope/selectNode`, and real node IDs.
- Produces: accessible buttons `Add first hall`, `Add Aisle`, `Add Rack`, `Add Shelf`, `Add Bin`, `Back to <code>`.

- [ ] **Step 1: Write failing component tests** for empty guidance, hall child controls, aisle rack controls, rack shelf controls, shelf bin controls, breadcrumbs, and real dimension labels.
- [ ] **Step 2: Run the focused component test** and verify the old canvas lacks those controls.
- [ ] **Step 3: Build the new scoped canvas shell** with floor, aisle, rack-elevation, and shelf-detail drawing branches.
- [ ] **Step 4: Build the guidance overlay** with contextual actions, Back, breadcrumb, scale/elevation indicator, and next-slot preview.
- [ ] **Step 5: Replace `Canvas2D` usage in `StudioShell`** while leaving the old files unused for rollback until approval.
- [ ] **Step 6: Add responsive visual styling** and run focused tests until green.

### Task 4: End-to-end verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: completed placement, projection, and guided canvas behavior.
- Produces: verified standalone approval prototype.

- [ ] **Step 1: Run `npm test -- --run`** and fix only regressions caused by the rebuild.
- [ ] **Step 2: Run `npm run build`** and confirm TypeScript/Vite success.
- [ ] **Step 3: In the browser clear the warehouse and use only canvas controls** to create one hall, at least two aisles, multiple racks, multiple shelves, and multiple bins.
- [ ] **Step 4: Open every scope and verify** sizing, readable labels, non-overlap, containment, Back, tree synchronization, and console errors.
- [ ] **Step 5: Update README** with the guided workflow and final verification commands.
