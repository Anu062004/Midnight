# Images

Drop finished art here and wire it in `../data/images.ts`:

```ts
"home-film": { src: "/images/home-film.jpg", /* … */ },
```

Rules: JPG/PNG/WebP, sRGB, under ~500 KB, at the slot's recommended size
(shown on its placeholder). Alt text must describe the actual image.
Nothing in this folder is referenced until its slot's `src` is set, so
half-finished files never leak onto a page.
