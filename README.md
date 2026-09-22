# FOOD DATING

Live event experience: **You don’t choose the food. The food chooses you.**

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Default event: `FOOD-DATING-001`  
Controller key: `showtime` (override with `CONTROLLER_KEY`)

## Screens

- Audience join: `/join/FOOD-DATING-001`
- Stage projector: `/stage/FOOD-DATING-001`
- Controller: `/controller/FOOD-DATING-001`
- Printable food QRs: `/print/FOOD-DATING-001`

## Show flow

1. Open Stage and Controller on two machines.
2. Controller: START EVENT (moves stage to join QR).
3. Audience scans the stage QR, enters full name, swipes 10 foods.
4. Controller watches the matrix, SELECT VOLUNTEER.
5. Volunteer scans one physical food QR.
6. Controller advances questions, then CALCULATE / REVEAL RESULT.
7. First volunteer is always **not a match** at 37%. Later volunteers use the answer weights.
8. END ROUND marks that food USED.

Test mode

Controller emergency panel: SIMULATE 10 / 30 / 60 / 100. A **TEST MODE** badge appears on stage and phones.

## Host online (phones on mobile data)

Do **not** use Vercel or GitHub Pages for the live show. Use Railway or Render so one Node process stays up.

Keep **one replica / one instance**. The event state is in memory on that process.

### Railway

1. Push this repo to GitHub.
2. [railway.app](https://railway.app) → New project → Deploy from GitHub.
3. After it has a public URL, set:
   - `CONTROLLER_KEY` (your controller password)
   - `PUBLIC_URL` = `https://YOUR-SERVICE.up.railway.app` (no trailing slash)
4. Generate a domain under Settings → Networking if Railway did not add one.

### Render

1. Push this repo to GitHub.
2. [render.com](https://render.com) → New → Blueprint, or Web Service from this repo (`render.yaml`).
3. Use a plan that does **not** spin to sleep (Starter, not free).
4. Set `PUBLIC_URL` = `https://YOUR-SERVICE.onrender.com`.

### Links after deploy

- App: `https://YOUR-HOST/join/FOOD-DATING-001`
- Stage: `https://YOUR-HOST/stage/FOOD-DATING-001`
- Controller: `https://YOUR-HOST/controller/FOOD-DATING-001`

Test from a phone that is **not** on the venue Wi‑Fi before show day. Leave the service running.

`pratitisarkar.github.io` can still host the printed QR jump pages in `docs/`. Point `docs/config.js` at the Railway/Render URL once, then those paper codes stay valid.
