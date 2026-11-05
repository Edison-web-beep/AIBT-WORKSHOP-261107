import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {blobSha,collectFiles,lessonId,ensureFork,publish,COURSE,REPO_NAME} from '../skills/aibt-workshop/scripts/workshop.mjs';

function github(){
  const store={refs:new Map([['main','c0']]),commits:new Map([['c0',{tree:{sha:'t0'}}]]),trees:new Map([['t0',new Map()]]),blobs:new Map(),prs:[],calls:[],fork:null,counter:0};
  const treeFor=ref=>store.trees.get(store.commits.get(store.refs.get(ref)||ref)?.tree.sha||ref);
  const notFound=()=>{throw Object.assign(new Error('404'),{status:404});};
  const api=async(endpoint,method='GET',body)=>{
    store.calls.push({endpoint,method,body});
    if(endpoint===`/repos/${COURSE}/forks`&&method==='POST'){store.fork={fork:true,parent:{id:123},private:false};return store.fork;}
    if(endpoint===`/repos/student/${REPO_NAME}`)return store.fork??notFound();
    const tail=endpoint.replace(/^\/repos\/[^/]+\/[^/]+/,'');
    if(tail.startsWith('/compare/')){
      const branch=decodeURIComponent(tail.split('...')[1]).split(':').slice(1).join(':');
      const current=treeFor(branch),base=treeFor('main');
      return {files:[...current].filter(([p,sha])=>base.get(p)!==sha).map(([filename])=>({filename}))};
    }
    if(tail.startsWith('/pulls?')){
      const head=new URLSearchParams(tail.split('?')[1]).get('head');
      return store.prs.filter(p=>p.head.label===head);
    }
    if(tail.startsWith('/pulls/')&&method==='GET')return store.prs.find(p=>p.number===Number(tail.split('/').pop()));
    if(tail==='/pulls'&&method==='POST'){
      const branch=body.head.split(':').slice(1).join(':');
      const pr={number:store.prs.length+1,state:'open',draft:body.draft,title:body.title,base:{ref:body.base},head:{ref:branch,label:body.head,repo:{full_name:body.head.startsWith('f3484134:')?COURSE:'student/'+REPO_NAME}},html_url:'https://github.com/'+COURSE+'/pull/'+(store.prs.length+1)};
      store.prs.push(pr);return pr;
    }
    if(tail==='/git/refs'&&method==='POST'){
      const branch=body.ref.slice('refs/heads/'.length);store.refs.set(branch,body.sha);return {object:{sha:body.sha}};
    }
    if(tail.startsWith('/git/ref/heads/')){const sha=store.refs.get(tail.slice('/git/ref/heads/'.length));return sha?{object:{sha}}:notFound();}
    if(tail.startsWith('/git/refs/heads/')&&method==='PATCH'){
      assert.equal(body.force,false);store.refs.set(tail.slice('/git/refs/heads/'.length),body.sha);return {};
    }
    if(tail.startsWith('/git/commits/')&&method==='GET')return store.commits.get(tail.split('/').pop());
    if(tail==='/git/commits'&&method==='POST'){
      const sha='c'+(++store.counter);store.commits.set(sha,{tree:{sha:body.tree},parents:body.parents});return {sha};
    }
    if(tail.startsWith('/git/trees/')&&method==='GET'){
      const ref=tail.split('/').pop().split('?')[0];return {truncated:false,tree:[...treeFor(ref)].map(([path,sha])=>({path,sha,type:'blob'}))};
    }
    if(tail==='/git/trees'&&method==='POST'){
      const tree=new Map(store.trees.get(body.base_tree));for(const entry of body.tree)tree.set(entry.path,entry.sha);
      const sha='t'+(++store.counter);store.trees.set(sha,tree);return {sha};
    }
    if(tail==='/git/blobs'&&method==='POST'){
      assert.equal(body.encoding,'base64');const bytes=Buffer.from(body.content,'base64'),sha=blobSha(bytes);store.blobs.set(sha,bytes);return {sha};
    }
    throw new Error('Unmocked '+method+' '+endpoint);
  };
  return {api,store};
}
const context={login:'student',upstream:{id:123}};
const files=()=>[{path:'作品.md',bytes:Buffer.from('你好，AIBT！')},{path:'image.png',bytes:Buffer.from([137,80,78,71,0,255,1,2])}].map(f=>({...f,sha:blobSha(f.bytes)}));
const params=g=>({api:g.api,context,repo:'student/'+REPO_NAME,slug:'lesson-02',files:files()});

