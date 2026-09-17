---
title: API
description: The mooDesk REST API — site prerequisites, API tokens and scopes, how a request is authorised and rate-limited, the error envelope, and the reference for every function on tickets, merges, webhooks and the knowledge base.
---

# API <Badge type="warning" text="Enterprise" />

mooDesk exposes a REST API for reading and writing tickets, managing outbound webhooks and
working with the knowledge base from another system. It is delivered through **Moodle's
own web services**: there is no separate server, no separate authentication path and no
separate URL scheme.

| | |
|---|---|
| **Edition** | Enterprise. On Starter and Pro every call is refused with `featurenotavailable` before any work happens. |
| **Transport** | Moodle's REST server, `/webservice/rest/server.php`, JSON or XML |
| **Service** | `moodesk_api` (shown as *mooDesk API* in Moodle's web services administration) |
| **Authentication** | A Moodle web service token bound to `moodesk_api`, issued from mooDesk's **API tokens** page |
| **Functions** | 21 — 6 for tickets, 2 for merges, 5 for webhooks, 8 for the knowledge base |
| **Authorisation** | Edition → rate limit → the owner's Moodle capabilities → the token's scopes |
| **Rate limit** | Per token, 300 requests per 60 seconds by default, HTTP 429 when exceeded |

The settings that govern tokens and the rate limit are in
[Configuration → API access](./configuration#api-access); the webhook *deliveries* the API
lets you configure are described in [Integrations → Webhooks](./integrations#webhooks);
web-service prerequisites at install time are in [Installation](./installation#system-requirements).
This page does not repeat them.

## Before you start

Four things have to be true before the first call succeeds. The first is mooDesk's; the other
three are Moodle's, and mooDesk cannot switch them on for you.

| Where | Requirement | Symptom when missing |
|---|---|---|
| **mooDesk** | The active edition is **Enterprise** ([License](./configuration#license)). The *API access* settings section and the token page's *Generate* form only appear on Enterprise. | `featurenotavailable` |
| **Moodle** | **Web services are enabled** — *Site administration → Server → Web services → Overview*. | `accessexception` — *Web services are not enabled in Advanced features* |
| **Moodle** | The **REST protocol is enabled** — *… → Web services → Manage protocols*. | Moodle refuses the request before it reaches the plugin |
| **Moodle** | The token's owner holds **`webservice/rest:use`** at system context. Moodle core declares this capability with **no role archetype**, so no role has it until an administrator grants it — not even *Manager*. | `accessexception` — *You are not allowed to use the rest protocol (missing capability: webservice/rest:use)* |

The token's owner must also be a normal, active Moodle account: Moodle rejects tokens of
deleted, suspended or unconfirmed users, and of users whose authentication method is *No login*.

The service is **capability-driven**, not user-list driven: there is no *authorised users*
list to maintain in Moodle's web services administration. Whoever holds a valid token for
`moodesk_api` can call the functions their capabilities allow, narrowed by the token's scopes.

::: tip A dedicated integration user
Because a token acts as its owner, the cleanest setup is one Moodle user per integration,
in a role that carries `webservice/rest:use` plus exactly the mooDesk capabilities the
integration needs (the capability table is in
[Installation → Capabilities](./installation#roles-and-capabilities)). The token then cannot do more
than that role, whatever scopes it was given.
:::

Cron is not needed for the API itself. It is needed for the webhooks the API can create, since
deliveries are drained by a scheduled task — see [Integrations](./integrations#webhooks).

## Tokens

### Issuing a token

Tokens are issued from **mooDesk → API tokens** (`/local/moodesk/api_tokens.php`, in the
*Administration* group of mooDesk's sidebar; also listed under *Site administration → Plugins
→ Local plugins → API Tokens*). Opening the page needs `local/moodesk:useapi`, which the
*Manager* archetype holds by default.

To generate a token, give it a **label** and tick at least one **scope**. The page refuses to
issue a token with no scopes, because such a token would be unable to call anything.

| Fact | Value |
|---|---|
| Where the secret lives | Moodle's own `external_tokens` table. mooDesk keeps only a companion record — label, scopes, owner — and never a copy of the secret. |
| Shown | **Once**, on the page that follows generation. It cannot be retrieved again; if it is lost, revoke it and issue another. |
| Acts as | The Moodle user it was issued for, with that user's capabilities. A token can never do more than its owner. |
| Lifetime | `api_token_lifetime_days` from the token's creation, 365 days by default; `0` means it never expires. Set in [Configuration → API access](./configuration#api-access). |
| Live tokens per user | At most **5** for this service. A sixth is refused (`api_token_limit_reached`) until one is revoked. |
| Listed on the page | Label, scopes, created, **last used** and **expires**, read live from Moodle's token record. |
| Revoke | Deletes the Moodle token and the companion record in one transaction. The integration loses access immediately; there is no grace period. |

### Who may issue and manage tokens

A token acts as its owner, so minting one for somebody else is an act of impersonation, not
of configuration. The authorities are separate:

| Action | Requires |
|---|---|
| Create, list and revoke **your own** tokens | `local/moodesk:useapi` |
| Do the same for **another user's** tokens | `local/moodesk:useapi` **and** `moodle/webservice:managealltokens` |
| Issue a token that acts as a **site administrator** | Being a site administrator |

`moodle/webservice:managealltokens` is a core Moodle capability that ships assigned to no role
at all. Without it the page is strictly self-service: the *User ID* field is not shown, the list
contains only the viewer's own tokens, and revoking a token that belongs to somebody else
answers `api_token_not_found` — the same as a token that does not exist — so the page cannot be
used to discover who holds one.

::: warning Upgrading from 2.21.0 or earlier
Before 2.23.0, any holder of `local/moodesk:useapi` could issue a token bound to any account
and could list and revoke every token on the site. The upgrade leaves existing tokens
untouched. Review them once: sign in as a site administrator, open **API tokens** and revoke any
token whose owner and purpose you cannot account for. See
[Installation → Upgrading](./installation#upgrading).
:::

### Scopes

A token carries one or more of seven scopes. A scope only ever **narrows** a token; it never
grants anything the owner's capabilities do not already allow.

| Scope | Functions |
|---|---|
| `tickets:read` | `list_tickets`, `get_ticket` |
| `tickets:write` | `create_ticket`, `reply_ticket`, `transition_status`, `assign_ticket`, `merge_ticket`, `revert_merge` |
| `webhooks:read` | `list_webhooks`, `get_webhook` |
| `webhooks:write` | `create_webhook`, `update_webhook`, `delete_webhook` |
| `kb:read` | `list_kb_articles`, `get_kb_article` |
| `kb:write` | `create_kb_article`, `update_kb_article`, `transition_kb_article`, `delete_kb_article`, `add_kb_translation` |
| `kb:analytics` | `get_kb_analytics` — deliberately **not** part of `kb:read`, so a token that syncs content cannot read behaviour metrics |

A call from a token that lacks the function's scope is refused with `api_scope_denied`, after
the capability check has already passed.

### Tokens created in Moodle's own token administration

Moodle's *Site administration → Server → Web services → Manage tokens* can also create a token
for the `moodesk_api` service. Such a token has no mooDesk companion record, and the two paths
are not equivalent:

- It carries **no scopes**, so no scope restriction applies to it — the owner's capabilities
  alone decide what it can do.
- It **is rate-limited** like any other token: the limit is counted per Moodle token, whether or
  not mooDesk issued it.
- It does not appear on mooDesk's API tokens page and cannot be revoked from there.

This is not the supported way to give an integration access. Issue tokens from mooDesk's page,
and use Moodle's token administration to review or delete them (the page links to it as
*External services admin*).

## Making a request

Every call is an HTTP request to Moodle's REST server with three fixed parameters and the
function's own parameters as form fields. `POST` is recommended; Moodle's REST server also
accepts the same parameters on a `GET` query string.

```bash
curl -X POST "https://moodle.example.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=local_moodesk_list_tickets" \
  -d "moodlewsrestformat=json" \
  -d "limit=10" \
  -d "offset=0"
```

| Parameter | Value |
|---|---|
| `wstoken` | The token, exactly as shown once at generation |
| `wsfunction` | The function name, always prefixed `local_moodesk_` |
| `moodlewsrestformat` | `json` or `xml`. **Moodle defaults to XML** when the parameter is absent; send `json` explicitly. |

Function parameters follow Moodle's REST conventions: scalars as plain fields, lists as indexed
fields (`events[0]=ticket.created&events[1]=ticket.replied`), optional parameters simply
omitted. Parameter names are case-sensitive.

A successful call answers **HTTP 200** with the function's return value as the body:

```json
[
  {
    "id": 12,
    "subject": "Cannot log in",
    "status": 1,
    "priority": 1,
    "categoryid": 3,
    "departmentid": null,
    "requesterid": 42,
    "assigneeid": null,
    "timecreated": 1780000000,
    "timemodified": 1780000000
  }
]
```

Timestamps are Unix seconds. IDs are Moodle's own: `requesterid`, `assigneeid` and `authorid`
are Moodle user IDs; `categoryid` and `departmentid` are the IDs shown in mooDesk's
category and department administration.

## How a call is authorised

Every function runs the same four checks, server-side, in this order. The first failure ends
the call.

| # | Gate | Refused with |
|---|---|---|
| 1 | **Edition** — the site is Enterprise (`api_access`) | `featurenotavailable` |
| 2 | **Rate limit** — the token is within its request budget | `api_rate_limited`, HTTP 429 |
| 3 | **Capability** — the token's owner holds the function's capability (table per function below). Some functions accept either of two capabilities. | `nopermissions` (a `required_capability_exception`) |
| 4 | **Scope** — the token carries the function's scope | `api_scope_denied` |

The order is deliberate. A non-Enterprise site has no API to protect, so it learns nothing
about capabilities; an over-budget caller is refused before the server does any work on its
behalf; and the capability check runs before the scope check because scopes only narrow —
capabilities remain authoritative.

The capability is the **same** one the web interface checks for the equivalent action, and the
service layer applies the same row-level rules afterwards: a requester's token sees only that
requester's tickets, a knowledge base reader's token sees only what that reader could open in
the browser. A token whose owner holds `local/moodesk:viewall` sees every ticket on the site;
the department views of the web interface do not narrow the API.

## Rate limiting

Requests are counted **per token** — not per site, which would let one noisy integration
throttle every other, and not per IP, which is both too coarse and trivial to sidestep.

| | Default | Setting |
|---|---|---|
| Requests per window | 300 | `api_rate_limit` — `0` disables limiting |
| Window length | 60 seconds | `api_rate_window` |

Both are in [Configuration → API access](./configuration#api-access). A site that has never
saved the settings page is on the defaults, not unlimited.

The algorithm is a **fixed window** on absolute boundaries: the clock is divided into windows of
the configured length and every token gets a fresh allowance when a window ends. A client can
therefore spend a full allowance at the end of one window and another at the start of the next;
sustained throughput is still bounded by the limit.

Every response to a token-authenticated call carries the current state:

| Header | Meaning |
|---|---|
| `RateLimit-Limit` | Requests allowed per window |
| `RateLimit-Remaining` | Requests left in the current window |
| `RateLimit-Reset` | Seconds until the current window ends |

A request over the budget is refused:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 37
RateLimit-Limit: 300
RateLimit-Remaining: 0
RateLimit-Reset: 37
```

with the usual error envelope in the body, `errorcode` `api_rate_limited`. `Retry-After` is the
distance to the end of the current window, not a whole window.

::: warning Several web nodes
Counters live in Moodle's application cache (MUC). On a site with more than one web server they
are shared only if the application cache is on a shared store such as Redis; with the default
file store each node counts on its own, and the effective limit is the configured limit
multiplied by the number of nodes.
:::

## Errors

Errors use Moodle's standard REST envelope, and — with the single exception of the rate limit —
Moodle answers them with **HTTP 200**. Check the body, not the status code:

```json
{
  "exception": "moodle_exception",
  "errorcode": "api_scope_denied",
  "message": "This API token does not have the required scope: tickets:write."
}
```

`debuginfo` is added only when Moodle debugging is on. Codes you will meet, by origin:

| Code | Origin | Meaning |
|---|---|---|
| `invalidtoken` | Moodle | Unknown token |
| `accessexception` | Moodle | Web services disabled, token expired, IP-restricted, or the owner lacks `webservice/rest:use` — the message says which |
| `invalidparameter` | Moodle | A parameter is missing, has the wrong type, or is out of range |
| `featurenotavailable` | mooDesk | The site is not Enterprise |
| `api_rate_limited` | mooDesk | Over the token's budget — the one error sent as HTTP 429 |
| `nopermissions` | Moodle / mooDesk | The owner lacks the function's capability, or may not see the row (`required_capability_exception`) |
| `api_scope_denied` | mooDesk | The token lacks the function's scope |
| `ticketnotfound`, `webhook_not_found`, `kb_article_notfound`, `merge_audit_not_found` | mooDesk | Unknown ID |
| `invalidstatustransition`, `invalidassignee`, `assigneenotindepartment`, `invalidpriority`, `nocategoryavailable`, `ticket_locked_by_merge` | mooDesk | Ticket rules, listed with the function below |
| `merge_*`, `revert_merge_*` | mooDesk | Merge rules, listed under [Merges](#merges) |
| `invalidurl`, `webhook_events_required`, `webhook_invalid_event` | mooDesk | Webhook validation |
| `kb_*` | mooDesk | Knowledge base rules, listed under [Knowledge base](#knowledge-base) |

## Reference

All functions are called as `local_moodesk_<name>`. *Capability* is what the token's owner must
hold; where two are listed, either is enough. Every function additionally passes the edition
gate and the rate limit.

### Tickets

| Function | Scope | Capability | Does |
|---|---|---|---|
| `list_tickets` | `tickets:read` | `viewall` or `viewown` | Lists tickets the owner may see, newest first |
| `get_ticket` | `tickets:read` | `viewall` or `viewown` | One ticket with its reply thread |
| `create_ticket` | `tickets:write` | `submit` | Opens a ticket **as the token's owner** |
| `reply_ticket` | `tickets:write` | `reply` or `viewown` | Adds a public reply |
| `transition_status` | `tickets:write` | `manage` | Changes the status |
| `assign_ticket` | `tickets:write` | `manage` | Assigns or unassigns |

**Ticket summary** — returned by `list_tickets` (as a list), `create_ticket`,
`transition_status` and `assign_ticket`, and as `ticket` inside `get_ticket`:

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `subject` | string | |
| `status` | int | `0` new · `1` open · `2` pending · `3` on hold (legacy; no new ticket receives it) · `4` resolved · `5` closed · `6` in progress |
| `priority` | int | `0` low · `1` normal · `2` high · `3` urgent |
| `categoryid` | int or null | |
| `departmentid` | int or null | |
| `requesterid` | int | The requester's Moodle user ID |
| `assigneeid` | int or null | |
| `timecreated`, `timemodified` | int | |

The summary is deliberately small. Custom fields, the team, the course, SLA state, CSAT and the
merge status are not in it — see [Not in the API](#not-in-the-api).

#### `list_tickets`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `limit` | int | 25 | Clamped to 1–100 |
| `offset` | int | 0 | 0-based row offset; a negative value reads as 0 |

Returns a list of ticket summaries, newest first. An owner with `viewall` gets every ticket on
the site; one with `viewown` only gets their own. There are **no filters** — status, category,
assignee and free text cannot be narrowed server-side. Walk pages with `offset += limit`; an
offset past the end returns an empty list.

::: info Before 2.30.0
`limit` and `offset` were declared but not honoured: the offset was rounded down to a page of 30
rows and the whole page came back. Since 2.30.0 the two are a plain row window.
:::

#### `get_ticket`

| Parameter | Type | Notes |
|---|---|---|
| `ticketid` | int | |

Returns `{ ticket, replies[] }`. Each reply is:

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `authorid` | int | Moodle user ID |
| `message` | string | HTML as stored |
| `type` | int | `0` public reply · `1` internal note · `2` system event |
| `timecreated` | int | |

**Which replies come back depends on the owner, not on the token.** An owner with `viewall`
receives the whole thread, internal notes included; a requester receives public replies and
system events on their own tickets only. A requester asking for somebody else's ticket is
refused with `nopermissions`. Replies that live on tickets merged *into* this one are not
included — the web interface shows them, the API does not.

Errors: `ticketnotfound`, `nopermissions`.

#### `create_ticket`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `subject` | string | — | Required, trimmed to 255 characters |
| `description` | string | — | Required; HTML allowed |
| `priority` | int | 1 | Must be one of `0`–`3` |
| `categoryid` | int | 0 | `0` or an unknown/inactive category = the configured default category |
| `departmentid` | int | 0 | `0` or an unknown/inactive department = no department |

Returns the new ticket's summary. The requester is **always the token's owner**; there is no
parameter to open a ticket on behalf of another user. The ticket starts in status *open* with no
assignee, and the description becomes its first message. Automations, notifications and
webhooks fire exactly as for a ticket created in the browser.

Errors: `missingparam` (empty subject or description), `invalidpriority`,
`nocategoryavailable` (no usable category, including no default — see
[Configuration → Categories](./configuration#categories)).

#### `reply_ticket`

| Parameter | Type | Notes |
|---|---|---|
| `ticketid` | int | |
| `message` | string | Required; HTML allowed |

Returns `{ replyid, ticketid, authorid }`. The reply is always **public** — internal notes
cannot be written through the API. An owner with `reply` may answer any ticket they can see; one
with only `viewown` may answer their own. Replying to a ticket that was merged away is refused.

Errors: `ticketnotfound`, `nopermissions`, `ticket_locked_by_merge`.

#### `transition_status`

| Parameter | Type | Notes |
|---|---|---|
| `ticketid` | int | |
| `status` | int | Target status code |

Returns the updated summary. The same state machine as the web interface applies; a step it
does not allow is `invalidstatustransition`. Sending the current status is a no-op that still
answers the summary.

Errors: `ticketnotfound`, `invalidstatustransition`, `ticket_locked_by_merge`.

#### `assign_ticket`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `ticketid` | int | — | |
| `assigneeid` | int | 0 | An agent's Moodle user ID; `0` unassigns |

Returns the updated summary. The assignee must be a mooDesk agent and, when the ticket belongs
to a department, a member of it.

Errors: `ticketnotfound`, `invalidassignee`, `assigneenotindepartment`,
`ticket_locked_by_merge`.

### Merges

| Function | Scope | Capability | Does |
|---|---|---|---|
| `merge_ticket` | `tickets:write` | `mergetickets` | Merges a duplicate into another ticket |
| `revert_merge` | `tickets:write` | `revertmerge` | Undoes a merge within its window |

The two capabilities are separate on purpose: undoing another agent's merge is a higher bar
than performing one. What a merge does to the two tickets is described in
[Features → Merging](./features#merging-duplicates).

#### `merge_ticket`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `sourceid` | int | — | The duplicate; it closes and becomes read-only |
| `targetid` | int | — | The ticket that survives |
| `reason` | string | `""` | Stored on the audit record |
| `confirmcrossrequester` | bool | false | **Required as `1` when the two tickets were raised by different people** |

Returns the merge record below. The API clears exactly the bars the confirmation screen
clears: Enterprise, the capability, visibility on both tickets, every pre-merge constraint, and
the cross-requester acknowledgement — merging across requesters makes each requester's replies
readable to whoever can see the other ticket, so it must be an explicit act.

Errors: `merge_same_ticket`, `merge_already_merged` (the source is already merged),
`merge_target_is_merged`, `merge_target_is_closed`, `merge_source_is_newer`,
`merge_cross_requester_required`, `merge_permission_insufficient`, `merge_target_invalid`.

#### `revert_merge`

| Parameter | Type | Notes |
|---|---|---|
| `auditid` | int | From the merge record |

Returns the same merge record, now with `revertedat` set. A merge can be undone for **30
days**; after that, or once undone, the call is refused whatever a previous response's
`revertable` said.

Errors: `merge_audit_not_found`, `revert_merge_already_reverted`, `revert_merge_ttl_expired`.

**Merge record** — returned by both functions:

| Field | Type | Notes |
|---|---|---|
| `auditid` | int | What `revert_merge` takes |
| `sourceid`, `targetid` | int | |
| `actorid` | int | The agent who merged |
| `mergedat` | int | |
| `reason` | string | Empty when none was given |
| `revertedat` | int or null | `null` while the merge stands |
| `revertable` | bool | Whether it can be undone right now |
| `replies`, `internalnotes`, `attachments`, `historyentries` | int | What the source carried and the target now reads across the link — nothing is copied |
| `conflicts` | string[] | Conflict keys the operator was shown before confirming, e.g. `cross_requester` |

### Webhooks

| Function | Scope | Capability | Does |
|---|---|---|---|
| `list_webhooks` | `webhooks:read` | `managewebhooks` | Lists every webhook |
| `get_webhook` | `webhooks:read` | `managewebhooks` | One webhook |
| `create_webhook` | `webhooks:write` | `managewebhooks` | Creates a subscription |
| `update_webhook` | `webhooks:write` | `managewebhooks` | Replaces a subscription's fields |
| `delete_webhook` | `webhooks:write` | `managewebhooks` | Deletes a subscription |

These manage the **subscriptions**. What a delivery looks like, how it is signed, the retry
schedule and the delivery log are in [Integrations → Webhooks](./integrations#webhooks); the
event names are the same six listed there.

**Webhook summary** — returned by every function except `delete_webhook`. The signing
**secret is write-only and never returned**:

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `name` | string | |
| `url` | string | |
| `events` | string[] | e.g. `["ticket.created", "ticket.replied"]` |
| `active` | int | `1` active, `0` paused |
| `timecreated`, `timemodified` | int | |

#### `list_webhooks`

No parameters. Returns a list of summaries.

#### `get_webhook`, `delete_webhook`

| Parameter | Type |
|---|---|
| `id` | int |

`get_webhook` returns the summary; `delete_webhook` returns `{ "success": true }`.
Error: `webhook_not_found`.

#### `create_webhook`, `update_webhook`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `id` | int | — | `update_webhook` only |
| `name` | string | — | Required |
| `url` | string | — | Required; must be a valid URL. Use HTTPS — see [Integrations](./integrations#webhooks) for what the endpoint must accept |
| `events` | string[] | — | At least one of the six event types |
| `secret` | string | `""` | Write-only |
| `active` | int | 1 | `1` active, `0` paused |

Both return the summary. `update_webhook` is a **full replacement**, not a patch: send every
field. In particular, **resend `secret` to keep it** — an omitted or empty secret on update
clears it, and deliveries go out unsigned from then on.

Errors: `missingparam` (empty name), `invalidurl`, `webhook_events_required`,
`webhook_invalid_event`, `webhook_not_found`.

### Knowledge base

| Function | Scope | Capability | Does |
|---|---|---|---|
| `list_kb_articles` | `kb:read` | `viewkb` | Lists the article rows the owner may see |
| `get_kb_article` | `kb:read` | `viewkb` | One row, with its body |
| `create_kb_article` | `kb:write` | `editkb` or `managekb` | Creates a draft |
| `update_kb_article` | `kb:write` | `editkb` or `managekb` | Changes title, body, category, audience or language |
| `transition_kb_article` | `kb:write` | `managekb` | Publishes, unpublishes, archives or restores |
| `delete_kb_article` | `kb:write` | `managekb` | Deletes one row |
| `add_kb_translation` | `kb:write` | `editkb` or `managekb` | Adds a translation as a new draft row <Badge type="tip" text="Pro feature" /> |
| `get_kb_analytics` | `kb:analytics` | `managekb` or `viewreports` | The analytics report over a date range <Badge type="tip" text="Pro feature" /> |

The knowledge base itself, its statuses, audiences and translations are described in
[Features → Knowledge base](./features#knowledge-base). Two things to hold on to when reading
the reference:

- **`id` is always a translation row**, never an article group. An article in three languages
  is three rows sharing one `groupid`. `get_kb_article` returns exactly the row asked for and
  never swaps in a sibling; a row the owner may not see is refused, not substituted.
- **Visibility follows the owner**, through the same policy as the pages. A requester's token
  sees published rows for everyone; an agent's also sees *Agents only* rows; an editor's or
  manager's sees drafts and archived rows too. The token's scopes cannot widen that.

Although the API is Enterprise, the two functions marked *Pro feature* sit on knowledge base
features that are themselves Pro (`kb_multilingual`, `kb_analytics`); an Enterprise site has
both.

**Article** — returned by `get_kb_article`, `create_kb_article`, `update_kb_article`,
`transition_kb_article` and `add_kb_translation`. `list_kb_articles` returns the same shape
with `excerpt` (first 200 characters as plain text) instead of `body`:

| Field | Type | Notes |
|---|---|---|
| `id` | int | Translation row ID |
| `groupid` | int | The group's canonical row ID |
| `lang` | string | Language code of this row |
| `title` | string | |
| `status` | int | `0` draft · `1` published · `2` archived |
| `audience` | int | `0` everyone · `1` agents only |
| `categoryid` | int or null | |
| `timecreated`, `timemodified` | int | |
| `timepublished` | int or null | First publication |
| `translations` | list of `{ id, lang, status }` | The rows of the group the owner may see, this one included |
| `body` | string | HTML as stored — `get` and the write functions |
| `excerpt` | string | `list` only |

Authorship (`createdby`, `usermodified`) is not exposed.

#### `list_kb_articles`

All parameters optional.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `status` | int | — | Honoured for editors and managers only; ignored for everyone else, whose visibility the policy decides |
| `categoryid` | int | — | `0` = uncategorised |
| `lang` | string | — | Exact row language |
| `q` | string | — | Free-text search, best match first |
| `resolve` | string | — | A language code: return **one row per group**, chosen for that language |
| `limit` | int | 25 | Clamped to 1–100 |
| `offset` | int | 0 | |

Without `resolve`, every visible row comes back, one line per translation. With
`resolve=es`, each group contributes the row the web interface would show to a reader whose
language is `es` — that language, its Moodle parent language, the site language, then the
canonical row. The session language of the token's owner is never consulted, so the answer
does not change with a profile setting.

#### `get_kb_article`, `delete_kb_article`

| Parameter | Type |
|---|---|
| `id` | int |

`get_kb_article` returns the article with its body; `delete_kb_article` returns
`{ "success": true }`. Deleting a row also removes its files, feedback votes, analytics and
search entry; the group survives on its other rows.
Errors: `kb_article_notfound`, `nopermissions`.

#### `create_kb_article`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `title` | string | — | Required |
| `body` | string | `""` | HTML |
| `categoryid` | int | 0 | `0` = none |
| `audience` | int | 0 | `0` everyone, `1` agents only |
| `lang` | string | `""` | The site language when empty or not an installed language pack |

Returns the new row, always a **draft**. Images referenced in `body` must already be
addressable by URL — there is no file upload through the API.

Errors: `kb_title_required`, `kb_invalid_category`, `kb_invalid_audience`.

#### `update_kb_article`

| Parameter | Type | Notes |
|---|---|---|
| `id` | int | Required |
| `title`, `body`, `categoryid`, `audience`, `lang` | as above | Each optional |

**Only the parameters sent are changed**; the rest are left alone. Send `categoryid=0` to clear
the category. Status is not a field here — use `transition_kb_article`. Category and audience
belong to the group and are written to every translation row; changing the audience of a
published article needs `managekb`, as in the web interface. `lang` is a Pro feature.

Errors: `kb_article_notfound`, `kb_title_required`, `kb_invalid_category`,
`kb_invalid_audience`, `kb_invalid_lang`, `nopermissions`.

#### `transition_kb_article`

| Parameter | Type | Notes |
|---|---|---|
| `id` | int | |
| `action` | string | `publish`, `unpublish`, `archive` or `restore` |

Returns the row after the change. The rules are the knowledge base's own: a step the status
machine does not allow is `kb_invalid_transition`, and a row with an empty body cannot be
published (`kb_body_required`). Any other `action` is `invalidparameter`.

#### `add_kb_translation`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `sourceid` | int | — | Any row of the group being translated |
| `lang` | string | — | An installed language the group does not have yet |
| `title` | string | — | Required |
| `body` | string | `""` | HTML |

Returns the new row, a draft in the same group. Category and audience are the group's; nothing
else is copied from the source.

Errors: `kb_article_notfound`, `kb_invalid_lang` (not an installed language pack),
`kb_translation_exists`, `kb_title_required`.

#### `get_kb_analytics`

All parameters optional.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `from` | int | — | Unix timestamp; the day it falls on. Defaults to 30 days before `to` |
| `to` | int | — | Unix timestamp; the day it falls on. Defaults to today; cannot be in the future |
| `lang` | string | — | Language filter |
| `categoryid` | int | 0 | `0` = all |
| `by` | string | `row` | `row` (per translation) or `group` (per article) |

The range is clamped to **90 days** ending at `to`, the same ceiling as the analytics page.
Returns the effective `from` and `to`, `by`, a `summary` and the five tables of the page:

| Key | Contents |
|---|---|
| `summary` | `views`, `votes`, `helpful`, `helpfulrate`, `searches`, `zeroresults`, `viewsbyday[]` (`day` at midnight, `views`) |
| `mostviewed[]`, `lowesthelpful[]` | Per article: `articleid` (by row) or `groupid` (by group; the other is `null`), `title`, `lang`, `categoryid`, `translations` (row count), `views`, `votes`, `helpful`, `helpfulrate` |
| `zeroresults[]` | `querynorm` (as stored — already redacted), `redacted`, `count`, `lastseen` |
| `deflection[]` | Same article fields plus `impressions`, `opens`, `openrate` |
| `bylanguage[]` | `lang`, `published`, `views`, `votes`, `helpful`, `helpfulrate` |

Rates are floats in `[0, 1]`, or `null` when there was nothing to divide.

## Functions that are not part of the API

Four more external functions exist in mooDesk, registered for the plugin's own pages
(`ajax => true`) and **not** included in the `moodesk_api` service:

| Function | Used by |
|---|---|
| `local_moodesk_search_active_tickets` | The merge target autocomplete |
| `local_moodesk_search_kb_articles` | Article suggestions on the New Ticket form |
| `local_moodesk_search_kb_for_reply` | The *Insert article* tool of the ticket composer |
| `local_moodesk_set_kb_feedback` | *Was this article helpful?* on an article page |

They are called with a browser session, not a token, and are gated on their own features
rather than on `api_access`. A token bound to `moodesk_api` cannot call them, and their
parameters and return values are not a public contract.

## Not in the API

What an integration might look for and will not find in 2.31.0. None of these has a
workaround inside the API.

| Wanted | Status |
|---|---|
| Filtering `list_tickets` by status, category, assignee, department or text | Not available — page through and filter client-side |
| Ticket fields beyond the summary: custom fields, team, course, SLA state, CSAT, merge status, the requester's name | Not returned |
| Changing a ticket's priority, category, department or team | Not available — only status and assignee can be changed |
| Opening a ticket on behalf of another user | Not available — the requester is always the token's owner |
| Internal notes, attachments (reading or adding) | Not available — replies are public and text-only |
| Replies of tickets merged into the requested one in `get_ticket` | Not included |
| A ticket's history, the delivery log of a webhook | Not available |
| Categories, departments, agents, teams, custom fields, automations, CSAT — listing or managing | Not available |
| File upload for knowledge base images | Not available — reference images by URL |
| Recording *Was this article helpful?* votes | Not available by design: no integration votes on a person's behalf |
| Bulk operations, ETags / conditional requests, webhooks about API activity | Not available |
| IP restriction on a token | Not available — mooDesk issues tokens without one, and Moodle's token administration cannot edit a token once it exists |
| OAuth, per-token expiry overrides, more than 5 live tokens per user | Not available |

---

*Verified against mooDesk 2.31.0.*
