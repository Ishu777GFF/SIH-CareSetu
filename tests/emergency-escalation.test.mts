import test from 'node:test';
import assert from 'node:assert/strict';
import {detectEmergency,emergencyKey,evaluateCaseTakingAnswer} from '../lib/emergency-escalation.ts';

const requiredTriggers=[
  ['severe_breathing','I am struggling to breathe at rest'],
  ['chest_pain','I have crushing chest pressure'],
  ['collapse','I fainted and passed out'],
  ['severe_bleeding','I am bleeding heavily and it will not stop'],
  ['severe_allergy','My tongue is swelling after an allergic reaction'],
  ['stroke_warning','My face is drooping and my speech is slurred'],
  ['self_harm','I want to harm myself']
] as const;

for(const [trigger,answer] of requiredTriggers){
  test(`${trigger} enters emergency state and stops case-taking`,()=>{
    const result=evaluateCaseTakingAnswer(answer,3);
    assert.equal(result.emergency?.trigger,trigger);
    assert.equal(result.blocked,true);
    assert.equal(result.nextStep,3);
  });
}

test('a routine answer may advance normally',()=>{
  const result=evaluateCaseTakingAnswer('Mild cough for two days',2);
  assert.equal(result.emergency,null);
  assert.equal(result.blocked,false);
  assert.equal(result.nextStep,3);
});

test('the same patient always uses one escalation key',()=>{
  assert.equal(emergencyKey('patient-42'),emergencyKey('patient-42'));
  assert.notEqual(emergencyKey('patient-42'),emergencyKey('patient-43'));
});

test('detector does not return a diagnosis',()=>{
  const result=detectEmergency('I have chest pain');
  assert.equal(result?.label,'Chest pain or pressure');
  assert.equal('diagnosis' in (result||{}),false);
});
