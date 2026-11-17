const test=require('node:test'),assert=require('node:assert/strict');
const {Grid}=require('../app/web/core.js'),T=require('../app/web/floor-transitions.js');
const map={id:'test',floors:[['lower'],['upper']]},entry={id:'stairs',name:'Named stairs',a:['lower',3.5,3.5],b:['upper',6.5,3.5]};
test('only registered stairs connect floors, in both directions',async()=>{
 const g=new Grid(10,8,1,[new Uint8Array(80).fill(1),new Uint8Array(80).fill(1)]);assert.equal(await g.path(0,159),null);const before=g.masks.map(a=>Array.from(a));T.attach(g,map,[entry]);const route=await g.path(0,159),back=await g.path(159,0);assert(route&&back);assert.equal(g.links.size,2);assert.deepEqual(g.masks.map(a=>Array.from(a)),before);
 const changes=route.path.slice(1).map((n,i)=>[route.path[i],n]).filter(([a,b])=>g.xyz(a)[2]!==g.xyz(b)[2]);assert.equal(changes.length,1);assert.equal(T.describe(g,...changes[0].map(n=>g.xyz(n))).id,'stairs');assert.equal(T.describe(g,...changes[0].reverse().map(n=>g.xyz(n))).id,'stairs');
});
test('blocked or missing landing never opens a wall or attaches a stair',()=>{
 const g=new Grid(10,8,1,[new Uint8Array(80).fill(1),new Uint8Array(80)]);T.attach(g,map,[entry,{...entry,id:'missing',b:['nonexistent',3,3]}]);assert.equal(g.links.size,0);assert(g.transitionAudit.every(t=>!t.valid));assert(g.masks[1].every(x=>x===0));
});
test('quest-zone landing must be in the zone and on a reachable floor',async()=>{
 const g=new Grid(10,8,1,[new Uint8Array(80).fill(1),new Uint8Array(80).fill(1)]);const polygon=[[1,1],[8,1],[8,7],[1,7]];let reach=await g.reachable(0);assert.equal(g.region(polygon,1,reach,[4,4]),-1);T.attach(g,map,[entry]);reach=await g.reachable(0);assert(g.region(polygon,1,reach,[4,4])>=80);
});
