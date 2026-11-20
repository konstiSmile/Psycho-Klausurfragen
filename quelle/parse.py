"""Liest den Abfragekatalog (Markdown) und schreibt data.js für die App."""
import json, re, sys

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding='utf-8').read()
part4 = text.split('## Teil 4')[1].split('## Teil 5')[0]
table = text.split('## Teil 5')[1]

FACH = {'Persönlichkeit': 'pers', 'Entwicklung': 'entw', 'Diagnostik': 'diag'}
blocks = re.split(r'\n#### ', part4)[1:]
qs = []
for b in blocks:
    head, body = b.split('\n', 1)
    m = re.match(r'\[(\d{4})-(\d{2})\] Klausur \d{4} · Frage (\d+) · (\w+)(?: · Markierungen: (.*))?$', head.strip())
    assert m, head
    year, nr, nr2, fach, marks = m.groups()
    assert int(nr) == int(nr2)
    q = re.search(r'\*\*Frage:\*\* (.*?)\n\n', body, re.S).group(1).strip()
    opts = {}
    for L in 'ABCD':
        mm = re.search(r'^- \*\*' + L + r'\)\*\* (.*)$', body, re.M)
        assert mm, (head, L)
        opts[L] = mm.group(1).strip()
    sol = re.search(r'A = (\w+) · B = (\w+) · C = (\w+) · D = (\w+)', body).groups()
    key = ''.join(L for L, s in zip('ABCD', sol) if s == 'RICHTIG')
    km = re.search(r'\*\*Schlüssel:\*\* (\w+) · \*\*Thema:\*\* (.*)$', body, re.M)
    assert km.group(1) == key, (head, key, km.group(1))
    hints = []
    hm = re.search(r'\*\*Hinweise:\*\*\n((?:- .*\n?)+)', body)
    if hm:
        for line in hm.group(1).strip().split('\n'):
            t, msg = re.match(r'- (\w+): (.*)', line).groups()
            hints.append([t, msg.strip()])
    qs.append({
        'id': f'{year}-{nr}', 'y': int(year), 'n': int(nr), 'f': FACH[fach],
        'q': q, 'o': [opts[L] for L in 'ABCD'], 'k': key, 't': km.group(2).strip(),
        'm': [x.strip() for x in marks.split(',')] if marks else [], 'h': hints,
    })

# Gegenprüfung mit Teil 5
rows = re.findall(r'^\| (\d{4}-\d{2}) \| (\w+) \| (\w+) \|', table, re.M)
assert len(rows) == 108 and len(qs) == 108
byid = {q['id']: q for q in qs}
for i, fach, key in rows:
    assert byid[i]['k'] == key, (i, key)
    assert byid[i]['f'] == FACH[fach], i
cnt = [sum(1 for q in qs if len(q['k']) == n) for n in (1, 2, 3, 4)]
assert cnt == [25, 42, 31, 10], cnt
for f in FACH.values():
    assert sum(1 for q in qs if q['f'] == f) == 36

open(out, 'w', encoding='utf-8').write(
    '// Automatisch erzeugt aus dem Abfragekatalog. Nicht von Hand ändern.\n'
    'const QUESTIONS = ' + json.dumps(qs, ensure_ascii=False, indent=0) + ';\n')
print('ok', len(qs), cnt)
