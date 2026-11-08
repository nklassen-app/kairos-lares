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

## The screens (Lares 11b, the design N. picked in 11a: `docs/DESIGN_11a.md`)

Three tabs at the bottom; it opens on **Due**.
- **Due**: a count strip (overdue · due now · things), then the needs
  grouped Never done · Overdue · Due now · Coming up, each with Done; the
  tab's badge counts what is overdue. Tapping a row opens its thing.
- **Spaces**: a search field (rooms and things by name, as you type) and a
  tile per space with its status. A tile opens the space's page (its
  things, "Add things", Delete space); a thing opens its own page (name,
  kind, space, needs with Done, repair facts, Save · Cancel · Delete).
  The **+** opens the Add sheet (say a room) on Spaces, and focuses "Add
  things" on a space's page.
- **Art**: the works by the space they are in; a work's page shows its
  fields read-only, and says it never leaves the phone.
- **More** (⋯, top right): the two importers and the version (`lares-vN`).

The look is Hearth (the icon's plum, cream and amber), Night when the phone
is in dark mode; compact, system sans. No font, icon or image from the
network: icons are inline SVG.

## The rules

1. A space is a room or area; a thing sits in exactly one space. Name,
   kind and space are enough to save a thing.
2. Removing a space removes its things; when it has any, it asks first and
   names the count. Deleting a thing asks first; a tap on a thing opens it
   (rename, kind, space, delete).
3. Say a room (Lares 7): "Kitchen has a dishwasher, a fridge and an oven"
   in the Add sheet (the + on Spaces) makes or finds the space and adds one thing per item;
   a list in a space's field adds every item. Speech comes from the phone's
   keyboard; the page only splits text (commas, "and", sentence ends) and
   guesses kinds from a word list. A count makes one numbered thing each
   ("two chairs" → Chair 1, Chair 2; above 12 it stays one thing); a clause
   that only describes ("these are…", "it is…") is skipped and named in the
   status line; a count in the Add sheet ("5 locks: …") is not a room, so
   nothing is added. No model, no outbound call.
4. The repo holds code and made-up test data only, never a real thing in
   the house. No copy-out exists (a test pins that the page has no export,
   share, clipboard, download or network call).
5. The art collection (Lares 3): "Import art file" (under More, ⋯) reads `artworks.json`
   (`{ works: [...] }`) on the phone. Each work becomes a thing of kind art
   with every field kept as it came, shown read-only when it is opened. A
   work goes to the space its `location` names, else to "Art to place"; a
   second import updates each work by its `id`. The art list is Crown jewels:
   it lives in this phone's browser only, and its tests use made-up works.
6. What each thing needs (Lares 2): a thing's editor holds its needs (what,
   every N days/weeks/months/years, who does it) and its repair facts
   (manual link, error codes, parts, warranty end). The due list at the top
   shows every need that was never done, is overdue, or falls due within 14
   days, soonest first; "Done" marks it done today. A need in months or years
   falls in a month (N., 2026-11-07): it is "due this month" for that whole
   month and "overdue since <month>" only from the 1st of the next, and shows
   from 14 days before its month starts. A need in days or weeks falls on a
   day. The manual is a link only
   when it is a web address.
7. An import list (Lares 9): "Import a list" (under More, ⋯) takes a JSON list drafted in a
   session, `{ spaces: [{ name, things: [{ name, kind, needs: [{ what, every,
   unit, who, last }], repair }] }] }`. Spaces and things are matched by name
   (any case) and needs by what, so nothing is duplicated and pasting twice
   changes nothing; a matched need keeps when it was last done unless the
   list says. An import never makes art or touches an art record. The lists
   themselves hold the house's things, so they are never committed.
8. State is one JSON document in `localStorage` under `lares:v1`, on one
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
Bump `CACHE` in `sw.js` (`lares-vN`) **and** the `.ver` marker (shown under More) in
`index.html` with every content change, or the app keeps serving the stale page.

The Android shell lives in `native/`; see `native/README.md`. It only needs
building once, and rebuilding for shell changes (icon, app name, config).
