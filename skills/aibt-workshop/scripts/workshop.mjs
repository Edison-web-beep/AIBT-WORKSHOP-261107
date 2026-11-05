#!/usr/bin/env node
// Node 20+; no npm dependencies. gh supplies authentication, not a local Git checkout.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const COURSE='f3484134/AIBT-WORKSHOP-261107';
export const REPO_NAME=COURSE.split('/')[1];
const MAX_FILE=20*1024*1024, MAX_TOTAL=50*1024*1024, MAX_FILES=200;
const SKIP_DIRS=new Set(['.git','.agents','.claude','.qoder','.codex','.vscode','.idea','node_modules','.venv','venv','__pycache__','.cache','.next','coverage']);
const EXTENSIONS=new Set('md txt html htm css js mjs cjs jsx ts tsx json csv tsv yaml yml svg png jpg jpeg gif webp pdf pptx docx xlsx ipynb py r sql xml mp3 mp4 wav zip'.split(' '));
const SECRET_NAME=/(^\.env($|\.)|^\.npmrc$|^\.pypirc$|^credentials?(\.|$)|^secrets?(\.|$)|^id_(rsa|ed25519)|\.(pem|key|p12|pfx|kdbx)$)/i;
const SECRET_CONTENT=/(-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b)/;
export const blobSha=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
export function lessonId(value){
  const m=String(value??'').match(/^(?:lesson-)?([1-9]\d?|0[1-9])$/);
  if(!m) throw new Error('課次請用 1–99，例如 --lesson 2。');
  return 'lesson-'+String(Number(m[1])).padStart(2,'0');
}
function safeLogin(value){
  if(!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value)) throw new Error('GitHub 帳號格式錯誤。');
  return value.toLowerCase();
}
export async function collectFiles(source){
  const requested=path.resolve(source);
  if((await fs.lstat(requested)).isSymbolicLink()) throw new Error('作品根目錄不能是符號連結。');
  const root=await fs.realpath(requested);
  if(!(await fs.stat(root)).isDirectory()) throw new Error('請指定作品資料夾。');
  if(root===path.parse(root).root || root===os.homedir()) throw new Error('請選作品子資料夾，不要選磁碟根目錄或個人主目錄。');
  const files=[], skipped=[]; let total=0;
  async function walk(dir,rel=''){
    for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      const local=path.join(dir,entry.name), relative=(rel?rel+'/':'')+entry.name;
      if(entry.isSymbolicLink()){skipped.push({path:relative,reason:'符號連結'});continue;}
      if(SECRET_NAME.test(entry.name)){skipped.push({path:relative,reason:'憑證或環境設定檔'});continue;}
      if(entry.isDirectory()){
        if(SKIP_DIRS.has(entry.name)||entry.name.startsWith('.')) skipped.push({path:relative+'/',reason:'系統或相依套件目錄'});
        else await walk(local,relative);
        continue;
      }
      if(!entry.isFile()) continue;
      if(/[\x00-\x1f\\]/.test(relative)) throw new Error('檔名含不支援字元，請重新命名。');
      const ext=path.extname(entry.name).slice(1).toLowerCase();
      if(entry.name.startsWith('.')||!EXTENSIONS.has(ext)){skipped.push({path:relative,reason:'非課堂作品格式'});continue;}
      const stat=await fs.stat(local);
      if(stat.size>MAX_FILE) throw new Error(`檔案超過 20 MiB：${relative}。請縮小或改在 README 提供公開連結。`);
      const bytes=await fs.readFile(local);
      if(SECRET_CONTENT.test(bytes.toString('utf8'))) throw new Error(`發現疑似金鑰：${relative}。請移除後再交作業；不會顯示內容。`);
      total+=bytes.length;
      if(total>MAX_TOTAL||files.length>=MAX_FILES) throw new Error('一次最多 200 檔、合計 50 MiB；請選較小的作品資料夾。');
      files.push({path:relative,bytes,sha:blobSha(bytes)});
    }
  }
  await walk(root);
  if(!files.length) throw new Error('沒有可提交的作品檔案。');
  return {root,files,skipped,total};
}

