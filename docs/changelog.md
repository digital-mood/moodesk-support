---
title: Changelog
description: Public release notes for mooDesk — changes that matter to agents, administrators and integrators, with upgrade notes where an upgrade needs action.
---

# Changelog

Public release notes for mooDesk.

These notes cover changes that are visible to agents and requesters, or that matter to
administrators and integrators. Each release lists them under **Added**, **Changed**,
**Fixed** and **Security**, with **Upgrade notes** when an upgrade needs action on your side.

::: info Where this changelog starts
The public changelog starts at **2.34.0**. Earlier releases are not listed here.
:::

<!-- Add new releases directly below this line, newest first, with the same headings. -->

## 3.0.1 — 2026-11-07

### Changed

- **The packages include English only.** Both `local_moodesk` and `local_moodeskpro` are in English,
  as they have been since 3.0.0. Spanish, French and Portuguese are being prepared. Until they are
  available, a site in one of those languages shows mooDesk in English.

### Fixed

- **A reply by email without a token reaches its ticket when it answers a notification.** Some mail
  clients ignore the reply address of a notification and send the reply without its token. Each
  notification now carries an identifier that mooDesk recognises, so such a reply joins its ticket.
  It is accepted under the same rules as any reply without a token: the sender has to be someone who
  may reply on that ticket. If the site's outgoing mail server replaces that identifier, as Exchange
  Online and Microsoft 365 do, replies behave as they did in 3.0.0. Pro and Enterprise.
- **A real reply is never discarded as a duplicate.** In 3.0.0, a second reply by email with the same
  sender and subject as one received a few minutes earlier could be skipped and reach no ticket.
  mooDesk now skips only a second copy of the email that opened a ticket: the same sender, subject
  and text. Each skipped copy leaves an internal note on its ticket with the sender, subject and
  time, and *System Health* counts the skipped copies of the last 30 days under *Duplicate emails*.
  Pro and Enterprise.

### Upgrade notes {#upgrade-notes-3-0-1}

- **Upgrade both plugins together.** `local_moodeskpro` 3.0.1 needs `local_moodesk` 3.0.1, and
  Moodle will not upgrade the add-on until the base is on 3.0.1. A site on Starter upgrades
  `local_moodesk` and needs nothing else.
- **Replies to notifications sent before 3.0.1 (this revises the 3.0.0 note on replies by email).**
  Under *Prefer token*, a reply without a token joins its ticket by the identifier only when it
  answers a notification sent by 3.0.1 or later. A reply to an earlier notification, including those
  sent by 2.x, still joins its ticket only if it quotes an email mooDesk already stored, such as an
  earlier reply by email in the same thread. Under *Require token*, every reply without a token is
  still refused.
- **Replies skipped by 3.0.0 are not recovered.** A reply 3.0.0 skipped as a duplicate was added to
  no ticket and stays out of it after the upgrade; *Duplicate emails* in *System Health* counts it if
  it is less than 30 days old. Ask the sender to send it again if it is needed.

## 3.0.0 — 2026-11-07

::: warning Before you upgrade
mooDesk is now two plugins, and nothing moves to the add-on on its own. Read
[Upgrading to 3.0.0](./upgrading-to-3-0-0) before upgrading a site that uses Pro or Enterprise,
the REST API or email ingestion.
:::

### Added

- **Licence expiry reminders.** 30 and 7 days before a licence expires, site administrators get a
  notification, by email and popup, saying when it expires. After that date the site runs as
  Starter and no data is deleted. *License status* shows a banner in the last 30 days.
- **A notice when a site is over its licensed capacity.** Agents and administrators see it on every
  mooDesk page until the count is back within the capacity. Requesters never see it.
- **Attachments dropped from incoming mail are reported.** With attachments off, or over the size
  or per-message limit, the agent gets an internal note on the ticket with each file's name and size. The requester does not see it, and no
  file content is kept.
- **MySQL 8.4 is supported again,** next to MariaDB and PostgreSQL.

### Changed

- **mooDesk is now two plugins.** `local_moodesk` is the Starter edition: tickets, departments,
  categories, the knowledge base and up to 2 agents, with no licence and no licence calls.
  `local_moodeskpro` is the add-on that holds Pro and Enterprise, and it needs `local_moodesk`. Both
  are 3.0.0.
