import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../skills/aibt-workshop/scripts/course.mjs';
import {checkPullRequest} from '../tools/check-submission.mjs';
import {buildOverview} from '../tools/build-overview.mjs';

const config={version:3,submissionMode:'self-reported',lessons:[{id:'lesson-02',title:'练习二'},{id:'lesson-01',title:'练习一'}]};
const prefix='submissions/lesson-01/group-03/team/';
const fixture=()=>({
  config:structuredClone(config),
  pr:{number:7,state:'open',draft:false,title:'[练习01][第03组][小组] student',user:{login:'student'},base:{ref:'main',repo:{full_name:policy.COURSE}},head:{ref:'aibt/student/lesson-01/group-03/team',repo:{full_name:'student/AIBT-WORKSHOP-261107'}},changed_files:2,labels:[]},
  files:[{filename:prefix+'README.md',status:'added'},{filename:prefix+'image.png',status:'added'}],
  tree:{truncated:false,tree:[{path:prefix+'README.md',type:'blob',mode:'100644',size:20},{path:prefix+'image.png',type:'blob',mode:'100644',size:68}]},
  openPulls:[]
});

test('submission checker accepts self-reported groups but still verifies actual author and source',()=>{
  assert.equal(typeof policy.validateSubmission,'function','missing PR validation');
  const result=policy.validateSubmission(fixture());
  assert.equal(result.kind,'submission');assert.equal(result.lesson,'lesson-01');assert.equal(result.group,'group-03');
  for(const change of [f=>{f.pr.user.login='other';},f=>{f.pr.base.ref='other';},f=>{f.pr.head.repo.full_name='other/AIBT-WORKSHOP-261107';},f=>{f.pr.head.ref='aibt/student/lesson-01';}]){
    const f=fixture();change(f);assert.throws(()=>policy.validateSubmission(f));
  }
});
test('submission checker blocks cross-group rename, deletion, hidden files, links and incomplete listings',()=>{
  assert.equal(typeof policy.validateSubmission,'function','missing PR validation');
  for(const change of [
    f=>{f.files[1].filename='submissions/lesson-01/group-04/image.png';},
    f=>{f.files[1].previous_filename='submissions/lesson-01/group-04/image.png';f.files[1].status='renamed';},
    f=>{f.files[1].status='removed';},
    f=>{f.tree.tree[1].mode='120000';},
    f=>{f.tree.tree[1].path=prefix+'.env';},
    f=>{f.tree.tree=f.tree.tree.slice(1);},
    f=>{f.tree.truncated=true;},
    f=>{f.pr.changed_files=3;},
    f=>{f.tree.tree[1].size=21*1024*1024;}
  ]){
    const f=fixture();change(f);assert.throws(()=>policy.validateSubmission(f));
  }
});
test('submission checker blocks another pending PR for the same exercise/group',()=>{
  assert.equal(typeof policy.validateSubmission,'function','missing duplicate check');
  const f=fixture();f.openPulls=[{number:8,state:'open',head:{ref:'aibt/previous/lesson-01/group-03/team'}}];
  assert.throws(()=>policy.validateSubmission(f),/重复|已有/);
  f.openPulls=[f.pr];assert.equal(policy.validateSubmission(f).kind,'submission');
});
test('only an explicit teacher-applied maintenance label exempts a maintenance PR',()=>{
  assert.equal(typeof policy.validateSubmission,'function','missing maintenance gate');
  const f=fixture();f.pr.head.ref='feat/group-submissions';f.files=[{filename:'course.json',status:'modified'}];f.pr.changed_files=1;
  assert.throws(()=>policy.validateSubmission(f));
  f.pr.labels=[{name:'course-maintenance'}];assert.equal(policy.validateSubmission(f).kind,'maintenance');
});
test('teacher-marked maintenance PRs never appear in homework or block duplicate checks',()=>{
  const f=fixture();f.pr.labels=[{name:'course-maintenance'}];
  assert.deepEqual(policy.matchingGroupPulls([f.pr],{lesson:'lesson-01',group:'group-03',kind:'team'}),[]);
  const overview=policy.renderOverview({config,tree:{truncated:false,tree:[]},prs:[f.pr]});
  assert.doesNotMatch(overview,/pull\/7/);assert.doesNotMatch(overview,/\| 待审/);
});
test('one group can show separate individual submissions and its shared team submission',()=>{
  const f=fixture();
  const personal={...f.pr,number:8,title:'[练习01][第03组][个人] student',head:{...f.pr.head,ref:'aibt/student/lesson-01/group-03/individual'}};
  const overview=policy.renderOverview({config,tree:f.tree,prs:[f.pr,personal]});
  assert.match(overview,/个人/);assert.match(overview,/小组/);assert.match(overview,/pull\/7/);assert.match(overview,/pull\/8/);
  assert.doesNotMatch(overview,/重复提交/);
});
test('individual PRs cannot modify another member, and another member pending does not block them',()=>{
  const f=fixture();f.pr.title='[练习01][第03组][个人] student';f.pr.head.ref='aibt/student/lesson-01/group-03/individual';
  f.files=f.files.map(file=>({...file,filename:file.filename.replace('/team/','/individual/student/')}));
  f.tree.tree=f.tree.tree.map(entry=>({...entry,path:entry.path.replace('/team/','/individual/student/')}));
  f.openPulls=[{number:8,state:'open',head:{ref:'aibt/peer/lesson-01/group-03/individual'}}];
  assert.equal(policy.validateSubmission(f).submissionKind,'individual');
  f.files[1].filename=f.files[1].filename.replace('/student/','/peer/');
  assert.throws(()=>policy.validateSubmission(f),/跨组|其他文件/);
});
test('connection tests stay draft and account-scoped',()=>{
  assert.equal(typeof policy.validateSubmission,'function','missing connection-test check');
  const f=fixture();f.config=config;f.pr.draft=true;f.pr.head.ref='aibt/student/connection-test';
  f.files=[{filename:'connection-tests/student/connection.md',status:'added'},{filename:'connection-tests/student/pixel.png',status:'added'}];
  f.tree.tree=f.tree.tree.map((entry,i)=>({...entry,path:f.files[i].filename}));
  assert.equal(policy.validateSubmission(f).kind,'connection-test');
  f.pr.head.ref='aibt/student/connection-test-r2';
  assert.equal(policy.validateSubmission(f).kind,'connection-test');
  f.tree.tree.pop();assert.throws(()=>policy.validateSubmission(f),/文字|PNG|两个/);f.tree.tree.push({path:'connection-tests/student/pixel.png',type:'blob',mode:'100644',size:68});
  f.pr.draft=false;assert.throws(()=>policy.validateSubmission(f),/草稿/);
});
test('PR runner pins the trusted base configuration and rejects a head changing mid-check',async()=>{
  const f=fixture();f.pr.head.sha='h1';f.pr.base.sha='b1';
  let prReads=0;
  const api=async endpoint=>{
    if(endpoint===`/repos/${policy.COURSE}/pulls/7`){prReads++;return structuredClone(f.pr);}
    if(endpoint===`/repos/${policy.COURSE}/contents/course.json?ref=b1`)return {encoding:'base64',content:Buffer.from(JSON.stringify(f.config)).toString('base64')};
    if(endpoint.endsWith('/pulls/7/files?per_page=100&page=1'))return f.files;
    if(endpoint==='/repos/student/AIBT-WORKSHOP-261107/git/trees/h1?recursive=1')return f.tree;
    if(endpoint.includes('/pulls?state=open'))return [];
    throw new Error('Unapproved API read: '+endpoint);
  };
  assert.equal((await checkPullRequest(api,7)).kind,'submission');assert.equal(prReads,2);
  prReads=0;
  await assert.rejects(checkPullRequest(async endpoint=>{
    const result=await api(endpoint);
    return endpoint.endsWith('/pulls/7')&&prReads===2?{...result,head:{...result.head,sha:'h2'}}:result;
  },7),/发生变化/);
});
test('overview runner pins config/tree to one main SHA and includes PRs after page one',async()=>{
  const f=fixture();
  const api=async endpoint=>{
    if(endpoint.endsWith('/git/ref/heads/main'))return {object:{sha:'main1'}};
    if(endpoint.endsWith('/contents/course.json?ref=main1'))return {encoding:'base64',content:Buffer.from(JSON.stringify(f.config)).toString('base64')};
    if(endpoint.endsWith('/git/trees/main1?recursive=1'))return f.tree;
    if(endpoint.endsWith('page=1'))return Array.from({length:100},(_,i)=>({number:i+100,state:'open',head:{ref:'maintenance'}}));
    if(endpoint.endsWith('page=2'))return [f.pr];
    throw new Error('Unexpected '+endpoint);
  };
  assert.match(await buildOverview(api),/pull\/7/);
});
test('overview discovers groups and accounts, sorts exercises and distinguishes pending updates',()=>{
  assert.equal(typeof policy.renderOverview,'function','missing submission overview');
  const f=fixture();
  f.tree.tree.push({path:'submissions/lesson-02/group-01/individual/new-student/README.md',type:'blob',mode:'100644',size:10});
  const markdown=policy.renderOverview({config,tree:f.tree,prs:[f.pr]});
  assert.ok(markdown.indexOf('lesson-01 | group-01')<markdown.indexOf('lesson-01 | group-03'));
  assert.ok(markdown.indexOf('lesson-01 | group-03')<markdown.indexOf('lesson-02 | group-01'));
  assert.doesNotMatch(markdown,/待登记/);assert.match(markdown,/@new-student/);assert.match(markdown,/待审.*已有版本/);assert.match(markdown,/pull\/7/);assert.match(markdown,/暂无提交/);assert.match(markdown,/无法判断全班谁还没交/);
  const merged=policy.renderOverview({config,tree:f.tree,prs:[]});assert.match(merged,/已合并/);
  const draft=policy.renderOverview({config,tree:{truncated:false,tree:[]},prs:[{...f.pr,draft:true}]});assert.match(draft,/草稿/);
  assert.throws(()=>policy.renderOverview({config,tree:{truncated:true,tree:[]},prs:[]}),/截断/);
});
test('overview escapes course titles and never treats arbitrary PR titles as submission identities',()=>{
  assert.equal(typeof policy.renderOverview,'function','missing safe overview');
  const f=fixture();f.config.lessons[0].title='<script> | test';f.pr.title='[练习01][第03组] forged';f.pr.head.ref='random-branch';
  const markdown=policy.renderOverview({config:f.config,tree:{truncated:false,tree:[]},prs:[f.pr]});
  assert.doesNotMatch(markdown,/<script>/);assert.doesNotMatch(markdown,/pull\/7/);assert.match(markdown,/&lt;script&gt;/);
});

test('overview discovers a new group solely from an open PR and keeps merged individuals without a roster',()=>{
  const f=fixture();
  f.pr.head.ref='aibt/student/lesson-01/group-08/team';f.pr.title='[练习01][第08组][小组] student';
  const tree={truncated:false,tree:[{path:'submissions/lesson-02/group-06/individual/alumni/README.md',type:'blob',mode:'100644',size:10}]};
  const markdown=policy.renderOverview({config,tree,prs:[f.pr]});
  assert.match(markdown,/lesson-01 \| group-08 \| 小组 \| @student \| 待审/);
  assert.match(markdown,/lesson-02 \| group-06 \| 个人 \| @alumni \| 已合并/);
  assert.doesNotMatch(markdown,/待登记|权限待核对/);
  const empty=policy.renderOverview({config,tree:{truncated:false,tree:[]},prs:[]});
  assert.match(empty,/尚无正式作品或打开的提交 PR/);
  assert.doesNotMatch(empty,/填写.*名单/);
});
