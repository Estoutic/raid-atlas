// Runs the real anchor preparation without a DOM. Native smoke tests cover the UI.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(){
 const c={RA:require('../app/web/core.js')};c.window=c;
 for(const file of ['catalog','projection-data','projection-extra','atlas-maps','route-overlay'])vm.runInNewContext(fs.readFileSync(path.join(root,'app/web',file+'.js'),'utf8'),c);
 const viewer=fs.readFileSync(path.join(root,'app/web/map-viewer.js'),'utf8');
 vm.runInNewContext(viewer.slice(0,viewer.indexOf('class RenderCamera'))+';window.renders=RENDER_MAPS;',c);
 c.state={};c.m=()=>c.CATALOG.maps.find(m=>m.id===c.state.map);
 c.mapViewer={style:'classic',config:()=>c.renders[c.state.map==='customs'&&c.mapViewer.style==='realistic'?'customs-realistic':c.state.map]};
 return c;
}
function audit(){
 const c=environment(),rows=[];
 for(const map of c.CATALOG.maps)for(const style of map.id==='customs'?['classic','realistic']:['default']){
  c.state.map=map.id;c.state.floor=map.defaultFloor;c.mapViewer.style=style;
  c.prepareImageAnchors();const conf=c.mapViewer.config();
  rows.push({map:map.id,style,file:conf.file,size:conf.size,exits:map.extracts.map(e=>({id:e.id,name:e.name,world:e.position,svg:c.RA.mapPoint(map,e.position),anchor:conf.anchors[e.id]||null,method:e.overviewAnchors?.some(a=>a.file===conf.file)?'reviewed-image-anchor':map.id==='factory'||map.id==='customs'?'existing-anchor-or-projection':'projection'}))});
 }
 return {reviewedOn:'2026-11-17',rows};
}
module.exports={environment,audit};
if(require.main===module)process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
