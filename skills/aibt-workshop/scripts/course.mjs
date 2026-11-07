// 与 helper 一起分发；仅使用 Node.js 标准库。
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
  if(config?.version!==2||!Array.isArray(config.lessons)||!config.lessons.length||config.lessons.length>99||!Array.isArray(config.groups)||config.groups.length>99)throw new Error('课程登记格式错误，需要 version: 2、lessons 和 groups。');
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
  const groups=unique(config.groups,groupId,'组别').map(item=>({id:item.id,representative:item.representative===null?null:normalizeLogin(item.representative)})).sort((a,b)=>a.id.localeCompare(b.id));
  return {version:2,lessons,groups};
}
export function submissionTarget(config,{login,lesson,group}){
  const roster=validateConfig(config),user=normalizeLogin(login),lessonKey=lessonId(lesson),groupKey=groupId(group);
  if(!roster.lessons.some(item=>item.id===lessonKey))throw new Error(`老师尚未登记练习 ${lessonKey}。`);
  const team=roster.groups.find(item=>item.id===groupKey);
  if(!team)throw new Error(`老师尚未登记组别 ${groupKey}，请先请老师补充 course.json。`);
  if(!team.representative)throw new Error(`${groupKey} 尚未登记提交代表，请先请老师填写 course.json；连接测试仍可执行。`);
  if(team.representative!==user)throw new Error(`当前账号 ${user} 不是 ${groupKey} 的登记提交代表。`);
  return {login:user,lesson:lessonKey,group:groupKey,prefix:`submissions/${lessonKey}/${groupKey}/`,slug:`${lessonKey}/${groupKey}`,title:`[练习${lessonKey.slice(-2)}][第${groupKey.slice(-2)}组] ${user}`};
}
export function parseSubmissionBranch(branch){
  if(typeof branch!=='string')return null;
  const match=branch.match(/^aibt\/([a-z\d-]+)\/(lesson-\d{2})\/(group-\d{2})(?:-r([1-9]\d?))?$/);
  if(!match)return null;
  try{
    if(lessonId(match[2])!==match[2]||groupId(match[3])!==match[3])return null;
    const revision=match[4]?Number(match[4]):1;
    if(match[4]&&revision<2)return null;
    return {login:normalizeLogin(match[1]),lesson:match[2],group:match[3],revision};
  }catch{return null;}
}
export async function readCourseConfig(api,ref='main'){
  let file;
  try{file=await api(`/repos/${COURSE}/contents/course.json?ref=${encodeURIComponent(ref)}`);}
  catch(error){if(error.status===404)throw new Error('老师仓库尚未提供新版 course.json，请等待分组提交更新合并。');throw error;}
  if(file?.encoding!=='base64'||typeof file.content!=='string')throw new Error('无法读取老师的课程登记。');
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
    return pr.state==='open'&&parsed?.lesson===target.lesson&&parsed.group===target.group;
  });
}

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
  if(!entries.length||entries.length>MAX_FILES)throw new Error('每组每个练习最多 200 个作品文件。');
  let total=0;
  for(const entry of entries){
    if(entry.type!=='blob'||!['100644','100755'].includes(entry.mode)||!validWorkPath(entry.path.slice(prefix.length)))throw new Error('作品含不支持路径、隐藏配置或符号链接。');
    if(!Number.isSafeInteger(entry.size)||entry.size<0||entry.size>MAX_FILE)throw new Error('作品单个文件超过 20 MiB 或大小无法确认。');
    total+=entry.size;
  }
  if(total>MAX_TOTAL)throw new Error('本组本练习的作品总计超过 50 MiB。');
  if(requireReadme&&!entries.some(entry=>entry.path===prefix+'README.md'))throw new Error('本组作品根目录缺少 README.md。');
  return {files:entries.length,totalBytes:total};
}
export function validateSubmission({config,pr,files,tree,openPulls=[]}){
  if(pr.base?.ref!=='main'||pr.base.repo?.full_name!==COURSE)throw new Error('PR 必须指向老师课程的 main。');
  if(pr.labels?.some(label=>(typeof label==='string'?label:label.name)==='course-maintenance'))return {kind:'maintenance',note:'老师已标记课程维护，请人工审阅全部差异。'};
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
    target=submissionTarget(config,{login,lesson:parsed.lesson,group:parsed.group});
    if(pr.title!==target.title)throw new Error(`PR 标题请统一为：${target.title}`);
    if(matchingGroupPulls(openPulls,target).some(other=>other.number!==pr.number))throw new Error('本组本练习已有其他打开的 PR，请处理重复提交。');
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
  return {kind:testBranch?'connection-test':'submission',login,lesson:target.lesson??null,group:target.group??null,...checked};
}

function markdownText(value){
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/[\\`*_[\]|]/g,'\\$&');
}
export function renderOverview({config,tree,prs}){
  const roster=validateConfig(config);
  if(!tree||tree.truncated||!Array.isArray(tree.tree))throw new Error('远端目录树被截断，不能生成完整总览。');
  const lines=['# 课堂作品提交总览','','按练习编号、组号排序。待审或草稿表示已打开 PR，仍需查看检查结果并由老师审阅。','','| 练习 | 组别 | 提交代表 | 状态 | 已合并作品 | 提交单 |','|---|---|---|---|---|---|'];
  for(const lesson of roster.lessons){
    for(const group of roster.groups){
      const prefix=`submissions/${lesson.id}/${group.id}/`;
      const merged=tree.tree.some(entry=>entry.path===prefix+'README.md'&&entry.type==='blob');
      const pending=matchingGroupPulls(prs,{lesson:lesson.id,group:group.id});
      let state=group.representative?(merged?'已合并':'未交'):'待登记';
      if(pending.length>1)state='重复提交，待处理';
      else if(pending.length){
        const pr=pending[0],parsed=parseSubmissionBranch(pr.head.ref);
        const registered=group.representative===pr.user?.login?.toLowerCase()&&parsed.login===group.representative&&pr.head.repo?.full_name?.toLowerCase()===`${group.representative}/${REPO_NAME}`.toLowerCase()&&pr.base?.ref==='main'&&pr.base.repo?.full_name===COURSE;
        state=registered?(pr.draft?'草稿':'待审'):'代表身份待核对';
        if(merged)state+='（已有版本）';
      }
      const links=pending.map(pr=>`[PR #${Number(pr.number)}](https://github.com/${COURSE}/pull/${Number(pr.number)})`).join('、')||'—';
      const work=merged?`[查看作品](https://github.com/${COURSE}/tree/main/${prefix})`:'—';
      lines.push(`| ${lesson.id} | ${group.id} | ${group.representative?'@'+group.representative:'待登记'} | ${state} | ${work} | ${links} |`);
    }
  }
  if(!roster.groups.length)lines.push('','尚未配置组别，请老师先填写 course.json。');
  lines.push('','## 练习名称','',...roster.lessons.map(lesson=>`- ${lesson.id}：${markdownText(lesson.title)}`),'','连接测试与课程维护 PR 不计入作业。已关闭且未合并的 PR 不视为已收录。','');
  return lines.join('\n');
}
