"use client";
import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  HeartPulse,
  HelpCircle,
  Home,
  IdCard,
  Languages,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Upload,
  Users,
  Weight,
  Phone,
  Volume2,
  ClipboardList,
  Download,
  AlertTriangle,
  CheckCircle2,
  Copy,
  QrCode,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import CareAssistant from "@/app/care-assistant";
import {
  uid,
  bmi,
  day,
  doctorFor,
  doctors,
  KEY,
  makeSummary,
  patientFor,
  patients,
  seed,
  State,
  CareMessageAttachment,
  Visit,
} from "@/lib/medi-data";
import { languageNames, Lang, translate } from "@/lib/medi-i18n";
import {
  consumePhoneAccessToken,
  createPhoneAccessToken,
  formatPhoneAccessCountdown,
  getPhoneAccessToken,
  phoneAccessLink,
  revokePhoneAccessToken,
  type PhoneAccessToken,
} from "@/lib/phone-access";
import Landing from "./landing";
import RegistrationScreen from "./registration";
import HealthRecordsPage from "./health-records";
import NotificationPanel from "./notification-panel";
import "./phone-access.css";
import {
  addNotification,
  invalidateNotificationEvents,
  loadNotifications,
  markAllNotificationsRead,
  notificationStorageKey,
  updateNotification,
  type CareNotification,
  type NotificationRole,
} from "@/lib/notifications";
const selectedDoctorId = () =>
  typeof window !== "undefined"
    ? sessionStorage.getItem("medi-doctor") || "meera"
    : "meera";
