---
title: Upgrading to 3.0.0
description: How to move a mooDesk 2.x site to 3.0.0, where Pro and Enterprise move to the separate add-on local_moodeskpro. What stays, what starts empty, and what to set up again.
---

# Upgrading to 3.0.0

mooDesk 3.0.0 splits the product into two plugins. `local_moodesk` is the Starter edition.
Pro and Enterprise now live in a separate add-on, `local_moodeskpro`, which needs
`local_moodesk` and holds the licence. This page is the path from any 2.x release; what changed
is listed in the [3.0.0 changelog](./changelog#upgrade-notes-3-0-0), and new installations are
covered by [Installation](./installation).

::: info Upgrading to 3.0.1 or later
The same path applies when you upgrade from 2.x straight to 3.0.1, 3.0.2 or 3.0.3. Keep both
plugins on the same version: each release of `local_moodeskpro` needs `local_moodesk` of the
same release. 3.0.1 also changes how replies to notifications are threaded, and 3.0.2 moves the
alerts about rejected inbound email to the add-on; see the upgrade notes of
[3.0.1](./changelog#upgrade-notes-3-0-1) and [3.0.2](./changelog#upgrade-notes-3-0-2).
:::

::: warning Nothing moves to the add-on on its own
Tickets, replies, departments, categories and the knowledge base stay where they are. What
belonged to the paid features is **not** migrated: on the add-on they start empty and you set
up again what you need (see [What starts empty](#what-starts-empty)). Take a backup of the
Moodle database before upgrading.
:::

## Which path is yours

| Your site today | What to do |
|---|---|
| **Starter**, no licence | Upgrade `local_moodesk` to 3.0.0 or later. Nothing else is needed. |
| **Pro or Enterprise** | Upgrade `local_moodesk`, install `local_moodeskpro`, enter the licence key again in the add-on, then set up again what you use. Follow the [steps](#steps-for-pro-and-enterprise). Until the add-on has a valid key, the site runs as Starter. |
| **Any edition, using the REST API** | Also issue new tokens and change your calls: [REST API](#rest-api). |

## Before you upgrade

- **Back up the Moodle database**, as for any plugin upgrade.
- **Check the format of your licence (Pro and Enterprise).** The add-on accepts only licences
  in the current licence format, the one introduced in 2.39.0, which states the agent
  capacity. If your site is on 2.39.0 or later and *License status* reads *Licence is valid*,
  your key is already in that format. If you are on an earlier version, ask
  [support@moodesk.io](mailto:support@moodesk.io) for a replacement licence before upgrading.
  From a version earlier than 2.38.1, contact [support@moodesk.io](mailto:support@moodesk.io)
  for guidance before proceeding.
- **Keep a copy of the licence key** and of the settings you will enter again: the mailbox
  settings and password for email ingestion, and your CSAT and webhook settings. The add-on does
  not read them from 2.x.
- **Note what you will rebuild.** List the teams, custom fields, automation rules, SLA per
  department and webhooks you use today, as they start empty on the add-on.
- **Tell your API integrators** that their tokens and function names change (see
  [REST API](#rest-api)).

## What stays and what starts empty {#what-starts-empty}

| Stays in `local_moodesk`, unchanged | Starts empty in `local_moodeskpro` |
|---|---|
| Tickets, replies, attachments and ticket history | Teams, and the team of each ticket |
| Departments and their members | Custom fields and their values |
| Categories | SLA per department |
| The knowledge base | Automation rules |
| Agents and the mooDesk Agent role | Satisfaction survey responses |
| The settings of `local_moodesk`: General, Notifications, Automation, SLA | Knowledge base feedback and analytics |
| | Webhooks and their delivery log |
| | API tokens |
| | The settings of the paid features: licence, email ingestion, CSAT, webhooks, API |

Without the add-on, a merged ticket is shown as an ordinary closed ticket.

## Steps for Pro and Enterprise

1. **Upgrade `local_moodesk`** to 3.0.0 or later through **Site administration → Plugins → Install
   plugins**, or by replacing `local/moodesk/` and opening **Site administration →
   Notifications**. The site now runs as Starter.
2. **Install `local_moodeskpro`** at the same version the same way (filesystem: `local/moodeskpro/`). See
   [Installation](./installation#installing).
3. **Enter the licence key again** under **Site administration → Plugins → Local plugins →
   mooDesk Pro → License → Licence key**, and save. Open **mooDesk → License**
   (`/local/moodeskpro/license.php`): it should read *Licence is valid* and show your edition
   and agent capacity.
4. **Set up again what you use**, in the add-on:
   - teams, custom fields, SLA per department and automation rules, from mooDesk's sidebar or
     **Site administration → Plugins → Local plugins**;
   - the settings under **mooDesk Pro**: email ingestion, CSAT, webhooks and API;
   - webhooks, on the *Webhooks* page;
   - API tokens, on the *API Tokens* page (see [REST API](#rest-api)).
5. **Check custom roles.** The Pro and Enterprise capabilities are new capabilities named
   `local/moodeskpro:*` (for example `local/moodeskpro:manageteam`, formerly
   `local/moodesk:manageteam`). Moodle's **Manager** archetype gets them by default; if you had
   granted the old ones to a role of your own, grant the new ones too. See
   [Installation → Roles and capabilities](./installation#roles-and-capabilities).
6. **Run the checks** under [After the upgrade](#after-the-upgrade).

## What changes after the upgrade

### Addresses, settings and capabilities

- **Pages of the paid features** are under `/local/moodeskpro/`, for example
  `/local/moodeskpro/reports.php`, `/local/moodeskpro/teams.php` and
  `/local/moodeskpro/license.php`. Their old addresses under `/local/moodesk/` no longer exist:
  update bookmarks and links.
- **Settings of the paid features** are under **Site administration → Plugins → Local plugins
  → mooDesk Pro**. The **mooDesk** page keeps General, Notifications, Automation and SLA.
- **Capabilities** of the paid features are `local/moodeskpro:*`. The `local/moodesk:*`
  capabilities of Starter keep their names.

### Licence and agents

- **The add-on never refuses an agent.** Above the licensed capacity every agent keeps working,
  and agents and administrators see a notice on every mooDesk page until the count is back
  within the capacity. With the add-on and no valid licence the capacity is 2: above it the
  notice shows and nothing is blocked. Only a site without the add-on keeps its existing agents
  but stops *Add agent* at 2. See [Configuration → Agents](./configuration#agents).
- **Licence expiry reminders.** Site administrators are notified 30 and 7 days before the
  licence expires. See [Configuration → License](./configuration#license).
- **A feature your licence does not include** shows *Not included in this site's licence*.

### REST API {#rest-api}

- The functions are renamed from `local_moodesk_*` to `local_moodeskpro_*`, for example
  `local_moodesk_list_tickets` becomes `local_moodeskpro_list_tickets`.
- The external service is `moodeskpro_api`, formerly `moodesk_api`.
- The token capability is `local/moodeskpro:useapi`.
- **Tokens issued before 3.0.0 stop working.** Issue new ones on the *API Tokens* page and give
  them to your integrations.

The full reference is on the [API](./api) page.

### Webhooks

Webhooks are configured again on the add-on's *Webhooks* page: subscriptions, secrets and the
delivery log start empty. Create each subscription again and give its receiver the signing
secret of the new subscription. See [Integrations](./integrations#webhooks).

### Email ingestion and replies by email

- **Enter the mailbox settings and password again** in the add-on (**mooDesk Pro → Email
  Ingestion**). Polling stays off until then.
- **Start from an empty mail folder.** The add-on has no record of the mail that 2.x already
  handled, so on its first poll it would process the last 14 days of mail again.
- **Reply authentication.** A site that had the reply authentication setting lands on *Prefer
  token*, so that the upgrade refuses nothing. Choose *Require token* again once you have
  checked your replies. A fresh install starts on *Require token*. See
  [Integrations](./integrations).
- **Replies to notifications sent before 3.0.1.** The add-on signs reply addresses with a new
  key, so the token in a reply address sent by 2.x is not recognised, and such a reply comes in
  as a reply without a token. From 3.0.1, under *Prefer token*, a reply without a token joins
  its ticket by the notification's identifier only when it answers a notification sent by 3.0.1
  or later. A reply to an earlier notification, including those sent by 2.x, joins its ticket
  only if it quotes an email mooDesk already stored, such as an earlier reply by email in the
  same thread; otherwise it becomes a new ticket. Under *Require token*, every reply without a
  token is refused.

### Satisfaction surveys (CSAT)

Survey links are now under `/local/moodeskpro/csat.php`. **Links in invitations sent before
3.0.0 stop working**, and earlier survey responses are not carried over. Turn CSAT on again in
**mooDesk Pro → Customer satisfaction (CSAT)**; new invitations carry the new links.

### Moodle global search

The knowledge base search area moves to the add-on, so Moodle's search index is rebuilt once
for it. Without the add-on there is no mooDesk search area.

### Moodle's schema check

The old tables and columns of the paid features stay on the site. Nothing reads them, and
Moodle's database schema check (for example `php admin/cli/check_database_schema.php`) lists
them as unexpected. This is expected. Personal data in them is still declared, exported and
erased by Moodle's privacy requests; an export shows it under *Data from before 3.0.0*. Nothing
deletes them automatically: a later release will let a site administrator export them and then
delete them, with explicit confirmation. Do not delete them by hand.

## After the upgrade

1. **Plugins overview** shows **mooDesk** and, on Pro and Enterprise, **mooDesk Pro**, both at
   the same version (`3.0.0` or later) and *Up to date*.
2. **mooDesk → System health** reads *Everything is working*. An upgrade that left something
   broken shows up here first.
3. **mooDesk → License** (Pro and Enterprise) shows your edition and the *Agents* row with your
   capacity. If it reports the licence as issued for an earlier licence format, ask
   [support@moodesk.io](mailto:support@moodesk.io) for a replacement licence.
4. **Scheduled tasks**: the add-on's tasks are listed under component *mooDesk Pro* and
   enabled. See [Installation → Scheduled tasks](./installation#scheduled-tasks).
5. **Integrations**: a test call with a new API token answers, a test webhook delivery
   arrives, and a test mail to the support mailbox becomes a ticket.

---

*Verified against mooDesk 3.0.3.*
