# royaleapi
Created via CodexPro Cloud Server

Deck Meta search combines the site's current Top 10 with a dated
[RoyaleTrack deck snapshot](https://royaletrack.com/en/decks), including
Lava Hound and Balloon variants. Search metrics reflect the snapshot date,
not RoyaleAPI's live 1-day ranking. The RoyaleAPI button opens that separate
ranking for the matched card.

To refresh the search snapshot, run
`node scripts/refresh-deck-search.cjs`, update `deck-search-data.json` with
its output, and bump the snapshot URL version in `deck-search.js`.
Run `node --test` to verify.
