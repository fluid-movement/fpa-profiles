---
title: Paginate the player list
kind: code
---

Add pagination to the player list.

- Place the pagination between the search box and the list.
- Use the shadcn-svelte Pagination component.
- Add a page size selector next to the pagination, using the shadcn-svelte RadioGroup component. The options are 20, 50 and 100; the default is 20.
- Pagination applies to the list after the live player filter, so the page count follows the filtered results.
- The current page resets to 1 when the filter text or the page size changes.

## Open questions
