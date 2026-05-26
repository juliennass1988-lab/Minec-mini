# MiniBlock Walker

Ein kleines blockiges Webgame zum Hochladen bei GitHub.

## Inhalt

- `index.html` — Startdatei
- `styles.css` — Mobile-first UI
- `game.js` — Spiellogik, Canvas-Rendering, Steuerung

## Steuerung

- Links/Rechts: `A`, `D` oder Pfeiltasten
- Springen: `Leertaste`, `W` oder Pfeil hoch
- Auf dem Handy: Buttons unten benutzen

## Start lokal

Einfach `index.html` im Browser öffnen.

Alternativ im Ordner starten:

```bash
python3 -m http.server 5173
```

Dann im Browser öffnen:

```text
http://localhost:5173
```

## Deployment

Für GitHub Pages oder Vercel reicht es, diese Dateien ins Repository zu laden.
Es gibt keine externen Assets und keine Build-Abhängigkeiten.

Hinweis: Das Projekt nutzt einen eigenen blockigen Look. Es enthält keine Minecraft-/Mojang-Assets.
