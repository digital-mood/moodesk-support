---
title: Integrations
description: Connecting mooDesk to a support mailbox, replying to tickets by email, reading your mail provider's sender authentication, and pushing ticket events to your own systems with webhooks.
---

# Integrations

What comes into mooDesk and what goes out, besides the web interface:

| Channel | Direction | Edition | Page |
|---|---|---|---|
| **Email ingestion** — a mailbox becomes tickets and replies | in | <Badge type="tip" text="Pro" /> | this page |
| **Reply by email** — answer a notification, land on the ticket | out + in | <Badge type="tip" text="Pro" /> | this page |
| **Sender authentication** — read your provider's SPF/DKIM/DMARC verdict | in | <Badge type="tip" text="Pro" /> | this page |
| **Webhooks** — ticket events pushed to a URL of yours | out | <Badge type="warning" text="Enterprise" /> | this page |
| **REST API** — read and write tickets from another system | in | <Badge type="warning" text="Enterprise" /> | [API](./api) |
| Notifications, licence revocation list | out | all | [Configuration](./configuration#notifications-1), [Installation](./installation#network-and-privacy) |

Every section below separates three responsibilities: what is configured **in mooDesk**, what
must already work **in Moodle**, and what depends on **your mail or network provider**. The
settings themselves, with keys and defaults, stay in [Configuration](./configuration); this
page links to them rather than repeating them.

## Email ingestion <Badge type="tip" text="Pro" />

mooDesk polls one IMAP mailbox and turns each message into a new ticket or a reply on an
existing one. The mailbox is yours. It signs in with its **password**, or, on Gmail / Google
Workspace and Microsoft 365, with **OAuth 2.0** through a Moodle OAuth 2 service.

### Before you start

| Who | What |
|---|---|
| **Your provider** | A **dedicated** mailbox reachable over IMAP, used by nothing else. Either a password that works over IMAP (on Gmail, an app password), or a Google or Microsoft account that can sign in with OAuth 2.0. **Microsoft 365 accepts OAuth 2.0 only**: Microsoft has turned off password sign-in over IMAP. |
| **Moodle** | Outgoing mail configured (*Site administration → Server → Email → Outgoing mail configuration*): notifications, operator alerts and the reply-address check all go out through it. Cron running, because the poll is a scheduled task. For OAuth 2.0, an OAuth 2 service under *Site administration → Server → OAuth 2 services* ([Signing in with OAuth 2.0](#signing-in-with-oauth-2-0)). For Microsoft 365 over OAuth 2.0, **Moodle 4.5.5, 5.0.1 or later**. |
| **mooDesk** | A Pro licence, and nothing else to install. The IMAP client is built into the plugin, so the PHP `imap` extension is **not** required. |

The first poll of a folder reads only the **last 14 days** of mail in it
([how the mailbox is read](#how-moodesk-reads-the-mailbox)), so an older backlog does not
become tickets. Within that window, a backlog is drained over several runs, oldest first, up to
*Maximum messages per run* each time.

### Connect the mailbox

In **Site administration → Plugins → Local plugins → mooDesk → Email ingestion**
([settings and defaults](./configuration#email-ingestion)):

1. Enter the **host** and **port**, and choose the **Connection security**:
   - **SSL/TLS**: encrypted from the first byte, usually on port 993. The default.
   - **STARTTLS**: connects on the plain port, usually 143, and upgrades to TLS before signing
     in. If the server does not offer STARTTLS, the poll fails. It never carries on
     unencrypted.
   - **None (not encrypted)**: the password and every message cross the network readable.
     While a mailbox is polled this way, the settings page shows a warning, and
     [System Health](./features#system-health) marks the mailbox *Not encrypted*.

   Both TLS modes check the server's certificate against the host name. There is no switch to
   accept any certificate.
2. Choose the **Authentication**:
   - **Password**: enter the **Mailbox username** (an email address) and the **Mailbox
     password**. mooDesk signs in with IMAP `LOGIN`. This is the default.
   - **OAuth 2.0 (Google, Microsoft 365)**: enter the mailbox address as **Mailbox username**
     and choose the **OAuth 2 service**. Follow the order under
     [Signing in with OAuth 2.0](#signing-in-with-oauth-2-0): mooDesk needs the service saved
     before its system account is connected.
3. Choose the **folder** (`INBOX` unless you filter mail into another one), the **Maximum
   message size**, and the **department** and **category** that tickets opened by mail should
   get.
4. Switch **Enable email ingestion** on and save.
5. Run `process_incoming_email` once from **Site administration → Server → Tasks → Scheduled
   tasks** and send a test message to the mailbox. On its own the task runs **every 5
   minutes** ([Installation → Scheduled tasks](./installation#scheduled-tasks)).

Attachments on incoming mail are stored when [attachments are enabled](./configuration#general),
within the site's size limit.

### Signing in with OAuth 2.0

With *Authentication* set to **OAuth 2.0**, the poller signs in with an access token instead of
a password. The token comes from a **Moodle OAuth 2 service** and its **system account**.
mooDesk adds the mail scope to the system account of the service you choose. Moodle obtains,
keeps and renews the token. **mooDesk stores no token**, only which service to use. Only Google
and Microsoft services are accepted.

The order matters, because the mail scope is requested when the system account is connected:

1. Create or pick the OAuth 2 service in **Site administration → Server → OAuth 2 services**
   ([Google](#gmail-google-workspace) or [Microsoft 365](#microsoft-365-exchange-online)
   below).
2. In mooDesk's email ingestion settings, set *Authentication* to **OAuth 2.0**, choose the
   service as *OAuth 2 service*, fill in *Mailbox username* and **save**.
3. Back in *OAuth 2 services*, **connect the system account** of that service. Sign in as the
   mailbox user and accept the access to mail. A system account connected before step 2 does
   not have the mail scope, so connect it again.
4. Switch on *Enable email ingestion*. Until the configuration can work, the settings page says
   what is stopping it, and System Health marks the mailbox *Needs attention*.

The system account is a real user signing in on the mailbox's behalf. If its password changes,
the account is disabled, or a sign-in policy starts applying to it, the provider may refuse to
renew the token. When that happens, connect the system account again.

When a sign-in fails, System Health records one of four incidents, one per remedy:
`email_ingestion.oauth2.not_ready`, `email_ingestion.oauth2.token_refresh_failed`,
`email_ingestion.oauth2.blocked_by_policy` and `email_ingestion.oauth2.auth_rejected`. What each
means, and what to do, is in
[Troubleshooting → Email ingestion](./troubleshooting#email-ingestion-email-ingestion). A
token the server refuses is renewed once before anything is reported, so a token that has
merely gone stale recovers on its own.

### What happens to each message

For every message the poll reads, in this order:

1. **Size.** A message larger than *Maximum message size* (default 50 MB) is not downloaded.
   Its sender and subject are recorded as `unprocessable`, an
   `email_ingestion.message.oversized` incident is raised, and the message is marked as
   processed in the mailbox. Raising the limit later does not bring it back, because its
   Message-ID is on record. To take it in, ask the sender to send it again within the limit.
2. **Parse.** A message that cannot be parsed raises an incident and is retried (see
   [A message that keeps failing](#how-moodesk-reads-the-mailbox)).
3. **Automatic replies** (out-of-office, bounces, list traffic) are dropped. They are
   recognised by the standard `Auto-Submitted`, `X-Auto-Response-Suppress` and `Precedence`
   headers.
4. **The reply-address check.** The probe sent from the settings page is recognised and
   consumed ([Modes and the round-trip check](#modes-and-the-round-trip-check)).
5. **Already processed.** A message whose Message-ID is already on record is skipped, so
   reading the same message twice is harmless.
6. **Sender authentication.** The verdict your provider stamped on the message is read and
   recorded ([Sender authentication](#sender-authentication)).
7. **Reply token.** If the message was sent to a tokenised reply address, the token is
   verified ([Replying by email](#replying-by-email)).
8. **Threading.** A valid token names the ticket. Without one, `In-Reply-To` / `References`
   are matched against the Message-IDs of mail mooDesk has **received** for a ticket (kept for
   the *Ticket correspondence retention* period). mooDesk does not record the Message-ID of
   the notifications it sends, so a reply to a notification threads reliably only through
   the token. A match becomes a **public reply** from the sender. A reply to a **closed**
   ticket opens a **new ticket** instead. A reply to a ticket that was **merged** into another
   is refused, and the sender is told which ticket to write to.
9. **Duplicates.** The same sender and subject inside the *Deduplication window* is dropped.
10. **New ticket.** The sender becomes the requester, the subject the subject and the text
    body the message. Attachments go on the opening message, the source is *Email*, and the
    configured department and category apply. All of this happens after the sender-authenticity
    policy has had its say.

At the point a ticket or reply would be written, the sender's address must match **one active
Moodle account**. If it does not, the message is **refused**: no ticket, no placeholder, no
account created. The refusal is recorded, and the operators in *Unknown-sender alert
recipients* are notified.

### How mooDesk reads the mailbox

**By position, not by flag.** For each mailbox and folder, mooDesk keeps a cursor: the highest
message UID it has read, and the folder's `UIDVALIDITY`. Each poll asks for what arrived above
it. Reading, flagging or un-flagging mail in webmail changes nothing. Processed messages are
still flagged so webmail shows what was handled: a mooDesk keyword plus *Seen* where the folder
accepts keywords, *Seen* alone where it does not (Microsoft 365). mooDesk never reads those
flags back. Messages are never deleted or moved. A message that something else **moves out of
the folder or deletes** before a poll is not seen.

**A message that keeps failing.** A transient failure (`error`) stops the poll at that message,
so an outage skips nothing. Mail behind it waits for the next poll. If the same message fails on
three polls in a row, it is set aside on a **retry list**, retried first on every poll, and the
poll moves past it. The list holds **20** messages. Past that, the oldest is abandoned and an
`email_ingestion.cursor.retry_abandoned` incident is raised.

**The one-time re-scan.** When mooDesk has no cursor for a folder, it reads the folder from the
start, once. That happens on the first poll after upgrading to 2.37.0, for a newly connected
mailbox, and after the host, port, username or folder changes. It also happens when a poll
finds the folder's `UIDVALIDITY` changed: the server renumbered it, for example after a restore
or after the folder was recreated, and an `email_ingestion.cursor.uidvalidity_changed` incident
records it. The re-scan:

- reads only messages from the **last 14 days**, so months-old mail that was never ingested does
  not turn into tickets and notify its senders now;
- recognises messages already handled by their Message-ID and skips them (`already_processed`);
- leaves alone a message that was already in the folder and has **no Message-ID**
  (`rescan_skipped_no_message_id`), since nothing could tell whether it is already a ticket;
- respects the per-run cap. The task log says when the re-scan is complete.

### Outcomes

The task writes one summary line per run to the task log (*Site administration → Server →
Tasks → Task logs*), counting each outcome by name, and says when the per-run cap stopped it
short. Refusals also appear as operator alerts, and failures as incidents on
[System Health](./features#system-health).

| In the task log | Meaning |
|---|---|
| `ticket_created` | A ticket was opened |
| `reply_added` | A public reply was added to an existing ticket |
| `probe_confirmed` | The reply-address check came back. It was consumed and nothing was created |
| `autoreply_skipped` | An automatic reply, dropped |
| `duplicate_skipped` | Inside the deduplication window, dropped |
| `already_processed` | Its Message-ID is already on record (an earlier run, or the re-scan) |
| `rescan_skipped_no_message_id` | Re-scan only: already in the folder and has no Message-ID, so it was left alone |
| `unknown_sender_rejected` | The sender is not an active Moodle user. Operators alerted |
| `sender_unverified_rejected` | Sender authenticity is *Require* and the verdict was not a pass. Operators alerted |
| `token_required` | Reply authentication is *Require token* and the reply carried none |
| `token_invalid` | A token that does not verify. Refused in every mode |
| `token_sender_mismatch` | A valid token, but sent from an address that is not the user it was issued to |
| `unauthorised_rejected` | A reply from a user who may not write to that ticket. Operators alerted, sender not told |
| `merged_rejected` | A reply to a ticket merged into another. The sender is told where to continue |
| `unprocessable` | A message that will never be stored: larger than *Maximum message size*, or a header the database cannot hold. Marked as processed, incident raised |
| `error` | A transient failure on this message. The poll stops there and retries it on the next run |

### Provider notes

#### Gmail / Google Workspace

| Setting | Value |
|---|---|
| IMAP server hostname | `imap.gmail.com` |
| IMAP port | `993` |
| Connection security | SSL/TLS |
| Mailbox username | the mailbox address |

IMAP access must be enabled on the account. Then choose one of these:

- **OAuth 2.0** (recommended). There is nothing to rotate, and no dependency on app passwords,
  which a Workspace administrator can switch off for the whole tenant. Moodle's **Google** OAuth
  2 service works as it is, including the one your users log in with. In Google Cloud the OAuth
  client is a *Web application* with the redirect URI
  `https://<your site>/admin/oauth2callback.php`. mooDesk asks for the
  `https://mail.google.com/` scope, which Google classes as restricted. On Google Workspace,
  set the consent screen to **Internal**: only your domain's users can consent, and no Google
  verification is needed. An *External* app left in *Testing* loses its authorisation seven
  days after consent, and the poll stops until the system account is connected again.
- **Password** with an **app password**, on an account with **2-Step Verification** on. The
  account's ordinary Google password does not work over IMAP. Whether app passwords are
  available is decided by Google and by your Workspace administrator, not by mooDesk.

A Workspace administrator can restrict IMAP or third-party app access for the tenant. The poll
then fails with an OAuth 2.0 incident. For sender authentication, Google Workspace is the one
provider profile mooDesk ships. See [Provider profiles](#provider-profiles).

#### Microsoft 365 / Exchange Online

Microsoft has turned off password sign-in over IMAP for every tenant. **OAuth 2.0 is the only
way to connect a Microsoft 365 mailbox.**

- **Moodle 4.5.5, 5.0.1 or later.** Earlier Moodle versions cannot get a mail token from
  Microsoft (Moodle issue MDL-80380). mooDesk detects this at runtime and says so on the
  settings page. This requirement applies only to Microsoft 365 over OAuth 2.0.
- **Set up a separate Microsoft service for mail.** Do not use the Microsoft service your
  users log in with. Microsoft issues a token for one resource only, and the login service
  also asks for Microsoft Graph, so its system account cannot be connected for mail. Create a
  **second** Microsoft service in *OAuth 2 services*:

  | Field | Value |
  |---|---|
  | *Client ID* / *Client secret* | From the Microsoft Entra app registration. The login service's app can be reused |
  | *Show on login page* | **SMTP with XOAUTH2 only**. mooDesk refuses a Microsoft service in any other mode |
  | *SMTP email* | The mailbox's address |
  | *Scopes included in a login request for offline access* | Exactly `openid profile email offline_access https://outlook.office.com/SMTP.Send`. No `user.read`, and no other Microsoft Graph scope |

  Because of that mode, Moodle requests `SMTP.Send`, so the consent screen also asks to send
  mail as the mailbox. **mooDesk never sends mail through this service.** It only reads the
  mailbox. Outgoing mail keeps using Moodle's own settings.
- **App registration.** Platform *Web*, redirect URI
  `https://<your site>/admin/oauth2callback.php`, and the **delegated** permissions
  `IMAP.AccessAsUser.All` and `SMTP.Send`, plus `offline_access`, `openid`, `profile` and
  `email`. A tenant's default policy does not let ordinary users consent to IMAP access, so an
  administrator grants admin consent for the app.
- **The mailbox.** IMAP must be enabled for it. For a **shared mailbox**, put its address in
  *Mailbox username* and connect the system account as a user with *Full Access* to it.
- **Not supported:** app-only access (client credentials). Moodle core has no such flow, and
  mooDesk keeps no tokens of its own.

::: warning Not yet validated on a Microsoft 365 business tenant
OAuth 2.0 over IMAP with Microsoft has been validated against a Microsoft (outlook.com) account:
the mail service above, sign-in, token renewal, and the refusal of a token issued for another
address or for Microsoft Graph. Things only a Microsoft 365 business tenant has are **not yet
validated**: shared mailboxes, admin consent, single-tenant endpoints, tenant policies such as
MFA or Conditional Access, administrative revocation (an administrator revoking sessions or
resetting the password), and IMAP disabled per mailbox. What this page says about them follows
Microsoft's and Moodle's documentation, not a test.
:::

#### Other IMAP servers

Any server that accepts IMAP `LOGIN` over SSL/TLS or STARTTLS works with *Password*. OAuth 2.0
is available only for Google and Microsoft. If you plan to use
[Replying by email](#replying-by-email), check that the server supports **sub-addressing**
(`support+anything@…` delivered to `support@…`).

## Replying by email <Badge type="tip" text="Pro" />

When someone answers a mooDesk notification from their mail client, the reply has to land on
the right ticket and be attributed to the right person. `From:` alone cannot be trusted for
that — anyone can type an address — so mooDesk puts a **conversation token** in the
`Reply-To` of every ticket notification it sends. The reply comes back to a tokenised address;
the token says which ticket and which recipient it was issued for, and the `From:` must agree.

This needs **email ingestion to be on** — the tokenised replies arrive through the same
mailbox — and it needs your mail server to deliver the generated addresses into that mailbox.

### How the reply link works

| Who | What |
|---|---|
| **mooDesk** | Takes the **reply address** you configure, for example `support@example.org`, and for each notification builds `support+‹token›@example.org` with the delimiter you chose (`+` or `-`). The token is bound to one ticket and one recipient and expires after the *Reply token lifetime*. |
| **Your provider** | Must deliver every `support+‹anything›@example.org` into the polled mailbox (**sub-addressing**, also called plus addressing). Gmail and Google Workspace do this by default; other servers may need it switched on. |
| **Moodle** | Sends the notification. The `Reply-To` is set per message; no Moodle setting is involved. |

The token occupies a fixed part of the address, so the part of the reply address **before
`@` may be at most 13 characters**. The settings page refuses a longer one.

On an incoming reply the token is verified, the ticket is looked up, and the message becomes a
public reply from the recipient the token was issued to — a requester or an agent alike.
When the token is valid but the `From:` belongs to a different user, the reply is refused.

### Modes and the round-trip check

[Reply authentication](./configuration#email-reply-authentication) has three modes: *Legacy*
(no tokens are checked — transition only), *Prefer token* (replies with and without a token
are accepted; each kind is counted so you can see what would break), and *Require token* (a
reply without a valid token is refused). A reply without a token can only be threaded through
`References` to mail the requester sent earlier — in practice, most replies to a notification
reach their ticket because of the token, whichever mode is on. A fresh install starts on *Require token*; a site
upgraded from an earlier version lands on *Prefer token*.

*Require token* is only safe once a tokenised address is known to reach the mailbox. That is
what the **round-trip check** on the settings page establishes:

| Step | Who | What |
|---|---|---|
| 1 | **mooDesk** | *Send a probe now* (on the settings page) mails a short message from the site's no-reply address to the currently configured reply address with a check tag in place of a token. |
| 2 | **Your provider** | Delivers it to the polled mailbox, because sub-addressing works — or does not, which is the failure the check exists to reveal. |
| 3 | **mooDesk** | The next poll recognises the check (`probe_confirmed` in the task log), records the time, and the settings page shows *Confirmed: a probe sent to this address came back on …*. |

Until that confirmation exists **for the address configured right now**, the mode setting
will not accept *Require token*, and a site already on *Require token* behaves as *Prefer
token*. Changing the reply address withdraws the confirmation; check again. A fresh install
that enables ingestion without configuring a reply address accepts no replies by mail until
the address is set and confirmed — new tickets by mail are unaffected, and System Health says
so.

### Resetting a ticket's reply links

From a ticket's sidebar, an agent who can manage the ticket can **Reset email reply links**:
every token issued for that ticket stops working, and the next notification carries a fresh
one. Use it when a notification was forwarded somewhere it should not have been. The control
is shown only while email ingestion and a reply address are configured.

## Sender authentication <Badge type="tip" text="Pro" />

::: warning mooDesk does not run SPF, DKIM or DMARC
Turning this on does **not** configure or check SPF, DKIM or DMARC for any domain. By the time
a message is fetched over IMAP the connecting server and the envelope are gone, and mooDesk has
no DNS or signature verification of its own. What it can do is **read the verdict your mail
provider stamped on the message when it received it** — the `Authentication-Results` header —
and apply your policy to that verdict. If your provider stamps nothing, there is nothing to
read.
:::

The `From:` on an incoming mail is a claim. This feature decides how much to trust that claim
when a mail **opens a new ticket** (replies are covered by the token above). It is evaluated
on every message and recorded, and the verdict is shown to agents on the ticket; it is
**enforced** only when a new ticket is created.

### Provider profiles

The whole difficulty is telling the header your provider wrote from one a sender forged, so
mooDesk only reads a header that (a) starts with an identifier you configured and (b) is the
topmost one bearing it — a receiving server prepends, so its verdict sits above anything the
sender wrote.

| Profile | Use when | What you must provide |
|---|---|---|
| **None** | You do not want sender verdicts read | — |
| **Gmail / Google Workspace** | The polled mailbox is on Google | The **authentication server identifier** Google writes — usually `mx.google.com`, but read it off a raw message from *your own* mailbox rather than assuming |
| **Other mail server** | Any other provider | The identifier, **and** the assertion that your server strips incoming headers impersonating it. mooDesk cannot verify that assertion: if it is wrong, a forged verdict is read as genuine. Without the assertion this profile produces no verdict at all |

There is no Microsoft 365 profile: Exchange Online's header format has not been validated by
mooDesk against a real tenant. A Microsoft 365 site uses *Other mail server* with the
assertion, or stays on *None*.

What counts as a **pass**: DMARC pass for the `From:` domain, or an aligned DKIM pass, or an
aligned SPF pass. SPF alone never suffices — it authenticates the envelope, not the `From:`.
Everything else is *fail*, *none* (the provider evaluated and found nothing), *absent* (no
header), or *unverifiable* (a header mooDesk cannot attribute to your provider).

### Turning on Require

[Sender authenticity for new tickets](./configuration#inbound-sender-authentication) has three
modes. **Warn** (the default) records the verdict, shows it on the ticket and creates the
ticket regardless. **Require** creates a ticket only for an authenticated sender and refuses
everything else — including mail the site cannot judge. **Off** stops evaluating.

*Require* becomes selectable only after real mail has shown the profile works: in the last
**7 days**, at least **20** messages evaluated, at least **10** authenticated, and at least
**80 %** with a verdict the profile could read. [System Health](./features#system-health)
shows those numbers and whether the strict policy can be armed. Once on, *Require* never
relaxes itself: a provider change that breaks the header is a refusal you will see, not a
silent downgrade.

## Webhooks <Badge type="warning" text="Enterprise" />

mooDesk sends an HTTP `POST` with a JSON body to a URL of yours when something happens to a
ticket. Deliveries are queued, retried, signed and logged.

### Create a webhook

**mooDesk → Webhooks** (`managewebhooks`). *Add webhook* asks for a **name**, the **URL**, a
**signing secret**, **Active**, and the **events** to subscribe to (at least one). Once saved,
**Send test ping** posts a `test.ping` payload to the URL right away and shows the HTTP status
it got back. The recent deliveries of each webhook are listed with event, time, HTTP status and
outcome.

**The signing secret is shown once.** Leave the field empty and mooDesk generates a strong
secret (64 characters). If you type your own, it must be at least 32 characters. Either way,
the secret is shown **once**, on the webhook list, right after you save. Configure it on the
receiving end then: it is never shown again, and the edit form has no secret field. If it is
lost, or might have leaked, use **Rotate secret** in the *Signing secret* panel of the webhook's
edit page. That generates a new secret, shows it once the same way, and signs deliveries with
it straight away, so the receiving end rejects them until it is updated.

Webhooks created before 2.33.0 keep their secret and keep working. The list marks a webhook
as *Signed*, as *Unsigned* (no secret: deliveries carry no signature) or as *Weak secret*
(shorter than 32 characters). Rotate the secret of an *Unsigned* or *Weak secret* webhook to
replace it with a generated one.

| Who | What |
|---|---|
| **mooDesk** | Builds, signs, queues, delivers and logs each request. |
| **Moodle** | Webhook requests go out through Moodle's HTTP client and are subject to the **network restrictions configured in Moodle** (*Site administration → Security → HTTP security*): a host or port blocked there never receives a delivery, and the failure shows in the log and on System Health. Cron must run: deliveries are drained by a scheduled task. |
| **Your endpoint** | Accepts `POST`, answers **2xx** within 5 seconds, presents a **valid TLS certificate** — mooDesk verifies it and there is no setting to skip that. Use **HTTPS** in production. Redirects are not followed. |

### Events and payload

| Event | Sent when | Extra fields |
|---|---|---|
| `ticket.created` | A ticket is created, from any source | — |
| `ticket.replied` | A **public** reply is posted — internal notes are not sent | `replyid` |
| `ticket.resolved` | The status becomes *Resolved* | `newstatus`, `oldstatus` |
| `ticket.updated` | The status changes to anything other than *Resolved*, or the priority, category, department or team changes | status: `newstatus`, `oldstatus` · field: `field` (`priority`, `categoryid`, `departmentid`, `teamid`), `oldvalue`, `newvalue` |
| `ticket.merged` | A ticket is merged into another | `source`, `target`, `audit_id`, `migrated_summary` (`replies_count`, `internal_notes_count`, `attachments_count`, `history_entries_count`) |
| `ticket.merge_reverted` | A merge is undone | `source`, `target`, `audit_id`, `actor` |

**Assignment changes do not raise a webhook.** Watch `ticket.updated` for the
other sidebar fields; the assignee is only visible as `ticket.assigneeid` in the next payload.

Every event carries the same envelope:

```json
{
  "event": "ticket.created",
  "timestamp": 1758100000,
  "site": "https://moodle.example.org",
  "ticket": {
    "id": 42,
    "subject": "Cannot open the quiz",
    "status": 1,
    "priority": 1,
    "categoryid": 3,
    "departmentid": null,
    "teamid": null,
    "requesterid": 118,
    "assigneeid": null,
    "timecreated": 1758099990,
    "timemodified": 1758099990
  }
}
```

- `timestamp` is when the event was recorded, as a Unix time in seconds; `site` is the
  Moodle site URL.
- `ticket` always has these eleven keys. An unset value is JSON `null` — a ticket with no
  department, team or assignee shows `null`, not `0`.
- `status` and `priority` are the numeric codes listed under
  [Configuration → Automations](./configuration#automations).
- When the event has extra fields they come under an `"extra"` object; `ticket.created` has
  none. `oldstatus` is `-1` when the previous status is unknown.
- The body is standard PHP JSON: forward slashes are escaped as `\/` and non-ASCII text as
  `\uXXXX`. Verify the signature over the **raw bytes** you received; never re-serialise.

The test ping is the one payload without a ticket:

```json
{ "event": "test.ping", "timestamp": 1758100000, "site": "https://moodle.example.org",
  "webhook": { "id": 7, "name": "Ops bridge" } }
```

### Verifying the signature

Every delivery carries these headers:

```http
Content-Type: application/json
User-Agent: moodesk-helpdesk/1.x (+webhooks)
X-Moodesk-Event: ticket.created
X-Moodesk-Timestamp: 1758100003
X-Signature-256: sha256=3f5a…e0c1
```

- `X-Moodesk-Timestamp` is the Unix time (seconds) of **this delivery attempt** — a retry is
  re-stamped and re-signed, so it can differ from the `timestamp` inside the body.
- `X-Signature-256` is present whenever the webhook has a **secret**, which every webhook
  created since 2.33.0 has. A webhook marked *Unsigned* on the list sends none, and nothing
  about its requests proves they came from mooDesk. Rotate its secret before any endpoint
  acts on what it receives.
- The signature is **HMAC-SHA256** over the string
  `‹X-Moodesk-Timestamp› + "." + ‹raw request body›`, keyed with the secret, encoded as
  **lowercase hexadecimal**, prefixed with `sha256=`.

mooDesk does not enforce any time window itself; it stamps and signs the moment of the POST.
**Rejecting a request whose timestamp is more than 300 seconds from your clock is your side
of the contract** — it is what stops a captured request from being replayed later.

```python
import hmac, hashlib, time

def verify(secret: str, headers: dict, raw_body: bytes, tolerance: int = 300) -> bool:
    ts = headers["X-Moodesk-Timestamp"]
    if abs(time.time() - int(ts)) > tolerance:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), ts.encode() + b"." + raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, headers.get("X-Signature-256", ""))
```

Use a constant-time comparison, as above, and read `raw_body` before any JSON parsing or
middleware touches it.

### Delivery, retries and the log

- An event writes one queue row per active webhook subscribed to it; the `dispatch_webhook`
  task drains the queue **every minute**.
- A **2xx** response is success. Anything else — a transport error, a timeout (3 s to connect,
  5 s in total), a non-2xx status — schedules a retry: **5 attempts** in all, waiting 1, 5,
  30 and 120 minutes between them. After the fifth failure the row is marked failed and an
  incident appears on [System Health](./features#system-health).
- A webhook that is disabled or deleted while deliveries are pending fails them permanently.
- Every attempt, including test pings, is logged with the payload sent, the HTTP status and
  the first 4 KB of the response. Log rows are kept for the
  [retention period](./configuration#webhooks) you set.

## Other connections

- **Licence revocation list** — the one outbound request mooDesk makes on its own, once a
  day; what it fetches and how to allow it through an egress firewall is under
  [Installation → Network and privacy](./installation#network-and-privacy).
- **REST API** <Badge type="warning" text="Enterprise" /> — token-authenticated endpoints for
  tickets, knowledge base articles and webhooks. See [API](./api).
- **Moodle itself** — notifications use Moodle's messaging, published articles can appear in
  Moodle's global search <Badge type="tip" text="Pro" />, and data requests run through
  Moodle's privacy workflow. None of these needs configuration in mooDesk beyond the switches
  in [Configuration](./configuration).

## Not supported

| | Status |
|---|---|
| OAuth 2.0 for the mailbox with a provider other than Google or Microsoft | Not available; such mailboxes use *Password* |
| App-only (client credentials) access to a Microsoft 365 mailbox | Not available; OAuth 2.0 uses a Moodle OAuth 2 service's system account |
| Accepting a mailbox certificate the server's trust store rejects | Not available; both TLS modes verify the certificate |
| POP3 | Not implemented |
| Sender-authentication profiles other than Gmail / Google Workspace | Only *Other mail server* with the operator's assertion |
| Automatic account creation for unknown senders | By design: mail from an address with no active Moodle account is refused |
| A webhook on assignment | No `ticket.assigned` event; see [Events](#events-and-payload) |
| Following redirects, or skipping TLS verification, on webhook deliveries | Not available |

---

*Verified against mooDesk 2.37.0.*
