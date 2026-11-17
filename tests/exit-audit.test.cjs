const test=require('node:test'),assert=require('node:assert/strict');
const {environment,audit}=require('../checks/exit-audit.cjs');
const reviewed=require('../sources/exit-membership-review.json');
const raw=Object.values(require('../app/web/data/maps.json').data.maps);
test('Every reviewed map exit has a finite in-image anchor, including both Customs images and manual maps',()=>{
 for(const row of audit().rows)for(const e of row.exits){assert.ok(e.anchor,`${row.map}: ${e.name} missing`);assert.equal(e.anchor.length,2);assert.ok(e.anchor.every((x,i)=>Number.isFinite(x)&&x>=0&&x<=row.size[i]),`${row.map}: ${e.name} outside image`);}
});
test('Reviewed map membership is explicit and all world coordinates remain original',()=>{
 const c=environment();for(const map of c.CATALOG.maps){
  assert.deepEqual(Array.from(map.extracts,e=>e.id).sort(),reviewed.maps[map.id].ids.slice().sort(),map.id+' requires a new membership review');
  const original=raw.find(m=>m.normalizedName===map.id);
  for(const e of map.extracts){const o=original.extracts.find(x=>x.id===e.id&&x.faction===e.faction);assert.deepEqual(JSON.parse(JSON.stringify(e.position)),o.position);assert.deepEqual(JSON.parse(JSON.stringify(e.outline)),o.outline);}
 }
});
test('No unexplained exact coordinate duplicates leak across different map catalogs',()=>{
 const maps=environment().CATALOG.maps;
 for(let i=0;i<maps.length;i++)for(let j=i+1;j<maps.length;j++)for(const a of maps[i].extracts)for(const b of maps[j].extracts)assert.notEqual(JSON.stringify(a.position),JSON.stringify(b.position),maps[i].id+' / '+maps[j].id+': cross-map clone');
});
test('Reviewed image overrides never leak to floor plans; image switches restore their own anchor',()=>{
 const c=environment();c.state={map:'customs',floor:1};const e=c.m().extracts.find(e=>e.overviewAnchors?.length>1);const originalConfig=c.mapViewer.config;
 c.mapViewer.style='classic';c.prepareImageAnchors();const a=c.mapViewer.config().anchors[e.id].slice();
 c.mapViewer.style='realistic';c.prepareImageAnchors();const b=c.mapViewer.config().anchors[e.id].slice();assert.notDeepEqual(a,b);
 c.mapViewer.style='classic';c.prepareImageAnchors();assert.deepEqual(c.mapViewer.config().anchors[e.id],a);
 const floor={floorPlan:true,anchors:{},projection:{source:[],target:[],triangles:[],affine:[[1,0],[0,1],[0,0]]}};
 c.FloorMaps={get:()=>floor};c.mapViewer.config=()=>floor;c.exitFloor=()=>1;c.prepareImageAnchors();assert.deepEqual(Array.from(floor.anchors[e.id]),c.RA.mapPoint(c.m(),e.position));
 c.state.floor=0;c.prepareImageAnchors();assert.equal(Object.keys(floor.anchors).length,0);
 c.mapViewer.config=originalConfig;
});
test('Manual-map markers work without inventing a world projection',()=>{
 const c=environment();for(const id of ['the-labyrinth','icebreaker']){c.state={map:id,floor:0};assert.equal(c.imageProjection(),undefined);c.prepareImageAnchors();assert.equal(Object.keys(c.mapViewer.config().anchors).length,c.m().extracts.length);assert.equal(c.m().routing,false);}
});
