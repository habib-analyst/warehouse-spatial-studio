import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { createEmptyDocument } from "../model"
import { useStudioStore } from "../store"
import { GuidedCanvas } from "./GuidedCanvas"

describe("guided canvas", () => {
  beforeEach(() => useStudioStore.setState({ document: createEmptyDocument(), selectedId: "warehouse-root", scopeId: "warehouse-root", studioMode: "building", rightTab: "tree", past: [], future: [], notice: null }))

  it("guides an empty warehouse into its first hall directly on canvas", () => {
    render(<GuidedCanvas />)
    expect(screen.getByRole("button", { name: "Add first hall" })).toBeInTheDocument()
    expect(screen.getByText("280 × 420 ft")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Add first hall" }))
    expect(screen.getByRole("button", { name: "Open HL01 Hall HL01" })).toBeInTheDocument()
  })

  it("exposes only valid child creation actions as each container opens", () => {
    const hall = useStudioStore.getState().addNode("hall", "warehouse-root")!
    useStudioStore.getState().setScope(hall)
    render(<GuidedCanvas />)
    expect(screen.getByRole("button", { name: "Add Vertical Aisle" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add Horizontal Aisle" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add Rack" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Add Vertical Aisle" }))
    fireEvent.click(screen.getByRole("button", { name: /Open AV01/ }))
    expect(screen.getAllByRole("button", { name: "Add Rack" }).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: "Add Rack" }))
    fireEvent.click(screen.getByRole("button", { name: /Open RA01/ }))
    expect(screen.getByRole("button", { name: "Add Shelf" })).toBeInTheDocument()
    expect(screen.getByText(/Front elevation/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Add Shelf" }))
    fireEvent.click(screen.getByRole("button", { name: /Open SF01/ }))
    expect(screen.getByRole("button", { name: "Add Bin" })).toBeInTheDocument()
    expect(screen.getByText(/cells enlarged for readability/)).toBeInTheDocument()
  })

  it("keeps back navigation and full selected location identity on canvas", () => {
    const hall = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const aisle = useStudioStore.getState().addNode("aisle", hall)!
    useStudioStore.getState().setScope(aisle)
    render(<GuidedCanvas />)
    expect(screen.getByRole("button", { name: "Canvas back to HL01" })).toBeInTheDocument()
    expect(screen.getByText("WH04 / HL01 / AV01")).toBeInTheDocument()
  })
})
