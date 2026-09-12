"use client";

import { useEffect, useState } from "react";
import { Alert, ApiStatus, createEncounter, getAlerts, getApiStatus, selectAlertAction } from "../lib/api";
import "./interactions.css";

const queue = [
  { initials: "LR", name: "Lakshmi R.", detail: "58 · Type 2 diabetes", status: "Result needs review", tone: "risk" },
  { initials: "AS", name: "Arjun Sharma", detail: "42 · Hypertension", status: "Follow-up tomorrow", tone: "pending" },
  { initials: "FK", name: "Farah Khan", detail: "31 · Migraine", status: "Note ready to sign", tone: "ready" },
];

type PatientDetail = {
  initials: string; age: number; condition: string; seen: string; label: string; alertTitle: string; severity: string;
  test: string; result: number; unit: string; prior: number; priorDate: string; summary: string; activePlan: string;
  signal: string; source: string; orders: string[]; medication: string; subjective: string; options: string[];
};

type QueuePatient = { initials: string; name: string; detail: string; status: string; tone: string };

const patientDetails: Record<string, PatientDetail> = {
  "Lakshmi R.": {
    initials: "LR", age: 58, condition: "Type 2 diabetes", seen: "Seen today, 11:40", label: "RESULT REVIEW · CLINICIAN ONLY",
    alertTitle: "Medication review required", severity: "HIGH", test: "eGFR", result: 26, unit: "mL/min/1.73m²", prior: 51, priorDate: "Mar 2026",
    summary: "Renal result is outside the clinic's configured medication-review threshold.", activePlan: "Metformin 500 mg twice daily",
    signal: "Feet have been swollen for one week.", source: "07:03–07:07 · patient", orders: ["Creatinine", "HbA1c"], medication: "Metformin 500 mg · twice daily",
    subjective: "Foot swelling for one week. Taking diabetes medication regularly.", options: ["Review and contact patient", "Draft revised prescription", "Mark not clinically applicable"],
  },
  "Arjun Sharma": {
    initials: "AS", age: 42, condition: "Hypertension", seen: "Follow-up due tomorrow", label: "FOLLOW-UP · CLINICIAN ONLY",
    alertTitle: "Follow-up check-in due", severity: "DUE", test: "BP", result: 154, unit: "mmHg systolic", prior: 142, priorDate: "Last visit",
    summary: "A scheduled blood-pressure follow-up needs clinician review before any care-plan change.", activePlan: "Amlodipine 5 mg once daily",
    signal: "I have been getting headaches in the evening.", source: "04:12–04:16 · patient", orders: ["Blood pressure log", "Serum creatinine"], medication: "Amlodipine 5 mg · once daily",
    subjective: "Evening headaches reported. Follow-up blood-pressure reading is elevated.", options: ["Review check-in", "Draft follow-up plan", "Mark as contacted"],
  },
  "Farah Khan": {
    initials: "FK", age: 31, condition: "Migraine", seen: "Consultation completed 2 mins ago", label: "DRAFT NOTE · CLINICIAN ONLY",
    alertTitle: "Note ready for review", severity: "READY", test: "Pain", result: 7, unit: "/10", prior: 4, priorDate: "Prior visit",
    summary: "The encounter draft is ready; medication fields still require clinician confirmation.", activePlan: "Sumatriptan 50 mg as needed",
    signal: "The headache started yesterday evening and light makes it worse.", source: "02:18–02:24 · patient", orders: ["Migraine diary", "Vision review"], medication: "Sumatriptan 50 mg · as needed",
    subjective: "Migraine symptoms with photophobia since yesterday evening.", options: ["Review draft", "Request clarification", "Mark note ready to sign"],
  },
  "Maya Singh": {
    initials: "MS", age: 67, condition: "COPD", seen: "Consent pending", label: "CONSENT · CLINICIAN ONLY",
    alertTitle: "Recording consent required", severity: "PENDING", test: "SpO₂", result: 94, unit: "%", prior: 96, priorDate: "Last visit",
    summary: "No consultation audio or AI draft can be created until explicit consent is recorded.", activePlan: "Tiotropium inhaler once daily",
    signal: "I am more breathless while walking upstairs.", source: "Intake text · patient", orders: ["Spirometry", "Pulse oximetry"], medication: "Tiotropium inhaler · once daily",
    subjective: "Consent not yet recorded. Intake reports increased exertional breathlessness.", options: ["Request consent", "Open intake", "Defer encounter"],
  },
};

