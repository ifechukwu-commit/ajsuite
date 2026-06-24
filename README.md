# AJ Suite — Full Rebuild

Pure copy/paste/replace. Every file here either replaces an existing file at
the exact same path, or is genuinely new and sits in its own sensible spot.
Nothing requires you to hunt anything down by hand except running two
scripts, once each.

## Run in this order

1. **SQL first.** Already done — you ran `002_access_control.sql` and
   confirmed it succeeded. Nothing further needed there.
2. **Paste every file** in this zip into your project at matching paths,
   replacing where a file already exists.
3. **Run the cleanup script once:**
   ```
   bash cleanup.sh
   ```
   Deletes lib/groq, hooks/useChat.ts, components/tabs/ChatTab.tsx,
   api/summarise, api/chat, app/history, components/history — all dead AI
   code, gone in one command, not a manual hunt.
4. **Add these two env vars in Vercel when you have them:**
   `PAYSTACK_SECRET_KEY`, `CRON_SECRET` (the second one is optional — only
   needed if you want the cron endpoint to reject unauthorised hits).

## What changed, by area

**Access control** — owner vs invited member, Google-Drive-style invites
(`team_invites` table), 30-day trial then ₦8,500/month flat, read-only
archive mode for expired owners, hard block for members of an expired firm.
`src/lib/access/workspace.ts` is the one place this logic lives — every
route and hook reads from it instead of re-deriving it.

**Fixed a real data-isolation bug**: cases/documents/tasks/notes created by
an invited member were being saved under the member's own id instead of the
firm's workspace id — meaning the owner would never see anything a team
member created. `useCases`, `useDocuments`, `useTasks`, and the Notes tab all
now save under the correct workspace id.

**AI fully removed** — chat, document summarisation, the "AI legal
review" language on the hero page and claim page, all gone. Found and fixed
a second AI mention buried in the hero page's feature list and a whole
separate `api/chat` route that the first pass missed — both included now.

**Document preview simplified** — the original .doc crash was from running
a Node-only parser in the browser to feed an AI model. With AI gone, preview
is just a signed URL opened in a new tab: PDFs render natively, .doc/.docx
open in the user's own Word or Google Docs. No server-side parser needed at
all anymore — this fully resolves the original crash, by removing the need
for the fragile part rather than patching around it.

**New**: Tasks tab, Calendar (agenda view, all cases), Team page (invite by
email), Settings page (profile, subscription, security), Super Admin
"Workspaces & Free Access" page with the Gift Free Pass override, Paystack
checkout flow (flat ₦8,500/month, stacks renewals instead of resetting the
clock), daily deadline reminder cron (30/14/7/3/1 days out, in-app
notifications), 150MB storage cap enforcement for unpaid workspaces, signed
URLs cached for a year per our earlier bandwidth fix, your approved logo in
both icon sizes.

**Notes tab upgraded** — was a single text field, now proper timestamped
multi-entry notes backed by a real table, matching the spec.

## This round's additions

- **Dark/light mode toggle** — Settings → Appearance. Applied before first
  paint (no flash), saved in the browser so it remembers your choice. Every
  card/panel now reads from a `--surface` variable instead of a hardcoded
  white, so dark mode actually looks right instead of just darkening the
  page background while every card stays white.
- **4th admin email added** to `src/lib/constants.ts`: `chiwetaluifechukwu@gmail.com`.
  Confirm this is the one you meant — if not, tell me the right one and I'll
  swap it. The admin sidebar link depends only on this list, not on the
  database, so it doesn't need a SQL migration to take effect.
- **Dashboard rebuilt to match the full prototype**: stat cards now read
  Total Cases / Active Cases / Upcoming Hearings / Tasks Due Today, plus new
  Quick Actions row, Today's Schedule, Upcoming Deadlines, and a
  cross-case Recent Activity feed.
- **Honest gap on Today's Schedule**: the prototype shows specific clock
  times (09:30 Hearing, 12:00 Client Call). The real data model only has a
  single date per case, no time-of-day, no event type. What's built shows
  today's deadlines and tasks correctly, just without fabricated times. A
  proper time-slotted schedule needs a new `events` table — tell me if you
  want that built next, it's a real but bounded addition.
- Status pill colors (priority badges, document type tags) are still fixed
  hex values, not yet theme-variable-based — cosmetic only, doesn't affect
  function, low priority polish for later.



- **Email delivery for deadline reminders isn't wired up.** The cron job
  fires in-app notifications correctly. Email needs a provider (Resend is
  the simplest fit for your stack) and an API key — neither exists yet.
  Flagging this now rather than pretending it's covered.
- **Removing a team member** sets them up as their own independent
  solo workspace (consistent with "different email = fresh start"), it
  doesn't delete their account.
- `groq-sdk`, `mammoth`, and `pdfjs-dist` in package.json are now fully
  unused — safe to `npm uninstall` them, not required for anything to work.
- Storage cap currently checked from the client before upload. Real
  enforcement also depends on it being checked server-side eventually if you
  ever expose the upload path to anything other than this app — flagging so
  it doesn't get forgotten, not blocking for now.
