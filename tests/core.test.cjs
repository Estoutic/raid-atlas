const test=require('node:test'),assert=require('node:assert/strict');
const {Grid,optimize,packing,normalize,mapPoint}=require('../app/web/core.js');
const grid=(rows)=>new Grid(rows[0].length,rows.length,1,[Uint8Array.from(rows.join('').split('').map(c=>c==='.'?1:0))]);
test('route goes around a wall and never cuts corners',async()=>{let g=grid(['...#...','...#...','...#...','.......']);let r=await g.path(0,6);assert(r);assert(r.distance>6);for(let n of r.path)assert(g.open(n));for(let i=1;i<r.path.length;i++){let a=r.path[i-1],b=r.path[i],d=b-a;if(Math.abs(d)===g.w+1||Math.abs(d)===g.w-1){let dx=b%g.w-a%g.w;assert(g.open(a+dx));assert(g.open(b-dx));}}});
test('disconnected required stop is never silently dropped',()=>assert.equal(optimize([[0,1,Infinity,3],[1,0,Infinity,2],[Infinity,Infinity,0,1],[3,2,1,0]],2),null));
test('cross-floor route requires an explicit stair connection',async()=>{let g=new Grid(3,1,1,[new Uint8Array(3).fill(1),new Uint8Array(3).fill(1)]);assert.equal(await g.path(0,5),null);g.links.set(1,[4]);g.links.set(4,[1]);assert(await g.path(0,5));});
test('corner contact is not treated as a passage',async()=>assert.equal(await grid(['.#','#.']).path(0,3),null));
test('risk penalty can choose a longer geometric route',async()=>{let g=grid(['.......','.......','.......']);g.risk=new Float32Array(21);for(let i=9;i<=11;i++)g.risk[i]=8;let r=await g.path(7,13);assert(r);assert(!r.path.includes(10));});
test('all tour stops honored, dependency can override shortest ordering',()=>{let mat=[[0,1,8,30],[1,0,1,1],[8,1,0,8],[30,1,8,0]];assert.deepEqual(optimize(mat,2,[[],[0]]).order,[0,1]);});
test('exact solver agrees with exhaustive search for asymmetric costs',()=>{let n=5,mat=Array.from({length:n+2},(_,i)=>Array.from({length:n+2},(_,j)=>i===j?0:1+((i*17+j*31)%23)));function perm(a){return a.length?a.flatMap((x,i)=>perm(a.filter((_,j)=>j!==i)).map(p=>[x,...p])):[[]];}let min=Infinity;for(let p of perm([0,1,2,3,4])){let route=[0,...p.map(i=>i+1),n+1],v=0;for(let i=1;i<route.length;i++)v+=mat[route[i-1]][route[i]];min=Math.min(min,v);}assert.equal(optimize(mat,n).cost,min);});
const key={id:'key1',name:'Ключ'},marker={id:'marker',name:'Маячок'};
test('packing sums consumables, preserves alternate keys and ignores finished stages',()=>{let t={name:'A',objectives:[{id:'a',maps:['factory'],type:'mark',count:2,markerItem:marker,requiredKeys:[[key,{id:'key2',name:'Другой'}]]},{id:'b',maps:['factory'],type:'mark',count:1,markerItem:marker},{id:'c',maps:['customs'],type:'mark',count:5,markerItem:marker}]};let p=packing([t],'factory',new Set(['b']),new Set());assert.equal(p.take[0].count,2);assert.equal(p.keys.length,1);assert.equal(p.keys[0].options.length,2);});
test('optional stages must be explicitly included',()=>{let t={name:'A',objectives:[{id:'o',type:'mark',markerItem:marker,optional:true}]};assert.equal(packing([t],'factory',new Set(),new Set()).take.length,0);assert.equal(packing([t],'factory',new Set(),new Set(['o'])).take.length,1);});
test('quest item to plant is a packing requirement, ordinary find item is not',()=>{let t={name:'A',objectives:[{id:'p',type:'plantQuestItem',questItem:{id:'doc',name:'Документ'}},{id:'f',type:'findItem',items:[{id:'s',name:'Сахар'}],count:2,foundInRaid:true}]};let p=packing([t],'factory',new Set(),new Set());assert.equal(p.take[0].id,'doc');assert.equal(p.find[0].fir,true);assert.equal(p.take.length,1);});
test('Russian search normalizes punctuation and ё',()=>assert.equal(normalize('  Чёрт — Часть 1 '),'черт часть 1'));
test('factory coordinate rotation projects landmarks to expected quadrants',()=>{let m={rotation:90,bounds:[[77,-64.5],[-65.5,67.4]],viewBox:[0,0,130.81831,141.23242]};let a=mapPoint(m,{x:77,z:67.4}),b=mapPoint(m,{x:-65.5,z:-64.5});assert(Math.abs(a[0])<1e-8&&Math.abs(a[1])<1e-8);assert(Math.abs(b[0]-130.81831)<1e-8);});
const fs=require('node:fs'),vm=require('node:vm');const projection=require('../app/web/route-overlay.js');const fixture={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../app/web/projection-data.js'),'utf8'),fixture);const calibrations=fixture.window.PROJECTION_DATA;
test('both image projections preserve every calibration landmark',()=>{for(const d of Object.values(calibrations))d.source.forEach((p,i)=>{const q=projection.project(p,d);assert(Math.hypot(q[0]-d.target[i][0],q[1]-d.target[i][1])<1e-5);});});
test('route projection is continuous across calibration triangle edges',()=>{for(const d of Object.values(calibrations))for(const t of d.triangles)for(let i=0;i<3;i++){const a=d.source[t[i]],b=d.source[t[(i+1)%3]],p=[(a[0]+b[0])/2,(a[1]+b[1])/2],u=projection.project([p[0]-.0001,p[1]],d),v=projection.project([p[0]+.0001,p[1]],d);assert(Math.hypot(u[0]-v[0],u[1]-v[1])<.01);}});
test('projection keeps coordinates finite at map edges without changing route inputs',()=>{for(const d of Object.values(calibrations))for(const p of [[0,0],[1062,0],[0,535],[1062,535],[498.6,57.8]]){const before=[...p],q=projection.project(p,d);assert(q.every(Number.isFinite));assert.deepEqual(p,before);}});
test('image calibration triangles never mirror the route',()=>{const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);for(const d of Object.values(calibrations))for(const t of d.triangles)assert(cross(...t.map(i=>d.source[i]))*cross(...t.map(i=>d.target[i]))>0);});

