# Altklausuren Psycho 2

Private Abfrage-App für die Altklausuren Psychologie II (2020–2022), 108 Fragen.
Reine Web-App ohne Bibliotheken, Daten nur lokal im Browser (Schlüssel `psyklausur-v1`).

- `quelle/katalog.md` – Fragenkatalog (Quelle)
- `data.js` – daraus erzeugt (`python3 quelle/parse.py quelle/katalog.md data.js`)
- Bei jeder Änderung `CACHE` in `sw.js` und `?v=` in `index.html`/`sw.js` erhöhen.
