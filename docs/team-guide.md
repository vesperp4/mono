# How This Team Works

[Onboarding](./onboarding.md) teaches you the tools. This page teaches you the team: how
work reaches you, what "finished" means, how fast to expect a reply, and what to do when
you are stuck.

It is short on purpose. Read it once during your first week. Come back to the "When you
are stuck" section whenever you need it, because you will, and that is normal.

---

## 1. Who does what

We keep two roles. Small teams do not need more.

| Role | Who | Owns |
| --- | --- | --- |
| **Maintainer** | `@vesperp4/leads` | Merging, deploys, infrastructure, secrets, deciding what gets built |
| **Contributor** | everyone else (`@vesperp4/fullstack`) | Picking up issues, writing code, reviewing each other's pull requests |

Once at least three contributors are active, we add one rotating duty:

**First responder (one week at a time).** The first responder answers questions in the
team channel first, and does the first review pass on open pull requests. It is not a
promotion and it is not extra work; it is a week of being the person who notices things.
Everyone takes a turn, because reading other people's code is how you get good fast.

If the first responder cannot answer something, they escalate to the maintainer. Nobody is
expected to know everything on their rotation week.

---

## 2. The weekly rhythm

We are volunteers with classes. The rhythm is weekly, not daily, and it is fixed so you
can plan around it.

| When | What | How long |
| --- | --- | --- |
| **Monday** | Post a three line check-in in the team channel | 2 minutes |
| **Midweek + end of week** | Guaranteed review windows: every open PR gets looked at | you do nothing |
| **Weekly sync** | One call: what merged, what is blocked, what you are taking next | 30 minutes, hard stop |

Your Monday check-in is exactly three lines:

```
Done:    fixed the footer links (#181, merged)
Next:    taking #183, the 404 page
Blocked: nothing
```

"Blocked: nothing" is a perfectly good line. So is "Done: nothing, midterms." Write it
anyway. The check-in exists so that nobody has to guess whether you are stuck, busy, or
gone, and so that you never have to send an awkward apology message. Silence is the only
thing that causes problems here.

**Review promise:** your pull request gets a real response within **72 hours**, every
time. If it has been longer, that is our mistake, not yours. Post the link in the channel
and someone will pick it up.

---

## 3. How you get work