test('exit region fallback stays inside polygon and reachable component', async()=>{
 const grid=new RA.Grid(10,6,1,[new Uint8Array(60).fill(1)]);for(let y=0;y<6;y++)grid.masks[0][y*10+5]=0;
 const seen=await grid.reachable(0),polygon=[[3,1],[8,1],[8,5],[3,5]];
 const n=grid.region(polygon,0,seen,[7,3]);assert(n>=0);const p=grid.xyz(n);assert(p[0]>=3&&p[0]<5&&p[1]>=1&&p[1]<5);assert(seen[n]);
 assert.equal(grid.region([[6,1],[9,1],[9,4],[6,4]],0,seen,[7,3]),-1);
});
test('region fallback does not create diagonal or floor connections', async()=>{
 const grid=new RA.Grid(2,2,1,[new Uint8Array([1,0,0,1]),new Uint8Array([1,1,1,1])]);const seen=await grid.reachable(0);
 assert.equal(seen[3],0);assert.equal(seen[4],0);assert.equal(seen.reduce((s,v)=>s+v,0),1);
});

test('new map registrations preserve landmarks and have no folded cells',()=>{
 const fs=require('node:fs'),vm=require('node:vm');const context={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/web/projection-extra.js'),'utf8'),context);
 const project=require('../app/web/route-overlay.js').project;
 for(const d of [...Object.values(context.window.EXTRA_PROJECTIONS),...Object.values(context.window.EXTRA_FLOOR_PROJECTIONS.interchange)]){
  d.source.forEach((p,i)=>{const q=project(p,d);assert(Math.hypot(q[0]-d.target[i][0],q[1]-d.target[i][1])<1e-6);});
  const area=(ps,t)=>{const[a,b,c]=t.map(i=>ps[i]);return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);};for(const t of d.triangles)assert(area(d.source,t)*area(d.target,t)>0);
 }
});
