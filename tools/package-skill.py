#!/usr/bin/env python3
"""使用标准库生成 Qoder/WorkBuddy 共用的可重复 Skill 包。"""
import argparse
import hashlib
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir', type=Path, default=root / 'downloads')
options = parser.parse_args()
source = root / 'skills' / 'aibt-workshop'
options.output_dir.mkdir(parents=True, exist_ok=True)
archive = options.output_dir / 'aibt-workshop.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for file in sorted(source.rglob('*')):
        if file.is_symlink():
            raise ValueError('Skill 包不能含符号链接')
        if not file.is_file() or any(part.startswith('.') for part in file.relative_to(source).parts):
            continue
        name = 'aibt-workshop/' + file.relative_to(source).as_posix()
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 7, 0, 0, 0))
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        package.writestr(info, file.read_bytes(), compresslevel=9)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(options.output_dir / 'SHA256SUMS.txt').write_text(digest + '  aibt-workshop.zip\n', encoding='utf-8')
print('已生成 aibt-workshop.zip 和 SHA256SUMS.txt')
