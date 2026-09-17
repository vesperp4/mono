# Maintaining the Project

For whoever is running the repo this term. [team-guide.md](./team-guide.md) tells
contributors how the team works; this page tells you how to run it.

The chapter rotates leads, so this is written to be handed to someone who has never done
it before. Nothing here assumes management experience.

---

## 1. What you own, and what you refuse to own

You own four things:

1. **The backlog.** Deciding what gets built, and keeping ready work available.
2. **Merging and deploys.** The `main` branch, releases, and anything that reaches users.
3. **Access and secrets.** Who is in which team, tokens, cloud credentials.
4. **Unblocking people.** Being reachable when someone is stuck.

You deliberately do **not** own writing all the code. The moment you are the only person
who can move a task forward, the team stops scaling and you become the bottleneck. When
you catch yourself thinking "it is faster if I just do it," that is usually true for today
and false for the term.

The one exception worth making: do the boring infrastructure work yourself. Nobody learns
anything from waiting three weeks for a CI fix.

### The bottleneck is the thing to watch

With one maintainer and five contributors, every question, review, and decision routes
through you. Three habits keep that from collapsing:

- **Batch reviews into fixed windows** instead of reacting all day. Two windows a week
  meets the 72 hour promise and protects your own working time.
- **Answer in the team channel, not in direct messages.** A public answer is written once
  and read five times. Redirect DMs gently: "good question, can you post that in the
  channel so it is searchable?"
- **Hand off review as soon as you can.** Once two contributors have merged a few PRs
  each, they review each other and you only see the result. Start the first responder
  rotation from [team-guide.md](./team-guide.md) at that point.

---

## 2. Keeping the backlog stocked

**This is the highest priority task on this list, and the easiest one to neglect.**

The most common way a student team dies is not conflict or bad code. It is a contributor
who finishes setup on a Saturday, opens the issue list, finds nothing they can start, and
never comes back. Enthusiasm has a short half-life and it decays fastest in the first two
weeks.

> **The rule: at least two ready, unassigned issues per active contributor, at all
> times.** Check this weekly. If you are below it, stocking the backlog outranks whatever
> you were going to work on instead.

### Definition of ready

An issue is ready for a beginner when someone with no context can start it without asking
you anything first. That means it states:

- **Context.** What this is and why it matters, in two or three sentences.
- **Where.** The actual file paths to open. Not "somewhere in the mainsite app."
- **What good looks like.** Acceptance criteria as a checklist.
- **How to verify.** The exact commands, and what to look at in the browser.
- **Known traps.** Anything that will waste their afternoon (see section 6).
- **Size.** One sitting, one to three files, a visible result.

Writing one of these takes about fifteen minutes. It saves several hours of back and
forth, and it is what makes an issue survivable by someone who is nervous about asking.

### A worked example

```markdown
### Context
The site has no custom 404 page, so a bad URL shows the default Next.js one, which does
not look like vesperp4.com at all.

### Where
- Create `apps/mainsite/web/app/not-found.tsx`
- Look at `apps/mainsite/web/app/contact/page.tsx` for the page structure to copy
- `apps/mainsite/web/components/PageHeader.tsx` is the header component to reuse

### Acceptance criteria
- [ ] Visiting a URL that does not exist shows our styled page
- [ ] It has a heading, a short message, and a link back to the home page
- [ ] It uses the existing site header and footer

### How to verify
1. `mise run dev`
2. Open http://localhost:3000/this-page-does-not-exist
3. `mise run check` passes

### Traps
The mainsite is a fully static export, so do not add any data fetching to this page.
New components need tests, see the coverage note in the issue thread.

### Size
Small. One new file. Two to three hours.
```

### Where the beginner work is

Some categories reliably produce good starter issues in this repo:

| Category | Why it works | Examples |
| --- | --- | --- |
| **Content in Sanity** | No code at all, immediately visible on the live site | Write a blog post, add events, fill in team profiles |
| **Missing standard pages** | Self-contained, one file, copy an existing pattern | 404, error page, `sitemap.ts`, `robots.ts` |
| **Component tests** | Isolated, teaches the test suite, cannot break production | Tests for a component in `apps/mainsite/web/components/` |
| **Accessibility passes** | Small diffs, real value, easy to review | Alt text, `aria-label`s, heading order |
| **Documentation** | Beginners write the best beginner docs | Fixing anything in `docs/` that confused them |

Sanity content work is the best possible first task for someone who has never used Git,
because the result appears on vesperp4.com within minutes and nothing can break.

