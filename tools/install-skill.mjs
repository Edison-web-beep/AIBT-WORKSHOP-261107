#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2), options={};
while(args.length){const key=args.shift();if(!['--ide','--workspace'].includes(key)||!args.length)throw new Error('用法：node tools/install-skill.mjs --ide qoder|codex|claude --workspace <專案絕對路徑>');options[key.slice(2)]=args.shift();}
const roots={qoder:'.qoder/skills',codex:'.agents/skills',claude:'.claude/skills'};
if(!roots[options.ide]||!options.workspace||!path.isAbsolute(options.workspace))throw new Error('需指定 IDE 與專案絕對路徑；WorkBuddy 請匯入 ZIP。');
const workspace=await fs.realpath(options.workspace);
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skills/aibt-workshop');
const destination=path.join(workspace,roots[options.ide],'aibt-workshop');
// Refuse any symlink/reparse point in the destination chain.
let current=workspace;
for(const segment of (roots[options.ide]+'/aibt-workshop').split('/')){
  current=path.join(current,segment);
  try{if((await fs.lstat(current)).isSymbolicLink())throw new Error('安裝目標含符號連結，請改用一般專案資料夾。');}catch(error){if(error.code!=='ENOENT')throw error;}
}
try{await fs.access(destination);throw new Error('此專案已安裝 aibt-workshop；請先檢查既有版本，避免覆蓋。');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
console.log(JSON.stringify({installed:destination,next:'重新開啟 IDE／對話後，輸入：使用 aibt-workshop，幫我初始化課程並完成首次連線測試。'},null,2));
