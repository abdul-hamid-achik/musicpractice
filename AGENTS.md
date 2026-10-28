# AGENTS.md

Instructions for agents working on musicpractice. `CLAUDE.md` points here.

This is a low-traffic Nuxt product site. `vercel.json` auto-builds **`main`
only**. Feature branches do not create Preview deployments. There is no
`preview` → `vercel promote` flow here — a push to `main` *is* the production
release. Do not enable Git deploys on every branch.
