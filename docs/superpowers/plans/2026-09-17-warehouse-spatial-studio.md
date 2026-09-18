# Warehouse Spatial Studio Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate localhost React prototype of the screenshot-matched warehouse Spatial Studio with a real constrained hierarchy and synchronized 2D/3D renderers.

**Architecture:** A normalized Zustand document store owns every warehouse node and all mutations. Konva and React Three Fiber are stateless projections of that document; shared geometry helpers enforce containment, snapping, codes, hierarchy rules, validation, sample generation, and fit calculations.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Konva/react-konva, Three.js, @react-three/fiber, @react-three/drei, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-17-warehouse-spatial-studio-design.md`

## Global Constraints

- Create files only under `D:\sanwa system\warehouse-spatial-studio-prototype`.
- Do not modify `D:\sanwa system\ERP2.0_Frontend`.
- Start with one empty warehouse root; sample content must be opt-in.
- Enforce Warehouse -> Hall/Room -> Aisle/OpenStore/Gate/Shutter -> Rack -> Shelf -> Bin.
- Use one document state for 2D and 3D.
- Keep the visual language aligned to the supplied white/blue screenshots.

---

### Task 1: Project shell and hierarchy domain

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/studio/model.ts`, `src/studio/model.test.ts`

**Interfaces:**
- Produces: `StudioNode`, `StudioDocument`, `NodeType`, `ALLOWED_CHILDREN`, `createEmptyDocument()`, `canParent()`, `nextCode()`, `createNode()`.

- [ ] Write tests asserting the empty document has one Warehouse and that every allowed/forbidden parent-child pair matches the spec.
- [ ] Run `npm test -- --run src/studio/model.test.ts` and confirm failure because the model is absent.
- [ ] Add the Vite shell and minimal hierarchy model.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Geometry, validation, history, and sample document

**Files:**
- Create: `src/studio/geometry.ts`, `src/studio/geometry.test.ts`
- Create: `src/studio/sample.ts`, `src/studio/sample.test.ts`
- Create: `src/studio/store.ts`, `src/studio/store.test.ts`

**Interfaces:**
- Produces: `snapValue()`, `clampToParent()`, `rectsOverlap()`, `validateDocument()`, `createSampleDocument()`, `useStudioStore`.
- Store actions: `addNode`, `updateNode`, `moveNode`, `resizeNode`, `duplicateNode`, `deleteNode`, `selectNode`, `setScope`, `undo`, `redo`, `loadSample`, `clearDocument`.

- [ ] Write failing tests for snapping, containment, overlap validation, deterministic sample counts, valid/invalid additions, selection, undo, and redo.
- [ ] Run all three focused test files and verify expected failures.
- [ ] Implement minimal pure helpers, sample data, and Zustand state transitions.
- [ ] Re-run the focused tests and confirm they pass.

### Task 3: Screenshot-matched application shell

**Files:**
- Create: `src/studio/StudioShell.tsx`
- Create: `src/studio/components/StudioHeader.tsx`
- Create: `src/studio/components/ContextToolbar.tsx`
- Create: `src/studio/components/LibraryPanel.tsx`
- Create: `src/studio/components/HierarchyTree.tsx`
- Create: `src/studio/components/PropertiesPanel.tsx`
- Create: `src/studio/components/StatusBar.tsx`
- Create: `src/studio/StudioShell.test.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `useStudioStore` and domain metadata.
- Produces: the responsive card shell and drag payload MIME `application/x-sanwa-studio-node`.

- [ ] Write a failing Testing Library test for title, 2D/3D controls, palette groups, properties panel, hierarchy tree, empty-state text, and sample/reset actions.
- [ ] Run the shell test and confirm failure.
- [ ] Implement the compact title row, tool row, side panels, bottom status bar, and screenshot-matched CSS tokens.
- [ ] Re-run the shell test and confirm it passes.

### Task 4: Interactive 2D engineering canvas

**Files:**
- Create: `src/studio/canvas/Canvas2D.tsx`
- Create: `src/studio/canvas/GridLayer.tsx`
- Create: `src/studio/canvas/NodeShape.tsx`
- Create: `src/studio/canvas/DimensionLayer.tsx`
- Create: `src/studio/canvas/canvasMath.ts`, `src/studio/canvas/canvasMath.test.ts`
- Modify: `src/studio/StudioShell.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: store document, selection, scope, toggles, and drag MIME.
- Produces: selection, drag, resize, double-click scope, wheel zoom, pan, fit, and drop-to-add interactions.

- [ ] Write failing tests for world/screen conversion, zoom-at-pointer invariance, fit scale, and parent-local drop coordinates.
- [ ] Run the canvas math tests and verify failure.
- [ ] Implement the math helpers, then run tests to green.
- [ ] Implement Konva grid, shapes, labels, dimensions, Transformer, pan/zoom/fit, and palette drop handling.
- [ ] Manually verify an added Hall stays inside the Warehouse and an Aisle cannot be added directly to the Warehouse.

### Task 5: Synchronized 3D view

**Files:**
- Create: `src/studio/scene/Scene3D.tsx`
- Create: `src/studio/scene/StudioMesh.tsx`
- Create: `src/studio/scene/sceneGeometry.ts`, `src/studio/scene/sceneGeometry.test.ts`
- Modify: `src/studio/StudioShell.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: the same document and selection used by Canvas2D.
- Produces: deterministic mesh transforms, OrbitControls, CSS labels, click selection, and camera fit.

- [ ] Write failing tests mapping warehouse coordinates/dimensions to Three.js position/scale for containers, racks, shelves, and bins.
- [ ] Run the scene geometry test and verify failure.
- [ ] Implement scene mapping helpers and run tests to green.
- [ ] Implement the Three Fiber scene, lighting, floor grid, walls/boxes, rack/shelf/bin rendering, selection highlighting, labels, and orbit controls.
- [ ] Verify switching 2D -> 3D -> 2D keeps the same selected node and geometry.

### Task 6: Verification and approval handoff

**Files:**
- Create: `README.md`
- Modify only prototype files required by findings.

**Interfaces:**
- Produces: reproducible start instructions and a visually verified approval build.

- [ ] Run `npm test -- --run` and require all tests to pass without warnings.
- [ ] Run `npm run build` and require a successful production build.
- [ ] Start `npm run dev -- --host 127.0.0.1` and open the localhost page.
- [ ] Inspect 2D empty state, sample Building view, Storage view, Layout view, hierarchy additions, property edits, and 3D mode at laptop viewport size.
- [ ] Check browser console for runtime errors and fix any findings with a failing regression test when behavior is involved.
- [ ] Document exact start command and prototype scope in `README.md`.
