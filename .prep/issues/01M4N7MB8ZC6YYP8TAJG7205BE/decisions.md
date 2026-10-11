## D1: Username plugin, placeholder in the required email column
date: 2026-10-11

Better Auth's core schema marks `user.email` as required and unique (`@better-auth/core` `get-tables`), and it cannot be made optional without forking Better Auth; rolling our own auth is ruled out. So editors sign in through the official `username` plugin, and the users script stores `<username>@editors.invalid` in the email column: unique, undeliverable by RFC 2606, never shown or asked for. No accounts existed, so nothing was migrated.
