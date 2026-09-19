-- CareSetu / SIH26047 demo seed database
-- All names, IDs, phone numbers, rooms and clinical values are fictional.
-- Use only in Demo mode. Do not use this seed for real patient care.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS queue_entries;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS measurements;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  patient_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('female','male','other','undisclosed')),
  phone TEXT NOT NULL,
  email TEXT,
  preferred_language TEXT NOT NULL,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  abha_linked INTEGER NOT NULL DEFAULT 0 CHECK (abha_linked IN (0,1)),
  consent_status TEXT NOT NULL DEFAULT 'demo-consent',
  allergies_status TEXT NOT NULL DEFAULT 'unknown',
  allergies_note TEXT,
  current_medicines_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  doctor_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialization TEXT NOT NULL,
  department TEXT NOT NULL,
  bio TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  languages TEXT NOT NULL, -- JSON array, e.g. ["English","हिन्दी"]
  building TEXT NOT NULL,
  floor TEXT NOT NULL,
  room TEXT NOT NULL,
  consultation_days TEXT NOT NULL, -- JSON array
  available_from TEXT NOT NULL,
  available_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','on-leave','offline')),
  fictional INTEGER NOT NULL DEFAULT 1 CHECK (fictional IN (0,1))
);

CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  visit_id TEXT,
  measured_at TEXT NOT NULL,
  height_cm REAL,
  weight_kg REAL,
  systolic_mmhg REAL,
  diastolic_mmhg REAL,
  pulse_bpm REAL,
  temperature_c REAL,
  oxygen_saturation_percent REAL,
  source TEXT NOT NULL CHECK (source IN ('patient-reported','staff-measured','device')),
  recorded_by TEXT NOT NULL DEFAULT 'demo-patient',
  notes TEXT
);

CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  doctor_id TEXT REFERENCES doctors(id),
  visit_date TEXT NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('opd','follow-up','ayush','emergency')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming','in-progress','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'unassessed' CHECK (priority IN ('unassessed','urgent','moderate','routine')),
  priority_reviewed INTEGER NOT NULL DEFAULT 0 CHECK (priority_reviewed IN (0,1)),
  room_snapshot TEXT,
  summary_status TEXT NOT NULL DEFAULT 'not-started' CHECK (summary_status IN ('not-started','draft','clinician-reviewed')),
  summary_text TEXT,
  follow_up_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  visit_id TEXT REFERENCES visits(id),
  file_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_date TEXT,
  file_kind TEXT NOT NULL CHECK (file_kind IN ('pdf','image')),
  ocr_status TEXT NOT NULL CHECK (ocr_status IN ('ready','needs-review','processing','failed','unavailable')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('unverified','patient-confirmed','clinician-verified')),
  extracted_summary TEXT,
  extracted_fields_json TEXT NOT NULL DEFAULT '[]',
  storage_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  appointment_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  visit_id TEXT REFERENCES visits(id),
  status TEXT NOT NULL CHECK (status IN ('requested','confirmed','checked-in','completed','cancelled','no-show')),
  booking_reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (doctor_id, appointment_date, start_time)
);

CREATE TABLE queue_entries (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id),
  service_date TEXT NOT NULL,
  department TEXT NOT NULL,
  token TEXT UNIQUE,
  queue_status TEXT NOT NULL CHECK (queue_status IN ('awaiting-token','waiting','called','in-consultation','temporarily-away','completed','cancelled')),
  priority_snapshot TEXT NOT NULL CHECK (priority_snapshot IN ('unassessed','urgent','moderate','routine')),
  assigned_by TEXT,
  assigned_at TEXT,
  called_at TEXT,
  last_updated TEXT NOT NULL
);

INSERT INTO patients VALUES
('pat_001','CS-DEMO-001','Ishant Kumar','2007-04-18','male','+91 90000 00001','ishant.demo@example.test','English','New Delhi, India','Meena Kumar','+91 90000 00002',0,'demo-consent','unknown',NULL,'No current medicines reported','2026-09-15T08:00:00+05:30'),
('pat_002','CS-DEMO-002','Aarav Sharma','1988-11-02','male','+91 90000 00003','aarav.demo@example.test','हिन्दी','Lucknow, Uttar Pradesh','Nisha Sharma','+91 90000 00004',0,'demo-consent','reported','Seasonal dust allergy; reaction not recorded','Vitamin D reported by patient; dose needs confirmation','2026-09-15T08:05:00+05:30'),
('pat_003','CS-DEMO-003','Meera Iyer','1965-02-24','female','+91 90000 00005','meera.demo@example.test','मराठी','Pune, Maharashtra','Rohan Iyer','+91 90000 00006',0,'demo-consent','unknown',NULL,'Medication list needs reconciliation','2026-09-15T08:10:00+05:30');

