---
title: Installation
description: System requirements, installing and upgrading mooDesk, what the install creates, roles and capabilities, scheduled tasks, and network and privacy notes.
---

# Installation

How to install mooDesk on a Moodle site, verify the installation, and upgrade an existing
one. For a guided first setup that ends with a working help desk, follow
[Getting Started](./getting-started); this page is the reference behind it.

mooDesk is a Moodle **local plugin**, component `local_moodesk`. It is installed, upgraded
and uninstalled exactly like any other Moodle plugin. One package serves every edition: the
edition is set by the licence key after installation, not by which ZIP you install.

## System requirements

| Requirement | Minimum | Notes |
|---|---|---|
| Moodle | **4.5 LTS** (`2024100700`) | Moodle 4.1–4.4 are end-of-life and not supported. Verified on 4.5, 5.0, 5.1 and 5.2. |
| PHP | **8.1** (declared minimum) | PHP 8.1 is the declared minimum. The mooDesk CI matrix validates **PHP 8.2, 8.3 and 8.4**; 8.1 is not part of that matrix. |
| Database | MariaDB 10.6+, PostgreSQL 13+, MySQL 8.0+ | These are Moodle's own requirements; mooDesk adds none. **MariaDB and PostgreSQL** are covered by the mooDesk CI matrix. MySQL 8.0+ is listed as supported, but it is not currently covered by the mooDesk CI matrix. |
| PHP extensions | None beyond Moodle's | The PHP `imap` extension is **not** required — email ingestion talks IMAP over TLS sockets. |
| Outgoing mail | Configured in Moodle | Ticket notifications, SLA alerts and operator alerts are sent through Moodle's messaging. |
| Cron | Running | Every background job (SLA checks, auto-close, mail ingestion, webhooks, retention) is a Moodle scheduled task. |
| Web services | Enabled — Enterprise only | Only the Enterprise REST API needs Moodle web services and the REST protocol switched on. See [API](./api). |
| Outbound HTTPS | To the licence revocation host | One small download a day; details under [Network and privacy](#network-and-privacy). |

All third-party PHP libraries the plugin uses are bundled inside the package. There is no
Composer step and nothing to install on the server.

## Getting the package

mooDesk is distributed as a single ZIP named `local_moodesk-<version>.zip` — for example
`local_moodesk-2.30.0.zip`. The same package runs as Starter, Pro or Enterprise depending on
the licence you activate afterwards.

<!-- TODO: add official mooDesk download URL when available -->

## Installing

### Option A — upload the ZIP (recommended)

1. Go to **Site administration → Plugins → Install plugins**.
2. Drop the ZIP into the upload area (or choose the file) and click **Install plugin from the
   ZIP file**.
3. Moodle validates the package and shows the *Plugins check* page. Click **Upgrade Moodle
   database now** and wait for the upgrade to finish, then **Continue**.

### Option B — copy to the filesystem

1. Unzip the package on the server so that the plugin lands at:

   ```text
   {moodle_root}/local/moodesk/
   ```

   The directory name **must** be `moodesk` — it has to match the component name
   `local_moodesk`. If your unzip tool creates a differently named folder, rename it.
2. Make sure the web server user can read the files.
3. Sign in as a site administrator and open **Site administration → Notifications**. Moodle
   detects the new plugin and shows the *Plugins check* page.
4. Click **Upgrade Moodle database now**, wait, then **Continue**.

Both options end in the same place. Choose B when your site does not allow plugin uploads
through the web interface or when you deploy Moodle from a filesystem or repository.

## What the install creates

Running the install once:

- creates the plugin's database tables (all named `local_moodesk_*`);
- seeds a default category, **General**, and a default department, **General** — tickets
  always belong to a category, so the default one is required;
- creates the **mooDesk Agent** role (short name `mhd_agent`), assignable at **system context
  only**, with the six agent capabilities listed under
  [Roles and capabilities](#roles-and-capabilities). If a role with that short name already
  exists — for instance after an earlier uninstall — it is reused and, if it lacks them, given
  those capabilities;
- registers the twelve [scheduled tasks](#scheduled-tasks) and the plugin's message
  providers;
- writes the settings' defaults. Nothing needs changing for the plugin to work; see
  [Configuration](./configuration) for what you will probably want to adjust.

## Verifying the installation

1. **Site administration → Plugins → Plugins overview**, section *Local plugins*: **mooDesk**
   is listed with its version (for this release, `2.30.0`) and the status *Up to date*.
2. **Site administration → Plugins → Local plugins** now contains a **mooDesk** settings page
   plus entries for *License status* and *Departments* (more appear as you gain the
   corresponding capabilities).
3. Open `/local/moodesk/index.php` (**mooDesk → Tickets**). The ticket queue loads inside
   mooDesk's own application shell.
4. Open **mooDesk → System health** (`/local/moodesk/health.php`). On a fresh install the
   banner reads *Everything is working*.
5. **Site administration → Server → Tasks → Scheduled tasks**, filter by component *mooDesk*:
   the twelve tasks below are listed and enabled.

If any of these is missing, run **Site administration → Notifications** again and check the
web server's error log; nothing in the plugin is configured until the upgrade has completed.

## Roles and capabilities

mooDesk defines its permissions as Moodle capabilities under the `local/moodesk:` prefix, all
at **system context**. They are granted through Moodle's standard role system.

The install seeds exactly one role, **mooDesk Agent** (`mhd_agent`), which is what mooDesk's
*Add agent* screen assigns and removes. Every other grant is the administrator's decision:
management capabilities are given to Moodle's built-in **Manager** archetype by default, or
you can create a narrower *mooDesk Manager* role. A user who received the agent role through
any other path — Moodle's role screens, an SSO role mapping, a script — is still an agent
and still counts towards the edition's agent limit, but mooDesk will not remove that role;
Moodle's role screens do.

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
| `local/moodesk:managesettings` | Custom field definitions and other advanced settings | Manager |
| `local/moodesk:viewreports` | Reports page and per-agent metrics | Manager |
| `local/moodesk:viewhealth` | System Health page | Manager |
| `local/moodesk:managekb` | Publish, unpublish, archive, restore and delete articles; change an article's audience | Manager |
| `local/moodesk:manageteam` | Teams and their membership (Pro) | Manager |
| `local/moodesk:manageautomations` | Automation rules (Pro) | Manager |
| `local/moodesk:managewebhooks` | Outbound webhooks (Enterprise) | Manager |
| `local/moodesk:useapi` | REST API token self-service (Enterprise) | Manager |
| `local/moodesk:mergetickets` | Merge a duplicate ticket into another (Enterprise) | Manager |
| `local/moodesk:revertmerge` | Undo a merge (Enterprise) | Manager |

"Manager" means Moodle's `manager` role archetype; "Authenticated users" means the `user`
archetype. Site administrators bypass capability checks as usual — but they are **not**
agents unless they hold `local/moodesk:agent`, and so cannot be assigned tickets.

Capabilities marked Pro or Enterprise exist on every edition. The screens they protect show an
upgrade notice when the feature is not licensed.

## Scheduled tasks

All tasks are registered by the install under **Site administration → Server → Tasks →
Scheduled tasks**, component *mooDesk*, and are enabled. A task that belongs to a feature
that is switched off or not licensed on your edition returns immediately and costs nothing.
Times are the defaults, in the server's timezone; adjust them like any Moodle task.

| Task | Default schedule | What it does | Active when |
|---|---|---|---|
| `check_sla_breaches` | Every hour | Evaluates open tickets against the SLA targets and flags breaches | Always |
| `dispatch_incident_alerts` | Every 5 minutes | Sends operator alerts for new System Health incidents | Always |
| `process_incoming_email` | Every 5 minutes | Polls the IMAP mailbox and turns mail into tickets and replies | Pro, email ingestion enabled |
| `dispatch_webhook` | Every minute | Delivers queued webhook events, with retries | Enterprise, webhooks |
| `autoclose_resolved_tickets` | Daily, 02:00 | Closes tickets that have been *Resolved* longer than the configured number of days | Auto-close days > 0 |
| `sync_license` | Daily, 03:00 | Registered and enabled, but performs no work in this release | — |
| `refresh_revocation_list` | Daily, 03:30 | Downloads and verifies the licence revocation list | Revocation check enabled (default) |
| `purge_merge_snapshots` | Daily, 04:20 | Deletes merge undo data older than 30 days | Always |
| `purge_email_audit` | Daily, 05:00 | Applies the retention policy to inbound-mail records | Always |
| `purge_kb_events` | Daily, 05:20 | Applies the retention policy to knowledge base analytics events | Always |
| `purge_incidents` | Daily, 05:40 | Applies the retention policy to System Health incidents | Always |
| `purge_webhook_log` | Daily, 05:50 | Applies the retention policy to the webhook delivery log | Always |

The retention sweeps run on every edition, so data written by a Pro or Enterprise feature
keeps ageing out after a downgrade. Automation rules (Pro) have no task of their own — they
run inside the event that triggers them.

::: warning Without a working Moodle cron none of this runs
No SLA flags, no auto-close, no mail ingestion, no webhook deliveries, no retention. If
something is not happening on schedule, check **Site administration → Reports → System
status** before anything mooDesk-specific.
:::

## Upgrading

Upgrading uses the same two options as installing: upload the new ZIP through **Install
plugins**, or replace the contents of `local/moodesk/` on the filesystem and open
**Site administration → Notifications**. Moodle upgrades the plugin in place.

Before upgrading:

- Read the [changelog](./changelog) for every version between yours and the new one. It
  names every change in behaviour and any step you need to take.
- Take a backup of the Moodle database as you would for any plugin upgrade.

What to know about the upgrade itself:

- Every upgrade step is idempotent — running it again is safe.
- Steps that change data record what they did in Moodle's `upgrade_log` database table
  (rows with `plugin = 'local_moodesk'`), so an operator can see afterwards what was
  migrated and what was left alone.
- Sites first installed **before 2.8.0** have their tables renamed from the historical
  `local_mhd_*` prefix to `local_moodesk_*` during the upgrade, with every row preserved.
  Nothing needs doing beforehand.
- Your settings, licence, roles, tickets and articles are kept. Any new setting starts at its
  default.

### After the upgrade

1. **Plugins overview** shows the new version and *Up to date*.
2. **mooDesk → System health** reads *Everything is working*. An upgrade that left something
   broken shows up here first.
3. **mooDesk → License**: your edition is still the one you expect. A licence issued for an
   earlier version keeps working.
4. **Scheduled tasks**: any task added by the new version is listed and enabled.
5. If you use **email ingestion**: a site that upgrades to a version with reply
   authentication starts on *Prefer token* rather than the stricter *Require token* a fresh
   install gets, so existing mail-based replies keep working. Review the setting once your
   reply address is configured — see [Integrations](./integrations).
6. If you upgrade from **2.22.0 or earlier** and use the **REST API**: issuing a token for
   another user now requires `moodle/webservice:managealltokens` in addition to
   `local/moodesk:useapi`. Tokens issued before the upgrade are left untouched; as a site
   administrator, open **mooDesk → API tokens** and revoke any token whose owner and purpose
   you cannot account for.

## Network and privacy

**Outbound connections.** On its own, mooDesk makes one kind of outbound request: once a day,
`refresh_revocation_list` downloads the signed licence revocation list from the URL set in
the plugin's *License* settings (by default `https://licenses.moodesk.io/crl/revocations.json`
and its `.sig` companion). The request is a plain download of a public file; it carries no
site URL, no licence, no user data. If the host is unreachable the last valid list is kept,
and a list that fails verification is rejected. You can switch the check off with the
*Revocation check* setting, and you will need to allow outbound HTTPS to that host if your
server is behind an egress firewall.

No other data leaves the site unless an administrator configures an outbound **webhook**
(Enterprise) or an **IMAP mailbox** (Pro), and those talk only to the endpoints the
administrator entered.

**Personal data.** mooDesk implements Moodle's Privacy API. Data export and erasure requests
run through the standard workflow under **Site administration → Users → Privacy and
policies → Data requests**. The plugin reports on every table that holds personal data,
exports a user's tickets, replies, ticket history, department and team membership, CSAT
ratings, knowledge base feedback and email-ingestion records, and on erasure anonymises
personal data while preserving aggregate operational records.

**Retention.** Inbound-mail records, System Health incidents, webhook delivery logs and
knowledge base analytics events are each subject to a configurable retention period applied
by the tasks above; see [Configuration](./configuration) for the settings and defaults.

## Uninstalling

Uninstall through **Site administration → Plugins → Plugins overview → mooDesk → Uninstall**.
As with any Moodle plugin, this **drops the plugin's tables** — tickets, replies,
attachments, articles and history are deleted. Take a backup first. The **mooDesk Agent** role
is left in place with its mooDesk capabilities removed; a later reinstall restores them.

---

*Verified against mooDesk 2.30.0.*
