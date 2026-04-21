# Room Hero Video Prompts

For upgrading each Northwoods room from a static MJ still to a 5-second looping
cinematic video backdrop. Use **Midjourney Video**, **Runway Gen-3**, **Kling**,
or **Pika** with the prompts below.

Each room already has a finished hero still at `public/catalog/rooms/{slug}.png|webp`.
Use that still as an **image-to-video** start frame so the rendered video is
visually consistent with what the user already loves.

## Global direction

- **Duration:** 5s, loopable (start frame ≈ end frame)
- **Aspect:** 16:9 (matches the MJ stills)
- **Motion scale:** very slow and cinematic — think "barely moving" (level 1-2
  of 10 on most platforms). No camera cuts. No fast pans.
- **Grain:** keep analog film grain visible
- **Color:** don't let AI re-color — preserve the warm amber / brass / pine-green
  palette already baked in
- **Tone:** "something is happening, but barely" — think Roger Deakins
  establishing shots, not TikTok

Save finished videos as **MP4** to `public/catalog/rooms/{slug}.mp4` (≤8 MB
each; H.264, bitrate ~3 Mbps is plenty at 16:9 1280×720). Then update the DB
to point `hero_video_url` at the new path and the lobby will auto-play them
(with the still as `poster` fallback).

---

## 1. The Lodge — `the-lodge.mp4`

**Start from:** `public/catalog/rooms/the-lodge.png`

**Prompt:**
> Slow subtle motion: embers glow and dim in the stone fireplace, smoke
> curls lazily upward, flames flicker, a fine dust drifts through the warm
> lamplight. Camera holds perfectly still. Rain flecks occasionally glow
> on the window. Cinematic, Roger Deakins, 5 seconds, looping.

## 2. The Cellar — `the-cellar.mp4`

**Start from:** `public/catalog/rooms/the-cellar.webp`

**Prompt:**
> Candle flames flicker softly in the stone alcoves, vinyl record rotates
> slowly on the turntable, dust motes drift through the amber beam of
> light from above. Camera static. 5 seconds, looping seamlessly.

## 3. The Hall — `the-hall.mp4`

**Start from:** `public/catalog/rooms/the-hall.png`

**Prompt:**
> Massive golden shafts of light slowly shift across the grand piano as
> the sun moves. Dust motes drift upward through the beams. Chandelier
> gently sways. Empty seats still. Camera holds. Cinematic, reverent,
> Terrence Malick meets Roger Deakins. 5s loop.

## 4. The Garage — `the-garage.mp4`

**Start from:** `public/catalog/rooms/the-garage.webp`

**Prompt:**
> Chandelier sways gently overhead, subtle reflections play on the Porsche's
> rain-flecked paint, pine trees outside the windows drift slightly in a
> light breeze. Camera static. Moody, Blade Runner quiet. 5s loop.

## 5. The Bar — `the-bar.mp4`

**Start from:** `public/catalog/rooms/the-bar.webp`

**Prompt:**
> Vinyl record rotates slowly on the turntable (if visible), backlit
> whiskey bottles subtly shimmer, a thin wisp of cigar smoke drifts across
> frame, amber lamplight pulses almost imperceptibly. Camera static.
> Intimate, moody, Wong Kar-Wai. 5s loop.

## 6. The Study — `the-study.mp4`

**Start from:** `public/catalog/rooms/the-study.webp`

**Prompt:**
> Banker's lamp flickers once, the page of the open journal lifts and
> settles, curtain at the arched window drifts slowly in a breeze, fire
> embers glow and dim. Camera static. Noir quiet, True Detective,
> dangerous stillness. 5s loop.

## 7. The Screening Room — `the-screening-room.mp4`

**Start from:** `public/catalog/rooms/the-screening-room.png`

**Prompt:**
> Projector beam drifts through thick dust and smoke, the smoke curls
> slowly across the beam, red velvet curtains barely move, a single
> emerald exit sign pulses softly. Camera static. Cinema Paradiso
> nostalgia. 5s loop.

## 8. The Library — `the-library.png`

**Start from:** `public/catalog/rooms/the-library.png`

**Prompt:**
> Vinyl record rotates slowly on the turntable, brass lamp glow gently
> pulses, a single dust mote drifts upward through the pool of warm
> light. Books and vinyl on shelves static. Camera static. Intimate,
> private, scholarly. 5s loop.

## 9. The Overlook — `the-overlook.webp`

**Start from:** `public/catalog/rooms/the-overlook.webp`

**Prompt:**
> Mist rolls slowly across the mirror-calm mountain lake, dawn light
> gradually warms, a single ripple crosses the water, pine trees barely
> sway in a light breeze. Camera static. Awe-inspiring, Terrence Malick
> golden hour. 5s loop.

## 10. The Stargazer — `the-stargazer.webp`

**Start from:** `public/catalog/rooms/the-stargazer.webp`

**Prompt:**
> Stars in the Milky Way twinkle and slightly drift, firepit flames
> flicker warmly, a wisp of smoke rises and disperses, reflection of
> stars on the still lake ripples once. Camera completely static.
> Magical, quiet, cinematic. 5s loop.

---

## How to wire them in once generated

1. Save each MP4 to `public/catalog/rooms/`
2. Apply this SQL in Supabase (adjust paths if different):

```sql
UPDATE library_rooms SET hero_video_url = '/catalog/rooms/' || slug || '.mp4';
```

3. Update the `RoomSlide` component in `src/app/catalog/page.tsx` to render
   a `<video>` element when `hero_video_url` is present, falling back to the
   image. The motion.div Ken Burns zoom still works on either.

Example snippet:

```tsx
{room.hero_video_url ? (
  <video
    src={room.hero_video_url}
    poster={room.hero_image_url ?? undefined}
    autoPlay muted loop playsInline
    className="absolute inset-0 w-full h-full object-cover"
  />
) : room.hero_image_url ? (
  <img src={room.hero_image_url} ... />
) : (
  <RoomScene ... />
)}
```
