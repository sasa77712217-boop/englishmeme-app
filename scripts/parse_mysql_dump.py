from __future__ import annotations
import json
import re
from pathlib import Path

SQL_PATH = Path('/home/ubuntu/englishmeme-review/source/if0_42713979_englishv2.sql')
OUT_PATH = Path('/home/ubuntu/englishmeme/scripts/migrated_content.json')


def parse_value(text: str):
    text = text.strip()
    if text.upper() == 'NULL':
        return None
    if text.startswith("'") and text.endswith("'"):
        body = text[1:-1]
        out = []
        i = 0
        escapes = {'n': '\n', 'r': '\r', 't': '\t', '0': '\0', '\\': '\\', "'": "'", '"': '"'}
        while i < len(body):
            if body[i] == '\\' and i + 1 < len(body):
                i += 1
                out.append(escapes.get(body[i], body[i]))
            else:
                out.append(body[i])
            i += 1
        return ''.join(out)
    if re.fullmatch(r'-?\d+', text):
        return int(text)
    return text


def split_row(row: str):
    values, current = [], []
    quoted, escaped = False, False
    for char in row:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == '\\' and quoted:
            current.append(char)
            escaped = True
            continue
        if char == "'":
            quoted = not quoted
            current.append(char)
            continue
        if char == ',' and not quoted:
            values.append(parse_value(''.join(current)))
            current = []
        else:
            current.append(char)
    values.append(parse_value(''.join(current)))
    return values


def rows_for(table: str):
    source = SQL_PATH.read_text(errors='replace')
    match = re.search(rf"INSERT INTO `{re.escape(table)}` \((.*?)\) VALUES\s*(.*?);", source, re.S)
    if not match:
        return [], []
    columns = [column.strip().strip('`') for column in match.group(1).split(',')]
    block = match.group(2)
    rows = []
    current, depth, quoted, escaped = [], 0, False, False
    for char in block:
        if escaped:
            current.append(char); escaped = False; continue
        if char == '\\' and quoted:
            current.append(char); escaped = True; continue
        if char == "'":
            quoted = not quoted; current.append(char); continue
        if not quoted and char == '(':
            depth += 1
            if depth == 1: current = []
            else: current.append(char)
        elif not quoted and char == ')':
            depth -= 1
            if depth == 0: rows.append(split_row(''.join(current)))
            else: current.append(char)
        elif depth > 0:
            current.append(char)
    return columns, [dict(zip(columns, row)) for row in rows]


def main():
    _, levels = rows_for('difficulties')
    _, memes = rows_for('memes')
    _, users = rows_for('users')
    _, progress = rows_for('user_progress')
    _, level_progress = rows_for('level_progress')
    # Password hashes and email-token data are deliberately excluded.
    payload = {
        'levels': levels,
        'cards': memes,
        'legacy_accounts': [{k: row.get(k) for k in ('id', 'name', 'email', 'is_verified', 'role', 'created_at')} for row in users],
        'legacy_progress': progress,
        'legacy_level_progress': level_progress,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(json.dumps({key: len(value) for key, value in payload.items()}))


if __name__ == '__main__':
    main()