type Modal = { type: string; id?: string } | null;
const intakeKeys = [
  "consent",
  "complaint",
  "duration",
  "associated symptoms",
  "medicines",
  "allergies",
  "history",
  "documents",
  "review",
];
const questions = [
  "Consent & language",
  "What brings you here today?",
  "When did it start?",
  "Any other symptoms?",
  "What medicines do you take?",
  "Do you have any allergies?",
  "Previous health history",
  "Add documents",
  "Review your story",
];
type ComplaintFollowUp = {
  question: string;
  urgentAnswer: string;
  options: string[];
};
const seriousComplaintFollowUp = (complaint: string): ComplaintFollowUp | null => {
  const text = complaint.toLowerCase();
  if (/chest pain|chest pressure|tightness in chest|pain in chest|seene mein dard|chest mein dard/.test(text))
    return {
      question:
        "Is the chest discomfort happening now, getting worse, or accompanied by breathlessness, fainting, sweating, or pain spreading to the arm, jaw, back, or shoulder?",
      urgentAnswer: "Yes — happening now or with warning signs",
      options: [
        "Yes — happening now or with warning signs",
        "No — none of these warning signs",
        "I am not sure",
      ],
    };
  if (/shortness of breath|breathless|difficulty breathing|cannot breathe|wheez|saans|saans lene/.test(text))
    return {
      question:
        "Are you struggling to breathe, unable to speak full sentences, turning blue/grey around the lips, or getting worse quickly?",
      urgentAnswer: "Yes — I need urgent help now",
      options: [
        "Yes — I need urgent help now",
        "No — breathing is manageable",
        "I am not sure",
      ],
    };
  if (/weakness|numbness|slurred speech|face droop|confusion|severe headache|faint|collapse|chakkar|behosh|sir dard/.test(text))
    return {
      question:
        "Did this start suddenly, or is there new weakness/numbness on one side, trouble speaking, confusion, a severe sudden headache, collapse, or fainting?",
      urgentAnswer: "Yes — sudden or new warning signs",
      options: [
        "Yes — sudden or new warning signs",
        "No — none of these warning signs",
        "I am not sure",
      ],
    };
  if (/bleed|blood in vomit|black stool|bloody stool|khun|blood/.test(text))
    return {
      question:
        "Is the bleeding heavy or uncontrolled, or are you feeling faint, very weak, or dizzy?",
      urgentAnswer: "Yes — heavy bleeding or feeling faint",
      options: [
        "Yes — heavy bleeding or feeling faint",
        "No — neither applies",
        "I am not sure",
      ],
    };
  if (/allerg|swollen lips|swollen tongue|throat swelling|hives|sujan|allergy/.test(text))
    return {
      question:
        "Do you have swelling of the lips, tongue, or throat, trouble breathing, or symptoms that are worsening quickly?",
      urgentAnswer: "Yes — warning signs are present",
      options: [
        "Yes — warning signs are present",
        "No — none of these warning signs",
        "I am not sure",
      ],
    };
  if (/severe abdominal|severe stomach|stomach pain|abdominal pain|vomit|pet dard|pet mein dard/.test(text))
    return {
      question:
        "Is the pain severe or worsening, or is it accompanied by repeated vomiting, blood, a rigid/swollen abdomen, fainting, or pregnancy-related concerns?",
      urgentAnswer: "Yes — severe or with warning signs",
      options: [
        "Yes — severe or with warning signs",
        "No — none of these warning signs",
        "I am not sure",
      ],
    };
  if (/high fever|fever|seizure|convulsion|bukhar/.test(text))
    return {
      question:
        "Is there a seizure, confusion, a stiff neck, a rapidly spreading rash, severe dehydration, or a person who is difficult to wake?",
      urgentAnswer: "Yes — warning signs are present",
      options: [
        "Yes — warning signs are present",
        "No — none of these warning signs",
        "I am not sure",
      ],
    };
  if (/suicide|kill myself|self harm|hurt myself|want to die/.test(text))
    return {
      question:
        "Are you in immediate danger or thinking about harming yourself right now?",
      urgentAnswer: "Yes — I need immediate help",
      options: [
        "Yes — I need immediate help",
        "No — I am safe right now",
        "I am not sure",
      ],
    };
  if (/pain|dard|headache|injury|dizzy|vomit|cough|khansi|diarrh|loose motion|dehydration|pregnan/.test(text))
    return {
      question:
        "How severe is it now, and is it getting worse quickly or stopping you from normal activities?",
      urgentAnswer: "Severe, worsening quickly, or unable to cope",
      options: [
        "Mild to moderate and manageable",
        "Severe, worsening quickly, or unable to cope",
        "I am not sure",
      ],
    };
  return null;
};
type GeoLocation = { latitude: number; longitude: number; accuracy: number };
type NearbyHospital = {
  id: string;
  name: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string;
};
type EmergencyService = {
  id: string;
  name: string;
  number: string;
  kind: "Government" | "Private";
  scope: string;
  description: string;
  medical: boolean;
};
const emergencyServices: EmergencyService[] = [
  {
    id: "erss",
    name: "National Emergency Response",
    number: "112",
    kind: "Government",
    scope: "India-wide",
    description:
      "Unified emergency help for ambulance, police and fire. Best first call for a life-threatening emergency.",
    medical: true,
  },
  {
    id: "ambulance108",
    name: "Emergency Ambulance Service",
    number: "108",
    kind: "Government",
    scope: "State availability varies",
    description:
      "Emergency ambulance and pre-hospital support in participating states and regions.",
    medical: true,
  },
  {
    id: "patient102",
    name: "Patient Transport Ambulance",
    number: "102",
    kind: "Government",
    scope: "State availability varies",
    description:
      "Patient transport, including maternal and child health services in participating states.",
    medical: true,
  },
  {
    id: "red",
    name: "RED.Health Ambulance",
    number: "9114911911",
    kind: "Private",
    scope: "Multi-city private service",
    description:
      "Private road-ambulance assistance. Coverage and charges must be confirmed by the operator.",
    medical: true,
  },
  {
    id: "medulance",
    name: "Medulance",
    number: "8882978888",
    kind: "Private",
    scope: "Private service",
    description:
      "Private ambulance assistance. Coverage, availability and charges must be confirmed by the operator.",
    medical: true,
  },
  {
    id: "fire",
    name: "Fire & Rescue",
    number: "101",
    kind: "Government",
    scope: "India emergency number",
    description: "Fire, rescue and related emergencies.",
    medical: false,
  },
  {
    id: "police",
    name: "Police",
    number: "100",
    kind: "Government",
    scope: "India emergency number",
    description: "Police emergency assistance; 112 is the unified alternative.",
    medical: false,
  },
  {
    id: "childline",
    name: "Child Helpline",
    number: "1098",
    kind: "Government",
    scope: "India-wide",
    description: "Emergency assistance and protection support for children.",
    medical: false,
  },
];
const nearbyHospitals: NearbyHospital[] = [
  {
    id: "rml",
    name: "Dr. Ram Manohar Lohia Hospital",
    area: "Connaught Place",
    address: "Baba Kharak Singh Road, New Delhi",
    latitude: 28.6258,
    longitude: 77.2009,
    services: "24-hour emergency",
  },
  {
    id: "lnjp",
    name: "Lok Nayak Hospital",
    area: "Delhi Gate",
    address: "Jawaharlal Nehru Marg, New Delhi",
    latitude: 28.6386,
    longitude: 77.2372,
    services: "Emergency and trauma care",
  },
  {
    id: "aiims",
    name: "AIIMS New Delhi",
    area: "Ansari Nagar",
    address: "Sri Aurobindo Marg, New Delhi",
    latitude: 28.5672,
    longitude: 77.21,
    services: "Emergency and trauma centre",
  },
  {
    id: "safdarjung",
    name: "Safdarjung Hospital",
    area: "Safdarjung Enclave",
    address: "Ring Road, New Delhi",
    latitude: 28.5686,
    longitude: 77.2066,
    services: "24-hour emergency",
  },
];
const geoDistanceKm = (a: GeoLocation, b: NearbyHospital) => {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude),
    dLon = rad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const trafficEstimate = (distance: number) => {
  const hour = new Date().getHours();
  const factor =
    (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)
      ? 1.7
      : hour >= 12 && hour <= 16
        ? 1.4
        : 1.2;
  return Math.max(5, Math.round((distance / 26) * 60 * factor));
};
export default function CareSetu() {
  const [gps, setGps] = useState<GeoLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "locating" | "granted" | "denied"
  >("idle");
  const [selectedHospital, setSelectedHospital] = useState("rml");
  const [sharePrepared, setSharePrepared] = useState(false);
  const [landingVisible, setLandingVisible] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      location.pathname === "/" &&
      !sessionStorage.getItem("medi-role")
    )
      setLandingVisible(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined" && location.pathname === "/register")
      setRegistrationMode(true);
  }, []);
  const openPatient = () => {
    setLandingVisible(false);
    setRegistrationMode(false);
    setRole("patient");
    setAuth(true);
    history.replaceState({}, "", "/auth/patient");
  };
  const openDoctor = () => {
    setLandingVisible(false);
    setRegistrationMode(false);
    setRole("doctor");
    setAuth(true);
    history.replaceState({}, "", "/auth/doctor");
  };
  const openRegister = () => {
    setLandingVisible(false);
    setRegistrationMode(true);
    setRole("patient");
    setAuth(false);
    history.replaceState({}, "", "/register");
  };
  const finishRegister = (details: {
    name: string;
    phone: string;
    dob: string;
    gender: string;
  }) => {
    const birthDate = new Date(`${details.dob}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
      today <
      new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    ) {
      age -= 1;
    }
    const patientId = uid();
    const initials =
      details.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "NP";

    setS((current) => {
      const registeredPatients =
        current.patients?.length ? current.patients : patients;
      const newPatient = {
        id: patientId,
        name: details.name,
        age,
        initials,
        patientCode: `CS-${String(registeredPatients.length + 1).padStart(3, "0")}`,
        phone: details.phone,
        dateOfBirth: details.dob,
        gender: details.gender,
        preferredLanguage: "English",
        allergiesStatus: "Not known",
        currentMedicines: "Not confirmed",
      };
      return {
        ...current,
        selectedPatient: patientId,
        patients: [...registeredPatients, newPatient],
        answers: { ...current.answers, [patientId]: {} },
        intakeStep: { ...current.intakeStep, [patientId]: 0 },
      };
    });
    setLandingVisible(false);
    setRegistrationMode(false);
    setAuth(false);
    setRole("patient");
    sessionStorage.setItem("medi-role", "patient");
    setPage("AI Case-Taking");
    notify("Profile created for " + details.name);
    history.replaceState({}, "", "/patient/ai-case-taking");
  };
  const openEmergencyFromLanding = () => {
    setLandingVisible(false);
    setAuth(false);
    setModal({ type: "emergency" });
  };
  const [s, setS] = useState<State>(seed);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState("patient");
  const [auth, setAuth] = useState(false);
  const [page, setPage] = useState("Overview");
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState("system");
  const [modal, setModal] = useState<Modal>(null);
  const [phoneAccess, setPhoneAccess] = useState<PhoneAccessToken | null>(null);
  const [phoneAccessQr, setPhoneAccessQr] = useState("");
  const [phoneAccessNow, setPhoneAccessNow] = useState(Date.now());
  const [mobileAccessTokenId, setMobileAccessTokenId] = useState<string | null>(null);
  const [mobileAccessRoute, setMobileAccessRoute] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [metric, setMetric] = useState("Weight");
  const [range, setRange] = useState("3M");
  const [table, setTable] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [large, setLarge] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [error, setError] = useState("");
  const [bookDoctor, setBookDoctor] = useState("meera");
  const [referralDoctor, setReferralDoctor] = useState("arjun");
  const [referralNote, setReferralNote] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatAttachment, setChatAttachment] = useState<CareMessageAttachment | null>(null);
  const [chatPatientId, setChatPatientId] = useState("");
  const [chatDoctorId, setChatDoctorId] = useState("");
  const [newReasonCase, setNewReasonCase] = useState(false);
  const [caseSubmitted, setCaseSubmitted] = useState(false);
  const chatFileInput = useRef<HTMLInputElement>(null);
  const [bookDate, setBookDate] = useState(day(1));
  const [bookTime, setBookTime] = useState("10:30");
  const [reason, setReason] = useState("");
  const [reviewStep, setReviewStep] = useState(false);
  const [visitTab, setVisitTab] = useState("Overview");
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");
  const [priority, setPriority] = useState("Unassessed");
  const [priorityReason, setPriorityReason] = useState("");
  const [online, setOnline] = useState(true);
  const [specialty, setSpecialty] = useState("All");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationRevision, setNotificationRevision] = useState(0);
  const t = (v: string) => translate(v, lang);
  const patientList = s.patients?.length ? s.patients : patients;
  const getPatient = (id: string) =>
    patientList.find((item) => item.id === id) || patientFor(id);
  const patient = getPatient(s.selectedPatient);
  const visits = s.visits.filter((v) => v.patientId === patient.id);
  const current = visits.find(
    (v) => !["completed", "cancelled"].includes(v.status),
  );
  const observations = s.observations
    .filter((o) => o.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = observations.at(-1);
  const answers = s.answers[patient.id] || {};
  const complaintFollowUp = seriousComplaintFollowUp(answers.complaint || "");
  const safetyFollowUpIsUrgent =
    !!complaintFollowUp &&
    answers["safety follow-up"] === complaintFollowUp.urgentAnswer;
  const step = s.intakeStep[patient.id] || 0;
  const percent = Math.round(
    (["complaint", "medicines", "allergies", "history", "documents"].filter(
      (k) => !!answers[k],
    ).length /
      5) *
      100,
  );
  const ownReports = s.reports.filter((r) =>
    visits.some((v) => v.id === r.visitId),
  );
  const isDoctor = role === "doctor";
  const room = (id: string) => s.rooms[id] || doctorFor(id).room;
  const notificationRole: NotificationRole = isDoctor ? "doctor" : "patient";
  const notificationRecipientId = isDoctor ? selectedDoctorId() : patient.id;
  void notificationRevision;
  const userNotifications = ready
    ? loadNotifications(notificationRole, notificationRecipientId)
    : [];
  const refreshNotifications = () =>
    setNotificationRevision((value) => value + 1);
  const emitNotification = (
    recipientRole: NotificationRole,
    recipientId: string,
    input: Omit<
      Parameters<typeof addNotification>[0],
      "recipientRole" | "recipientId"
    >,
  ) => {
    const added = addNotification({ ...input, recipientRole, recipientId });
    if (
      added &&
      recipientRole === notificationRole &&
      recipientId === notificationRecipientId
    )
      refreshNotifications();
    return added;
  };
  const checkDueReminders = () => {
    if (!ready) return;
    const relevant = s.visits.filter(
      (v) =>
        v.date === day() &&
        !["cancelled", "completed"].includes(v.status) &&
        (notificationRole === "doctor"
          ? v.doctorId === notificationRecipientId
          : v.patientId === notificationRecipientId),
    );
    relevant.forEach((v) => {
      const doctor = doctorFor(v.doctorId);
      const who =
        notificationRole === "doctor"
          ? getPatient(v.patientId).name
          : doctor.name;
      const time = v.time ? `${v.time} IST` : "time not assigned";
      const destination = `room ${room(v.doctorId)}`;
      emitNotification(notificationRole, notificationRecipientId, {
        type: "appointment-due",
        title: "Appointment today",
        message:
          notificationRole === "doctor"
            ? `${who} is scheduled today at ${time} in ${destination}.`
            : `Your appointment with ${who} is today at ${time} in ${destination}.`,
        entityType: "appointment",
        entityId: v.id,
        eventKey: `due-${v.id}-${v.date}-${notificationRole}-${notificationRecipientId}`,
      });
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS(JSON.parse(raw));
      setLang((localStorage.getItem("medi-lang") as Lang) || "en");
      setTheme(localStorage.getItem("medi-theme") || "system");
      const prefs = JSON.parse(localStorage.getItem("medi-access") || "{}");
      setReduced(!!prefs.reduced);
      setLarge(!!prefs.large);
      setContrast(!!prefs.contrast);
    } catch {}
    const path = location.pathname;
    const route = path.replace(/^\/(patient|doctor)\/?/, "").replace(/\/$/, "");
    if (path === "/mobile-access") {
      setLandingVisible(false);
      setRegistrationMode(false);
      setAuth(false);
      setRole("patient");
      setMobileAccessRoute(true);
      setMobileAccessTokenId(new URLSearchParams(location.search).get("token"));
    } else if (path.startsWith("/auth/")) {
      setAuth(true);
      setRole(path.endsWith("doctor") ? "doctor" : "patient");
    } else if (path.startsWith("/doctor")) {
      if (sessionStorage.getItem("medi-role") !== "doctor") setAuth(true);
      setRole("doctor");
      setPage(
        route === "queue"
          ? "Patient Queue"
          : route === "appointments"
            ? "Appointments"
            : route === "authorized-patients"
              ? "Authorized Patients"
              : route === "schedule-&-room"
                ? "Schedule & Room"
                : route === "settings"
            ? "Settings"
            : route === "messages"
              ? "Messages"
            : "Overview",
      );
    } else if (path.startsWith("/patient")) {
      setRole("patient");
      setPage(
        route === "ai-case-taking"
          ? "AI Case-Taking"
          : route === "my-visits"
            ? "My Visits"
            : route === "appointments"
              ? "Appointments"
              : route === "find-a-doctor"
                ? "Find a Doctor"
                : route === "my-health"
                  ? "My Health"
                  : route === "health-records"
                    ? "Health Records"
                    : route === "settings"
                    ? "Settings"
                    : route === "messages"
                      ? "Messages"
                      : "Overview",
      );
      if (path.includes("/visits/"))
        setModal({ type: "visit", id: path.split("/").at(-1) });
    }
    setReady(true);
    setOnline(navigator.onLine);
    const sync = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setS(JSON.parse(e.newValue));
    };
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("storage", sync);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch {
        setToast(
          "Could not save on this device. Keep this tab open and retry.",
        );
      }
  }, [s, ready]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    document.documentElement.dataset.reduced = String(reduced);
    document.documentElement.dataset.large = String(large);
    document.documentElement.dataset.contrast = String(contrast);
    localStorage.setItem("medi-lang", lang);
    localStorage.setItem("medi-theme", theme);
    localStorage.setItem(
      "medi-access",
      JSON.stringify({ reduced, large, contrast }),
    );
  }, [lang, theme, reduced, large, contrast, ready]);
  useEffect(() => {
    if (!ready) return;
    const key = notificationStorageKey(
      notificationRole,
      notificationRecipientId,
    );
    const sync = (event: StorageEvent) => {
      if (event.key === key) refreshNotifications();
    };
    const local = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (
        detail?.role === notificationRole &&
        detail?.id === notificationRecipientId
      )
        refreshNotifications();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("caresetu-notifications", local);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("caresetu-notifications", local);
    };
  }, [ready, notificationRole, notificationRecipientId]);
  useEffect(() => {
    if (!ready) return;
    checkDueReminders();
    const focus = () => checkDueReminders();
    const timer = window.setInterval(checkDueReminders, 60000);
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [ready, notificationRole, notificationRecipientId, s.visits, s.rooms]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (!phoneAccess) return;
    const refresh = () => {
      setPhoneAccess(getPhoneAccessToken(phoneAccess.tokenId) || null);
      setPhoneAccessNow(Date.now());
    };
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("storage", refresh);
    window.addEventListener("caresetu-phone-access", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("caresetu-phone-access", refresh);
    };
  }, [phoneAccess?.tokenId]);
  useEffect(() => {
    if (!phoneAccess || phoneAccess.status !== "ACTIVE") {
      setPhoneAccessQr("");
      return;
    }
    QRCode.toDataURL(phoneAccessLink(phoneAccess.tokenId), {
      width: 260,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#10231b", light: "#ffffff" },
    }).then(setPhoneAccessQr).catch(() => setPhoneAccessQr(""));
  }, [phoneAccess?.tokenId, phoneAccess?.status]);
  const notify = (message: string) => setToast(t(message));
  const generatePhoneAccess = () => {
    if (phoneAccess?.status === "ACTIVE") revokePhoneAccessToken(phoneAccess.tokenId);
    const token = createPhoneAccessToken(patient.id);
    setPhoneAccess(token);
    setPhoneAccessNow(Date.now());
    open("phone-access");
  };
  const copyPhoneAccessLink = async () => {
    if (!phoneAccess) return;
    try {
      await navigator.clipboard.writeText(phoneAccessLink(phoneAccess.tokenId));
      notify("Link copied");
    } catch {
      notify("Could not copy the link. Select the link and copy it manually.");
    }
  };
  const continueMobileAccess = () => {
    if (!mobileAccessTokenId) return;
    const token = consumePhoneAccessToken(mobileAccessTokenId);
    if (!token) return;
    setS((previous) => ({ ...previous, selectedPatient: token.patientId }));
    sessionStorage.setItem("medi-role", "patient");
    sessionStorage.setItem("caresetu-demo-mobile-session", token.tokenId);
    setPage("Overview");
    setMobileAccessRoute(false);
    setMobileAccessTokenId(null);
    history.replaceState({}, "", "/patient/overview");
  };
  const go = (name: string) => {
    setPage(name);
    setQuery("");
    setFilter("All");
    setMobile(false);
    history.replaceState(
      {},
      "",
      `/${role}/${name.toLowerCase().replaceAll(" ", "-")}`,
    );
  };
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      notify("Location is not supported in this browser.");
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setGps(location);
        setGpsStatus("granted");
        setSharePrepared(false);
        const nearest = [...nearbyHospitals].sort(
          (a, b) => geoDistanceKm(location, a) - geoDistanceKm(location, b),
        )[0];
        setSelectedHospital(nearest.id);
        notify("Location found. Review nearby hospitals below.");
      },
      () => {
        setGpsStatus("denied");
        notify("Location permission was not granted.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };
  const shareLocation = async () => {
    if (!gps) return;
    const hospital =
      nearbyHospitals.find((x) => x.id === selectedHospital) ||
      nearbyHospitals[0];
    const text = `CareSetu emergency location (prepared by the user)\nPatient: ${patient.name}\nSelected hospital: ${hospital.name}\nCoordinates: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}\nMap: https://maps.google.com/?q=${gps.latitude},${gps.longitude}`;
    const usedNativeShare = typeof navigator.share === "function";
    try {
      if (usedNativeShare)
        await navigator.share({ title: "CareSetu emergency location", text });
      else await navigator.clipboard.writeText(text);
      setSharePrepared(true);
      notify(
        usedNativeShare
          ? "Share action completed. Receipt by the hospital is not confirmed."
          : "Location details copied. Send them to the selected hospital or emergency service.",
      );
    } catch {
      notify("Location sharing was cancelled.");
    }
  };
  const open = (type: string, id?: string) => {
    setError("");
    setModal({ type, id });
    if (type === "book") {
      setBookDoctor(id || "meera");
      setReviewStep(false);
      setReason("");
    }
    if (type === "review") {
      const v = s.visits.find((x) => x.id === id)!;
      setNote(v.approved || v.summary || "");
      setFollowup(v.followup || "");
      setPriority(v.priority);
      setPriorityReason("");
    }
    if (type === "refer") {
      const currentDoctor = selectedDoctorId();
      setReferralDoctor(doctors.find((doctor) => doctor.id !== currentDoctor)?.id || "meera");
      setReferralNote("");
    }
    if (type === "visit") {
      setVisitTab("Overview");
      history.replaceState({}, "", `/patient/visits/${id}`);
    }
  };
  const emitVisitEvent = (visit: Visit, event: string) => {
    const doctor = doctorFor(visit.doctorId);
    const patientName = getPatient(visit.patientId).name;
    const appointment = `${date(visit.date)}${visit.time ? ` at ${visit.time} IST` : ""}`;
    const destination = `room ${room(visit.doctorId)}`;
    const lower = event.toLowerCase();
    let type = "visit-update",
      title = "Visit updated",
      patientMessage = event,
      doctorMessage = `${patientName}: ${event}`,
      entityType: "appointment" | "visit" | "case" = "visit";
    let sendPatient = true,
      sendDoctor = false;
    if (lower.includes("rescheduled")) {
      type = "appointment-rescheduled";
      title = "Appointment rescheduled";
      patientMessage = `Your appointment with ${doctor.name} is now ${appointment} in ${destination}.`;
      doctorMessage = `${patientName} rescheduled to ${appointment}.`;
      entityType = "appointment";
      sendDoctor = true;
    } else if (lower.includes("cancelled")) {
      type = "appointment-cancelled";
      title = "Appointment cancelled";
      patientMessage = `Your ${appointment} appointment with ${doctor.name} was cancelled.`;
      doctorMessage = `${patientName} cancelled the ${appointment} appointment.`;
      entityType = "appointment";
      sendDoctor = true;
    } else if (lower.includes("checked in")) {
      type = "queue-checkin";
      title = "Check-in confirmed";
      patientMessage = `You are checked in for ${doctor.name}. A queue token will appear when assigned.`;
      doctorMessage = `${patientName} checked in for the ${appointment} appointment.`;
      entityType = "appointment";
      sendDoctor = true;
    } else if (lower.includes("called to room")) {
      type = "queue-called";
      title = "Please proceed for consultation";
      patientMessage = `You have been called to ${destination} for your consultation with ${doctor.name}.`;
    } else if (lower.includes("consultation started")) {
      type = "consultation-started";
      title = "Consultation started";
      patientMessage = `Your consultation with ${doctor.name} has started in ${destination}.`;
    } else if (lower.includes("visit completed")) {
      type = "consultation-completed";
      title = "Consultation completed";
      patientMessage = `Your visit with ${doctor.name} is complete. Reviewed records are available in My Visits.`;
    } else if (lower.includes("submitted a draft")) {
      type = "case-submitted";
      title = "Case summary submitted";
      patientMessage = `Your case summary was sent to ${doctor.name} for review.`;
      doctorMessage = `${patientName} submitted a case summary for review.`;
      entityType = "case";
      sendDoctor = true;
    } else if (lower.includes("requested clarification")) {
      type = "case-clarification";
      title = "More information requested";
      patientMessage = `${doctor.name} requested clarification for your case summary.`;
      entityType = "case";
    } else if (lower.includes("summary signed")) {
      type = "case-reviewed";
      title = "Case summary reviewed";
      patientMessage = `${doctor.name} reviewed your case summary. Open the visit to see the clinician-reviewed version.`;
      entityType = "case";
    } else if (lower.includes("referred to")) {
      type = "case-referred";
      title = "Case referred";
      patientMessage = `Your case has been referred to ${doctor.name} for review.`;
      doctorMessage = `${patientName}'s case was referred to you for review.`;
      entityType = "case";
      sendDoctor = true;
    } else if (lower.includes("report uploaded")) {
      sendPatient = false;
      sendDoctor = false;
    } else if (
      lower.includes("verified the fictional") ||
      lower.includes("saved draft") ||
      lower.includes("acknowledged the urgent concern") ||
      lower.includes("temporarily away") ||
      lower.includes("urgent concern")
    ) {
      sendPatient = false;
      sendDoctor = false;
    }
    const eventKey = `${type}-${visit.id}-${visit.date}-${visit.time}-${visit.status}-${event}`;
    if (sendPatient)
      emitNotification("patient", visit.patientId, {
        type,
        title,
        message: patientMessage,
        entityType,
        entityId: visit.id,
        eventKey: `patient-${eventKey}`,
      });
    if (sendDoctor)
      emitNotification("doctor", visit.doctorId, {
        type,
        title,
        message: doctorMessage,
        entityType,
        entityId: visit.id,
        eventKey: `doctor-${eventKey}`,
      });
  };
  const changeVisit = (id: string, patch: Partial<Visit>, event: string) => {
    const before = s.visits.find((v) => v.id === id);
    if (!before) return;
    const after = { ...before, ...patch };
    if (
      event.toLowerCase().includes("rescheduled") ||
      event.toLowerCase().includes("cancelled")
    ) {
      invalidateNotificationEvents("patient", before.patientId, before.id, [
        "due-",
      ]);
      invalidateNotificationEvents("doctor", before.doctorId, before.id, [
        "due-",
      ]);
    }
    setS((prev) => ({
      ...prev,
      visits: prev.visits.map((v) =>
        v.id === id
          ? {
              ...v,
              ...patch,
              activity: [
                ...v.activity,
                `${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST · ${event}`,
              ],
            }
          : v,
      ),
      notifications: [event, ...prev.notifications].slice(0, 20),
    }));
    emitVisitEvent(after, event);
  };
  const setAnswer = (value: string) => {
    setCaseSubmitted(false);
    setS((prev) => {
      const patientAnswers = {
        ...prev.answers[patient.id],
        [intakeKeys[step]]: value,
      };
      if (intakeKeys[step] === "complaint")
        delete patientAnswers["safety follow-up"];
      return {
        ...prev,
        answers: { ...prev.answers, [patient.id]: patientAnswers },
      };
    });
  };
  const setSafetyFollowUp = (value: string) =>
    setS((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [patient.id]: {
          ...prev.answers[patient.id],
          "safety follow-up": value,
        },
      },
    }));
  const moveStep = (n: number) =>
    setS((prev) => ({
      ...prev,
      intakeStep: {
        ...prev.intakeStep,
        [patient.id]: Math.max(0, Math.min(8, n)),
      },
    }));
  const tokenAction = (v: Visit) => {
    if (!isDoctor || v.token || v.status !== "checked-in") return;
    const activeDoctor = doctorFor(v.doctorId);
    const token = `MED-${String(s.nextToken).padStart(3, "0")}`;
    setS((prev) => ({
      ...prev,
      nextToken: prev.nextToken + 1,
      visits: prev.visits.map((x) =>
        x.id === v.id
          ? {
              ...x,
              token,
              status: "waiting",
              activity: [
                ...x.activity,
                `${activeDoctor.name} assigned ${token}`,
              ],
            }
          : x,
      ),
      notifications: [
        `${token} assigned. Please go to room ${room(v.doctorId)}.`,
        ...prev.notifications,
      ],
    }));
    emitNotification("patient", v.patientId, {
      type: "queue-token",
      title: "Queue token assigned",
      message: `Your token is ${token}. Please go to room ${room(v.doctorId)} when called.`,
      entityType: "visit",
      entityId: v.id,
      eventKey: `patient-token-${v.id}-${token}`,
    });
    notify("Token assigned");
  };
  const submitCase = () => {
    const summary = makeSummary(answers);
    if (current && !newReasonCase)
      changeVisit(
        current.id,
        { summary },
        "Patient submitted a draft for clinician review",
      );
    else {
      const created: Visit = {
        id: uid(),
        patientId: patient.id,
        doctorId: current?.doctorId || "meera",
        date: day(),
        time: "",
        reason: answers.complaint || "Incomplete intake",
        status: "requested",
        priority: "Unassessed",
        provisional: "Unassessed",
        summary,
        activity: ["Draft submitted"],
      };
      setS((prev) => ({ ...prev, visits: [...prev.visits, created] }));
      emitVisitEvent(created, "Patient submitted a draft for clinician review");
    }
    notify("Draft saved for clinician review");
    setNewReasonCase(false);
    setCaseSubmitted(true);
  };
  const startNewReasonCase = () => {
    setS((previous) => ({
      ...previous,
      answers: { ...previous.answers, [patient.id]: {} },
      intakeStep: { ...previous.intakeStep, [patient.id]: 0 },
    }));
    setNewReasonCase(true);
    setCaseSubmitted(false);
    go("AI Case-Taking");
    notify("New intake form started. Your previous case remains saved.");
  };
  const nav = isDoctor
    ? [
        "Overview",
        "Patient Queue",
        "Appointments",
        "Authorized Patients",
        "Messages",
        "Schedule & Room",
        "Settings",
      ]
    : [
        "Overview",
        "AI Case-Taking",
        "My Visits",
        "Appointments",
        "Find a Doctor",
        "Messages",
        "My Health",
        "Health Records",
        "Settings",
      ];
  const navIcons = isDoctor
    ? [Home, Users, CalendarDays, Users, MessageCircle, Settings, Settings]
    : [
        Home,
        Sparkles,
        ClipboardList,
        CalendarDays,
        Stethoscope,
        MessageCircle,
        HeartPulse,
        IdCard,
        Settings,
      ];
  const Badge = ({
    children,
    tone = "mint",
  }: {
    children: React.ReactNode;
    tone?: string;
  }) => <span className={`badge ${tone}`}>{children}</span>;
  const Btn = ({
    children,
    onClick,
    secondary = false,
    disabled = false,
    ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    secondary?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
  }) => (
    <button
      disabled={disabled}
      className={secondary ? "button secondary" : "button"}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
  const date = (d: string) =>
    new Date(d + "T12:00:00+05:30").toLocaleDateString(
      { en: "en-IN", hi: "hi-IN", mr: "mr-IN", bn: "bn-IN", ta: "ta-IN" }[lang],
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      },
    );
  const markNotificationRead = (item: CareNotification) =>
    updateNotification(notificationRole, notificationRecipientId, item.id, {
      readAt: item.readAt || new Date().toISOString(),
    });
  const dismissNotification = (item: CareNotification) =>
    updateNotification(notificationRole, notificationRecipientId, item.id, {
      dismissedAt: new Date().toISOString(),
    });
  const openNotificationTarget = (item: CareNotification) => {
    markNotificationRead(item);
    setNotificationOpen(false);
    if (item.entityType === "schedule" && !item.entityId) {
      if (isDoctor) go("Schedule & Room");
      else go("Appointments");
      return;
    }
    if (item.entityType === "report" && item.entityId) {
      const report = s.reports.find((r) => r.id === item.entityId);
      const linked = report && s.visits.find((v) => v.id === report.visitId);
      const authorized =
        linked &&
        (isDoctor
          ? linked.doctorId === selectedDoctorId()
          : linked.patientId === patient.id);
      if (report && authorized) {
        open("report", report.id);
        return;
      }
    }
    if (
      item.entityId &&
      ["appointment", "visit", "case", "schedule"].includes(item.entityType)
    ) {
      const target = s.visits.find((v) => v.id === item.entityId);
      const authorized =
        target &&
        (isDoctor
          ? target.doctorId === selectedDoctorId()
          : target.patientId === patient.id);
      if (target && authorized) {
        open(isDoctor ? "review" : "visit", target.id);
        return;
      }
    }
    notify("This notification’s item is no longer available.");
  };
  function VisitRow({ v }: { v: Visit }) {
    const d = doctorFor(v.doctorId);
    return (
      <button
        className="visit-row"
        onClick={() => open(isDoctor ? "review" : "visit", v.id)}
      >
        <div className="date-tile">
          <strong>{v.date.slice(-2)}</strong>
          <span>
            {new Date(v.date + "T12:00:00").toLocaleDateString(lang, {
              month: "short",
            })}
          </span>
        </div>
        <div className="grow">
          <strong>{isDoctor ? getPatient(v.patientId).name : d.name}</strong>
          <p>{v.reason}</p>
        </div>
        <div className="row-end">
          <Badge tone={v.status === "completed" ? "subtle" : "mint"}>
            {t(v.status[0].toUpperCase() + v.status.slice(1))}
          </Badge>
          <span>
            {s.reports.filter((r) => r.visitId === v.id).length} {t("Reports")}
          </span>
        </div>
        <ChevronRight size={17} />
      </button>
    );
  }
  function HealthChart() {
    const chart = observations
      .filter(
        (o) =>
          range === "All" ||
          new Date(o.date).getTime() >=
            Date.now() -
              ({ "1M": 31, "3M": 93, "6M": 186 }[range] || 93) * 86400000,
      )
      .map((o) => ({
        ...o,
        label: new Date(o.date + "T12:00:00").toLocaleDateString(lang, {
          day: "numeric",
          month: "short",
        }),
        value:
          metric === "Weight"
            ? o.weight
            : Number(bmi(o.height, o.weight)?.toFixed(1)),
      }));
    return (
      <section className="card chart-card">
        <div className="card-head">
          <h2>{t("Health trends")}</h2>
          <button className="text-button" onClick={() => go("My Health")}>
            {t("View details")} <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="chart-controls">
          <Tabs value={metric} onValueChange={setMetric}>
            <TabsList>
              <TabsTrigger value="Weight">{t("Weight")}</TabsTrigger>
              <TabsTrigger value="BMI">BMI</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="range">
            {["1M", "3M", "6M", "All"].map((r) => (
              <button
                key={r}
                className={range === r ? "selected" : ""}
                onClick={() => setRange(r)}
              >
                {t(r)}
              </button>
            ))}
          </div>
        </div>
        {latest ? (
          <>
            <div className="chart-number">
              {metric === "Weight"
                ? latest.weight
                : bmi(latest.height, latest.weight)?.toFixed(1)}{" "}
              <span>{metric === "Weight" ? "kg" : "kg/m²"}</span>
              <small>
                {t("Latest measurement")} · {date(latest.date)}
              </small>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height={175}>
                <AreaChart
                  data={chart}
                  margin={{ top: 12, right: 15, left: -22, bottom: 0 }}
                  accessibilityLayer
                >
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--border)"
                    vertical={false}
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    domain={metric === "Weight" ? [0, 80] : [0, 40]}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Area
                    type="linear"
                    dataKey="value"
                    name={`${t(metric)} (${metric === "Weight" ? "kg" : "kg/m²"})`}
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#chartFill)"
                    dot={{ r: 3, fill: "var(--card)", strokeWidth: 2 }}
                    isAnimationActive={!reduced}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-foot">
              <span>
                <span className="legend-dot" />
                {t("Patient-reported")} · {metric === "Weight" ? "kg" : "kg/m²"}
              </span>
              <button className="text-button" onClick={() => setTable(!table)}>
                {t("View data table")}
              </button>
            </div>
            {table && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t(metric)}</th>
                      <th>{t("Source")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((o) => (
                      <tr key={o.id}>
                        <td>{date(o.date)}</td>
                        <td>{o.value}</td>
                        <td>{t(o.source)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <Empty action={() => open("measure")} label="Add height and weight" />
        )}
      </section>
    );
  }
  function Empty({
    action,
    label = "Book appointment",
  }: {
    action: () => void;
    label?: string;
  }) {
    return (
      <div className="empty">
        <ClipboardList size={30} />
        <h3>{t("No records yet")}</h3>
        <Btn onClick={action}>{t(label)}</Btn>
      </div>
    );
  }
  function HealthTracker() {
    const base = latest || {
      pulse: 72,
      oxygen: 98,
      weight: patient.age > 50 ? 68 : 62,
      systolic: 118,
      diastolic: 76,
      temperature: 36.7,
    };
    const seedValue = patient.id
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    const steps = 6200 + (seedValue % 2800);
    const sleep = 6 + (seedValue % 18) / 10;
    const calories = 320 + (seedValue % 380);
    const heart = base.pulse || 72;
    const spo2 = base.oxygen || 98;
    const score = Math.min(
      100,
      Math.round(
        48 +
          (spo2 - 95) * 6 +
          (sleep - 6) * 5 +
          (steps / 1000) * 2,
      ),
    );
    const metrics = [
      ["Health score", score, "/100", "Combined wellness indicator", "score"],
      ["Sleep time", sleep.toFixed(1), "hrs", "Last night", "sleep"],
      ["Steps", steps.toLocaleString(), "steps", "Today", "steps"],
      [
        "Calories burned",
        calories.toLocaleString(),
        "kcal",
        "Active estimate",
        "calories",
      ],
      ["SpO₂", spo2, "%", "Latest measurement", "spo2"],
      ["Heart rate", heart, "bpm", "Resting estimate", "heart"],
      ["Pulse rate", heart, "bpm", "Latest measurement", "pulse"],
      [
        "Blood pressure",
        `${base.systolic || 118}/${base.diastolic || 76}`,
        "mmHg",
        "Latest measurement",
        "bp",
      ],
      [
        "Temperature",
        base.temperature || 36.7,
        "°C",
        "Latest measurement",
        "temperature",
      ],
    ];
    return (
      <section className="card tracker-card">
        <div className="card-head">
          <div>
            <h2>
              <Activity size={18} />
              Health tracker
            </h2>
            <p className="fine">Daily wellness snapshot for {patient.name}</p>
          </div>
          <Badge tone="blue">Patient / device data</Badge>
        </div>
        <div className="tracker-score">
          <div
            className="progress-ring"
            style={{ "--progress": `${score}%` } as React.CSSProperties}
          >
            <strong>
              {score}
              <small>/100</small>
            </strong>
          </div>
          <div>
            <strong>Today’s health score</strong>
            <p>
              A combined indicator using activity, sleep and available
              readings. It is not a diagnosis.
            </p>
          </div>
        </div>
        <div className="tracker-grid">
          {metrics.slice(1).map(([label, value, unit, note, tone]) => (
            <div className={`tracker-metric ${tone}`} key={String(label)}>
              <span>{label}</span>
              <strong>
                {value}
                <small>{unit}</small>
              </strong>
              <p>{note}</p>
            </div>
          ))}
        </div>
        <p className="fine tracker-note">
          Illustrative values are unique to this fictional patient. Connect a
          validated device or enter a measurement to replace them; CareSetu does
          not infer a diagnosis.
        </p>
      </section>
    );
  }
  function HealthTrackerPreview() {
    return (
      <button className="card tracker-preview" onClick={() => go("My Health")}>
        <span className="step-icon mint"><Activity size={21} /></span>
        <span className="grow">
          <strong>Health Tracker</strong>
          <span>View your recorded wellness details and measurements.</span>
        </span>
        <ArrowRight size={18} />
      </button>
    );
  }
  function Measurements() {
    const rows = observations.flatMap((o) =>
      [
        { name: "Pulse", value: o.pulse ? `${o.pulse} /min` : null },
        {
          name: "Blood pressure",
          value:
            o.systolic && o.diastolic
              ? `${o.systolic}/${o.diastolic} mmHg`
              : null,
        },
        {
          name: "Oxygen saturation",
          value: o.oxygen ? `${o.oxygen}% SpO₂` : null,
        },
        {
          name: "Temperature",
          value: o.temperature ? `${o.temperature} °C` : null,
        },
        { name: "Weight", value: o.weight ? `${o.weight} kg` : null },
        { name: "Height", value: o.height ? `${o.height} cm` : null },
      ]
        .filter((row): row is { name: string; value: string } =>
          Boolean(row.value),
        )
        .map((row) => ({
          ...row,
          date: o.date,
          source: o.source.includes("Patient")
            ? "Patient-reported"
            : "Staff-measured",
        })),
    );
    return (
      <section className="card measurement-records-card">
        <div className="visit-measurements-head">
          <div>
            <h2>Measurements</h2>
            <p>Recorded health measurements for this patient.</p>
          </div>
          <button className="text-button" onClick={() => open("measure")}>
            {t("Update")} <Plus size={15} />
          </button>
        </div>
        {rows.length ? (
          <div className="measurement-table-wrap">
            <table className="measurement-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.date}-${row.name}-${index}`}>
                    <td>{date(row.date)}</td>
                    <td>{row.name}</td>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty action={() => open("measure")} label="Add measurements" />
        )}
        <p className="fine">
          Measurements are recorded values only. They do not provide a
          diagnosis.
        </p>
      </section>
    );
  }
  function VisitMeasurementTable({ visit }: { visit: Visit }) {
    const rows = observations
      .filter((observation) => observation.date <= visit.date)
      .flatMap((observation) =>
        [
          { name: "Pulse", value: observation.pulse ? `${observation.pulse} /min` : null },
          { name: "Blood pressure", value: observation.systolic && observation.diastolic ? `${observation.systolic}/${observation.diastolic} mmHg` : null },
          { name: "Oxygen saturation", value: observation.oxygen ? `${observation.oxygen}% SpO₂` : null },
          { name: "Temperature", value: observation.temperature ? `${observation.temperature} °C` : null },
          { name: "Weight", value: observation.weight ? `${observation.weight} kg` : null },
          { name: "Height", value: observation.height ? `${observation.height} cm` : null },
        ]
          .filter((row): row is { name: string; value: string } => Boolean(row.value))
          .map((row) => ({
            ...row,
            date: observation.date,
            source: observation.source.includes("Patient") ? "Patient-reported" : "Staff-measured",
          })),
      );
    return (
      <section className="visit-measurements">
        <div className="visit-measurements-head">
          <div>
            <h3>Measurements</h3>
            <p>Recorded on or before this visit.</p>
          </div>
          <button className="text-button" onClick={() => open("measure")}>
            <Plus size={15} /> Update measurements
          </button>
        </div>
        {rows.length ? (
          <div className="measurement-table-wrap">
            <table className="measurement-table">
              <thead><tr><th>Date</th><th>Name</th><th>Value</th><th>Source</th></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.date}-${row.name}-${index}`}>
                    <td>{date(row.date)}</td><td>{row.name}</td><td>{row.value}</td><td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty action={() => open("measure")} label="Add measurements" />}
        <p className="fine">Measurements are recorded values only. They do not provide a diagnosis.</p>
      </section>
    );
  }
  function PatientOverview() {
    return (
      <>
        <div className="welcome">
          <div>
            <div className="eyebrow">YOUR CARE, IN ONE PLACE</div>
            <h1>
              {t("Good morning")}, {patient.name.split(" ")[0]}{" "}
              <span className="hello-spark">✳</span>
            </h1>
            <p>{t("Your health, a little more connected.")}</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn secondary onClick={generatePhoneAccess} ariaLabel={t("Open on Phone")}>
              <QrCode size={17} />
              {t("Open on Phone")}
            </Btn>
            <Btn secondary onClick={() => open("book")}>
              <Plus size={17} />
              {t("Book appointment")}
            </Btn>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="main-column">
            <section className="next-card">
              <div className="card-head">
                <span className="eyebrow">
                  <CalendarDays size={15} />
                  {t("Your next step")}
                </span>
                <Badge>
                  {current
                    ? t(
                        current.status[0].toUpperCase() +
                          current.status.slice(1),
                      )
                    : "Ready when you are"}
                </Badge>
              </div>
              {current ? (
                <>
                  <div className="next-content">
                    <div className="avatar mint">
                      {doctorFor(current.doctorId).initials}
                    </div>
                    <div className="grow">
                      <h2>{doctorFor(current.doctorId).name}</h2>
                      <p>{t(doctorFor(current.doctorId).department)}</p>
                    </div>
                    {current.token && (
                      <strong className="token">{current.token}</strong>
                    )}
                  </div>
                  <div className="appointment-meta">
                    <span>
                      <CalendarDays size={15} />
                      {date(current.date)}
                    </span>
                    <span>
                      <Clock size={15} />
                      {current.time || "Walk-in"} IST
                    </span>
                    <span>
                      <MapPin size={15} />
                      {t("Room")} {room(current.doctorId)} · {t("Floor")}{" "}
                      {doctorFor(current.doctorId).floor}
                    </span>
                  </div>
                  <div className="next-bottom">
                    <span>
                      {current.token
                        ? "Staff may prioritize urgent cases. Wait time not available."
                        : "A little preparation makes more room for your story."}
                    </span>
                    <button
                      className="text-button"
                      onClick={() =>
                        current.status === "confirmed" && current.date === day()
                          ? changeVisit(
                              current.id,
                              { status: "checked-in" },
                              "Patient checked in — awaiting token",
                            )
                          : open("visit", current.id)
                      }
                    >
                      {t(
                        current.status === "confirmed" && current.date === day()
                          ? "Check in"
                          : "View details",
                      )}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <Empty action={() => open("book")} />
              )}
            </section>
            <section className="card prepare-card">
              <div className="card-head">
                <h2>
                  <Sparkles size={18} />
                  {t("Prepare your case")}
                </h2>
                <Badge tone="subtle">AI-assisted</Badge>
              </div>
              <p>
                Tell your story once. Give your doctor a clearer starting point.
              </p>
              <div className="prepare-steps">
                {[
                  {
                    label: "Tell your symptoms",
                    icon: MessageCircle,
                    key: "complaint",
                    n: 1,
                  },
                  {
                    label: "Medicines & allergies",
                    icon: Heart,
                    key: "allergies",
                    n: 4,
                  },
                  {
                    label: "Add relevant reports",
                    icon: FileText,
                    key: "documents",
                    n: 7,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      moveStep(item.n);
                      go("AI Case-Taking");
                    }}
                  >
                    <span
                      className={
                        answers[item.key] ? "step-icon complete" : "step-icon"
                      }
                    >
                      {answers[item.key] ? (
                        <Check size={19} />
                      ) : (
                        <item.icon size={19} />
                      )}
                    </span>
                    <span>
                      {t(item.label)}
                      <small>{answers[item.key] ? "Added" : "To do"}</small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
              <div className="prepare-bottom">
                <span>
                  <ShieldCheck size={15} /> Your doctor reviews every draft
                </span>
                <Btn onClick={() => go("AI Case-Taking")}>
                  {t("Continue my case")} <ArrowRight size={16} />
                </Btn>
              </div>
            </section>
            <section className="card records-dashboard-card">
              <div className="records-card-icon">
                <IdCard size={24} />
              </div>
              <div className="grow">
                <div className="card-head">
                  <div>
                    <span className="eyebrow">
                      {t("ABHA HEALTH RECORD")} · SIMULATED
                    </span>
                    <h2>{t("ABHA Health Account")}</h2>
                  </div>
                  <Badge tone="sand">{t("Simulated")}</Badge>
                </div>
                <p>
                  {t("Access your longitudinal health history in one place.")}
                </p>
                <strong>12-3456-7890-1234</strong>
                <p className="fine">
                  {t("Fictional ABHA ID")} · {t("Linked status: Simulated account")}
                </p>
                <p className="fine">
                  This demo is not connected to ABDM or any government health
                  record service. Your fictional records stay in this browser.
                </p>
                <div className="form-actions">
                  <Btn onClick={() => go("Health Records")}>
                    {t("View Records")}
                    <ArrowRight size={16} />
                  </Btn>
                  <button
                    className="text-button"
                    onClick={() => go("Health Records")}
                  >
                    {t("Manage Consent")}
                  </button>
                </div>
              </div>
            </section>
            {HealthTrackerPreview()}
            {HealthChart()}
            <section className="card visits-card">
              <div className="card-head">
                <h2>{t("Recent visits")}</h2>
                <button className="text-button" onClick={() => go("My Visits")}>
                  {t("View all")} <ArrowRight size={15} />
                </button>
              </div>
              {visits
                .filter((v) => v.status === "completed")
                .slice(0, 3)
                .map((v) => (
                  <VisitRow key={v.id} v={v} />
                ))}
              {!visits.some((v) => v.status === "completed") && (
                <Empty action={() => open("book")} />
              )}
            </section>
          </div>
          <div className="side-column">
            {Measurements()}
            <section className="card suggested">
              <div className="card-head">
                <h2>{t("Suggested care")}</h2>
                <Stethoscope size={18} />
              </div>
              <Badge tone="blue">Department suggestion</Badge>
              <h3>{t("General Medicine")}</h3>
              <p>
                A starting point for your general concerns. A clinician will
                confirm the right care.
              </p>
              <div className="doctor-mini">
                <div className="avatar small mint">MS</div>
                <div>
                  <strong>Dr. Meera Sharma</strong>
                  <span>
                    {t("Room")} {room(selectedDoctorId())} · {t("Floor")} 2
                  </span>
                </div>
              </div>
              <button className="wide-link" onClick={() => go("Find a Doctor")}>
                {t("Review options")}
                <ArrowUpRight size={16} />
              </button>
            </section>
            <section className="card completion">
              <div className="card-head">
                <h2>{t("Case completion")}</h2>
                <HelpCircle size={17} />
              </div>
              <div className="completion-body">
                <div
                  className="progress-ring"
                  style={{ "--progress": `${percent}%` } as React.CSSProperties}
                >
                  <strong>
                    {percent}
                    <small>%</small>
                  </strong>
                </div>
                <div>
                  <strong>
                    A clearer picture,
                    <br />
                    one step at a time.
                  </strong>
                  <p>Complete at your own pace.</p>
                </div>
              </div>
              <div className="checklist">
                {[
                  "complaint",
                  "medicines",
                  "allergies",
                  "history",
                  "documents",
                ].map((k) => (
                  <span key={k}>
                    {answers[k] ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="empty-circle" />
                    )}
                    {k[0].toUpperCase() + k.slice(1)}
                  </span>
                ))}
              </div>
              <p className="fine">
                Completion of your story, not a health score.
              </p>
            </section>
            <div className="help-note">
              <MessageCircle size={21} />
              <div>
                <strong>{t("Need assistance?")}</strong>
                <p>Ask the hospital intake desk for help.</p>
                <button className="text-button" onClick={() => open("help")}>
                  See assistance options <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  function Intake() {
    const previousCases = visits
      .filter((visit) => Boolean(visit.summary))
      .sort((a, b) => b.date.localeCompare(a.date));
    return (
      <>
        <PageHeading
          title="AI Case-Taking"
          subtitle="Your words. Your pace. A draft for your doctor."
        />
        <div className="intake-layout">
          <aside className="intake-steps">
            {questions.map((q, i) => (
              <button
                key={q}
                className={step === i ? "active" : ""}
                onClick={() => moveStep(i)}
              >
                <span>
                  {answers[intakeKeys[i]] ? <Check size={15} /> : i + 1}
                </span>
                {t(q)}
              </button>
            ))}
            <button
              className="text-button"
              onClick={() => {
                notify("Progress saved on this device");
                go("Overview");
              }}
            >
              {t("Pause & save")}
            </button>
          </aside>
          <section className="card intake-main">
            <div className="card-head">
              <Badge tone="subtle">{step + 1} / 9</Badge>
              <span className="fine">
                <CheckCheck size={14} /> Saved on this device
              </span>
            </div>
            <div className="intake-progress">
              <i style={{ width: `${((step + 1) / 9) * 100}%` }} />
            </div>
            <div className="question-icon">
              <Sparkles size={24} />
            </div>
            <h2>{t(questions[step])}</h2>
            {step === 0 ? (
              <>
                <p>
                  Use fictional information only. Your answers create an
                  unreviewed draft for a fictional clinician. You can skip,
                  pause, or ask for help. No real medical care is provided.
                </p>
                <Btn
                  onClick={() => {
                    setAnswer("I agree to share my intake details");
                    moveStep(1);
                  }}
                >
                  I agree · {t("Continue")}
                </Btn>
              </>
            ) : step === 7 ? (
              <>
                <p>
                  Reports are optional. You can bring the originals to your
                  appointment.
                </p>
                <Btn secondary onClick={() => open("upload", current?.id)}>
                  <Upload size={17} />
                  {t("Upload report")}
                </Btn>
                <Btn
                  secondary
                  onClick={() => {
                    setAnswer("No reports to add");
                    moveStep(8);
                  }}
                >
                  No reports to add
                </Btn>
              </>
            ) : step === 8 ? (
              caseSubmitted ? (
                <>
                  <Badge tone="mint">Draft saved for clinician review</Badge>
                  <h3>Ready to share another reason?</h3>
                  <p>
                    Start a blank intake form for a new concern. Your submitted
                    case stays saved with its original visit.
                  </p>
                  <div className="form-actions">
                    <Btn onClick={startNewReasonCase}>
                      Add new form for a new reason <Plus size={16} />
                    </Btn>
                    <Btn secondary onClick={() => go("Overview")}>
                      View overview
                    </Btn>
                  </div>
                </>
              ) : (
              <>
                <Badge tone="sand">
                  Patient-provided / AI-assisted draft — awaiting clinician
                  review
                </Badge>
                <div className="summary">
                  {Object.entries(answers)
                    .filter(([k]) => k !== "consent")
                    .map(([k, v]) => (
                      <div key={k}>
                        <strong>{k}</strong>
                        <p>{v}</p>
                        <button
                          className="text-button"
                          onClick={() => {
                            const questionIndex = intakeKeys.indexOf(k);
                            moveStep(questionIndex >= 0 ? questionIndex : 1);
                          }}
                        >
                          Correct answer · source
                        </button>
                      </div>
                    ))}
                </div>
                <Btn onClick={submitCase}>
                  {t("Submit for review")} <ArrowRight size={17} />
                </Btn>
              </>
              )
            ) : (
              <>
                <p>
                  {step === 4
                    ? "Include names and doses only if known. Previous prescriptions do not confirm current use."
                    : step === 5
                      ? "Include any reaction, or say you do not know. Unknown does not mean no allergies."
                      : "Share what you know. You can correct your answer later."}
                </p>
                {step === 2 && (
                  <div className="duration-options" aria-label="Choose when symptoms started">
                    {["1–3 days", "3–7 days", "7–10 days", "More than 10 days"].map(
                      (option) => (
                        <button
                          key={option}
                          className={
                            answers.duration === option ? "selected" : ""
                          }
                          onClick={() => {
                            setAnswer(option);
                            moveStep(3);
                          }}
                        >
                          {option}
                        </button>
                      ),
                    )}
                  </div>
                )}
                <label className="field">
                  <span>{t("Your answer")}</span>
                  <textarea
                    rows={5}
                    value={answers[intakeKeys[step]] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type here…"
                  />
                </label>
                {step === 1 && complaintFollowUp && (
                  <section
                    id="safety-follow-up"
                    className="clinical-alert"
                    aria-live="polite"
                  >
                    <Badge tone="rose">Extra safety check</Badge>
                    <h3>{complaintFollowUp.question}</h3>
                    <p>
                      This does not diagnose a condition. It helps identify
                      when urgent help may be needed.
                    </p>
                    <div className="answer-tools">
                      {complaintFollowUp.options.map((option) => (
                        <button
                          key={option}
                          className={
                            answers["safety follow-up"] === option
                              ? "selected"
                              : ""
                          }
                          style={
                            answers["safety follow-up"] === option
                              ? {
                                  borderColor: "var(--primary)",
                                  background: "var(--brand-soft)",
                                  color: "var(--primary)",
                                  fontWeight: 650,
                                }
                              : undefined
                          }
                          onClick={() => {
                            setSafetyFollowUp(option);
                            if (option === complaintFollowUp.urgentAnswer) {
                              notify("Urgent help options opened. Call 112 if you need immediate assistance.");
                              open("emergency");
                              return;
                            }
                            moveStep(2);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {safetyFollowUpIsUrgent && (
                      <p className="fine">
                        Please use the urgent help options before continuing.
                      </p>
                    )}
                  </section>
                )}
                <div className="answer-tools">
                  <button onClick={() => setAnswer("Not known")}>
                    {t("I don't know")}
                  </button>
                  <button
                    onClick={() =>
                      setAnswer("Declined — tell the doctor privately")
                    }
                  >
                    Tell the doctor privately
                  </button>
                  <button
                    onClick={() => {
                      if ("speechSynthesis" in window) {
                        speechSynthesis.cancel();
                        const speech = new SpeechSynthesisUtterance(
                          t(questions[step]),
                        );
                        speech.lang = lang === "en" ? "en-IN" : lang + "-IN";
                        speechSynthesis.speak(speech);
                      } else notify("Read aloud unavailable on this device");
                    }}
                  >
                    <Volume2 size={15} />
                    {t("Read aloud")}
                  </button>
                </div>
                <p className="fine">
                  Voice input unavailable in this version. Text and assisted entry
                  are available.
                </p>
                <div className="form-actions">
                  <Btn secondary onClick={() => moveStep(step - 1)}>
                    {t("Back")}
                  </Btn>
                  <Btn
                    secondary
                    onClick={() => {
                      if (!answers[intakeKeys[step]])
                        setAnswer("Not asked — skipped");
                      moveStep(step + 1);
                    }}
                  >
                    {t("Skip")}
                  </Btn>
                  <Btn
                    disabled={!answers[intakeKeys[step]]}
                    onClick={() => {
                      if (step === 1 && complaintFollowUp) {
                        if (!answers["safety follow-up"]) {
                          document
                            .getElementById("safety-follow-up")
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          notify("Please answer the safety follow-up before continuing.");
                          return;
                        }
                        if (safetyFollowUpIsUrgent) {
                          open("emergency");
                          return;
                        }
                      }
                      moveStep(step + 1);
                    }}
                  >
                    {t("Continue")} <ArrowRight size={16} />
                  </Btn>
                </div>
              </>
            )}
            <button
              className="text-button assistance"
              onClick={() => open("help")}
            >
              {t("Need assistance?")}
            </button>
            <button
              className="urgent-demo"
              onClick={() => {
                if (current)
                  changeVisit(
                    current.id,
                    { provisional: "Urgent concern", status: "checked-in" },
                    "Urgent concern — awaiting staff acknowledgment",
                  );
                open("emergency");
              }}
            >
              <AlertTriangle size={15} /> Simulate urgent concern · stop intake
            </button>
          </section>
          <section
            className="card"
            style={{ gridColumn: "1 / -1" }}
            aria-label="Previous cases"
          >
            <div className="card-head">
              <div>
                <h2>Previous cases</h2>
                <p>Submitted forms stay available as part of your case history.</p>
              </div>
              <Badge tone="subtle">{previousCases.length}</Badge>
            </div>
            {previousCases.length ? (
              <div>
                {previousCases.map((visit) => {
                  const doctor = doctorFor(visit.doctorId);
                  return (
                    <button
                      key={visit.id}
                      type="button"
                      className="visit-row"
                      onClick={() => {
                        setVisitTab("Case summary");
                        open("visit", visit.id);
                      }}
                    >
                      <span className="date-tile">
                        <strong>{visit.date.slice(-2)}</strong>
                        <span>{new Date(visit.date + "T12:00:00").toLocaleDateString(lang, { month: "short" })}</span>
                      </span>
                      <span className="grow">
                        <strong>{visit.reason}</strong>
                        <small>{doctor.name} · {visit.status}</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="fine">Submitted cases will appear here.</p>
            )}
          </section>
        </div>
      </>
    );
  }
  function CareChat() {
    const patientDoctorIds = Array.from(
      new Set(
        [current?.doctorId, ...visits.map((visit) => visit.doctorId)].filter(
          (doctorId): doctorId is string => Boolean(doctorId),
        ),
      ),
    );
    const activeDoctorId = isDoctor
      ? selectedDoctorId()
      : chatDoctorId || patientDoctorIds[0] || "meera";
    const assignedPatients = Array.from(
      new Set(
        s.visits
          .filter((visit) => visit.doctorId === activeDoctorId)
          .map((visit) => visit.patientId),
      ),
    );
    const activePatientId = isDoctor
      ? chatPatientId || assignedPatients[0] || patient.id
      : patient.id;
    const chatPatient = getPatient(activePatientId);
    const chatDoctor = doctorFor(activeDoctorId);
    const thread = (s.careMessages || [])
      .filter(
        (message) =>
          message.patientId === activePatientId &&
          message.doctorId === activeDoctorId,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const lastMessage = (patientId: string, doctorId = activeDoctorId) =>
      (s.careMessages || [])
        .filter(
          (message) =>
            message.patientId === patientId && message.doctorId === doctorId,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const hasContactList = isDoctor || patientDoctorIds.length > 1;
    const send = () => {
      const text = chatDraft.trim();
      if (!text && !chatAttachment) return;
      setS((previous) => ({
        ...previous,
        careMessages: [
          ...(previous.careMessages || []),
          {
            id: uid(),
            patientId: activePatientId,
            doctorId: activeDoctorId,
            sender: isDoctor ? "doctor" : "patient",
            text,
            attachment: chatAttachment || undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setChatDraft("");
      setChatAttachment(null);
    };
    const chooseAttachment = (file?: File) => {
      if (!file) return;
      const allowed = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.type) || file.size > 1024 * 1024) {
        notify("Choose a PDF, image, or document under 1 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setChatAttachment({
          name: file.name,
          type: file.type,
          size: file.size,
          data: String(reader.result),
        });
      reader.readAsDataURL(file);
    };
    return (
      <>
        <PageHeading
          title="Messages"
          subtitle={isDoctor ? "Keep each patient conversation together." : "Message your care team between visits."}
        />
        <section className={hasContactList ? "care-chat" : "care-chat patient-chat"} aria-label="Patient and doctor messages">
          {isDoctor && (
            <aside className="chat-contacts" aria-label="Patient conversations">
              <div className="chat-contacts-head">
                <strong>Patients</strong>
                <span>{assignedPatients.length}</span>
              </div>
              {assignedPatients.length ? (
                assignedPatients.map((patientId) => {
                  const contact = getPatient(patientId);
                  const latestMessage = lastMessage(patientId);
                  return (
                    <button
                      type="button"
                      key={patientId}
                      className={activePatientId === patientId ? "chat-contact active" : "chat-contact"}
                      onClick={() => setChatPatientId(patientId)}
                    >
                      <span className="avatar small mint">{contact.initials}</span>
                      <span className="grow">
                        <strong>{contact.name}</strong>
                        <small>{latestMessage?.text || (latestMessage?.attachment ? "Attachment" : "No messages yet")}</small>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="fine">No assigned patient conversations yet.</p>
              )}
            </aside>
          )}
          {!isDoctor && patientDoctorIds.length > 1 && (
            <aside className="chat-contacts" aria-label="Care team conversations">
              <div className="chat-contacts-head">
                <strong>Care team</strong>
                <span>{patientDoctorIds.length}</span>
              </div>
              {patientDoctorIds.map((doctorId) => {
                const doctor = doctorFor(doctorId);
                const latestMessage = lastMessage(patient.id, doctorId);
                return (
                  <button
                    type="button"
                    key={doctorId}
                    className={activeDoctorId === doctorId ? "chat-contact active" : "chat-contact"}
                    onClick={() => setChatDoctorId(doctorId)}
                  >
                    <span className="avatar small mint">{doctor.initials}</span>
                    <span className="grow">
                      <strong>{doctor.name}</strong>
                      <small>{latestMessage?.text || (latestMessage?.attachment ? "Attachment" : doctor.department)}</small>
                    </span>
                  </button>
                );
              })}
            </aside>
          )}
          <div className="chat-thread">
            <header className="chat-thread-head">
              <span className="avatar small mint">{isDoctor ? chatPatient.initials : chatDoctor.initials}</span>
              <div>
                <strong>{isDoctor ? chatPatient.name : chatDoctor.name}</strong>
                <small>{isDoctor ? "Patient conversation" : `${chatDoctor.department} · Care team`}</small>
              </div>
            </header>
            <div className="chat-safety-note">Messages are saved on this browser. Do not use chat for urgent or emergency care.</div>
            <div className="chat-messages" aria-live="polite">
              {thread.length ? (
                thread.map((message) => (
                  <article key={message.id} className={`chat-bubble ${message.sender === (isDoctor ? "doctor" : "patient") ? "sent" : "received"}`}>
                    {message.text && <p>{message.text}</p>}
                    {message.attachment && (
                      <a className="chat-attachment" href={message.attachment.data} download={message.attachment.name}>
                        {message.attachment.type.startsWith("image/") ? (
                          <img src={message.attachment.data} alt={message.attachment.name} />
                        ) : (
                          <FileText size={20} />
                        )}
                        <span><strong>{message.attachment.name}</strong><small>{Math.max(1, Math.round(message.attachment.size / 1024))} KB · Download</small></span>
                      </a>
                    )}
                    <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  </article>
                ))
              ) : (
                <div className="chat-empty"><MessageCircle size={25} /><p>Start a secure care conversation.</p></div>
              )}
            </div>
            <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); send(); }}>
              {chatAttachment && <div className="chat-attachment-preview"><FileText size={16} /><span>{chatAttachment.name}</span><button type="button" aria-label="Remove attachment" onClick={() => setChatAttachment(null)}>×</button></div>}
              <div className="chat-compose-row">
                <input ref={chatFileInput} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(event) => { chooseAttachment(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                <button type="button" className="chat-attach-button" aria-label="Attach a file or image" title="Share a file or image" onClick={() => chatFileInput.current?.click()}><Upload size={19} /></button>
                <textarea rows={1} value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Type a message" aria-label="Message" />
                <button type="submit" className="chat-send-button" disabled={!chatDraft.trim() && !chatAttachment} aria-label="Send message"><ArrowRight size={19} /></button>
              </div>
            </form>
          </div>
        </section>
      </>
    );
  }
  function PageHeading({
    title,
    subtitle,
  }: {
    title: string;
    subtitle: string;
  }) {
    return (
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            MEDIKIOSK / {isDoctor ? "CLINICIAN WORKSPACE" : "YOUR CARE"}
          </div>
          <h1>{t(title)}</h1>
          <p>{subtitle}</p>
        </div>
        {!isDoctor && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn secondary onClick={generatePhoneAccess} ariaLabel={t("Open on Phone")}>
              <QrCode size={16} />
              {t("Open on Phone")}
            </Btn>
            <Btn secondary onClick={() => open("book")}>
              <Plus size={16} />
              {t("Book appointment")}
            </Btn>
          </div>
        )}
      </div>
    );
  }
  function Directory() {
    const list = doctors.filter(
      (d) =>
        (specialty === "All" || d.department === specialty) &&
        `${d.name} ${d.languages} ${d.department}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHeading
          title="Find a Doctor"
          subtitle="Find the right department, then choose your care team."
        />
        <div className="filter-bar">
          <label className="search-field">
            <Search size={18} />
            <input
              placeholder="Search by name, specialty or language"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label={t("Department")}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option>All</option>
            {doctors.map((d) => (
              <option key={d.id}>{d.department}</option>
            ))}
          </select>
        </div>
        <p className="fine">
          6 fictional clinicians · Seva Community Hospital · Demonstration
          credentials and locations
        </p>
        <div className="doctor-grid">
          {list.map((d) => (
            <section key={d.id} className="card doctor-card">
              <div className="card-head">
                <div className={`avatar ${d.color}`}>{d.initials}</div>
                <Badge tone={d.id === "kabir" ? "rose" : "mint"}>
                  {d.id === "kabir"
                    ? "Emergency service"
                    : "Slots available"}
                </Badge>
              </div>
              <h2>{d.name}</h2>
              <p className="specialty">{t(d.department)}</p>
              <p>{d.qualification}</p>
              <div className="doctor-details">
                <span>
                  <Languages size={16} />
                  {d.languages}
                </span>
                <span>
                  <MapPin size={16} />
                  {t("Room")} {room(d.id)} · {t("Floor")} {d.floor}
                </span>
                <span>
                  <Clock size={16} />
                  09:00–16:00 IST · Mon–Sat
                </span>
              </div>
              <div className="form-actions">
                <Btn secondary onClick={() => open("profile", d.id)}>
                  {t("Profile")}
                </Btn>
                <Btn
                  onClick={() =>
                    d.id === "kabir" ? open("emergency") : open("book", d.id)
                  }
                >
                  {t(d.id === "kabir" ? "Emergency help" : "Book appointment")}
                </Btn>
              </div>
            </section>
          ))}
        </div>
        {!list.length && (
          <p>
            No matching doctors. Try a different filter or ask the intake desk.
          </p>
        )}
      </>
    );
  }
  function VisitList() {
    const all = isDoctor
      ? s.visits.filter((v) => v.doctorId === selectedDoctorId())
      : visits;
    const displayed = all.filter(
      (v) =>
        (filter === "All" ||
          (filter === "Previous"
            ? ["completed", "cancelled"].includes(v.status)
            : !["completed", "cancelled"].includes(v.status))) &&
        `${v.reason} ${doctorFor(v.doctorId).name}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    const appointmentView = page === "Appointments";
    const reschedule = (v: Visit) => {
      setBookDoctor(v.doctorId);
      setBookDate(v.date);
      setBookTime(v.time || "10:30");
      setReason(v.reason);
      setReviewStep(false);
      open("reschedule", v.id);
    };
    const AppointmentCard = ({ v }: { v: Visit }) => {
      const d = doctorFor(v.doctorId);
      const closed = ["completed", "cancelled"].includes(v.status);
      const canCheckIn =
        !isDoctor && ["confirmed", "requested"].includes(v.status);
      return (
        <article className="appointment-card">
          <div className="appointment-card-main">
            <div className="appointment-date">
              <strong>
                {new Date(v.date + "T12:00:00").toLocaleDateString(lang, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </strong>
              <span>· {v.time || "Time to be confirmed"} IST</span>
            </div>
            <strong>
              {isDoctor ? getPatient(v.patientId).name : d.name}{" "}
              <span>· {isDoctor ? "Patient" : "General Medicine"}</span>
            </strong>
            <p>
              Consultation room {room(v.doctorId)}, Ground floor, OPD Block A
            </p>
            <p>{v.reason}</p>
          </div>
          <div className="appointment-card-side">
            <Badge
              tone={
                closed ? "subtle" : v.status === "checked-in" ? "mint" : "blue"
              }
            >
              {t(v.status[0].toUpperCase() + v.status.slice(1))}
            </Badge>
            <div className="appointment-actions">
              {canCheckIn && (
                <Btn
                  onClick={() => {
                    changeVisit(
                      v.id,
                      { status: "checked-in" },
                      "Patient checked in",
                    );
                    notify("Check-in confirmed");
                  }}
                >
                  Check in
                </Btn>
              )}
              {!isDoctor && !closed && (
                <Btn secondary onClick={() => reschedule(v)}>
                  Reschedule
                </Btn>
              )}
              {!isDoctor && !closed && (
                <button
                  className="appointment-cancel"
                  onClick={() => open("cancel", v.id)}
                >
                  Cancel
                </button>
              )}
              <Btn
                secondary
                onClick={() => open(isDoctor ? "review" : "visit", v.id)}
              >
                View visit
              </Btn>
            </div>
          </div>
        </article>
      );
    };
    return (
      <>
        <PageHeading
          title={page}
          subtitle="Your visits, documents, and care history stay together."
        />
        <div className="filter-bar">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {["All", "Upcoming", "Previous"].map((f) => (
                <TabsTrigger key={f} value={f}>
                  {t(f)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search visits"
              placeholder="Search your visits"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <section
          className={`card ${appointmentView ? "appointment-list-card" : ""}`}
        >
          {displayed.map((v) =>
            appointmentView ? (
              <AppointmentCard v={v} key={v.id} />
            ) : (
              <VisitRow v={v} key={v.id} />
            ),
          )}
          {!displayed.length && <Empty action={() => open("book")} />}
        </section>
      </>
    );
  }
  function Queue() {
    const queue = s.visits.filter(
      (v) => v.doctorId === selectedDoctorId() && v.date === day(),
    );
    const shown = queue.filter(
      (v) =>
        (filter === "All" ||
          v.priority === filter ||
          v.provisional === filter) &&
        `${getPatient(v.patientId).name} ${v.token || ""} ${v.reason}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHeading
          title={page === "Overview" ? "Today’s care overview" : page}
          subtitle={`Dr. Meera Sharma · General Medicine · Room ${room(selectedDoctorId())} · ${date(day())}`}
        />
        <div className="stats-grid">
          {[
            {
              label: "Waiting",
              n: queue.filter((v) =>
                ["waiting", "checked-in"].includes(v.status),
              ).length,
              icon: Users,
              tone: "mint",
            },
            {
              label: "Unreviewed urgent concerns",
              n: queue.filter(
                (v) =>
                  v.provisional === "Urgent concern" &&
                  v.priority === "Unassessed",
              ).length,
              icon: AlertTriangle,
              tone: "rose",
            },
            {
              label: "In consultation",
              n: queue.filter((v) => v.status === "in consultation").length,
              icon: Stethoscope,
              tone: "blue",
            },
            {
              label: "Completed",
              n: queue.filter((v) => v.status === "completed").length,
              icon: CheckCircle2,
              tone: "lavender",
            },
          ].map((x) => (
            <section className="card stat" key={x.label}>
              <span className={`step-icon ${x.tone}`}>
                <x.icon size={20} />
              </span>
              <strong>{x.n}</strong>
              <span>{t(x.label)}</span>
            </section>
          ))}
        </div>
        <section className="card">
          <div className="card-head">
            <h2>{t("Patient Queue")}</h2>
            <Badge tone="subtle">Synthetic clinical workflow</Badge>
          </div>
          <div className="filter-bar">
            <label className="search-field">
              <Search size={17} />
              <input
                placeholder="Search patient, token or complaint"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Priority filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                "All",
                "Unassessed",
                "Urgent concern",
                "Moderate priority",
                "Routine priority",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Token / status</th>
                  <th>Patient / complaint</th>
                  <th>Provisional concern</th>
                  <th>Reviewed priority</th>
                  <th>Summary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong className="token-small">{v.token || "—"}</strong>
                      <small>{v.status}</small>
                    </td>
                    <td>
                      <strong>
                        {getPatient(v.patientId).name}{" "}
                        <span className="fine">
                          · {getPatient(v.patientId).age}
                        </span>
                      </strong>
                      <small>{v.reason}</small>
                    </td>
                    <td>
                      <Badge
                        tone={
                          v.provisional === "Urgent concern" ? "rose" : "subtle"
                        }
                      >
                        {t(v.provisional)}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={v.priority === "Unassessed" ? "sand" : "blue"}
                      >
                        {t(v.priority)}
                      </Badge>
                    </td>
                    <td>
                      {v.approved
                        ? "Reviewed"
                        : v.summary
                          ? "Draft ready"
                          : "Incomplete"}
                      <small>
                        {s.reports.filter((r) => r.visitId === v.id).length}{" "}
                        reports
                      </small>
                    </td>
                    <td>
                      <button
                        className="button secondary compact"
                        onClick={() => open("review", v.id)}
                      >
                        {t("Review")} <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!shown.length && <p>No patients match these filters.</p>}
          <p className="fine">
            Priority and queue status are separate. Waiting duration is
            unavailable in this version.
          </p>
        </section>
      </>
    );
  }
  function SettingsPage() {
    return (
      <>
        <PageHeading
          title="Settings"
          subtitle="Make this space work for you."
        />
        <div className="settings-grid">
          <section className="card">
            <h2>Display & accessibility</h2>
            <label className="setting-row">
              {t("Theme")}
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {["system", "light", "dark"].map((v) => (
                  <option value={v} key={v}>
                    {t(v[0].toUpperCase() + v.slice(1))}
                  </option>
                ))}
              </select>
            </label>
            <label className="setting-row">
              {t("Language")}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
              >
                {Object.entries(languageNames).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {[
              { label: "Reduce motion", value: reduced, set: setReduced },
              { label: "Large text", value: large, set: setLarge },
              { label: "High contrast", value: contrast, set: setContrast },
            ].map((x) => (
              <label className="setting-row" key={x.label}>
                {x.label}
                <Switch checked={x.value} onCheckedChange={x.set} />
              </label>
            ))}
          </section>
          <section className="card">
            <h2>Connections</h2>
            <p>
              This workspace uses fictional records saved on this browser. It is
              not a medical service.
            </p>
            <div className="setting-row">
              AI / OCR<Badge tone="sand">Simulated / unavailable</Badge>
            </div>
            <div className="setting-row">
              ABHA / ABDM<Badge tone="subtle">Not connected</Badge>
            </div>
            <div className="setting-row">
              Hospital notifications
              <Badge tone="subtle">In-app alerts</Badge>
            </div>
            <div className="setting-row">
              Connected mode<Badge tone="subtle">Unavailable</Badge>
            </div>
            <p className="fine">
              Core navigation is available in five languages. Some detailed
              guidance remains in English; clinical narratives are preserved in
              their original wording.
            </p>
            <Btn secondary onClick={() => open("reset")}>
              Reset fictional records
            </Btn>
            <div className="persona-list">
              <label className="field">
                <span>Fictional patient persona</span>
                <select
                  value={s.selectedPatient}
                  onChange={(e) => {
                    setS((prev) => ({
                      ...prev,
                      selectedPatient: e.target.value,
                    }));
                    notify("Fictional patient changed");
                  }}
                >
                  {patientList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.age}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      </>
    );
  }
  function EmergencyLocationPanel() {
    const hospitals = gps
      ? [...nearbyHospitals].sort(
          (a, b) => geoDistanceKm(gps, a) - geoDistanceKm(gps, b),
        )
      : nearbyHospitals;
    return (
      <>
        <div className="emergency-symbol">
          <Phone size={28} />
        </div>
        <h3>Emergency assistance · India</h3>
        <p>
          If you need immediate help, call <strong>112</strong>. Do not wait for
          the location or hospital list.
        </p>
        <div className="form-actions">
          <a className="button danger" href="tel:112">
            <Phone size={18} /> Call 112
          </a>
          <Btn secondary onClick={requestLocation}>
            <MapPin size={17} />
            {gpsStatus === "locating"
              ? "Finding location…"
              : gps
                ? "Refresh GPS location"
                : "Use my GPS location"}
          </Btn>
        </div>
        <p className="fine">
          Location is requested only after you choose it. No ambulance has been
          requested or dispatched.
        </p>
        {gpsStatus === "denied" && (
          <p className="error" role="alert">
            Location permission was not granted. You can still call 112 and open
            a hospital map below.
          </p>
        )}
        {gps && (
          <div className="emergency-location-card">
            <strong>
              <MapPin size={17} /> Current location found
            </strong>
            <p>
              {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} · accuracy
              approximately {gps.accuracy} m
            </p>
            <small>
              Nearest listed hospital: {hospitals[0].name} · estimated road time
              ~{trafficEstimate(geoDistanceKm(gps, hospitals[0]))} min
            </small>
          </div>
        )}
        <div className="emergency-services">
          <div className="service-heading">
            <div>
              <h4>
                <Phone size={17} /> Emergency numbers & ambulance services
              </h4>
              <p className="fine">
                For a life-threatening emergency, call 112 first. The operator
                can route the request to the appropriate local responder.
              </p>
            </div>
            <Badge tone="rose">Tap to call</Badge>
          </div>
          <div className="emergency-service-list">
            {emergencyServices.map((service, index) => (
              <article
                className={`service-row ${index === 0 ? "recommended" : ""}`}
                key={service.id}
              >
                <span className="service-icon">
                  <Phone size={17} />
                </span>
                <span className="grow">
                  <span className="service-title">
                    <strong>{service.name}</strong>
                    {index === 0 && <em>Best first call</em>}
                  </span>
                  <small>
                    {service.kind} · {service.scope}
                  </small>
                  <p>{service.description}</p>
                </span>
                <a
                  className={
                    index === 0
                      ? "button danger service-call"
                      : "button secondary service-call"
                  }
                  href={`tel:${service.number}`}
                  aria-label={`Call ${service.name} at ${service.number}`}
                >
                  <Phone size={15} />
                  {service.number}
                </a>
              </article>
            ))}
          </div>
          <p className="fine">
            Private providers are shown as additional options, similar to
            choosing among delivery services—not as guaranteed dispatch
            partners. CareSetu cannot see live ambulance locations, availability
            or response times.
          </p>
        </div>
        <div className="nearby-hospitals">
          <h4>
            <MapPin size={17} /> Nearby hospitals
          </h4>
          <p className="fine">
            The list uses sample Delhi hospital locations. Travel times are
            estimates based on distance and time-of-day traffic, not live
            traffic.
          </p>
          {hospitals.map((h) => {
            const distance = gps ? geoDistanceKm(gps, h) : null;
            return (
              <button
                type="button"
                className={`hospital-row ${selectedHospital === h.id ? "selected" : ""}`}
                key={h.id}
                onClick={() => setSelectedHospital(h.id)}
              >
                <span className="hospital-pin">
                  <MapPin size={16} />
                </span>
                <span className="grow">
                  <strong>{h.name}</strong>
                  <small>
                    {h.address} · {h.services}
                  </small>
                </span>
                <span className="hospital-eta">
                  {distance !== null ? (
                    <>
                      <strong>~{trafficEstimate(distance)} min</strong>
                      <small>{distance.toFixed(1)} km</small>
                    </>
                  ) : (
                    <small>{h.area}</small>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="form-actions">
          <a
            className="button secondary"
            target="_blank"
            rel="noreferrer"
            href={`https://maps.google.com/?q=${(nearbyHospitals.find((h) => h.id === selectedHospital) || nearbyHospitals[0]).latitude},${(nearbyHospitals.find((h) => h.id === selectedHospital) || nearbyHospitals[0]).longitude}`}
          >
            <MapPin size={17} />
            Open hospital in Maps
          </a>
          <Btn disabled={!gps} onClick={shareLocation}>
            <ArrowUpRight size={17} />
            {sharePrepared ? "Share again" : "Share location details"}
          </Btn>
        </div>
        <div className="emergency-demo-note">
          <AlertTriangle size={17} />
          <p>
            <strong>Safety notice:</strong> Call buttons open your device’s
            dialler. CareSetu does not place the call, dispatch an ambulance,
            check live traffic, or automatically send GPS data. Location is
            shared only when you use the share action, and receipt is not
            confirmed.
          </p>
        </div>
      </>
    );
  }
  function ModalBody() {
    if (!modal) return null;
    const v = s.visits.find((x) => x.id === modal.id);
    const d = doctorFor(bookDoctor);
    if (modal.type === "phone-access") {
      const active = phoneAccess?.status === "ACTIVE";
      const expired = phoneAccess?.status === "EXPIRED";
      const link = phoneAccess ? phoneAccessLink(phoneAccess.tokenId) : "";
      const countdown = phoneAccess ? formatPhoneAccessCountdown(phoneAccess.expiresAt, phoneAccessNow) : "00:00";
      const shareText = `Open your CareSetu session securely using this link:\n\n${link}\n\nThis link expires shortly.`;
      return (
        <section className="phone-access-modal">
          <Badge tone="sand">{t("Demo Mode")}</Badge>
          {active ? (
            <>
              <p className="phone-access-copy">{t("Scan this QR code to securely open CareSetu on your phone.")}</p>
              {phoneAccessQr ? (
                <img className="phone-access-qr" src={phoneAccessQr} alt="QR code for a temporary CareSetu access link" />
              ) : <div className="phone-access-qr" aria-label="Generating QR code" />}
              <p className="fine">{t("Scan with your phone camera")}</p>
              <div className="phone-access-status" aria-live="polite">
                <Smartphone size={18} />
                <span>{t("Phone access")}: <strong>Demo QR generated</strong></span>
                <span aria-hidden="true">•</span>
                <span>{t("Link expires in")} <strong>{countdown}</strong></span>
              </div>
              <div className="phone-access-actions">
                <Btn onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer")}>
                  <MessageCircle size={17} /> {t("Send Link via WhatsApp")}
                </Btn>
                <Btn secondary onClick={copyPhoneAccessLink}><Copy size={17} /> {t("Copy Secure Link")}</Btn>
                <Btn secondary onClick={() => { const revoked = revokePhoneAccessToken(phoneAccess!.tokenId); setPhoneAccess(revoked || null); }}>
                  {t("Revoke Phone Access")}
                </Btn>
              </div>
              <p className="phone-access-note"><ShieldCheck size={18} /> QR codes contain a temporary access link, not your medical records.</p>
              <p className="fine">Demo validation is browser-local. A real phone handoff and real-time connection status require a server-side token service.</p>
            </>
          ) : (
            <>
              <p className="phone-access-copy">{t(expired ? "QR code expired" : "This mobile access link is no longer valid.")}</p>
              <p className="fine">The old temporary link is no longer accepted.</p>
              <Btn onClick={generatePhoneAccess}><RefreshCw size={17} /> {t("Generate New QR")}</Btn>
            </>
          )}
        </section>
      );
    }
    if (modal.type === "emergency") return <EmergencyLocationPanel />;
    if (modal.type === "chat") {
      const chatDoctorId = isDoctor
        ? selectedDoctorId()
        : current?.doctorId || visits.at(-1)?.doctorId || "meera";
      const chatDoctor = doctorFor(chatDoctorId);
      const thread = (s.careMessages || []).filter(
        (message) =>
          message.patientId === patient.id &&
          message.doctorId === chatDoctorId,
      );
      return (
        <>
          <p className="fine">
            Chat with {isDoctor ? patient.name : chatDoctor.name}. Messages are
            saved on this browser and are not for emergencies.
          </p>
          <div className="summary-text" aria-live="polite">
            {thread.length ? (
              thread.map((message) => (
                <p key={message.id}>
                  <strong>{message.sender === "doctor" ? chatDoctor.name : patient.name}:</strong>{" "}
                  {message.text}
                </p>
              ))
            ) : (
              <p>No messages yet. Start the conversation below.</p>
            )}
          </div>
          <label className="field">
            <span>Message</span>
            <textarea
              rows={3}
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder="Write a message…"
            />
          </label>
          <Btn
            disabled={!chatDraft.trim()}
            onClick={() => {
              const text = chatDraft.trim();
              setS((previous) => ({
                ...previous,
                careMessages: [
                  ...(previous.careMessages || []),
                  {
                    id: uid(),
                    patientId: patient.id,
                    doctorId: chatDoctorId,
                    sender: isDoctor ? "doctor" : "patient",
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }));
              setChatDraft("");
              notify("Message sent");
            }}
          >
            Send message <ArrowRight size={16} />
          </Btn>
        </>
      );
    }
    if (modal.type === "help")
      return (
        <>
          <p>
            Ask the hospital intake desk for assisted entry. You may skip
            questions, type your answers, or tell your doctor privately.
          </p>
          <p>No smartphone, microphone, or ABHA is required to use CareSetu.</p>
          <Btn
            secondary
            onClick={() => {
              setModal(null);
              go("AI Case-Taking");
            }}
          >
            Return to intake
          </Btn>
          <Btn onClick={() => open("emergency")}>{t("Emergency help")}</Btn>
        </>
      );
    if (modal.type === "measure")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            let h = Number(f.get("height"));
            let w = Number(f.get("weight"));
            if (f.get("heightUnit") === "ft")
              h = h * 30.48 + Number(f.get("inches") || 0) * 2.54;
            if (f.get("weightUnit") === "lb") w *= 0.45359237;
            const dt = String(f.get("date"));
            if (!bmi(h, w) || !dt || dt > day()) {
              setError(
                "Enter positive height and weight and a measurement date no later than today.",
              );
              return;
            }
            if (
              (h < 100 || h > 230 || w < 30 || w > 250) &&
              f.get("confirmed") !== "on"
            ) {
              setError(
                "These measurements are unusual. Check the units and confirm to save.",
              );
              return;
            }
            setS((prev) => ({
              ...prev,
              observations: [
                ...prev.observations,
                {
                  id: uid(),
                  patientId: patient.id,
                  date: dt,
                  height: h,
                  weight: w,
                  source: String(f.get("source")),
                },
              ],
            }));
            setModal(null);
            notify("Measurements saved");
          }}
        >
          <div className="form-grid">
            <label className="field">
              <span>{t("Height")}</span>
              <input
                name="height"
                type="number"
                step="any"
                min="0.1"
                defaultValue={latest?.height || ""}
                required
              />
            </label>
            <label className="field">
              <span>Height unit</span>
              <select name="heightUnit">
                <option value="cm">cm</option>
                <option value="ft">feet + inches</option>
              </select>
            </label>
            <label className="field">
              <span>Additional inches (feet only)</span>
              <input
                name="inches"
                type="number"
                min="0"
                max="11.99"
                step="any"
                defaultValue="0"
              />
            </label>
            <label className="field">
              <span>{t("Weight")}</span>
              <input
                name="weight"
                type="number"
                step="any"
                min="0.1"
                defaultValue={latest?.weight || ""}
                required
              />
            </label>
            <label className="field">
              <span>Weight unit</span>
              <select name="weightUnit">
                <option>kg</option>
                <option>lb</option>
              </select>
            </label>
            <label className="field">
              <span>{t("Date")}</span>
              <input
                name="date"
                type="date"
                max={day()}
                defaultValue={day()}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>{t("Source")}</span>
            <select name="source">
              <option>Patient-reported</option>
              <option>Staff-measured</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="confirmed" />I have checked unusual
            measurements and their units.
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="fine">
            BMI = weight (kg) ÷ height (m)². No diagnostic category is assigned.
          </p>
          <button className="button" type="submit">
            {t("Save")}
          </button>
        </form>
      );
    if (modal.type === "book" || modal.type === "reschedule")
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              bookDate < day() ||
              new Date(bookDate + "T12:00:00").getDay() === 0
            ) {
              setError("Choose today or a future Monday–Saturday.");
              return;
            }
            if (!reviewStep) {
              setReviewStep(true);
              setError("");
              return;
            }
            if (
              s.visits.some(
                (x) =>
                  x.id !== modal.id &&
                  x.doctorId === bookDoctor &&
                  x.date === bookDate &&
                  x.time === bookTime &&
                  !["cancelled", "completed"].includes(x.status),
              )
            ) {
              setError(
                "That slot is no longer available. Please choose another time.",
              );
              setReviewStep(false);
              return;
            }
            if (modal.type === "reschedule" && v)
              changeVisit(
                v.id,
                {
                  doctorId: bookDoctor,
                  date: bookDate,
                  time: bookTime,
                  status: "confirmed",
                },
                "Appointment rescheduled",
              );
            else {
              const created: Visit = {
                id: uid(),
                patientId: patient.id,
                doctorId: bookDoctor,
                date: bookDate,
                time: bookTime,
                reason: reason || "General consultation",
                status: "confirmed",
                priority: "Unassessed",
                provisional: "Unassessed",
                summary: makeSummary(answers),
                activity: ["Appointment confirmed"],
              };
              setS((prev) => ({
                ...prev,
                visits: [...prev.visits, created],
                notifications: [
                  `Appointment confirmed with ${d.name} · room ${room(d.id)}`,
                  ...prev.notifications,
                ],
              }));
              emitNotification("patient", patient.id, {
                type: "appointment-booked",
                title: "Appointment booked",
                message: `Your appointment with ${d.name} is ${date(bookDate)} at ${bookTime} IST in room ${room(d.id)}.`,
                entityType: "appointment",
                entityId: created.id,
                eventKey: `patient-booked-${created.id}`,
              });
              emitNotification("doctor", bookDoctor, {
                type: "appointment-booked",
                title: "New appointment",
                message: `${patient.name} booked ${date(bookDate)} at ${bookTime} IST.`,
                entityType: "appointment",
                entityId: created.id,
                eventKey: `doctor-booked-${created.id}`,
              });
            }
            setModal(null);
            go("Appointments");
            notify("Appointment confirmed");
          }}
        >
          {reviewStep ? (
            <div className="booking-review">
              <CheckCircle2 size={34} />
              <h3>Review your appointment</h3>
              <p>{patient.name}</p>
              <strong>{d.name}</strong>
              <p>
                {date(bookDate)} · {bookTime} IST
              </p>
              <p>
                Seva Community Hospital · Room {room(d.id)} · Floor {d.floor}
              </p>
              <p>{reason || "General consultation"}</p>
              <p className="fine">
                Fictional booking. A queue token is assigned after check-in.
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => setReviewStep(false)}
              >
                Edit details
              </button>
            </div>
          ) : (
            <>
              <label className="field">
                <span>Doctor / department</span>
                <select
                  value={bookDoctor}
                  onChange={(e) => setBookDoctor(e.target.value)}
                >
                  {doctors
                    .filter((x) => x.id !== "kabir")
                    .map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.name} · {t(x.department)}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>{t("Date")}</span>
                  <input
                    type="date"
                    min={day()}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>{t("Time")} · IST</span>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                  >
                    {[
                      "09:00",
                      "09:30",
                      "10:00",
                      "10:30",
                      "11:00",
                      "11:30",
                      "14:00",
                      "14:30",
                      "15:00",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>{t("Reason for visit")}</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </label>
              <p className="fine">
                Your current patient-provided draft will be attached to this
                visit. All appointments use IST.
              </p>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" type="submit">
            {reviewStep ? "Confirm appointment" : t("Review")}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
      );
    if (modal.type === "profile") {
      const doc = doctorFor(modal.id!);
      return (
        <>
          <div className={`avatar ${doc.color}`}>{doc.initials}</div>
          <h3>{doc.name}</h3>
          <p>
            {doc.qualification} · {t(doc.department)}
          </p>
          <p>{doc.languages}</p>
          <p>
            Seva Community Hospital · Room {room(doc.id)} · Floor {doc.floor}
          </p>
          <p>
            Monday–Saturday, 09:00–16:00 IST. Step-free access in this fictional
            facility. Fees are not configured.
          </p>
          <p className="fine">
            Fictional clinician and qualifications. Service eligibility requires
            staff confirmation.
          </p>
          <Btn
            onClick={() =>
              doc.id === "kabir" ? open("emergency") : open("book", doc.id)
            }
          >
            {t("Book appointment")}
          </Btn>
        </>
      );
    }
    if (modal.type === "visit" && v) {
      const doc = doctorFor(v.doctorId);
      return (
        <>
          <div className="visit-heading">
            <div>
              <h3>{doc.name}</h3>
              <p>
                {date(v.date)} · {v.time || "Walk-in"} IST
              </p>
            </div>
            <Badge>{v.status}</Badge>
          </div>
          <Tabs value={visitTab} onValueChange={setVisitTab}>
            <TabsList className="visit-tabs">
              {[
                "Overview",
                "Case summary",
                "Reports",
                "Measurements",
                "Follow-up",
                "Activity",
              ].map((x) => (
                <TabsTrigger key={x} value={x}>
                  {t(x)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {visitTab === "Overview" && (
            <>
              <p>{v.reason}</p>
              <div className="location-strip">
                <MapPin size={19} />
                Seva Community Hospital · Room {room(v.doctorId)} · Floor{" "}
                {doc.floor}
              </div>
              {v.token && (
                <div className="token-display">
                  {v.token}
                  <small>{v.status} · Wait time not available</small>
                </div>
              )}
              <p>Clinician priority: {t(v.priority)}</p>
              <div className="form-actions">
                {v.status === "confirmed" && (
                  <>
                    <Btn
                      disabled={v.date !== day()}
                      onClick={() =>
                        changeVisit(
                          v.id,
                          { status: "checked-in" },
                          "Patient checked in — awaiting token",
                        )
                      }
                    >
                      {t("Check in")}
                    </Btn>
                    <Btn
                      secondary
                      onClick={() => {
                        setBookDoctor(v.doctorId);
                        setBookDate(v.date);
                        setBookTime(v.time);
                        setReason(v.reason);
                        setReviewStep(false);
                        open("reschedule", v.id);
                      }}
                    >
                      {t("Reschedule")}
                    </Btn>
                    <Btn secondary onClick={() => open("cancel", v.id)}>
                      {t("Cancel")}
                    </Btn>
                  </>
                )}
              </div>
            </>
          )}
          {visitTab === "Case summary" && (
            <>
              <Badge tone={v.approved ? "mint" : "sand"}>
                {v.approved
                  ? "Clinician-reviewed · fictional doctor"
                  : "Patient-provided draft · awaiting clinician review"}
              </Badge>
              <pre className="summary-text">
                {v.approved ||
                  v.summary ||
                  "No summary yet. Start or continue your case."}
              </pre>
              {v.summary && v.approved && (
                <details>
                  <summary>Original patient draft</summary>
                  <pre className="summary-text">{v.summary}</pre>
                </details>
              )}
              {v.versions?.map((text, i) => (
                <details key={i}>
                  <summary>Previous signed version {i + 1}</summary>
                  <pre className="summary-text">{text}</pre>
                </details>
              ))}
            </>
          )}
          {visitTab === "Reports" && (
            <>
              <ReportList visitId={v.id} />
              <Btn secondary onClick={() => open("upload", v.id)}>
                <Upload size={16} />
                {t("Upload report")}
              </Btn>
            </>
          )}
          {visitTab === "Measurements" && (
            <VisitMeasurementTable visit={v} />
          )}
          {visitTab === "Follow-up" && (
            <>
              <p>{v.followup || "No clinician instructions recorded."}</p>
              <p>
                Current medicines: not confirmed. No prescription has been
                generated.
              </p>
            </>
          )}
          {visitTab === "Activity" && (
            <ol className="timeline">
              {v.activity.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          )}
        </>
      );
    }
    if (modal.type === "upload")
      return (
        <>
          <p>
            PDF, JPEG or PNG · maximum 2 MB in this browser. Use
            fictional documents only.
          </p>
          <label className="field">
            <span>Attach to visit</span>
            <select id="upload-visit" defaultValue={modal.id || current?.id}>
              {visits.map((x) => (
                <option key={x.id} value={x.id}>
                  {date(x.date)} · {x.reason}
                </option>
              ))}
            </select>
          </label>
          <label className="upload-zone">
            <Upload size={28} />
            <strong>{t("Upload report")}</strong>
            <span>Choose a file</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const visitId = (
                  document.getElementById(
                    "upload-visit",
                  ) as unknown as HTMLSelectElement
                ).value;
                if (!visitId) {
                  setError("Create a visit before uploading.");
                  return;
                }
                if (
                  !["application/pdf", "image/jpeg", "image/png"].includes(
                    file.type,
                  ) ||
                  file.size > 2 * 1024 * 1024
                ) {
                  setError("Choose a PDF, JPEG or PNG smaller than 2 MB.");
                  return;
                }
                const bytes = new Uint8Array(
                  await file.slice(0, 8).arrayBuffer(),
                );
                const valid =
                  file.type === "application/pdf"
                    ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
                    : file.type === "image/jpeg"
                      ? bytes[0] === 255 && bytes[1] === 216
                      : bytes[0] === 137 &&
                        bytes[1] === 80 &&
                        bytes[2] === 78 &&
                        bytes[3] === 71;
                if (!valid) {
                  setError("The file contents do not match its format.");
                  return;
                }
                const reader = new FileReader();
                reader.onerror = () =>
                  setError("Could not read file. Try again.");
                reader.onload = () => {
                  const report = {
                    id: uid(),
                    visitId,
                    name: file.name,
                    date: day(),
                    type: file.type,
                    data: String(reader.result),
                  };
                  try {
                    localStorage.setItem(
                      "medi-upload-check",
                      String(reader.result),
                    );
                    localStorage.removeItem("medi-upload-check");
                  } catch {
                    setError(
                      "Browser storage is full. Use a smaller fictional file.",
                    );
                    return;
                  }
                  setS((prev) => ({
                    ...prev,
                    reports: [...prev.reports, report],
                  }));
                  changeVisit(visitId, {}, `Report uploaded: ${file.name}`);
                  const linkedVisit = s.visits.find(
                    (item) => item.id === visitId,
                  );
                  if (linkedVisit) {
                    emitNotification("patient", linkedVisit.patientId, {
                      type: "report-uploaded",
                      title: "Report uploaded",
                      message: `${file.name} was saved successfully.`,
                      entityType: "report",
                      entityId: report.id,
                      eventKey: `patient-report-uploaded-${report.id}`,
                    });
                    emitNotification("doctor", linkedVisit.doctorId, {
                      type: "report-uploaded",
                      title: "New report uploaded",
                      message: `${getPatient(linkedVisit.patientId).name} uploaded ${file.name}.`,
                      entityType: "report",
                      entityId: report.id,
                      eventKey: `doctor-report-uploaded-${report.id}`,
                    });
                  }
                  setModal({ type: "report", id: report.id });
                  notify(
                    "Report saved. Extraction unavailable for arbitrary uploads.",
                  );
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button
            className="text-button"
            onClick={() => {
              const id = modal.id || current?.id;
              if (!id) {
                setError("Create a visit first.");
                return;
              }
              const report = {
                id: uid(),
                visitId: id,
                name: "Intake note.pdf",
                date: day(),
                type: "application/pdf",
                fixture: true,
                extracted:
                  "Fictional document fixture. Patient: " +
                  patient.name +
                  ". Document type: intake note. No investigation values supplied. Medicines: not confirmed.",
              };
              setS((prev) => ({ ...prev, reports: [...prev.reports, report] }));
              const linkedVisit = s.visits.find((item) => item.id === id);
              if (linkedVisit) {
                emitNotification("patient", linkedVisit.patientId, {
                  type: "report-uploaded",
                  title: "Report uploaded",
                  message: `${report.name} was saved successfully.`,
                  entityType: "report",
                  entityId: report.id,
                  eventKey: `patient-report-uploaded-${report.id}`,
                });
                emitNotification("doctor", linkedVisit.doctorId, {
                  type: "report-uploaded",
                  title: "New report uploaded",
                  message: `${getPatient(linkedVisit.patientId).name} added ${report.name}.`,
                  entityType: "report",
                  entityId: report.id,
                  eventKey: `doctor-report-uploaded-${report.id}`,
                });
              }
              open("report", report.id);
            }}
          >
            Use a fictional sample document instead
          </button>
        </>
      );
    if (modal.type === "report") {
      const report = s.reports.find((x) => x.id === modal.id);
      if (
        !report ||
        (!isDoctor && !visits.some((x) => x.id === report.visitId))
      )
        return <p>Document unavailable for this patient.</p>;
      return (
        <>
          <div className="ocr-grid">
            <section>
              <h3>Original document</h3>
              {report.fixture ? (
                <div className="paper-preview">
                  <strong>SEVA COMMUNITY HOSPITAL</strong>
                  <small>FICTIONAL DOCUMENT FIXTURE</small>
                  <hr />
                  <h3>{report.name}</h3>
                  <p>
                    {
                      getPatient(
                        s.visits.find((x) => x.id === report.visitId)!
                          .patientId,
                      ).name
                    }
                  </p>
                  <p>{date(report.date)}</p>
                  <p>{report.extracted}</p>
                </div>
              ) : report.type.startsWith("image/") ? (
                <img
                  className="report-image"
                  src={report.data}
                  alt="Uploaded fictional report"
                />
              ) : (
                <object
                  data={report.data}
                  type="application/pdf"
                  className="pdf-preview"
                >
                  <p>PDF preview unavailable. Download to view.</p>
                </object>
              )}
            </section>
            <section>
              <h3>Extracted content</h3>
              <Badge tone="sand">
                {report.fixture
                  ? "Simulated OCR · needs review"
                  : "Extraction unavailable"}
              </Badge>
              {report.fixture ? (
                <>
                  <label className="field">
                    <span>Source: fictional document, page 1</span>
                    <textarea
                      rows={9}
                      value={report.extracted || ""}
                      disabled={!!report.verified}
                      onChange={(e) => {
                        const value = e.target.value;
                        setS((prev) => ({
                          ...prev,
                          reports: prev.reports.map((r) =>
                            r.id === report.id ? { ...r, extracted: value } : r,
                          ),
                        }));
                      }}
                    />
                  </label>
                  <p>
                    No structured laboratory values or evidence coordinates were
                    supplied.
                  </p>
                  {isDoctor && (
                    <Btn
                      disabled={!!report.verified}
                      onClick={() => {
                        setS((prev) => ({
                          ...prev,
                          reports: prev.reports.map((r) =>
                            r.id === report.id ? { ...r, verified: true } : r,
                          ),
                        }));
                        changeVisit(
                          report.visitId,
                          {},
                          "Dr. Meera Sharma verified the fictional extracted note",
                        );
                        const linkedVisit = s.visits.find(
                          (item) => item.id === report.visitId,
                        );
                        if (linkedVisit)
                          emitNotification("patient", linkedVisit.patientId, {
                            type: "report-reviewed",
                            title: "Report reviewed",
                            message: `Dr. Meera Sharma reviewed ${report.name}.`,
                            entityType: "report",
                            entityId: report.id,
                            eventKey: `patient-report-reviewed-${report.id}`,
                          });
                      }}
                    >
                      {report.verified
                        ? "Verified by fictional clinician"
                        : "Verify extracted note"}
                    </Btn>
                  )}
                </>
              ) : (
                <p>
                  This file is preserved as uploaded. No OCR provider is
                  connected, so no extracted facts have been invented.
                </p>
              )}
            </section>
          </div>
          {report.data ? (
            <a
              className="button secondary"
              href={report.data}
              download={report.name}
            >
              <Download size={16} />
              Download original
            </a>
          ) : (
            <button
              className="button secondary"
              onClick={() => {
                const blob = new Blob([report.extracted || ""], {
                  type: "text/plain",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "fictional-document-fixture.txt";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <Download size={16} />
              Download fixture text
            </button>
          )}
        </>
      );
    }
    if (modal.type === "refer" && v && isDoctor) {
      const sourceDoctor = doctorFor(v.doctorId);
      const availableDoctors = doctors.filter(
        (doctor) => doctor.id !== sourceDoctor.id,
      );
      const targetDoctor = doctorFor(referralDoctor);
      return (
        <>
          <p>
            Refer {getPatient(v.patientId).name}'s case to another clinician.
            The case summary and linked records remain available for review.
          </p>
          <label className="field">
            <span>Refer to</span>
            <select
              value={referralDoctor}
              onChange={(event) => setReferralDoctor(event.target.value)}
            >
              {availableDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} · {doctor.department}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Referral note</span>
            <textarea
              rows={4}
              value={referralNote}
              onChange={(event) => setReferralNote(event.target.value)}
              placeholder="Explain why this clinician's review is needed…"
            />
          </label>
          <div className="form-actions">
            <Btn secondary onClick={() => open("review", v.id)}>
              Back to review
            </Btn>
            <Btn
              disabled={!referralNote.trim()}
              onClick={() => {
                changeVisit(
                  v.id,
                  { doctorId: targetDoctor.id, status: "requested" },
                  `${sourceDoctor.name} referred to ${targetDoctor.name}: ${referralNote.trim()}`,
                );
                setModal(null);
                notify(`Case referred to ${targetDoctor.name}`);
              }}
            >
              Send referral <ArrowRight size={16} />
            </Btn>
          </div>
        </>
      );
    }
    if (modal.type === "review" && v && isDoctor) {
      const p = getPatient(v.patientId);
      return (
        <>
          <div className="visit-heading">
            <div>
              <h3>
                {p.name} · {p.age} years
              </h3>
              <p>{v.reason}</p>
            </div>
            <Badge
              tone={v.provisional === "Urgent concern" ? "rose" : "subtle"}
            >
              {t(v.provisional)}
            </Badge>
          </div>
          <p className="fine">
            Fictional authorized care scope: General Medicine · Room{" "}
            {room(v.doctorId)}
          </p>
          {v.provisional === "Urgent concern" && (
            <Btn
              secondary
              onClick={() =>
                changeVisit(
                  v.id,
                  { provisional: "Acknowledged — awaiting assessment" },
                  "Dr. Meera Sharma acknowledged the urgent concern",
                )
              }
            >
              Acknowledge urgent concern
            </Btn>
          )}
          <div className="clinical-alert">
            Allergies: {s.answers[p.id]?.allergies || "Not known"} · Source:
            patient intake
            <br />
            Medicines: {s.answers[p.id]?.medicines || "Not confirmed"}
          </div>
          <details>
            <summary>Original patient-provided draft and sources</summary>
            <pre className="summary-text">
              {v.summary ||
                "Intake incomplete. Ask the patient for missing information."}
            </pre>
          </details>
          <label className="field">
            <span>Clinician summary · edit / accept / amend</span>
            <textarea
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Follow-up instructions</span>
            <textarea
              rows={2}
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
            />
          </label>
          <Btn secondary onClick={() => open("refer", v.id)}>
            Refer to another doctor
          </Btn>
          <div className="form-grid">
            <label className="field">
              <span>Reviewed priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {[
                  "Unassessed",
                  "Urgent concern",
                  "Moderate priority",
                  "Routine priority",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Reason for priority change</span>
              <input
                value={priorityReason}
                onChange={(e) => setPriorityReason(e.target.value)}
                placeholder="Required when priority changes"
              />
            </label>
          </div>
          <div className="form-actions">
            <Btn
              secondary
              onClick={() => {
                if (priority !== v.priority && !priorityReason.trim()) {
                  setError("Give a reason for the priority change.");
                  return;
                }
                changeVisit(
                  v.id,
                  { summary: note, followup, priority },
                  `Dr. Meera Sharma saved draft${priorityReason ? "; priority reason: " + priorityReason : ""}`,
                );
                notify("Draft saved");
              }}
            >
              {t("Save draft")}
            </Btn>
            <Btn
              disabled={!note.trim()}
              onClick={() => {
                if (priority !== v.priority && !priorityReason.trim()) {
                  setError("Give a reason for the priority change.");
                  return;
                }
                setModal({ type: "finalize", id: v.id });
              }}
            >
              Review & finalize
            </Btn>
            <Btn
              secondary
              onClick={() => {
                changeVisit(
                  v.id,
                  {},
                  "Dr. Meera Sharma requested clarification of the patient history",
                );
                notify("Clarification request saved");
              }}
            >
              Request clarification
            </Btn>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="queue-controls">
            <h3>Queue · {v.token || "Awaiting token"}</h3>
            <p>{v.status}</p>
            <div className="form-actions">
              {v.status === "checked-in" && (
                <Btn onClick={() => tokenAction(v)}>{t("Assign token")}</Btn>
              )}
              {["waiting", "temporarily away"].includes(v.status) && (
                <Btn
                  onClick={() =>
                    changeVisit(
                      v.id,
                      { status: "called" },
                      "Patient called to room " + room(v.doctorId),
                    )
                  }
                >
                  {t("Call patient")}
                </Btn>
              )}
              {v.status === "called" && (
                <>
                  <Btn
                    onClick={() =>
                      changeVisit(
                        v.id,
                        { status: "in consultation" },
                        "Consultation started",
                      )
                    }
                  >
                    {t("Start consultation")}
                  </Btn>
                  <Btn
                    secondary
                    onClick={() =>
                      changeVisit(
                        v.id,
                        { status: "temporarily away" },
                        "Patient temporarily away",
                      )
                    }
                  >
                    Mark away
                  </Btn>
                </>
              )}
              {v.status === "in consultation" && (
                <Btn
                  disabled={!v.approved}
                  onClick={() =>
                    changeVisit(
                      v.id,
                      { status: "completed" },
                      "Visit completed by Dr. Meera Sharma",
                    )
                  }
                >
                  {t("Complete visit")}
                </Btn>
              )}
            </div>
          </div>
          <ReportList visitId={v.id} />
          <details>
            <summary>Activity & priority audit</summary>
            <ol className="timeline">
              {v.activity.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </details>
        </>
      );
    }
    if (modal.type === "finalize" && v)
      return (
        <>
          <p>
            Finalize this fictional clinician summary? The signed version will
            be preserved. Later changes create an amendment.
          </p>
          <pre className="summary-text">{note}</pre>
          <p>
            Priority: {priority} · {priorityReason || "Unchanged"}
          </p>
          <Btn
            onClick={() => {
              changeVisit(
                v.id,
                {
                  approved: note,
                  followup,
                  priority,
                  versions: v.approved
                    ? [...(v.versions || []), v.approved]
                    : v.versions,
                },
                `Summary signed by Dr. Meera Sharma · ${new Date().toISOString()}${priorityReason ? " · Priority reason: " + priorityReason : ""}`,
              );
              open("review", v.id);
              notify("Clinician-reviewed version saved");
            }}
          >
            Confirm finalization
          </Btn>
        </>
      );
    if (modal.type === "cancel" && v)
      return (
        <>
          <p>
            Cancel the appointment with {doctorFor(v.doctorId).name} on{" "}
            {date(v.date)}?
          </p>
          <Btn
            onClick={() => {
              changeVisit(
                v.id,
                { status: "cancelled" },
                "Appointment cancelled by patient",
              );
              setModal(null);
            }}
          >
            Confirm cancellation
          </Btn>
        </>
      );
    if (modal.type === "reset")
      return (
        <>
          <p>
            Reset all fictional records, appointments, and uploads in this
            browser? This cannot be undone.
          </p>
          <Btn
            onClick={() => {
              setS(seed());
              setModal(null);
              notify("Fictional records reset");
            }}
          >
            Reset records
          </Btn>
        </>
      );
    return <p>This record is unavailable in the current care scope.</p>;
  }
  function ReportList({ visitId }: { visitId: string }) {
    const reports = s.reports.filter((r) => r.visitId === visitId);
    return (
      <div className="report-list">
        {reports.length ? (
          reports.map((r) => (
            <button key={r.id} onClick={() => open("report", r.id)}>
              <span className="step-icon blue">
                <FileText size={19} />
              </span>
              <span className="grow">
                <strong>{r.name}</strong>
                <small>
                  {date(r.date)} ·{" "}
                  {r.verified
                    ? "Clinician verified"
                    : r.fixture
                      ? "Simulated OCR · review needed"
                      : "Extraction unavailable"}
                </small>
              </span>
              <ChevronRight size={17} />
            </button>
          ))
        ) : (
          <p className="fine">No reports linked to this visit.</p>
        )}
      </div>
    );
  }
  const modalTitle: Record<string, string> = {
    measure: "Body measurements",
    book: "Book appointment",
    reschedule: "Reschedule",
    visit: "Visit details",
    review: "Patient review",
    refer: "Refer case",
    emergency: "Emergency help",
    upload: "Upload report",
    profile: "Doctor profile",
    report: "Reports & OCR",
    help: "Need assistance?",
    chat: "Care chat",
    notifications: "Notifications",
    finalize: "Confirm clinical review",
    cancel: "Cancel appointment",
    reset: "Reset records",
    "phone-access": "Continue on your phone",
  };
  if (!ready)
    return (
      <div className="app-loading">
        <HeartPulse size={34} />
        <p>CareSetu</p>
      </div>
    );
  if (ready && landingVisible && !auth)
    return (
      <Landing
        onPatient={openPatient}
        onDoctor={openDoctor}
        onRegister={openRegister}
        onEmergency={openEmergencyFromLanding}
      />
    );
  if (ready && registrationMode)
    return (
      <RegistrationScreen
        onBack={() => {
          setRegistrationMode(false);
          setLandingVisible(true);
          history.replaceState({}, "", "/");
        }}
        onComplete={finishRegister}
      />
    );
  if (ready && mobileAccessRoute) {
    const accessToken = getPhoneAccessToken(mobileAccessTokenId);
    const valid = accessToken?.status === "ACTIVE";
    return (
      <main className="phone-access-landing">
        <section className="card">
          <div className="phone-access-brand"><HeartPulse size={25} /><strong>CareSetu</strong></div>
          <Badge tone="sand">{t("Demo Mode")}</Badge>
          {valid ? (
            <>
              <h1>{t("Continue securely on this device")}</h1>
              <p>This temporary CareSetu link has been validated in this demo browser session.</p>
              <Btn onClick={continueMobileAccess}>{t("Continue")}</Btn>
              <p className="fine">Demo mobile session · No medical information is included in this link.</p>
            </>
          ) : (
            <>
              <h1>{t("Invalid or expired link")}</h1>
              <p>This link is invalid, expired, revoked, or unavailable in this browser’s demo storage.</p>
              <Btn secondary onClick={() => { setMobileAccessRoute(false); history.replaceState({}, "", "/"); setLandingVisible(true); }}>
                {t("Return to CareSetu")}
              </Btn>
              <p className="fine">Demo validation is local only. Production validation must happen on the CareSetu server.</p>
            </>
          )}
        </section>
      </main>
    );
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {auth ? (
        <main className="auth-page">
          <div className="auth-brand">
            <div className="brand-mark">
              <HeartPulse size={25} />
            </div>
            <strong>
              CareSetu<span>Your story. Better care.</span>
            </strong>
          </div>
          <section className="card auth-card">
            <Badge tone="sand">Fictional patient data</Badge>
            <div className="question-icon">
              {isDoctor ? <Stethoscope /> : <Heart />}
            </div>
            <h1>{t(isDoctor ? "Doctor portal" : "Patient portal")}</h1>
            <p>
              {isDoctor
                ? "Choose a provisioned clinician to continue."
                : "Explore your care journey as a fictional patient. No phone number is required."}
            </p>
            {isDoctor && (
              <label className="field">
                <span>Clinician</span>
                <select
                  value={selectedDoctorId()}
                  onChange={(e) =>
                    sessionStorage.setItem("medi-doctor", e.target.value)
                  }
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.department}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!isDoctor && (
              <label className="field">
                <span>Patient</span>
                <select
                  value={s.selectedPatient}
                  onChange={(e) =>
                    setS((prev) => ({
                      ...prev,
                      selectedPatient: e.target.value,
                    }))
                  }
                >
                  {patientList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Btn
              onClick={() => {
                sessionStorage.setItem("medi-role", role);
                if (isDoctor)
                  sessionStorage.setItem("medi-doctor", selectedDoctorId());
                setAuth(false);
                go("Overview");
              }}
            >
              Enter {isDoctor ? "doctor" : "patient"} portal{" "}
              <ArrowRight size={17} />
            </Btn>
            <p className="fine">
              Connected sign-in is unavailable. CareSetu does not authenticate
              patients or clinicians yet.
            </p>
            <button
              className="text-button"
              onClick={() => {
                const next = isDoctor ? "patient" : "doctor";
                setRole(next);
                history.replaceState({}, "", `/auth/${next}`);
              }}
            >
              Open {isDoctor ? "patient" : "doctor"} sign-in{" "}
              <ArrowRight size={14} />
            </button>
          </section>
          <button
            className="text-button emergency-text"
            onClick={() => open("emergency")}
          >
            <Phone size={17} />
            {t("Emergency help")}
          </button>
        </main>
      ) : (
        <SidebarProvider
          className={`app-shell ${mobile ? "mobile-open" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
        >
          <Sidebar collapsible="none" className="app-sidebar">
            <SidebarHeader>
              <button
                type="button"
                aria-label="Return to CareSetu landing page"
                className="brand"
                onClick={() => {
                  setLandingVisible(true);
                  setAuth(false);
                  setMobile(false);
                  history.replaceState({}, "", "/");
                }}
              >
                <div className="brand-mark">
                  <HeartPulse size={24} />
                </div>
                <strong>
                  CareSetu<span>YOUR STORY. BETTER CARE.</span>
                </strong>
              </button>
              <div className="portal-label">
                {t(isDoctor ? "Doctor portal" : "Patient portal")}
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {nav.map((n, i) => {
                  const Icon = navIcons[i] || Home;
                  return (
                    <SidebarMenuItem key={n}>
                      <SidebarMenuButton
                        isActive={page === n}
                        onClick={() => go(n)}
                        className="nav-button"
                      >
                        <Icon size={19} />
                        <span>{t(n)}</span>
                        {n === "AI Case-Taking" && (
                          <span className="nav-new">AI</span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
              <div className="sidebar-callout">
                <div className="step-icon">
                  <ShieldCheck size={22} />
                </div>
                <strong>
                  A little prepared.
                  <br />A lot more heard.
                </strong>
                <p>Your story. Better care.</p>
              </div>
            </SidebarContent>
            <SidebarFooter>
              <button
                className="emergency-button"
                onClick={() => open("emergency")}
              >
                <Phone size={17} />
                {t("Emergency help")}
                <ArrowUpRight size={15} />
              </button>
              <div className="sidebar-account">
                <div className="avatar tiny mint">
                  {isDoctor
                    ? doctorFor(selectedDoctorId()).initials
                    : patient.initials}
                </div>
                <div className="grow">
                  <strong>
                    {isDoctor
                      ? doctorFor(selectedDoctorId()).name
                      : patient.name}
                  </strong>
                  <span>
                    {isDoctor
                      ? "General Medicine · " + room(selectedDoctorId())
                      : "Patient · " + (patient.patientCode || `CS-${String(patientList.indexOf(patient) + 1).padStart(3, "0")}`)}
                  </span>
                </div>
                <button
                  aria-label={t("Sign out")}
                  onClick={() => {
                    sessionStorage.removeItem("medi-role");
                    setAuth(true);
                    history.replaceState({}, "", `/auth/${role}`);
                  }}
                >
                  <LogOut size={17} />
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="app-main">
            <header className="topbar">
              <button
                className="icon-button mobile-menu sidebar-toggle"
                onClick={() => {
                  setMobile(!mobile);
                  setSidebarCollapsed(!sidebarCollapsed);
                }}
                aria-label="Navigation"
              >
                <Menu size={21} />
              </button>
              <div className="breadcrumb">
                {t(isDoctor ? "Doctor portal" : "Patient portal")}
                <ChevronRight size={13} />
                <strong>{t(page)}</strong>
              </div>
              <div className="top-controls">
                <span className="demo-label">
                  {t("Fictional patient data")}
                </span>
                <label className="language-control">
                  <Languages size={16} />
                  <select
                    aria-label={t("Language")}
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Lang)}
                  >
                    {Object.entries(languageNames).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="icon-button"
                  aria-label="Open messages"
                  title="Messages"
                  onClick={() => go("Messages")}
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label={t("Theme")}
                  title={`Theme: ${theme}`}
                  onClick={() =>
                    setTheme(
                      theme === "dark"
                        ? "light"
                        : theme === "light"
                          ? "system"
                          : "dark",
                    )
                  }
                >
                  <Sun size={19} />
                </button>
                <NotificationPanel
                  open={notificationOpen}
                  setOpen={setNotificationOpen}
                  items={userNotifications}
                  language={lang}
                  translate={t}
                  onOpen={openNotificationTarget}
                  onRead={markNotificationRead}
                  onReadAll={() =>
                    markAllNotificationsRead(
                      notificationRole,
                      notificationRecipientId,
                    )
                  }
                  onDismiss={dismissNotification}
                />
                <div className="avatar tiny mint">
                  {isDoctor
                    ? doctorFor(selectedDoctorId()).initials
                    : patient.initials}
                </div>
              </div>
            </header>
            {!online && (
              <div className="offline-banner">
                Offline · fictional changes stay on this device. No staff
                notifications are sent.
              </div>
            )}
            <main id="main" className="content">
              {page === "Overview" ? (
                isDoctor ? (
                  Queue()
                ) : (
                  PatientOverview()
                )
              ) : page === "AI Case-Taking" ? (
                Intake()
              ) : page === "Find a Doctor" ? (
                Directory()
              ) : page === "Messages" ? (
                CareChat()
              ) : ["My Visits", "Appointments"].includes(page) ? (
                VisitList()
              ) : page === "My Health" ? (
                <>
                  <PageHeading
                    title="My Health"
                    subtitle="Dated measurements and reports, without the guesswork."
                  />
                  <div className="health-layout">
                    {HealthTracker()}
                    {HealthChart()}
                    {Measurements()}
                  </div>
                  <section className="card">
                    <h2>Medicines & allergies</h2>
                    <p>Medicines · {answers.medicines || "Not confirmed"}</p>
                    <p>Allergies · {answers.allergies || "Not known"}</p>
                    <p className="fine">
                      Patient-reported. No prescription has been generated.
                    </p>
                    <Btn
                      secondary
                      onClick={() => {
                        moveStep(4);
                        go("AI Case-Taking");
                      }}
                    >
                      Update patient history
                    </Btn>
                  </section>
                </>
              ) : page === "Health Records" ? (
                <HealthRecordsPage
                  patient={patient}
                  visits={visits}
                  reports={ownReports}
                  translate={t}
                  formatDate={date}
                  onOpenReport={(id) => open("report", id)}
                />
              ) : page === "Settings" ? (
                SettingsPage()
              ) : page === "Patient Queue" ? (
                Queue()
              ) : page === "Authorized Patients" ? (
                <>
                  <PageHeading
                    title={page}
                    subtitle="Fictional patients assigned to your General Medicine care scope."
                  />
                  <section className="card">
                    {s.visits
                      .filter(
                        (v) =>
                          v.doctorId === selectedDoctorId() &&
                          v.status !== "completed",
                      )
                      .map((v) => (
                        <VisitRow key={v.id} v={v} />
                      ))}
                  </section>
                </>
              ) : page === "Schedule & Room" ? (
                <>
                  <PageHeading
                    title={page}
                    subtitle="Changes appear on linked appointments and patient destinations."
                  />
                  <section className="card">
                    <h2>Dr. Meera Sharma · General Medicine</h2>
                    <p>Monday–Saturday · 09:00–16:00 IST · Floor 2</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = String(
                          new FormData(e.currentTarget).get("room"),
                        );
                        const affected = s.visits.filter(
                          (v) =>
                            v.doctorId === selectedDoctorId() &&
                            !["completed", "cancelled"].includes(v.status),
                        );
                        setS((prev) => ({
                          ...prev,
                          rooms: { ...prev.rooms, meera: value },
                          notifications: [
                            `Dr. Meera Sharma’s room changed to ${value}`,
                            ...prev.notifications,
                          ],
                          visits: prev.visits.map((v) =>
                            v.doctorId === selectedDoctorId() &&
                            !["completed", "cancelled"].includes(v.status)
                              ? {
                                  ...v,
                                  activity: [
                                    ...v.activity,
                                    `Room updated to ${value}`,
                                  ],
                                }
                              : v,
                          ),
                        }));
                        affected.forEach((v) => {
                          invalidateNotificationEvents(
                            "patient",
                            v.patientId,
                            v.id,
                            ["due-"],
                          );
                          invalidateNotificationEvents(
                            "doctor",
                            v.doctorId,
                            v.id,
                            ["due-"],
                          );
                          emitNotification("patient", v.patientId, {
                            type: "schedule-room",
                            title: "Appointment room changed",
                            message: `Your appointment with Dr. Meera Sharma will be in room ${value}.`,
                            entityType: "schedule",
                            entityId: v.id,
                            eventKey: `patient-room-${v.id}-${value}`,
                          });
                        });
                        emitNotification("doctor", selectedDoctorId(), {
                          type: "schedule-room",
                          title: "Room schedule updated",
                          message: `Your active appointments now show room ${value}.`,
                          entityType: "schedule",
                          eventKey: `doctor-room-${selectedDoctorId()}-${value}`,
                        });
                        notify("Room updated for linked appointments");
                      }}
                    >
                      <label className="field">
                        <span>{t("Room")}</span>
                        <input
                          name="room"
                          defaultValue={room(selectedDoctorId())}
                          required
                          maxLength={12}
                        />
                      </label>
                      <button className="button" type="submit">
                        {t("Save")}
                      </button>
                    </form>
                  </section>
                </>
              ) : null}
              <footer className="page-footer">
                <span>
                  <HeartPulse size={14} />
                  CareSetu <span className="footer-dot">·</span> Your story.
                  Better care.
                </span>
                <span>
                  SIH26047 <span className="footer-dot">·</span> Fictional
                  hospital workspace
                </span>
              </footer>
            </main>
          </div>
        </SidebarProvider>
      )}
      <CareAssistant
        onOpenCase={() => go("AI Case-Taking")}
        onFillCase={(text) => {
          setS((previous) => ({
            ...previous,
            answers: {
              ...previous.answers,
              [patient.id]: {
                ...previous.answers[patient.id],
                complaint: text,
              },
            },
            intakeStep: { ...previous.intakeStep, [patient.id]: 1 },
          }));
          notify("Your symptom details were added to AI Case-Taking.");
        }}
        onAttachFile={(file) => {
          if (
            !["application/pdf", "image/png", "image/jpeg"].includes(
              file.type,
            ) || file.size > 2 * 1024 * 1024
          ) {
            notify("Attach a PDF, JPEG, or PNG under 2 MB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            setS((previous) => {
              const existingVisit = previous.visits.find(
                (visit) =>
                  visit.patientId === patient.id &&
                  !["completed", "cancelled"].includes(visit.status),
              );
              const visitId = existingVisit?.id || uid();
              const newVisit: Visit | null = existingVisit
                ? null
                : {
                    id: visitId,
                    patientId: patient.id,
                    doctorId: "meera",
                    date: day(),
                    time: "",
                    reason: previous.answers[patient.id]?.complaint || "Shared report",
                    status: "requested",
                    priority: "Unassessed",
                    provisional: "Unassessed",
                    activity: ["Report attached through CareSetu Assistant"],
                  };
              return {
                ...previous,
                visits: newVisit ? [...previous.visits, newVisit] : previous.visits,
                reports: [
                  ...previous.reports,
                  {
                    id: uid(),
                    visitId,
                    name: file.name,
                    date: day(),
                    type: file.type,
                    data: String(reader.result),
                  },
                ],
              };
            });
            notify("Report attached to your case. Review it with your clinician.");
          };
          reader.readAsDataURL(file);
        }}
      />
      <Dialog
        open={!!modal}
        onOpenChange={(value) => {
          if (!value) {
            setModal(null);
            setError("");
          }
        }}
      >
        <DialogContent
          className={`medi-dialog ${["visit", "review", "report"].includes(modal?.type || "") ? "wide-dialog" : ""}`}
        >
          <DialogTitle>
            {t(modalTitle[modal?.type || ""] || "Details")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            CareSetu workspace
          </DialogDescription>
          {ModalBody()}
        </DialogContent>
      </Dialog>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
