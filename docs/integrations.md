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
existing one. The mailbox is yours, on any provider that offers IMAP with a username and
password.

### Before you start

| Who | What |
|---|---|
| **Your provider** | A **dedicated** mailbox — used by nothing and nobody else — reachable over IMAP with a **username and password**. mooDesk 2.30.0 authenticates with the IMAP `LOGIN` command only; it does not implement OAuth2 / `XOAUTH2`. |
| **Moodle** | Outgoing mail configured (*Site administration → Server → Email → Outgoing mail configuration*) — notifications, operator alerts and the reply-address check all go out through it. Cron running: the poll is a scheduled task. |
| **mooDesk** | A Pro licence. Nothing else: the IMAP client is built into the plugin, so the PHP `imap` extension is **not** required — the text on the settings page that says otherwise is out of date. |

The mailbox should start empty. A backlog is drained over several runs, oldest first, up to
*Maximum messages per run* each time.

### Connect the mailbox

In **Site administration → Plugins → Local plugins → mooDesk → Email ingestion**
([settings and defaults](./configuration#email-ingestion)):

1. Enter the **host**, **port** and **username** (an email address) and the mailbox
   **password**.
2. Leave **Use SSL/TLS** on. It means *implicit TLS* — the connection is encrypted from the
   first byte, which is what port 993 expects. Switching it off makes a **plain, unencrypted
   TCP connection**: the code allows it, production should not. mooDesk 2.30.0 does not
   implement **STARTTLS**, so a server that only upgrades a plain connection on port 143 cannot
   be used securely.
3. Choose the **folder** (`INBOX` unless you filter mail into another one) and the
   **department** and **category** new mail-borne tickets should get.
4. Switch **Enable email ingestion** on and save.
5. Run `process_incoming_email` once from **Site administration → Server → Tasks → Scheduled
   tasks** and send a test message to the mailbox. On its own the task runs **every 5
   minutes** ([Installation → Scheduled tasks](./installation#scheduled-tasks)).

Attachments on incoming mail are stored when [attachments are enabled](./configuration#general),
within the site's size limit.

### What happens to each message

For every message the poll finds, in this order:

1. **Parse.** A message that cannot be parsed at all is set aside and an incident is raised.
2. **Automatic replies** — out-of-office, bounces, list traffic, recognised by the standard
   `Auto-Submitted`, `X-Auto-Response-Suppress` and `Precedence` headers — are dropped.
3. **Already processed** — a message seen on an earlier run is skipped, so a second poll of
   the same mailbox is harmless.
4. **Sender authentication** — the verdict your provider stamped on the message is read and
   recorded ([Sender authentication](#sender-authentication)).
5. **Reply token** — if the message was sent to a tokenised reply address, the token is
   verified ([Replying by email](#replying-by-email)).
6. **Threading** — a valid token names the ticket. Without one, `In-Reply-To` / `References`
   are matched against the Message-IDs of mail mooDesk has **received** for a ticket (kept for
   the *Ticket correspondence retention* period); mooDesk does not record the Message-ID of
   the notifications it sends, so a reply to a notification threads reliably only through
   the token. A match becomes a **public reply** from the sender. A reply to a **closed**
   ticket opens a **new ticket** instead. A reply to a ticket that was **merged** into another
   is refused, and the sender is told which ticket to write to.
7. **Duplicates** — the same sender and subject inside the *Deduplication window* is dropped.
8. **New ticket** — the sender as requester, the subject as subject, the text body as
   message, attachments on the opening message, source *Email*, in the configured department
   and category — after the sender-authenticity policy has had its say.

At the point a ticket or reply would be written, the sender's address must match **one active
Moodle account**. If it does not, the message is **refused**: no ticket, no placeholder, no
account created. The refusal is recorded, and the operators in *Unknown-sender alert
recipients* are notified.

**How mooDesk remembers what it has read.** Each processed message is tagged with an IMAP
keyword of mooDesk's own, so a person or another client opening the mailbox does not make the
poller skip anything. On a server that does not support custom keywords the poller falls back
to the standard *Seen* flag and says so in the task log — on such a server, a message read by
a human before the poll runs is never picked up. Messages are never deleted or moved.

### Outcomes

The task writes one summary line per run to the task log (*Site administration → Server →
Tasks → Task logs*), counting each outcome by name, and says when the per-run cap stopped it
short. Refusals also appear as operator alerts, and failures as incidents on
[System Health](./features#system-health).

| In the task log | Meaning |
|---|---|
| `ticket_created` | A ticket was opened |
| `reply_added` | A public reply was added to an existing ticket |
| `probe_confirmed` | The reply-address check came back; consumed, nothing created |
| `autoreply_skipped` | An automatic reply, dropped |
| `duplicate_skipped` | Inside the deduplication window, dropped |
| `already_processed` | Seen on an earlier run |
| `unknown_sender_rejected` | The sender is not an active Moodle user — operators alerted |
| `sender_unverified_rejected` | Sender authenticity is *Require* and the verdict was not a pass — operators alerted |
| `token_required` | Reply authentication is *Require token* and the reply carried none |
| `token_invalid` | A token that does not verify — refused in every mode |
| `token_sender_mismatch` | A valid token, but sent from an address that is not the user it was issued to |
| `unauthorised_rejected` | A reply from a user who may not write to that ticket — operators alerted, sender not told |
| `merged_rejected` | A reply to a ticket merged into another — the sender is told where to continue |
| `unprocessable` | A message that will never parse; set aside, incident raised |
| `error` | A transient failure on this message; retried on the next run |

### Provider notes

#### Gmail / Google Workspace

mooDesk connects with a username and password. On Gmail and Google Workspace that normally
means an **app password** tied to an account with **2-Step Verification** on — **when Google
and your organisation's administered policy allow app passwords**. Whether they are available
is decided by Google and by the Workspace administrator, not by mooDesk; where they are turned
off, the mailbox cannot be connected with 2.30.0. The account's ordinary Google password is
not a supported way to connect.

| Setting | Value |
|---|---|
| IMAP server hostname | `imap.gmail.com` |
| IMAP port | `993` |
| Use SSL/TLS | on |
| Mailbox username | the mailbox address |
| Mailbox password | the app password |

IMAP access must be enabled on the account. For sender authentication, Google Workspace is
the one provider profile mooDesk ships — see [Provider profiles](#provider-profiles).

#### Microsoft 365 / Exchange Online — not supported for email ingestion in 2.30.0

Exchange Online requires an authentication mechanism that mooDesk 2.30.0's IMAP client does
not implement: mooDesk authenticates with `LOGIN` only and has no `XOAUTH2` support. A
Microsoft 365 mailbox therefore cannot be polled by this version. Use a Google Workspace
mailbox or an IMAP server of your own. This is a limitation of the email ingestion channel,
not of running mooDesk alongside Microsoft 365 in general.

#### Other IMAP servers

Any server that accepts `LOGIN` over implicit TLS works. Two things to check:

- **Custom keywords.** If the server accepts them on the polled folder, the mailbox can be
  read by people without affecting the poll. If not, the fallback described above applies and
  the mailbox must be left alone.
- **Sub-addressing** (`support+anything@…` delivered to `support@…`), if you intend to use
  [Replying by email](#replying-by-email).

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
ticket. Deliveries are queued and retried, signed when you set a secret, and logged.

### Create a webhook

**mooDesk → Webhooks** (`managewebhooks`). *Add webhook* asks for a **name**, the **URL**, an
optional **signing secret**, **Active**, and the **events** to subscribe to (at least one).
Once saved, **Send test ping** posts a `test.ping` payload to the URL right away and shows the
HTTP status it got back; the recent deliveries of each webhook are listed with event, time,
HTTP status and outcome.

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

**Assignment changes do not raise a webhook in 2.30.0.** Watch `ticket.updated` for the
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
- `X-Signature-256` is present only when the webhook has a **secret**. Without one there is no
  signature, and nothing about the request proves it came from mooDesk — set a secret for any
  endpoint that acts on what it receives.
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

## Not supported in 2.30.0

| | Status |
|---|---|
| OAuth2 / `XOAUTH2` for IMAP — and therefore Microsoft 365 / Exchange Online mailboxes | Not implemented |
| STARTTLS on IMAP | Not implemented; use implicit TLS on 993 |
| POP3 | Not implemented |
| Sender-authentication profiles other than Gmail / Google Workspace | Only *Other mail server* with the operator's assertion |
| Automatic account creation for unknown senders | By design: mail from an address with no active Moodle account is refused |
| A webhook on assignment | No `ticket.assigned` event; see [Events](#events-and-payload) |
| Following redirects, or skipping TLS verification, on webhook deliveries | Not available |

---

*Verified against mooDesk 2.30.0.*
