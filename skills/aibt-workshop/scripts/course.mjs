// 与 helper 一起分发；仅使用 Node.js 标准库。
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function isMain(moduleURL){
  try{return realpathSync(process.argv[1])===realpathSync(fileURLToPath(moduleURL));}catch{return false;}
}
export const COURSE='f3484134/AIBT-WORKSHOP-261107';
export const REPO_NAME=COURSE.split('/')[1];
export const MAX_FILE=20*1024*1024,MAX_TOTAL=50*1024*1024,MAX_FILES=200;
export const SKIP_DIRS=new Set(['.git','.agents','.claude','.qoder','.codex','.vscode','.idea','node_modules','.venv','venv','__pycache__','.cache','.next','coverage']);
export const EXTENSIONS=new Set('md txt html htm css js mjs cjs jsx ts tsx json csv tsv yaml yml svg png jpg jpeg gif webp pdf pptx docx xlsx ipynb py r sql xml mp3 mp4 wav zip'.split(' '));
export const SECRET_NAME=/(^\.env($|\.)|^\.npmrc$|^\.pypirc$|^credentials?(\.|$)|^secrets?(\.|$)|^id_(rsa|ed25519)|\.(pem|key|p12|pfx|kdbx)$)/i;
export const SECRET_CONTENT=/(-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b)/;

function numberedId(value,prefix,label){
  const match=String(value??'').match(new RegExp(`^(?:${prefix}-)?([1-9]\\d?|0[1-9])$`));
  if(!match)throw new Error(`${label}请用 1–99。`);
  return prefix+'-'+String(Number(match[1])).padStart(2,'0');
}
export const lessonId=value=>numberedId(value,'lesson','练习编号');
export const groupId=value=>numberedId(value,'group','组号');
export function normalizeLogin(value){
  if(typeof value!=='string'||!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value))throw new Error('GitHub 账号格式错误，请使用个人账号。');
  return value.toLowerCase();
}
export function validateConfig(config){
  if(config?.version!==3||config.submissionMode!=='self-reported'||!Array.isArray(config.lessons)||!config.lessons.length||config.lessons.length>99)throw new Error('课程配置格式错误，需要 version: 3、submissionMode: self-reported 和 lessons。请使用新版免名单 Skill。');
  const unique=(items,normalize,label)=>{
    const seen=new Set();
    return items.map(item=>{
      if(!item||item.id!==normalize(item.id)||seen.has(item.id))throw new Error(`${label}编号无效或重复。`);
      seen.add(item.id);return item;
    });
  };
  const lessons=unique(config.lessons,lessonId,'练习').map(item=>{
    if(typeof item.title!=='string'||!item.title.trim()||item.title.length>100||/[\r\n]/.test(item.title))throw new Error('练习名称不能为空或包含换行。');
    return {id:item.id,title:item.title.trim()};
  }).sort((a,b)=>a.id.localeCompare(b.id));
  return {version:3,submissionMode:'self-reported',lessons};
}
export function submissionTarget(config,{login,lesson,group,kind}){
  const course=validateConfig(config),user=normalizeLogin(login),lessonKey=lessonId(lesson),groupKey=groupId(group);
  if(!course.lessons.some(item=>item.id===lessonKey))throw new Error(`老师尚未开放练习 ${lessonKey}。`);
  if(!['individual','team'].includes(kind))throw new Error('提交类型请用 individual（个人）或 team（小组代表）。');
  return {login:user,lesson:lessonKey,group:groupKey,kind,prefix:`submissions/${lessonKey}/${groupKey}/${kind}/`+(kind==='individual'?user+'/':''),slug:`${lessonKey}/${groupKey}/${kind}`,title:`[练习${lessonKey.slice(-2)}][第${groupKey.slice(-2)}组][${kind==='individual'?'个人':'小组'}] ${user}`};
}
export function parseSubmissionBranch(branch){
  if(typeof branch!=='string')return null;
  const match=branch.match(/^aibt\/([a-z\d-]+)\/(lesson-\d{2})\/(group-\d{2})\/(individual|team)(?:-r([1-9]\d?))?$/);
  if(!match)return null;
  try{
    if(lessonId(match[2])!==match[2]||groupId(match[3])!==match[3])return null;
    const revision=match[5]?Number(match[5]):1;
    if(match[5]&&revision<2)return null;
    return {login:normalizeLogin(match[1]),lesson:match[2],group:match[3],kind:match[4],revision};
  }catch{return null;}
}
export async function readCourseConfig(api,ref='main'){
  let file;
  try{file=await api(`/repos/${COURSE}/contents/course.json?ref=${encodeURIComponent(ref)}`);}
  catch(error){if(error.status===404)throw new Error('老师仓库尚未提供新版 course.json，请等待分组提交更新合并。');throw error;}
  if(file?.encoding!=='base64'||typeof file.content!=='string')throw new Error('无法读取老师的课程配置。');
  return validateConfig(JSON.parse(Buffer.from(file.content,'base64').toString('utf8')));
}
export async function listPullRequests(api,state='all'){
  const result=[];
  for(let page=1;page<=100;page++){
    const batch=await api(`/repos/${COURSE}/pulls?state=${state}&base=main&per_page=100&page=${page}`);
    if(!Array.isArray(batch))throw new Error('无法完整读取 PR 列表。');
    result.push(...batch);
    if(batch.length<100)return result;
  }
  throw new Error('PR 列表超过读取上限，无法保证完整，请联系老师。');
}
export function matchingGroupPulls(prs,target){
  return prs.filter(pr=>{
    const parsed=parseSubmissionBranch(pr.head?.ref);
    return !isMaintenancePR(pr)&&pr.state==='open'&&parsed?.lesson===target.lesson&&parsed.group===target.group&&(!target.kind||parsed.kind===target.kind)&&(!(target.kind==='individual'&&target.login)||parsed.login===target.login);
  });
}
export function isMaintenancePR(pr){return Boolean(pr.labels?.some(label=>(typeof label==='string'?label:label.name)==='course-maintenance'));}

