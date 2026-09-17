---
title: Configuration
description: Recommended setup order, the full settings reference with real defaults, and how to configure roles, agents, categories, departments, teams, SLA targets and notifications.
---

# Configuration

Everything mooDesk can be configured with, in two places:

- **Plugin settings** — **Site administration → Plugins → Local plugins → mooDesk**. One page,
  in sections; this is where defaults, thresholds, switches and credentials live.
- **Operations** — the *Administration* group of mooDesk's own sidebar: categories,
  departments, agents, teams, custom fields, automations, webhooks, API tokens. These are
  records you create, not settings you toggle.

Sections that belong to a paid edition are shown on every edition; the code behind them does
nothing until the feature is licensed. Where an edition matters it is marked
<Badge type="tip" text="Pro" /> or <Badge type="warning" text="Enterprise" />.

::: info Not operational in 2.30.0
A few things exist on the settings page or in a form but do not do what their label suggests
in this release. They are listed where they appear and summarised under
[Known limitations](#known-limitations).
:::

## Recommended order

The order that avoids backtracking. [Getting Started](./getting-started) walks it with a smoke
check at the end.

1. Decide the **edition**: stay on Starter, or paste the licence key — [License](#license).
2. Check the **mooDesk Agent** role and decide who manages — [Roles](#roles).
3. Create **categories** and **departments** — [Categories](#categories),
   [Departments](#departments).
4. Add **agents** and put them in their departments — [Agents](#agents).
5. Set the **SLA targets** and confirm the **notifications** — [SLA](#sla), [Notifications](#notifications-1).
6. Optional, Pro: **email ingestion**, **custom fields**, **teams**, **automations**, **CSAT**.
7. Optional, Enterprise: **webhooks**, **API tokens** — see [Integrations](./integrations)
   and [API](./api).
8. Publish a first knowledge base article, run a ticket through, open **System Health**.

## Settings reference

In the order the settings page shows them. *Default* is the value a fresh install writes.

### License

| Setting | Key | What it does | Default |
|---|---|---|---|
| Licence key | `license_key` | The licence issued by digitalMood for this site. Empty runs the site as Starter. Saving revalidates the key and refreshes the License page. | — |
| Check for revoked licences | `revocation_enabled` | Fetch the licence revocation list once a day. | on |
| Revocation list URL | `revocation_crl_url` | Where the list is downloaded from. | `https://licenses.moodesk.io/crl/revocations.json` |

After saving a key, open **mooDesk → License** (site administrators only). It shows the
verdict, the effective edition, the expiry, and the *Agents* row as `active / limit`. When a
key is refused the site keeps running as **Starter** — nothing is deleted, Pro and Enterprise
data stays in the database, and a valid key brings everything back. The page names the reason:

| Status | Meaning |
|---|---|
| `missing` | No key saved |
| `malformed` | The text is not a licence key mooDesk can read |
| `forged` | The key's signature does not verify |
| `expired` | The key is past its expiry date |
| `revoked` | The key is on the revocation list |
| `site_mismatch` | The key was issued for another site URL — a staging copy of production is the usual case |
| `nopubkey` | mooDesk cannot read its own verification key: a broken install, reinstall the package |

A note *License claim ignored: N* beside the Agents row means the key carries an agent number
that is not the edition's contract; the edition's limit is what applies.

### General

| Setting | Key | What it does | Default |
|---|---|---|---|
| Default category | `defaultcategoryid` | Category preselected on the ticket form and used when the selector is hidden. | *General* |
| Knowledge base | `kb_enabled` | Show the knowledge base: reader, article management, *Suggested articles* on the ticket form, agent tools. Off hides all of it; articles are kept. | on |
| Knowledge base analytics retention (days) | `kb_analytics_retention_days` | Days anonymous knowledge base events (reads, suggestions shown and opened, links shared) are kept. 30–1095. | 365 |
| Knowledge base search analytics retention (days) | `kb_search_analytics_retention_days` | Days knowledge base **search** events are kept — shorter because a person typed the words. 30–365. | 90 |
| Allow file attachments | `attachments_enabled` | Attachments on tickets and replies. | **off** |
| Maximum attachment size | `max_attachment_size` | Per file. The options mirror Moodle's upload sizes; *Site upload limit* uses the site's `maxbytes`. | site limit |
| Maximum files per upload | `max_files_per_attachment` | Files per ticket or reply: 1, 2, 3, 5 or 10. | 5 |

Attachments are **off** on a fresh install; switch them on here if requesters or agents should
be able to attach files.

### Notifications

All four are on by default. They are sent through Moodle's messaging, so the site's outgoing
mail must be configured first. See [Notifications](#notifications-1) below for who receives
what and how users manage them.

| Setting | Key | Who is notified, when | Default |
|---|---|---|---|
| Notify agents on new unassigned ticket | `notify_agents_new` | Every agent, when a ticket is submitted with no assignee | on |
| Notify requester on agent reply | `notify_requester_reply` | The requester, when an agent posts a **public** reply | on |
| Notify agent on assignment | `notify_assignee_assign` | The new assignee, when a ticket is assigned or reassigned | on |
| Notify on SLA breach | `notify_sla_breach` | The assignee — every agent if there is none — when a ticket enters SLA breach | on |

### Automation

| Setting | Key | What it does | Default |
|---|---|---|---|
| Auto-close resolved tickets after (days) | `autoclose_resolved_days` | Days a *Resolved* ticket waits before the nightly task closes it. `0` never auto-closes. | 0 |
| Merge ordering | `merge_temporal_policy` | Which ticket a merge may close: *Only the older ticket can be merged away* or *Either ticket can be merged away*. <Badge type="warning" text="Enterprise" /> | older |

Automation *rules* (Pro) are not settings; they are created under **mooDesk → Automations** —
see [Automations](#automations).

### SLA

Targets are hours from ticket creation, one per clock and priority. `0` disables the target
for that clock and priority: the ticket shows no indicator for it and can never breach it.

| Setting | Key | What it does | Default |
|---|---|---|---|
| First response — Urgent / High / Normal / Low | `sla_response_hours_urgent` / `_high` / `_normal` / `_low` | Hours to the first public reply | 2 / 8 / 48 / 72 |
| Resolution time — Urgent / High / Normal / Low | `sla_resolve_hours_urgent` / `_high` / `_normal` / `_low` | Hours to *Resolved*, pauses excluded | 8 / 24 / 0 / 0 |
| SLA compliance target (%) | `sla_compliance_target` | Percentage drawn as the target line on the dashboard's SLA gauge <Badge type="tip" text="Pro" />. Empty draws no line | — |

The resolution targets for *Normal* and *Low* are off by default. Set all four resolution
targets before you read any compliance figure. How the clocks work is under [SLA](#sla-1).

### Email ingestion <Badge type="tip" text="Pro" />

Turns a dedicated IMAP mailbox into tickets and replies. The `process_incoming_email` task
polls the mailbox **every 5 minutes** — see
[Installation → Scheduled tasks](./installation#scheduled-tasks). The full setup —
prerequisites, provider notes, what happens to each incoming message — is in
[Integrations](./integrations).

::: warning Microsoft 365 / Exchange Online mailboxes cannot be connected in 2.30.0
mooDesk 2.30.0 authenticates with IMAP `LOGIN` (username and password) only and does not
implement OAuth2 (`XOAUTH2`), which Exchange Online requires. Use a mailbox on a provider that
still accepts password authentication over IMAP.
:::

| Setting | Key | What it does | Default |
|---|---|---|---|
| Enable email ingestion | `email_ingestion_enabled` | Master switch | off |
| IMAP server hostname | `email_imap_host` | | — |
| IMAP port | `email_imap_port` | | 993 |
| Use SSL/TLS | `email_imap_ssl` | TLS from the first byte. Off means a plain-text connection. | on |
| Mailbox username | `email_imap_user` | An email address | — |
| Mailbox password | `email_imap_password` | Stored as a Moodle plugin setting, like every other plugin secret | — |
| IMAP folder | `email_imap_folder` | Folder to poll | `INBOX` |
| Maximum messages per run | `email_imap_maxmessages` | Messages one poll processes; the rest wait for the next run. `0` = no cap | 100 |
| Default department for email tickets | `email_default_departmentid` | Department for tickets opened by mail; *No department* makes them visible to every agent | none |
| Default category for email tickets | `email_default_categoryid` | | the site default |

Mail from an address that does not match an active Moodle account is **refused** and reported
to the alert recipients. mooDesk never creates accounts.

### Email reply authentication <Badge type="tip" text="Pro" />

mooDesk puts a token in the *Reply-To* address of its own notifications so that a reply by
mail can be tied to the conversation it belongs to, instead of being trusted on its `From:`
header alone.

| Setting | Key | What it does | Default |
|---|---|---|---|
| Reply address | `email_reply_address` | The support address the token is added to, for example `support@example.org`. The mailbox must deliver sub-addresses (`support+anything@…`) to the same inbox, and the part before `@` may be at most 13 characters. | — |
| Sub-address delimiter | `email_reply_address_delimiter` | `+` or `-` | `+` |
| Reply authentication | `email_reply_auth_mode` | *Legacy* (deprecated, transition only) · *Prefer token* (accepts replies with and without a token and counts them) · *Require token* (refuses a reply without a valid token) | **Require token** on a fresh install; **Prefer token** on a site upgraded from an earlier version |
| Reply token lifetime | `email_reply_token_maxage` | How long a token stays valid | 90 days |

Three rules to know before touching this block:

- *Require token* cannot be selected until a check sent to the tokenised address has come
  back through ingestion for the address configured right now. Changing the address withdraws
  that proof.
- A **fresh install** that enables email ingestion without configuring the reply address
  refuses replies by mail until the address is set and verified. New tickets by mail are not
  affected. System Health says so.
- *Legacy* is not a way to keep replies working without tokens. Without a token, mooDesk can
  only thread a reply through `In-Reply-To` / `References` to mail it has **received** for
  that ticket — it does not record the Message-ID of the notifications it sends — so a reply
  to a notification is not reliably matched to its ticket in this mode. Keep the token
  mechanism on; see [Integrations → Replying by email](./integrations#replying-by-email).

### Inbound sender authentication <Badge type="tip" text="Pro" />

The `From:` of an incoming mail is a claim. mooDesk cannot check SPF, DKIM or DMARC itself;
it can read the verdict your mail provider stamped on the message, if it can tell that verdict
from one written by the sender.

| Setting | Key | What it does | Default |
|---|---|---|---|
| Provider profile | `email_auth_profile` | *None* · *Gmail / Google Workspace* · *Other mail server* | *None* |
| Trusted authentication server identifiers | `email_auth_authserv` | The identifier your provider writes in its authentication header (for Google Workspace, usually `mx.google.com` — copy it from a real message, do not assume it) | — |
| My mail server strips forged authentication headers | `email_auth_gateway_asserted` | *Other mail server* only. mooDesk cannot verify this assertion; if it is false, a forged verdict is read as genuine. | off |
| Sender authenticity for new tickets | `email_verify_new_tickets` | *Off* · *Warn* · *Require* | *Warn* |

*Require* unlocks only after real traffic has proven the profile: in the last 7 days at least
20 evaluated messages, at least 10 authenticated, and at least 80 % with a verdict the profile
could read. System Health shows the progress. Once on, *Require* never relaxes itself.

#### Operator alerts and retention

These settings appear at the end of the *Inbound sender authentication* section.

| Setting | Key | What it does | Default |
|---|---|---|---|
| Unknown-sender alert recipients | `email_alert_recipients` | Comma-separated list of Moodle **user IDs** of the people who receive operator alerts (refused senders, System Health incidents). Empty = the site administrators | — |
| Alert from severity | `incident_alert_severity` | Lowest System Health severity that sends an operator alert: *warning* · *error* · *critical* | error |
| Alert cooldown (minutes) | `incident_alert_cooldown` | Minimum time between alerts for the same incident | 60 |
| Active incident window (hours) | `incident_active_window_hours` | How long after its last occurrence an incident still counts as a current problem on System Health. The row stays; only its status changes. | 24 |
| Incident retention (days) | `incident_retention_days` | Days an incident is kept after its last occurrence before it is deleted | 90 |
| Refused mail retention (days) | `email_audit_retention_days` | Days the identifying details of a refused inbound mail are kept | 90 |
| Ticket correspondence retention (days) | `email_correspondence_retention_days` | Days the record linking an accepted mail to its ticket or reply is kept | 365 |
| Deduplication window (seconds) | `email_dedup_window` | Within this window the same Message-ID, or the same sender and subject, is dropped as a duplicate | 300 |

The alert and incident settings apply on every edition — System Health is not a licensed
feature — even though they sit inside a Pro section of the page.

### Customer satisfaction (CSAT) <Badge type="tip" text="Pro" />

| Setting | Key | What it does | Default |
|---|---|---|---|
| Enable CSAT surveys | `csat_enabled` | Master switch | off |
| Send survey on | `csat_trigger` | Which status creates the survey: *Resolved* or *Closed* | Resolved |
| Survey link expiry (days) | `csat_token_expiry_days` | How long the survey link stays valid | 30 |
| Custom invitation message | `csat_invitation_message` | A paragraph of your own for the invitation | — |

::: warning Not operational in 2.30.0
When a ticket reaches the trigger status, mooDesk creates the survey record but **does not
deliver the invitation** to the requester: no mail is sent and no link is shown on their
ticket. *Custom invitation message* is not used. The survey page, the rating scale and the
*Customer satisfaction* card agents see all work once a requester reaches the link, but in
2.30.0 there is no built-in way for them to receive it. Do not promise CSAT to requesters on
this version.
:::

### Webhooks <Badge type="warning" text="Enterprise" />

Webhooks themselves are created under **mooDesk → Webhooks**; see
[Integrations](./integrations). The one setting here:

| Setting | Key | What it does | Default |
|---|---|---|---|
| Webhook delivery log retention (days) | `webhook_log_retention_days` | Days a delivery log row — the payload sent and the first bytes of the response — is kept | 90 |

### API access <Badge type="warning" text="Enterprise" />

This section is shown **only when the active edition is Enterprise**. Tokens are issued under
**mooDesk → API tokens**; see [API](./api).

| Setting | Key | What it does | Default |
|---|---|---|---|
| API token lifetime (days) | `api_token_lifetime_days` | Validity of a token from its creation. `0` = never expires | 365 |
| API requests per window | `api_rate_limit` | Requests each token may make per window. `0` disables rate limiting | 300 |
| API rate window (seconds) | `api_rate_window` | Length of the window | 60 |

## Roles

mooDesk's permissions are Moodle capabilities at system context; the complete table, with what
each capability allows and who holds it by default, is under
[Installation → Roles and capabilities](./installation#roles-and-capabilities). In short:

- **mooDesk Agent** (`mhd_agent`) is seeded by the install and holds `local/moodesk:agent`,
  `:viewall`, `:reply`, `:addnote`, `:manage` and `:editkb`. It is what *Add agent* assigns.
  Add capabilities to it under **Site administration → Users → Permissions → Define roles** if
  your agents should do more — `local/moodesk:managekb` to publish articles is the common one.
- **Management** capabilities (departments, categories, agents, reports, System Health,
  publishing articles, and the Pro and Enterprise objects) belong to Moodle's **Manager**
  archetype by default. For a narrower role, create a *mooDesk Manager* with exactly the
  capabilities you want.
- **Requesters** need nothing: every authenticated user can open tickets, see their own and
  read published articles.

Site administrators are not agents unless they hold `local/moodesk:agent`; they can manage
everything but cannot be assigned a ticket.

## Agents

**mooDesk → Agents** (`local/moodesk:manageagents`) is the agent directory: every agent with
their departments, teams (Pro), open ticket count, and whether mooDesk manages their role.
The list filters by department, team, status and managed / unmanaged, and warns about agents
in no department and departments with no members.

- **Add agent** — search a Moodle user, *Make agent*. The screen shows the edition's limit
  before you pick anyone; at the limit the button is disabled.
- **Remove** — takes the role away and puts the agent's open tickets back in their
  departments' unassigned pool. Only agents mooDesk manages (those holding the *mooDesk
  Agent* role) can be removed here; an agent who holds the capability through another role
  is refused, and that role must be changed in Moodle.
- **Panel** <Badge type="tip" text="Pro" /> — one page per agent with their identity, open
  workload, and department and team membership edited in place.

Who counts as an agent: anyone holding `local/moodesk:agent` at system context who is neither
suspended nor deleted. Agents given the role through Moodle's own screens, an SSO mapping or
a script are counted but not managed by mooDesk: if that takes the site over its limit, every
agent keeps working, the License and System Health pages say *Agent limit exceeded*, and
*Add agent* refuses until the site is back under.

| Edition | Active agents |
|---|---|
| Starter | 2 |
| Pro | 10 |
| Enterprise | unlimited |

An agent must be a member of a department to be assigned its tickets. An agent in no
department and no team cannot be assigned anything, and the directory says so.

## Categories

Categories classify what a ticket is about (*Enrolment*, *Login*, *Grades*). They drive the
queue's category filter, the reports and the knowledge base's *Suggested articles*. Every
edition, without limit.

**mooDesk → Categories** (`local/moodesk:managecategory`). *Add category* asks for a **name**
(required), a **description** (internal note, not shown on the ticket form) and a **sort
order**. Categories are flat — no parent/child tree.

- The install seeds **General** and makes it the default. Change the default with the
  *Default category* setting. The default category cannot be archived; pick another default
  first.
- When only one active category exists the ticket form shows no selector; the ticket gets
  that category silently.
- Categories are never deleted. **Archive** hides one from every selector and filter — tickets
  that carry it keep showing it — and **Restore** brings it back.

## Departments

A department is a routing queue: a ticket goes to one department (or to none), and only the
department's members can be assigned to it. A ticket with **no department** is visible to
every agent and can be assigned to any of them. Every edition; the install seeds **General**.

**mooDesk → Departments** (`local/moodesk:managedepartment`). *Add department* asks for a
**name** (required), a **description** and **Active**.

- **Manage members** lists the current members with a *Remove* control and offers the agents
  not yet in it. Only users who are already agents are offered — make someone an agent first.
  An agent can belong to any number of departments.
- Departments are archived, not deleted. An archived department disappears from the ticket
  form and the filters; tickets keep the reference, members stay members, and **Restore**
  puts everything back.

### SLA overrides per department <Badge type="tip" text="Pro" />

On Pro the department form has a second block, **SLA overrides**, with the same eight fields
as the global SLA settings: first response and resolution for each priority.

| Value | Effect |
|---|---|
| Blank (*Inherit*) | The global target applies |
| A whole number of hours | Replaces the global target for this department and priority |
| `0` | No target for that department and priority |

A ticket with no department uses the global targets.

## Teams <Badge type="tip" text="Pro" />

Teams group agents across departments — a *Tier 2* team, an upgrade task force — so a ticket
can be owned by a group as well as by a person.

| | Department | Team |
|---|---|---|
| What it is | A routing queue with members | A working group of agents |
| On the ticket | Set by the requester (optional) or an agent | Set by an agent, from the ticket's sidebar |
| Who can be assigned | Only members of the ticket's department | Unchanged — the team does not restrict assignment |
| In the queue | *My departments* tab and the Department filter | Team filter |

**mooDesk → Teams** (`local/moodesk:manageteam`): *Add team* (name, description, active),
*Manage members* works like the department one, and an agent can be in any number of teams.
Same archive/restore rule as departments.

## Custom fields <Badge type="tip" text="Pro" />

Custom fields add questions of your own to the ticket form — *Campus*, *Student ID*,
*Affected course* — and show the answers on the ticket. **mooDesk → Custom fields**
(`local/moodesk:managesettings`).

*Add field*: **name**, **description** (help text under the input), **type**, **options**
(one per line, dropdowns only), **required**, **visibility**, **sort order**.

| Type | On the form |
|---|---|
| Text | One-line input (255 characters) |
| Text area | Multi-line input |
| Dropdown | The *Options* list |
| Checkbox | Tick box |
| Date | Date selector |

*Everyone* fields appear on the requester's form and on the ticket for everyone. *Agents
only* fields never reach the requester; agents fill them from the ticket's sidebar. Fields are
archived, not deleted, and a restored field shows its old answers.

## SLA

The SLA is two clocks per ticket, measured against the targets set per priority.

| Clock | Starts | Stops | Met when |
|---|---|---|---|
| First response | Ticket created | An agent posts a **public reply** — an internal note does not count | The reply came before the target |
| Resolution | Ticket created | Status becomes *Resolved* | Resolved before the target, pauses excluded |

The resolution clock **pauses** while the ticket is *Pending* (waiting on the requester) and
resumes when it leaves that status. Time the requester took to answer is never charged to
the team.

What the interface shows, per ticket:

| State | Meaning |
|---|---|
| On track | Both clocks inside their targets |
| Warning | 20 % or less of a target remains |
| Breached | A target has passed |
| — | Both targets are `0` |

The queue shows the indicator per row, filters on it and can sort by SLA urgency; the
ticket's sidebar shows each target, the time used and the time left or overrun.

The `check_sla_breaches` task runs **hourly** and keeps each active ticket's breach flag in
step with the live verdict — set when a target has passed, cleared when a pause pushed the
deadline back out. The first time a ticket goes into breach, the breach notification is sent
and any `sla_breached` automation rules run. *Resolved* and *Closed* tickets are never
revisited: their flag freezes as the record the reports read.

Priorities are *Low*, *Normal*, *High* and *Urgent*. Requesters do not choose one: a ticket is
created *Normal* and agents change it from the sidebar (or an automation rule sets it).

## Notifications

mooDesk sends through Moodle's messaging, so delivery, digests and each user's own
preferences are Moodle's. Nothing here works until **Site administration → Server → Email →
Outgoing mail configuration** does.

The four switches are listed under [Settings → Notifications](#notifications). Internal
notes, priority changes and status changes notify nobody.

Three message providers, each enabled by default for email and popup:

| Provider | Carries |
|---|---|
| Ticket notification | The four ticket notifications |
| Email ingestion alert | Operator alerts from email ingestion — an inbound mail that could not be routed |
| Operational alert | Operator alerts from System Health — a source that started failing |

They are separate so an operator can silence one without the others. Users manage them under
**Preferences → Notification preferences** (the *mooDesk* rows); a site administrator sets
the defaults under **Site administration → Messaging → Notification settings**. Operator
alerts go to the users in *Unknown-sender alert recipients*, or to the site administrators
when that list is empty, at or above *Alert from severity*, no more often than the *Alert
cooldown* for the same incident.

## Automations <Badge type="tip" text="Pro" />

A rule watches for something happening to a ticket, checks conditions, and applies actions
with nobody at the keyboard. **mooDesk → Automations** (`local/moodesk:manageautomations`).
The list shows each rule's trigger, conditions, actions and order, with an activate /
deactivate toggle; deleting a rule keeps its execution log.

A rule has a **name**, a **description**, a **trigger**, a **sort order** (rules for the same
trigger run ascending), **Active**, and three JSON fields validated on save:

**Trigger configuration** (JSON object, optional)

| Trigger | Fires when | Configuration |
|---|---|---|
| `ticket_created` | A ticket is created, from any source | — |
| `status_changed` | A ticket changes status | `{"from": 1, "to": 4}` — either side `null` for *any* |
| `sla_breached` | The hourly check puts a ticket in breach | — |
| `time_elapsed` | **Never — not evaluated in 2.30.0** (see below) | `{"hours": 24, "since": "created"}` |

**Conditions** (JSON array; `[]` matches every ticket; all must pass): `priority_is`,
`status_is`, `department_is`, `category_is`, `assignee_is` — each with `"operator"` `equals`
or `not_equals` and the code or id as `"value"` — and `is_unassigned`, which takes neither.

```json
[{"type": "priority_is", "operator": "equals", "value": 3},
 {"type": "is_unassigned"}]
```

**Actions** (JSON array, required, run in order): `set_status` (a status code; must be a
valid transition), `set_priority` (0–3), `assign_to` (user id of an agent; department
membership applies), `set_department` (department id), `add_note` (text of an internal note).

```json
[{"type": "set_priority", "value": 3},
 {"type": "add_note", "value": "Auto-escalated: urgent and unassigned"}]
```

Status codes are `1` open, `2` pending, `4` resolved, `5` closed, `6` in progress;
priorities `0` low, `1` normal, `2` high, `3` urgent.

How rules run:

- Inside the request that raised the event, through the same services an agent uses — the
  status rules, the department rule on assignment and the audit log all apply.
- **Each rule fires at most once per ticket**, whatever the trigger. That is also what stops
  a rule from re-triggering itself.
- A ticket merged into another one is skipped.
- Every run is recorded in the rule's execution log.
- Below Pro, rules stay stored and inert.

::: warning `time_elapsed` is not operational in 2.30.0
The trigger can be selected and saved, but nothing evaluates it: a rule with that trigger is
stored and never fires. For "after N hours" behaviour on this version, use the SLA targets
and an `sla_breached` rule.
:::

## Known limitations

Configuration that exists in 2.30.0 but does not do what its label suggests:

| Where | What | Status in 2.30.0 |
|---|---|---|
| CSAT | Survey invitation to the requester; *Custom invitation message* | Not delivered; setting unused |
| Automations | `time_elapsed` trigger | Stored, never evaluated |
| Scheduled tasks | `sync_license` | Registered and enabled; performs no work |
| Email ingestion | Microsoft 365 / Exchange Online mailboxes | Cannot be connected: IMAP `LOGIN` only, no `XOAUTH2` |

---

*Verified against mooDesk 2.30.0.*
