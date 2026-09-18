import { AlertTriangle, CheckCircle2, Copy, MapPin, UserRound, Warehouse } from "lucide-react"
import { useStudioStore } from "../store"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const ID_CHAIN = [
  ["WH04", "Warehouse"],
  ["HL01", "Hall"],
  ["AV02", "Aisle"],
  ["RA01", "Rack"],
  ["West Face", "Face"],
  ["SH03", "Shelf"],
  ["BN04", "Bin"],
]

export function DetailsStep() {
  const { profile, updateProfile, document } = useStudioStore()
  const root = document.nodes[document.rootId]
  const toggleDay = (day: string) => {
    const days = profile.days.includes(day) ? profile.days.filter((item) => item !== day) : [...profile.days, day]
    updateProfile({ days })
  }

  return (
    <div className="details-step">
      <section className="details-form-column">
        <header className="step-page-title">
          <span>1</span>
          <div>
            <h2>Warehouse details</h2>
            <p>Set the identity, location and operating defaults for this warehouse.</p>
          </div>
        </header>

        <section className="config-panel">
          <header><Warehouse size={16} /><h3>Basic information</h3><span>⌃</span></header>
          <div className="config-body">
            <label className="field full"><span>Warehouse name</span><input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} /></label>
            <label className="field full">
              <span>Warehouse code</span>
              <div className="code-available-row">
                <input className="code-input" value={profile.code} onChange={(e) => updateProfile({ code: e.target.value.toUpperCase() })} />
                <em>Available</em>
              </div>
              <small className="field-hint">Used in every location ID. Editable until inventory is assigned.</small>
            </label>
            <div className="field-grid two">
              <label className="field"><span>Warehouse role</span><select value={profile.role} onChange={(e) => updateProfile({ role: e.target.value })}><option>Auto parts distribution</option><option>Bulk storage</option><option>Cross-dock</option></select></label>
              <label className="field"><span>Status</span><select value={profile.status} onChange={(e) => updateProfile({ status: e.target.value })}><option>Planning</option><option>Active</option><option>Draft</option></select></label>
            </div>
          </div>
        </section>

        <section className="config-panel">
          <header><MapPin size={16} /><h3>Address</h3><span>⌃</span></header>
          <div className="config-body">
            <div className="field-grid two">
              <label className="field"><span>Country</span><select value={profile.country} onChange={(e) => updateProfile({ country: e.target.value })}><option>United States</option><option>Canada</option></select></label>
              <label className="field"><span>State</span><select value={profile.state} onChange={(e) => updateProfile({ state: e.target.value })}><option>Texas</option><option>California</option><option>Florida</option></select></label>
              <label className="field"><span>City</span><input value={profile.city} onChange={(e) => updateProfile({ city: e.target.value })} /></label>
              <label className="field"><span>ZIP code</span><input value={profile.zip} onChange={(e) => updateProfile({ zip: e.target.value })} /></label>
            </div>
            <label className="field full"><span>Street address</span><input value={profile.street} onChange={(e) => updateProfile({ street: e.target.value })} /></label>
            <label className="field full"><span>Time zone</span><select value={profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })}><option>America/Chicago (UTC-05:00)</option><option>America/New_York (UTC-04:00)</option><option>America/Los_Angeles (UTC-07:00)</option></select></label>
          </div>
        </section>

        <section className="config-panel">
          <header><UserRound size={16} /><h3>Primary contact</h3><span>⌃</span></header>
          <div className="config-body">
            <label className="field full"><span>Warehouse manager</span><select value={profile.manager} onChange={(e) => updateProfile({ manager: e.target.value })}><option>Michael Torres</option><option>Sara Khan</option><option>James Lee</option></select></label>
            <div className="field-grid two">
              <label className="field"><span>Phone</span><input value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} /></label>
              <label className="field"><span>Email</span><input value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} /></label>
            </div>
          </div>
        </section>

        <section className="config-panel">
          <header><CheckCircle2 size={16} /><h3>Operating defaults</h3><span>⌃</span></header>
          <div className="config-body">
            <div className="field full"><span>Operating days</span><div className="day-row">{DAYS.map((day) => <button key={day} type="button" className={profile.days.includes(day) ? "day on" : "day"} onClick={() => toggleDay(day)}>{day}</button>)}</div></div>
            <div className="field-grid three">
              <label className="field"><span>Opens at</span><input type="time" value={profile.opensAt} onChange={(e) => updateProfile({ opensAt: e.target.value })} /></label>
              <label className="field"><span>Closes at</span><input type="time" value={profile.closesAt} onChange={(e) => updateProfile({ closesAt: e.target.value })} /></label>
              <label className="field switch-field"><span>24-hour operation</span><button type="button" className={profile.allDay ? "switch on" : "switch"} onClick={() => updateProfile({ allDay: !profile.allDay })} /></label>
            </div>
            <div className="field-grid two">
              <div className="field"><span>Measurement system</span><div className="choice-row"><button type="button" className={profile.measurement === "Imperial" ? "choice active" : "choice"} onClick={() => updateProfile({ measurement: "Imperial" })}>Imperial</button><button type="button" className={profile.measurement === "Metric" ? "choice active" : "choice"} onClick={() => updateProfile({ measurement: "Metric" })}>Metric</button></div></div>
              <label className="field"><span>Weight unit</span><select value={profile.weightUnit} onChange={(e) => updateProfile({ weightUnit: e.target.value })}><option>lb</option><option>kg</option></select></label>
            </div>
          </div>
        </section>
      </section>

      <aside className="details-preview-column">
        <header className="preview-heading"><h3>Warehouse profile preview</h3><button type="button" className="text-button">Preview updates in real time</button></header>
        <div className="map-preview"><div className="map-pin" /><span>{profile.city}, {profile.state}</span></div>
        <div className="profile-card">
          <div className="profile-icon"><Warehouse size={22} /></div>
          <div>
            <strong>{profile.code}</strong>
            <p>{profile.name}</p>
            <div className="tag-row"><span>{profile.status}</span><span>{profile.role}</span><span>{profile.measurement}</span></div>
            <ul>
              <li><MapPin size={12} />{profile.city}, {profile.state}</li>
              <li><UserRound size={12} />{profile.manager}</li>
              <li><CheckCircle2 size={12} />{profile.allDay ? "24 hours" : `${profile.opensAt} – ${profile.closesAt}`}</li>
            </ul>
          </div>
        </div>
        <section className="id-preview-card">
          <header><h4>Location ID preview</h4><button type="button" className="text-button"><Copy size={12} />Copy example</button></header>
          <div className="id-chain">{ID_CHAIN.map(([code, label], index) => <div key={code} className="id-chip"><strong>{code}</strong><small>{label}</small>{index < ID_CHAIN.length - 1 && <i>→</i>}</div>)}</div>
        </section>
        <section className="readiness-card">
          <h4>Readiness checklist</h4>
          <ul>
            <li className="ok"><CheckCircle2 size={14} />Unique warehouse code</li>
            <li className="ok"><CheckCircle2 size={14} />Address configured</li>
            <li className="ok"><CheckCircle2 size={14} />Primary manager assigned</li>
            <li className={root.width > 0 ? "warn" : "warn"}><AlertTriangle size={14} />Building dimensions not added yet — complete in Step 2</li>
          </ul>
        </section>
        <section className="studio-promo-card">
          <strong>Open Spatial Studio in Step 2</strong>
          <p>Define building size, halls and the full warehouse → bin hierarchy on the canvas.</p>
        </section>
      </aside>
    </div>
  )
}