- **The paid features move to the add-on.** Teams, custom fields, automation rules, satisfaction
  surveys, reports, dashboard analytics, SLA per department, the agent panel, email ingestion,
  knowledge base analytics, knowledge base agent tools, knowledge base translations and global search
  are Pro. Agent supervision,
  ticket merge, webhooks and the REST API are Enterprise.
- **Their addresses, settings and capabilities change.** Pages are under `/local/moodeskpro/`,
  settings are under *Site administration → Plugins → Local plugins → mooDesk Pro*, and capabilities
  are `local/moodeskpro:*`.
- **The add-on never refuses an agent.** Above the licensed capacity every agent keeps working and
  the notice stays on. With the add-on and no valid licence the capacity is 2: above it the notice
  shows and nothing is blocked. Only a site without the add-on stops at 2 agents.
- **A feature your licence does not include says so plainly.** The page shows *Not included in this
  site's licence*, with no upgrade prompt.

### Fixed

- **A reply by email no longer opens a duplicate ticket because of a long thread.** Every message id
  in `References` and `In-Reply-To` is read now, not only the first.
- **A reply token is found wherever it sits in the recipients,** so a reply to all keeps its ticket.
- **More automatic mail is recognised,** so out-of-office replies no longer open tickets.
- **The privacy declarations are complete.** What outbound webhooks send and what knowledge base
  events keep are now declared.

### Upgrade notes {#upgrade-notes-3-0-0}

::: warning Nothing moves to the add-on on its own
Back up the site before upgrading. Tickets, replies, departments, categories and the knowledge
base stay where they are. What belonged to the paid features is **not** migrated: on the add-on,
teams, custom fields and their values, SLA per department, automation rules, survey responses,
knowledge base feedback and analytics, webhooks, API tokens and the related settings start empty,
and you set up again what you need.
Without the add-on, a merged ticket is an ordinary closed ticket.

A site that stays on Starter upgrades `local_moodesk` and needs nothing else.
:::

- **Pro and Enterprise: upgrade `local_moodesk`, install `local_moodeskpro`, and enter the licence
  key again** in the add-on's settings. Until then the site runs as Starter.
- **REST API:** issue new tokens on the *API tokens* page and change your calls to the
  `local_moodeskpro_*` function names. Tokens issued before 3.0.0 stop working.
- **Email ingestion:** enter the mailbox settings and password in the add-on; polling stays off until
  then. Start from an empty mail folder, because mail from the last 14 days would be processed again.
- **Replies by email:** a site that had the reply authentication setting lands on *Prefer token*,
  and a fresh install starts on *Require token*. Under *Prefer token*, a reply to a notification
  sent before 3.0.0 comes in as a reply without a token, and it joins its ticket only if it quotes
  an email mooDesk already stored, such as an earlier reply by email in the same thread. Under
  *Require token* it is refused.
- **Satisfaction surveys:** links in invitations sent before 3.0.0 stop working.
- **Global search:** the knowledge base search area changes, so the index is rebuilt once.
- **The old tables and columns of the paid features stay on the site.** Nothing reads them, and
  Moodle's schema check lists them as unexpected. Personal data in them is still declared, exported
  and erased by privacy requests. Nothing deletes them automatically: a later release will let a
  site administrator export them and then delete them, with explicit confirmation.

## 2.39.1 — 2026-10-24

### Fixed

- **The daily licence revocation list download no longer sends your site URL.** Up to 2.39.0
  the download used Moodle's default User-Agent, `MoodleBot/<Moodle version> (+<site URL>)`, so
  the licence server could see which site made the request. From 2.39.1 it sends the fixed
  User-Agent `moodesk-crl/2`, the same on every site. The download still does not send your
  licence key, user records or ticket content. Like any request over the internet, it lets the
  licence server see the IP address it comes from: your server's, or that of the proxy Moodle
  uses. How often the list is downloaded, how it is verified and what happens when it cannot be
  downloaded are unchanged. Nothing to do on your side.
