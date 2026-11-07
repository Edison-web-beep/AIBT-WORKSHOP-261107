import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../skills/aibt-workshop/scripts/workshop.mjs';

const config=()=>({version:3,submissionMode:'self-reported',lessons:[{id:'lesson-01',title:'练习一'}]});

test('group numbers normalize without accepting traversal or zero',()=>{
  assert.equal(typeof policy.groupId,'function','missing group number validation');
  for(const value of [3,'03','group-03'])assert.equal(policy.groupId(value),'group-03');
  for(const value of [0,100,'../3','group-3/../4','3-r2',' 3'])assert.throws(()=>policy.groupId(value));
});
test('students self-report a group without any account roster or pre-created group',()=>{
  const target=policy.submissionTarget(config(),{login:'new-student',lesson:1,group:8,kind:'individual'});
  assert.equal(target.prefix,'submissions/lesson-01/group-08/individual/new-student/');
  assert.equal(target.slug,'lesson-01/group-08/individual');
  assert.equal(target.title,'[练习01][第08组][个人] new-student');
  assert.equal(policy.submissionTarget(config(),{login:'new-student',lesson:1,group:99,kind:'team'}).prefix,'submissions/lesson-01/group-99/team/');
  for(const options of [{login:'student',lesson:2,group:3,kind:'individual'},{login:'student',lesson:1,group:100,kind:'team'},{login:'../other',lesson:1,group:3,kind:'individual'},{login:'student',lesson:1,group:3}]){
    assert.throws(()=>policy.submissionTarget(config(),options));
  }
});
test('self-report course configuration rejects old policy, invalid or duplicated exercises',()=>{
  assert.equal(policy.validateConfig(config()).submissionMode,'self-reported');
  for(const bad of [{...config(),version:2},{...config(),submissionMode:'roster'},{...config(),lessons:[...config().lessons,{id:'lesson-01',title:'重复'}]},{...config(),lessons:[{id:'lesson-00',title:'错误'}]},{...config(),lessons:[{id:'lesson-01',title:''}]}]){
    assert.throws(()=>policy.validateConfig(bad));
  }
});
test('branch parsing distinguishes group revisions from tests and old account branches',()=>{
  assert.equal(typeof policy.parseSubmissionBranch,'function','missing group branch parsing');
  assert.deepEqual(policy.parseSubmissionBranch('aibt/student/lesson-01/group-03/individual-r2'),{login:'student',lesson:'lesson-01',group:'group-03',kind:'individual',revision:2});
  for(const branch of ['aibt/student/lesson-01','aibt/student/connection-test','aibt/student/lesson-00/group-03/individual','aibt/student/lesson-01/group-03/individual-r0'])assert.equal(policy.parseSubmissionBranch(branch),null);
});
test('course configuration is fetched only from the teacher repository at the supplied trusted ref',async()=>{
  assert.equal(typeof policy.readCourseConfig,'function','missing trusted configuration read');
  const endpoints=[];
  const api=async endpoint=>{endpoints.push(endpoint);return {encoding:'base64',content:Buffer.from(JSON.stringify(config())).toString('base64')};};
  const result=await policy.readCourseConfig(api,'abc123');
  assert.equal(result.submissionMode,'self-reported');
  assert.deepEqual(endpoints,['/repos/f3484134/AIBT-WORKSHOP-261107/contents/course.json?ref=abc123']);
});
test('PR listing follows every page instead of losing later submissions',async()=>{
  assert.equal(typeof policy.listPullRequests,'function','missing paginated PR listing');
  const endpoints=[];
  const result=await policy.listPullRequests(async endpoint=>{
    endpoints.push(endpoint);
    return endpoint.endsWith('page=1')?Array.from({length:100},(_,i)=>({number:i+1})):[{number:101}];
  },'open');
  assert.equal(result.length,101);assert.equal(endpoints.length,2);
  assert.match(endpoints[1],/state=open.*page=2$/);
});
test('one student can submit personal and team work to different self-reported groups',()=>{
  const c=config();
  assert.equal(policy.submissionTarget(c,{login:'Student',lesson:1,group:3,kind:'individual'}).prefix,'submissions/lesson-01/group-03/individual/student/');
  assert.equal(policy.submissionTarget(c,{login:'student',lesson:1,group:3,kind:'team'}).prefix,'submissions/lesson-01/group-03/team/');
  assert.equal(policy.submissionTarget(c,{login:'student',lesson:1,group:8,kind:'team'}).prefix,'submissions/lesson-01/group-08/team/');
  assert.equal(policy.submissionTarget(c,{login:'student',lesson:1,group:8,kind:'individual'}).prefix,'submissions/lesson-01/group-08/individual/student/');
});
