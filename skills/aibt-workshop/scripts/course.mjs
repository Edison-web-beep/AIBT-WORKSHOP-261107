// 与 helper 一起分发；仅使用 Node.js 标准库。
export const COURSE='f3484134/AIBT-WORKSHOP-261107';
export const REPO_NAME=COURSE.split('/')[1];

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
