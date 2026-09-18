import { ArrowLeft, ArrowRight, Building2, Check } from "lucide-react"
import { childrenOf } from "../model"
import { useStudioStore, type WizardStep } from "../store"

const steps = ["Details", "Building", "Storage", "Layout", "Review"] as const

const modeContent = {
  1: { title: "Warehouse details", copy: "Set the identity, location and operating defaults for this warehouse." },
  2: { title: "Building & halls", copy: "Define the warehouse envelope, then divide it into manageable halls." },
  3: { title: "Storage structure", copy: "Generate aisles, racks, faces, shelves and bins for each hall." },
  4: { title: "Operations & layout", copy: "Place operational zones, shutters and safe movement routes." },
  5: { title: "Review & create", copy: "Confirm the warehouse structure, capacity and operational readiness before activation." },
} as const

function useWizardNav() {
  const { document, wizardStep, setWizardStep, setScope, profile } = useStudioStore()
  const firstHall = childrenOf(document, document.rootId).find((node) => node.type === "hall" || node.type === "room")
  const goBack = () => setWizardStep(Math.max(1, wizardStep - 1) as WizardStep)
  const goNext = () => {
    if (wizardStep === 2 && firstHall) setScope(firstHall.id)
    if (wizardStep < 5) setWizardStep((wizardStep + 1) as WizardStep)
  }
  const backLabel = wizardStep === 1 ? "Back" : wizardStep === 2 ? "Details" : wizardStep === 3 ? "Building" : wizardStep === 4 ? "Storage" : "Layout"
  const nextLabel = wizardStep === 1 ? "Building" : wizardStep === 2 ? "Storage" : wizardStep === 3 ? "Layout" : wizardStep === 4 ? "Review" : "Create & Activate"
  const nextDisabled = wizardStep === 5 && !profile.confirmed
  return { wizardStep, goBack, goNext, backLabel, nextLabel, nextDisabled, setWizardStep }
}

export function CreateProgress() {
  const { wizardStep, goBack, goNext, backLabel, nextLabel, nextDisabled, setWizardStep } = useWizardNav()
  return (
    <header className="create-progress">
      <button type="button" className="progress-nav progress-back" aria-label={`Back to ${backLabel}`} onClick={goBack}>
        <ArrowLeft size={14} /><span>{backLabel}</span>
      </button>
      <nav aria-label="Create warehouse progress">
        {steps.map((label, index) => {
          const number = (index + 1) as WizardStep
          return (
            <button
              type="button"
              className={`progress-step ${number === wizardStep ? "active" : ""} ${number < wizardStep ? "complete" : ""}`}
              key={label}
              onClick={() => setWizardStep(number)}
            >
              <span>{number < wizardStep ? <Check size={12} /> : number}</span>
              <strong>{label}</strong>
              {index < steps.length - 1 && <i />}
            </button>
          )
        })}
      </nav>
      <button
        type="button"
        className="progress-nav progress-next"
        aria-label={wizardStep === 5 ? "Create & Activate Warehouse" : `Continue to ${nextLabel}`}
        onClick={goNext}
        disabled={nextDisabled}
      >
        <span>{wizardStep === 5 ? "Create & Activate" : `Continue to ${nextLabel}`}</span>
        <ArrowRight size={14} />
      </button>
    </header>
  )
}

export function StepContextHeader() {
  const wizardStep = useStudioStore((state) => state.wizardStep)
  const content = modeContent[wizardStep]
  return (
    <section className="step-context-title">
      <span>{wizardStep}</span>
      <div><h2>{content.title}</h2><p>{content.copy}</p></div>
    </section>
  )
}

export function ScopeStrip() {
  const { document, scopeId, profile } = useStudioStore()
  const scope = document.nodes[scopeId]
  return (
    <section className="scope-strip">
      <Building2 size={16} />
      <div>
        <strong>{profile.code} · {scope.code} · {scope.name}</strong>
        <small>{scope.width.toFixed(2)} × {scope.depth.toFixed(2)} ft</small>
      </div>
    </section>
  )
}
