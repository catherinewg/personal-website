# Catherine Wang — personal site

Static HTML/CSS/JS. No build step, no dependencies, no npm. Open
`index.html` in a browser and it runs.

```bash
open /Users/catherinewang/Desktop/Claude/index.html
```

## Files

```
index.html     Home — hero, premise, timeline, philosophy, writing, contact
work.html      Dripos case study, briefs and reports
writing.html   Briefs archive + essay template
media.html     Reference library (film, photography, reading)
about.html     Bio, three pillars, particulars, process
css/style.css  The entire design system — numbered sections, read top to bottom
js/main.js     Scroll, timeline, reveals, drawer, shelves
assets/img/    Your photography goes here
```

## Design direction

**Palette — neutral bone, forest green, Kodak gold.**

The base is a neutral bone (`--paper: #F1EFE8`), deliberately less peachy
than a sand base. **Forest green (`--forest`) is the single primary accent**
and carries every interface job: nav state, timeline rail and nodes, italic
emphasis, hover, text selection, focus rings.

Terracotta and gold are secondary and used *rarely on purpose* — three and
eight occurrences respectively, against nineteen for forest. This ratio is
the whole point. An earlier version had terracotta doing all nineteen jobs
and it read cheap; no hue survives that much load. If either accent starts
appearing everywhere, the palette is broken.

Where the two secondaries are allowed:

- **Terracotta** — the wordmark dot (one warm mark per page), and declining
  figures in data tables, where it carries meaning rather than decoration
- **Gold** — accents inside dark sections only, where forest would vanish

**Kodak Gold lives in the photography, not the interface.** The placeholder
gradients run golden highlights into green-cast shadows, which is that film
stock's actual signature — the highlight-to-shadow crossover, not orange
saturation. Warmth comes from imagery and grain; the UI colour stays cool
and green.

**Type — understated in size, bold in weight.** Newsreader for display,
Inter for body. Headings are set at **600** with tight tracking and held
small (hero caps at `4.7rem`, down from `10.5rem` in the first draft);
authority comes from weight, not scale. The one exception is `.mega` at 500
— at hero size, 600 turns blunt and loses the old-style serif's modelling.
No monospace anywhere: a mono label reads engineering, and this is editorial.

**References, and what each one contributed**

| Reference | What it drove |
|---|---|
| watchhouse.com | Colour — forest green on bone, black text, near-zero orange |
| indexventures.com | People-centric hero — portrait is structural, claim is first-person |
| getty.edu/tracingart | The timeline: rail, fill, nodes lighting as you descend |
| elenamiska.com | Restraint — smaller type, fewer effects, more air |

**Philosophy placement.** Mid-page on the home page, below the work; full
treatment on About. Findable in one scroll, never the first thing you meet.

## Editing

### Colours

Everything is a custom property at the top of `css/style.css` (section 01):

```css
--paper:       #F1EFE8;   /* page background — neutral bone */
--sand:        #DAD3C1;   /* tinted section bands, placeholder base */
--ink:         #14150F;   /* body text — near-black, faint green cast */
--forest:      #24382B;   /* PRIMARY accent — does all the work */
--shadow:      #1B2620;   /* dark section background — deep forest */
--terracotta:  #A0533C;   /* rare: wordmark dot, declining figures */
--gold:        #C4923F;   /* rare: accents on dark sections only */
```

Change `--forest` and every accent on all five pages shifts at once — that's
the payoff of routing one job through one variable.

The `-2` / `-3` variants are lighter or darker siblings (`--ink-3` is the
warm grey used for secondary text). If you shift `--ink`, nudge those too or
contrast will drift.

Before adding a fourth accent, consider that the palette reads coherent
*because* it has one primary. Reach for a `--sand` surface or a weight
change first.

### Type weight and size

Both in section 01 and section 04. Headings are `font-weight: 600`; if you
want them heavier still, Newsreader goes to 800 (update the Google Fonts
URL in each HTML `<head>` to `300..800`). To make display type larger,
raise the third number in the relevant `--fs-*` clamp.

### The timeline

The spine of the site. Each entry is one `<li class="tl__item">` in
`index.html`. To add one, copy an existing block and change the year, role,
title, body and image. Structure:

```html
<li class="tl__item">
  <p class="tl__year">2025</p>
  <span class="tl__node" aria-hidden="true"></span>
  <div class="tl__body" data-reveal>
    <div class="tl__kicker">
      <span class="tl__role">Your role</span>
      <span class="tl__where">Where</span>
    </div>
    <h3 class="h3">Headline</h3>
    <p>Body.</p>
  </div>
</li>
```

Section headings between entries are `<li class="tl__era"><h2>Era</h2></li>`.
They sit outside the active-entry logic in `main.js`, so they never light up.

The rail fills as you scroll and each node activates when its entry crosses
a read-line a third of the way down the viewport. Both are handled in
`main.js` under `TIMELINE`.

### Photography

Every image is currently a CSS placeholder — a `<div class="ph">` with a
warm gradient and grain over it. Each carries a `data-ph` attribute saying
what belongs there:

```html
<div class="ph ph--45 ph--terra" data-ph="portrait — 4:5, warm natural light"></div>
```

Replace with:

```html
<img src="assets/img/portrait.jpg" alt="" width="1200" height="1500">
```

Keep the aspect ratio the `ph--*` class specified so the layout doesn't
shift. Aspect classes: `--45` (4:5), `--11`, `--32`, `--169`, `--219`,
`--tall` (3:4). Tone variants (`--terra`, `--olive`, `--sand`, `--espresso`)
only affect the placeholder and can be dropped once real images are in.

### Content still needed

Search the files for these markers:

- `PLACEHOLDER` — content to replace, mostly on `media.html` and the essays
  block in `writing.html`
- `[CONFIRM]` / `[confirm]` — a date or fact only you know (your Northeastern
  years, what you're doing now, current availability, the two traffic-table
  periods on `work.html`)
- `[OPTIONAL]` — the personal paragraph on `about.html`

Also: `hello@catherinewang.com` appears on every page and is a stand-in —
swap it for your real address. Footer social links point at `#`.

## Publishing

Drag this folder onto [netlify.com/drop](https://app.netlify.com/drop) — it
deploys as-is, free, no account needed for a first look. Vercel and GitHub
Pages work the same way. No build command; the publish directory is the
folder itself.

## Accessibility & performance

- Skip link, focus-visible rings, `aria-current` on nav, live region on the
  work filters, labelled scroll regions
- All motion is gated behind `prefers-reduced-motion: reduce`
- One rAF-throttled scroll listener drives nav, progress bar and timeline
- Print stylesheet strips fixtures so essays print clean
- No JS dependency for reading: with scripts off, everything is visible
