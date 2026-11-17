const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync(require.resolve('../app/web/catalog.js'),'utf8');
const catalog=JSON.parse(text.slice(text.indexOf('{')).replace(/;\s*$/,''));
const corrections=require('../sources/exit-corrections.json');
const raw=require('../app/web/data/maps.json').data.maps;
const RA=require('../app/web/core.js');
const ground=catalog.maps.find(m=>m.id==='ground-zero');
test('Ground Zero keeps its six verified extracts and quarantines foreign-map records',()=>{
 const excluded=Object.keys(corrections.excluded['ground-zero']);
 assert.equal(ground.extracts.length,6);assert.ok(ground.extracts.every(e=>!excluded.includes(e.id)));
 const high=Object.values(raw).find(m=>m.normalizedName==='ground-zero-21');
 const base=Object.values(raw).find(m=>m.normalizedName==='ground-zero');
 assert.deepEqual(ground.extracts.map(e=>base.extracts.find(x=>x.id===e.id).name).sort(),high.extracts.map(e=>e.name).sort());
 for(const e of ground.extracts){const p=RA.mapPoint(ground,e.position);assert.ok(p.every((x,i)=>x>=0&&x<=ground.viewBox[i+2]));}
 assert.equal(base.extracts.length,9,'raw evidence must remain untouched');
});
test('Path to River uses the reviewed image anchor without altering world coordinates',()=>{
 const map=catalog.maps.find(m=>m.id==='interchange'),id='1e65f8bedbd9322074ae387892f0972883bdb794';
 const ex=map.extracts.find(e=>e.id===id),original=Object.values(raw).find(m=>m.normalizedName==='interchange').extracts.find(e=>e.id===id);
 assert.deepEqual(ex.position,original.position);assert.deepEqual(ex.outline,original.outline);
 assert.deepEqual(ex.overviewAnchor,{file:'interchange-web-render.jpg',point:[25,746]});
 assert.ok(RA.mapPoint(map,ex.position)[0]<0,'regression requires a real off-SVG extract');
});
const app=fs.readFileSync(require.resolve('../app/web/app.js'),'utf8');
const prelude=app.slice(0,app.indexOf('// Preserve saved floor selections'));
function migrate(saved){return vm.runInNewContext(prelude+'\nsaved;', {CATALOG:catalog,localStorage:{getItem:()=>JSON.stringify(saved)}});}
test('Legacy exit selections migrate by identity; foreign selections clear safely',()=>{
 for(const [index,id]of ground.legacyExitIds.entries()){
  const result=migrate({schema:2,exit:{'ground-zero':String(index),customs:'4'}});
  const newIndex=ground.extracts.findIndex(e=>e.id===id);
  assert.equal(result.exit['ground-zero'],newIndex<0?'':String(newIndex));assert.equal(result.exit.customs,'4');
 }
 assert.equal(migrate({exit:{'ground-zero':''}}).exit['ground-zero'],'');
 assert.equal(migrate({exitIndexVersion:1,exit:{'ground-zero':'4'}}).exit['ground-zero'],'4');
 assert.ok(migrate({}));
});