const demoAlert: Alert = {
  id: "demo-renal-alert", severity: "high", status: "open",
  payload: {
    title: "Medication review required",
    evidence: { test: { value: 26, unit: "mL/min/1.73m²" }, active_prescriptions: ["Metformin 500 mg twice daily"] },
    options: ["Review and contact patient", "Draft revised prescription", "Mark not clinically applicable"],
  },
};

type WorkspaceView = "inbox" | "visits" | "loops" | "patients" | "consent";

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([demoAlert]);
  const [selected, setSelected] = useState("Lakshmi R.");
  const [decision, setDecision] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("fallback");
  const [toast, setToast] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [noteSigned, setNoteSigned] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [view, setView] = useState<WorkspaceView>("inbox");
  const [profiles, setProfiles] = useState<Record<string, PatientDetail>>(patientDetails);
  const [newQueuePatients, setNewQueuePatients] = useState<QueuePatient[]>([]);
  const [encounterOpen, setEncounterOpen] = useState(false);
  const [encounterPending, setEncounterPending] = useState(false);
  const [encounterForm, setEncounterForm] = useState({ name: "", age: "", condition: "", consent: false });

  useEffect(() => {
    setLoading(true);
    Promise.all([getAlerts(), getApiStatus()]).then(([rows, status]) => { if (rows.length) setAlerts(rows); setApiStatus(status); }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const alert = alerts[0] ?? demoAlert;
  const patient = profiles[selected] ?? profiles["Lakshmi R."];
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3600); };
  const chooseDecision = async (option: string) => {
    setActionPending(true);
    try {
      if (selected === "Lakshmi R." && apiStatus === "live") await selectAlertAction(alert.id, option);
      setDecision(option);
      flash("Decision recorded as a draft. Clinician signature is still required.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Unable to save the mock decision.");
    } finally { setActionPending(false); }
  };
  const selectPatient = (name: string) => {
    setSelected(name);
    setDecision(null);
    setShowEvidence(false);
    setNoteSigned(false);
    flash(`${name} selected in the mock queue.`);
  };
  const submitEncounter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = encounterForm.name.trim();
    if (!name) return flash("Enter a patient name before creating an encounter.");
    if (!encounterForm.consent) return flash("Recording consent is required before an encounter can start.");
    setEncounterPending(true);
    try {
      const patientId = `mock-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      await createEncounter({ patientId, clinicId: "greenfield-clinic", localePrimary: "en-IN", consentRecorded: true });
      const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      const age = Number(encounterForm.age) || 0;
      const condition = encounterForm.condition.trim() || "General outpatient";
      setProfiles((current) => ({ ...current, [name]: {
        initials, age, condition, seen: "Encounter just created", label: "NEW ENCOUNTER · CLINICIAN ONLY",
        alertTitle: "Intake ready", severity: "NEW", test: "Intake", result: 0, unit: "items", prior: 0, priorDate: "—",
        summary: "Consent is recorded. Add intake information to begin the clinician-led care loop.", activePlan: "No active prescription recorded",
        signal: "No clinical transcript has been recorded yet.", source: "New encounter · clinician", orders: ["Add first order"], medication: "No medication recorded",
        subjective: "New consent-bound encounter. Awaiting intake and clinician assessment.", options: ["Open intake", "Start consultation", "Defer encounter"],
      }}));
      setNewQueuePatients((current) => [{ initials, name, detail: `${age || "Age not recorded"} · ${condition}`, status: "Intake ready", tone: "ready" }, ...current]);
      setSelected(name); setDecision(null); setShowEvidence(false); setNoteSigned(false); setView("inbox");
      setEncounterOpen(false); setEncounterForm({ name: "", age: "", condition: "", consent: false });
      flash(`${name}'s encounter was created. Intake is ready for clinician review.`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Unable to create the mock encounter.");
    } finally { setEncounterPending(false); }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">अ</span><span>Anusaran</span><small>CARE LOOP</small></div>
        <div className="clinic"><span className={`signal ${apiStatus}`} /> {apiStatus === "live" ? "Mock API connected" : "Demo fixture"} <span className="muted">· Greenfield Clinic</span></div>
        <div className="doctor"><span className="avatar">RK</span> Dr. R. Kumar <span className="chevron">⌄</span></div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <p className="eyebrow">CLINICAL WORKSPACE</p>
          <nav>
            <button className={view === "inbox" ? "active" : ""} onClick={() => setView("inbox")}>▦ <span>Care inbox</span><b>3</b></button>
            <button className={view === "visits" ? "active" : ""} onClick={() => setView("visits")}>◫ <span>Today&apos;s visits</span></button>
            <button className={view === "loops" ? "active" : ""} onClick={() => setView("loops")}>◷ <span>Open loops</span><b>12</b></button>
            <button className={view === "patients" ? "active" : ""} onClick={() => setView("patients")}>▤ <span>Patients</span></button>
            <button className={view === "consent" ? "active" : ""} onClick={() => setView("consent")}>◉ <span>Consent log</span></button>
          </nav>
          <div className="sidebar-note"><span className="lock">⌁</span><div><strong>Signed record only</strong><p>Patients never see AI drafts.</p></div></div>
        </aside>

        <section className="content">
          {view === "inbox" ? <>
          <div className="page-heading"><div><p className="eyebrow">DOCTOR / EXCEPTION-FIRST</p><h1>Care inbox</h1><p className="subhead">The next safe action for every patient—not another notification feed.</p></div><button className="outline" onClick={() => setEncounterOpen(true)}>+ New encounter</button></div>

          <div className="metrics">
            <Metric label="Needs review" value="03" note="1 high priority" accent="rose" />
            <Metric label="Unsigned notes" value="01" note="Farah Khan · 2 mins" accent="gold" />
            <Metric label="Open care loops" value="12" note="4 due in 24 hours" accent="blue" />
            <Metric label="Median to sign" value="14s" note="Target: under 20s" accent="green" />
          </div>

          <div className="workspace-grid">
            <section className="queue panel"><div className="panel-head"><div><p className="eyebrow">ACTION QUEUE</p><h2>Today&apos;s patients</h2></div><button className="link-button" onClick={() => setShowAll(!showAll)}>{showAll ? "Show priority" : "View all"}</button></div>
              <div className="queue-list">{[...newQueuePatients, ...(showAll ? [...queue, { initials: "MS", name: "Maya Singh", detail: "67 · COPD", status: "Consent due", tone: "pending" }] : queue)].map((queuePatient) => <button key={queuePatient.name} onClick={() => selectPatient(queuePatient.name)} className={`patient-row ${selected === queuePatient.name ? "selected" : ""}`}><span className="initials">{queuePatient.initials}</span><span className="patient-copy"><strong>{queuePatient.name}</strong><small>{queuePatient.detail}</small></span><span className={`pill ${queuePatient.tone}`}>{queuePatient.status}</span><span className="arrow">›</span></button>)}</div>
            </section>

            <section className="alert-card">
              <div className="alert-top"><div><p className="eyebrow">{patient.label}</p><h2>{patient.alertTitle}</h2></div><span className="high-pill">{patient.severity}</span></div>
              <div className="patient-summary"><span className="initials large">{patient.initials}</span><div><strong>{selected}</strong><p>{patient.age} years · {patient.condition} · {patient.seen}</p></div><span className="open-loop">OPEN LOOP</span></div>
              <div className="result-box"><div><span>{patient.test}</span><strong>{patient.result}</strong><small>{patient.unit}</small></div><div className="trend"><span>Prior result</span><strong>{patient.prior}</strong><small>{patient.priorDate}</small></div><p>{patient.summary}</p></div>
              <div className="evidence"><p className="eyebrow">LINKED EVIDENCE</p><p><strong>Active plan:</strong> {patient.activePlan}</p><p><strong>Visit signal:</strong> “{patient.signal}” <button onClick={() => setShowEvidence(!showEvidence)}>{patient.source}</button></p>{showEvidence && <div className="evidence-popover">Original source: synthetic patient transcript · evidence retained for clinician review.</div>}</div>
              <div className="guardrail">◈ A clinician must review and sign any action. No patient message or prescription change has been sent.</div>
              <div className="decision-actions">{patient.options.map((option, index) => <button key={option} disabled={actionPending} className={index === 1 ? "primary" : "secondary"} onClick={() => chooseDecision(option)}>{actionPending ? "Saving…" : option}</button>)}</div>
              {decision && <div className="confirmation">✓ “{decision}” selected as a draft. It still requires clinician signature.</div>}
            </section>
          </div>

          <section className="note-panel panel"><div className="panel-head"><div><p className="eyebrow">EVIDENCE-LINKED DRAFT</p><h2>Today&apos;s encounter · {selected}</h2></div><span className="verified">● 2 fields verified</span></div>
            <div className="note-grid"><div><label>SUBJECTIVE</label><p>{patient.subjective}</p></div><div><label>ORDERS</label><p>{patient.orders.map((order) => <span key={order} className="code">{order}</span>)}</p></div><div><label>MEDICATION</label><p>{patient.medication} <span className="confirm">Confirm required</span></p></div><div><label>PROVENANCE</label><p>Every displayed field carries a source span. Unsupported is a state, not a guess.</p></div></div>
            <div className="note-footer"><span>{noteSigned ? "Signed by Dr. R. Kumar · mock record" : "Last generated 9 seconds after consultation ended"}</span><button className="sign" disabled={noteSigned} onClick={() => { setNoteSigned(true); flash("Mock note signed. A durable care loop was opened."); }}>{noteSigned ? "Note signed ✓" : <>Sign note <span>→</span></>}</button></div>
          </section>
          {loading && <p className="sync">Syncing the live care-loop inbox…</p>}
          {toast && <div className="toast" role="status">{toast}</div>}
          </> : <MockWorkspace view={view} profiles={profiles} onBack={() => setView("inbox")} onSelectPatient={(name) => { selectPatient(name); setView("inbox"); }} onFlash={flash} />}
        </section>
      </div>
      {encounterOpen && <div className="modal-backdrop" role="presentation"><form className="encounter-modal" onSubmit={submitEncounter} aria-label="Create a new encounter"><div><p className="eyebrow">SYNTHETIC DEMO RECORD</p><h2>New encounter</h2><p>Start with consent. No audio, AI draft, patient message, or prescription action is triggered here.</p></div><div className="form-grid"><label>Patient name<input autoFocus value={encounterForm.name} onChange={(event) => setEncounterForm((form) => ({ ...form, name: event.target.value }))} placeholder="e.g. Priya Nair" /></label><label>Age <span>(optional)</span><input type="number" min="0" max="130" value={encounterForm.age} onChange={(event) => setEncounterForm((form) => ({ ...form, age: event.target.value }))} placeholder="e.g. 45" /></label><label className="full">Primary concern <span>(optional)</span><input value={encounterForm.condition} onChange={(event) => setEncounterForm((form) => ({ ...form, condition: event.target.value }))} placeholder="e.g. Follow-up consultation" /></label></div><label className="consent-check"><input type="checkbox" checked={encounterForm.consent} onChange={(event) => setEncounterForm((form) => ({ ...form, consent: event.target.checked }))} /> <span>I confirm that recording consent has been obtained for this demo encounter.</span></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setEncounterOpen(false)}>Cancel</button><button type="submit" className="primary" disabled={encounterPending}>{encounterPending ? "Creating…" : "Create encounter"}</button></div></form></div>}
    </main>
  );
}

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) {
  return <div className={`metric ${accent}`}><p>{label}</p><strong>{value}</strong><small>{note}</small></div>;
}