**Turn confusion into issues.** When a new contributor gets stuck on something in the
docs, that is a `documentation` issue and they should file it. Their confusion is data you
cannot generate yourself, and it expires the moment they learn the codebase.

---

## 3. Onboarding a new contributor

Run these in order. Steps 1 and 2 are yours; steps 3 to 5 are theirs.

### Step 1: access, before they touch anything

```bash
# Invite as an ORG MEMBER, not an outside collaborator (see section 6 for why)
gh api -X POST orgs/vesperp4/invitations -f invitee_id=<numeric-user-id> -f role=direct_member

# Add to the contributor team
gh api -X PUT orgs/vesperp4/teams/fullstack/memberships/<github-username> -f role=member

# Verify
gh api orgs/vesperp4/teams/fullstack/members --jq '.[].login'
```

Confirm they have **two factor authentication enabled** on their GitHub account before
inviting. Ask them directly; it takes them two minutes and it is far more awkward to chase
later.

### Step 2: give them a landing pad

Point them at [onboarding.md](./onboarding.md) and [team-guide.md](./team-guide.md), and
assign a **buddy**: a specific named person who answers their questions for the first two
weeks. "Ask the team" is nobody. "Ask Gabriel" is someone. If you are the only person
available, the buddy is you, and say so explicitly.

Then hand them these three things in order, and nothing else. Resist adding more.

### Step 3: their guaranteed win (day one)

Their first pull request should be one that **cannot fail**: add themselves to the
contributors table in `README.md`.

This is not busywork. It walks the entire loop end to end in about twenty minutes: branch,
conventional commit, push, pull request, CI, review, squash merge, deploy. Every single
step that will confuse them later, they hit once here, on a change where the content is
trivially correct and nothing can break.

Review it like a real PR, approve it, merge it the same day. Their name is now in the
repository. That matters more than it sounds like it should.

### Step 4: their first real issue (week one)

One `good first issue` from the backlog, assigned explicitly. Check in once midweek, by
asking about the issue rather than about them: "anything blocking on #183?" is easier to
answer honestly than "how is it going?".

### Step 5: their first review (after two merged PRs)

Ask them to review someone else's pull request. Tell them it is fine to only comment on
what they understand, and that "I do not understand this part" is a valid review comment.
This is how you stop being the only reviewer.

---

## 4. Review duty

**The promise is a real response within 72 hours.** A response can be an approval, a
change request, or "I need until Friday to look at this properly." All three are fine.
Silence is not.

Time to first review is the number that actually predicts whether volunteers stay. Nobody
keeps contributing to a project where their work sits untouched for a week.

### Reviewing beginner code

Use the `blocking:` / `suggestion:` / `nit:` / `praise:` tags from
[team-guide.md](./team-guide.md) on every comment, without exception. You set this norm by
using it yourself; it will not survive if the maintainer skips it.

Two failure modes to avoid, in both directions:

- **Rubber stamping.** Approving without reading teaches nothing and lets real problems
  land. If you do not have time to read it, say when you will.
- **Perfectionism.** Blocking a working change because you would have written it
  differently. Ask "is this correct, safe, and maintainable?" not "is this how I would
  have done it?" If it is merely not your style, it is a `nit:`.

Prefer approving with nits over a second round. A merged PR with three imperfect variable
names beats a perfect PR that took two weeks and cost you a contributor.

### Saying no

You will get pull requests nobody asked for: a rewrite in a different framework, a new
dependency, a redesign. Say no early and warmly, and say why:

> "Thanks for putting this together, and I can see the thought in it. We are not taking a
> new charting library right now, because every dependency is something the next lead has
> to maintain and we are keeping the surface small. If you want to work on the events
> page, #184 is open and it is yours if you want it."

Declining fast is kinder than letting it sit. The thing that damages morale is not "no",
it is three weeks of no answer followed by "no".

---

## 5. Repository protection

The current settings for `main` live in ruleset `14805427`. Read them:

```bash
gh api repos/vesperp4/mono/rulesets/14805427 --jq '.rules[] | select(.type=="pull_request") | .parameters'
```

Target state once at least two people can review each other:

| Setting | Value | Why |
| --- | --- | --- |
| `required_approving_review_count` | `1` | Nobody merges their own work unreviewed |
| `require_code_owner_review` | `true` | Routes review by path through `CODEOWNERS` |
| `required_review_thread_resolution` | `true` | Comments get addressed, not scrolled past |
| `dismiss_stale_reviews_on_push` | `true` | A new push invalidates the old approval |

