const test=require('node:test'),assert=require('node:assert/strict');global.RA=require('../app/web/core.js');const {choose}=require('../app/web/route-choice.js');
test('exit is chosen after the required stop, not by distance from spawn',()=>{
 const m=[[0,10,1,12],[10,0,12,2],[1,12,0,20],[12,2,20,0]];
 const r=choose(m,1,[{index:0,node:2},{index:1,node:3}]);assert.equal(r.best.index,1);assert.equal(r.best.cost,12);assert.deepEqual(r.best.order,[0]);
});
test('only permitted exits compete; unreachable exit never drops required goals',()=>{
 const m=[[0,2,1,8],[2,0,Infinity,6],[1,Infinity,0,4],[8,6,4,0]];
 assert.equal(choose(m,1,[{index:0,node:2}]).best,null);
 assert.equal(choose(m,1,[{index:0,node:2},{index:1,node:3}]).best.index,1);
});
test('conditional exit final segment counts and zero-task routes work',()=>{
 const m=[[0,2,10],[2,0,20],[10,20,0]];
 assert.equal(choose(m,0,[{index:0,node:1,extraCost:42},{index:1,node:2}]).best.index,1);
});
test('prerequisite order is retained independently for each allowed exit',()=>{
 const m=[[0,5,1,3,10],[5,0,2,4,9],[1,2,0,8,1],[3,4,8,0,9],[10,9,1,9,0]];
 const r=choose(m,2,[{index:0,node:3},{index:1,node:4}],[[],[0]]);
 assert.equal(r.best.index,1);assert.deepEqual(r.best.order,[0,1]);assert.equal(r.best.cost,8);
});
