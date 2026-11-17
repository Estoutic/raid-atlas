(function(root){
function bary(p,a,b,c){const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-9)return null;const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/det,v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/det;return[u,v,1-u-v];}
function project(p,d){
 for(const t of d.triangles){const w=bary(p,...t.map(i=>d.source[i]));if(w&&w.every(x=>x>=-1e-7))return [0,1].map(k=>w.reduce((s,x,j)=>s+x*d.target[t[j]][k],0));}
 const affine=q=>[0,1].map(k=>q[0]*d.affine[0][k]+q[1]*d.affine[1][k]+d.affine[2][k]);
 if(!d.edges){const edges=new Map();for(const t of d.triangles)for(let j=0;j<3;j++){let e=[t[j],t[(j+1)%3]].sort((a,b)=>a-b),key=e.join(',');edges.set(key,{e,count:(edges.get(key)?.count||0)+1});}d.edges=[...edges.values()].filter(e=>e.count===1).map(e=>e.e);}
 let best=null,dist=Infinity;for(const [i,j]of d.edges){const a=d.source[i],b=d.source[j],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),v=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;if(v<dist){dist=v;best={i,j,t};}}
 const base=affine(p);if(!best)return base;const {i,j,t}=best,a=affine(d.source[i]),b=affine(d.source[j]);return base.map((v,k)=>v+(1-t)*(d.target[i][k]-a[k])+t*(d.target[j][k]-b[k]));
}
root.RouteProjection={project,bary};if(typeof module!=='undefined')module.exports=root.RouteProjection;
})(typeof window!=='undefined'?window:globalThis);

