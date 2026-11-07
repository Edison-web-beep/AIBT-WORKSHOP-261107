#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {ghApi} from '../skills/aibt-workshop/scripts/workshop.mjs';
import {COURSE,readCourseConfig,listPullRequests,renderOverview,isMain} from '../skills/aibt-workshop/scripts/course.mjs';

export async function buildOverview(api=ghApi){
  const ref=await api(`/repos/${COURSE}/git/ref/heads/main`);
  const config=await readCourseConfig(api,ref.object.sha);
  const tree=await api(`/repos/${COURSE}/git/trees/${ref.object.sha}?recursive=1`);
  return renderOverview({config,tree,prs:await listPullRequests(api,'open')});
}
if(isMain(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length&&!(args.length===2&&args[0]==='--output'))throw new Error('用法：node tools/build-overview.mjs [--output <报告路径>]');
  buildOverview().then(async markdown=>{if(args.length)await fs.writeFile(path.resolve(args[1]),markdown,'utf8');else process.stdout.write(markdown);}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
