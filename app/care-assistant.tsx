'use client';

import {FormEvent,useEffect,useRef,useState} from 'react';
import {Bot,Mic,MicOff,Paperclip,Send,Speaker,Square,X} from 'lucide-react';

type ChatMessage={id:number;role:'assistant'|'user';text:string};

declare global{
  interface Window{
    SpeechRecognition?:new()=>SpeechRecognitionLike;
    webkitSpeechRecognition?:new()=>SpeechRecognitionLike;
  }
}

type SpeechRecognitionLike={
  lang:string;
  interimResults:boolean;
  continuous:boolean;
  start:()=>void;
  stop:()=>void;
  onresult:((event:{results:ArrayLike<{0:{transcript:string}}>} )=>void)|null;
  onend:(()=>void)|null;
  onerror:(()=>void)|null;
};

const welcome:ChatMessage={id:1,role:'assistant',text:'Hi, I’m the CareSetu assistant. I can help you use the portal, prepare for a visit, or understand what information to share with your doctor. I cannot diagnose or replace medical care.'};

function assistantReply(input:string){
  const value=input.toLowerCase();
  if(/chest pain|difficulty breathing|can.t breathe|faint|unconscious|severe bleeding|suicid|stroke/.test(value))return 'This may need urgent attention. Stop using the chat and contact local emergency services or hospital staff now. In India, call 112.';
  if(/appointment|book|doctor/.test(value))return 'Open “Find a Doctor” to review departments and book an appointment. If you already have an appointment, open “Appointments” to view or change it.';
  if(/report|document|upload|prescription/.test(value))return 'Open “AI Case-Taking” or your visit details, then choose “Upload report.” Use PDF, JPEG, or PNG files and review the information before submitting.';
  if(/medicine|medication|allerg/.test(value))return 'List medicine names and doses only if you know them. For allergies, include the reaction if possible. If you are unsure, choose “I don’t know” and tell your clinician.';
  if(/symptom|case|prepare|visit/.test(value))return 'Use “AI Case-Taking” to describe what is bothering you, when it started, how severe it feels, and any other symptoms. Your clinician will review the draft.';
  if(/hello|hi|hey/.test(value))return 'Hello! You can ask me how to book an appointment, prepare your case, upload a report, or use any part of CareSetu.';
  return 'I can help with CareSetu navigation, appointments, case preparation, reports, medicines, and allergies. For medical decisions or a diagnosis, please speak with a qualified clinician.';
}

type Props={onOpenCase?:()=>void;onAttachFile?:(file:File)=>void;onFillCase?:(text:string)=>void};
export default function CareAssistant({onOpenCase,onAttachFile,onFillCase}:Props){
  const [open,setOpen]=useState(false);
  const [messages,setMessages]=useState<ChatMessage[]>([welcome]);
  const [draft,setDraft]=useState('');
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [voiceSupported,setVoiceSupported]=useState(false);
  const recognition=useRef<SpeechRecognitionLike|null>(null);
  const endRef=useRef<HTMLDivElement|null>(null);

  useEffect(()=>{setVoiceSupported(Boolean(window.SpeechRecognition||window.webkitSpeechRecognition));return()=>{recognition.current?.stop();window.speechSynthesis?.cancel()}},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages,open]);

  function speak(text:string){
    if(!('speechSynthesis'in window))return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='en-IN';
    utterance.rate=.96;
    utterance.onstart=()=>setSpeaking(true);
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking(){window.speechSynthesis?.cancel();setSpeaking(false)}

  function send(text=draft){
    const clean=text.trim();
    if(!clean)return;
    const urgent=/chest pain|difficulty breathing|can.t breathe|faint|unconscious|severe bleeding|suicid|stroke/.test(clean.toLowerCase());
    if(!urgent&&/\b(i have|i am having|symptom|pain|fever|cough|headache|dard|bukhar)\b/i.test(clean)){onFillCase?.(clean);onOpenCase?.()}
    const reply=assistantReply(clean);
    setMessages(previous=>[...previous,{id:Date.now(),role:'user',text:clean},{id:Date.now()+1,role:'assistant',text:reply}]);
    setDraft('');
  }

  function submit(event:FormEvent){event.preventDefault();send()}

  function toggleListening(){
    if(listening){recognition.current?.stop();return}
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition)return;
    const next=new Recognition();
    recognition.current=next;
    next.lang='en-IN';next.interimResults=false;next.continuous=false;
    next.onresult=event=>{const transcript=event.results[0]?.[0]?.transcript||'';setDraft(transcript);send(transcript)};
    next.onend=()=>setListening(false);
    next.onerror=()=>setListening(false);
    setListening(true);next.start();
  }

  return <div className="care-assistant">
    {open&&<section className="assistant-panel" aria-label="CareSetu assistant">
      <header className="assistant-head"><div className="assistant-bot"><span><Bot size={19}/></span><div><strong>CareSetu Assistant</strong><small>Chat or talk</small></div></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close assistant"><X size={19}/></button></header>
      <div className="assistant-notice">For guidance only · not a diagnosis or emergency service</div>
      <div className="assistant-messages" aria-live="polite">{messages.map(message=><div key={message.id} className={`assistant-message ${message.role}`}><p>{message.text}</p>{message.role==='assistant'&&<button type="button" onClick={()=>speaking?stopSpeaking():speak(message.text)} aria-label={speaking?'Stop spoken reply':'Read reply aloud'}>{speaking?<Square size={13}/>:<Speaker size={14}/>}</button>}</div>)}<div ref={endRef}/></div>
      <div className="assistant-suggestions"><button onClick={()=>onOpenCase?.()}>Fill my case</button></div>
      <form className="assistant-compose" style={{gridTemplateColumns:'40px 1fr 40px 40px'}} onSubmit={submit}><button className={listening?'listening':''} type="button" onClick={toggleListening} disabled={!voiceSupported} aria-label={voiceSupported?(listening?'Stop listening':'Talk to the assistant'):'Voice input is not supported'}>{listening?<MicOff size={19}/>:<Mic size={19}/>}</button><input value={draft} onChange={event=>setDraft(event.target.value)} placeholder={listening?'Listening…':'Ask CareSetu…'} aria-label="Message CareSetu assistant"/><label aria-label="Attach a report to your case"><Paperclip size={18}/><input type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={event=>{const file=event.target.files?.[0];if(file)onAttachFile?.(file);event.currentTarget.value=''}}/></label><button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={18}/></button></form>
    </section>}
    <button className="assistant-launcher" type="button" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close CareSetu assistant':'Open CareSetu assistant'} aria-expanded={open}>{open?<X size={23}/>:<><Bot size={23}/><span>Ask CareSetu</span></>}</button>
  </div>;
}