function routeAnnotations(){
 const segments=[];let line=[];const flush=()=>{if(line.length>1)segments.push({points:line,floor:line[0][2],conditional:false});line=[];};
 for(const p of state.route?.polyline||[]){if(line.length&&p[2]!==line[0][2])flush();line.push(p);}flush();
 if(state.route?.conditional?.length)segments.push({points:state.route.conditional,floor:1,conditional:true});
 const marks=goals().map((g,i)=>({p:[...(state.route?.goalPoints?.[g.id]||g.p),g.floor],label:String(state.route?state.route.order.indexOf(g.id)+1:i+1),title:g.task+' · '+m().floors[g.floor][1],color:'#f4c452'}));
 const changes=[];for(let i=1;i<(state.route?.polyline.length||0);i++){const a=state.route.polyline[i-1],b=state.route.polyline[i];if(a[2]!==b[2])changes.push([a,b]);}
 const seen=new Set();for(const departure of [true,false])for(const [a,b]of changes){const p=departure?a:b,q=departure?b:a,key=p.map(Math.round).join(',');if(seen.has(key))continue;seen.add(key);const name=(state.grid?FloorTransitions.describe(state.grid,a,b)?.name:'')||'Лестница';marks.push({p,label:departure?(q[2]>p[2]?'↑':'↓'):'↳',title:(departure?'':'Выход с лестницы: ')+name,targetFloor:q[2],targetPoint:q,transition:true,color:'#b6b0f2'});}

 const st=state.starts[state.map];if(st)marks.push({p:[...st.p,st.floor],label:'Я',title:'Старт',color:'#75d8ef'});
 if(state.route){const c=state.route.conditional;if(c?.length)marks.push({p:c[0],label:'С',title:'Подход к сигнальной зоне. Дождись сообщения в игре.',color:'#a4f4ce'});const end=c?.length?c.at(-1):state.route.polyline.at(-1);if(end)marks.push({p:end,label:'✓',title:'Выбранный выход',color:'#a4f4ce'});}
 const exits=state.showExits===false?[]:m().extracts.flatMap((ex,i)=>exitVisible(ex)?[{p:[...RA.mapPoint(m(),ex.position),exitFloor(ex)],index:i,name:ex.name,overview:exitOverview(),level:exitLevelLabel(ex),available:exitAvailable(i),selected:String(state.exit[state.map])===String(i)}]:[]);
 if(window.FloorMaps?.get(state.map,state.floor))for(const entry of FloorTransitions.data[state.map]||[]){const f=m().floors[state.floor][0],end=entry.a[0]===f?entry.a:entry.b[0]===f?entry.b:null;if(!end)continue;const other=end===entry.a?entry.b:entry.a,targetFloor=m().floors.findIndex(x=>x[0]===other[0]);const existing=marks.find(m=>m.transition&&m.p[2]===state.floor&&Math.hypot(m.p[0]-end[1],m.p[1]-end[2])<3);if(existing){existing.caption=entry.name.split(' · ')[0];continue;}marks.push({p:[end[1],end[2],state.floor],label:targetFloor>state.floor?'↑':'↓',title:entry.name,caption:entry.name.split(' · ')[0],targetFloor,targetPoint:[other[1],other[2],targetFloor],transition:true,color:'#807ca9'});}
 return {segments,marks,exits};
}
function paintImageRoute(){
 const svg=$('renderRoute');if(!svg||!window.mapViewer)return;svg.replaceChildren();
 if(m().manual){paintManualRoute(svg);return;}const data=imageProjection();if(!data){svg.hidden=true;return;}svg.hidden=false;
 const conf=mapViewer.config(),scale=mapViewer.scale,project=p=>RouteProjection.project(p,data);
 svg.setAttribute('viewBox','0 0 '+conf.size.join(' '));svg.style.width=conf.size[0]+'px';svg.style.height=conf.size[1]+'px';svg.style.transform=`translate(${mapViewer.x}px,${mapViewer.y}px) scale(${scale})`;if(conf.floorPlan)mapViewer.vectorCamera(svg);
 const payload=routeAnnotations(),captionPositions=[];window.FloorLabels?.areas(svg,conf,scale);
 for(const seg of payload.segments){if(seg.floor!==state.floor)continue;const points=seg.points.map(p=>project(p).join(',')).join(' '),dash=seg.conditional?'9 7':!conf.floorPlan&&seg.floor!==m().defaultFloor?'3 5':null;
  for(const [width,color]of [[7,'#101922'],[3.7,seg.conditional?'#8ff5c6':'#ffd15c']]){const a={points,fill:'none',stroke:color,'stroke-width':width/scale,'stroke-linejoin':'round','stroke-linecap':'round'};if(dash)a['stroke-dasharray']=dash.split(' ').map(x=>Number(x)/scale).join(' ');svg.append(S('polyline',a));}}
 for(const mark of payload.marks){if(mark.p[2]!==state.floor)continue;const p=project(mark.p),g=S('g',{'data-label':mark.label}),r=11/scale;g.append(S('circle',{cx:p[0],cy:p[1],r,fill:mark.color,stroke:'#14202b','stroke-width':2/scale}));const text=S('text',{x:p[0],y:p[1]+4/scale,'text-anchor':'middle',fill:'#12202a','font-size':11/scale,'font-weight':800});text.textContent=mark.label;const title=S('title');title.textContent=mark.title;g.append(text,title);if(mark.caption&&!captionPositions.some(c=>c.name===mark.caption&&Math.hypot(c.p[0]-p[0],c.p[1]-p[1])*scale<90)){captionPositions.push({name:mark.caption,p});const caption=S('text',{x:p[0]+15/scale,y:p[1]+4/scale,fill:'#edeafa',stroke:'#101922','stroke-width':3/scale,'paint-order':'stroke','font-size':11/scale,'font-weight':600});caption.textContent=mark.caption;g.append(caption);}if(mark.transition){g.dataset.transition='true';g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',mark.title+' · '+m().floors[mark.targetFloor][1]);g.style.pointerEvents='all';g.style.cursor='pointer';g.onpointerdown=e=>e.stopPropagation();g.onclick=e=>{e.stopPropagation();showTransitionFloor(mark.targetFloor,mark.targetPoint);};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.onclick(e);}};}svg.append(g);}
 window.FloorLabels?.labels(svg,conf,scale,payload);
}
function updateRouteOverlays(){if(!window.mapViewer)return;paintImageRoute();if(state.map==='factory'&&window.Factory3D)Factory3D.overlay?.(routeAnnotations());}

function imageProjection(){const underground=window.FloorMaps?.get(state.map,state.floor);if(underground)return underground.projection;return state.map==='customs'?PROJECTION_DATA[mapViewer.style]:(window.EXTRA_FLOOR_PROJECTIONS?.[state.map]?.[m().floors[state.floor][0]]||window.EXTRA_PROJECTIONS?.[state.map]);}
function prepareImageAnchors(){
 const data=imageProjection(),conf=mapViewer.config();
 const keepAnchors=!conf.floorPlan&&['customs','factory'].includes(state.map);
 if(!keepAnchors)conf.anchors={};
 for(const ex of m().extracts){
  if(conf.floorPlan&&exitFloor(ex)!==state.floor)continue;
  const reviewed=!conf.floorPlan&&(ex.overviewAnchors||[ex.overviewAnchor]).find(a=>a?.file===conf.file);
  if(reviewed){conf.anchors[ex.id]=reviewed.point.slice();continue;}
  if(keepAnchors&&conf.anchors[ex.id])continue;
  if(!data)continue;
  const p=RA.mapPoint(m(),ex.position);
  if(p.some((x,i)=>x<0||x>m().viewBox[i+2]))continue;
  conf.anchors[ex.id]=RouteProjection.project(p,data);
 }
}
function paintManualRoute(svg){
 svg.hidden=false;const conf=mapViewer.config(),scale=mapViewer.scale;svg.setAttribute('viewBox','0 0 '+conf.size.join(' '));svg.style.width=conf.size[0]+'px';svg.style.height=conf.size[1]+'px';svg.style.transform=`translate(${mapViewer.x}px,${mapViewer.y}px) scale(${scale})`;if(conf.floorPlan)mapViewer.vectorCamera(svg);
 const points=state.manual[state.map]||[];if(points.length>1)for(const [width,color]of [[7,'#101922'],[3.7,'#ffd15c']])svg.append(S('polyline',{points:points.map(v=>v.p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':width/scale,'stroke-linejoin':'round','stroke-linecap':'round'}));
 points.forEach((v,i)=>{const [x,y]=v.p,g=S('g');g.append(S('circle',{cx:x,cy:y,r:12/scale,fill:'#ffd15c',stroke:'#14202b','stroke-width':2/scale}));const t=S('text',{x,y:y+4/scale,'text-anchor':'middle',fill:'#12202a','font-size':12/scale,'font-weight':800});t.textContent=i+1;const title=S('title');title.textContent=v.label||'Точка '+(i+1);g.append(t,title);svg.append(g);});
}

function showTransitionFloor(floor,point,focus=false){$('floor').value=floor;$('floor').dispatchEvent(new Event('change'));if(window.mapViewer?.mode==='render'&&!mapViewer.isModel()&&imageProjection()){const p=RouteProjection.project(point,imageProjection());if(focus)mapViewer.scale=Math.max(mapViewer.scale,1.2);mapViewer.center(...p);}else if(mapViewer.mode==='plan'&&focus){const w=m().viewBox[2]*.4,h=m().viewBox[3]*.4;state.view=[point[0]-w/2,point[1]-h/2,w,h];draw();}status('');}
