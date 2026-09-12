"use client";

import { useEffect, useState } from "react";
import { Alert, ApiStatus, getAlerts, getApiStatus, selectAlertAction } from "../lib/api";
import "./interactions.css";

const queue = [
  { initials: "LR", name: "Lakshmi R.", detail: "58 · Type 2 diabetes", status: "Result needs review", tone: "risk" },
  { initials: "AS", name: "Arjun Sharma", detail: "42 · Hypertension", status: "Follow-up tomorrow", tone: "pending" },
  { initials: "FK", name: "Farah Khan", detail: "31 · Migraine", status: "Note ready to sign", tone: "ready" },
];

const demoAlert: Alert = {
  id: "demo-renal-alert", severity: "high", status: "open",
  payload: {
    title: "Medication review required",
    evidence: { test: { value: 26, unit: "mL/min/1.73m²" }, active_prescriptions: ["Metformin 500 mg twice daily"] },
    options: ["Review and contact patient", "Draft revised prescription", "Mark not clinically applicable"],
  },
};

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

  useEffect(() => {
    setLoading(true);
    Promise.all([getAlerts(), getApiStatus()]).then(([rows, status]) => { if (rows.length) setAlerts(rows); setApiStatus(status); }).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const alert = alerts[0] ?? demoAlert;
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3600); };
  const chooseDecision = async (option: string) => {
    setActionPending(true);
    try {
      await selectAlertAction(alert.id, option);
      setDecision(option);
      flash("Decision recorded as a draft. Clinician signature is still required.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Unable to save the mock decision.");
    } finally { setActionPending(false); }
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
            <button className="active" onClick={() => flash("Care inbox refreshed with synthetic data.")}>▦ <span>Care inbox</span><b>3</b></button>
            <button onClick={() => flash("Today’s visit list is available in the mock workspace.")}>◫ <span>Today&apos;s visits</span></button>
            <button onClick={() => flash("12 synthetic open loops are being tracked.")}>◷ <span>Open loops</span><b>12</b></button>
            <button onClick={() => flash("Patient directory is a Phase 2 screen.")}>▤ <span>Patients</span></button>
            <button onClick={() => flash("Consent is recorded before every mock encounter.")}>◉ <span>Consent log</span></button>
          </nav>
          <div className="sidebar-note"><span className="lock">⌁</span><div><strong>Signed record only</strong><p>Patients never see AI drafts.</p></div></div>
        </aside>

        <section className="content">
          <div className="page-heading"><div><p className="eyebrow">DOCTOR / EXCEPTION-FIRST</p><h1>Care inbox</h1><p className="subhead">The next safe action for every patient—not another notification feed.</p></div><button className="outline" onClick={() => flash("New synthetic encounter created. Consent is required before recording.")}>+ New encounter</button></div>

          <div className="metrics">
            <Metric label="Needs review" value="03" note="1 high priority" accent="rose" />
            <Metric label="Unsigned notes" value="01" note="Farah Khan · 2 mins" accent="gold" />
            <Metric label="Open care loops" value="12" note="4 due in 24 hours" accent="blue" />
            <Metric label="Median to sign" value="14s" note="Target: under 20s" accent="green" />
          </div>

          <div className="workspace-grid">
            <section className="queue panel"><div className="panel-head"><div><p className="eyebrow">ACTION QUEUE</p><h2>Today&apos;s patients</h2></div><button className="link-button" onClick={() => setShowAll(!showAll)}>{showAll ? "Show priority" : "View all"}</button></div>
              <div className="queue-list">{(showAll ? [...queue, { initials: "MS", name: "Maya Singh", detail: "67 · COPD", status: "Consent due", tone: "pending" }] : queue).map((patient) => <button key={patient.name} onClick={() => { setSelected(patient.name); flash(`${patient.name} selected in the mock queue.`); }} className={`patient-row ${selected === patient.name ? "selected" : ""}`}><span className="initials">{patient.initials}</span><span className="patient-copy"><strong>{patient.name}</strong><small>{patient.detail}</small></span><span className={`pill ${patient.tone}`}>{patient.status}</span><span className="arrow">›</span></button>)}</div>
            </section>

            <section className="alert-card">
              <div className="alert-top"><div><p className="eyebrow">RESULT REVIEW · CLINICIAN ONLY</p><h2>{alert.payload.title}</h2></div><span className="high-pill">HIGH</span></div>
              <div className="patient-summary"><span className="initials large">LR</span><div><strong>Lakshmi R.</strong><p>58 years · Type 2 diabetes · Seen today, 11:40</p></div><span className="open-loop">OPEN LOOP</span></div>
              <div className="result-box"><div><span>eGFR</span><strong>{alert.payload.evidence?.test?.value ?? 26}</strong><small>{alert.payload.evidence?.test?.unit ?? "mL/min/1.73m²"}</small></div><div className="trend"><span>Prior result</span><strong>51</strong><small>Mar 2026</small></div><p>Renal result is outside the clinic&apos;s configured medication-review threshold.</p></div>
              <div className="evidence"><p className="eyebrow">LINKED EVIDENCE</p><p><strong>Active plan:</strong> Metformin 500 mg twice daily</p><p><strong>Visit signal:</strong> “Feet have been swollen for one week.” <button onClick={() => setShowEvidence(!showEvidence)}>07:03–07:07 · patient</button></p>{showEvidence && <div className="evidence-popover">Original source: synthetic patient transcript · Segment demo-segment-1 · language: English</div>}</div>
              <div className="guardrail">◈ A clinician must review and sign any action. No patient message or prescription change has been sent.</div>
              <div className="decision-actions">{(alert.payload.options ?? demoAlert.payload.options ?? []).map((option, index) => <button key={option} disabled={actionPending} className={index === 1 ? "primary" : "secondary"} onClick={() => chooseDecision(option)}>{actionPending ? "Saving…" : option}</button>)}</div>
              {decision && <div className="confirmation">✓ “{decision}” selected as a draft. It still requires clinician signature.</div>}
            </section>
          </div>

          <section className="note-panel panel"><div className="panel-head"><div><p className="eyebrow">EVIDENCE-LINKED DRAFT</p><h2>Today&apos;s encounter · Lakshmi R.</h2></div><span className="verified">● 2 fields verified</span></div>
            <div className="note-grid"><div><label>SUBJECTIVE</label><p>Foot swelling for one week. Taking diabetes medication regularly.</p></div><div><label>ORDERS</label><p><span className="code">CREAT</span> Creatinine &nbsp; <span className="code">HBA1C</span> HbA1c</p></div><div><label>MEDICATION</label><p>Metformin <strong>500 mg</strong> · twice daily <span className="confirm">Confirm required</span></p></div><div><label>PROVENANCE</label><p>Every displayed field carries a source span. Unsupported is a state, not a guess.</p></div></div>
            <div className="note-footer"><span>{noteSigned ? "Signed by Dr. R. Kumar · mock record" : "Last generated 9 seconds after consultation ended"}</span><button className="sign" disabled={noteSigned} onClick={() => { setNoteSigned(true); flash("Mock note signed. A durable care loop was opened."); }}>{noteSigned ? "Note signed ✓" : <>Sign note <span>→</span></>}</button></div>
          </section>
          {loading && <p className="sync">Syncing the live care-loop inbox…</p>}
          {toast && <div className="toast" role="status">{toast}</div>}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) {
  return <div className={`metric ${accent}`}><p>{label}</p><strong>{value}</strong><small>{note}</small></div>;
}