export function validWorkPath(relative){
  if(typeof relative!=='string'||/[\\\x00-\x1f]/.test(relative))return false;
  const parts=relative.split('/');
  if(parts.some(part=>!part||part.startsWith('.')||SKIP_DIRS.has(part)||SECRET_NAME.test(part)))return false;
  const name=parts.at(-1),extension=name.includes('.')?name.split('.').at(-1).toLowerCase():'';
  return EXTENSIONS.has(extension);
}
export function validateWorkTree(tree,prefix,{requireReadme=true}={}){
  if(!tree||tree.truncated||!Array.isArray(tree.tree))throw new Error('远端目录树被截断或无法完整读取。');
  const entries=tree.tree.filter(entry=>entry.path.startsWith(prefix)&&entry.type!=='tree');
  if(!entries.length||entries.length>MAX_FILES)throw new Error('每份个人作品或小组共同作品最多 200 个文件。');
  let total=0;
  for(const entry of entries){
    if(entry.type!=='blob'||!['100644','100755'].includes(entry.mode)||!validWorkPath(entry.path.slice(prefix.length)))throw new Error('作品含不支持路径、隐藏配置或符号链接。');
    if(!Number.isSafeInteger(entry.size)||entry.size<0||entry.size>MAX_FILE)throw new Error('作品单个文件超过 20 MiB 或大小无法确认。');
    total+=entry.size;
  }
  if(total>MAX_TOTAL)throw new Error('本次个人作品或小组共同作品总计超过 50 MiB。');
  if(requireReadme&&!entries.some(entry=>entry.path===prefix+'README.md'))throw new Error('本组作品根目录缺少 README.md。');
  return {files:entries.length,totalBytes:total};
}
export function validateSubmission({config,pr,files,tree,openPulls=[]}){
  if(pr.base?.ref!=='main'||pr.base.repo?.full_name!==COURSE)throw new Error('PR 必须指向老师课程的 main。');
  if(isMaintenancePR(pr))return {kind:'maintenance',note:'老师已标记课程维护，请人工审阅全部差异。'};
  const login=normalizeLogin(pr.user?.login),headRepo=pr.head?.repo?.full_name?.toLowerCase();
  if(headRepo!==login+'/'+REPO_NAME.toLowerCase()&&!(login===COURSE.split('/')[0]&&headRepo===COURSE.toLowerCase()))throw new Error('PR 来源仓库必须属于实际提交账号。');
  if(!Array.isArray(files)||files.length===0||files.length!==pr.changed_files||files.length>MAX_FILES)throw new Error('PR 文件清单不完整或超过 200 个文件。');
  const testMatch=pr.head.ref.match(/^aibt\/([a-z\d-]+)\/connection-test(?:-r([2-9]|[1-9]\d))?$/);
  const testBranch=Boolean(testMatch&&testMatch[1]===login);
  let target;
  if(testBranch){
    if(!pr.draft)throw new Error('连接测试 PR 必须保留为草稿。');
    target={prefix:`connection-tests/${login}/`};
  }else{
    const parsed=parseSubmissionBranch(pr.head.ref);
    if(!parsed||parsed.login!==login)throw new Error('请升级到分组版 Skill，或请老师为课程维护 PR 添加 course-maintenance 标签。');
    target=submissionTarget(config,{login,lesson:parsed.lesson,group:parsed.group,kind:parsed.kind});
    if(pr.title!==target.title)throw new Error(`PR 标题请统一为：${target.title}`);
    if(matchingGroupPulls(openPulls,target).some(other=>other.number!==pr.number))throw new Error('该作品已有其他打开的 PR，请处理重复提交。');
  }
  for(const file of files){
    if(!file.filename.startsWith(target.prefix)||file.previous_filename&&!file.previous_filename.startsWith(target.prefix)||file.status==='removed')throw new Error('PR 含跨组、跨练习、其他文件变更或删除。');
    if(!validWorkPath(file.filename.slice(target.prefix.length)))throw new Error('PR 含不支持或敏感路径。');
  }
  if(testBranch){
    const names=files.map(file=>file.filename.slice(target.prefix.length));
    if(names.some(name=>!['connection.md','pixel.png'].includes(name)))throw new Error('连接测试只允许生成的文字和 PNG。');
  }
  const checked=validateWorkTree(tree,target.prefix,{requireReadme:!testBranch});
  if(testBranch){
    const names=tree.tree.filter(entry=>entry.path.startsWith(target.prefix)&&entry.type!=='tree').map(entry=>entry.path.slice(target.prefix.length)).sort();
    if(names.length!==2||names[0]!=='connection.md'||names[1]!=='pixel.png')throw new Error('连接测试需要文字和 PNG 两个生成文件。');
  }
  return {kind:testBranch?'connection-test':'submission',submissionKind:target.kind??null,login,lesson:target.lesson??null,group:target.group??null,...checked};
}