INSERT INTO doctors VALUES
('doc_001','DR-DEMO-001','Dr. Ananya Mehta','MD (General Medicine)','General Medicine','Medicine','Fictional demo physician for routine and follow-up care.','+91 81111 10001','ananya.mehta@example.test','["English","हिन्दी"]','CareSetu Block A','1','A-101','["Monday","Tuesday","Wednesday","Thursday","Friday"]','09:00','13:00','available',1),
('doc_002','DR-DEMO-002','Dr. Rohan Kapoor','DM (Cardiology)','Cardiology','Heart Care','Fictional demo physician for cardiology referrals.','+91 81111 10002','rohan.kapoor@example.test','["English","हिन्दी","मराठी"]','CareSetu Block A','2','A-204','["Monday","Wednesday","Friday"]','10:00','14:00','available',1),
('doc_003','DR-DEMO-003','Dr. Kavya Nair','MD (Dermatology)','Dermatology','Skin Care','Fictional demo physician for skin complaints.','+91 81111 10003','kavya.nair@example.test','["English","தமிழ்","മലയാളം"]','CareSetu Block B','1','B-108','["Tuesday","Thursday","Saturday"]','09:30','12:30','available',1),
('doc_004','DR-DEMO-004','Dr. Vikram Rao','MS (Orthopaedics)','Orthopaedics','Bone & Joint','Fictional demo physician for musculoskeletal complaints.','+91 81111 10004','vikram.rao@example.test','["English","हिन्दी","मराठी"]','CareSetu Block B','2','B-212','["Monday","Tuesday","Thursday","Friday"]','11:00','15:00','available',1),
('doc_005','DR-DEMO-005','Dr. Sahana Deshpande','BAMS, MD (Ayurveda)','Ayurveda','AYUSH Care','Fictional demo Ayurvedic physician; Dashavidha fields require clinician assessment.','+91 81111 10005','sahana.deshpande@example.test','["English","मराठी","हिन्दी"]','CareSetu Block C','1','C-105','["Monday","Wednesday","Saturday"]','09:00','12:00','available',1),
('doc_006','DR-DEMO-006','Dr. Imran Siddiqui','MD (Emergency Medicine)','Emergency Medicine','Emergency Care','Fictional demo emergency clinician. Routine booking must not replace emergency triage.','+91 81111 10006','imran.siddiqui@example.test','["English","हिन्दी","বাংলা"]','CareSetu Block E','G','E-001','["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]','00:00','23:59','available',1);

INSERT INTO visits VALUES
('visit_001','pat_001','doc_001','2026-09-16','opd','Routine wellness consultation','upcoming','unassessed',0,'CareSetu Block A · Floor 1 · Room A-101','draft','Patient reports occasional fatigue for two weeks; no red flag confirmed in demo intake.','Bring previous reports if available.','2026-09-15T09:00:00+05:30'),
('visit_002','pat_001','doc_001','2026-08-21','follow-up','Follow-up on sleep and fatigue','completed','routine',1,'CareSetu Block A · Floor 1 · Room A-101','clinician-reviewed','Demo follow-up completed; continue clinician-directed monitoring.','Review again if symptoms persist.','2026-08-21T11:30:00+05:30'),
('visit_003','pat_002','doc_002','2026-09-15','opd','Intermittent chest discomfort reported in demo scenario','in-progress','urgent',1,'CareSetu Block E · Ground Floor · Room E-001','draft','Patient-reported chest discomfort; clinical assessment required immediately.','Do not wait for routine appointment; follow emergency team instructions.','2026-09-15T09:05:00+05:30'),
('visit_004','pat_003','doc_005','2026-09-17','ayush','Digestive health and lifestyle consultation','upcoming','moderate',0,'CareSetu Block C · Floor 1 · Room C-105','draft','AYUSH intake partially completed; Dashavidha assessment pending clinician review.','Arrive 15 minutes early for assisted intake.','2026-09-15T09:10:00+05:30');

INSERT INTO measurements VALUES
('meas_001','pat_001','visit_001','2026-08-01T09:00:00+05:30',170,63,NULL,NULL,72,NULL,98,'patient-reported','demo-patient',''),
('meas_002','pat_001','visit_002','2026-08-21T11:00:00+05:30',170,64,NULL,NULL,74,NULL,98,'staff-measured','demo-nurse',''),
('meas_003','pat_001','visit_001','2026-09-15T09:20:00+05:30',170,65,118,76,72,36.7,98,'patient-reported','demo-patient','BMI demo fixture: calculate from height and weight'),
('meas_004','pat_002','visit_003','2026-09-15T09:07:00+05:30',174,82,146,92,96,NULL,96,'staff-measured','demo-nurse','Fictional urgent scenario; clinician assessment required'),
('meas_005','pat_003','visit_004','2026-09-15T09:12:00+05:30',158,71,132,84,78,NULL,97,'patient-reported','demo-patient','Values are unverified until clinician review');

