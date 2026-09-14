# NextStepConstruction Website

React + Fastify server-side rendered TypeScript website for a carpentry business with sections for About, Projects, Contact, and an estimate request form.

**Live:** <https://next-step-delta-hazel.vercel.app/>

## The roomwalk hero

The homepage hero isn't a static photo — it's a scroll-scrubbed camera walk through a generated Cape Cod interior. Scroll down and the camera moves from room to room, pausing at four stops (trim & finish, built-ins, stairs & railings, repairs & restoration), each one surfacing real project photos for that category.

It was built with [Claude Code](https://claude.com/claude-code) using the [`roomwalk`](https://github.com/tezeralpman/roomwalk) plugin, which drives generation through the Higgsfield MCP and a local AVFoundation/Swift toolchain:

- **Stills** — the establishing shot and the anchor image for each stop were generated with **nano_banana_pro**, along with the 16 "real" project photos used in the Featured Projects grid.
- **Motion** — the walk between anchors was generated as video and chained tail-to-tail (each clip's real last frame feeds the next as its start frame, so the joins are continuous rather than cut). Two of the three segments used **`cinematic_studio_3_0`** (Higgsfield's cinema-grade model, noticeably sharper than the draft pass); the third fell back to **`seedance_2_5`** in `omni_reference` mode after `cinematic_studio_3_0` repeatedly failed to honor its start frame for that particular shot.
- **Post-processing** — each segment was upscaled (`bytedance_video_upscale`, 2K/30fps) for frame density, then sliced into ~120 frames apiece with a Swift/AVFoundation tool, measured for seam continuity and exposure drift across the joins, and blended/stabilized where needed.
- **Playback** — the resulting ~360-frame sequence is scrubbed on a `<canvas>` (`src/roomwalk/scrollFrames.js`) driven by scroll position, with a hand-tuned pacing curve so holds land on the sharp anchor frames and travel gets most of the scroll.

The interior is a generated stage, not a photograph of a real NextStepConstruction job — the footer says so, and the thumbnails at each stop are what's meant to be taken as real project work.

### Demo



https://github.com/user-attachments/assets/d91e403e-846d-4f18-a55e-bd00fad94169


## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Type checking

```bash
npm run typecheck
```

## Build for production

```bash
npm run build
npm run start
```

`npm run start` runs the same Fastify + SSR setup as `npm run dev`, just against the built output — useful for a traditional Node host.

## Deployment (Vercel)

The [live deployment](https://next-step-delta-hazel.vercel.app/) runs on Vercel, which doesn't host the long-running Fastify server. Since the SSR render has no per-request data (same HTML every time — see `src/entry-server.tsx`), `npm run build` renders it once at build time and bakes the result into `dist/client/index.html` (`scripts/prerender.mjs`), so the deployed site is plain static output. The one dynamic piece, the estimate form, is a Vercel serverless function at `api/estimate.ts` mirroring the `/api/estimate` logic in `server.ts`. Config lives in `vercel.json`.

## Notes

- Estimate requests are submitted to `POST /api/estimate`.
- The current implementation logs requests server-side. You can connect email/CRM later.
