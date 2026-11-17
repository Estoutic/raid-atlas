// Separate floor artwork in the same coordinates as routing geometry.
// Keep the source floor untouched; omit other layers and retain its SVG styles/defs.
window.FloorMaps=(()=>{
 const cache=new Map();
 function get(id,floor,force=false){
  const map=CATALOG.maps.find(m=>m.id===id);
  if(!map?.hasPlan||map.manual||(!force&&(id==='factory'||floor===map.defaultFloor))||!map.floors[floor])return null;
  const key=id+':'+floor;if(cache.has(key))return cache.get(key);
  const layer=map.floors[floor][0],underground=/underground|basement|bunker|tunnel/i.test(layer);
  const svg=new DOMParser().parseFromString(map.svg,'image/svg+xml').documentElement;
  for(const g of [...svg.children])if(g.tagName.toLowerCase()==='g'&&g.id!==layer&&g.dataset.keepWithGroup!==layer)g.remove();
  const [,,w,h]=map.viewBox;svg.setAttribute('width',w);svg.setAttribute('height',h);
  const host=document.createElement('div');host.style.cssText='position:absolute;left:-10000px;top:0;visibility:hidden';document.body.append(host);host.append(document.importNode(svg,true));
  const live=host.querySelector('[id="'+layer+'"]'),inkRects=[...live.querySelectorAll('path,rect,polygon,circle,ellipse,use')].map(e=>{const b=e.getBBox(),t=e.getCTM(),corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>({x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f}));const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];});
  const box=host.querySelector('[id="'+layer+'"]').getBBox(),pad=12;
  const region=[Math.max(0,box.x-pad),Math.max(0,box.y-pad),box.width+pad*2,box.height+pad*2];host.remove();
  const source=[[0,0],[w,0],[0,h],[w,h]],affine=[[1,0],[0,1],[0,0]];
  const conf={floorPlan:true,underground,layer,inkRects,size:[w,h],src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg)),regions:{[floor]:region},anchors:{},projection:{source,target:source,triangles:[[0,1,2],[1,3,2]],affine,inverseAffine:affine}};
  cache.set(key,conf);return conf;
 }
 return {get};
})();
