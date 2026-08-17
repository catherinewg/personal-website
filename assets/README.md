# Images

Drop photography here, then replace the CSS placeholders in the HTML.

## Naming

```
portrait.jpg              Hero + About portrait (4:5)
dripos-video-still.jpg    Work — demo video (21:9 and 4:5 crops)
dripos-ui.jpg             Work — product detail (4:5)
timeline-2024.jpg         Timeline entries, named by year
media-<title>.jpg         Reference library items (4:5 or 3:4)
```

## Specs

- **Format** — JPEG for photography, WebP if you want smaller files
- **Width** — 2000px on the long edge is plenty; the largest slot on the
  site is ~1400px wide
- **Aspect** — match the `ph--*` class you're replacing, or the layout will
  shift: `--45` = 4:5, `--32` = 3:2, `--169` = 16:9, `--219` = 21:9,
  `--tall` = 3:4, `--11` = 1:1
- **Colour** — the site is terracotta/sand/olive. Warm, slightly faded
  images sit inside the palette; cool or high-contrast ones will fight it.
  A slight desaturation and a lifted black point gets most photos there.

## Swapping one in

Find the placeholder:

```html
<div class="ph ph--45 ph--terra" data-ph="portrait — 4:5, warm natural light"></div>
```

Replace the whole div:

```html
<img src="assets/img/portrait.jpg" alt="Catherine Wang" width="1200" height="1500">
```

Always set `width` and `height` so the browser reserves the space before
the image loads. Use `alt=""` for purely decorative images and real
descriptive text for anything that carries meaning.

The site-wide grain overlay sits above your photographs too, so they'll
pick up the same film texture as everything else automatically.
