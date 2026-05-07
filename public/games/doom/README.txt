DOOM bundle goes here.

To enable DOOM, drop a `doom.jsdos` file in this folder. The file is a zip
archive containing dosbox.conf + DOOM1.WAD + DOOM.EXE.

Easiest path: run `node scripts/build-doom-bundle.mjs path/to/DOOM1.WAD path/to/DOOM.EXE`
from the repo root. That script writes `public/games/doom/doom.jsdos` for you.

Sources:
- DOOM1.WAD shareware (id Software, freely redistributable):
    https://github.com/freedoom/freedoom or any DOS Doom shareware mirror
- DOOM.EXE: ditto
- Or use a Freedoom Phase 1 WAD (open-source replacement, fully free).
