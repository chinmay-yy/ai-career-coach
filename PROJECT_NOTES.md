# AI Career Coach — how this project actually works

Study notes for understanding (and eventually rebuilding this kind of thing
yourself) — written to explain **why** things are shaped the way they are, not
just what each file does. Nothing here changes the code; it's a map of what
already exists.

---

## 1. The one big idea: Server Actions instead of an API

Most tutorials teach you: frontend calls `fetch("/api/something")`, a backend
route handler runs, returns JSON. This project barely does that (only
`app/api/inngest/route.js` exists as a "real" API route, and that's only
because a third-party service needs a webhook URL to call).

Everywhere else, the pattern is a **Server Action** — an async function
marked `"use server"` at the top of the file, living in `actions/*.js`. A
Client Component imports it and calls it *directly*, like a local function:

```js
// actions/user.js
"use server";
export async function updateUser(data) { ... }

// some-form.jsx (client component)
import { updateUser } from "@/actions/user";
await updateUser({ industry: "tech-software" });
```

Next.js turns that import into a hidden POST request under the hood — you get
the ergonomics of calling a function with none of the boilerplate of writing
a route, a fetch call, and a JSON body by hand. This is *the* pattern to
understand in this codebase; once it clicks, `actions/dashboard.js`,
`actions/resume.js`, `actions/user.js` all read the same way.

**Why this matters for you building your own projects:** this only works
because Next.js's App Router blurs the client/server line. If you're using
plain React (Vite, CRA) or a separate backend, you're back to real API routes
— Server Actions are a Next.js-specific shortcut, not a universal pattern.

---

## 2. Server Components vs Client Components

Every file either runs **only on the server** (default in the `app/` router)
or is marked `"use client"` at the top and runs in the browser too.

- `app/(main)/dashboard/page.jsx` has no `"use client"` — it's a Server
  Component. It runs on the server, calls `await getIndustryInsights()`
  directly (no loading spinner needed — the data is already there when the
  HTML is sent), and passes the result down as a prop.
- `app/(main)/dashboard/_component/dashboard-view.jsx` starts with
  `"use client"` — it needs `useState`, `onClick` handlers, so it must run in
  the browser.

**The recurring shape in this app:** a thin `page.jsx` (server, fetches
initial data) → a `*-view.jsx` or `*-builder.jsx` (client, owns all the
interactivity). Once you see this split once (dashboard, resume, onboarding
all do it), you'll recognize it everywhere.

---

## 3. The data layer (`prisma/schema.prisma`)

Four real tables, one ORM (Prisma) sitting in front of a Postgres database
(Neon). `lib/prisma.js` exports a single shared `db` client — every action
imports `{ db } from "@/lib/prisma"` and calls `db.user.findUnique(...)`,
`db.resume.upsert(...)`, etc. Prisma turns those calls into SQL for you.

- **`User`** — one row per signed-in person (`clerkUserId` links it to
  Clerk's own user record — Clerk owns passwords/sessions, this table only
  owns *app* data like industry, bio, skills).
- **`IndustryInsight`** — the AI-generated market data (salary ranges, growth
  rate, trends). The interesting bit: `industry` is `@unique`, and `User`
  links to it *by that string*, not by an id:
  ```prisma
  User.industry        String?
  User.industryInsight  IndustryInsight? @relation(fields: [industry], references: [industry])
  ```
  This means the insight row is **shared** — every user in `"tech-software-development"`
  reads the exact same row. That's *why* the weekly refresh job only needs to
  loop over distinct industries, not every user.
- **`Resume`** — `content` is a JSON string of the structured resume fields
  (contact info, summary, skills, experience/education/projects arrays) — the
  *same* shape `resumeSchema` (in `app/lib/schema.js`) already validates the
  form against. `atsScore`/`feedback` sat unused in the schema until the
  ATS-scoring work started writing to them.
- **`CoverLetter`** — `content` is a raw markdown string, since a cover
  letter genuinely *is* prose, not structured data like a resume.

**Lesson:** a schema can plan ahead of the code (those score columns existed
before anything used them). When you're stuck on "what should I build next,"
skimming your own schema for unused columns is a legitimate way to find it.

---

## 4. Auth (Clerk) and the onboarding gate

Clerk handles sign-up/sign-in/session cookies entirely — this app never
touches a password or a JWT directly. `middleware.js` (root level) wraps
every request and protects routes.

The "is this user allowed past onboarding" check is refreshingly simple:
`getUserOnboardingStatus()` in `actions/user.js` just checks
`!!user?.industry` — no separate `onboarded: boolean` column. If they've
picked an industry, they're onboarded. `app/(main)/onboarding/page.jsx`
redirects away once that's true; `app/(main)/dashboard/page.jsx` redirects
*to* onboarding if it's false. Two files, two `redirect()` calls, no state
machine.

---

## 5. The AI integration pattern (Gemini)

One shared client, `lib/gemini.js`, exports `model` (the configured Gemini
model) and `parseJsonResponse` (strip markdown code fences, `JSON.parse`).
Every action file that talks to Gemini (`actions/dashboard.js`,
`actions/resume.js`, `actions/interview.js`, `actions/cover-letter.js`)
imports from there instead of each re-creating its own client — this used to
be copy-pasted four times.

Almost every AI call follows the same shape: **build a prompt that explicitly
demands JSON back, then run it through `parseJsonResponse`.**