**Sequencing trap.** Do not turn on required code owner review while you are the only
member of `@vesperp4/fullstack`. You cannot approve your own pull request, so every change
you make to `apps/` would need a bypass. Turn it on the day the second contributor lands
in the team, not before.

`CODEOWNERS` is **last-match-wins, not additive**: only the last matching pattern requests
review. After any change to it, verify with:

```bash
gh api "repos/vesperp4/mono/codeowners/errors?ref=<branch>"
```

A `CODEOWNERS` file that points at a team which does not exist fails silently. It requests
zero reviews rather than erroring, which looks exactly like everything working.

---

## 6. Traps that will cost you an afternoon

Collected from real incidents in this repo. Put the relevant ones into issue bodies rather
than expecting people to read this page.

**Outside collaborators are invisible to CODEOWNERS.** Someone granted repository access
directly, rather than through an org team, is not a code owner on any path. They get no
review requests, and once required review is on, their pull requests can only be approved
by you. Always invite as an org member and add to a team.

**Enabling org-wide 2FA enforcement instantly removes non-compliant accounts.** No warning,
no grace period. Check the **Outside collaborators** tab specifically before flipping it;
people who were never invited as org members do not appear on the People tab at all.

**Test coverage thresholds are enforced, so new code needs new tests.** `mainsite-web`
enforces 95% lines and 82% branches in `vitest.config.ts`. A contributor who adds a
component without a test gets a red CI run whose message does not obviously say "write a
test." Put this in the issue body for any task that adds a component.

**The GitHub member privileges page has a separate Save button per section.** Changing
several settings and saving once applies only one block. Always re-verify through the API.

**Fresh git worktrees fail the pre-commit hook** until you run `pnpm install
--frozen-lockfile` in them, because the `lint` hook runs `pnpm turbo lint` unconditionally
and worktrees do not share `node_modules`.

**`mergeStateStatus: UNSTABLE` is not a merge blocker.** It reflects any pending or failing
check, required or not. What actually gates is the ruleset's required contexts:

```bash
gh api repos/vesperp4/mono/rulesets/14805427 \
  --jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'
```

---

## 7. When production breaks

**Revert first, investigate second.** Do not debug forward on a broken site.

```bash
gh pr list --repo vesperp4/mono --state merged --limit 5   # find the culprit
gh api -X POST repos/vesperp4/mono/pulls/<number>/... # or use the Revert button on the PR
```

Then say in the channel that you reverted and why, in a way that makes clear it is not a
telling off:

> "Reverted #187 for now, the events page was 500ing in prod. Not a big deal and nothing
> lost, the branch is intact. @name let us look at it together tomorrow."

How you handle the first revert sets whether people ship for the rest of the term. Treat
it as routine and it stays routine. Treat it as a failure and everyone slows down.

Deployment mechanics are in [cicd-pipeline.md](./cicd-pipeline.md).

---

## 8. Offboarding

People leave at the end of a term. Do this within a week, without ceremony:

```bash
gh api -X DELETE orgs/vesperp4/teams/fullstack/memberships/<username>
gh api -X DELETE orgs/vesperp4/members/<username>          # if leaving the org entirely
```

Then unassign their open issues and return them to the pool, and thank them publicly.
People come back to projects that treated them well, and the next cohort reads the archive.

---

## 9. What to check, and when

**Weekly, five minutes:**

- Are there at least two ready unassigned issues per active contributor?
- Has any pull request been open more than 72 hours without a response?
- Any assigned issue with no activity for ten days? Unassign it.
- Did anyone go quiet who was not quiet last week? Message them directly, once, with no
  pressure. "No agenda, just checking you are not stuck on something" is enough.

**Monthly:**

- Is anyone other than you reviewing pull requests? If not, that is the thing to fix.
- Are pull requests getting bigger over time? Large PRs mean issues are scoped too big.
- Is the same question being asked repeatedly? That is a documentation issue.

**Health signals worth trusting, in order:** time to first review; number of distinct
people who merged something this month; number of ready issues. If those three are
healthy, the team is healthy, whatever the velocity looks like.

---

## 10. Handing over

The quarterly handoff checklist is in
[CONTRIBUTING.md](../CONTRIBUTING.md#quarterly-handoff-protocol). Beyond that list, give
the incoming lead this page, walk them through one review and one deploy while you are
still around, and make sure they hold the credentials before you stop being reachable.
