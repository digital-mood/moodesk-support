---
title: Troubleshooting
description: Where to look when mooDesk misbehaves — reading System Health, the first checks that settle most cases, symptom tables by area, the reference of every incident mooDesk can record, and what to collect before reporting a bug.
---

# Troubleshooting

Something is not doing what it should. This page is organised the way a diagnosis goes:
**where mooDesk reports its own failures**, the **five checks** that settle most cases, then
**symptoms by area**, and finally the **reference of every incident** the plugin can record.
How each feature works, and what each setting does, stays on the pages linked from here.

## Start with System Health

**mooDesk → System health** (`/local/moodesk/health.php`, capability `local/moodesk:viewhealth`)
is where mooDesk shows what it absorbed instead of letting it break a ticket: a notification
that could not be sent, a webhook that keeps failing, a mailbox poll that errored, a scheduled
task that threw, a knowledge base write that failed, an unexpected error in the interface.
What the page contains is described in [Features → System Health](./features#system-health);
this is how to read it when something is wrong.

| What you see | What it means |
|---|---|
| **Everything is working** | No live incident in the active window (24 hours by default) |
| **Something needs attention** | At least one live incident of severity *warning* or *error* |
| **A source is down** | At least one live *critical* incident. Only one thing is critical today: the mailbox poll failing as a whole |
| A source card reading *N live incident(s)* | Which of the six sources — *Notifications and automation*, *Webhooks*, *Email ingestion*, *Scheduled tasks*, *Knowledge base*, *Interface* — the trouble is in |
| An incident row | One **fingerprint**: the same failure repeating collapses onto one row and bumps *Occurrences* and *Last seen*, rather than piling up rows. The *code* on the row (for example `email_ingestion.imap.poll_failed`) is what the [incident reference](#incident-reference) below is keyed on |
| **Acknowledge** | You are on it: alerts for this incident stop, the row stays listed. Needs `local/moodesk:managesettings` |
| **Resolve** | It is fixed: the row leaves the live list. If the same failure happens again the incident **reopens with its history**, so a resolved incident that keeps coming back is a fix that did not take |

Three things to know about what is *not* on the page:

- **The message is redacted.** Before an incident is stored, passwords, tokens, keys, JWTs,
  IMAP `LOGIN` lines and **every email address** are removed from the message. An operator
  learns that a delivery failed, not to whom. The operator alert about a refused sender,
  sent through Moodle messaging, is where the address is.
- **Older than the window is not gone.** An incident whose last occurrence is older than the
  *Active incident window* stops counting as a current problem but stays on record until
  *Incident retention* (90 days) removes it.
- **Alerts are a separate channel.** New incidents at or above *Alert from severity* (*error*
  by default) are sent by Moodle messaging to the *Unknown-sender alert recipients*, or to the
  site administrators when that list is empty, no more than once per *Alert cooldown* per
  incident. All four settings are in
  [Configuration → Operator alerts and retention](./configuration#operator-alerts-and-retention).
  If you never receive an alert but System Health shows incidents, see
  [Notifications](#notifications).

Where else mooDesk writes:

| Log | Where | Holds |
|---|---|---|
| Task logs | *Site administration → Server → Tasks → Task logs*, component *mooDesk* | One line per run of each scheduled task, including the per-outcome counts of the mailbox poll and the webhook dispatcher |
| Webhook delivery log | *mooDesk → Webhooks*, the *Recent deliveries* list of each webhook | Every attempt with payload, HTTP status and the first 4 KB of the response — [Integrations](./integrations#delivery-retries-and-the-log) |
| Moodle's error log | The web server's PHP error log; *Debugging* under *Site administration → Development* | Anything that escaped mooDesk's own handling |

## First checks

Five questions that settle most reports before any digging.

1. **Is cron running?** *Site administration → Server → Tasks → Scheduled tasks*, filter
   *mooDesk*: every task shows a recent *Last run* and no *Fail delay*. Notifications, SLA
   breaches, auto-close, email ingestion, webhook deliveries and operator alerts all depend on
   cron. A site where cron stopped looks like six different bugs at once.
2. **Which edition is the site actually running?** *mooDesk → License* shows the verdict and
   the effective edition. A refused key runs the site as **Starter** without deleting anything:
   Pro and Enterprise screens turn into an upgrade prompt and their tasks do nothing. The
   verdicts are explained in [Configuration → License](./configuration#license).
3. **Does the user hold the capability?** Every mooDesk screen and action is a capability at
   system context. *Site administration → Users → Permissions → Check system permissions*
   for the user answers most "I cannot see / cannot do" reports; the table of capabilities is
   in [Installation → Roles and capabilities](./installation#roles-and-capabilities).
4. **Is the task enabled?** A task can be disabled from Moodle's task list without mooDesk
   noticing. Check the *Enabled* column for the task behind the feature — the list with
   schedules is in [Installation → Scheduled tasks](./installation#scheduled-tasks).
5. **What does System Health say?** If the page is green and the report is about something
   mooDesk *did not do*, the cause is almost always one of the four points above rather than a
   failure: mooDesk records failures, not decisions.

## Symptoms

Each table reads *what you see → the usual cause → where to confirm it → what to do*. Where a
cause is documented elsewhere, the link is the fix.

### Installation and upgrade

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| The plugin is not listed, or Moodle refuses to install it | Moodle below **4.5** — mooDesk requires it | *Site administration → Notifications* names the requirement | Upgrade Moodle first; see [Installation → System requirements](./installation#system-requirements) |
| *mooDesk* appears in the navigation but every page errors | The upgrade did not complete — tables or roles missing | *Plugins overview* shows a status other than *Up to date* | Run *Site administration → Notifications* to completion, then read the web server's error log |
| Nothing in the *Administration* group of mooDesk's sidebar | The user has no management capability | *Check system permissions* | Entries appear per capability; the Manager archetype holds them by default |
| After an upgrade, a page is blank or styled wrongly | Cached templates or JavaScript | Reproduce in a private window | *Site administration → Development → Purge all caches* |
| The *mooDesk Agent* role is missing | It is seeded only by a fresh install; deleted roles are not recreated | *Define roles* | Recreate it by hand with the capabilities listed in [Configuration → Roles](./configuration#roles), or reinstall |

### Licence and editions

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| A Pro or Enterprise screen shows an upgrade prompt on a licensed site | The key is refused, so the site is Starter | *mooDesk → License* shows a verdict other than *valid* | Read the verdict: *malformed*, *forged*, *expired*, *revoked*, *site_mismatch* — each is explained in [Configuration → License](./configuration#license) |
| It worked yesterday; today it is Starter | The key expired, or the revocation list now lists it | The verdict says *expired* or *revoked* | Contact digitalMood for a renewed key; paste it under *Licence key*, which revalidates on save |
| *site_mismatch* on a site that has the right key | The key was issued for another URL — a staging copy of production is the usual case | The verdict names it | A key is bound to one site URL; staging needs its own |
| *Agent limit exceeded* on License and System Health | More active agents than the licence allows | *Entitlement* block on System Health shows `active / limit` | Nothing stops working; offboard agents or extend the licence — [Configuration → Agents](./configuration#agents) |
| The revocation check never runs | Outbound HTTPS blocked, or `revocation_enabled` off | Task log of `refresh_revocation_list` | Allow `licenses.moodesk.io` — [Installation → Network and privacy](./installation#network-and-privacy) |
| `sync_license` runs and does nothing | Expected: the task is registered but performs no work in 2.31.0 | — | Nothing; see [Configuration → Known limitations](./configuration#known-limitations) |

### Permissions and visibility

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| An agent sees only their own tickets | The account has `viewown` but not `viewall` — it is not in the *mooDesk Agent* role | *Check system permissions* | Add the agent through *mooDesk → Agents*, which assigns the role; do not assign `viewall` alone |
| An agent cannot reply, or cannot add a note | Missing `reply` / `addnote`, or the ticket is **merged into another** and read-only | The ticket shows the merge banner | Continue on the target ticket; see [Features → Merging duplicates](./features#merging-duplicates) |
| A site administrator cannot be assigned a ticket | Administrators are not agents unless they hold `local/moodesk:agent` | *mooDesk → Agents* | Add them as an agent if they should take tickets |
| A ticket cannot be assigned to a particular agent | The ticket belongs to a department the agent is not a member of | *mooDesk → Departments → members* | Add the agent to the department, or move the ticket |
| Requesters cannot open tickets | `local/moodesk:submit` removed from *Authenticated user*, or the default category is missing or inactive | *Check system permissions*; *Site administration → Plugins → Local plugins → mooDesk → Default category* | Restore the capability; set an active default category — [Configuration → Categories](./configuration#categories) |
| Nobody can see a knowledge base article | It is a **draft** or **archived**, it is *Agents only*, or the reader's language has no translation and the fallback is another row | Open it as an editor: status, audience and translations are on the article | Publish it; set the audience; add the translation — [Features → Knowledge base](./features#knowledge-base) |

### Notifications

mooDesk never sends mail itself: every notification goes through **Moodle messaging**, and
every operator alert too. Three providers carry them — *Ticket notification*, *Email
ingestion alert*, *Operational alert* — described in
[Configuration → Notifications](./configuration#notifications-1).

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| No notification of any kind reaches anyone | Moodle's outgoing mail is not configured, or cron is not running | *Site administration → Server → Email → Test outgoing mail configuration*; scheduled tasks *Last run* | Fix Moodle's mail first; nothing in mooDesk can work around it |
| One user gets nothing, others do | The user disabled the provider under *Preferences → Notification preferences*, or the provider's site default is off | Their preferences; *Site administration → Messaging → Notification settings* | Re-enable the *mooDesk* rows; site defaults are per provider |
| The notification arrives, but late | Moodle sends through cron and the user's digest settings | Digest setting in the user's preferences | Expected behaviour of Moodle messaging |
| A specific notification never fires | Its switch is off, or the event does not notify by design — internal notes, priority and status changes notify nobody | [Configuration → Notifications](./configuration#notifications) | Turn the switch on; the four events are the only ones |
| System Health shows `observer.<event>.failed` | The sending threw — usually a messaging or mail failure — and **nothing retries it**: that notification is lost | The incident's message (redacted) | Fix the underlying failure; the next event sends normally |
| Operator alerts never arrive although incidents exist | The incident is below *Alert from severity*, is inside the cooldown, or was acknowledged; or the recipients list names an ID that is not a user | [Operator alerts and retention](./configuration#operator-alerts-and-retention) | Lower the threshold to *warning* while diagnosing; verify the user IDs |
| The CSAT invitation is not received | The ticket never reached the trigger status, or the requester silenced *Ticket notification*; it is sent **once per ticket**, never on a later transition | The requester's own ticket page shows a *How did we do?* card while the invitation is open | [Configuration → CSAT](./configuration#customer-satisfaction-csat) |

### Email ingestion and reply by email <Badge type="tip" text="Pro" />

The mailbox is polled by the `process_incoming_email` task every 5 minutes. Every message
ends in one of the outcomes listed in [Integrations → Outcomes](./integrations#outcomes);
the task log counts them per run. Provider-specific pitfalls — app passwords, IMAP switched
off, Microsoft 365 — are under [Provider notes](./integrations#provider-notes).

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| No mail becomes a ticket, System Health reads **A source is down** | The connection, login or folder select failed: wrong host, port or password, IMAP disabled at the provider, TLS or firewall | Incident `email_ingestion.imap.poll_failed` — its message is the server's answer, with the password removed | Fix the mailbox settings; the next poll clears it — [Integrations → Connect the mailbox](./integrations#connect-the-mailbox) |
| No mail becomes a ticket, System Health is green | The task is disabled, cron is not running, or the mailbox has no unseen mail in the polled folder | Task log of `process_incoming_email`: no runs, or `0` outcomes | [First checks](#first-checks); check the folder name and that mail arrives unread |
| A sender's mail is refused and the operators get an alert | The sender is not an active Moodle user (`unknown_sender_rejected`), or *Inbound sender authentication* is on *Require* and the verdict was not a pass (`sender_unverified_rejected`) | Task log; the alert names the outcome | The sender needs a Moodle account with that address; or review the strict policy — [Integrations → Sender authentication](./integrations#sender-authentication) |
| Every new ticket by mail is refused since *Require* was turned on | The provider profile cannot read a verdict on this mailbox | Incident `email_ingestion.ticket.sender_auth_unreadable` | Choose the right profile, or step back from *Require* — the policy does not change itself |
| Replies by mail are refused, new tickets work | Reply authentication is *Require token* and the message carried none (`token_required`), or the token did not verify (`token_invalid`), or a valid token came from another address (`token_sender_mismatch`) | Task log outcome; matching `email_ingestion.reply.*` incident | [Integrations → Modes and the round-trip check](./integrations#modes-and-the-round-trip-check) |
| Replies are refused and an *error* incident says the address is unproven | *Require token* is on but the round-trip probe for the current reply address never came back | Incident `email_ingestion.reply.token_address_unproven` | Fix the reply address and run the probe again — [Resetting a ticket's reply links](./integrations#resetting-a-tickets-reply-links) |
| A reply by mail lands as a new ticket | Threading failed: the reply link was stripped by the mail client, or the mode is *Legacy* with its limits | [Integrations → Modes](./integrations#modes-and-the-round-trip-check) | Ask the sender to reply to the notification unedited; prefer token mode |
| The same mail creates two tickets | Sent twice outside the deduplication window (300 s by default) | Task log shows two `ticket_created` | Raise `email_dedup_window` if your provider re-delivers — [Operator alerts and retention](./configuration#operator-alerts-and-retention) |
| One message is skipped on every poll | It cannot be parsed (`email_ingestion.parse.failed`, retried each run) or cannot be stored (`email_ingestion.message.unprocessable`, set aside for good) | Matching incident | Move the message out of the folder by hand; if it recurs, report it with the sanitised headers |
| An attachment is missing from a ticket created by mail | Above the size limit — skipped, noted in the task log, no incident — or file storage refused it | Task log line *exceeds max … skipped*; or incident `email_ingestion.attachment.store_failed`. The ticket itself was created | Ask for a smaller file; or check Moodle's data directory |
| The sender was refused but received no bounce | Sending the bounce failed | Incident `email_ingestion.bounce.send_failed` — same root cause as [Notifications](#notifications) | Fix outgoing mail |

### Webhooks <Badge type="warning" text="Enterprise" />

Deliveries leave through the `dispatch_webhook` task every minute, through **Moodle's HTTP
client**, with 5 attempts and the timeouts described in
[Integrations → Delivery, retries and the log](./integrations#delivery-retries-and-the-log).

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| Nothing is ever delivered | Cron not running, the task disabled, or the webhook *paused* | Task log of `dispatch_webhook`; the webhook's *Active* state | [First checks](#first-checks) |
| Every attempt fails with a transport error | The host or port is blocked by **Moodle's HTTP security** settings, DNS does not resolve from the server, or the certificate is not valid — mooDesk verifies TLS and follows no redirects | Delivery log: the error text of the attempt | *Site administration → Security → HTTP security* (blocked hosts, allowed ports); use a valid certificate; give the final URL |
| Attempts time out | The endpoint answers in more than 5 seconds | Delivery log | Acknowledge fast, process later |
| Deliveries stop after five failures and an incident appears | Expected: the row is abandoned after the fifth attempt | Incident `webhook.delivery.abandoned`, one per webhook | Fix the endpoint, then *Resolve*. Abandoned deliveries are **not** replayed |
| Deliveries fail permanently right after editing the webhook | The webhook was disabled or deleted while rows were pending — they fail permanently | Delivery log | Expected; re-enable before the queue drains next time |
| The receiver rejects the signature | The secret was cleared: an `update_webhook` API call that did not resend it, or the form saved empty | [Integrations → Verifying the signature](./integrations#verifying-the-signature) | Set the secret again on both sides |
| An event you expected never appears in the log | The webhook is not subscribed to it, or the event does not exist — there is no assignment event | [Integrations → Events and payload](./integrations#events-and-payload) | Subscribe; watch `ticket.updated` for the other fields |
| `webhook.enqueue.failed` or `webhook.queue.row_failed` | A database failure while queuing or processing — the event for that subscription is **lost** | The incident's `exception_class` | Check the database and Moodle's error log; report if it recurs |

### Scheduled tasks and cron

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| SLA breaches are flagged up to an hour late | Expected: `check_sla_breaches` runs **hourly**; the SLA badge on the ticket is computed live, the breach event and its notification are not | Task schedule | Run the task more often from Moodle's task list if the hour matters |
| Resolved tickets never close by themselves | `autoclose_resolved_days` is `0` (the default), or the task is disabled; it runs daily at 02:00 | [Configuration → Automation](./configuration#automation) | Set the number of days |
| A task shows a *Fail delay* that keeps doubling | The task throws on every run; Moodle backs off | Task log for the exception; System Health for a matching incident | Fix the cause; *Clear fail delay* on the task |
| `scheduled_task.check_sla.ticket_failed` / `scheduled_task.autoclose.ticket_failed` | One ticket failed inside the task; the run continued with the others | The incident's `ticketid` | Open that ticket; the message says what threw |
| A retention sweep never runs | Disabled, or the site's cron does not reach the early-morning slots | *Last run* on `purge_incidents`, `purge_webhook_log`, `purge_email_audit`, `purge_kb_events`, `purge_merge_snapshots` | Run cron continuously; the sweeps are spread between 04:20 and 05:50 |
| An automation rule never fires | Its trigger is `time_elapsed`, which is stored and never evaluated in 2.31.0 | [Configuration → Known limitations](./configuration#known-limitations) | Use an event trigger |

### REST API <Badge type="warning" text="Enterprise" />

Every API error is an entry in [API → Errors](./api#errors), and the four checks a call
passes are in [API → How a call is authorised](./api#how-a-call-is-authorised). The two
reports that are not API errors:

| Symptom | Usual cause | Do |
|---|---|---|
| *You are not allowed to use the rest protocol* | The token's owner lacks `webservice/rest:use`, which no Moodle role holds by default | [API → Before you start](./api#before-you-start) |
| The *Generate token* form is missing from the API tokens page | The site is not Enterprise | [Licence and editions](#licence-and-editions) |

### Knowledge base

| Symptom | Usual cause | Confirm | Do |
|---|---|---|---|
| A published article is not found by mooDesk's own search | mooDesk's search is a live query, not an index: the article is not published, is *Agents only*, is in another language, or the words are not in its title or body | Open the article as an editor | [Features → Knowledge base](./features#knowledge-base) |
| A published article is missing from **Moodle's** global search | Global search has not indexed it yet, or a deleted article's document stayed behind | *Site administration → Plugins → Search → Manage global search*; incident `kb.search_index.remove_failed` for a stale hit | Run the global search indexer |
| Analytics show no data | Events are recorded per view, vote and search; the report covers at most 90 days and is a Pro feature | Incident `kb.analytics.record_failed` if writes fail | [Features → Knowledge base](./features#knowledge-base) |
| A translation shows the wrong language | The reader's Moodle language has no row and the fallback chain picked another; the notice says so | Article translations | Add the translation |

### Interface errors

An action in mooDesk's interface that fails unexpectedly shows a **generic message** in the
browser and records the detail — class, file and line — as an incident on System Health under
*Interface* (`ajax.<action>.unexpected`). This is deliberate: a database error or a library
exception can quote SQL, paths or hostnames, and those belong to the operator, not to the
page. If a user reports "an unexpected error", open System Health before asking them to
reproduce it.

Rule refusals — a merge that is not allowed, a ticket out of reach, a missing field — are shown
as they are and record nothing.

## Incident reference

Every code mooDesk can write to System Health in 2.31.0, by source. *Retried* says whether
mooDesk itself will try the failed operation again; where it says *no*, the fix is on you and
the operation has to be redone by hand (or will simply happen next time the event occurs).

### Notifications and automation (`observer`)

All *error*, none retried. `<event>` is one of `ticket_created`, `ticket_replied`,
`ticket_assigned`, `ticket_sla_breached`, `ticket_merged`, `csat_on_status_changed`,
`rule_on_ticket_created`, `rule_on_status_changed`, `rule_on_sla_breached`,
`webhook_on_ticket_created`, `webhook_on_status_changed`, `webhook_on_ticket_replied`,
`webhook_on_field_changed`, `webhook_on_ticket_merged`, `webhook_on_merge_reverted`.

| Code | What did not happen | Context |
|---|---|---|
| `observer.<event>.failed` | The notification, CSAT invitation, automation rule or webhook enqueue that this event should have triggered. The ticket action itself succeeded. | `ticketid`, `exception_class` |

### Email ingestion (`email_ingestion`)

| Code | Severity | Meaning | Retried |
|---|---|---|---|
| `email_ingestion.imap.poll_failed` | **critical** | Connecting, logging in or selecting the folder failed — no mail is being read at all | Next poll |
| `email_ingestion.parse.failed` | warning | One message could not be parsed and was left in the folder | Next poll |
| `email_ingestion.message.unprocessable` | error | One message cannot be stored (headers beyond the schema, or a write refused for a reason that will not change) and was set aside | No |
| `email_ingestion.route.failed` | error | Deciding what a message is — new ticket or reply — threw | Next poll |
| `email_ingestion.ticket.sender_auth_unreadable` | error | *Require* is on and no usable provider profile, or a verdict the profile cannot read: new tickets by mail are being refused | Each message |
| `email_ingestion.ticket.sender_unverified` | warning | One new-ticket mail was refused because the receiving server did not authenticate its sender | No |
| `email_ingestion.reply.token_required` | warning | A reply carried no conversation token and the site requires one | No |
| `email_ingestion.reply.token_invalid` | warning | A reply's token did not verify | No |
| `email_ingestion.reply.token_sender_mismatch` | warning | A valid token, sent from another user's address | No |
| `email_ingestion.reply.token_address_unproven` | error | *Require token* is on but no probe has confirmed the current reply address: replies are being refused | Each message |
| `email_ingestion.reply.unauthorised` | warning | The sender may not write to the ticket they answered | No |
| `email_ingestion.attachment.store_failed` | warning | The ticket or reply was created; one attachment could not be stored | No |
| `email_ingestion.alert.send_failed` | warning | The operator alert about a refusal could not be sent | No |
| `email_ingestion.bounce.send_failed` | warning | The bounce telling a sender their mail was refused could not be sent | No |

### Webhooks (`webhook`)

| Code | Severity | Meaning | Retried |
|---|---|---|---|
| `webhook.enqueue.failed` | error | Writing the queue row for one subscription failed; that event is lost for that webhook | No |
| `webhook.queue.row_failed` | error | Processing one queue row threw; the row stays in the queue untouched | No |
| `webhook.delivery.abandoned` | error | A delivery was given up: five failed attempts, or the webhook was disabled or deleted meanwhile. One incident per webhook; the message says which | No |

### Scheduled tasks (`scheduled_task`)

| Code | Severity | Meaning | Retried |
|---|---|---|---|
| `scheduled_task.check_sla.ticket_failed` | error | The hourly SLA check failed on one ticket and continued with the rest | Next run |
| `scheduled_task.autoclose.ticket_failed` | error | The daily auto-close failed on one ticket and continued with the rest | Next run |

### Knowledge base (`knowledge_base`)

| Code | Severity | Meaning | Retried |
|---|---|---|---|
| `kb.search_index.remove_failed` | warning | Removing a deleted article's document from Moodle's global search failed; a stale hit may remain until the index is rebuilt | No |
| `kb.analytics.record_failed` | warning | One analytics event (view, vote, search, suggestion) could not be written; the report will under-count it | No |

### Interface (`ui`)

| Code | Severity | Meaning | Retried |
|---|---|---|---|
| `ajax.<action>.unexpected` | error | An interface action failed with something other than a rule refusal; the user saw a generic message, the detail is here | No |

## Before you report a bug

Open an issue with the [bug report form](https://github.com/digital-mood/moodesk-support/issues/new?template=bug_report.yml)
— the channel is described on [Support](./support). What makes a report answerable:

- **Versions**: mooDesk (*Plugins overview*), Moodle, PHP, database. The edition as shown on
  *mooDesk → License*.
- **The incident**: the code, severity, first/last seen and occurrences from System Health,
  and its message as shown there — it is already redacted.
- **The task log line** for the run in question, when a scheduled task is involved.
- **Steps to reproduce**, and what you expected instead.

::: danger Sanitise before posting
Issues are public. Never paste a licence key, an API token, a mailbox password, a webhook
secret, an email address, a real user's name or ID, or a hostname of your own. System Health
messages are redacted for you; task logs, delivery logs and error logs are **not** — replace
addresses, hostnames and IDs before attaching them.
:::

---

*Verified against mooDesk 2.31.0.*
