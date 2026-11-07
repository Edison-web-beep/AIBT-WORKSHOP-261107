import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../skills/aibt-workshop/scripts/workshop.mjs';

const config=()=>({version:2,lessons:[{id:'lesson-01',title:'练习一'}],groups:[{id:'group-03',members:['Student','peer'],representatives:['leader']},{id:'group-04',members:[],representatives:[]}]});

test('group numbers normalize without accepting traversal or zero',()=>{
  assert.equal(typeof policy.groupId,'function','missing group number validation');
  for(const value of [3,'03','group-03'])assert.equal(policy.groupId(value),'group-03');
  for(const value of [0,100,'../3','group-3/../4','3-r2',' 3'])assert.throws(()=>policy.groupId(value));
});
test('submission target uses exercise then group and checks the registered representative',()=>{
  assert.equal(typeof policy.submissionTarget,'function','missing group submission contract');
  const target=policy.submissionTarget(config(),{login:'student',lesson:1,group:3,kind:'individual'});
  assert.equal(target.prefix,'submissions/lesson-01/group-03/individual/student/');
  assert.equal(target.slug,'lesson-01/group-03/individual');
  assert.equal(target.title,'[练习01][第03组][个人] student');
  for(const options of [{login:'other',lesson:1,group:3,kind:'individual'},{login:'student',lesson:1,group:4,kind:'individual'},{login:'student',lesson:2,group:3,kind:'individual'}]){
    assert.throws(()=>policy.submissionTarget(config(),options),/成员|代表|登记|练习/);
  }
});
test('invalid and duplicated roster identifiers are rejected',()=>{
  assert.equal(typeof policy.validateConfig,'function','missing roster validation');
  assert.deepEqual(policy.validateConfig(config()).groups[0].members,['peer','student']);
  for(const bad of [{...config(),version:1},{...config(),groups:[...config().groups,{id:'group-03',members:['another'],representatives:[]}]},{...config(),groups:[{id:'group-00',members:['student'],representatives:[]}]},{...config(),lessons:[{id:'lesson-01',title:''}]}]){
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
  assert.deepEqual(result.groups[0].members,['peer','student']);
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
test('individual and team submissions have separate authorization and storage, including cross-group representatives',()=>{
  const c=config();c.groups.push({id:'group-05',members:['student'],representatives:['leader']});
  const personal=policy.submissionTarget(c,{login:'student',lesson:1,group:3,kind:'individual'});
  const team=policy.submissionTarget(c,{login:'leader',lesson:1,group:3,kind:'team'});
  assert.equal(personal.prefix,'submissions/lesson-01/group-03/individual/student/');
  assert.equal(team.prefix,'submissions/lesson-01/group-03/team/');
  assert.equal(policy.submissionTarget(c,{login:'leader',lesson:1,group:5,kind:'team'}).prefix,'submissions/lesson-01/group-05/team/');
  assert.equal(policy.submissionTarget(c,{login:'student',lesson:1,group:5,kind:'individual'}).prefix,'submissions/lesson-01/group-05/individual/student/');
  assert.throws(()=>policy.submissionTarget(c,{login:'student',lesson:1,group:3,kind:'team'}),/代表|授权/);
  assert.throws(()=>policy.submissionTarget(c,{login:'leader',lesson:1,group:3,kind:'individual'}),/成员|授权/);
  assert.throws(()=>policy.submissionTarget(c,{login:'student',lesson:1,group:3}),/类型/);
  c.groups[0].members.push('STUDENT');assert.throws(()=>policy.validateConfig(c),/重复/);
});
