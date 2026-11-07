import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {inflateSync} from 'node:zlib';
import {blobSha,collectFiles,lessonId,ensureFork,publish,testFiles,main,COURSE,REPO_NAME} from '../skills/aibt-workshop/scripts/workshop.mjs';

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
      const state=new URLSearchParams(tail.split('?')[1]).get('state');
      return store.prs.filter(p=>(!head||p.head.label===head)&&(state==='all'||p.state===state));
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
const config={version:2,lessons:[{id:'lesson-02',title:'练习二'}],groups:[{id:'group-03',representative:'student'},{id:'group-04',representative:'student'}]};
const files=()=>[{path:'README.md',bytes:Buffer.from('你好，AIBT！')},{path:'image.png',bytes:Buffer.from([137,80,78,71,0,255,1,2])}].map(f=>({...f,sha:blobSha(f.bytes)}));
const params=g=>({api:g.api,context,config,group:3,repo:'student/'+REPO_NAME,slug:'lesson-02',files:files()});

test('lesson numbers normalize and traversal is rejected',()=>{
  assert.equal(lessonId('2'),'lesson-02');assert.equal(lessonId('lesson-02'),'lesson-02');
  for(const value of ['../main','0','100','-1','2/../3'])assert.throws(()=>lessonId(value));
});
test('scanner preserves nested Unicode/binary; excludes settings and dependencies',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-test-'));
  try{
    await fs.mkdir(path.join(root,'图'));await fs.mkdir(path.join(root,'node_modules'));await fs.mkdir(path.join(root,'.git'));
    await fs.writeFile(path.join(root,'图','image.png'),Buffer.from([0,255,1]));await fs.writeFile(path.join(root,'README.md'),'作品');
    await fs.writeFile(path.join(root,'.env'),'TOKEN=hidden');await fs.writeFile(path.join(root,'secret.key'),'hidden');await fs.writeFile(path.join(root,'node_modules','a.js'),'no');
    const result=await collectFiles(root);assert.equal(result.files.length,2);assert.equal(result.skipped.length,4);assert.deepEqual(result.files.find(f=>f.path==='图/image.png').bytes,Buffer.from([0,255,1]));
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('scanner blocks a key inside an otherwise allowed text file',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-secret-'));
  try{await fs.writeFile(path.join(root,'README.md'),'example gh'+'p_'+'a'.repeat(30));await assert.rejects(collectFiles(root),/疑似密钥/);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('fork initialization is idempotent and rejects unrelated repo',async()=>{
  const g=github();assert.equal(await ensureFork(context,g.api),'student/'+REPO_NAME);await ensureFork(context,g.api);
  assert.equal(g.store.calls.filter(c=>c.method==='POST').length,1);
  g.store.fork.parent.id=999;await assert.rejects(ensureFork(context,g.api),/不是本课程/);
});
test('binary upload is lossless and retry reuses PR without another commit',async()=>{
  const g=github(),result=await publish(params(g));assert.equal(result.filesVerified,2);assert.equal(result.draft,false);
  const png=files()[1];assert.deepEqual(g.store.blobs.get(png.sha),png.bytes);
  assert.equal(result.group,'group-03');assert.equal(result.lesson,'lesson-02');
  assert.equal(result.branch,'aibt/student/lesson-02/group-03');
  assert.match(result.folder,/submissions\/lesson-02\/group-03\/$/);
  assert.equal(g.store.prs[0].title,'[练习02][第03组] student');
  const commits=g.store.calls.filter(c=>c.endpoint.endsWith('/git/commits')&&c.method==='POST').length;
  const retry=await publish(params(g));assert.equal(retry.pr,result.pr);assert.equal(retry.changed,0);assert.equal(g.store.prs.length,1);
  assert.equal(g.store.calls.filter(c=>c.endpoint.endsWith('/git/commits')&&c.method==='POST').length,commits);
});
test('update retains previous remote files; a closed PR gets a fresh revision',async()=>{
  const g=github();await publish(params(g));
  const f={path:'new.md',bytes:Buffer.from('new')};f.sha=blobSha(f.bytes);
  const updated=await publish({...params(g),files:[files()[0],f]});assert.equal(g.store.prs.length,1);
  const updatedTree=g.store.trees.get(g.store.commits.get(g.store.refs.get(updated.branch)).tree.sha);
  assert.equal(updatedTree.size,3);assert.equal(updatedTree.get('submissions/lesson-02/group-03/README.md'),files()[0].sha);
  g.store.prs[0].state='closed';const revision=await publish(params(g));assert.match(revision.branch,/-r2$/);assert.equal(g.store.prs.length,2);
});
test('unexpected branch changes are rejected before uploading',async()=>{
  const g=github();g.store.refs.set('aibt/student/lesson-02/group-03','bad');g.store.commits.set('bad',{tree:{sha:'bad-tree'}});g.store.trees.set('bad-tree',new Map([['lessons/README.md','foreign']]));
  await assert.rejects(publish(params(g)),/范围以外/);assert.equal(g.store.blobs.size,0);assert.equal(g.store.prs.length,0);
});
test('concurrent branch updates never force or open a PR',async()=>{
  const g=github();let reads=0;
  const api=async(...args)=>{const [endpoint,method='GET']=args;if(method==='GET'&&endpoint.endsWith('/git/ref/heads/aibt/student/lesson-02/group-03')&&++reads===2)return {object:{sha:'someone-else'}};return g.api(...args);};
  await assert.rejects(publish({...params(g),api}),/同时被更新/);assert.equal(g.store.prs.length,0);assert.equal(g.store.calls.some(c=>c.method==='PATCH'),false);
});
test('owner requires explicit teacher test and test PR is draft',async()=>{
  const g=github(),owner={login:'f3484134',upstream:{id:123}};
  await assert.rejects(ensureFork(owner,g.api),/老师账号/);
  assert.equal(await ensureFork(owner,g.api,{teacherTest:true}),COURSE);
  const result=await publish({api:g.api,context:owner,repo:COURSE,slug:'connection-test',files:files(),test:true});
  assert.equal(result.mode,'teacher-test');assert.equal(result.draft,true);
});
test('a bad remote blob hash fails without publishing a ref',async()=>{
  const g=github();const api=async(...args)=>args[0].endsWith('/git/blobs')?{sha:'wrong'}:g.api(...args);
  await assert.rejects(publish({...params(g),api}),/哈希不符/);assert.equal(g.store.prs.length,0);assert.equal(g.store.calls.some(c=>c.method==='PATCH'),false);
});
test('unregistered and unauthorized groups fail before creating remote state',async()=>{
  for(const options of [{group:5},{group:undefined},{context:{...context,login:'another'}},{config:{...config,groups:[{id:'group-03',representative:null}]}}]){
    const g=github();await assert.rejects(publish({...params(g),...options}),/组|代表|登记/);
    assert.equal(g.store.calls.some(c=>c.method!=='GET'),false);
  }
});
test('a submission requires README and rejects absolute or traversing source paths',async()=>{
  for(const entries of [[files()[1]],[files()[0],{...files()[1],path:'/outside.png'}],[files()[0],{...files()[1],path:'../other.png'}]]){
    const g=github();await assert.rejects(publish({...params(g),files:entries}),/README|路径/);
    assert.equal(g.store.calls.some(c=>c.method!=='GET'),false);
  }
});
test('two authorized groups have separate branches and PRs',async()=>{
  const g=github();const a=await publish(params(g)),b=await publish({...params(g),group:4});
  assert.equal(a.branch,'aibt/student/lesson-02/group-03');assert.equal(b.branch,'aibt/student/lesson-02/group-04');
  assert.equal(g.store.prs.length,2);
});
test('a different representative cannot create a duplicate pending group PR',async()=>{
  const g=github();
  g.store.prs.push({number:9,state:'open',head:{ref:'aibt/previous/lesson-02/group-03',label:'previous:aibt/previous/lesson-02/group-03'}});
  await assert.rejects(publish(params(g)),/已有|重复/);
  assert.equal(g.store.calls.some(c=>c.method!=='GET'),false);
});
test('submit checks the trusted roster before creating a fork',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-roster-'));
  const calls=[];
  const api=async(endpoint,method='GET')=>{
    calls.push({endpoint,method});
    if(endpoint==='/user')return {login:'other'};
    if(endpoint==='/repos/'+COURSE)return {id:123,private:false,default_branch:'main'};
    if(endpoint===`/repos/${COURSE}/contents/course.json?ref=main`)return {encoding:'base64',content:Buffer.from(JSON.stringify(config)).toString('base64')};
    throw new Error('Unexpected '+endpoint);
  };
  try{
    await fs.writeFile(path.join(root,'README.md'),'作品');
    await assert.rejects(main(['submit','--lesson','2','--group','3','--source',root],api),/代表/);
    assert.equal(calls.some(c=>c.method!=='GET'||c.endpoint.includes('/forks')),false);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('connection fixture is a valid PNG, including chunk checksums',()=>{
  const bytes=testFiles().find(f=>f.path==='pixel.png').bytes;
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let offset=8,decoded=false;
  while(offset<bytes.length){
    const n=bytes.readUInt32BE(offset),chunk=bytes.subarray(offset+4,offset+8+n);
    let crc=0xffffffff;
    for(const value of chunk){crc^=value;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    assert.equal((crc^0xffffffff)>>>0,bytes.readUInt32BE(offset+8+n));
    if(chunk.subarray(0,4).toString()==='IDAT'){assert.equal(inflateSync(chunk.subarray(4)).length,3);decoded=true;}
    offset+=n+12;
  }
  assert.equal(offset,bytes.length);assert.equal(decoded,true);
});
