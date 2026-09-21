import {careCaseSeeds,type LabSeed} from './care-case-seeds';

export type Doctor={id:string;name:string;initials:string;department:string;specialization?:string;qualification:string;languages:string;phone?:string;email?:string;availableDays?:string[];availableFrom?:string;availableTo?:string;building?:string;room:string;floor:string;color:string;status?:'available'|'on-leave'|'offline'};
export const doctors:Doctor[]=[
{id:'meera',name:'Dr. Meera Sharma',initials:'MS',department:'General Medicine',specialization:'General Medicine',qualification:'MD · General Medicine',languages:'English, हिन्दी',phone:'+91 81111 10001',email:'meera@example.test',availableDays:['Monday','Tuesday','Wednesday','Thursday','Friday'],availableFrom:'09:00',availableTo:'13:00',building:'CareSetu Block A',room:'204',floor:'2',color:'mint',status:'available'},
{id:'arjun',name:'Dr. Arjun Desai',initials:'AD',department:'Cardiology',specialization:'Cardiology',qualification:'DM · Cardiology',languages:'English, मराठी',phone:'+91 81111 10002',email:'arjun@example.test',availableDays:['Monday','Wednesday','Friday'],availableFrom:'10:00',availableTo:'14:00',building:'CareSetu Block A',room:'302',floor:'3',color:'blue',status:'available'},
{id:'ananya',name:'Dr. Ananya Sen',initials:'AS',department:'Dermatology',specialization:'Dermatology',qualification:'MD · Dermatology',languages:'English, বাংলা',phone:'+91 81111 10003',email:'ananya@example.test',availableDays:['Tuesday','Thursday','Saturday'],availableFrom:'09:30',availableTo:'12:30',building:'CareSetu Block B',room:'108',floor:'1',color:'lavender',status:'available'},
{id:'vikram',name:'Dr. Vikram Rao',initials:'VR',department:'Orthopedics',specialization:'Orthopedics',qualification:'MS · Orthopedics',languages:'English, தமிழ்',phone:'+91 81111 10004',email:'vikram@example.test',availableDays:['Monday','Tuesday','Thursday','Friday'],availableFrom:'11:00',availableTo:'15:00',building:'CareSetu Block B',room:'206',floor:'2',color:'sand',status:'available'},
{id:'priya',name:'Dr. Priya Nair',initials:'PN',department:'Ayurveda',specialization:'Ayurveda',qualification:'MD · Ayurveda',languages:'English, हिन्दी, தமிழ்',phone:'+91 81111 10005',email:'priya@example.test',availableDays:['Monday','Wednesday','Saturday'],availableFrom:'09:00',availableTo:'12:00',building:'CareSetu Block C',room:'105',floor:'1',color:'mint',status:'available'},
{id:'kabir',name:'Dr. Kabir Ali',initials:'KA',department:'Emergency Medicine',specialization:'Emergency Medicine',qualification:'MD · Emergency Medicine',languages:'English, हिन्दी',phone:'+91 81111 10006',email:'kabir@example.test',availableDays:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],availableFrom:'00:00',availableTo:'23:59',building:'CareSetu Block E',room:'E01',floor:'Ground',color:'rose',status:'available'}];

