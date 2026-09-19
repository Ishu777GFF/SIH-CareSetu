/** Production integration seams. No mock is reported as a connected provider. */
export type ProviderResult<T>={status:'ready';data:T}|{status:'unavailable';reason:string};
export interface IntakeProvider { draft(answers:Record<string,string>):Promise<ProviderResult<{text:string;sourceIds:string[]}>> }
export interface OCRProvider { extract(documentId:string):Promise<ProviderResult<{text:string;fields:unknown[]}>> }
export interface HospitalIdentityProvider { signIn(role:'patient'|'doctor'):Promise<ProviderResult<{userId:string}>> }
export interface EmergencyProvider { request(encounterId:string):Promise<ProviderResult<{acknowledgmentId:string}>> }
export const connectedOCR:OCRProvider={async extract(){return {status:'unavailable',reason:'No hospital-approved OCR provider configured.'}}};
export const connectedIdentity:HospitalIdentityProvider={async signIn(){return {status:'unavailable',reason:'Institutional authentication and server-enforced care permissions are not configured.'}}};
export const connectedEmergency:EmergencyProvider={async request(){return {status:'unavailable',reason:'No authorized dispatch integration. Contact emergency assistance directly.'}}};
export const connectedIntake:IntakeProvider={async draft(){return {status:'unavailable',reason:'No clinician-governed intake provider configured.'}}};