```js
const result = await model.generateContent(prompt);
return parseJsonResponse(result.response.text());
```

This is the single most-reused idea in the whole app — industry insights,
resume improvement, ATS scoring, resume parsing, JD-tailoring, interview
quizzes all do this same "ask for strict JSON, parse it" dance. Once you've
written it once, you can paste-and-adapt it for almost any "AI does a
structured task" feature. (`generateCoverLetter` is the one exception — it
asks for plain markdown text back, not JSON, since a cover letter *is* the
final output rather than structured data to render.)

---

## 6. Background jobs (Vercel Cron)

One scheduled job exists: refreshing every distinct industry's insight row
weekly. It's a plain Next.js route handler,
`app/api/cron/refresh-insights/route.js`, triggered by Vercel's own cron
scheduler (declared in `vercel.json`, `"0 0 * * 0"` = every Sunday
midnight) — no separate job-orchestration service to install or run locally.

The route checks an `Authorization: Bearer <CRON_SECRET>` header before doing
anything (Vercel sends this automatically in production) so a random visitor
can't trigger a batch of paid Gemini calls just by hitting the URL. It reuses
`generateAIInsights` from `actions/dashboard.js` — the same function that
generates a fresh industry's insights on first view — so the "how do we ask
Gemini for insights" logic exists in exactly one place, not two.

*(This used to run on Inngest — a separate background-job service with its
own local dev server and step-based orchestration. That's real
infrastructure to justify multiple scheduled/event-driven jobs with retries;
for the one weekly cron this app actually had, a plain route does the same
job with far less to explain in an interview.)*

---

## 7. Client-side conventions worth copying

- **`hooks/use-fetch.js`** — every client component that calls a Server
  Action wraps it in this ~15-line hook instead of hand-rolling
  `useState` × 3 (loading/data/error) every time:
  ```js
  const { loading, fn, data, error } = useFetch(someServerAction);
  // later: await fn(args)
  ```
  It also auto-toasts errors via `sonner`. This is a small, reusable pattern
  worth stealing for your own projects — a lot of "React is annoying with
  async" pain is really just "I keep rewriting this same three-state hook."

- **`app/lib/schema.js`** — all form validation lives in one file as `zod`
  schemas, imported by both the form (`zodResolver(schema)` from
  `react-hook-form`) and, where it matters, the server action. One schema,
  two places it's enforced.

- **`components/ui/*`** — this is [shadcn/ui](https://ui.shadcn.com): not an
  installed npm package, but generated component *source code* that lives in
  your repo (`Button`, `Select`, `Dialog`, etc., built on Radix UI primitives
  + Tailwind). You own and can edit every one of these files directly —
  that's the whole point of shadcn versus a normal component library.

---

## 8. Folder map (what lives where)

```
app/(main)/<feature>/page.jsx           server: fetch + gate + render
app/(main)/<feature>/_components/*.jsx  client: the actual interactive UI
actions/<feature>.js                    "use server" functions the UI calls
app/lib/schema.js                       zod validation, shared client+server
app/lib/helper.js                       small pure-function utilities
lib/prisma.js                           the one shared Prisma client
lib/gemini.js                           the one shared Gemini client
app/api/cron/refresh-insights/          the one background job (Vercel Cron)
components/ui/                          shadcn primitives (yours to edit)
data/industries.js                      static dropdown data, not DB-backed
prisma/schema.prisma                    the actual source of truth for data shape
```

`_components` (underscore prefix) is a Next.js convention meaning "not a
route" — the App Router treats any folder without an underscore as a URL
segment, so `_components`/`_component` opts these out of routing.

---

## 9. Simplifications already made

- **Gemini client centralized** into `lib/gemini.js` (§5) — was duplicated
  across four action files.
- **Inngest replaced with a plain Vercel Cron route** (§6) — one file,
  no separate service, and it fixed a real bug in the process: the old
  Inngest job had no error handling in its per-industry loop, so one bad
  Gemini response would abort the refresh for *every remaining* industry
  that week. The new route wraps each industry independently, so one
  failure doesn't take down the rest.
- **Resume builder moved off markdown entirely.** It used to generate a
  markdown string, then hand-parse that markdown back apart to render a PDF —
  two lossy conversions of the same data, and five "templates" that were just
  different ways of re-formatting that markdown text. Now the structured
  form data (`resumeSchema`'s shape) is rendered *directly* into both the
  live preview (`resume-preview.jsx`) and the PDF (`resume-pdf-document.jsx`)
  — no markdown, no custom parser, no risk of the two views drifting out of
  sync. "Templates" (`resume-templates.js`) became small design presets
  (accent color, header alignment, section-header style) applied to that one
  renderer, instead of five separate text-formatting functions. Net result:
  less code, and the resume page's JS bundle dropped from ~555KB to ~216KB
  since the markdown editor library (`@uiw/react-md-editor`) is no longer
  loaded there at all (it's still used by cover letters, which *are*
  genuinely prose).

## 10. Still flagged, not done

- **DOCX resume upload** was explicitly skipped when the upload feature was
  built, specifically to avoid adding a new dependency (`mammoth`) — pick
  this up only if it turns out to matter. Same "same behavior, less
  machinery" spirit as the items above — a fine thing to pick up yourself
  once you've read through this file.