- **The *Check for revoked licences* setting describes the download accurately.** Its
  description said the download sends no site or personal data. It now says what the download
  does not send and that your server's IP address is visible to the licence server.

## 2.39.0 — 2026-10-20

*Agent capacities changed to fixed tiers in 3.0.0.*

::: warning Before you upgrade
A licence issued in the earlier licence format is not accepted by 2.39.0. Read the
[upgrade notes](#upgrade-notes-2-39-0) and
[Installation → Upgrading](./installation#upgrading) first.
:::

### Changed

- **Licences use a new format that carries the agent capacity.** A licence is accepted only when
  it is in the current format and states an agent capacity that its plan allows: Pro 10, 15, 20
  or 25 agents; Enterprise from 50 to 1000 agents, in steps of 25. *License status* says when a
  licence was issued for an earlier licence format, or does not state a valid agent capacity for
  its plan. In both cases the site runs as Starter, nothing is deleted, and the page says to ask
  digitalMood for a replacement licence.
- **The number of agents comes from your licence.** Starter, without a licence, allows 2 agents.
  Pro and Enterprise allow the capacity written in the licence. No edition is unlimited any more.
  *Add agent* stops at the capacity and says what to do next: get a licence, add an agent block,
  move to Enterprise, or contact digitalMood above 1000 agents.
- **License status and System health show how the capacity is made up**, for example
  `12 / 15 agents (10 included + 1 block)`. Agents given the agent role through Moodle's own
  screens are counted but not blocked. A site above its capacity keeps every agent: it shows
  *Agent limit exceeded* and no new agent can be added until the count is back under the
  capacity. No agent is ever removed.
- **The plan comes from the licence only.** The edition setting is no longer mentioned in the
  upgrade prompts, and the "Unlimited" agent label and the "License claim ignored" note are gone.
- **The Spanish translation uses neutral Spanish throughout.** A few strings still used regional
  forms. Wording only: nothing else changed.

### Fixed

- **Searching for the target ticket on the merge page works again.** Typing in *Target* showed
  no results, so a merge could not be completed from the interface (Enterprise).
- **A ticket that was merged into another no longer accepts changes to its custom fields.** It
  shows them read-only, as the rest of a merged ticket already is. Before, its values could still
  be saved, without leaving anything in the ticket's history.
- **A merged ticket shows its properties as values, not as menus.** Its status, priority,
  category, department, team and assignee were still offered as menus, and any change ended in
  an error. The merge target and a ticket whose merge was undone keep their menus.
- **Undoing a merge is recorded in both tickets.** Each conversation now ends with a note that
  the merge was undone, and the reopened ticket's history shows its status going back. No one is
  notified, and no satisfaction survey, automation rule or webhook is triggered by these notes.

### Upgrade notes {#upgrade-notes-2-39-0}

::: warning Replace a licence in the earlier format before upgrading
After the upgrade, *License status* reports a licence issued in the earlier format as not
accepted by this version of mooDesk, and the site runs as Starter until a replacement licence is
pasted. Nothing is lost in the meantime, and every existing agent is kept. Ask [support@moodesk.io](mailto:support@moodesk.io) for a
replacement licence that states the number of agents you need.

On 2.38.1 you can paste the replacement **before** upgrading: 2.38.1 accepts it and keeps its own
agent limits until the upgrade, and the *License status* page of 2.38.1 may show the agent count
as "License claim ignored", which is expected. That note belongs to 2.38.1 only. The new capacity
applies once the upgrade is done.

For upgrades from versions earlier than 2.38.1, contact [support@moodesk.io](mailto:support@moodesk.io) for guidance before proceeding.

A site running as Starter without a licence needs no action.
:::

- **Check your agent count against the capacity of your licence.** A site with more agents than
  its licence allows, for example an Enterprise site with more than 50 agents and a 50-agent
  licence, keeps every agent after the upgrade, shows *Agent limit exceeded*, and cannot add new
  agents. Ask for a licence with the capacity you need, ideally before upgrading.

## 2.38.1 — 2026-10-08

### Fixed

- **Replying by email works on a site installed fresh.** The key that signs the reply address in
  notifications was created only when a site upgraded, so a site installed fresh had none: its
  notifications used the no-reply address and a requester's emailed reply opened a new ticket
  instead of joining theirs. A fresh install now creates the key, and upgrading to 2.38.1 gives
  one to every site that is missing it. A site that already has a key keeps it, so reply
  addresses already sent out keep working. Nothing to do on your side.
- **Incoming email is retried when the database is briefly busy.** A deadlock, a lock wait
  timeout or a database that is momentarily read-only could make mooDesk mark an incoming
  message as unprocessable and never try it again. Those messages are now retried on the next
  poll. A message that genuinely cannot be stored is still set aside as before.
- **A mailbox on SSL/TLS whose certificate is refused now says why.** With *Connection
  security* set to SSL/TLS, a certificate that does not validate was reported as
  `IMAP connect failed:  (0)`. The error now names the certificate problem, as it already did
  for STARTTLS.
- **Saving a ticket's custom fields no longer erases an old date.** A date field saved before
  dates were validated (for example `30/09/2026`) showed as an empty date box to agents, and
  saving any field on the ticket erased it. The stored value is now kept until an agent picks a
  real date, and the field shows what is stored under the date box.

## 2.38.0 — 2026-10-06

### Changed

- **MySQL is no longer listed as a supported database.** mooDesk's supported databases are
  MariaDB and PostgreSQL, the ones every release is tested on. The tested versions listed in
  the requirements now match what is tested: PHP 8.2 to 8.4, MariaDB 10.11 and PostgreSQL 16.
  The minimum versions are unchanged: PHP 8.1, MariaDB 10.6.7 and PostgreSQL 13.

### Fixed

- **A badly formatted date in a custom field no longer stops the ticket from opening.** Any text
  sent for a date field was stored as typed, and on PHP 8.3 or later the ticket page failed to
  open for everyone. Only real dates (`YYYY-MM-DD`) are stored now: invalid new values are saved
  as empty. A value saved before this release is shown as it was typed instead of breaking the
  page.
- **SLA times roll over to the next unit.** Remaining and overdue times could read *7h 60m*,
  *60m* or *24h*. They now read *8h*, *1h* and *1d*.
- **Saved view names show as typed.** A view called `A&B` showed as `A&amp;B` in the ticket
  list.
- **The licence status names the company correctly** ("digitalMood") when a licence is signed
  with a key that is not trusted.

## 2.37.0 — 2026-10-03

::: danger Before you upgrade: replace a licence signed with the retired key
2.37.0 replaced the licence signing key. See the [upgrade notes](#upgrade-notes-2-37-0)
before upgrading a site that runs Pro or Enterprise.
:::

### Added

- **Email ingestion can sign in with OAuth 2.0.** For Gmail, Google Workspace and Microsoft 365,
  the new *Authentication* setting offers **Password** or **OAuth 2.0**. With OAuth 2.0, mooDesk
  signs in to the mailbox with an access token from one of Moodle's OAuth 2 services
  (*Site administration → Server → OAuth 2 services*), chosen under *OAuth 2 service*. mooDesk
  stores no token: Moodle keeps and renews it. Microsoft mailboxes, which do not accept a
  password over IMAP, can now be connected.
- **Microsoft 365 uses its own OAuth 2 service for mail.** The service chosen for a Microsoft
  mailbox must be set aside for mail, not the one users log in with: *Show on login page* set to
  **SMTP with XOAUTH2 only**, and the offline scopes
  `openid profile email offline_access https://outlook.office.com/SMTP.Send`, without
  `user.read`. mooDesk refuses any other Microsoft setup and leaves the login service untouched.
  Moodle requests the `SMTP.Send` scope for that service, but mooDesk only reads the mailbox and
  never sends mail through it. Microsoft 365 over OAuth 2.0 needs **Moodle 4.5.5, 5.0.1 or
  later**. Microsoft OAuth 2.0 sign-in has been validated with a personal outlook.com account.
  Microsoft 365 business tenant configurations, including shared mailboxes, admin consent,
  tenant-specific endpoints, Conditional Access and administrative revocation, remain
  unvalidated.
- **OAuth 2.0 failures are reported by what fixes them.** Four incidents tell them apart: the
  configuration cannot work (`email_ingestion.oauth2.not_ready`, with the reasons listed on the
  settings page), the system account has to be connected again
  (`email_ingestion.oauth2.token_refresh_failed`), the organisation's administrator blocks the
  app (`email_ingestion.oauth2.blocked_by_policy`), or the server refused a freshly renewed
  token (`email_ingestion.oauth2.auth_rejected`). A token the server refuses is renewed once
  before anything is reported. *System health* shows how the mailbox signs in and, with OAuth
  2.0, the service and whether it is ready.

### Changed

- **Reading the mailbox no longer hides mail from mooDesk.** mooDesk used to look for messages
  it had not marked as processed, or, on servers that do not allow that mark, for unread ones,
  so a person reading the mailbox could hide a message from mooDesk for good. mooDesk now keeps
  its own position in each folder and fetches whatever arrived after it. It still marks handled
  messages, so webmail shows what mooDesk took in.
- **A message that keeps failing no longer blocks the mailbox.** After failing in three polls in
  a row, a message moves to a retry list of up to 20 messages, which is retried first on every
  poll while the rest of the mailbox moves on. Beyond 20, the oldest message on the list is
  given up and the incident `email_ingestion.cursor.retry_abandoned` is raised; a message given
  up is no longer retried automatically.

### Fixed

- **The advice for an oversized message is correct.** The setting help and the
  `email_ingestion.message.oversized` incident said to clear the processed flag on the message
  so it would be taken in. That never worked: they now say to ask the sender to send it again
  within the size limit.

### Security

- **The licence signing key was replaced.** The previous private signing key was exposed and
  has been retired. This version trusts one new key for licences and for the revocation list
  (RSA 3072, key ID `moodesk-2026-10`) and no other. A licence signed with the retired key, or
  without a key ID, shows **`untrusted_key`** on *License status*, and the site runs as Starter
  until a re-issued licence is pasted.
- **Every licence and revocation list names its key.** Licences and the revocation list carry
  the ID of the key that signed them, and each is checked only against the trusted key it
  names, so a future key change can add a key instead of replacing one.
- **The revocation list moved to a new address.** It is now read from
  `https://licenses.moodesk.io/crl/v2/revocations.json` and refused unless it is signed by a
  trusted key. A site still using the previous default address is moved to the new one by the
  upgrade, which also discards the list it held.

### Upgrade notes {#upgrade-notes-2-37-0}

::: warning Licences signed with the retired key must be replaced before upgrading
After the upgrade, a licence signed with the retired key shows **`untrusted_key`** on
*License status*, and a site whose edition depends on it runs as Starter. Ask [support@moodesk.io](mailto:support@moodesk.io) for
a re-issued licence before upgrading, and paste it once the upgrade is done. A site running as
Starter without a licence needs no action.
:::

- **Mailboxes that sign in with a password keep working as before.** *Authentication* defaults
  to **Password**, and no OAuth 2 service is used until one is chosen for the mailbox. To move a
  mailbox to OAuth 2.0, choose the service and save the settings **before** connecting its
  system account, or connect the account again afterwards.
- **The first poll after upgrading starts a one-time re-scan of each configured folder.** It
  may continue across several polls. It reads the last 14 days only, so older mail that was
  never taken in does not become tickets now. Messages already taken in are recognised and
  skipped, and a message without a Message-ID that was already in the folder when the re-scan
  started is left alone. A re-scan also starts if a server renumbers a folder (its
  `UIDVALIDITY` changes), and that is recorded as the incident
  `email_ingestion.cursor.uidvalidity_changed`.

## 2.36.0 — 2026-10-01

### Fixed

- **A failed mailbox poll says why.** The `email_ingestion.imap.poll_failed` incident and the
  scheduled task output used to read *Error occurred* for every connection failure. They now
  state the cause: the connection was refused, the certificate was rejected, the server does
  not offer STARTTLS, or the server's answer to a failed login.

### Security

- **Email ingestion supports STARTTLS.** The *Use SSL/TLS* setting is replaced by *Connection
  security*, with three choices: **SSL/TLS**, **STARTTLS** and **None**. STARTTLS connects on
  the plain IMAP port (usually 143) and upgrades the connection to TLS 1.2 or 1.3 before logging
  in. If the server does not offer STARTTLS, the connection is refused rather than continued
  without encryption, and the server's certificate is checked against its host name.
- **Messages reported above the size limit are skipped.** mooDesk checks the size reported by
  the server before downloading the message body. A message reported larger than the new
  *Maximum message size* setting (10, 25, 50 or 100 MB; 50 MB by default) is not fetched: its
  headers are recorded in the email audit, the incident `email_ingestion.message.oversized` is
  raised, and the message is marked as processed so subsequent polls skip it.
- **A mailbox polled without encryption is flagged.** While email ingestion connects with
  *Connection security* set to **None**, the email ingestion settings show a warning, and
  *System health* lists the mailbox under *Mailbox connection* as *Not encrypted*. This is
  shown as configuration, not as an incident, and an unencrypted connection can still be
  selected.

### Upgrade notes

- The upgrade keeps every mailbox connecting the way it did: *Use SSL/TLS* on becomes
  **SSL/TLS**, and off becomes **None**. A mailbox that was polled without encryption keeps
  working and now shows the warning described above. To switch a mailbox to STARTTLS, choose
  **STARTTLS** under *Connection security* and set the port your email provider gives for it.

## 2.35.0 — 2026-10-01

### Changed

- **Bulk actions show progress, and selected tickets stand out.** While a bulk action is being
  applied, the **Apply** button reads *Applying…*. The bulk toolbar, the ticket checkboxes and
  *Select all* are disabled until it finishes, so a second click cannot send the same batch
  twice. If you come back to the list with the browser's **Back** button, the controls are
  enabled again. A ticket whose checkbox is ticked is now highlighted, both in the list and in
  the card layout used on smaller screens.
- **The bulk toolbar stays in view.** Once tickets are selected, the bulk toolbar stays pinned
  under the top bar while you scroll, so you can apply an action after selecting tickets at
  the bottom of the page without scrolling back up.
- **Large bulk actions ask first.** From **10** selected tickets, **Apply** asks for
  confirmation before it starts. Each ticket in the batch is updated and notified separately,
  so a large batch can take a while.
- **A bulk action changes at most 30 tickets.** If a request includes more than 30 tickets, it
  is refused before any ticket changes, and the list shows the message *A bulk action can
  change at most 30 tickets at once. Nothing was changed.* The ticket list shows 30 tickets per
  page and *Select all* selects only the current page, so a selection made in the list stays
  within the limit.
- **Ticket sidebar layout.** The ticket sidebar is wider (268 px instead of 244 px) on the
  ticket page and in the side drawer. The SLA card, which comes first in the sidebar and stays
  in place at the top of the drawer, now has a light shadow, so the cards that scroll beneath
  it are clearly separated from it.

## 2.34.0 — 2026-09-30

### Security

- **The REST API only accepts tokens issued by mooDesk** <Badge type="warning" text="Enterprise" />.
  A REST API call made without a token issued from **mooDesk → API tokens** is now refused
  with the error code `api_token_unmanaged` before the function does anything. This includes:
  - tokens created in Moodle's *Site administration → Server → Web services → Manage tokens*,
    even if they are bound to the `moodesk_api` service. Before this release, these tokens ran
    with their owner's capabilities and no scope restrictions;
  - calls made through Moodle's username/password web service entry point
    (`/webservice/rest/simpleserver.php`).

  mooDesk's own pages are not affected. They call the server with the signed-in user's
  browser session, not with a web service token.

### Upgrade notes

::: warning Breaking change for integrations
An integration stops working after the upgrade if it authenticates with either of the
following:

- a token created in Moodle's *Manage tokens* screen;
- a web service username and password.

To migrate an integration:

1. Open **mooDesk → API tokens** and issue a token for the **same user** the integration
   uses now, with the scopes its calls need. See [API → Issuing a token](./api#issuing-a-token).
2. Configure the integration with the new token, and check that its calls succeed.
3. Revoke the old token in Moodle's *Manage tokens* screen.

Integrations that already use tokens issued from **mooDesk → API tokens** need no changes.
:::
