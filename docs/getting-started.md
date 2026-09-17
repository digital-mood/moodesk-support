---
title: Getting Started
description: What mooDesk is, what you need before installing it, and a ten-step quick start that ends with a working help desk.
---

# Getting Started

mooDesk is a help desk that runs **inside Moodle**. It is installed as a Moodle local plugin
(`local_moodesk`): tickets, replies, attachments and history live in the Moodle database, and
users, roles, notifications and privacy requests use Moodle's own mechanisms. There is no
external service to run and no separate login — every mooDesk screen opens in its own
application shell on top of your Moodle site.

This page is for the **site administrator** installing mooDesk for the first time. It explains
what you need, then walks through ten steps that end with a ticket going through the system
and a green System Health page. For every setting and screen in depth, see
[Installation](./installation), [Configuration](./configuration) and [Features](./features).

::: info Trademark notice
mooDesk is an independent third-party plugin and is not affiliated with or endorsed by
Moodle HQ. Moodle® is a registered trademark of Moodle Pty Ltd.
:::

## Before you start

### What you need

| Requirement | Detail |
|---|---|
| Moodle | 4.5 LTS or newer. Moodle 4.1–4.4 are end-of-life and not supported. |
| Access | A site administrator account. |
| Outgoing mail | Configured and working in Moodle — mooDesk sends its notifications through Moodle's messaging. |
| Cron | Moodle cron running. SLA checks, auto-close, mail ingestion and every other background job depend on it. |
| The plugin package | The mooDesk release ZIP (`local_moodesk-<version>.zip`). |

<!-- TODO: add official mooDesk download URL when available -->

Full system requirements (PHP, database versions) are listed under
[Installation](./installation).

### Editions

mooDesk ships as a single package. With no licence it runs as the free **Starter** edition; a
licence key unlocks **Pro** or **Enterprise**. The quick start marks the steps that only apply
to a paid edition. Every edition allows a different number of active agents:

| Edition | Active agents |
|---|---|
| Starter | up to 2 |
| Pro | up to 10 |
| Enterprise | unlimited |

See [Features](./features) for what each edition includes.

### Who does what

- **Site administrator** — installs the plugin, sets the edition, configures settings and
  roles. That is you, for this page.
- **Agents** — the people who work the ticket queue. mooDesk creates a role for them.
- **Requesters** — anyone with a Moodle account. They can open tickets and read published
  knowledge base articles without any extra role.

## The ten steps

Steps 7 and 8 are optional. Times are rough estimates for a first-time setup.

