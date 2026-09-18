# Guided warehouse canvas redesign

## Objective

Replace the current Spatial Studio canvas implementation with a guided, canvas-first editor. A user must be able to create a warehouse manually from hall to bin without depending on hidden side-panel knowledge. Real dimensions and containment remain authoritative; the canvas changes projection when the user opens a deeper container.

## Root cause

The current renderer uses one top-down rectangle representation for halls, aisles, racks, shelves, and bins. New children also start at the centre of their parent. Consequently, repeated manual additions overlap, aisles do not communicate a usable travel lane, physically small shelves and bins become illegible, and the user is not guided toward the next valid action.

The replacement canvas will not reuse the existing generic `Canvas2D` and `NodeShape` rendering approach. It may reuse the document/store contracts where they remain correct, but visual composition and canvas interaction are rebuilt from scratch.

## Guided canvas workflow

- An empty warehouse displays a large in-canvas `Add first hall` action and a short explanation.
- Selecting a container displays an in-canvas contextual action rail containing only valid children: Hall → Aisle/Open Store/Zone/Gate/Shutter, Aisle → Rack, Rack → Shelf, Shelf → Bin.
- After adding an item, it is selected, its dimensions are visible, and the canvas highlights the recommended next action.
- Every scoped view includes an in-canvas breadcrumb and Back button. The right hierarchy tree remains synchronized but is not required to complete creation.
- Empty containers show a visual placement guide and an action such as `Add first aisle`, `Add first rack`, `Add first shelf`, or `Add first bin`.
- Multi-add controls are available on canvas for repetitive objects, for example `Add rack` and `Add rack row`, or `Add bin` and `Fill shelf`.
- Invalid child actions are not shown. If the selected component has no remaining physical capacity, the canvas explains why addition is blocked.
- The toolbar and side panels remain secondary controls for templates and exact properties; the complete manual workflow is possible from the canvas.

## Canvas sizing model

- Every item stores real physical width, depth, and height in canonical feet, with the existing unit conversion controls used for entry and display.
- Floor-plan views use one consistent physical scale for parent and children. Display stretching of narrow halls is removed because it distorts component proportions.
- Rack and shelf scopes use elevation/detail projections with an explicit `Not floor-plan scale` indicator while still showing real dimensions beside components.
- Minimum on-screen hit areas and label boxes are presentation-only overlays. They never alter real sizes or containment calculations.
- Dimension lines appear on the selected component and its parent. Labels move outside small shapes with leader lines instead of shrinking into unreadable text.
- Fit, zoom, and pan operate independently from real dimensions. A scale legend communicates the current floor-plan scale.

## Visual projections

### Warehouse and hall floor plan

- Warehouse scope shows halls and rooms within the building envelope.
- Hall scope shows aisle envelopes, open storage, operational zones, gates, and shutters.
- An aisle is drawn as a clear circulation lane with boundaries, direction/centre markings, its code above the lane, and racks positioned along its sides.
- Real X/Y/width/depth values drive all floor-plan geometry.
- Newly added halls and aisles show dimension handles and spacing guides immediately.

### Aisle detail

- Opening an aisle fits it to the canvas and shows racks in two orderly side banks around a central access path.
- Rack labels sit outside or above the rack footprint when the rectangle is too narrow.
- Aisle width and clear-path dimensions remain visible.
- In-canvas empty slots indicate where the next rack will be placed before creation.

### Rack elevation

- Opening a rack switches from floor plan to a front-elevation projection.
- Shelves appear as horizontal levels distributed using their rack-relative position and dimensions.
- The rack frame, uprights, base, height dimension, face name, rack code, and capacity summary are visible.
- Shelf selection and resizing update the same underlying nodes used by 2D/3D and the hierarchy tree.
- Empty shelf levels and the next valid shelf position are visibly guided.

### Shelf and bin detail

- Opening a shelf shows a compartment view rather than attempting to display tiny bins in floor-plan scale.
- Bins appear as readable, evenly positioned compartments with short labels such as `B01`; the full location identity remains available in the tree and inspector.
- One or many bins must fit without overlap. The view scales the visual cells while preserving each bin's stored real dimensions.
- Selecting a bin highlights it and displays its complete warehouse-to-bin path.
- Bin cells display both their ordinal label and real width; a horizontal capacity guide explains how many bins fit.

## Manual placement

- Add Hall places the next hall in a non-overlapping row/grid within the warehouse.
- Add Aisle places the next aisle in the next free hall lane.
- Add Rack alternates between the left and right banks of its aisle and then advances along the aisle.
- Add Shelf places the next shelf level in the first available vertical position in its rack.
- Add Bin places the next bin compartment in the first available shelf position.
- When there is no valid free position, creation is rejected with a clear message rather than stacking or escaping the parent.
- Dragging/resizing continues to clamp children inside their physical parent.

## Rendering architecture

- Replace the current generic canvas renderer with a new scoped canvas shell and dedicated renderers.
- Add a pure `visualProjection` module that derives a projection kind, physical-to-screen transform, display boxes, labels, dimension guides, and available placement slots from the document, current scope, and canvas size.
- Keep the store document as the single source of physical dimensions and hierarchy. Display boxes are derived and never persisted as fake measurements.
- Split the canvas renderer into focused views: warehouse floor plan, hall floor plan, aisle detail, rack elevation, and shelf/bin detail.
- Add a canvas guidance layer for breadcrumbs, Back, empty-state actions, valid-child actions, placement previews, capacity messages, and scale information.
- Keep selection, opening, Back navigation, tree navigation, deletion, measurement editing, and 2D/3D synchronization connected to the same node IDs.
- Use level-specific label rules instead of one generic font-size calculation.

## Testing

- Unit-test projection selection and deterministic display boxes for hall, aisle, rack, shelf, and bin scopes.
- Unit-test manual next-free placement for multiple children at every level.
- Unit-test that real dimensions remain unchanged by presentation scaling.
- Component-test visible labels, Back navigation, complete location paths, guided empty states, valid child actions, and blocked-capacity messages.
- Run the full automated suite and production build.
- In the browser, start from an empty warehouse and use only in-canvas controls to manually create: hall → multiple aisles → multiple racks → multiple shelves → multiple bins. Open every level, check actual dimensions, label readability, non-overlap, containment, Back navigation, and tree synchronization in both 2D and 3D.

## Scope boundaries

- This remains the separate approval prototype; no ERP integration occurs.
- No server persistence, inventory assignment, or final Review activation is added in this redesign.
- The existing Create Warehouse chrome, unit system, hierarchy identities, and operational-zone workflow are preserved.
