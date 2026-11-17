/* Reviewed links between published level plans. Coordinates are SVG units.
   A link represents a named staircase/ramp, not freely walkable overlapping floors.
   Neither masks nor doors are opened to attach these links. */
(function(root){
const transitions={
 reserve:[
  {id:'reserve-white-bishop',name:'Белый слон · лестница в госпитале',a:['Ground_Level',526,365],b:['Bunkers',530,375]},
  {id:'reserve-black-bishop',name:'Чёрный слон · лестница в учебном корпусе',a:['Ground_Level',602,381],b:['Bunkers',605,380]},
  {id:'reserve-black-pawn',name:'Чёрная пешка · лестница в казарме',a:['Ground_Level',606,447],b:['Bunkers',614,451]},
  {id:'reserve-white-pawn',name:'Белая пешка · лестница в казарме',a:['Ground_Level',552,480],b:['Bunkers',553,490]},
  {id:'reserve-king',name:'Белый король · лестница в ЦКВП',a:['Ground_Level',513,420],b:['Bunkers',505,424]},
  {id:'reserve-dome',name:'Купол · лестница к Д-2',a:['Ground_Level',444,649],b:['Bunkers',438,635]},
  {id:'reserve-storage-west',name:'Складские бункеры · западный спуск',a:['Ground_Level',238,255],b:['Bunkers',238,250]},
  {id:'reserve-storage-east',name:'Складские бункеры · восточный спуск',a:['Ground_Level',356,294],b:['Bunkers',343,281]}
 ],
 'ground-zero':[
  {id:'gz-emercom',name:'МЧС · въезд в подземную парковку',a:['Ground_Level',151,63],b:['Underground_Level',151,61]},
  {id:'gz-skyside',name:'Skyside · лестница в подземный переход',a:['Ground_Level',133,143],b:['Underground_Level',134,140]},
  {id:'gz-mira',name:'Проспект Мира · спуск под дорогу',a:['Ground_Level',90,178],b:['Underground_Level',96,178]},
  {id:'gz-empire-under',name:'Empire · лестница в подземный переход',a:['Ground_Level',208,280],b:['Underground_Level',203,280]},
  {id:'gz-terragroup',name:'TerraGroup · лестница у вестибюля',a:['Ground_Level',276,182],b:['Second_Floor',277,181]},
  {id:'gz-empire-upper',name:'Empire · лестница со стороны Tarbank',a:['Ground_Level',191,294],b:['Second_Floor',195,284]},
  {id:'gz-capital-lower',name:'Capital Insight · нижний пролёт',a:['Ground_Level',119,388],b:['Second_Floor',120,383]},
  {id:'gz-capital-upper',name:'Capital Insight · верхний пролёт',a:['Second_Floor',125,382],b:['Third_Floor',125,382]},
  {id:'gz-fusion',name:'Fusion · лестница в подземный переход',a:['Ground_Level',142,300],b:['Underground_Level',145,299]}
 ]
};
function attach(grid,map,entries=transitions[map.id]||[]){grid.transitionEdges=new Map();grid.transitionAudit=[];for(const entry of entries){const ends=[entry.a,entry.b].map(([layer,x,y])=>({floor:map.floors.findIndex(f=>f[0]===layer),p:[x,y]}));const ns=ends.map(e=>e.floor<0?-1:grid.snap(e.p,e.floor,2));const valid=ns.every(n=>n>=0);grid.transitionAudit.push({id:entry.id,name:entry.name,valid,ends:ends.map((e,i)=>({...e,node:ns[i],snapped:ns[i]>=0?grid.xyz(ns[i]):null}))});if(!valid)continue;for(const [a,b]of [[ns[0],ns[1]],[ns[1],ns[0]]]){grid.links.set(a,[...new Set([...(grid.links.get(a)||[]),b])]);grid.transitionEdges.set(a+','+b,entry);}}return grid;}
function describe(grid,a,b){const node=p=>p[2]*grid.area+Math.floor(p[1]/grid.step)*grid.w+Math.floor(p[0]/grid.step);return grid.transitionEdges?.get(node(a)+','+node(b))||null;}
root.FloorTransitions={data:transitions,attach,describe};if(typeof module!=='undefined')module.exports=root.FloorTransitions;
})(typeof window!=='undefined'?window:globalThis);
