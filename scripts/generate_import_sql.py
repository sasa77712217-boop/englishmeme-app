from __future__ import annotations
import json
from pathlib import Path

root = Path('/home/ubuntu/englishmeme')
data = json.loads((root / 'scripts/migrated_content.json').read_text())

def q(value):
    if value is None: return 'null'
    if isinstance(value, bool): return 'true' if value else 'false'
    if isinstance(value, (int, float)): return str(value)
    text = str(value).replace('\\', '\\\\').replace("'", "''")
    return "'" + text + "'"

def date(value):
    return q(value) if value else 'null'

canonical = {'Principiante', 'Medio', 'Avanzado', 'Experto'}
levels_by_name = {row['name']: row for row in data['levels']}
for name in canonical:
    if name not in levels_by_name:
        levels_by_name[name] = {'id': None, 'name': name, 'difficulty_label': 'General', 'description': '', 'sort_order': len(levels_by_name)+1, 'max_cards': 35, 'is_active': 1}

level_lines = ["insert into public.levels (legacy_name,name,difficulty_label,description,sort_order,max_cards,is_active) values"]
level_values = []
for row in sorted(levels_by_name.values(), key=lambda x: (x.get('sort_order', 999), x['name'])):
    name = row['name']
    active = True if name in canonical else bool(row.get('is_active'))
    max_cards = max(10, min(35, int(row.get('max_cards') or 35)))
    level_values.append('(' + ','.join([q(name), q(name), q(row.get('difficulty_label') or 'General'), q(row.get('description') or ''), str(int(row.get('sort_order') or 0)), str(max_cards), q(active)]) + ')')
level_lines.append(',\n'.join(level_values))
level_lines.append('on conflict (name) do update set difficulty_label=excluded.difficulty_label, description=excluded.description, sort_order=excluded.sort_order, max_cards=excluded.max_cards, is_active=excluded.is_active;')

card_lines = ["insert into public.learning_cards (legacy_id,level_id,phrase,translation,explanation,topic,image_path,exercise_type,correct_answer,options,is_published) values"]
card_values = []
for row in data['cards']:
    options = [row.get('option_a'), row.get('option_b'), row.get('option_c')]
    options = [str(x) for x in options if x not in (None, '')]
    image = row.get('image_path')
    if image:
        image = '/legacy-images/' + str(image).rsplit('/', 1)[-1]
    # The dump is a live backup where many valid cards were temporarily unpublished.
    # Keep every content card available in the new isolated migration; admin can retire it later.
    values = [row['id'], f"(select id from public.levels where name={q(row['level'])})", q(row.get('phrase') or ''), q(row.get('translation') or ''), q(row.get('explanation') or ''), q(row.get('topic') or ''), q(image), q(row.get('exercise_type') or 'multiple_choice'), q(row.get('correct_answer') or ''), "array[" + ','.join(q(x) for x in options) + "]::text[]", 'true']
    card_values.append('(' + ','.join(map(str, values)) + ')')
card_lines.append(',\n'.join(card_values))
card_lines.append('on conflict (legacy_id) do update set level_id=excluded.level_id, phrase=excluded.phrase, translation=excluded.translation, explanation=excluded.explanation, topic=excluded.topic, image_path=excluded.image_path, correct_answer=excluded.correct_answer, options=excluded.options, is_published=excluded.is_published;')

account_lines = ["insert into public.legacy_accounts (legacy_id,name,email,role,is_verified,points,current_streak,last_activity,created_at) values"]
account_values = []
progress = {int(row['user_id']): row for row in data['legacy_progress']}
for row in data['legacy_accounts']:
    p = progress.get(int(row['id']), {})
    account_values.append('(' + ','.join([str(row['id']), q(row.get('name') or ''), q(row.get('email') or ''), q(row.get('role') or 'user'), q(bool(row.get('is_verified'))), str(int(p.get('points') or 0)), str(int(p.get('current_streak') or 0)), date(p.get('last_activity')), date(row.get('created_at'))]) + ')')
account_lines.append(',\n'.join(account_values))
account_lines.append('on conflict (legacy_id) do update set name=excluded.name, email=excluded.email, role=excluded.role, is_verified=excluded.is_verified, points=excluded.points, current_streak=excluded.current_streak, last_activity=excluded.last_activity;')

level_progress_lines = ["insert into public.legacy_level_progress (legacy_user_id,level_name,completed,last_score,best_score,attempts,completed_at) values"]
level_progress_values = []
for row in data['legacy_level_progress']:
    level_progress_values.append('(' + ','.join([str(row['user_id']), q(row['level']), q(bool(row.get('completed'))), str(int(row.get('last_score') or 0)), str(int(row.get('best_score') or 0)), str(int(row.get('attempts') or 0)), date(row.get('completed_at'))]) + ')')
level_progress_lines.append(',\n'.join(level_progress_values))
level_progress_lines.append('on conflict (legacy_user_id,level_name) do update set completed=excluded.completed,last_score=excluded.last_score,best_score=excluded.best_score,attempts=excluded.attempts,completed_at=excluded.completed_at;')

# The full exercise history is preserved without tying it to new auth UUIDs yet.
# The importer intentionally reads only the fields needed for migration.
source = (Path('/home/ubuntu/englishmeme-review/source/if0_42713979_englishv2.sql')).read_text(errors='replace')
# Use the parser module for rows without duplicating its logic.
import sys
sys.path.insert(0, str(root / 'scripts'))
from parse_mysql_dump import rows_for
_, exercise_rows = rows_for('exercise_results')
exercise_lines = ["insert into public.legacy_exercise_results (legacy_id,legacy_user_id,legacy_card_id,answer,is_correct,created_at) values"]
exercise_values = []
for row in exercise_rows:
    exercise_values.append('(' + ','.join([str(row['id']), str(row['user_id']), str(row['meme_id']), q(row.get('answer') or ''), q(bool(row.get('is_correct'))), date(row.get('created_at'))]) + ')')
exercise_lines.append(',\n'.join(exercise_values))
exercise_lines.append('on conflict (legacy_id) do update set answer=excluded.answer,is_correct=excluded.is_correct,created_at=excluded.created_at;')

(root / 'supabase/migrations/20261022061000_englishmeme_import.sql').write_text('\n\n'.join(['\n'.join(level_lines), '\n'.join(card_lines), '\n'.join(account_lines), '\n'.join(level_progress_lines), '\n'.join(exercise_lines)]))
print('generated', len(level_values), 'levels', len(card_values), 'cards', len(account_values), 'accounts', len(exercise_values), 'exercise results')
