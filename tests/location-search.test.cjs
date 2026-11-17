const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');global.RA=require('../app/web/core.js');global.FloorLabelData=require('../app/web/floor-labels.js');const {matches,index}=require('../app/web/location-search.js');
const raw=fs.readFileSync(require.resolve('../app/web/catalog.js'),'utf8'),catalog=JSON.parse(raw.slice(raw.indexOf('{')).replace(/;\s*$/,'')),entries=index(catalog);
test('306 west wing query finds only the correct Shoreline door and floor',()=>{
 const found=entries.filter(e=>matches('306 западное крыло',e.search));assert.equal(found.length,1);assert.equal(found[0].map,'shoreline');assert.equal(found[0].floor,3);assert.match(found[0].subtitle,/западное/);
});
test('room numbers use exact numeric matches and wing spelling is normalized',()=>{
 assert.equal(matches('30','Комната 306'),false);assert.equal(matches('306 восточное','Ключ от номера 306 восточного крыла'),true);assert.equal(matches('306 западное','Ключ от номера 306 восточного крыла'),false);
});
test('building search uses Russian labels and keeps original shop names',()=>{
 assert.ok(entries.some(e=>e.kind==='building'&&matches('западное крыло',e.search)));assert.ok(entries.some(e=>e.kind==='building'&&matches('Techlight',e.search)&&e.map==='interchange'&&e.floor===2));
});
