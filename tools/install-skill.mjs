#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2), options={};
while(args.length){const key=args.shift();if(!['--ide','--workspace'].includes(key)||!args.length)throw new Error('用法：node tools/install-skill.mjs --ide qoder|codex|claude --workspace <项目绝对路径>');options[key.slice(2)]=args.shift();}
const roots={qoder:'.qoder/skills',codex:'.agents/skills',claude:'.claude/skills'};
if(!roots[options.ide]||!options.workspace||!path.isAbsolute(options.workspace))throw new Error('需指定 IDE 与项目绝对路径；WorkBuddy 请导入 ZIP。');
const workspace=await fs.realpath(options.workspace);
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skills/aibt-workshop');
const destination=path.join(workspace,roots[options.ide],'aibt-workshop');
// Refuse any symlink/reparse point in the destination chain.
let current=workspace;
for(const segment of (roots[options.ide]+'/aibt-workshop').split('/')){
  current=path.join(current,segment);
  try{if((await fs.lstat(current)).isSymbolicLink())throw new Error('安装目标含符号链接，请改用一般项目文件夹。');}catch(error){if(error.code!=='ENOENT')throw error;}
}
try{await fs.access(destination);throw new Error('此项目已安装 aibt-workshop；请先检查已有版本，避免覆盖。');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
console.log(JSON.stringify({installed:destination,next:'重新打开 IDE／对话后，输入：使用 aibt-workshop，帮我初始化课程并完成首次连接测试。'},null,2));
