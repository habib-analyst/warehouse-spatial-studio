# Warehouse Spatial Studio

Standalone prototype for a Create Warehouse Spatial Studio: 2D/3D canvas, hierarchy tree, and guided Building → Storage → Layout → Review flow.

## Quick start

```bash
git clone https://github.com/habib-analyst/warehouse-spatial-studio.git
cd warehouse-spatial-studio
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://127.0.0.1:5173`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Run Vitest |
| `npm run preview` | Preview production build |

## Hierarchy

```text
Warehouse
└── Hall / Room
    ├── Aisle
    │   └── Rack
    │       └── Shelf
    │           └── Bin
    ├── Open store / Operational zone
    └── Gate / Shutter
```

## Notes

- Default seed loads a full sample warehouse (halls, aisles, racks, shelves, bins).
- **Reset** clears to an empty warehouse.
- Canvas **Hierarchy** card (top-right) shows the full expandable tree; **View** opens a visual tree popup.
- This prototype is separate from the ERP app until design approval.
