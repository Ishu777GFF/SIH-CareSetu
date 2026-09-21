import test from 'node:test';
import assert from 'node:assert/strict';
import {addNotification,invalidateNotificationEvents,loadNotifications,markAllNotificationsRead,updateNotification} from '../lib/notifications.ts';

class MemoryStorage{private values=new Map<string,string>();getItem(key:string){return this.values.get(key)??null}setItem(key:string,value:string){this.values.set(key,value)}removeItem(key:string){this.values.delete(key)}clear(){this.values.clear()}}
(globalThis as any).localStorage=new MemoryStorage();
(globalThis as any).window=new EventTarget();
(globalThis as any).CustomEvent=class<T> extends Event{detail:T;constructor(type:string,init:{detail:T}){super(type);this.detail=init.detail}};

const base={recipientRole:'patient' as const,recipientId:'patient-a',type:'appointment-booked',title:'Appointment booked',message:'Booked for 10:30 IST.',entityType:'appointment' as const,entityId:'visit-a',eventKey:'booked-visit-a'};

test('deduplicates event keys and isolates recipients',()=>{assert.equal(addNotification(base),true);assert.equal(addNotification(base),false);addNotification({...base,recipientId:'patient-b',eventKey:'booked-visit-b'});assert.equal(loadNotifications('patient','patient-a').length,1);assert.equal(loadNotifications('patient','patient-b').length,1)});
test('individual and bulk read state persists',()=>{const first=loadNotifications('patient','patient-a')[0];updateNotification('patient','patient-a',first.id,{readAt:'2026-09-20T10:00:00.000Z'});assert.ok(loadNotifications('patient','patient-a')[0].readAt);addNotification({...base,eventKey:'second-event'});markAllNotificationsRead('patient','patient-a');assert.ok(loadNotifications('patient','patient-a').every(item=>item.readAt))});
test('stale due reminders can be invalidated without deleting appointments',()=>{addNotification({...base,type:'appointment-due',eventKey:'due-visit-a-2026-09-20-patient-patient-a'});invalidateNotificationEvents('patient','patient-a','visit-a',['due-']);const due=loadNotifications('patient','patient-a').find(item=>item.eventKey.startsWith('due-'));assert.ok(due?.dismissedAt)});
