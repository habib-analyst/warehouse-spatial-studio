import { AlertTriangle, CheckCircle2, Pencil } from "lucide-react"
import { childrenOf, descendantsOf } from "../model"
import { validateDocument } from "../geometry"
import { useStudioStore } from "../store"

export function ReviewStep() {
  const { document, profile, updateProfile, setWizardStep, setStudioMode } = useStudioStore()
  const root = document.nodes[document.rootId]
  const halls = childrenOf(document, root.id).filter((node) => node.type === "hall" || node.type === "room")
  const all = Object.values(document.nodes)
  const racks = all.filter((node) => node.type === "rack").length
  const shelves = all.filter((node) => node.type === "shelf").length
  const bins = all.filter((node) => node.type === "bin").length
  const aisles = all.filter((node) => node.type === "aisle").length
  const zones = all.filter((node) => node.type === "zone").length
  const shutters = all.filter((node) => node.type === "shutter" || node.type === "gate").length
  const faces = racks * 2
  const issues = validateDocument(document)
  const errors = issues.filter((issue) => issue.severity === "error")
  const recommendations = issues.filter((issue) => issue.severity === "recommendation")
  const ready = errors.length === 0
  const area = Math.round(root.width * root.depth)
  const edit = (step: 1 | 2 | 3 | 4, mode?: "building" | "storage" | "layout") => {
    setWizardStep(step)
    if (mode) setStudioMode(mode)
  }

  return (
    <div className="review-step">
      <div className="review-main">
        <header className="step-page-title">
          <span>5</span>
          <div>
            <h2>Review & create</h2>
            <p>Confirm the warehouse structure, capacity and operational readiness before activation.</p>
          </div>
        </header>
        <div className={`ready-banner ${ready ? "ok" : "bad"}`}>
          {ready ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{ready ? `Ready to create: All required checks passed. ${recommendations.length} recommendations can be reviewed later.` : `${errors.length} blocking errors must be fixed first.`}</span>
        </div>

        <section className="config-panel">
          <header><h3>Warehouse summary</h3><button type="button" className="text-button" onClick={() => edit(1)}><Pencil size={12} />Edit</button></header>
          <div className="config-body summary-grid">
            <div><small>Name</small><strong>{profile.name}</strong></div>
            <div><small>Code</small><strong>{profile.code}</strong></div>
            <div><small>Status</small><strong className="tag">{profile.status}</strong></div>
            <div><small>Role</small><strong>{profile.role}</strong></div>
            <div><small>Location</small><strong>{profile.city}, {profile.state}</strong></div>
            <div><small>Manager</small><strong>{profile.manager}</strong></div>
            <div><small>Hours</small><strong>{profile.allDay ? "24 hours" : `${profile.opensAt} – ${profile.closesAt}`}</strong></div>
            <div><small>Units</small><strong>{profile.measurement}</strong></div>
          </div>
        </section>

        <section className="config-panel">
          <header><h3>Structure & capacity</h3><button type="button" className="text-button" onClick={() => edit(2, "building")}><Pencil size={12} />Edit</button></header>
          <div className="config-body kpi-grid">
            <div><strong>{halls.length}</strong><small>Halls</small></div>
            <div><strong>{area.toLocaleString()} ft²</strong><small>Floor area</small></div>
            <div><strong>{racks}</strong><small>Racks</small></div>
            <div><strong>{faces}</strong><small>Faces</small></div>
            <div><strong>{shelves}</strong><small>Shelves</small></div>
            <div><strong>{bins.toLocaleString()}</strong><small>Bins</small></div>
            <div><strong>{aisles}</strong><small>Storage aisles</small></div>
            <div><strong>{zones}</strong><small>Zones</small></div>
          </div>
        </section>

        <section className="config-panel">
          <header><h3>Operations</h3><button type="button" className="text-button" onClick={() => edit(4, "layout")}><Pencil size={12} />Edit</button></header>
          <div className="config-body">
            <div className="ops-row"><span>{shutters} Shutters / gates</span><span>{zones} Operational zones</span><span>{all.filter((n) => n.type === "openStore").length} Open storage</span></div>
          </div>
        </section>

        <section className="config-panel">
          <header><h3>Validation results</h3></header>
          <div className="config-body validation-list">
            {errors.length === 0 && <div className="ok"><CheckCircle2 size={14} />All location codes are unique</div>}
            {errors.length === 0 && <div className="ok"><CheckCircle2 size={14} />Storage objects remain inside hall boundaries</div>}
            {errors.map((issue) => <div key={issue.id} className="bad"><AlertTriangle size={14} />{issue.message}</div>)}
            {recommendations.slice(0, 4).map((issue) => <div key={issue.id} className="warn"><AlertTriangle size={14} />{issue.message}</div>)}
          </div>
        </section>

        <section className="identity-trail">
          <strong>Location identity</strong>
          <span>Warehouse › Hall › Aisle › Rack › Face › Shelf › Bin</span>
          <em>{bins.toLocaleString()} unique bin identities will be created</em>
        </section>
      </div>

      <aside className="review-side">
        <section className="config-panel preview-map-card">
          <header><h3>Final layout preview</h3><span>Read-only</span></header>
          <div className="config-body">
            <div className="mini-floorplan">
              {halls.slice(0, 2).map((hall) => {
                const kids = descendantsOf(document, hall.id).filter((node) => ["rack", "zone", "openStore"].includes(node.type))
                return <div key={hall.id} className="mini-hall" style={{ width: `${Math.max(28, (hall.width / root.width) * 100)}%` }}>
                  <b>{hall.code}</b>
                  {kids.slice(0, 8).map((kid) => <i key={kid.id} className={`mini-${kid.type}`} style={{ left: `${(kid.x / Math.max(1, hall.width)) * 100}%`, top: `${(kid.y / Math.max(1, hall.depth)) * 100}%` }} />)}
                </div>
              })}
            </div>
            <small>{root.width.toFixed(2)} × {root.depth.toFixed(2)} ft</small>
          </div>
        </section>

        <section className="config-panel">
          <header><h3>Creation summary</h3></header>
          <div className="config-body">
            <p className="muted-copy">1 warehouse · {halls.length} halls · {bins.toLocaleString()} bins</p>
            <label className="check-row"><input type="checkbox" checked={profile.confirmed} onChange={(e) => updateProfile({ confirmed: e.target.checked })} />I confirm that the location hierarchy and warehouse codes are correct.</label>
            <label className="check-row"><input type="checkbox" checked={profile.setAsDefault} onChange={(e) => updateProfile({ setAsDefault: e.target.checked })} />Set as default warehouse</label>
            <label className="check-row"><input type="checkbox" checked={profile.generateLabels} onChange={(e) => updateProfile({ generateLabels: e.target.checked })} />Generate printable location labels</label>
            <label className="check-row"><input type="checkbox" checked={profile.notifyManager} onChange={(e) => updateProfile({ notifyManager: e.target.checked })} />Notify warehouse manager</label>
            <div className="notice-box">Activation makes codes available for inventory. Layout can still be edited later.</div>
          </div>
        </section>

        <section className="readiness-gauge">
          <div className="gauge"><strong>100%</strong><small>Ready</small></div>
          <ul>
            <li><CheckCircle2 size={13} />Details complete</li>
            <li><CheckCircle2 size={13} />Building complete</li>
            <li><CheckCircle2 size={13} />Storage complete</li>
            <li><CheckCircle2 size={13} />Routes validated</li>
            <li><CheckCircle2 size={13} />{errors.length} blocking errors</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
