export type WarehouseProfile = {
  name: string
  code: string
  role: string
  status: string
  country: string
  state: string
  city: string
  zip: string
  street: string
  timezone: string
  manager: string
  phone: string
  email: string
  days: string[]
  opensAt: string
  closesAt: string
  allDay: boolean
  measurement: "Imperial" | "Metric"
  weightUnit: string
  setAsDefault: boolean
  generateLabels: boolean
  notifyManager: boolean
  confirmed: boolean
}

export const defaultProfile = (): WarehouseProfile => ({
  name: "Houston Main Distribution Center",
  code: "WH04",
  role: "Auto parts distribution",
  status: "Planning",
  country: "United States",
  state: "Texas",
  city: "Houston",
  zip: "77001",
  street: "1450 Industrial Parkway",
  timezone: "America/Chicago (UTC-05:00)",
  manager: "Michael Torres",
  phone: "+1 (713) 555-0148",
  email: "m.torres@company.com",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  opensAt: "09:00",
  closesAt: "18:00",
  allDay: false,
  measurement: "Imperial",
  weightUnit: "lb",
  setAsDefault: true,
  generateLabels: true,
  notifyManager: false,
  confirmed: false,
})