test('lesson numbers normalize and traversal is rejected',()=>{
  assert.equal(lessonId('2'),'lesson-02');assert.equal(lessonId('lesson-02'),'lesson-02');
  for(const value of ['../main','0','100','-1','2/../3'])assert.throws(()=>lessonId(value));
});
test('scanner preserves nested Unicode/binary; excludes settings and dependencies',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-test-'));
  try{
    await fs.mkdir(path.join(root,'圖'));await fs.mkdir(path.join(root,'node_modules'));await fs.mkdir(path.join(root,'.git'));
    await fs.writeFile(path.join(root,'圖','image.png'),Buffer.from([0,255,1]));await fs.writeFile(path.join(root,'README.md'),'作品');
    await fs.writeFile(path.join(root,'.env'),'TOKEN=hidden');await fs.writeFile(path.join(root,'secret.key'),'hidden');await fs.writeFile(path.join(root,'node_modules','a.js'),'no');
    const result=await collectFiles(root);assert.equal(result.files.length,2);assert.equal(result.skipped.length,4);assert.deepEqual(result.files.find(f=>f.path==='圖/image.png').bytes,Buffer.from([0,255,1]));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('scanner blocks a key inside an otherwise allowed text file',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-secret-'));
  try{await fs.writeFile(path.join(root,'README.md'),'example gh'+'p_'+'a'.repeat(30));await assert.rejects(collectFiles(root),/疑似金鑰/);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('fork initialization is idempotent and rejects unrelated repo',async()=>{
  const g=github();assert.equal(await ensureFork(context,g.api),'student/'+REPO_NAME);await ensureFork(context,g.api);
  assert.equal(g.store.calls.filter(c=>c.method==='POST').length,1);
  g.store.fork.parent.id=999;await assert.rejects(ensureFork(context,g.api),/不是本課程/);
});
test('binary upload is lossless and retry reuses PR without another commit',async()=>{
  const g=github(),result=await publish(params(g));assert.equal(result.filesVerified,2);assert.equal(result.draft,false);
  const png=files()[1];assert.deepEqual(g.store.blobs.get(png.sha),png.bytes);
  const commits=g.store.calls.filter(c=>c.endpoint.endsWith('/git/commits')&&c.method==='POST').length;
  const retry=await publish(params(g));assert.equal(retry.pr,result.pr);assert.equal(retry.changed,0);assert.equal(g.store.prs.length,1);
  assert.equal(g.store.calls.filter(c=>c.endpoint.endsWith('/git/commits')&&c.method==='POST').length,commits);
});
test('update retains previous remote files; a closed PR gets a fresh revision',async()=>{
  const g=github();await publish(params(g));
  const f={path:'new.md',bytes:Buffer.from('new')};f.sha=blobSha(f.bytes);
  await publish({...params(g),files:[f]});assert.equal(g.store.prs.length,1);assert.equal(g.store.blobs.has(files()[0].sha),true);
  g.store.prs[0].state='closed';const revision=await publish(params(g));assert.match(revision.branch,/-r2$/);assert.equal(g.store.prs.length,2);
});
test('unexpected branch changes are rejected before uploading',async()=>{
  const g=github();g.store.refs.set('aibt/student/lesson-02','bad');g.store.commits.set('bad',{tree:{sha:'bad-tree'}});g.store.trees.set('bad-tree',new Map([['lessons/README.md','foreign']]));
  await assert.rejects(publish(params(g)),/範圍以外/);assert.equal(g.store.blobs.size,0);assert.equal(g.store.prs.length,0);
});
test('concurrent branch updates never force or open a PR',async()=>{
  const g=github();let reads=0;
  const api=async(...args)=>{const [endpoint,method='GET']=args;if(method==='GET'&&endpoint.endsWith('/git/ref/heads/aibt/student/lesson-02')&&++reads===2)return {object:{sha:'someone-else'}};return g.api(...args);};
  await assert.rejects(publish({...params(g),api}),/同時被更新/);assert.equal(g.store.prs.length,0);assert.equal(g.store.calls.some(c=>c.method==='PATCH'),false);
});
test('owner requires explicit teacher test and test PR is draft',async()=>{
  const g=github(),owner={login:'f3484134',upstream:{id:123}};
  await assert.rejects(ensureFork(owner,g.api),/老師帳號/);
  assert.equal(await ensureFork(owner,g.api,{teacherTest:true}),COURSE);
  const result=await publish({api:g.api,context:owner,repo:COURSE,slug:'connection-test',files:files(),test:true});
  assert.equal(result.mode,'teacher-test');assert.equal(result.draft,true);
});
test('a bad remote blob hash fails without publishing a ref',async()=>{
  const g=github();const api=async(...args)=>args[0].endsWith('/git/blobs')?{sha:'wrong'}:g.api(...args);
  await assert.rejects(publish({...params(g),api}),/雜湊不符/);assert.equal(g.store.prs.length,0);assert.equal(g.store.calls.some(c=>c.method==='PATCH'),false);
});
