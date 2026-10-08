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
*License status*, and a site whose edition depends on it runs as Starter. Ask digitalMood for
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
