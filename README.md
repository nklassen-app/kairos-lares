# Lares

The house twin's first stage: a list of the spaces in the house and the
things in each one, kept on the phone only. It is not yet the house agent,
a maintenance planner or an inventory with values: those come in later
stories (Lares 2–6 in `kairos-system/BACKLOG.md`). The design is
`kairos_v3/kairos-system/docs/DESIGN_NOTE_house_twin.md`.

Local-first single page, no build step, no dependencies, no account. Hosted on
GitHub Pages and wrapped in a Capacitor shell for the phone, the same way as
The Floor (`kairos-floor`) and Whiteboard (`kairos-whiteboard`). Scaffolded
from `kairos-foundation/templates/phone-app`.

## The rules

1. A space is a room or area; a thing sits in exactly one space. Name,
   kind and space are enough to save a thing.
2. A space can be removed only when it is empty; deleting a thing asks first.
3. The repo holds code and made-up test data only, never a real thing in
   the house. No copy-out exists.
4. State is one JSON document in `localStorage` under `lares:v1`, on one
   device. No backup, no sync.

## Run locally

Serve the folder over HTTP (service workers don't register from `file://`):

```sh
python3 -m http.server 8080          # then open http://<this machine's LAN IP>:8080 on the phone
```

## Test

```sh
cd tests && npm install && npm test  # DOM-level: index.html booted in jsdom under node's test runner
```

## Deploy

Create the **public** repo `nklassen-app/kairos-lares` (Foundation Charter Part 7,
the public-repo rule — content-read before every push), push `main`, enable
GitHub Pages from `main` / root. The page is then at
<https://nklassen-app.github.io/kairos-lares/> and the phone shell points at it.
Bump `CACHE` in `sw.js` (`lares-vN`) **and** the `.ver` marker in
`index.html` with every content change, or the app keeps serving the stale page.

The Android shell lives in `native/`; see `native/README.md`. It only needs
building once, and rebuilding for shell changes (icon, app name, config).
