import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

test('course test runner never discovers or executes student submission tests',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-runner-'));
  try{
    await fs.mkdir(path.join(root,'tests'));
    await fs.mkdir(path.join(root,'submissions/lesson-01/group-03/individual/student'),{recursive:true});
    await fs.writeFile(path.join(root,'tests/course.test.mjs'),"import test from 'node:test'; test('course',()=>{});");
    await fs.writeFile(path.join(root,'submissions/lesson-01/group-03/individual/student/demo.test.mjs'),"import fs from 'node:fs'; fs.writeFileSync('executed-student-code','bad'); throw new Error('Student test must not execute');");
    const runner=await import('../tools/run-tests.mjs').catch(()=>null);
    assert.ok(runner,'missing safely scoped course test runner');
    assert.equal(runner.runTests(root,{stdio:'pipe'}),0);
    await assert.rejects(fs.access(path.join(root,'executed-student-code')),error=>error.code==='ENOENT');
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