export type Patient={id:string;name:string;age:number;initials:string;patientCode?:string;phone?:string;email?:string;preferredLanguage?:string;address?:string;emergencyContact?:{name:string;phone:string};abhaLinked?:boolean;allergiesStatus?:string;currentMedicines?:string;dateOfBirth?:string;gender?:string};
export const patients:Patient[]=careCaseSeeds.map(p=>({id:p.id,name:p.name,age:p.age,initials:p.initials,patientCode:p.code,phone:p.phone,email:p.email,preferredLanguage:p.language,address:p.address,emergencyContact:p.emergency,abhaLinked:false,allergiesStatus:p.allergies,currentMedicines:p.medicines}));
export type Observation={id:string;patientId:string;date:string;height:number;weight:number;source:string;systolic?:number;diastolic?:number;pulse?:number;temperature?:number;oxygen?:number};
export type LabResult=LabSeed;
export type Report={id:string;visitId:string;name:string;date:string;type:string;fixture?:boolean;data?:string;extracted?:string;verified?:boolean;category?:string;pages?:number;ocrConfidence?:number;labResults?:LabResult[]};
export type Visit={id:string;patientId:string;doctorId:string;date:string;time:string;reason:string;status:string;token?:string;priority:string;provisional:string;summary?:string;approved?:string;followup?:string;activity:string[];versions?:string[];safetyAlert?:string};
export type EmergencyEscalation={id:string;patientId:string;visitId:string;trigger:string;label:string;matchedText:string;createdAt:string;status:'active'|'acknowledged';demo:true};
export type CareMessageAttachment={name:string;type:string;size:number;data:string};
export type CareMessage={id:string;patientId:string;doctorId:string;sender:'patient'|'doctor';text:string;createdAt:string;attachment?:CareMessageAttachment};
export type State={observations:Observation[];visits:Visit[];reports:Report[];answers:Record<string,Record<string,string>>;intakeStep:Record<string,number>;rooms:Record<string,string>;notifications:string[];nextToken:number;selectedPatient:string;patients?:Patient[];emergencyEscalations?:Record<string,EmergencyEscalation>;careMessages?:CareMessage[]};
export const day=(offset=0)=>{const d=new Date();d.setDate(d.getDate()+offset);return d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})};
export const bmi=(height:number,weight:number)=>Number.isFinite(height)&&Number.isFinite(weight)&&height>0&&weight>0?weight/(height/100)**2:null;

export function seed():State{
  const observations=careCaseSeeds.flatMap((p,index)=>[
    {id:`${p.id}-baseline`,patientId:p.id,date:day(-45-index),height:p.vitals.height,weight:Number((p.vitals.weight+1.2).toFixed(1)),source:'Historical fictional record'},
    {id:`${p.id}-current`,patientId:p.id,date:day(p.visitOffset),height:p.vitals.height,weight:p.vitals.weight,systolic:p.vitals.systolic,diastolic:p.vitals.diastolic,pulse:p.vitals.pulse,temperature:p.vitals.temperature,oxygen:p.vitals.oxygen,source:'Fictional intake measurement'}
  ]);
  const visits:Visit[]=careCaseSeeds.map(p=>({id:`visit-${p.id}`,patientId:p.id,doctorId:p.doctorId,date:day(p.visitOffset),time:p.time,reason:p.reason,status:p.status,token:p.token,priority:p.priority,provisional:p.provisional,summary:p.summary,approved:p.status==='completed'?p.summary:undefined,followup:p.followup,activity:[`AI case-taking completed · ${p.priority}`,`${p.documents.length} document${p.documents.length===1?'':'s'} linked`,p.status==='completed'?'Clinician review completed':'Awaiting or undergoing clinician review']}));
  const reports:Report[]=careCaseSeeds.flatMap(p=>p.documents.map((d,index)=>({id:`report-${p.id}-${index+1}`,visitId:`visit-${p.id}`,name:d.name,date:day(-d.daysAgo),type:d.type,fixture:true,extracted:d.extracted,verified:d.verified,category:d.category,pages:d.pages,ocrConfidence:d.ocrConfidence,labResults:d.labs})));
  const answers=Object.fromEntries(careCaseSeeds.map(p=>[p.id,{...p.answers,allergies:p.allergies,medicines:p.medicines}]));
  const intakeStep=Object.fromEntries(careCaseSeeds.map(p=>[p.id,8]));
  return {selectedPatient:'ramesh',patients,observations,visits,reports,answers,intakeStep,rooms:{},notifications:['15 fictional patient cases loaded: 4 urgent, 5 moderate and 6 routine.','All OCR text and clinical data are synthetic test fixtures.'],nextToken:40,emergencyEscalations:{},careMessages:[]};
}
export const KEY='medikiosk-fictional-demo-v2';
export const doctorFor=(id:string)=>doctors.find(d=>d.id===id)!;
export const patientFor=(id:string)=>patients.find(p=>p.id===id)!;
export const makeSummary=(answers:Record<string,string>)=>Object.entries(answers).filter(([k,v])=>k!=='consent'&&v).map(([k,v])=>`${k}: ${v} [Source: intake answer · ${k}]`).join('\n\n');
export const uid=()=>typeof crypto.randomUUID==="function"?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16))).map(n=>n.toString(16).padStart(2,"0")).join("");
