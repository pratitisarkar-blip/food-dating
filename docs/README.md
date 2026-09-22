# Print QRs days ahead

The live show should run on Railway or Render (`PUBLIC_URL`), not on a laptop tunnel. GitHub Pages is only for **printed QRs that never change**.

If you still use a laptop tunnel, the live URL (`*.trycloudflare.com`) changes every time you start it. Do **not** print that.

Print codes that point at a **permanent website**. On show day you only change one file so those same codes send people to the live app.

## Once, before show week

1. Put this project on GitHub.
2. In the repo: **Settings → Pages → Deploy from a branch → `main` / `/docs`**.
3. Wait a minute. Your site will be:
   `https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME`
4. Save that address in the project file `data/stable-print-origin.txt` (one line, no slash at the end).
5. Open `/print/FOOD-DATING-001` and print:
   - Audience join
   - Samosa, Brownie, Protein Bar, Nacho + Cheese, Gulab Jamun, Tiramisu

## On show day (no reprint)

1. Confirm Railway/Render is live.
2. Put that HTTPS origin in `docs/config.js` as `FOOD_DATING_ORIGIN`.
3. Commit and push `docs/config.js` (GitHub Pages updates in about a minute).
4. Scan one printed code with a phone on mobile data.

If you are still on a laptop instead of a host: `npm run share`, then push `docs/config.js` with that tunnel. The printed paper never changes. Only `config.js` does.
