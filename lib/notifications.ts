export type NotificationRole='patient'|'doctor';
export type NotificationEntity='appointment'|'visit'|'report'|'case'|'schedule'|'legacy';
export type CareNotification={id:string;recipientId:string;recipientRole:NotificationRole;type:string;title:string;message:string;createdAt:string;readAt?:string;dismissedAt?:string;entityType:NotificationEntity;entityId?:string;eventKey:string};
export type NewCareNotification=Omit<CareNotification,'id'|'createdAt'|'readAt'|'dismissedAt'> & {createdAt?:string};

export const notificationStorageKey=(role:NotificationRole,id:string)=>`caresetu-notifications-v4-${role}-${id}`;
const legacyStorageKey=(role:NotificationRole,id:string)=>`caresetu-notifications-v3-${role}-${id}`;
const createId=()=>typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function loadNotifications(role:NotificationRole,id:string):CareNotification[]{
  if(typeof window==='undefined')return [];
  const key=notificationStorageKey(role,id);
  try{
    const current=localStorage.getItem(key);
    if(current){const parsed=JSON.parse(current);return Array.isArray(parsed)?parsed:[]}
    const legacy=JSON.parse(localStorage.getItem(legacyStorageKey(role,id))||'[]');
    if(!Array.isArray(legacy)||!legacy.length)return [];
    const base=Date.now();
    const migrated:CareNotification[]=legacy.filter((value):value is string=>typeof value==='string').map((message,index)=>({id:createId(),recipientId:id,recipientRole:role,type:'legacy',title:'Earlier update',message,createdAt:new Date(base-index*60000).toISOString(),readAt:new Date().toISOString(),entityType:'legacy',eventKey:`legacy-${index}-${message.slice(0,32)}`}));
    localStorage.setItem(key,JSON.stringify(migrated));
    return migrated;
  }catch{return []}
}

const write=(role:NotificationRole,id:string,items:CareNotification[])=>{localStorage.setItem(notificationStorageKey(role,id),JSON.stringify(items.slice(0,100)));window.dispatchEvent(new CustomEvent('caresetu-notifications',{detail:{role,id}}))};

export function addNotification(input:NewCareNotification){
  if(typeof window==='undefined')return false;
  const items=loadNotifications(input.recipientRole,input.recipientId);
  if(items.some(item=>item.eventKey===input.eventKey&&!item.dismissedAt))return false;
  const next:CareNotification={...input,id:createId(),createdAt:input.createdAt||new Date().toISOString()};
  write(input.recipientRole,input.recipientId,[next,...items]);return true;
}

export function updateNotification(role:NotificationRole,id:string,notificationId:string,patch:Partial<Pick<CareNotification,'readAt'|'dismissedAt'>>){const items=loadNotifications(role,id).map(item=>item.id===notificationId?{...item,...patch}:item);write(role,id,items)}
export function markAllNotificationsRead(role:NotificationRole,id:string){const now=new Date().toISOString();const items=loadNotifications(role,id).map(item=>item.dismissedAt||item.readAt?item:{...item,readAt:now});write(role,id,items)}
export function invalidateNotificationEvents(role:NotificationRole,id:string,entityId:string,eventPrefixes:string[]){const now=new Date().toISOString();const items=loadNotifications(role,id).map(item=>item.entityId===entityId&&eventPrefixes.some(prefix=>item.eventKey.startsWith(prefix))?{...item,dismissedAt:item.dismissedAt||now}:item);write(role,id,items)}
