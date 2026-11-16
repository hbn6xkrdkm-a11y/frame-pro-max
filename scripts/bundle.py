#!/usr/bin/env python3
"""Validate and stage the exact files that belong inside the widget."""
import argparse
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app'
CATALOG = Path('assets/art/manifest.json')
APP_ID = 'ArtSaver01.Gallery'
PACKAGE_ID = 'ArtSaver01'


def check():
    widget = ET.parse(APP / 'config.xml').getroot()
    tizen = '{http://tizen.org/ns/widgets}'
    entry = widget.find(tizen + 'application')
    assert entry is not None and entry.get('id') == APP_ID and entry.get('package') == PACKAGE_ID
    assert widget.find(tizen + 'profile').get('name') == 'tv-samsung'
    version = widget.get('version')
    assert re.fullmatch(r'\d+\.\d+\.\d+', version or ''), 'Expected MAJOR.MINOR.PATCH'
    fixed = [Path(file) for file in ('index.html', 'gallery.css', 'gallery.js', 'config.xml', 'assets/icon.png', 'LICENSE.txt')]
    files = fixed + [CATALOG]
    assert all((APP / path).is_file() for path in files), 'Missing widget source file'
    assert (APP / 'LICENSE.txt').read_bytes() == (ROOT / 'LICENSE').read_bytes(), 'Sync the packaged code license'
    paintings = json.loads((APP / CATALOG).read_text(encoding='utf-8'))
    assert isinstance(paintings, list) and paintings, 'Art catalog is empty'
    for art in paintings:
        assert all(isinstance(art.get(field), str) and art[field].strip()
                   for field in ('file', 'title', 'artist', 'credit', 'rights', 'source', 'image')), art
        assert re.fullmatch(r'[-\w]+\.jpg', art['file'], flags=re.ASCII), art['file']
        for field in ('source', 'image'):
            url = urlsplit(art[field])
            assert url.scheme == 'https' and url.hostname and not url.username, f'Invalid art link: {art[field]}'
        path = CATALOG.parent / art['file']
        assert path not in files, f'Duplicate art file: {path}'
        with (APP / path).open('rb') as image:
            assert image.read(3) == b'\xff\xd8\xff', f'Invalid JPEG: {path}'
        files.append(path)
    assert set(files) - set(fixed) == {p.relative_to(APP) for p in (APP / CATALOG.parent).iterdir()}, 'Untracked art file'
    assert all(not (APP / p).is_symlink() for p in files), 'Widget files must not be symlinks'
    return version, sorted(files)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--version', action='store_true')
    mode.add_argument('--stage', type=Path)
    mode.add_argument('--output', type=Path, help='Path of reproducible unsigned ZIP')
    args = parser.parse_args()
    version, files = check()
    if args.version:
        print(version)
    elif args.stage:
        args.stage.mkdir(parents=True, exist_ok=False)
        for path in files:
            target = args.stage / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(APP / path, target)
    elif args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(args.output, 'w') as archive:
            for path in files:
                entry = zipfile.ZipInfo(path.as_posix(), (2026, 1, 1, 0, 0, 0))
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, (APP / path).read_bytes(), compress_type=zipfile.ZIP_DEFLATED)
        with zipfile.ZipFile(args.output) as archive:
            assert archive.testzip() is None
        print(args.output)
    else:
        print(f'Widget {version}: {len(files)} source files checked')


if __name__ == '__main__':
    main()
