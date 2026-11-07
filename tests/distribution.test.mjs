import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');

test('Qoder project install keeps shared scripts and runs in a Unicode path, refusing overwrite',async()=>{
  const workspace=await fs.mkdtemp(path.join(os.tmpdir(),'aibt 课堂 项目-'));
  try{
    const installer=path.join(root,'tools/install-skill.mjs');
    execFileSync(process.execPath,[installer,'--ide','qoder','--workspace',workspace]);
    const installed=path.join(workspace,'.qoder/skills/aibt-workshop');
    await fs.access(path.join(installed,'scripts/course.mjs'));
    await fs.access(path.join(installed,'references/transports.md'));
    const help=JSON.parse(execFileSync(process.execPath,[path.join(installed,'scripts/workshop.mjs'),'help'],{encoding:'utf8'}));
    assert.equal(help.version,'2.1.0');
    const before=await fs.readFile(path.join(installed,'SKILL.md'));
    assert.throws(()=>execFileSync(process.execPath,[installer,'--ide','qoder','--workspace',workspace],{stdio:'pipe'}),/已安装/);
    assert.deepEqual(await fs.readFile(path.join(installed,'SKILL.md')),before);
  }finally{await fs.rm(workspace,{recursive:true,force:true});}
});
test('WorkBuddy ZIP is standalone, byte-for-byte complete, reproducible and has a valid SHA-256',async()=>{
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'aibt-workbuddy-'));
  try{
    const packager=path.join(root,'tools/package-skill.py');
    execFileSync(python,[packager,'--output-dir',output],{stdio:'pipe'});
    const zip=path.join(output,'aibt-workshop.zip');
    const first=await fs.readFile(zip),sha=createHash('sha256').update(first).digest('hex');
    assert.equal((await fs.readFile(path.join(output,'SHA256SUMS.txt'),'utf8')).trim(),sha+'  aibt-workshop.zip');
    execFileSync(python,[packager,'--output-dir',output],{stdio:'pipe'});
    assert.deepEqual(await fs.readFile(zip),first);
    execFileSync(python,['-c',`
import sys, zipfile
from pathlib import Path
archive, source, dest = map(Path, sys.argv[1:])
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    expected = {p.relative_to(source).as_posix(): p.read_bytes() for p in source.rglob('*') if p.is_file()}
    assert set(z.namelist()) == {'aibt-workshop/' + name for name in expected}
    for name, data in expected.items():
        assert z.read('aibt-workshop/' + name) == data
    z.extractall(dest)
`,zip,path.join(root,'skills/aibt-workshop'),output]);
    const help=JSON.parse(execFileSync(process.execPath,[path.join(output,'aibt-workshop/scripts/workshop.mjs'),'help'],{encoding:'utf8'}));
    assert.equal(help.version,'2.1.0');
  }finally{await fs.rm(output,{recursive:true,force:true});}
});
