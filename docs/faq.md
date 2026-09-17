---
title: FAQ
description: Short answers to the questions people ask about mooDesk — what it is, editions and licence, agents and permissions, tickets and SLA, email, automations and integrations, cron, CSAT and the knowledge base, privacy, and where to get help.
---

# FAQ

Short answers, each pointing to the page that has the full picture. If something is **not
working**, [Troubleshooting](./troubleshooting) is the page to read first; this one explains
how mooDesk behaves when it works.

## About mooDesk

**What is mooDesk?**
A help desk that runs inside Moodle: tickets, departments, SLA targets, a knowledge base and an
agent workspace, built on Moodle's own users, roles, notifications and privacy tooling. It is a
`local` plugin, `local_moodesk`, developed and maintained by digitalMood. The full feature list is
on [Features](./features).

**Is it free?**
The **Starter** edition is free software under the GPL v3, with no licence key and no time
limit. **Pro** and **Enterprise** are unlocked by a licence key on the same package — see
[Editions and licence](#editions-and-licence).

**Is mooDesk part of Moodle, or endorsed by Moodle HQ?**
No. mooDesk is an independent third-party plugin and is not affiliated with or endorsed by
Moodle HQ. Moodle® is a registered trademark of Moodle Pty Ltd.

**Which Moodle versions does it support?**
Moodle **4.5 LTS** or later, on PHP 8.1 or later, with MariaDB, PostgreSQL or MySQL. The
detail, including what the CI matrix actually covers, is in
[Installation → System requirements](./installation#system-requirements).

**Which languages does it come in?**
English and Spanish language packs ship with the plugin. Moodle's usual language mechanisms
apply: a user sees mooDesk in their Moodle language when a pack exists, and in English
otherwise.

**Where do I download it?**
The download location is not yet published on this portal; see
[Installation → Getting the package](./installation#getting-the-package).

## Editions and licence

**Which edition am I running?**
**mooDesk → License** shows the effective edition and the reason for it. There is no edition
selector: a site with no key, or with a key that is refused, runs as Starter; a valid key sets
the edition from its own `tier`. What each edition includes is the table in
[Features → Editions at a glance](./features#editions-at-a-glance).

**How do I get a licence?**
Contact digitalMood for licensing information. A key is issued for one site URL and pasted
into **Site administration → Plugins → Local plugins → mooDesk → Licence key**; saving it
revalidates immediately — [Configuration → License](./configuration#license).

**I pasted the key and nothing unlocked.**
The License page names the reason — *malformed*, *forged*, *expired*, *revoked*,
*site_mismatch* — and each is explained in [Configuration → License](./configuration#license).
The site keeps running as Starter in the meantime and nothing is lost.

**Can I use my production licence on a staging copy?**
No. The key is bound to one site URL; on any other it is refused as *site_mismatch* and the
copy runs as Starter. A staging site needs its own key.

**How many agents can I have?**
**2** on Starter, **10** on Pro, **unlimited** on Enterprise. An *active agent* is a user who
holds `local/moodesk:agent` and is neither suspended nor deleted. *Add agent* stops at the cap;
agents given the role through Moodle's own role screens are counted but not blocked, and a
site over its cap keeps every agent working while the License page and System Health show
*Agent limit exceeded* — [Configuration → Agents](./configuration#agents).

**What happens to Pro or Enterprise data if the licence expires?**
Nothing is deleted. Teams, custom fields, rules, ratings, articles, webhooks and tokens stay in
the database; their screens show an upgrade notice and their tasks do nothing. A new key brings
everything back as it was.

**Does mooDesk contact digitalMood to check the licence?**
The key itself is verified on your server against a public key embedded in the plugin; no
call is made to validate it. What does go out is one download a day of the signed **licence
revocation list**, a public file that carries no site URL, licence or user data. It can be
switched off — [Installation → Network and privacy](./installation#network-and-privacy).

## Agents and permissions

**Who counts as an agent?**
A user who holds `local/moodesk:agent` at **system** context. The *mooDesk Agent* role
created at install holds it together with the capabilities to see every ticket, reply, add
notes and manage tickets; **mooDesk → Agents → Add agent** assigns that role. A role given in
a course or category does not count — [Configuration → Roles](./configuration#roles).

**Can a site administrator be assigned a ticket?**
Only if they hold `local/moodesk:agent`. Administrators can configure and manage everything,
but they are not agents — and do not appear in the assignee list — until they are added as
one.

**Why is an agent missing from the assignee list?**
Either they are not an agent in the sense above, or the ticket belongs to a **department**
and only its members are offered. Add them to the department, or move the ticket.

**Which tickets can an agent see?**
Every ticket on the site, with `local/moodesk:viewall` — which the *mooDesk Agent* role
holds. The queue's tabs (*mine*, *unassigned*, *my departments*) are views of that, not
restrictions. A user without `viewall` sees only the tickets they raised.

**Can a requester ever see an internal note?**
No. Internal notes are shown to agents only — not in the requester's ticket thread, not in
notifications, not through the REST API.

## Tickets and SLA

**What are the statuses, and who can reply in each?**
*Open*, *In progress*, *Pending*, *Resolved* and *Closed*. Requesters and agents can reply in
every status except **Closed**, which accepts no replies until an agent reopens it; a reply
on a *Resolved* ticket is how a requester says "not quite". The allowed moves between statuses
are in [Features → Ticket lifecycle](./features#ticket-lifecycle).

**What counts as the first response for the SLA?**
An agent's **public reply**. An internal note does not stop the first-response clock.

**Why did a ticket go red and then green again?**
The resolution clock **pauses while the ticket is Pending** — waiting on the requester — and
the hourly check clears the breach flag on an active ticket whose deadline moved back out.
Once a ticket is *Resolved* or *Closed*, its flag freezes as the historical record —
[Features → SLA on the ticket](./features#sla-on-the-ticket).

**Why does a ticket show no SLA at all?**
The target for its priority is `0`, or its department overrides that target with `0` —
[Configuration → SLA](./configuration#sla-1).

**A ticket closed on its own. Why?**
`autoclose_resolved_days` is set and the ticket sat *Resolved* that long; the daily task
closed it. Set the value to `0` to stop it — [Configuration → Automation](./configuration#automation).

**Is there an audit trail of changes to a ticket?**
Yes: every change is written to the ticket's history and included in the user's privacy
export. The history is **not shown on the ticket page** in 2.31.0.

**Can tickets be merged?**
On Enterprise. A duplicate is merged into a target and becomes read-only; the merge can be
undone for 30 days — [Features → Merging duplicates](./features#merging-duplicates).

## Email

**Can requesters open tickets by email?**
On **Pro**, with one IMAP mailbox that mooDesk polls every five minutes. New mail from an
active Moodle user becomes a ticket; a reply to a notification becomes a reply on the ticket.
Everything needed, from the mailbox to the reply address, is in
[Integrations → Email ingestion](./integrations#email-ingestion).

**Does it work with Gmail and Microsoft 365?**
Gmail and Google Workspace: yes, with an **app password**. Microsoft 365 / Exchange Online:
**not in 2.31.0** — mooDesk authenticates with IMAP `LOGIN` only, and Microsoft requires
OAuth2. See [Integrations → Provider notes](./integrations#provider-notes).

**Does the server need the PHP `imap` extension?**
No. mooDesk speaks IMAP over TLS sockets itself; nothing is installed on the server.

**Why did a reply by email open a new ticket instead of answering the old one?**
The reply carried nothing mooDesk could thread on — a mail client that strips headers, a
forward instead of a reply — or the ticket was closed. How threading works, and the three
reply-authentication modes, are in
[Integrations → Replying by email](./integrations#replying-by-email).

**Can someone who is not a Moodle user open a ticket by mail?**
No. Mail from an address that does not match an active Moodle user is refused and the
operators are alerted; no ticket and no user is created.

**Why did one mail create two tickets?**
It was delivered twice **outside** the deduplication window (300 seconds by default). Inside
the window the same Message-ID, or the same sender and subject, is dropped as a duplicate —
[Configuration → Operator alerts and retention](./configuration#operator-alerts-and-retention).

## Automations, webhooks and API

**Which edition has automations?**
**Pro**. Webhooks and the REST API are **Enterprise**.

**Can a rule fire twice on the same ticket?**
No. Each rule fires **at most once per ticket**, whatever the trigger, and the outcome is
logged. A rule with the `time_elapsed` trigger never fires in 2.31.0: it can be saved but is
not evaluated — [Configuration → Automations](./configuration#automations).

**What fires the `ticket.updated` webhook?**
A change of priority, category, department or team, and any status change other than to
*Resolved* — that one fires `ticket.resolved`. Public replies fire `ticket.replied`; internal
notes and assignment changes fire nothing. All six events and their payloads are in
[Integrations → Events and payload](./integrations#events-and-payload).

**When does an API token expire?**
`api_token_lifetime_days` after it is issued — 365 by default, `0` for never — fixed at
issue time. Each user may hold up to five, issued from **mooDesk → API tokens** only. Tokens,
scopes and the four checks every call passes are on [API](./api).

**Why does my valid token get *You are not allowed to use the rest protocol*?**
Its owner lacks `webservice/rest:use`, a Moodle capability no role holds by default —
[API → Before you start](./api#before-you-start).

## Cron and scheduled tasks

**What stops working if cron does not run?**
SLA breach flags and their notifications, auto-close, email ingestion, webhook deliveries,
operator alerts, the licence revocation check and every retention sweep. Ticket notifications
that follow an action in the browser still go out — Moodle sends them at once, unless the user
chose a daily digest. A site whose cron stopped looks like several unrelated bugs at once; it
is the first of the [first checks](./troubleshooting#first-checks).

**How often do the tasks run?**
Webhook deliveries every minute; mail ingestion and operator alerts every five minutes; the
SLA check hourly; auto-close at 02:00; the licence tasks at 03:00 and 03:30; the retention
sweeps between 04:20 and 05:50. The table with every task is in
[Installation → Scheduled tasks](./installation#scheduled-tasks).

## CSAT and knowledge base

**When does a requester get the satisfaction survey?**
When the ticket reaches the trigger status — *Resolved* by default — and CSAT is enabled: an
invitation goes out through the *Ticket notification* provider, and their own ticket page
shows a *How did we do?* card while the link is valid. It is sent **once per ticket**; a
later transition does not send it again — [Configuration → CSAT](./configuration#customer-satisfaction-csat).

**Where do knowledge base ratings and reads go?**
A rating is one person's current answer per article translation, exported and erased with
the user. Reads, suggestions and searches are anonymous events kept for a configurable time
— 365 days by default, 90 for searches, since a person typed those words; search text is
kept only for searches that found nothing, redacted —
[Configuration → General](./configuration#general).

**Why do articles not appear in Moodle's global search?**
Global search of articles is a **Pro** feature and needs Moodle's global search enabled with a
search engine, the *Knowledge base articles (mooDesk)* search area enabled, and the indexing
task run since the article was published. mooDesk's own search on the *Knowledge* page needs
none of that.

**Can an article be in several languages?**
On Pro. One article can carry a row per language; each reader gets their Moodle language when
a translation exists, with a notice when it falls back to another —
[Features → Knowledge base](./features#knowledge-base).

## Privacy and data

**Where is the data stored?**
In your Moodle database and file storage, in mooDesk's own tables. There is no mooDesk
cloud component and nothing is synchronised elsewhere.

**What leaves the server?**
Three things, each disclosed and each under your control:

- the daily download of the **licence revocation list**, a public file that carries no data
  of yours (can be switched off);
- **webhook deliveries** (Enterprise), which carry ticket data to the URLs an administrator
  entered;
- the **IMAP connection** to the mailbox an administrator configured (Pro), where mooDesk reads
  mail and, for refusals, sends bounces through Moodle's outgoing mail.

Nothing else. The detail is in [Installation → Network and privacy](./installation#network-and-privacy).

**Does mooDesk support GDPR data requests?**
Yes, through Moodle's privacy API. An export includes the user's tickets, replies and notes,
custom field answers, CSAT ratings, memberships, the mail they sent in and their audit entries.
Erasure **anonymises rather than deletes**: the tickets stay countable and other people's
replies survive, but the user's own content is replaced by a placeholder —
[Features → Privacy and data](./features#privacy-and-data).

**Is anything deleted automatically?**
Only operational records with a retention setting: refused and accepted mail records, System
Health incidents, webhook delivery logs, knowledge base analytics events and expired merge
snapshots. Tickets, replies and ratings are never purged by mooDesk.

## Getting help

**Something is not working. Where do I start?**
[Troubleshooting](./troubleshooting): how to read System Health, the five checks that settle
most cases, and symptom tables by area.

**And if that does not resolve it?**
Open an issue through [Support](./support) — bug report, feature request or documentation
issue. Issues are public: never include licence keys, tokens, passwords, email addresses or
real user data, and sanitise logs before attaching them.

**Is there commercial support?**
Contact digitalMood for licensing and support information.

---

*Verified against mooDesk 2.31.0.*
