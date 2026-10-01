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
