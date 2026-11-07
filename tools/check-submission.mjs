#!/usr/bin/env node
import {ghApi} from '../skills/aibt-workshop/scripts/workshop.mjs';
import {COURSE,readCourseConfig,listPullRequests,validateSubmission,isMain,isMaintenancePR} from '../skills/aibt-workshop/scripts/course.mjs';

export async function checkPullRequest(api,number){
  if(!Number.isSafeInteger(number)||number<1)throw new Error('请指定有效的 PR 编号。');
  const pr=await api(`/repos/${COURSE}/pulls/${number}`);
  if(isMaintenancePR(pr))return validateSubmission({pr});
  const config=await readCourseConfig(api,pr.base.sha);
  const files=[];
  for(let page=1;page<=3;page++){
    const batch=await api(`/repos/${COURSE}/pulls/${number}/files?per_page=100&page=${page}`);
    if(!Array.isArray(batch))throw new Error('无法完整读取 PR 文件。');
    files.push(...batch);
    if(batch.length<100)break;
  }
  const tree=await api(`/repos/${pr.head.repo.full_name}/git/trees/${pr.head.sha}?recursive=1`);
  const result=validateSubmission({config,pr,files,tree,openPulls:await listPullRequests(api,'open')});
  const latest=await api(`/repos/${COURSE}/pulls/${number}`);
  if(latest.head.sha!==pr.head.sha||latest.base.sha!==pr.base.sha)throw new Error('PR 在检查期间发生变化，请重新运行检查。');
  return result;
}
if(isMain(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=='--pr')throw new Error('用法：node tools/check-submission.mjs --pr <编号>');
  checkPullRequest(ghApi,Number(args[1])).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
