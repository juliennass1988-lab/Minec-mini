# MiniBlock 3D Walker

Eine sehr kleine 3D-Voxel-Webgame-Demo zum Hochladen bei GitHub oder Vercel.

## Inhalt

- Blockige 3D-Figur aus Cubes
- Grüne Voxel-Blöcke
- Laufen und Springen
- Kamera folgt der Figur
- Tastatursteuerung und Mobile-Touch-Buttons
- Keine Minecraft-/Mojang-Assets, eigener blockiger Stil

## Steuerung

Desktop:

- `WASD` oder Pfeiltasten: laufen
- `Leertaste`: springen

Mobile:

- D-Pad links
- Springen-Button rechts

## GitHub / Vercel

Einfach alle Dateien in ein GitHub-Repo hochladen.

Für Vercel:

- Framework Preset: `Other`
- Build Command: leer lassen
- Output Directory: `./`

## Hinweis

Das Projekt nutzt Three.js über CDN:

```html
https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js
```

Dadurch braucht das Projekt keinen npm-Build.