INSERT INTO documents VALUES
('docfile_001','pat_001','visit_002','Ishant_followup_blood_report.pdf','Laboratory report','2026-08-20','pdf','ready','clinician-verified','Demo CBC and metabolic panel; see structured fields for selected values.','[{"label":"Haemoglobin","value":"14.1","unit":"g/dL","date":"2026-08-20","source_page":1},{"label":"Fasting glucose","value":"92","unit":"mg/dL","date":"2026-08-20","source_page":1}]','demo/pat_001/visit_002/blood-report.pdf','2026-08-21T10:10:00+05:30'),
('docfile_002','pat_001','visit_001','Ishant_old_prescription.jpg','Prescription','2026-08-21','image','needs-review','patient-confirmed','Historical prescription image; current medicine use still needs confirmation.','[{"label":"Medicine candidate","value":"Unreadable in demo","unit":null,"date":"2026-08-21","source_page":1,"confidence":0.42}]','demo/pat_001/visit_001/old-prescription.jpg','2026-09-15T09:15:00+05:30'),
('docfile_003','pat_003','visit_004','Meera_previous_report.pdf','Discharge summary','2026-07-14','pdf','ready','unverified','Prior document available for clinician review; no diagnosis inferred by the demo.','[{"label":"Document date","value":"2026-07-14","unit":null,"date":"2026-07-14","source_page":1}]','demo/pat_003/visit_004/previous-report.pdf','2026-09-15T09:18:00+05:30');

INSERT INTO appointments VALUES
('appt_001','pat_001','doc_001','2026-09-16','10:30','10:45','visit_001','confirmed','Routine wellness consultation','2026-09-15T09:00:00+05:30'),
('appt_002','pat_003','doc_005','2026-09-17','09:30','09:50','visit_004','confirmed','Digestive health and lifestyle consultation','2026-09-15T09:10:00+05:30');

INSERT INTO queue_entries VALUES
('queue_001','visit_003','2026-09-15','Emergency Care','EMO-001','waiting','urgent','demo-doctor','2026-09-15T09:07:00+05:30',NULL,'2026-09-15T09:07:00+05:30');

-- BMI query: return BMI from the latest complete height + weight record.
-- For children, pregnancy, or institution-specific standards, use clinician-approved rules.
CREATE VIEW patient_latest_bmi AS
SELECT p.id AS patient_id, p.full_name, m.measured_at, m.height_cm, m.weight_kg,
       ROUND(m.weight_kg / ((m.height_cm / 100.0) * (m.height_cm / 100.0)), 1) AS bmi
FROM patients p
JOIN measurements m ON m.patient_id = p.id
WHERE m.id = (
  SELECT m2.id FROM measurements m2
  WHERE m2.patient_id = p.id AND m2.height_cm > 0 AND m2.weight_kg > 0
  ORDER BY m2.measured_at DESC LIMIT 1
);

-- Health-bar inputs: show data completeness, not a diagnosis or health score.
CREATE VIEW patient_case_readiness AS
SELECT p.id AS patient_id,
  CASE WHEN EXISTS (SELECT 1 FROM visits v WHERE v.patient_id=p.id AND v.summary_status IN ('draft','clinician-reviewed')) THEN 1 ELSE 0 END +
  CASE WHEN EXISTS (SELECT 1 FROM measurements m WHERE m.patient_id=p.id AND m.height_cm>0 AND m.weight_kg>0) THEN 1 ELSE 0 END +
  CASE WHEN EXISTS (SELECT 1 FROM documents d WHERE d.patient_id=p.id) THEN 1 ELSE 0 END +
  CASE WHEN p.allergies_status <> 'unknown' THEN 1 ELSE 0 END AS completed_items,
  4 AS total_items,
  ROUND(100.0 * (
    CASE WHEN EXISTS (SELECT 1 FROM visits v WHERE v.patient_id=p.id AND v.summary_status IN ('draft','clinician-reviewed')) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM measurements m WHERE m.patient_id=p.id AND m.height_cm>0 AND m.weight_kg>0) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM documents d WHERE d.patient_id=p.id) THEN 1 ELSE 0 END +
    CASE WHEN p.allergies_status <> 'unknown' THEN 1 ELSE 0 END
  ) / 4.0, 0) AS readiness_percent
FROM patients p;
