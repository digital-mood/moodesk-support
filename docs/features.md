---
title: Features
description: What mooDesk does for requesters, agents and managers, and which edition each capability belongs to.
---

# Features

mooDesk is a help desk that lives inside Moodle. Users open tickets from the site they
already log in to, agents work them from a queue, and managers watch the numbers — with
Moodle's own accounts, roles and messaging underneath. No second login, no external
service.

This page says **what you can do and who can do it**. How to set each thing up is in
[Configuration](./configuration); the edition rules are summarised first because they
decide what is on the screen.

## Editions at a glance

Three editions, cumulative — each one includes everything below it. The edition is set by
the licence key ([Configuration → License](./configuration#license)); with no key a site runs
as **Starter**. Screens that belong to a higher edition stay visible and show an upgrade
notice instead of their content.

| | Starter | <Badge type="tip" text="Pro" /> | <Badge type="warning" text="Enterprise" /> |
|---|:---:|:---:|:---:|
| Active agents | 2 | 10 | unlimited |
| Tickets, queue, saved views, bulk actions | ✓ | ✓ | ✓ |
| Categories, departments | ✓ | ✓ | ✓ |
| SLA targets and indicators | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ |
| Dashboard | ✓ | ✓ + analytics | ✓ + analytics |
| Knowledge base: articles, search, suggested articles | ✓ | ✓ | ✓ |
| System Health, License page | ✓ | ✓ | ✓ |
| Privacy export and erasure | ✓ | ✓ | ✓ |
| Teams | — | ✓ | ✓ |
| Custom fields | — | ✓ | ✓ |
| Automation rules | — | ✓ | ✓ |
| Email ingestion | — | ✓ | ✓ |
| SLA targets per department | — | ✓ | ✓ |
| Reports | — | ✓ | ✓ |
| Agent panel | — | ✓ | ✓ |
| CSAT surveys | — | ✓ | ✓ |
| Knowledge base: agent tools, translations, feedback, analytics, Moodle global search | — | ✓ | ✓ |
| Ticket merge | — | — | ✓ |
| Agent supervision | — | — | ✓ |
| Webhooks | — | — | ✓ |
| REST API | — | — | ✓ |

The rest of this page marks Pro and Enterprise items with the same badges.

## For requesters

Any logged-in user of the site is a potential requester. They need no role and no setup.

**Open a ticket.** *mooDesk → New ticket* asks for a **subject** and a **message**, plus a
**category** when more than one is active and a **department** when departments exist
(*No department* is allowed and means "any agent"). If the site allows attachments, files
can be added here. On Pro, any [custom fields](./configuration#custom-fields) marked
*Everyone* appear as extra questions.

**Get help before opening one.** As the subject is typed, mooDesk offers **suggested
articles** from the knowledge base that match it — the requester can read one and never
open the ticket. Only published articles are suggested.

**Follow it.** *mooDesk → Tickets* lists the requester's own tickets with their status. On the
ticket they see the conversation — every public reply, never the agents' internal notes — and
can reply as long as the ticket is not *Closed*. A ticket in **Pending** is waiting for them.
They do not set priority and do not change status; a reply on a *Resolved* ticket is read by
the agent, who reopens it if needed.

**Notifications.** A requester is notified when an agent posts a public reply, through
Moodle's messaging — email, popup, or whatever the user chose under *Preferences →
Notification preferences*. Which notifications exist and how to switch them off is under
[Configuration → Notifications](./configuration#notifications-1).

**Rate the service** <Badge type="tip" text="Pro" />. When CSAT is enabled, a resolved ticket
gets a one-question survey (1 to 5, optional comment) reachable through a private link. In
2.30.0 that link is **not delivered** to the requester — see
[Not yet in 2.30.0](#not-yet-in-2-30-0).

## For agents

An agent is a user holding the *mooDesk Agent* role, added by a manager under *mooDesk →
Agents* ([Configuration → Agents](./configuration#agents)). Agents see every ticket on the
site; their department membership decides which tickets they can be **assigned**.

### The queue

*mooDesk → Tickets* is the working list. Four tabs — **All Tickets**, **My Tickets**,
**Unassigned**, **My Departments** — and filters on status (several at once), priority,
department, category, assignee, SLA state (*breached only* / *warning only*), created and
updated date ranges, and a free-text search. On Pro a **team** filter is added. Active filters
show as chips that can be removed one by one.

- **Sort by SLA urgency** puts the tickets closest to breaching first.
- **Saved views** — any combination of filters can be saved under a name and reopened from
  the *Saved views* menu. Views are personal: each agent keeps their own, and can delete them.
- **Quick actions** on a row: *Assign to me* and *Set status*.
- **Bulk actions** — agents with the *manage* capability select tickets across the page and
  apply **Set status** or **Assign** (including *unassign*) to all of them. Each ticket is
  processed on its own: one that refuses the change — an invalid transition, an assignee
  outside its department — is reported, and the others still move.

Opening a row shows the ticket in a side drawer without leaving the list.

### Working a ticket

The ticket page is the conversation plus a sidebar.

**The thread.** Public replies and internal notes, in order. The composer has a toggle:
**Reply** goes to the requester and counts as the first response for the SLA; **Internal
note** is visible to agents only and notifies nobody. Attachments can be added to either when
the site allows them. On Pro, the composer can search the knowledge base and **insert an
article link** into the reply.

**The sidebar.** Everything about the ticket that is not a message:

| Control | What it does |
|---|---|
| Status | Only the transitions allowed from the current status are offered — see [Ticket lifecycle](#ticket-lifecycle) |
| Priority | *Low*, *Normal*, *High*, *Urgent*; new tickets are *Normal* |
| Assignee | Members of the ticket's department, or any agent when it has none |
| Department, Category | Re-route or re-classify |
| Team <Badge type="tip" text="Pro" /> | Hand the ticket to a team as well as a person |
| Custom fields <Badge type="tip" text="Pro" /> | The site's own questions, including *Agents only* ones the requester never sees |
| SLA | Each target, the time used, the time left or the overrun — see [SLA on the ticket](#sla-on-the-ticket) |
| Customer satisfaction <Badge type="tip" text="Pro" /> | The rating and comment once the requester has answered |
| Merge <Badge type="warning" text="Enterprise" /> | Link a duplicate into this ticket — see [Merging duplicates](#merging-duplicates) |
| Create article <Badge type="tip" text="Pro" /> | Start a knowledge base draft pre-filled from this ticket |

**Audit trail.** Every change — creation, status, priority, assignment, category,
department, team, replies, merges — is recorded with who did it and when. In 2.30.0 the
trail is kept and exported with the user's data, but it is **not shown on the ticket page**.

### Ticket lifecycle

Five statuses in use:

| Status | Meaning |
|---|---|
| **Open** | Received; where every new ticket starts |
| **In progress** | An agent is actively on it |
| **Pending** | Waiting on the requester — the resolution SLA clock pauses |
| **Resolved** | The agent considers it done; the requester can still reply |
| **Closed** | Finished. No replies are accepted; an agent can reopen it |

Allowed moves: *Open* ↔ *In progress*, either of them → *Pending* → back to *Open* or *In
progress*, any active status → *Resolved* → *Closed*, and *Resolved* or *Closed* → *Open*
again. Anything else is refused, by hand or by a rule. The `autoclose_resolved_days` setting
([Configuration → Automation](./configuration#automation)) closes *Resolved* tickets
automatically after a number of days; it is off by default.

Tickets record their **source** — web form, email <Badge type="tip" text="Pro" /> or API
<Badge type="warning" text="Enterprise" /> — and are handled the same whichever way they
arrived.

### SLA on the ticket

Two clocks: **first response** stops at the agent's first public reply; **resolution** stops
at *Resolved* and pauses while the ticket is *Pending*. Each ticket shows *On track*, a
**warning** when 20 % or less of a target remains, or **Breached**; the queue filters and sorts
on the same states. When a ticket breaches, the assignee — every agent if there is none — is
notified once. Targets, priorities and the hourly check are described in
[Configuration → SLA](./configuration#sla-1).

### Knowledge base tools <Badge type="tip" text="Pro" />

From the ticket an agent can **insert an article link** into a reply and **create an article**
draft whose title and body start from the ticket. Both need the knowledge base to be enabled;
the draft still has to be published by someone with the publishing capability — see
[Knowledge base](#knowledge-base).

### Merging duplicates <Badge type="warning" text="Enterprise" />

Two tickets about the same thing become one. From the target ticket's sidebar, *Merge* takes
the duplicate's number, shows a **preview** — what will be linked, and any conflict such as
different requesters, different SLA states or different custom field values — and asks for
confirmation.

- Nothing is copied: the duplicate's replies, notes and attachments stay where they are and
  are **read through the link** on the target, labelled *From ticket #N*. The duplicate is
  closed.
- A merged ticket is not "resolved": no CSAT survey is created for it and automation rules
  skip it.
- **Undo** is available for **30 days** after the merge and restores the duplicate exactly.
  Merging and undoing are two separate capabilities, so a role can be allowed to merge
  without being allowed to unmerge. Both default to Moodle's *Manager* archetype.
- Which of the two tickets may be the duplicate is governed by the *Merge ordering* setting
  ([Configuration → Automation](./configuration#automation)).

## For managers and administrators

Management screens are under the *Administration* group of mooDesk's sidebar. Each one needs
its own capability; Moodle's *Manager* archetype holds them all by default
([Installation → Roles and capabilities](./installation#roles-and-capabilities)).

### Dashboard

*mooDesk → Dashboard* shows a different page to each kind of reader: a **manager** sees the
whole site, an **agent** sees their own workload, a **requester** sees their own tickets. The
range is the last 7, 30 or 90 days, and managers can narrow to a department, an agent or —
on Pro — a team.

Every edition: the headline counts (active, unassigned, resolved this week, SLA breaches,
average first response), the daily **trend**, tickets by **status**, by **priority**, by
**department**, an **aging** breakdown and the recent **activity**.

<Badge type="tip" text="Pro" /> adds the analytics panels: the **SLA compliance** gauge with the
site's target line, **agent workload**, **top categories**, and the **customer satisfaction**
score when CSAT is on. Below Pro these panels say so instead of showing data.

### Reports <Badge type="tip" text="Pro" />

*mooDesk → Reports* (`viewreports`) covers a date range — 30 days by default, 90 at most —
in five sections: **Ticket volume**, **Resolution time**, **Agent workload**, **Department
throughput** and **SLA compliance**. Each section exports to **CSV**, and the whole page has a
**print** view. The compliance figure counts a resolved ticket as *within SLA* when it
breached none of its targets, so set every resolution target before reading it
([Configuration → SLA](./configuration#sla)).

### Agents

*mooDesk → Agents* is where agents are added, removed and put into departments — described in
[Configuration → Agents](./configuration#agents). Two things sit on top of it:

- **Agent panel** <Badge type="tip" text="Pro" /> — one page per agent: identity, open
  workload, and department and team membership edited in place.
- **Agent supervision** <Badge type="warning" text="Enterprise" /> — one table for the whole
  roster over a date range: open and assigned tickets, resolved, SLA breaches, average
  response and resolution time, and a **load** label per agent — *Idle* (no open tickets),
  *Balanced*, or *Overloaded* (more than 1.5 × the average open workload). Agents in no
  department and no team are flagged. It is read-only: it shows who is overloaded, it does not
  move tickets.

### Categories, departments, teams and custom fields

How work is classified and routed. They are set up once and rarely touched, so they live in
Configuration: [Categories](./configuration#categories),
[Departments](./configuration#departments), [Teams](./configuration#teams)
<Badge type="tip" text="Pro" />, [Custom fields](./configuration#custom-fields)
<Badge type="tip" text="Pro" />.

### Automations <Badge type="tip" text="Pro" />

Rules that act on tickets with nobody at the keyboard: when a ticket is created, changes
status or breaches its SLA, check a few conditions and set its priority, status, assignee or
department, or add a note. Typical uses: escalate anything *Urgent* that is still unassigned;
route a category to a department; note why a ticket was touched. Each rule runs at most once
per ticket and keeps a log. How to write one is in
[Configuration → Automations](./configuration#automations).

### System Health

*mooDesk → System health* (`viewhealth`, every edition) is where mooDesk shows the failures
it absorbed rather than letting them break a ticket: a notification that could not be sent, a
webhook that keeps failing, a mailbox poll that errored, a scheduled task that threw. The
page opens with one verdict — *Everything is working*, *Something needs attention*, *A source
is down* — and then:

- the **sources** and their state, and the live **incidents** with first seen, last seen and
  occurrence count. An incident older than the *active window* stays on record but no longer
  counts as a current problem;
- **Acknowledge** (stops the alerts while you work on it) and **Resolve** (closes it; a
  repeat reopens it with its history) — both need the *managesettings* capability;
- the **entitlement** block: edition, active agents against the limit, and *Agent limit
  exceeded* when a site is over;
- on Pro with email ingestion: the **inbound sender authentication** evidence and whether the
  strict policy can be armed, and the **retention** sweeps' last run.

Operator alerts for new incidents go out by Moodle messaging to the configured recipients;
thresholds and cooldown are under
[Configuration → Operator alerts and retention](./configuration#operator-alerts-and-retention).

### License

*mooDesk → License* (site administrators) shows the key's verdict, the effective edition, the
expiry and the agent count against the limit. What each verdict means is in
[Configuration → License](./configuration#license).

## Knowledge base

A knowledge base for the site: articles requesters read, search, and are offered while they
type a ticket. Every edition; switched on by default and hideable with one setting
([Configuration → General](./configuration#general)).

**Articles.** A title, a body, a category (the same categories as tickets), an **audience** —
*Everyone* or *Agents only* — and a status: **Draft**, **Published**, **Archived**. Only
published articles reach readers; *Agents only* ones never reach requesters. Writing needs the
*editkb* capability (agents have it); publishing, archiving, restoring and deleting need
*managekb* (managers have it).

**Reading.** *mooDesk → Knowledge* browses by category and searches across the articles the
reader is allowed to see. Requesters get suggestions from the same pool while opening a
ticket ([For requesters](#for-requesters)).

<Badge type="tip" text="Pro" /> adds:

- **Agent tools** — insert an article into a reply, start a draft from a ticket.
- **Translations** — one article in several languages, shown to each reader in their Moodle
  language with a fallback notice when their language is missing.
- **Feedback** — *Was this article helpful?* on every published article.
- **Analytics** — *mooDesk → Articles → Analytics*: views, helpful rate, searches with no
  results, and how often suggested articles were offered and opened, by language. Events are
  anonymous and expire after the retention windows in
  [Configuration → General](./configuration#general).
- **Moodle global search** — published articles appear as results in the site's own search,
  audience-checked per hit.

<Badge type="warning" text="Enterprise" /> exposes articles through the [REST API](./api).

## Email, webhooks and API

Three ways in and out of mooDesk besides the web form. Each is documented on its own page;
this is what they are for.

- **Email ingestion** <Badge type="tip" text="Pro" /> — a support mailbox becomes a channel: a
  new mail from a known Moodle user opens a ticket, a reply to a notification lands in the
  right conversation, attachments come along. Mail from unknown senders is refused and the
  operators are told. Setup, provider notes and the authentication rules are in
  [Integrations](./integrations); the settings are under
  [Configuration → Email ingestion](./configuration#email-ingestion).
- **Webhooks** <Badge type="warning" text="Enterprise" /> — mooDesk calls a URL of yours when a
  ticket is created, replied to, resolved, updated or merged, with a signed payload and a
  delivery log. See [Integrations](./integrations).
- **REST API** <Badge type="warning" text="Enterprise" /> — token-authenticated endpoints to
  read and write tickets and articles from another system, with per-token rate limits. See
  [API](./api).

## Privacy and data

mooDesk implements Moodle's privacy API, so a site's existing data-request workflow covers it:

- **Export** — a user's data request includes their tickets, replies and notes, custom field
  answers, CSAT ratings, department and team memberships, the mail they sent in, and their
  entries in the audit trail.
- **Erasure** — mooDesk **anonymises rather than deletes**: the user's tickets stay countable
  and other people's replies survive, but the subject and the user's own messages are
  rewritten to a placeholder, their CSAT comment and custom field answers are cleared, their
  memberships are removed and the trail loses the actor. An erased user's tickets stop being
  readable as a support history — say so before a data subject asks.
- **Retention** — refused mail, mail correspondence records, incidents, webhook logs and
  knowledge base analytics expire on their own schedules
  ([Configuration → Operator alerts and retention](./configuration#operator-alerts-and-retention)).
  Tickets, replies and ratings are never purged automatically.

What leaves the server, and what does not, is under
[Installation → Network and privacy](./installation#network-and-privacy).

## Not yet in 2.30.0

Two features on this page exist but are incomplete in this release. Both are detailed under
[Configuration → Known limitations](./configuration#known-limitations):

- **CSAT survey invitation** — the survey is created, but the requester is not sent the link.
- **`time_elapsed` automation trigger** — can be saved, is never evaluated.

---

*Verified against mooDesk 2.30.0.*
