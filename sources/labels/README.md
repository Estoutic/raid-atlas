# Interior labels, version 0.9

- Runtime: app/web/floor-labels.js; input: catalog maps.labels, maps.locks, task objective.requiredKeys and positions/zones. Original sources: https://tarkov.dev/api and https://github.com/the-hideout/tarkov.dev (map config).
- Source door coordinates are not shifted. Label placement avoids collisions and uses leader lines. Room labels are entrance labels, not surveyed room boundaries.
- Same room numbers remain separate by door/key ID, building and floor. Numbers embedded in street addresses do not become room numbers.
- A goal matches only a required key of that objective, on the same catalog floor, within 22 world units of its position. Multiple candidate keys are presented as an entrance rather than asserting the destination room. No generic nearest-room association is used.
- Public examples checked: https://tarkov.dev/item/dorm-room-303-key and https://escapefromtarkov.fandom.com/wiki/Golden_Swag (303, three-storey dorm); https://escapefromtarkov.fandom.com/wiki/Health_Resort_west_wing_room_306_key (Health Care Privacy Part 2). Local objective/key records agree for these examples. The complete task behavior was not verified in game.
- No complete room-number inventory is available in the bundled SVGs. Unsupported numbers remain unlabelled. Source quest outlines are used for highlighting; point objectives receive a halo, not a fabricated room polygon.
