---
title: Installation
description: System requirements, the two mooDesk plugins, installing them, what each install creates, roles and capabilities, scheduled tasks, and network and privacy notes.
---

# Installation

How to install mooDesk on a Moodle site and verify the installation. For a guided first setup
that ends with a working help desk, follow [Getting Started](./getting-started); this page is
the reference behind it.

::: tip Upgrading an existing site?
This page covers new installations. To move a site from 2.x to 3.0.0, read
[Upgrading to 3.0.0](./upgrading-to-3-0-0) first: Pro and Enterprise now live in a separate
plugin, and some data and settings must be set up again.
:::

## Two plugins

Since 3.0.0, mooDesk is two Moodle **local plugins**. Both are installed, upgraded and
uninstalled exactly like any other Moodle plugin.

| Plugin | Component | Edition | Needs |
|---|---|---|---|
| **mooDesk** | `local_moodesk` | **Starter**: tickets, departments, categories, SLA, notifications, the knowledge base, System Health, up to 2 agents. No licence, and no outbound connection | Moodle |
| **mooDesk Pro** | `local_moodeskpro` | **Pro** and **Enterprise**: one add-on for both; the licence key decides which | `local_moodesk`, same version or later, and a licence key |

A site that stays on Starter installs `local_moodesk` only. A Pro or Enterprise site installs
`local_moodesk` first, then `local_moodeskpro`, and pastes its licence key in the add-on. Which
feature belongs to which edition is listed under [Features → Editions at a glance](./features#editions-at-a-glance).

## System requirements

| Requirement | Minimum | Notes |
|---|---|---|
| Moodle | **4.5 LTS** (`2024100700`) | Moodle 4.1–4.4 are end-of-life and not supported. Verified on 4.5, 5.0, 5.1 and 5.2. Connecting a **Microsoft 365** mailbox for email ingestion (Pro) needs **Moodle 4.5.5, 5.0.1 or later**. mooDesk detects an older version and says so on the settings page. |
| PHP | **8.1** (declared minimum) | Tested on **PHP 8.2, 8.3 and 8.4**. These minimums are Moodle 4.5's own: Moodle 5.0 needs PHP 8.2, MariaDB 10.11 and PostgreSQL 14, and Moodle 5.2 needs PHP 8.3 and PostgreSQL 16, so your real minimum is the higher of the two. |
| Database | MariaDB 10.6.7+, MySQL 8.4, PostgreSQL 13+ | Every release is tested on **MariaDB, MySQL and PostgreSQL** (MariaDB 10.11, MySQL 8.4 and PostgreSQL 16). MySQL is supported again since 3.0.0, on 8.4, the version Moodle 5.x requires. |
| PHP extensions | None beyond Moodle's | The PHP `imap` extension is **not** required: email ingestion has its own IMAP client. |
| Outgoing mail | Configured in Moodle | Ticket notifications, SLA alerts and operator alerts are sent through Moodle's messaging. |
| Cron | Running | Every background job (SLA checks, auto-close, mail ingestion, webhooks, retention) is a Moodle scheduled task. |
| Web services | Enabled — Enterprise only | Only the Enterprise REST API needs Moodle web services and the REST protocol switched on. See [API](./api). |
| Outbound HTTPS | Only with `local_moodeskpro`: to the licence revocation host | One small download a day; details under [Network and privacy](#network-and-privacy). Starter makes no outbound connection. |

All third-party PHP libraries are bundled inside the packages. There is no Composer step and
nothing to install on the server.

## Getting the packages

Each plugin is a ZIP named after its component and version:

- `local_moodesk-<version>.zip`, for example `local_moodesk-3.0.0.zip`. Starter is listed free
  on the Moodle Marketplace.
- `local_moodeskpro-<version>.zip`, for example `local_moodeskpro-3.0.0.zip`. Pro and
  Enterprise are the paid `local_moodeskpro` listing on the Moodle Marketplace.

<!-- TODO: Marketplace listing URLs for local_moodesk and local_moodeskpro, once published -->

Install the two at the same version. The add-on refuses to install on a `local_moodesk`
older than its own release.

## Installing

Install `local_moodesk` first. For Pro or Enterprise, repeat the same steps with
`local_moodeskpro` once `local_moodesk` is installed.

### Option A — upload the ZIP (recommended)

1. Go to **Site administration → Plugins → Install plugins**.
2. Drop the ZIP into the upload area (or choose the file) and click **Install plugin from the
   ZIP file**.
3. Moodle validates the package and shows the *Plugins check* page. Click **Upgrade Moodle
   database now** and wait for the upgrade to finish, then **Continue**.

### Option B — copy to the filesystem

1. Unzip the package on the server so that the plugin lands at:

   ```text
   {moodle_root}/local/moodesk/      ← local_moodesk
   {moodle_root}/local/moodeskpro/   ← local_moodeskpro
   ```

   The directory name **must** match the component: `moodesk` for `local_moodesk`,
   `moodeskpro` for `local_moodeskpro`. If your unzip tool creates a differently named
   folder, rename it.
2. Make sure the web server user can read the files.
3. Sign in as a site administrator and open **Site administration → Notifications**. Moodle
   detects the new plugin and shows the *Plugins check* page.
4. Click **Upgrade Moodle database now**, wait, then **Continue**.

Both options end in the same place. Choose B when your site does not allow plugin uploads
through the web interface or when you deploy Moodle from a filesystem or repository.

### Activating Pro or Enterprise

With `local_moodeskpro` installed, paste the licence key under **Site administration →
Plugins → Local plugins → mooDesk Pro → License → Licence key** and save. The key is bound to
your site's URL. Until a valid key is saved the site runs as Starter. See
[Configuration → License](./configuration#license).

## What the install creates

Installing **`local_moodesk`**:

- creates the plugin's database tables (all named `local_moodesk_*`);
- seeds a default category, **General**, and a default department, **General**. Tickets
  always belong to a category, so the default one is required;
- creates the **mooDesk Agent** role (short name `mhd_agent`), assignable at **system context
  only**, with the six agent capabilities listed under
  [Roles and capabilities](#roles-and-capabilities). If a role with that short name already
  exists, for instance after an earlier uninstall, it is reused and, if it lacks them, given
  those capabilities;
- registers its four [scheduled tasks](#scheduled-tasks) and its message providers;
- writes the settings' defaults. Nothing needs changing for the plugin to work; see
  [Configuration](./configuration) for what you will probably want to adjust.

Installing **`local_moodeskpro`**:

- creates the add-on's tables (all named `local_moodeskpro_*`), empty;
- adds its seven capabilities (`local/moodeskpro:*`) and its ten scheduled tasks;
- adds the **mooDesk Pro** settings page and the *License status* admin entry. The entries for
  *Automation Rules*, *Teams*, *Custom Fields*, *Webhooks* and *API Tokens* appear once a
  licence that includes them is active;
- creates the signing key for reply addresses used by email ingestion.

## Verifying the installation

1. **Site administration → Plugins → Plugins overview**, section *Local plugins*: **mooDesk**
   is listed with its version (for this release, `3.0.0`) and the status *Up to date*. With
   the add-on, **mooDesk Pro** is listed too, at the same version.
2. **Site administration → Plugins → Local plugins** contains a **mooDesk** settings page and
   *Departments*. With the add-on it also contains **mooDesk Pro** and *License status*.
3. Open `/local/moodesk/index.php` (**mooDesk → Tickets**). The ticket queue loads inside
   mooDesk's own application shell.
4. Open **mooDesk → System health** (`/local/moodesk/health.php`). On a fresh install the
   banner reads *Everything is working*.
5. With the add-on, open **mooDesk → License** (`/local/moodeskpro/license.php`). After you
   paste a key it reads *Licence is valid* and shows your edition and agent capacity.
6. **Site administration → Server → Tasks → Scheduled tasks**: the tasks below are listed
   and enabled.

If any of these is missing, run **Site administration → Notifications** again and check the
web server's error log; nothing in the plugins is configured until the upgrade has completed.

## Roles and capabilities

mooDesk defines its permissions as Moodle capabilities, all at **system context**, granted
through Moodle's standard role system. `local_moodesk` uses the `local/moodesk:` prefix; the
add-on adds its own under `local/moodeskpro:`.

The install seeds exactly one role, **mooDesk Agent** (`mhd_agent`), which is what mooDesk's
*Add agent* screen assigns and removes. Every other grant is the administrator's decision:
management capabilities are given to Moodle's built-in **Manager** archetype by default, or
you can create a narrower *mooDesk Manager* role. A user who received the agent role through
any other path (Moodle's role screens, an SSO role mapping, a script) is still an agent and
still counts towards the agent capacity, but mooDesk will not remove that role; Moodle's role
screens do.

**`local_moodesk`:**

| Capability | What it allows | Granted by default to |
|---|---|---|
| `local/moodesk:submit` | Open a new ticket | Authenticated users |
| `local/moodesk:viewown` | See own tickets | Authenticated users |
| `local/moodesk:viewkb` | Read published knowledge base articles | Authenticated users |
| `local/moodesk:agent` | Marks the user as an assignable agent | mooDesk Agent role |
| `local/moodesk:viewall` | See every ticket in the queue | mooDesk Agent role |
| `local/moodesk:reply` | Post public replies | mooDesk Agent role |
| `local/moodesk:addnote` | Post internal notes | mooDesk Agent role |
| `local/moodesk:manage` | Change status, priority, assignee, category | mooDesk Agent role |
| `local/moodesk:editkb` | Create and edit knowledge base articles (never publish them) | mooDesk Agent role |
| `local/moodesk:managecategory` | Create and edit categories | Manager |
| `local/moodesk:managedepartment` | Create and edit departments and their members | Manager |
| `local/moodesk:manageagents` | Add and remove agents; manage their membership | Manager |
| `local/moodesk:managesettings` | Advanced plugin settings; act on System Health incidents | Manager |
| `local/moodesk:viewhealth` | System Health page | Manager |
| `local/moodesk:managekb` | Publish, unpublish, archive, restore and delete articles; change an article's audience | Manager |

**`local_moodeskpro`:**

| Capability | What it allows | Edition | Granted by default to |
|---|---|---|---|
| `local/moodeskpro:viewreports` | Reports page, dashboard analytics, per-agent metrics | Pro | Manager |
| `local/moodeskpro:manageteam` | Teams and their membership | Pro | Manager |
| `local/moodeskpro:manageautomations` | Automation rules | Pro | Manager |
| `local/moodeskpro:managewebhooks` | Outbound webhooks | Enterprise | Manager |
| `local/moodeskpro:useapi` | REST API token self-service | Enterprise | Manager |
| `local/moodeskpro:mergetickets` | Merge a duplicate ticket into another | Enterprise | Manager |
| `local/moodeskpro:revertmerge` | Undo a merge | Enterprise | Manager |

"Manager" means Moodle's `manager` role archetype; "Authenticated users" means the `user`
archetype. Site administrators bypass capability checks as usual, but they are **not**
agents unless they hold `local/moodesk:agent`, and so cannot be assigned tickets.

A `local/moodeskpro:*` capability exists only when the add-on is installed. A screen whose
feature your licence does not include shows *Not included in this site's licence*.

## Scheduled tasks

All tasks are registered by the install under **Site administration → Server → Tasks →
Scheduled tasks** and are enabled. A task that belongs to a feature that is switched off or
not included in your licence returns immediately and costs nothing. Times are the defaults,
in the server's timezone; adjust them like any Moodle task.

**`local_moodesk`** (component *mooDesk*):

| Task | Default schedule | What it does | Active when |
|---|---|---|---|
| `check_sla_breaches` | Every hour | Evaluates open tickets against the SLA targets and flags breaches | Always |
| `dispatch_incident_alerts` | Every 5 minutes | Sends operator alerts for new System Health incidents | Always |
| `autoclose_resolved_tickets` | Daily, 02:00 | Closes tickets that have been *Resolved* longer than the configured number of days | Auto-close days > 0 |
| `purge_incidents` | Daily, 05:40 | Applies the retention policy to System Health incidents | Always |

**`local_moodeskpro`** (component *mooDesk Pro*):

| Task | Default schedule | What it does | Active when |
|---|---|---|---|
| `process_incoming_email` | Every 5 minutes | Polls the IMAP mailbox and turns mail into tickets and replies | Pro, email ingestion enabled |
| `dispatch_webhook` | Every minute | Delivers queued webhook events, with retries | Enterprise, webhooks |
| `sync_license` | Daily, 03:00 | Registered and enabled, but performs no work in this release | — |
| `refresh_revocation_list` | Daily, 03:30 | Downloads and verifies the licence revocation list | Revocation check enabled (default) |
| `send_license_expiry_reminders` | Daily, 03:45 | Notifies site administrators 30 and 7 days before the licence expires | Always |
| `check_updates` | Daily, in the 04:00 hour | Registered, but performs no work in this release | — |
| `purge_merge_snapshots` | Daily, 04:20 | Deletes merge undo data older than 30 days | Always |
| `purge_email_audit` | Daily, 05:00 | Applies the retention policy to inbound-mail records | Always |
| `purge_kb_events` | Daily, 05:20 | Applies the retention policy to knowledge base analytics events | Always |
| `purge_webhook_log` | Daily, 05:50 | Applies the retention policy to the webhook delivery log | Always |

The add-on's retention sweeps run whatever the licence, so data written by a Pro or
Enterprise feature keeps ageing out after a licence lapses. Automation rules (Pro) have no task
of their own: they run inside the event that triggers them.

::: warning Without a working Moodle cron none of this runs
No SLA flags, no auto-close, no mail ingestion, no webhook deliveries, no retention. If
something is not happening on schedule, check **Site administration → Reports → System
status** before anything mooDesk-specific.
:::

## Upgrading

Upgrading uses the same two options as installing: upload the new ZIP through **Install
plugins**, or replace the contents of `local/moodesk/` (and `local/moodeskpro/`) on the
filesystem and open **Site administration → Notifications**. Moodle upgrades the plugins in
place. Keep both plugins on the same version: Moodle does not upgrade `local_moodeskpro` until
`local_moodesk` is on the version it needs (for example, 3.0.1 of the add-on needs 3.0.1 of the
base), so upgrade them together.

- Read the [changelog](./changelog) for every version between yours and the new one. It names
  every change in behaviour and any step you need to take.
- **From 2.x to 3.0.0:** follow [Upgrading to 3.0.0](./upgrading-to-3-0-0).
- Take a backup of the Moodle database as you would for any plugin upgrade.

Every upgrade step is idempotent, so running it again is safe. Steps that change data record
what they did in Moodle's `upgrade_log` database table.

## Network and privacy

**Starter makes no outbound connection.** `local_moodesk` sends nothing anywhere on its own:
notifications go through Moodle's messaging and the site's own mail settings.

**With `local_moodeskpro`**, the add-on makes one kind of outbound request: once a day
(03:30 site time unless an administrator changes the schedule of the task),
`refresh_revocation_list` downloads the signed licence revocation list from the URL set in
the add-on's *License* settings (by default
`https://licenses.moodesk.io/crl/v2/revocations.json`) and its `.sig` companion: two HTTPS GET
requests, with the server certificate checked.

The list lets digitalMood withdraw a licence key without a plugin release. The add-on checks
the list's signature against a public key embedded in it and denies any licence the list
names. If the host is unreachable the last valid list is kept, and a list that is not signed by
a key this version trusts is rejected.

What the download carries:

- It does **not** send your licence key, user records or ticket content. It is a plain GET of
  a public file, with no query parameters, and every site downloads the same file.
- Its `User-Agent` header is the fixed `moodesk-crl/2`, the same on every site. It does not
  include your site's URL.
- Like any HTTP request, it exposes your server's public IP address (or that of the outbound
  proxy Moodle is set to use) to the host that serves the list.

You can switch the check off with the *Check for revoked licences* setting; a list already
stored keeps being honoured. You will need to allow outbound HTTPS to that host if your
server is behind an egress firewall.

**No online licence check and no update check.** Downloading the revocation list is not a
licence verification: the request carries no licence key, and the key is verified on your
server against the public key embedded in the add-on. The add-on contains a licence
verification client and an update check, but in 3.0.0 both are switched off in the code: no
setting turns them on and they make no request.

No other data leaves the site unless an administrator configures an outbound **webhook**
(Enterprise) or an **IMAP mailbox** (Pro), and those talk only to the endpoints the
administrator entered. A mailbox signed in with OAuth 2.0 also uses the Moodle OAuth 2 service
it names: Moodle itself obtains and renews the access token from Google or Microsoft.

**Personal data.** Both plugins implement Moodle's Privacy API, each for its own tables. Data
export and erasure requests run through the standard workflow under **Site administration →
Users → Privacy and policies → Data requests**. Together they export a user's tickets,
replies, ticket history, department and team membership, CSAT ratings, knowledge base feedback
and email-ingestion records, and on erasure anonymise personal data while preserving aggregate
operational records.

**Retention.** System Health incidents (`local_moodesk`), and inbound-mail records, webhook
delivery logs and knowledge base analytics events (`local_moodeskpro`) are each subject to a
configurable retention period applied by the tasks above; see
[Configuration](./configuration) for the settings and defaults.

## Uninstalling

Uninstall through **Site administration → Plugins → Plugins overview → Uninstall**. Because
`local_moodeskpro` depends on `local_moodesk`, Moodle asks you to uninstall **mooDesk Pro**
first.

As with any Moodle plugin, uninstalling **drops the plugin's tables**. Uninstalling the add-on
deletes the Pro and Enterprise data (teams, custom fields, automation rules, survey responses,
webhooks, API tokens and the rest); uninstalling `local_moodesk` deletes tickets, replies,
attachments, articles and history. Take a backup first. The **mooDesk Agent** role is left in
place with its mooDesk capabilities removed; a later reinstall restores them.

---

*Verified against mooDesk 3.0.0.*
