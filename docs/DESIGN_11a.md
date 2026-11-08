# Lares 11a — the design

The mockup is `docs/mockup-11a.html`: one self-contained page on a made-up
house (no real space, thing, vendor or work), no font, script or image from
the network. Open it on the phone, tap through, and use **Design** (top
right) to switch the options below. Nothing in it is wired to the real app.
Lares 11b builds whatever N. picks here; every rule Lares has today stays.

## The structure

Three tabs at the bottom, one job each:

| Tab | What it answers | What's on it |
|---|---|---|
| **Due** | What needs doing? | A count strip (overdue · due now · things), then the needs grouped **Overdue · Due now · Coming up**, each with its thing, space, who and a **Done** button. A badge on the tab counts what's overdue. |
| **Spaces** | Where is everything? | A search field, then a two-column grid of spaces, each with an icon, its count and a status pill ("1 overdue", "All good"). Tap a space → its page; tap a thing → its page. |
| **Art** | The collection | The works grouped by the space they hang in, "To place" last; a work's page shows its fields read-only. The no-copy-out promise is stated on the screen. |

- **A thing has its own page**, not a box that unfolds in the list: a
  header (name, kind, space), **Needs** (each with its status and Done, and
  "Add a need"), **Repair** (manual link, error codes, parts, warranty) and
  Edit · Move · Delete.
- **Adding is one button**, the **+** at the bottom right of Spaces and of a
  space's page. It opens a sheet with one field and the mic hint: say a room
  from Spaces, say things inside a space.
- **The two importers** (the art file, an import list) move out of the main
  screens to a "More" sheet; they're used once in a while.
- **Statuses read in words, not dates**: "This month", "Since October",
  "5 days late", "Never done", following the month rule (Lares 2).

## The look

Three looks to try, each with the same layout:

- **Hearth**: from the Lares icon: warm cream, plum, an amber flame for
  "due now". Calm and homely.
- **Night**: the same in dark plum, amber as the accent. Good at night.
- **Garden**: light, fresh green on off-white.

Plus **Roomy / Compact** density and **Sans / Serif** headings.

## Open points (N. answers; Claude's recommendation; the default stands from 2026-11-10 unless N. changes it)

1. **The tabs: Due · Spaces · Art?**: Claude recommends yes. Three is
   the most a thumb finds without looking; locks (Lares 6) and anything
   later live inside Spaces, not as new tabs.
2. **The first screen: Due or Spaces?**: Claude recommends **Due**: it
   is what the house agent is for, and an empty Due ("The house is in
   order") is a pleasant thing to open to.
3. **The look**: Claude recommends **Hearth**, with **Night** following
   the phone's dark mode automatically, so it is one choice, not two.
4. **Density and headings**: Claude recommends **Roomy** and **Sans**.
   Roomy is easier to hit with a thumb; serif headings are warmer but
   compete with the plum headers.
5. **Search on Spaces**: in the mockup it is a placeholder. Claude
   recommends building it in 11b (it finds a thing or a room by name as you
   type): with art and imported lists, the house will soon be more than a
   screen.
6. **Space icons**: guessed from the name (kitchen, bath, garden, …) with a
   plain one otherwise. Claude recommends that, with no icon picker (one
   less thing to set).

## Out of 11b (deferred)

A thing's photo; sorting or reordering spaces by hand; a home-screen widget;
anything that needs the network. Each is a story of its own if it earns one.
