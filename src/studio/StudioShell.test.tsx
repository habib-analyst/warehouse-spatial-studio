import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createEmptyDocument } from "./model"
import { defaultProfile } from "./profile"
import { useStudioStore } from "./store"
import { StudioShell } from "./StudioShell"

vi.mock("./canvas/Canvas2D", () => ({ Canvas2D: () => <div aria-label="2D warehouse canvas" /> }))

describe("Spatial Studio shell", () => {
  beforeEach(() => {
    useStudioStore.setState({
      document: createEmptyDocument(),
      selectedId: "warehouse-root",
      scopeId: "warehouse-root",
      wizardStep: 1,
      studioMode: "building",
      viewMode: "2d",
      freePlace: false,
      showCanvasTree: true,
      profile: defaultProfile(),
      leftTab: "library",
      rightTab: "properties",
      measurementMode: "global",
      globalUnit: "ft",
      fieldUnits: {},
      past: [],
      future: [],
    })
  })

  it("starts on details and continues into the spatial studio", () => {
    render(<StudioShell />)
    expect(screen.getByRole("heading", { name: "Warehouse details" })).toBeInTheDocument()
    expect(screen.getByText("Warehouse profile preview")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Continue to Building/i }))
    expect(screen.getByRole("heading", { name: "Building & halls" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "2D view" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3D view" })).toBeInTheDocument()
    expect(screen.getByText("Building envelope")).toBeInTheDocument()
    expect(screen.getByText("Component library")).toBeInTheDocument()
  })

  it("switches workspace context and creates a hall from the component library", () => {
    useStudioStore.setState({ wizardStep: 2, studioMode: "building" })
    render(<StudioShell />)
    fireEvent.click(screen.getAllByRole("button", { name: "Add Hall" })[0])
    expect(Object.values(useStudioStore.getState().document.nodes).some((node) => node.type === "hall")).toBe(true)
    expect(screen.getByText(/HL01 added/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Continue to Storage/i }))
    expect(screen.getByText("Rack template")).toBeInTheDocument()
  })

  it("opens the right-side hierarchy explorer and exposes the next child level", () => {
    useStudioStore.getState().loadSample()
    useStudioStore.setState({ wizardStep: 3 })
    render(<StudioShell />)
    fireEvent.click(screen.getByRole("button", { name: "Tree explorer" }))
    expect(screen.getByRole("heading", { name: "Location hierarchy" })).toBeInTheDocument()
    expect(screen.getAllByText("HL01").length).toBeGreaterThan(0)
  })

  it("keeps delete available in the hierarchy explorer", () => {
    useStudioStore.getState().loadSample()
    const aisle = Object.values(useStudioStore.getState().document.nodes).find((node) => node.type === "aisle")!
    useStudioStore.setState({ wizardStep: 3, selectedId: aisle.id, scopeId: aisle.parentId ?? "warehouse-root" })
    render(<StudioShell />)
    fireEvent.click(screen.getByRole("button", { name: "Tree explorer" }))
    expect(screen.getByRole("button", { name: `Delete ${aisle.code}` })).toBeInTheDocument()
  }, 15_000)
})
