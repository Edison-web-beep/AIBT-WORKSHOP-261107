#!/usr/bin/env node
// Node 20+; no npm dependencies. gh supplies authentication, not a local Git checkout.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {COURSE,REPO_NAME,lessonId,groupId,normalizeLogin,submissionTarget,readCourseConfig,listPullRequests,matchingGroupPulls,MAX_FILE,MAX_TOTAL,MAX_FILES,SKIP_DIRS,EXTENSIONS,SECRET_NAME,SECRET_CONTENT,validateWorkTree,isMain,isMaintenancePR} from './course.mjs';
export * from './course.mjs';

export const blobSha=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
export async function collectFiles(source){
  const requested=path.resolve(source);
  if((await fs.lstat(requested)).isSymbolicLink()) throw new Error('作品根目录不能是符号链接。');
  const root=await fs.realpath(requested);
  if(!(await fs.stat(root)).isDirectory()) throw new Error('请指定作品文件夹。');
  if(root===path.parse(root).root || root===os.homedir()) throw new Error('请选作品子文件夹，不要选磁盘根目录或个人主目录。');
  const files=[], skipped=[]; let total=0;
  async function walk(dir,rel=''){
    for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      const local=path.join(dir,entry.name), relative=(rel?rel+'/':'')+entry.name;
      if(entry.isSymbolicLink()){skipped.push({path:relative,reason:'符号链接'});continue;}
      if(SECRET_NAME.test(entry.name)){skipped.push({path:relative,reason:'凭证或环境配置文件'});continue;}
      if(entry.isDirectory()){
        if(SKIP_DIRS.has(entry.name)||entry.name.startsWith('.')) skipped.push({path:relative+'/',reason:'系统或依赖包目录'});
        else await walk(local,relative);
        continue;
      }
      if(!entry.isFile()) continue;
      if(/[\x00-\x1f\\]/.test(relative)) throw new Error('文件名含不支持字符，请重新命名。');
      const ext=path.extname(entry.name).slice(1).toLowerCase();
      if(entry.name.startsWith('.')||!EXTENSIONS.has(ext)){skipped.push({path:relative,reason:'非课堂作品格式'});continue;}
      const stat=await fs.stat(local);
      if(stat.size>MAX_FILE) throw new Error(`文件超过 20 MiB：${relative}。请缩小或改在 README 提供公开链接。`);
      const bytes=await fs.readFile(local);
      if(SECRET_CONTENT.test(bytes.toString('utf8'))) throw new Error(`发现疑似密钥：${relative}。请移除后再交作业；不会显示内容。`);
      total+=bytes.length;
      if(total>MAX_TOTAL||files.length>=MAX_FILES) throw new Error('一次最多 200 个文件、合计 50 MiB；请选较小的作品文件夹。');
      files.push({path:relative,bytes,sha:blobSha(bytes)});
    }
  }
  await walk(root);
  if(!files.length) throw new Error('没有可提交的作品文件。');
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
    const message=error.code==='ENOENT'?'未找到 GitHub CLI（gh）。请安装官方版本后重新打开 IDE。':`GitHub ${method} 失败（${status||'连接／登录'}）。请检查网络、gh auth status 与 Repo 授权。`;
    throw Object.assign(new Error(message),{status});
  }
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function optional(api,endpoint){try{return await api(endpoint);}catch(e){if(e.status===404)return null;throw e;}}
export async function identity(api=ghApi){
  const user=await api('/user'); const login=normalizeLogin(user.login);
  const upstream=await api('/repos/'+COURSE);
  if(upstream.private||upstream.default_branch!=='main') throw new Error('课程仓库需是公开且默认分支为 main，请通知老师。');
  return {login,upstream};
}
export async function ensureFork(context,api=ghApi,{teacherTest=false}={}){
  const {login,upstream}=context;
  if(login===COURSE.split('/')[0]){
    if(!teacherTest) throw new Error('这是老师账号；连接测试请加 --teacher-test。正式学生测试请改用另一个 GitHub 账号。');
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
  if(!fork) throw new Error('GitHub 还在创建 Fork，请稍后用相同 Prompt 重试。');
  if(!fork.fork||fork.parent?.id!==upstream.id) throw new Error(`您的 ${REPO_NAME} 不是本课程的 Fork。请先处理同名仓库，不会覆盖它。`);
  if(fork.private) throw new Error('Fork 未公开，请检查 GitHub 设置。');
  return repo;
}
export async function chooseBranch(api,repo,login,slug){
  const base='aibt/'+login+'/'+slug;
  // A branch with an open PR is reused; a merged/closed branch gets a new revision.
  for(let n=1;n<=99;n++){
    const branch=base+(n===1?'':'-r'+n);
    const prs=await api(`/repos/${COURSE}/pulls?state=all&head=${encodeURIComponent(login+':'+branch)}&base=main&per_page=100`);
    if(prs.length>1) throw new Error('同分支有多笔 PR，请先用状态查询确认。');
    if(prs[0]?.state==='open'&&!isMaintenancePR(prs[0])) return {branch,pr:prs[0]};
    if(prs.length) continue;
    return {branch,pr:null};
  }
  throw new Error('此课次分支版本过多，请通知老师。');
}
export async function publish({api=ghApi,context,repo,slug,group,kind,config,files,test=false,summary=''}){
  const {login}=context;
  const target=test?null:submissionTarget(config??await readCourseConfig(api),{login,lesson:slug,group,kind});
  if(target)slug=target.slug;
  const prefix=test?'connection-tests/'+login+'/':target.prefix;
  if(!test&&!files.some(f=>f.path==='README.md'))throw new Error('作品文件夹根目录需要 README.md，说明组别、作品用途与入口。');
  if(files.some(f=>typeof f.path!=='string'||/[\\\x00-\x1f]/.test(f.path)||f.path.split('/').some(part=>!part||part==='.'||part==='..')))throw new Error('提交路径不合法。');
  const targetFiles=files.map(f=>({...f,path:prefix+f.path}));
  if(!targetFiles.length||targetFiles.some(f=>!f.path.startsWith(prefix)||f.path.split('/').includes('..'))) throw new Error('提交路径不合法。');
  const selected=await chooseBranch(api,repo,login,slug);
  if(target){
    const pending=matchingGroupPulls(await listPullRequests(api,'open'),target);
    if(pending.some(pr=>pr.number!==selected.pr?.number))throw new Error('该作品已有其他打开的 PR，请先请老师处理，避免重复提交。');
  }
  const {branch}=selected;
  let ref=await optional(api,`/repos/${repo}/git/ref/heads/${branch}`);
  if(!ref){
    const upstreamRef=await api(`/repos/${COURSE}/git/ref/heads/main`);
    ref=await api(`/repos/${repo}/git/refs`,'POST',{ref:'refs/heads/'+branch,sha:upstreamRef.object.sha});
  }
  const checkScope=async()=>{
    const diff=await api(`/repos/${COURSE}/compare/main...${encodeURIComponent(login+':'+branch)}`);
    if(!Array.isArray(diff.files)||diff.files.length>=300||diff.files.some(f=>f.status==='removed'||!f.filename.startsWith(prefix)||f.previous_filename&&!f.previous_filename.startsWith(prefix))) throw new Error('分支含有本组本练习范围以外的变更或删除，已停止。');
  };
  await checkScope();
  const parent=ref.object.sha;
  const commit=await api(`/repos/${repo}/git/commits/${parent}`);
  const tree=await api(`/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`);
  if(tree.truncated) throw new Error('GitHub 目录清单被截断，请通知老师。');
  const existing=new Map(tree.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  const replaced=new Set(targetFiles.map(file=>file.path));
  validateWorkTree({truncated:false,tree:[...tree.tree.filter(entry=>!replaced.has(entry.path)),...targetFiles.map(file=>({path:file.path,type:'blob',mode:'100644',size:file.bytes.length}))]},prefix,{requireReadme:!test});
  const changed=targetFiles.filter(f=>existing.get(f.path)!==f.sha);
  if(changed.length){
    const entries=[];
    for(const f of changed){
      const blob=await api(`/repos/${repo}/git/blobs`,'POST',{content:f.bytes.toString('base64'),encoding:'base64'});
      if(blob.sha!==f.sha) throw new Error('上传内容哈希不符，已停止。');
      entries.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha});
    }
    const newTree=await api(`/repos/${repo}/git/trees`,'POST',{base_tree:commit.tree.sha,tree:entries});
    const newCommit=await api(`/repos/${repo}/git/commits`,'POST',{message:`${test?'test':'submit'}: ${login} ${slug}`,tree:newTree.sha,parents:[parent]});
    // Detect concurrent updates, and never force a branch backwards.
    const latest=await api(`/repos/${repo}/git/ref/heads/${branch}`);
    if(latest.object.sha!==parent) throw new Error('分支同时被更新；请重新提交以保留两边变更。');
    await api(`/repos/${repo}/git/refs/heads/${branch}`,'PATCH',{sha:newCommit.sha,force:false});
  }
  // Verify content hashes through Git data; works for text and binary alike.
  const finalRef=await api(`/repos/${repo}/git/ref/heads/${branch}`);
  const finalTree=await api(`/repos/${repo}/git/trees/${finalRef.object.sha}?recursive=1`);
  if(finalTree.truncated) throw new Error('无法完整验证远端目录。');
  const remote=new Map(finalTree.tree.map(x=>[x.path,x.sha]));
  if(targetFiles.some(f=>remote.get(f.path)!==f.sha)) throw new Error('远端文件验证失败，尚不能视为提交成功。');
  await checkScope();
  let pr=selected.pr;
  if(!pr){
    pr=await api(`/repos/${COURSE}/pulls`,'POST',{base:'main',head:login+':'+branch,title:test?`[连接测试] ${login} / ${slug}`:target.title,body:`${test?'首次连接测试；此 PR 保留为草稿，无须合并。':`课堂作品：${target.lesson} / ${target.group} / ${target.kind}；提交账号：${login}。请老师审阅后合并。`}\n\n${summary}\n\n作品：\`${prefix}\`\n\n由 aibt-workshop Skill 提交；内容公开。`,draft:test,maintainer_can_modify:true});
  }
  const verified=await api(`/repos/${COURSE}/pulls/${pr.number}`);
  if(verified.state!=='open'||verified.base.ref!=='main'||verified.head.ref!==branch||verified.head.repo?.full_name?.toLowerCase()!==repo.toLowerCase()||test&&!verified.draft) throw new Error('PR 状态验证未通过，请查询状态。');
  return {login,lesson:target?.lesson??null,group:target?.group??null,kind:target?.kind??null,mode:repo===COURSE?'teacher-test':'student-fork',repository:repo,branch,filesVerified:targetFiles.length,changed:changed.length,pr:verified.html_url,draft:verified.draft,folder:`https://github.com/${repo}/tree/${branch}/${prefix}`};
}
export function testFiles(){
  return [
    {path:'connection.md',bytes:Buffer.from('# AIBT 连接测试\n\n文字与图片上传测试。\n'+new Date().toISOString()+'\n')},
    {path:'pixel.png',bytes:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')}
  ].map(f=>({...f,sha:blobSha(f.bytes)}));
}
export async function main(argv=process.argv.slice(2),api=ghApi){
  const command=argv.shift()??'help'; const opts={};
  while(argv.length){const key=argv.shift();if(!key.startsWith('--')) throw new Error('请使用 --参数 值。');if(key==='--teacher-test') opts.teacherTest=true;else{if(!argv.length)throw new Error('缺少参数值。');opts[key.slice(2)]=argv.shift();}}
  const allowed={help:[],doctor:[],init:[],test:['teacherTest'],plan:['source','lesson','group','kind'],submit:['source','lesson','group','kind','summary'],status:[]};
  if(!allowed[command]||Object.keys(opts).some(key=>!allowed[command].includes(key)))throw new Error('未知命令或参数，请执行 help。');
  if(command==='help') return {version:'2.0.0',commands:['doctor（只读）','init（创建或确认 Fork）','test [--teacher-test]（文字、图片及草稿 PR）','plan --source <folder> [--lesson 1 --group 3 --kind individual|team]（只读预览）','submit --lesson 1 --group 3 --kind individual|team --source <folder> [--summary <text>]','status（只读）'],course:COURSE};
  if(command==='plan'){
    if(!opts.source)throw new Error('请用 --source 指定作品文件夹。');
    const p=await collectFiles(opts.source);
    let target;
    if(opts.lesson!==undefined||opts.group!==undefined||opts.kind!==undefined){const context=await identity(api);target=submissionTarget(await readCourseConfig(api),{login:context.login,lesson:opts.lesson,group:opts.group,kind:opts.kind});}
    return {source:p.root,target,files:p.files.map(f=>({path:f.path,bytes:f.bytes.length,sha:f.sha})),skipped:p.skipped,totalBytes:p.total,limits:{files:MAX_FILES,fileMiB:20,totalMiB:50},note:'只读预览；尚未上传。更新只新增／覆盖同名文件，不删除远端旧文件。'};
  }
  if(!['doctor','init','test','submit','status'].includes(command)) throw new Error('未知命令，请执行 help。');
  // Scan and reject invalid files before creating any remote state.
  let plan,slug,group,config;
  if(command==='submit'){
    slug=lessonId(opts.lesson);
    group=groupId(opts.group);
    if(!opts.source)throw new Error('请用 --source 指定作品文件夹。');
    plan=await collectFiles(opts.source);
    if(!plan.files.some(f=>f.path==='README.md'))throw new Error('作品文件夹根目录需要 README.md。');
  }
  const context=await identity(api);
  if(command==='submit'){config=await readCourseConfig(api);submissionTarget(config,{login:context.login,lesson:slug,group,kind:opts.kind});}
  if(command==='doctor') return {login:context.login,course:COURSE,read:'PASS',write:'NOT_TESTED',fork:context.login===COURSE.split('/')[0]?'OWNER':await optional(api,'/repos/'+context.login+'/'+REPO_NAME)?'EXISTS':'NOT_CREATED',next:'执行 test 完成实际写入与 PR 测试。'};
  if(command==='status'){
    const prs=await listPullRequests(api);
    return {login:context.login,prs:prs.filter(p=>p.user.login.toLowerCase()===context.login).map(p=>({number:p.number,title:p.title,state:p.merged_at?'merged':p.state,draft:p.draft,url:p.html_url})),all:`https://github.com/${COURSE}/pulls?q=is%3Apr+author%3A${context.login}`};
  }
  const repo=await ensureFork(context,api,{teacherTest:opts.teacherTest&&command==='test'});
  if(command==='init') return {login:context.login,fork:'https://github.com/'+repo,next:'执行 test 做首次上传测试。'};
  if(command==='test') return publish({api,context,repo,slug:'connection-test',files:testFiles(),test:true});
  const result=await publish({api,context,repo,slug,group,kind:opts.kind,config,files:plan.files,summary:opts.summary??''});
  return {...result,skipped:plan.skipped,note:'已提交 PR；老师合并后才会出现在课程 main。远端旧文件不会自动删除。'};
}
if(isMain(import.meta.url)){
  main().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(JSON.stringify({ok:false,message:error.message}));process.exitCode=1;});
}
