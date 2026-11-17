const test=require('node:test'),assert=require('node:assert/strict'),labels=require('../app/web/floor-labels.js');
test('room numbers are parsed without confusing street addresses or key codes',()=>{
 assert.equal(labels.roomNumber('Ключ от комнаты 303 общежития'),'303');
 assert.equal(labels.roomNumber('Ключ от номера 306 западного крыла Санатория'),'306');
 assert.equal(labels.roomNumber('Ключ от комнаты в квартире 64 в Concordia'),'64');
 assert.equal(labels.roomNumber('Ключ от квартиры на Чеканной 15'),null);
 assert.equal(labels.roomNumber('Ключ от перехода на Приморском 46-48'),null);
 assert.equal(labels.roomNumber('Ключ ЗБ-1013'),null);
});
test('identical room numbers retain separate wing, entrance and key identities',()=>{
 const west={id:'west',key:'kw',keyName:'Ключ от номера 306 западного крыла Санатория',position:{x:-216,y:3,z:-92}},east={id:'east',key:'ke',keyName:'Ключ от номера 306 восточного крыла Санатория',position:{x:-285,y:3,z:-92}};
 const a=labels.door({id:'shoreline'},west,3),b=labels.door({id:'shoreline'},east,3);
 assert.equal(a.number,b.number);assert.notEqual(a.building,b.building);assert.notEqual(a.id,b.id);assert.notEqual(a.key,b.key);assert.deepEqual(a.world,west.position);
});