function MockWorkspace({ view, profiles, onBack, onSelectPatient, onFlash }: {
  view: Exclude<WorkspaceView, "inbox">;
  profiles: Record<string, PatientDetail>;
  onBack: () => void;
  onSelectPatient: (name: string) => void;
  onFlash: (message: string) => void;
}) {
  const title = { visits: "Today’s visits", loops: "Open care loops", patients: "Patients", consent: "Consent log" }[view];
  if (view === "visits") return <section className="mock-workspace"><ViewHeading title={title} onBack={onBack} /><div className="mock-list">{queue.map((patient, index) => <button key={patient.name} className="mock-row" onClick={() => onSelectPatient(patient.name)}><span className="initials">{patient.initials}</span><span><strong>{patient.name}</strong><small>{index === 0 ? "11:40 · Consultation complete" : index === 1 ? "13:20 · Follow-up scheduled" : "14:10 · Draft awaiting sign-off"}</small></span><em>{patient.status}</em><b>Open →</b></button>)}</div></section>;
  if (view === "loops") return <section className="mock-workspace"><ViewHeading title={title} onBack={onBack} /><div className="mock-list"><MockRow title="Lakshmi R. · Renal result review" description="eGFR result received · clinician decision required" action="Open decision" onClick={onBack} /><MockRow title="Arjun Sharma · Blood-pressure check-in" description="Follow-up due tomorrow at 09:00" action="Mark contacted" onClick={() => onFlash("Arjun’s mock follow-up was marked as contacted.")} /><MockRow title="Farah Khan · Draft sign-off" description="Evidence-linked note ready for clinician review" action="Open draft" onClick={onBack} /></div></section>;
  if (view === "patients") return <section className="mock-workspace"><ViewHeading title={title} onBack={onBack} /><div className="patient-grid">{Object.entries(profiles).map(([name, patient]) => <button key={name} className="patient-card" onClick={() => onSelectPatient(name)}><span className="initials large">{patient.initials}</span><strong>{name}</strong><small>{patient.age || "Age not recorded"} · {patient.condition}</small><span>Open record →</span></button>)}</div></section>;
  return <section className="mock-workspace"><ViewHeading title={title} onBack={onBack} /><div className="mock-list"><MockRow title="Lakshmi R. · Recording consent" description="Recorded today, 11:38 · English · evidence retained" action="View record" onClick={() => onFlash("Synthetic consent record opened for Lakshmi R.")} /><MockRow title="Maya Singh · Recording consent" description="Pending · recording and AI draft are blocked" action="Request consent" onClick={() => onFlash("Mock consent request prepared for Maya Singh.")} /></div></section>;
}

function ViewHeading({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="page-heading"><div><p className="eyebrow">CLINICAL WORKSPACE / MOCK DATA</p><h1>{title}</h1><p className="subhead">Synthetic records are used here for the demo.</p></div><button className="outline" onClick={onBack}>← Care inbox</button></div>;
}

function MockRow({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) {
  return <div className="mock-row"><span className="mock-indicator" /><span><strong>{title}</strong><small>{description}</small></span><button className="outline" onClick={onClick}>{action}</button></div>;
}