// Never print credentials or place tokens in a URL/command line.
export function ghApi(endpoint,method='GET',body){
  const args=['api','--hostname','github.com','--method',method,'-H','Accept: application/vnd.github+json','-H','X-GitHub-Api-Version: 2022-11-28',endpoint];
  if(body!==undefined) args.push('--input','-');
  try{
    const raw=execFileSync('gh',args,{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8',timeout:45000,maxBuffer:40*1024*1024,windowsHide:true,stdio:['pipe','pipe','pipe']});
    return raw.trim()?JSON.parse(raw):{};
  }catch(error){
    const status=Number(String(error.stderr??'').match(/HTTP (\d{3})/)?.[1]??0);
    const message=error.code==='ENOENT'?'未找到 GitHub CLI（gh）。請安裝官方版本後重新開啟 IDE。':`GitHub ${method} 失敗（${status||'連線／登入'}）。請檢查網路、gh auth status 與 Repo 授權。`;
    throw Object.assign(new Error(message),{status});
  }
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function optional(api,endpoint){try{return await api(endpoint);}catch(e){if(e.status===404)return null;throw e;}}
export async function identity(api=ghApi){
  const user=await api('/user'); const login=safeLogin(user.login);
  const upstream=await api('/repos/'+COURSE);
  if(upstream.private||upstream.default_branch!=='main') throw new Error('課程倉庫需是公開且預設分支為 main，請通知老師。');
  return {login,upstream};
}
export async function ensureFork(context,api=ghApi,{teacherTest=false}={}){
  const {login,upstream}=context;
  if(login===COURSE.split('/')[0]){
    if(!teacherTest) throw new Error('這是老師帳號；連線測試請加 --teacher-test。正式學生測試請改用另一個 GitHub 帳號。');
    return COURSE;
  }
  const repo=login+'/'+REPO_NAME;
  let fork=await optional(api,'/repos/'+repo);
  if(!fork){
    await api('/repos/'+COURSE+'/forks','POST',{default_branch_only:true});
    for(let n=0;n<6;n++){
      fork=await optional(api,'/repos/'+repo);
      if(fork) break;
      await wait(2000);
    }
  }
  if(!fork) throw new Error('GitHub 還在建立 Fork，請稍後用相同 Prompt 重試。');
  if(!fork.fork||fork.parent?.id!==upstream.id) throw new Error(`您的 ${REPO_NAME} 不是本課程的 Fork。請先處理同名倉庫，不會覆寫它。`);
  if(fork.private) throw new Error('Fork 未公開，請檢查 GitHub 設定。');
  return repo;
}
export async function chooseBranch(api,repo,login,slug){
  const base='aibt/'+login+'/'+slug;
  // A branch with an open PR is reused; a merged/closed branch gets a new revision.
  for(let n=1;n<=99;n++){
    const branch=base+(n===1?'':'-r'+n);
    const prs=await api(`/repos/${COURSE}/pulls?state=all&head=${encodeURIComponent(login+':'+branch)}&base=main&per_page=100`);
    if(prs.length>1) throw new Error('同分支有多筆 PR，請先用狀態查詢確認。');
    if(prs[0]?.state==='open') return {branch,pr:prs[0]};
    if(prs.length) continue;
    return {branch,pr:null};
  }
  throw new Error('此課次分支版本過多，請通知老師。');
}
export async function publish({api=ghApi,context,repo,slug,files,test=false,summary=''}){
  const {login}=context;
  const prefix=(test?'connection-tests/':'submissions/')+login+'/'+(test?'':slug+'/');
  const targetFiles=files.map(f=>({...f,path:prefix+f.path}));
  if(!targetFiles.length||targetFiles.some(f=>!f.path.startsWith(prefix)||f.path.split('/').includes('..'))) throw new Error('提交路徑不合法。');
  const selected=await chooseBranch(api,repo,login,slug);
  const {branch}=selected;
  let ref=await optional(api,`/repos/${repo}/git/ref/heads/${branch}`);
  if(!ref){
    const upstreamRef=await api(`/repos/${COURSE}/git/ref/heads/main`);
    ref=await api(`/repos/${repo}/git/refs`,'POST',{ref:'refs/heads/'+branch,sha:upstreamRef.object.sha});
  }
  const checkScope=async()=>{
    const diff=await api(`/repos/${COURSE}/compare/main...${encodeURIComponent(login+':'+branch)}`);
    if(!Array.isArray(diff.files)||diff.files.length>=300||diff.files.some(f=>!f.filename.startsWith(prefix)||f.previous_filename&&!f.previous_filename.startsWith(prefix))) throw new Error('分支含有本人本課範圍以外的變更，已停止；不會覆寫或提交其他資料。');
  };
  await checkScope();
  const parent=ref.object.sha;
  const commit=await api(`/repos/${repo}/git/commits/${parent}`);
  const tree=await api(`/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`);
  if(tree.truncated) throw new Error('GitHub 目錄清單被截斷，請通知老師。');
  const existing=new Map(tree.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  const changed=targetFiles.filter(f=>existing.get(f.path)!==f.sha);
  if(changed.length){
    const entries=[];
    for(const f of changed){
      const blob=await api(`/repos/${repo}/git/blobs`,'POST',{content:f.bytes.toString('base64'),encoding:'base64'});
      if(blob.sha!==f.sha) throw new Error('上傳內容雜湊不符，已停止。');
      entries.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha});
    }
    const newTree=await api(`/repos/${repo}/git/trees`,'POST',{base_tree:commit.tree.sha,tree:entries});
    const newCommit=await api(`/repos/${repo}/git/commits`,'POST',{message:`${test?'test':'submit'}: ${login} ${slug}`,tree:newTree.sha,parents:[parent]});
    // Detect concurrent updates, and never force a branch backwards.
    const latest=await api(`/repos/${repo}/git/ref/heads/${branch}`);
    if(latest.object.sha!==parent) throw new Error('分支同時被更新；請重新提交以保留兩邊變更。');
    await api(`/repos/${repo}/git/refs/heads/${branch}`,'PATCH',{sha:newCommit.sha,force:false});
  }
  // Verify content hashes through Git data; works for text and binary alike.
  const finalRef=await api(`/repos/${repo}/git/ref/heads/${branch}`);
  const finalTree=await api(`/repos/${repo}/git/trees/${finalRef.object.sha}?recursive=1`);
  if(finalTree.truncated) throw new Error('無法完整驗證遠端目錄。');
  const remote=new Map(finalTree.tree.map(x=>[x.path,x.sha]));
  if(targetFiles.some(f=>remote.get(f.path)!==f.sha)) throw new Error('遠端檔案驗證失敗，尚不能視為交件成功。');
  await checkScope();
  let pr=selected.pr;
  if(!pr){
    pr=await api(`/repos/${COURSE}/pulls`,'POST',{base:'main',head:login+':'+branch,title:`${test?'[連線測試]':'[作業]'} ${login} / ${slug}`,body:`${test?'首次連線測試；此 PR 保留為草稿，無須合併。':'課堂作品提交；請老師檢閱後合併。'}\n\n${summary}\n\n作品：\`${prefix}\`\n\n由 aibt-workshop Skill 提交；內容公開。`,draft:test,maintainer_can_modify:true});
  }
  const verified=await api(`/repos/${COURSE}/pulls/${pr.number}`);
  if(verified.state!=='open'||verified.base.ref!=='main'||verified.head.ref!==branch||verified.head.repo?.full_name?.toLowerCase()!==repo.toLowerCase()||test&&!verified.draft) throw new Error('PR 狀態驗證未通過，請查詢狀態。');
  return {login,mode:repo===COURSE?'teacher-test':'student-fork',repository:repo,branch,filesVerified:targetFiles.length,changed:changed.length,pr:verified.html_url,draft:verified.draft,folder:`https://github.com/${repo}/tree/${branch}/${prefix}`};
}
function testFiles(){
  return [
    {path:'connection.md',bytes:Buffer.from('# AIBT 連線測試\n\n文字與圖片上傳測試。\n'+new Date().toISOString()+'\n')},
    {path:'pixel.png',bytes:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}
  ].map(f=>({...f,sha:blobSha(f.bytes)}));
}
export async function main(argv=process.argv.slice(2)){
  const command=argv.shift()??'help'; const opts={};
  while(argv.length){const key=argv.shift();if(!key.startsWith('--')) throw new Error('請使用 --參數 值。');if(key==='--teacher-test') opts.teacherTest=true;else{if(!argv.length)throw new Error('缺少參數值。');opts[key.slice(2)]=argv.shift();}}
  if(command==='help') return {commands:['doctor（唯讀）','init（建立或確認 Fork）','test [--teacher-test]（文字、圖片及草稿 PR）','plan --source <folder>（本地預覽）','submit --lesson 2 --source <folder> [--summary <text>]','status（唯讀）'],course:COURSE};
  if(command==='plan'){
    if(!opts.source)throw new Error('請用 --source 指定作品資料夾。');
    const p=await collectFiles(opts.source);
    return {source:p.root,files:p.files.map(f=>({path:f.path,bytes:f.bytes.length,sha:f.sha})),skipped:p.skipped,totalBytes:p.total,limits:{files:MAX_FILES,fileMiB:20,totalMiB:50},note:'本地預覽；尚未上傳。更新只新增／覆寫同名檔，不刪除遠端舊檔。'};
  }
  if(!['doctor','init','test','submit','status'].includes(command)) throw new Error('未知命令，請執行 help。');
  // Scan and reject invalid files before creating any remote state.
  let plan,slug;
  if(command==='submit'){
    slug=lessonId(opts.lesson);
    if(!opts.source)throw new Error('請用 --source 指定作品資料夾。');
    plan=await collectFiles(opts.source);
  }
  const context=await identity();
  if(command==='doctor') return {login:context.login,course:COURSE,read:'PASS',write:'NOT_TESTED',fork:context.login===COURSE.split('/')[0]?'OWNER':await optional(ghApi,'/repos/'+context.login+'/'+REPO_NAME)?'EXISTS':'NOT_CREATED',next:'執行 test 完成實際寫入與 PR 測試。'};
  if(command==='status'){
    const prs=await ghApi(`/repos/${COURSE}/pulls?state=all&per_page=100&sort=updated&direction=desc`);
    return {login:context.login,prs:prs.filter(p=>p.user.login.toLowerCase()===context.login).map(p=>({number:p.number,title:p.title,state:p.merged_at?'merged':p.state,draft:p.draft,url:p.html_url})),note:'最近 100 筆全班 PR 範圍；完整紀錄請看 GitHub author 篩選。',all:`https://github.com/${COURSE}/pulls?q=is%3Apr+author%3A${context.login}`};
  }
  const repo=await ensureFork(context,ghApi,{teacherTest:opts.teacherTest&&command==='test'});
  if(command==='init') return {login:context.login,fork:'https://github.com/'+repo,next:'執行 test 做首次上傳測試。'};
  if(command==='test') return publish({context,repo,slug:'connection-test',files:testFiles(),test:true});
  const result=await publish({context,repo,slug,files:plan.files,summary:opts.summary??''});
  return {...result,skipped:plan.skipped,note:'已提交 PR；老師合併後才會出現在課程 main。遠端舊檔不會自動刪除。'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(JSON.stringify({ok:false,message:error.message}));process.exitCode=1;});
}
