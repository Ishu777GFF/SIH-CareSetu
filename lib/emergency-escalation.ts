export const emergencyTriggerLabels={
  severe_breathing:'Severe breathing difficulty',
  chest_pain:'Chest pain or pressure',
  collapse:'Collapse or fainting',
  severe_bleeding:'Severe bleeding',
  severe_allergy:'Severe allergic reaction',
  stroke_warning:'Stroke warning signs',
  self_harm:'Self-harm language or risk'
} as const;

export type EmergencyTrigger=keyof typeof emergencyTriggerLabels;
export type EmergencyMatch={trigger:EmergencyTrigger;label:string;matchedText:string};

const triggerPatterns:Array<[EmergencyTrigger,RegExp]>=[
  ['self_harm',/\b(suicid(?:e|al)|kill myself|harm myself|hurt myself|end my life|don'?t want to live|do not want to live)\b/i],
  ['stroke_warning',/\b(face (?:is )?droop(?:ing)?|slurred speech|speech (?:is )?slurred|one[- ]sided weakness|weakness on one side|sudden facial weakness|sudden trouble speaking)\b/i],
  ['severe_allergy',/\b(anaphylaxis|severe allergic reaction|tongue (?:is )?swelling|throat (?:is )?swelling|lips? (?:are )?swelling|face (?:is )?swelling)\b/i],
  ['severe_bleeding',/\b(severe bleeding|bleeding heavily|heavy bleeding|won'?t stop bleeding|vomit(?:ing)? blood|cough(?:ing)? blood|black (?:tarry )?stool)\b/i],
  ['collapse',/\b(collaps(?:e|ed|ing)|faint(?:ed|ing)?|passed out|unconscious|lost consciousness)\b/i],
  ['chest_pain',/\b(chest pain|chest pressure|pressure in (?:my|the) chest|tightness in (?:my|the) chest|crushing chest)\b/i],
  ['severe_breathing',/\b(severe (?:breathing difficulty|breathlessness|shortness of breath)|can'?t breathe|cannot breathe|struggling to breathe|difficulty breathing at rest|unable to breathe)\b/i]
];

export function detectEmergency(text:string):EmergencyMatch|null{
  const normalized=text.trim();
  if(!normalized)return null;
  for(const [trigger,pattern] of triggerPatterns){
    if(pattern.test(normalized))return {trigger,label:emergencyTriggerLabels[trigger],matchedText:normalized};
  }
  return null;
}

export function evaluateCaseTakingAnswer(text:string,currentStep:number){
  const emergency=detectEmergency(text);
  return emergency?{emergency,blocked:true,nextStep:currentStep}:{emergency:null,blocked:false,nextStep:currentStep+1};
}

export const emergencyKey=(patientId:string)=>`emergency-${patientId}`;
