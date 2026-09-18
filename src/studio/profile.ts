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
  name: "",
  code: "",
  role: "",
  status: "",
  country: "",
  state: "",
  city: "",
  zip: "",
  street: "",
  timezone: "",
  manager: "",
  phone: "",
  email: "",
  days: [],
  opensAt: "",
  closesAt: "",
  allDay: false,
  measurement: "Imperial",
  weightUnit: "lb",
  setAsDefault: false,
  generateLabels: false,
  notifyManager: false,
  confirmed: false,
})