**All work lives in [GitHub Issues](https://github.com/vesperp4/mono/issues).** If it is
not an issue, it is not work yet. Nobody assigns you tasks over direct message, and you
should not accept one that way, because work that lives in a private chat is invisible to
everyone else and dies when you get busy.

### Picking something up

1. Browse the open issues. Filter by the
   [`good first issue`](https://github.com/vesperp4/mono/labels/good%20first%20issue)
   label if you are new.
2. Comment `taking this` on the issue.
3. A maintainer assigns it to you. Now it is yours.
4. Branch, work, open a pull request that says `Closes #<number>`.

### Two rules about claiming

**One issue at a time.** Finish it or hand it back before claiming another. This is not
about trust. Beginners consistently underestimate how long a first task takes, and three
half-finished branches feel much worse than one finished one.

**Claims go stale after ten days.** If an assigned issue has no commits and no comment for
ten days, we unassign it and put it back in the pool. This is routine housekeeping, not a
judgement, and it happens to everyone eventually. If you want to keep it, just say so on
the issue. If you want to drop it, say that instead. Dropping an issue costs you nothing.

### How big should a task be?

A good first issue is something you could finish in **one sitting of two or three hours**,
touching **one to three files**, with a result you can **see in your browser**.

If a task is turning out much bigger than that, it was scoped wrong. Say so on the issue.
Getting an issue split into smaller pieces is a completely normal outcome and it improves
the backlog for the next person.

The same applies while you work: **if your pull request grows past roughly 200 changed
lines, stop and ask whether it should be split.** Big pull requests do not get reviewed
carefully, they get reviewed slowly. A 40 line PR gets merged today; a 900 line PR sits
for a week and then gets a shallow approval, which helps nobody.

---

## 4. Definition of Done

A change is done when all six are true. Not five.

1. The issue's acceptance criteria are met.
2. `mise run check` passes on your machine.
3. A pull request is open, the template is filled in, and it links the issue
   (`Closes #123`).
4. CI is green on GitHub.
5. One approval from a code owner.
6. It is squash-merged, and you have looked at the deployed result on the dev site.

Step 6 catches a surprising amount. "It worked locally" and "it works deployed" are
different claims.

---

## 5. When you are stuck

Read this part twice.

> **The 30 minute rule.** Stuck on the same error for 30 minutes with no progress? Stop
> and post about it in the team channel. Publicly, not by direct message.

That is not a suggestion, it is the expected behavior. Here is the honest reasoning.

The single most common way a student project fails is not bad code. It is a contributor
who gets stuck in week two, feels embarrassed, decides to figure it out over the weekend,
does not, feels worse, and quietly stops showing up. Nobody notices for a month. The work
was never hard; the silence was.

So we make asking cheap. Posting a problem after 30 minutes is doing the process
correctly. It is not a sign you are behind.

**Ask publicly, not in a direct message.** Not because we want an audience, but because a
public question gets answered by whoever is free instead of whoever you happened to pick,
and because the next person who hits the same wall can search for it. Direct messages help
one person once.

**Post the whole thing:**

```
Working on:  #183, the 404 page
Trying to:   get `mise run check` to pass
Error:       <paste the actual error, all of it>
Tried:       re-ran `mise run setup`, restarted the container
```

Pasting the real error text matters more than describing it. "It says something about
types" cannot be helped; a stack trace can.

There is no such thing as a stupid question on this team. There is only an unasked
question, which is expensive.

---

## 6. Code review

Every change gets reviewed, including the maintainer's. Review is not a test you pass or
fail. It is two people making a change better and spreading knowledge about the codebase.

### If your pull request is being reviewed

Expect comments. Everyone gets them, on every PR, forever. A reviewer leaving fifteen
notes on your first PR is a reviewer taking you seriously.

Every comment is tagged so you know what to do with it:

| Tag | Meaning | What you do |
| --- | --- | --- |
| `blocking:` | Must change before merge | Change it, or explain why not |
| `suggestion:` | Would be better, your call | Take it or reply "prefer to keep, because ..." |
| `nit:` | Trivial, style or taste | Fix it if you like. Ignoring it is fine |
| `praise:` | This part is good | Nothing. Enjoy it |

Only `blocking:` stops a merge. If a comment has no tag, ask which it is.

Reply to every comment, even if the reply is just "done". Then push new commits to the
same branch; the PR updates itself. Do not open a new pull request.

Disagreeing with a reviewer is allowed and encouraged. Say why. "I did it this way because
X" is a good comment and sometimes the reviewer learns something.

### If you are reviewing

You will review other people's work after your second merged PR. It is the fastest way to
learn the codebase.

- **Tag every comment** with one of the four labels above. This is the whole convention.
  Without it, a beginner reads a style nit as "you did this wrong" and rewrites a working
  branch at midnight.
- **Leave at least one `praise:`.** Always. It costs nothing and it changes how the rest
  of the review lands.
- **Approve with nits.** If nothing is blocking, approve and leave the small stuff as
  nits. Do not hold a PR for a second round over naming.
- **Do not push commits to someone else's branch** without asking. It takes the task away
  from them and they learn nothing.
- **Review the code, not the person.** "This will break when `posts` is empty" is useful.
  "Why didn't you just use map?" is not.
- If you do not understand something, say so. "I cannot tell what this does, can you add a
  comment or rename it?" is a legitimate and valuable review comment.

---

## 7. What happens after you merge

Merging to `main` deploys automatically. Your change goes to the dev site, and mainsite
changes go on to production at vesperp4.com. That is the point: your work goes live, with
your name on the commit.

If something breaks after a merge, we **revert first and investigate afterwards**. A
revert is a normal, blameless button click. It is not a punishment and it does not mean
your work was bad; it means the site should be working while we figure it out. Your branch
is untouched and you can reopen it.

Nobody gets in trouble for a bad merge here. Reverting takes two minutes. Being afraid to
ship takes a semester.

---

## 8. Ground rules

- **Never commit secrets.** No API keys, passwords, tokens, or `.env` files. If you think
  you committed one, say so immediately in the channel. Speed matters more than
  embarrassment, and rotating a leaked key is easy while it is fresh.
- **Never force-push to `main`.** You cannot, it is protected, but do not try.
- **Ask before changing shared things**: CI workflows, `mise.toml`, dependencies, anything
  under `.github/`. These are owned by `@vesperp4/platform` and a change there affects
  everyone.
- **Be kind in writing.** Text has no tone. Assume good faith when reading, and add a word
  of warmth when writing.
- **Credit people.** If someone unblocked you, say so on the PR.

---

## 9. Where to go next

- [**Onboarding**](./onboarding.md): setup, your first change, the tools
- [**Glossary**](./glossary.md): plain English definitions
- [**CONTRIBUTING.md**](../CONTRIBUTING.md): branch, commit and CI reference
- [**Maintaining**](./maintaining.md): for whoever is running the project this term
