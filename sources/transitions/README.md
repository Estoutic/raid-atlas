# Named level transitions (0.6)

Runtime data: `app/web/floor-transitions.js`. Coordinates are in each published SVG's coordinate space, with floor IDs rather than numeric indices. The graph contains 8 Reserve links and 9 Ground Zero links, all bidirectional. These are manually reviewed approximations, not exported game navigation.

Evidence used:

- Bundled Shebuka/tarkov.dev `Reserve.svg` and `GroundZero.svg`, floor geometry and passage endpoints. https://github.com/the-hideout/tarkov-dev-svg-maps
- Bundled RE3MR atlases: Reserve building/bunker entrances and Ground Zero's five numbered underground entrances. Original image URLs are in `sources/render-assets.json`. https://reemr.se/
- Bundled tarkov.dev quest-zone outlines for the bunker hermetic doors, control room, Ground Zero office and mounted weapons. https://tarkov.dev/api
- Building entry and staircase descriptions: https://tarkov.help/en/quest/the-bunker-part-1 and https://tarkov.help/en/quest/shooting-cans
- TerraGroup lobby-to-office staircase: https://escapefromtarkov.fandom.com/wiki/Saving_the_Mole

Surface plans do not include every interior flight. A named edge therefore represents the transition through the indicated stairwell/building. Both landing nodes must already be open within 2 SVG units; no cells are painted open and no unrelated floors are connected by overlap. Dormant/blocked endpoints are rejected. Edge metadata is used for the ordered instructions and map arrows, with the same identity in either direction.

The normal path still uses the SVG grid. A quest zone may use a different reachable cell only inside its published polygon. This is necessary for a zone spanning two bunker doors: its center may be a wall. There is no unconstrained nearest-goal fallback.

Validation covers all endpoints, forward/reverse links, a complete seven-goal Reserve bunker tour returning to the surface, a separate path to D-2, and a Ground Zero route from underground through TerraGroup and both mounted-weapon buildings to extraction. Every normal route point remains an open grid cell and every cross-floor hop has registered metadata. No in-game traversal test was performed. Map-derived coordinates and annotations retain CC BY-NC-SA 4.0 attribution; model licensing is unchanged.
