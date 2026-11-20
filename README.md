# royaleapi
Created via CodexPro Cloud Server

Deck Meta search combines the site's current Top 10 with a dated
[RoyaleTrack deck snapshot](https://royaletrack.com/en/decks), including
Lava Hound and Balloon variants. Search metrics reflect the snapshot date.

Autocomplete suggests up to three cards from the complete base-card roster,
including Tower Troops. Evolution and Hero forms are grouped by their base card.
To update card names, run `node scripts/refresh-card-catalog.cjs`, replace
`card-catalog.js` with its output, and bump its script version in `index.html`.

To refresh the search snapshot, run
`node scripts/refresh-deck-search.cjs`, update `deck-search-data.json` with
its output, and bump the snapshot URL version in `deck-search.js`.
Run `node --test` to verify.
