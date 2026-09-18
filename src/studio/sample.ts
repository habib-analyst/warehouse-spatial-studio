import { createEmptyDocument, createNode, type NodeType, type StudioDocument, type StudioNode } from "./model"

type Patch = Partial<StudioNode> & { id: string }

function add(document: StudioDocument, type: NodeType, parentId: string, patch: Patch) {
  const node = { ...createNode(type, parentId, document), ...patch, type, parentId }
  document.nodes[node.id] = node
  return node
}

const pad = (value: number) => String(value).padStart(2, "0")

export function createSampleDocument() {
  const document = createEmptyDocument()
  document.nodes[document.rootId] = {
    ...document.nodes[document.rootId],
    name: "Houston Main Distribution Center",
    width: 268,
    depth: 310,
    height: 26,
  }

  const hallNames = ["Main Storage Hall", "Bulk Storage Hall", "Fast Moving Parts Hall"]
  const halls = hallNames.map((name, hallIndex) => add(document, "hall", document.rootId, {
    id: `sample-hall-${hallIndex + 1}`,
    name,
    code: `HL${pad(hallIndex + 1)}`,
    x: 14 + hallIndex * 84,
    y: 12,
    width: 72,
    depth: 286,
    height: 26,
  }))

  halls.forEach((hall, hallIndex) => {
    for (let aisleIndex = 0; aisleIndex < 3; aisleIndex += 1) {
      const prefix = `HL${pad(hallIndex + 1)}-AV${pad(aisleIndex + 1)}`
      const aisle = add(document, "aisle", hall.id, {
        id: `sample-h${hallIndex + 1}-aisle-${aisleIndex + 1}`,
        name: `Storage Aisle ${aisleIndex + 1}`,
        code: prefix,
        x: 3 + aisleIndex * 24,
        y: 8,
        width: 18,
        depth: 220,
      })

      for (let rackIndex = 0; rackIndex < 3; rackIndex += 1) {
        const rackCode = `${prefix}-R${pad(rackIndex + 1)}`
        const rack = add(document, "rack", aisle.id, {
          id: `sample-h${hallIndex + 1}-a${aisleIndex + 1}-rack-${rackIndex + 1}`,
          name: `Rack ${rackIndex + 1}`,
          code: rackCode,
          x: 3,
          y: 10 + rackIndex * 68,
          width: 12,
          depth: 42,
          height: 12,
          faces: 2,
          shelves: 4,
          binsPerShelf: 6,
        })

        for (let shelfIndex = 0; shelfIndex < 4; shelfIndex += 1) {
          const shelfCode = `${rackCode}-S${pad(shelfIndex + 1)}`
          const shelf = add(document, "shelf", rack.id, {
            id: `${rack.id}-shelf-${shelfIndex + 1}`,
            name: `Shelf ${shelfIndex + 1}`,
            code: shelfCode,
            x: .5,
            y: 2 + shelfIndex * 9,
            width: 11,
            depth: 3,
            height: 1,
          })

          for (let binIndex = 0; binIndex < 6; binIndex += 1) {
            add(document, "bin", shelf.id, {
              id: `${shelf.id}-bin-${binIndex + 1}`,
              name: `Bin ${binIndex + 1}`,
              code: `${shelfCode}-B${pad(binIndex + 1)}`,
              x: .25 + binIndex * 1.75,
              y: .5,
              width: 1.5,
              depth: 2,
              height: 1.2,
            })
          }
        }
      }
    }
  })

  const hall1 = halls[0]
  add(document, "openStore", hall1.id, { id: "sample-open-store", name: "Open Storage", code: "HL01-OS01", x: 5, y: 232, width: 62, depth: 28, height: 5 })
  ;[
    ["Receiving", "RCV01", "#06b6d4"], ["Sorting", "SRT01", "#f59e0b"],
    ["Quality Control", "QC01", "#8b5cf6"], ["Quarantine", "QTN01", "#f43f5e"],
    ["Returns", "RTN01", "#a855f7"], ["Dispatch", "DSP01", "#14b8a6"],
  ].forEach(([name, code, color], index) => add(document, "zone", hall1.id, {
    id: `sample-zone-${index + 1}`, name, code: `HL01-${code}`, color, zoneKind: name,
    purpose: name === "Receiving" ? "Inbound inspection" : name,
    team: name === "Dispatch" ? "Outbound" : "Operations", capacity: 24,
    x: 3 + index * 11, y: 264, width: 10, depth: 13, height: 5,
  }))
  ;[5, 29, 53].forEach((x, index) => add(document, "shutter", hall1.id, {
    id: `sample-shutter-${index + 1}`, name: ["Receiving", "Main Access", "Dispatch"][index],
    code: `HL01-S${pad(index + 1)}`, x, y: 282, width: 14, depth: 4, height: 14,
  }))

  return document
}