| # | Step | Time |
|---|---|---|
| 1 | [Install the plugin](#_1-install-the-plugin) | 5 min |
| 2 | [Pick the edition](#_2-pick-the-edition) | 3 min |
| 3 | [Roles](#_3-roles) | 5 min |
| 4 | [Departments and categories](#_4-departments-and-categories) | 5 min |
| 5 | [Add your agents](#_5-add-your-agents) | 5 min |
| 6 | [SLA targets and notifications](#_6-sla-targets-and-notifications) | 5 min |
| 7 | [Email ingestion](#_7-email-ingestion-optional-pro) — optional, Pro | 10 min |
| 8 | [Knowledge base](#_8-knowledge-base-optional) — optional | 5 min |
| 9 | [First ticket (smoke check)](#_9-first-ticket-smoke-check) | 5 min |
| 10 | [System Health](#_10-system-health) | 2 min |

## 1. Install the plugin

**Option A — upload the ZIP (recommended).** Go to **Site administration → Plugins → Install
plugins**, drop the release ZIP and confirm. Moodle runs the upgrade.

**Option B — filesystem.** Unzip the package so that the plugin lands at
`{moodle_root}/local/moodesk/` — the directory name **must** be `moodesk`. Then open
**Site administration → Notifications** and confirm the upgrade.

What the install does:

- creates the mooDesk database tables;
- seeds a **General** category and a **General** department;
- creates the **mooDesk Agent** role (short name `mhd_agent`, system context) with the
  capabilities an agent needs;
- registers the scheduled tasks. Tasks that belong to a Pro or Enterprise feature are
  registered too, but do nothing until that feature is licensed and enabled.

::: tip You have
mooDesk listed as *Up to date* under **Site administration → Plugins → Plugins overview**,
and a **mooDesk** entry in the site administration menu.
:::

More detail, including upgrading and the full list of capabilities and scheduled tasks:
[Installation](./installation).

## 2. Pick the edition

A fresh install runs as **Starter**: free, no licence, up to 2 active agents. If that is what
you want, skip to step 3.

For **Pro** or **Enterprise**, digitalMood issues a licence key for your site. A licence is
tied to the site URL it was issued for, so a key issued for production will not activate on a
staging copy.

1. Go to **Site administration → Plugins → Local plugins → mooDesk**. In the **License**
   section, paste the key into *Licence key* and save.
2. Open **mooDesk → License**. The status banner should read *Licence is valid*, *Effective
   edition* should show the edition you licensed, and the *Agents* row shows
   `active / limit` for that edition.

If the key is malformed, expired, revoked, signed for another site, or otherwise refused, the
License page says which. The site keeps running as Starter and nothing is lost — contact
digitalMood for a re-issue. A note reading *License claim ignored: N* beside the Agents row
means the key carries an agent number that is not part of the edition's contract; the
edition's limit is what applies.

::: tip You have
The edition you intend to run, shown on the License page.
:::

## 3. Roles

mooDesk relies on Moodle roles. The install seeds one; you decide the rest.

- **mooDesk Agent** (`mhd_agent`) — already exists, assignable at system context only. It
  holds `local/moodesk:agent`, `:viewall`, `:reply`, `:addnote`, `:manage` and `:editkb`,
  which is what the *Add agent* screen assigns. Review it under **Site administration →
  Users → Permissions → Define roles** and add capabilities if your agents should do more
  (for example `local/moodesk:managekb` to publish knowledge base articles).
- **Who manages mooDesk?** Departments, categories, agents, reports and System Health need
  `local/moodesk:managedepartment`, `:managecategory`, `:manageagents`, `:viewreports` and
  `:viewhealth`. Moodle's built-in **Manager** archetype already holds them. If you prefer a
  narrower role, create a *mooDesk Manager* role with exactly those, plus `:managekb`.
- **Requesters need nothing.** Every authenticated user can open a ticket
  (`local/moodesk:submit`), see their own tickets (`:viewown`) and read published articles
  (`:viewkb`).

::: tip You have
At least one account (yours) that can manage mooDesk, and the agent role ready to hand out.
:::

The complete capability table is in [Installation](./installation).

## 4. Departments and categories

Open **mooDesk → Departments** and **mooDesk → Categories** (both are in the *Administration*
group of the mooDesk sidebar).

- **Departments** are routing queues. A ticket belongs to one department, and only that
  department's members can be assigned to it. Start with *General*; add one per team that
  answers tickets (*Academic support*, *IT*, …). Per-department SLA targets are a Pro feature.
- **Categories** classify the subject (*Enrolment*, *Login*, *Grades*, …). They drive filters,
  reports and the knowledge base's *Suggested articles*. The default category is set under
  the plugin's **General** settings.

::: tip You have
The departments your agents will work in and the categories requesters will pick from.
:::

## 5. Add your agents

Go to **mooDesk → Agents → Add agent**, search for a Moodle user and click **Make agent**. That
assigns the **mooDesk Agent** role at system level.

Then put each agent in their department(s) from **mooDesk → Departments → members** (on Pro,
also from the agent's own panel, together with teams). An agent who is in no department and no
team cannot be assigned any ticket, and the agent directory flags this.

The *Add agent* screen shows the edition's limit before you pick anyone. At the limit the
button is disabled: remove an agent or move to a bigger edition. Agents given the role through
Moodle's own role screens are counted too; if that takes the site over its limit, every agent
keeps working, the License and System Health pages show *Agent limit exceeded*, and mooDesk
will not add another agent until the site is back under the limit.

::: tip You have
Your agents listed under **mooDesk → Agents**, each in a department.
:::

## 6. SLA targets and notifications

Go to **Site administration → Plugins → Local plugins → mooDesk**, section **SLA**. Targets
are hours to first response and hours to resolution, per priority. `0` disables the target for
that priority.

A fresh install ships with these defaults:

| Priority | First response | Resolution |
|---|---|---|
| Urgent | 2 h | 8 h |
| High | 8 h | 24 h |
| Normal | 48 h | none |
| Low | 72 h | none |

Adjust them to your service commitments. As a reference, a campus help desk might use
something like 1 h / 6 h for urgent, 4 h / 24 h for high, 16 h / 72 h for normal and
48 h / 240 h for low — but these are a starting point, not a recommendation for every site.

The first response is an agent's **public** reply; internal notes do not stop the clock. The
resolution clock pauses while a ticket is *Pending* (waiting on the requester).

**Notifications** (section **Notifications** on the same page): keep *requester on reply*,
*assignee on assignment*, *agents on new ticket* and *SLA breach* switched on. They are sent
through Moodle's messaging, so the site's outgoing mail must work.

**Automation** (section **Automation**): *Auto-close resolved tickets after N days* is `0` by
default, which means resolved tickets are never closed automatically. A value such as `7` is a
common choice.

::: tip You have
SLA indicators on the queue and breach notifications to the right people.
:::

Every setting, with its default: [Configuration](./configuration).

## 7. Email ingestion (optional, Pro) <Badge type="tip" text="Pro" />

Skip this step on Starter. On Pro and Enterprise, mooDesk can turn a mailbox into tickets: new
mail opens a ticket, and a reply to a mooDesk notification lands on its ticket.

1. Create a dedicated IMAP mailbox with a **least-privilege account used by nothing else**.
   The password is stored as a Moodle plugin setting, like every other plugin setting.
2. In the plugin settings, section **Email ingestion**: enable it, then enter host, port, SSL,
   user, password and folder.
3. Leave the **Reply authentication** and **Sender authentication** sections at their
   defaults for now. [Integrations](./integrations) explains when and how to tighten them;
   System Health shows whether your mail provider gives mooDesk enough information to do so.
4. Run the `process_incoming_email` task once from **Site administration → Server → Tasks →
   Scheduled tasks**, and send a test mail to the mailbox.

::: warning Microsoft 365 / Exchange Online mailboxes are not supported
mooDesk connects over IMAP with a username and password. Exchange Online no longer accepts
that, and mooDesk does not implement OAuth2. Use Google Workspace or an IMAP server of your own.
:::

::: tip You have
A mail-borne ticket in the queue, with the sender as requester.
:::

## 8. Knowledge base (optional)

Go to **mooDesk → Articles → New article**. Write one article for your most common question,
set its audience to *Everyone* and click **Publish** (publishing needs
`local/moodesk:managekb`). Open **mooDesk → Knowledge** to see the reader. Then start a new
ticket with a matching subject: *Suggested articles* offers the article before the ticket is
sent.

Articles with the *Agents only* audience are internal procedures that requesters never see.
On Pro, agents can also insert an article into a reply, start an article from a ticket, and
articles can be translated, rated and reported on.

If you do not want a knowledge base at all, switch off *Knowledge base enabled* in the
plugin's **General** settings; the screens and the suggestions disappear, and any articles are
kept.

::: tip You have
One published article, and the suggestion working on the New ticket form.
:::

## 9. First ticket (smoke check)

Run one ticket through the whole lifecycle, using two accounts.

**As a requester** (any user): **mooDesk → New ticket** — subject *Smoke test*, category
*General*, a line of text, submit. The ticket is created as *New* with *Normal* priority.
Agents receive a notification if *agents on new ticket* is on.

**As an agent:**

1. Open **mooDesk → Tickets**. The ticket is listed under *Unassigned*. Open it — it opens in a
   drawer over the list; use *Open full page* for the standalone view.
2. Assign it to yourself and set the status to *Open*.
3. Post a **Public Reply** ("Looking into it"), then an **Internal Note** ("smoke check —
   ignore").
4. Set the status to *Resolved*.

**As the requester again:** open the ticket. The reply is there; the internal note is **not**.

::: danger If the requester can see the internal note
Stop and [report it](./support). That is a defect, not a setting.
:::

The ticket will auto-close after the number of days set in step 6, or you can close it now.

::: tip You have
Proof that submitting, routing, replying, note visibility and the status flow work on this site.
:::

## 10. System Health

Open **mooDesk → System health** (`/local/moodesk/health.php`, capability
`local/moodesk:viewhealth`).

- The banner should read *Everything is working* and every source card *No problems*.
  Anything mooDesk absorbed in the last 24 hours — a notification that failed to send, a
  webhook delivery, an IMAP error, a scheduled task failure, a knowledge base write, an
  unexpected failure in the interface — is listed here with first/last seen and an
  *Acknowledge* / *Resolve* pair.
- **Entitlement** shows `agents / limit` for the effective edition; *Within limit* is what you
  want to see.
- **Inbound mail retention** shows when the retention sweep last ran and the two policies in
  force.

Come back here first whenever something feels off.

::: tip You have
A green health page — and the habit of opening it.
:::

## Where to go next

| Need | Page |
|---|---|
| Requirements, upgrading, capabilities, scheduled tasks | [Installation](./installation) |
| Every setting and its default | [Configuration](./configuration) |
| What each edition includes; tickets, queue, knowledge base | [Features](./features) |
| Email ingestion and webhooks | [Integrations](./integrations) |
| REST API (Enterprise) | [API](./api) |
| Something is not working | [Troubleshooting](./troubleshooting) · [FAQ](./faq) |
| Report a bug or ask for a feature | [Support](./support) |

---

*Verified against mooDesk 2.30.0.*
