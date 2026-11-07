#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {isMain} from '../skills/aibt-workshop/scripts/course.mjs';

const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export function runTests(root=ROOT,{stdio='inherit'}={}){
  const tests=fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>path.join(root,'tests',name));
  if(!tests.length)throw new Error('课程 tests 目录中没有测试。');
  const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio});
  if(result.error)throw result.error;
  return result.status??1;
}
if(isMain(import.meta.url))process.exitCode=runTests();
