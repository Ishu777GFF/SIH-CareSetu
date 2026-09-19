'use client';

import { ArrowRight, CalendarDays, CheckCircle2, HeartPulse, Menu, ShieldCheck, Stethoscope, UserPlus, Users, X } from 'lucide-react';

type Props = {
  onPatient: () => void;
  onDoctor: () => void;
  onRegister: () => void;
  onEmergency: () => void;
};

export default function Landing({ onPatient, onDoctor, onRegister, onEmergency }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const nav = [
    ['How it works', '#how'],
    ['For patients', '#patients'],
    ['For doctors', '#doctors'],
    ['Emergency help', '#emergency'],
  ];
  return <div className="landing-page">
    <aside className={`landing-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="CareSetu navigation">
      <div className="landing-sidebar-top">
        <div className="landing-brand-mark"><HeartPulse size={22}/></div>
        <div><strong>CareSetu</strong><span>Your story. Better care.</span></div>
        <button className="landing-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={20}/></button>
      </div>
      <nav>{nav.map(([label, href]) => <a href={href} key={href} onClick={() => setMenuOpen(false)}>{label}<ArrowRight size={15}/></a>)}</nav>
      <div className="landing-sidebar-note"><ShieldCheck size={19}/><strong>Human-reviewed care</strong><p>CareSetu helps organize your story. Clinicians make the decisions.</p></div>
      <button className="landing-emergency" onClick={onEmergency}>Emergency help <ArrowRight size={15}/></button>
    </aside>
    {menuOpen && <button className="landing-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)}/>} 
    <main className="landing-main">
      <header className="landing-header">
        <button className="landing-menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={23}/></button>
        <a className="landing-logo" href="#top"><span className="landing-logo-mark"><HeartPulse size={21}/></span><span><strong>CareSetu</strong><small>CARE, CONNECTED</small></span></a>
        <div className="landing-header-right"><span className="landing-demo-pill">SIH26047 · CareSetu</span><button className="landing-header-link" onClick={onDoctor}>Doctor login</button><button className="landing-header-register" onClick={onRegister}>Register <ArrowRight size={15}/></button></div>
      </header>
      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><span/> Patient case-taking, made human</span>
          <h1>Your story,<br/><em>ready for care.</em></h1>
          <p className="landing-lede">CareSetu turns your answers, measurements, and reports into a clear starting point for your doctor—before you enter the room.</p>
          <div className="landing-actions">
            <button className="landing-primary-action" onClick={onPatient}><Users size={18}/>Patient portal login <ArrowRight size={17}/></button>
            <button className="landing-secondary-action" onClick={onRegister}><UserPlus size={18}/>New patient register</button>
            <button className="landing-secondary-action doctor-action" onClick={onDoctor}><Stethoscope size={18}/>Doctor login</button>
          </div>
          <div className="landing-trust-row"><span><CheckCircle2 size={15}/>Touch or type</span><span><CheckCircle2 size={15}/>English + 4 Indian languages</span><span><CheckCircle2 size={15}/>Clinician review first</span></div>
        </div>
        <div className="landing-hero-visual" aria-label="CareSetu patient and doctor workflow preview">
          <div className="landing-orbit orbit-one"/><div className="landing-orbit orbit-two"/>
          <div className="landing-person patient-person"><div className="person-head">I</div><div className="person-body"/><span>Patient story</span></div>
          <div className="landing-person doctor-person"><div className="person-head">Dr</div><div className="person-body"/><span>Doctor review</span></div>
          <div className="landing-dashboard-card"><div className="mini-window"><span/><span/><span/></div><strong>Visit preparation</strong><small>3 details ready for review</small><div className="mini-progress"><i/></div><div className="mini-line"><CalendarDays size={14}/> Appointment · 10:30 IST</div><div className="mini-line"><ShieldCheck size={14}/> Patient-provided draft</div></div>
          <div className="landing-float-note"><HeartPulse size={16}/><span><strong>One connected story</strong><small>Symptoms · reports · visits</small></span></div>
        </div>
      </section>
      <section className="landing-role-strip" id="patients"><div><span className="landing-section-label">Choose your path</span><h2>Start where you are.</h2></div><p>Whether you are preparing for a visit or reviewing a queue, CareSetu keeps every next step clear.</p></section>
      <section className="landing-role-grid" id="doctors">
        <button className="landing-role-card patient-role" onClick={onPatient}><span className="landing-role-icon"><Users size={22}/></span><span className="landing-role-copy"><small>For patients</small><strong>Patient portal login</strong><span>Continue your case, check appointments, and keep your reports together.</span></span><ArrowRight size={20}/></button>
        <button className="landing-role-card doctor-role" onClick={onDoctor}><span className="landing-role-icon"><Stethoscope size={22}/></span><span className="landing-role-copy"><small>For clinicians</small><strong>Doctor login</strong><span>Review structured histories, urgency signals, and today’s queue.</span></span><ArrowRight size={20}/></button>
        <button className="landing-role-card register-role" onClick={onRegister}><span className="landing-role-icon"><UserPlus size={22}/></span><span className="landing-role-copy"><small>First time here?</small><strong>New patient register</strong><span>Create your patient profile before your first CareSetu visit.</span></span><ArrowRight size={20}/></button>
      </section>
      <section className="landing-story" id="how"><div><span className="landing-section-label">How CareSetu helps</span><h2>Less repeating.<br/><em>More listening.</em></h2><p>Your answers stay connected from intake to visit. You can pause, correct, skip, or ask for assisted entry at any time.</p></div><div className="landing-story-steps"><div><b>01</b><span><strong>Share your story</strong><small>Type or speak at your own pace.</small></span></div><div><b>02</b><span><strong>Bring the details together</strong><small>Measurements, reports, and visit context stay linked.</small></span></div><div><b>03</b><span><strong>Let your doctor review</strong><small>AI-assisted drafts remain clearly marked until a clinician confirms them.</small></span></div></div></section>
      <section className="landing-footer-note" id="emergency"><span><ShieldCheck size={18}/><strong>Your privacy and safety come first.</strong></span><p>This CareSetu preview uses fictional data. CareSetu does not diagnose, prescribe, or dispatch an ambulance. For immediate help in India, call 112.</p><button onClick={onEmergency}>Emergency help <ArrowRight size={15}/></button></section>
      <footer className="landing-footer"><span><HeartPulse size={15}/>CareSetu · Your story. Better care.</span><span>SIH26047 · Fictional hospital preview</span></footer>
    </main>
  </div>;
}

import React from 'react';