function markdownText(value){
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/[\\`*_[\]|]/g,'\\$&');
}
function submissionPath(path){
  const match=path?.match(/^submissions\/(lesson-\d{2})\/(group-\d{2})\/(individual\/([a-z\d-]+)|team)\//);
  if(!match)return null;
  try{
    if(lessonId(match[1])!==match[1]||groupId(match[2])!==match[2])return null;
    return {lesson:match[1],group:match[2],kind:match[4]?'individual':'team',login:match[4]?normalizeLogin(match[4]):null};
  }catch{return null;}
}
export function renderOverview({config,tree,prs}){
  const course=validateConfig(config);
  if(!tree||tree.truncated||!Array.isArray(tree.tree))throw new Error('远端目录树被截断，不能生成完整总览。');
  const knownLesson=value=>course.lessons.some(lesson=>lesson.id===value.lesson);
  const works=tree.tree.filter(entry=>entry.type==='blob').map(entry=>submissionPath(entry.path)).filter(value=>value&&knownLesson(value));
  const pendingLocations=prs.filter(pr=>pr.state==='open'&&!isMaintenancePR(pr)).map(pr=>parseSubmissionBranch(pr.head?.ref)).filter(value=>value&&knownLesson(value));
  const groups=[...new Set([...works,...pendingLocations].map(value=>value.group))].sort();
  const lines=['# 课堂作品提交总览','','按练习、组号、提交类型和账号排序。组别由学生自报，老师在 PR 中确认；待审或草稿仍需查看检查结果并由老师审阅。','没有完整名单，无法判断全班谁还没交；这里只汇集已出现的组别和提交者，“暂无提交”不代表任何人的缺交结论。','','| 练习 | 组别 | 类型 | 提交账号 | 状态 | 已合并作品 | 提交单 |','|---|---|---|---|---|---|---|'];
  for(const lesson of course.lessons){
    for(const group of groups){
      const observed=[...works,...pendingLocations].filter(value=>value.lesson===lesson.id&&value.group===group&&value.kind==='individual');
      const accounts=[...new Set(observed.map(value=>value.login))].sort();
      const slots=[...accounts.map(login=>({kind:'individual',login})),{kind:'team',login:null}];
      if(!accounts.length)slots.unshift({kind:'individual',login:null});
      for(const slot of slots){
        const prefix=`submissions/${lesson.id}/${group}/${slot.kind}/`+(slot.kind==='individual'&&slot.login?slot.login+'/':'');
        const merged=Boolean((slot.kind==='team'||slot.login)&&tree.tree.some(entry=>entry.path===prefix+'README.md'&&entry.type==='blob'));
        const pending=slot.kind==='individual'&&!slot.login?[]:matchingGroupPulls(prs,{lesson:lesson.id,group,kind:slot.kind,login:slot.login});
        let state=merged?'已合并':'暂无提交';
        if(pending.length>1)state='重复提交，待处理';
        else if(pending.length){
          const pr=pending[0],parsed=parseSubmissionBranch(pr.head.ref),author=pr.user?.login?.toLowerCase();
          const identityMatches=parsed.login===author&&pr.head.repo?.full_name?.toLowerCase()===`${author}/${REPO_NAME}`.toLowerCase()&&pr.base?.ref==='main'&&pr.base.repo?.full_name===COURSE;
          state=identityMatches?(pr.draft?'草稿':'待审'):'账号身份待核对';
          if(merged)state+='（已有版本）';
        }
        const links=pending.map(pr=>`[PR #${Number(pr.number)}](https://github.com/${COURSE}/pull/${Number(pr.number)})`).join('、')||'—';
        const work=merged?`[查看作品](https://github.com/${COURSE}/tree/main/${prefix})`:'—';
        const submitters=slot.login?'@'+slot.login:[...new Set(pending.map(pr=>parseSubmissionBranch(pr.head.ref).login))].sort().map(login=>'@'+login).join('、')||'—';
        lines.push(`| ${lesson.id} | ${group} | ${slot.kind==='individual'?'个人':'小组'} | ${submitters} | ${state} | ${work} | ${links} |`);
      }
    }
  }
  if(!groups.length)lines.push('','尚无正式作品或打开的提交 PR；学生首次提交后自动出现组别，无需预建名单。');
  lines.push('','## 练习名称','',...course.lessons.map(lesson=>`- ${lesson.id}：${markdownText(lesson.title)}`),'','连接测试与课程维护 PR 不计入作业。已关闭且未合并的 PR 不视为已收录。','');
  return lines.join('\n');
}
