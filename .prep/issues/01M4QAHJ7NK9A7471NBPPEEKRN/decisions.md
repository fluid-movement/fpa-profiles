## D1: Paginate on the server, state in the URL
date: 2026-10-12

`findPlayers` slices by `page` and `size`, and both live in the URL like the other filters. Alternative: slice the full result on the client; rejected because the query already caps results and the URL state keeps back navigation working.
