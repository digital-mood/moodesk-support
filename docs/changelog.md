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

## 2.37.0 — 2026-10-03

::: danger Before you upgrade: get a re-issued licence
2.37.0 replaced the licence signing key. **A Pro or Enterprise licence issued before 2.37.0
stops working on upgrade**: *mooDesk → License* shows **`untrusted_key`** and the site runs as
Starter until you paste a re-issued licence. Ask digitalMood for it **before** upgrading. See
[Upgrade notes](#upgrade-notes-2-37-0) below.
:::

### Security

- **The licence signing key was replaced.** This version trusts only the new key. A licence
  signed with the previous key shows **`untrusted_key`** on *mooDesk → License*, and the site
  runs as Starter until a re-issued licence is pasted. Nothing is deleted in the meantime: Pro
  and Enterprise data stays in the database and comes back with the new licence.
- **The licence revocation list moved to `/crl/v2/`.** The default *Revocation list URL* is
  now `https://licenses.moodesk.io/crl/v2/revocations.json`, and only a list signed with a
  trusted key is accepted. The upgrade moves a site still on the previous default URL to the
  new one and discards the list it held. A URL you set yourself is left unchanged.

### Added

- **Email ingestion can sign in with OAuth 2.0** <Badge type="tip" text="Pro" />, for Gmail /
  Google Workspace and Microsoft 365. *Authentication* now offers **Password** or **OAuth
  2.0**. With OAuth 2.0 the mailbox signs in with an access token from a Moodle OAuth 2 service
  (*Site administration → Server → OAuth 2 services*), chosen as *OAuth 2 service*. mooDesk
  adds the mail scope to that service's system account and **stores no token**: Moodle keeps
  and renews it.
- **Microsoft 365 mailboxes can be connected** <Badge type="tip" text="Pro" />. Microsoft no
  longer accepts passwords over IMAP, so OAuth 2.0 is the only way. Microsoft 365 needs a
  Microsoft OAuth 2 service set aside for mail, separate from the one users log in with, and
  **Moodle 4.5.5, 5.0.1 or later**. mooDesk detects an older Moodle and says so on the
  settings page. Validated against a Microsoft (outlook.com) account. What only a Microsoft 365
  business tenant has (shared mailboxes, admin consent, single-tenant endpoints, tenant
  policies such as Conditional Access, administrative revocation) is **not yet validated**.
  See [Integrations → Email ingestion](./integrations#email-ingestion).
- **Four System Health incidents for OAuth 2.0 sign-in failures**, one per remedy:
  `email_ingestion.oauth2.not_ready` (the configuration cannot work; the settings page lists
  why), `email_ingestion.oauth2.token_refresh_failed` (connect the system account again),
  `email_ingestion.oauth2.blocked_by_policy` (the tenant's administrator must allow the app)
  and `email_ingestion.oauth2.auth_rejected` (the mail server refused a freshly renewed token).
  *System health* also shows how the mailbox signs in and, with OAuth 2.0, the service and
  whether it is ready.

### Changed

- **Email ingestion reads the mailbox by position, not by flag** <Badge type="tip" text="Pro" />.
  mooDesk now keeps a cursor per folder and reads what arrived since the last poll. Someone
  reading, flagging or un-flagging mail in webmail no longer hides it from mooDesk. Processed
  messages are still flagged, so webmail shows what was handled, but those flags are never
  read back.
- **A message that keeps failing no longer holds up the mailbox.** A transient error stops the
  poll at that message, so an outage skips nothing. After three polls in a row, the message
  moves to a retry list of up to 20 messages, retried first on every poll, and the poll moves
  past it. Past 20, the oldest is abandoned with an `email_ingestion.cursor.retry_abandoned`
  incident.

### Fixed

- **The advice for an oversized message was wrong.** The setting help and the
  `email_ingestion.message.oversized` incident said to clear the processed flag on the message.
  That does not work, because its Message-ID is on record. They now say what does: ask the
  sender to send it again within *Maximum message size*.

### Upgrade notes {#upgrade-notes-2-37-0}

::: warning Licences issued before 2.37.0 must be re-issued
A licence issued before this version stops working on upgrade. *mooDesk → License* shows
**`untrusted_key`** and the site runs as Starter until a licence re-issued for the new key is
pasted under *Licence key*. Ask digitalMood for the re-issued licence before upgrading, and
paste it right after. See [Installation → Upgrading](./installation#upgrading).
:::

- **Nothing changes for a mailbox signed in with a password.** *Authentication* defaults to
  **Password**, and no OAuth 2 service is touched until you choose one for the mailbox. To move
  a mailbox to OAuth 2.0, choose the service and save **before** connecting its system
  account, or connect it again afterwards.
- **The first poll after upgrading re-scans each folder once.** It reads only the last 14 days,
  so older mail that was never ingested does not become tickets now. Messages already ingested
  are recognised by Message-ID (`already_processed`), and a message already in the folder
  without a Message-ID is left alone (`rescan_skipped_no_message_id`). The per-run cap still
  applies, and the task log says when the re-scan is complete. The same re-scan happens later
  whenever the server renumbers a folder, recorded as an
  `email_ingestion.cursor.uidvalidity_changed` incident.

## 2.36.0 — 2026-10-01

### Security

- **STARTTLS for the mailbox** <Badge type="tip" text="Pro" />. The *Use SSL/TLS* setting is
  replaced by **Connection security**, with three choices: **SSL/TLS**, **STARTTLS** and
  **None**. STARTTLS connects on the plain port (usually 143) and upgrades to TLS 1.2 or 1.3
  before signing in. If the server does not offer STARTTLS, the poll fails instead of
  continuing unencrypted. The certificate is checked against the host name.
- **An unencrypted mailbox connection is called out.** While email ingestion polls a server
  with *Connection security* set to *None*, the email ingestion settings show a warning, and
  *System health* has a *Mailbox connection* section that names the server and marks it *Not
  encrypted*. It is not an incident, and *None* stays selectable.
- **A maximum message size for the mailbox.** The new **Maximum message size** setting (10, 25,
  50 or 100 MB; default 50 MB) bounds what a poll downloads. A larger message is not fetched:
  its sender and subject are recorded, an `email_ingestion.message.oversized` incident is
  raised, and the message is marked as processed.

### Fixed

- **A failed mailbox poll says why.** The task log and the `email_ingestion.imap.poll_failed`
  incident used to read *Error occurred* for every IMAP failure. They now name the cause: the
  connection refused, the certificate rejected, a server without STARTTLS, or the server's
  answer to a failed login.

### Upgrade notes

- The upgrade carries *Use SSL/TLS* over as the setting it meant: on becomes **SSL/TLS**, off
  becomes **None**. No mailbox changes how it is reached. A mailbox polled without encryption
  keeps working and is now flagged. To move a mailbox to STARTTLS, choose it under
  *Connection security* and set the port your provider gives for it.

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
