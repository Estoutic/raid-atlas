// Runs only when explicitly invoked by the native --test-ui harness.
window.runUISmoke=async(scenario='factory',displayStyle='classic')=>{
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  changeMap(scenario);if(scenario==='factory')mapViewer.factoryStyle='plan';setView(true);tab('exits');
  await $('renderImage').decode();await new Promise(r=>setTimeout(r,150));
  mapViewer.fitFloor();
  const initial={x:mapViewer.x,y:mapViewer.y,scale:mapViewer.scale};
  const pane=$('renderPane'),rect=pane.getBoundingClientRect(),cx=rect.left+rect.width*.42,cy=rect.top+rect.height*.48;
  pane.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:cx,clientY:cy,button:0}));
  pane.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:cx+70,clientY:cy+35,button:0}));
  pane.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1,clientX:cx+70,clientY:cy+35,button:0}));
  assert(Math.abs(mapViewer.x-initial.x-70)<1,'Image drag failed');
  const under=[(cx-rect.left-mapViewer.x)/mapViewer.scale,(cy-rect.top-mapViewer.y)/mapViewer.scale];
  pane.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:cx,clientY:cy,deltaY:-70}));
  assert(mapViewer.scale>initial.scale,'Wheel zoom failed');
  assert(Math.abs((cx-rect.left-mapViewer.x)/mapViewer.scale-under[0])*mapViewer.scale<1,'Zoom cursor anchor drifted '+JSON.stringify({under,after:(cx-rect.left-mapViewer.x)/mapViewer.scale,x:mapViewer.x,scale:mapViewer.scale}));
  const pin=$('renderPins').querySelector('[data-index="0"]');assert(pin,'Missing image exit marker');pin.click();
  assert(String(state.exit[scenario])==='0','Image marker did not select exit');
  assert($('renderPins').querySelectorAll('.selected').length===1,'Exit highlight not exclusive');
  const card=$('exitList').querySelector('[data-index="2"] .exitChoose');card.click();
  assert(String(state.exit[scenario])==='2','Exit card did not select');
  assert($('selectedExitName').textContent===m().extracts[2].name,'Selected exit label out of sync');
  setView(false);assert($('mapSvg').querySelectorAll('.exitMarker.selected').length===1,'Schematic highlight missing');
  const visible=$('mapSvg').querySelectorAll('.exitMarker').length;assert(visible>1,'Only selected exit displayed on schematic');
  $('showExits').checked=false;$('showExits').dispatchEvent(new Event('change'));assert(!$('mapSvg').querySelector('.exitMarker'),'Hide markers failed');
  $('showExits').checked=true;$('showExits').dispatchEvent(new Event('change'));
  setView(true);mapViewer.fitFloor();
  const final={x:mapViewer.x,y:mapViewer.y,scale:mapViewer.scale};
  setView(false);setView(true);assert(Math.abs(mapViewer.scale-final.scale)<.001,'View switch lost zoom');
  if(scenario==='customs'){
    mapViewer.style='realistic';mapViewer.setMode(true);selectExit(1,true);assert(mapViewer.mode==='plan','Unmapped render exit should open schematic');
    assert($('selectedExitName').textContent===m().extracts[1].name,'Unmapped exit lost selection');
    mapViewer.style='classic';selectExit(0,true);setView(true);mapViewer.fitFloor();await $('renderImage').decode();
  }
  if(scenario==='customs'&&displayStyle==='realistic'){mapViewer.style='realistic';$('renderStyle').value='realistic';setView(true);mapViewer.fitFloor();await $('renderImage').decode();}
  const result={image:{src:$('renderImage').currentSrc,width:$('renderImage').naturalWidth,rect:$('renderImage').getBoundingClientRect().toJSON(),display:getComputedStyle($('renderImage')).display,visibility:getComputedStyle($('renderImage')).visibility,opacity:getComputedStyle($('renderImage')).opacity},ok:true,scenario,checks:['image drag','wheel zoom','cursor anchor','image pin selection','card selection','exclusive highlight','schematic exits','show/hide','view camera persistence','missing image anchor fallback'],renderPins:$('renderPins').children.length,exits:m().extracts.length,selectedExit:$('selectedExitName').textContent,layout:{viewportBottom:$('viewport').getBoundingClientRect().bottom,window:innerHeight,panelWidth:document.querySelector('.panel').getBoundingClientRect().width}};
  assert(result.layout.viewportBottom<innerHeight,'Map overflow');
  await new Promise(r=>setTimeout(r,150));return result;
};

window.runFactory3DSmoke=async()=>{changeMap('factory');mapViewer.factoryStyle='model';setView(true);await Factory3D.ready();await new Promise(r=>setTimeout(r,200));const first=Factory3D.info();if(!first.loaded||first.triangles<100)throw Error('Factory model did not render');Factory3D.zoom(1.2);Factory3D.rotate();const levels=[];for(const f of [0,2,3,1]){state.floor=f;$('floor').value=f;await Factory3D.show(f);levels.push(Factory3D.info());}await new Promise(r=>setTimeout(r,150));return {ok:true,first,levels};};
window.runAtlasSmoke=async()=>{
 const rows=[];
 for(const map of CATALOG.maps){
  changeMap(map.id);setView(true);
  if(map.id==='factory')await Factory3D.ready();else await $('renderImage').decode();
  if(!map.routing&&!$('routeBtn').disabled)throw Error('Unverified routing enabled: '+map.id);
  const view={map:map.id,image:map.id==='factory'?Factory3D.info().loaded:$('renderImage').naturalWidth>0,tasks:CATALOG.tasks.filter(t=>t.maps.includes(map.id)).length,exits:map.extracts.length,hasPlan:map.hasPlan};
  if(map.hasPlan){setView(false);if(!$('mapSvg').querySelector('g'))throw Error('Missing plan: '+map.id);if(map.extracts.length){selectExit(0,true);if(String(state.exit[map.id])!=='0')throw Error('Exit select failed');}}
  if(!mapViewer.isModel()&&mapViewer.scale<=0)throw Error('Invalid camera scale: '+map.id);if(!view.image)throw Error('Image missing: '+map.id);rows.push(view);
 }
 changeMap('shoreline');setView(true);tab('exits');await $('renderImage').decode();await new Promise(r=>setTimeout(r,200));
 return {ok:true,maps:rows,total:CATALOG.maps.length,tasks:CATALOG.tasks.length};
};

window.runGallerySmoke=async()=>{
 const cards=[...$('atlasCards').children];if(cards.length!==12)throw Error('Missing map cards');
 $('atlasBtn').click();if(!$('atlasDialog').open)throw Error('Gallery did not open');
 cards[2].click();if(state.map!=='shoreline'||$('atlasDialog').open)throw Error('Map card did not select Shoreline');
 await $('renderImage').decode();if(mapViewer.scale<=0)throw Error('Invalid image scale');
 if(!$('renderPins').children.length)throw Error('Calibrated exit pins missing');
 $('atlasBtn').click();await Promise.all([...$('atlasCards').querySelectorAll('img')].map(x=>x.decode()));
 await new Promise(r=>setTimeout(r,150));return {ok:true,cards:cards.length,selected:state.map,dialog:$('atlasDialog').getBoundingClientRect().toJSON()};
};

window.runMapResearch=async(style)=>{changeMap('factory');if(style==='realistic'){setView(false);return {viewBox:m().viewBox,labels:m().labels.map(l=>({name:l.text,p:RA.mapPoint(m(),{x:l.position[0],z:l.position[1]})}))};}setView(true);await Factory3D.ready();Factory3D.top();await new Promise(r=>setTimeout(r,100));return Factory3D.details();};

window.runFlareRoute=async()=>{const base=await runSmoke('customs');const i=m().extracts.findIndex(e=>e.id===FLARE_EXIT_ID);selectExit(i,false);tab('route');await $('routeBtn').onclick();if(!state.route)throw Error($('status').textContent);if(mapViewer.mode!=='render')throw Error('Calculate button did not show 3D view');
 const g=state.grid;for(const p of state.route.polyline){const n=p[2]*g.area+Math.floor(p[1]/g.step)*g.w+Math.floor(p[0]/g.step);if(!g.open(n))throw Error('Normal path crosses blocked cell');}
 const a=state.route.polyline.at(-1),b=state.route.conditional[0];if(Math.hypot(a[0]-b[0],a[1]-b[1])>2.5)throw Error('Conditional section disconnected');
 if(!state.route.order.length)throw Error('Required goal dropped');
 state.view=null;draw();return {ok:true,base:base.planned,normalGridCellsVerified:true,automatic3D:true,approach:specialExit(m().extracts[i]).p,conditional:state.route.conditional,goals:state.route.order,distance:state.route.distance};};

window.runOverlaySmoke=async(scenario,style)=>{
 let result;if(scenario==='customs')result=await runFlareRoute();else result=await runSmoke('factory');
 if(!state.route)throw Error('Route was not built');
 mapViewer.style=style;setView(true);
 if(scenario==='customs'){
  await $('renderImage').decode();if(!$('renderRoute').querySelector('polyline'))throw Error('No projected route');
  const path=$('renderRoute').querySelector('polyline').getAttribute('points'),saved=JSON.stringify(state.route.polyline);
  mapViewer.zoom(1.2);mapViewer.x+=40;mapViewer.paint();
  if($('renderRoute').style.transform!==$('renderImage').style.transform)throw Error('Route detached from image');
  if($('renderRoute').querySelector('polyline').getAttribute('points')!==path)throw Error('Route coordinates changed during zoom');
  if(JSON.stringify(state.route.polyline)!==saved)throw Error('Projection modified route');mapViewer.fitFloor();
  result={...result,style,polylines:$('renderRoute').querySelectorAll('polyline').length,marks:$('renderRoute').querySelectorAll('g').length,transform:$('renderRoute').style.transform};
 }else{
  await Factory3D.ready();const first=Factory3D.annotationInfo();if(!first.segments)throw Error('No first-floor 3D route');
  $('floor').value=3;$('floor').dispatchEvent(new Event('change'));await Factory3D.ready();const third=Factory3D.annotationInfo();if(!third.marks||third.floor!==3)throw Error('Floor annotations not switched');
  if(style!=='realistic'){$('floor').value=1;$('floor').dispatchEvent(new Event('change'));await Factory3D.ready();}result={...result,first,third};
 }
 await new Promise(r=>setTimeout(r,200));return {ok:true,...result};
};

window.runExpandedScan=async()=>{
 const rows=[];state.selected.clear();state.done.clear();state.owned.clear();$('riskMode').value='short';
 for(const id of ['shoreline','woods','reserve','lighthouse','interchange','ground-zero','streets-of-tarkov']){
  changeMap(id);const grid=await makeGrid();state.grid=grid;const map=m(),floor=map.defaultFloor;
  const exits=map.extracts.map((e,i)=>({i,name:e.name,f:exitFloor(e),p:RA.mapPoint(map,e.position)})).map(e=>({...e,n:grid.snap(e.p,e.f,2.5)}));
  const spawns=map.spawns.map(s=>({p:RA.mapPoint(map,s.position),floor:estimateFloor(s.position)})).map(s=>({...s,n:grid.snap(s.p,s.floor,2.5)})).filter(s=>s.floor===floor&&s.n>=0);
  let route=null,pick=null,start=null;
  for(const ex of exits.filter(e=>e.n>=0&&e.f===floor)){for(const st of spawns.filter(s=>Math.hypot(s.p[0]-ex.p[0],s.p[1]-ex.p[1])>map.viewBox[2]*.15).slice(0,3)){route=await grid.path(st.n,ex.n);if(route){pick=ex;start=st;break;}}if(route)break;}
  if(route){state.starts[id]=start;state.exit[id]=String(pick.i);await plan();setView(true);await $('renderImage').decode();if(!state.route||!$('renderRoute').querySelector('polyline'))throw Error(id+': route overlay missing');}
  rows.push({id,floors:map.floors,open:grid.masks.map(a=>a.reduce((s,x)=>s+x,0)),links:grid.links.size,spawns:spawns.length,exits:exits.map(({n,i,name,f,p})=>({i,name,f,p,snap:n>=0})),planned:!!state.route,start:start?.p,exit:pick?.name,distance:state.route?.distance,status:$('status').textContent,overlays:$('renderRoute').querySelectorAll('polyline').length});
 }
 return rows;
};
window.runShellManualSmoke=async()=>{
 $('locationMenu').click();if($('locationDrawer').hidden)throw Error('Drawer not open');$('locationList').querySelector('[data-map="icebreaker"]').click();if(state.map!=='icebreaker'||!$('locationDrawer').hidden)throw Error('Location selection');await $('renderImage').decode();$('manualAdd').click();
 const points=[[800,450],[1100,350],[1350,600]];const click=p=>{const b=$('renderPane').getBoundingClientRect();const e={clientX:b.left+mapViewer.x+p[0]*mapViewer.scale,clientY:b.top+mapViewer.y+p[1]*mapViewer.scale};handleImageClick(e);};points.forEach(click);
 if(state.manual.icebreaker.length!==3||$('renderRoute').querySelectorAll('g').length!==3)throw Error('Manual marks missing');const path=$('renderRoute').querySelector('polyline').getAttribute('points');mapViewer.zoom(1.2);mapViewer.paint();if(path!==$('renderRoute').querySelector('polyline').getAttribute('points')||$('renderRoute').style.transform!==$('renderImage').style.transform)throw Error('Manual pan/zoom detached');
 $('manualList').querySelector('input').value='Старт';$('manualList').querySelector('input').dispatchEvent(new Event('change'));if(JSON.parse(localStorage.getItem('raid-atlas-v1')).manual.icebreaker[0].label!=='Старт')throw Error('Manual not persisted');$('manualUndo').click();if(state.manual.icebreaker.length!==2)throw Error('Undo');changeMap('the-labyrinth');if(state.manual['the-labyrinth']?.length)throw Error('Map plans leaked');changeMap('icebreaker');if(state.manual.icebreaker.length!==2)throw Error('Plan lost');
 changeMap('factory');setView(true);await Factory3D.ready();$('floorButtons').querySelector('[data-floor="3"]').click();await Factory3D.ready();if(state.floor!==3||Factory3D.info().floor!==3)throw Error('Floor button failed');
 const layout={width:innerWidth,height:innerHeight,panel:document.querySelector('.panel').getBoundingClientRect().toJSON(),floor:3};$('locationMenu').click();return {ok:true,manual:true,panZoom:true,persistence:true,floors:true,layout};
};
window.runExpandedRoutes=async()=>{
 const rows=[];state.selected.clear();state.done.clear();state.owned.clear();state.choices={};$('riskMode').value='short';
 for(const id of ['shoreline','woods','reserve','lighthouse','interchange','ground-zero','streets-of-tarkov']){
  changeMap(id);const grid=await makeGrid();state.grid=grid;const map=m(),floor=map.defaultFloor;const starts=map.spawns.map(s=>({p:RA.mapPoint(map,s.position),floor:estimateFloor(s.position)})).map(s=>({...s,n:grid.snap(s.p,s.floor,2.5)})).filter(s=>s.floor===floor&&s.n>=0);
  const exits=map.extracts.map((ex,i)=>({ex,i,p:RA.mapPoint(map,ex.position),floor:exitFloor(ex)}));let selected=null;
  for(const st of starts.slice(0,25)){const reach=await grid.reachable(st.n);if(reach.reduce((s,v)=>s+v,0)<5000)continue;for(const ex of exits.filter(e=>e.floor===floor)){let n=grid.snap(ex.p,ex.floor,2.5);if(n<0||!reach[n])n=grid.region(ex.ex.outline.map(p=>RA.mapPoint(map,p)),ex.floor,reach,ex.p);if(n>=0&&Math.hypot(st.p[0]-ex.p[0],st.p[1]-ex.p[1])>map.viewBox[2]*.15){selected={st,ex,reach,n};break;}}if(selected)break;}
  if(!selected){rows.push({id,planned:false,reason:'No connected spawn and exit',open:grid.masks.map(a=>a.reduce((s,v)=>s+v,0))});continue;}
  state.selected.clear();let selectedTask=null;
  for(const t of CATALOG.tasks.filter(t=>t.maps.includes(id))){state.selected=new Set([t.id]);const gs=goals();if(gs.length&&gs.length<=3&&gs.every(g=>!g.ambiguous&&g.floor===floor&&selected.reach[grid.snap(g.p,g.floor,2.5)])&&!t.objectives.some(o=>o.type==='plantQuestItem')){selectedTask=t;break;}}
  if(!selectedTask)state.selected.clear();else{for(const o of selectedTask.objectives)for(const k of RA.flatten(o.requiredKeys))state.owned.add(k.id);}
  state.starts[id]={p:selected.st.p,floor};state.exit[id]=String(selected.ex.i);$('exitSelect').value=selected.ex.i;refresh();renderExit();await plan();setView(true);await $('renderImage').decode();
  if(!state.route)throw Error(id+': '+$('status').textContent);for(const p of state.route.polyline)if(!grid.open(p[2]*grid.area+Math.floor(p[1]/grid.step)*grid.w+Math.floor(p[0]/grid.step)))throw Error(id+': blocked cell');
  const annotationCount=$('renderRoute').querySelectorAll('polyline').length;if(!annotationCount)throw Error(id+': missing overlay');const before=JSON.stringify(state.route.polyline);mapViewer.zoom(1.1);if($('renderRoute').style.transform!==$('renderImage').style.transform||JSON.stringify(state.route.polyline)!==before)throw Error(id+': detached route');mapViewer.fitFloor();
  rows.push({id,planned:true,task:selectedTask?.name,goals:state.route.order.length,start:selected.st.p,exit:selected.ex.ex.name,distance:state.route.distance,open:grid.masks.map(a=>a.reduce((s,v)=>s+v,0)),links:grid.links.size,annotationCount,openCellsVerified:true});state.selected.clear();state.owned.clear();
 }
 tab('route');return {ok:rows.every(r=>r.planned),maps:rows};
};
window.runInterchangeFloors=async()=>{
 changeMap('interchange');state.selected.clear();state.owned.clear();$('riskMode').value='short';const grid=await makeGrid();state.grid=grid;if(grid.links.size<10)throw Error('Missing published ramp links');
 const startNode=[...grid.links.keys()].find(n=>grid.xyz(n)[2]===2);if(startNode===undefined)throw Error('No upper floor ramp');const reachable=await grid.reachable(startNode),origin=grid.xyz(startNode);let far=startNode,dist=0;for(let n=2*grid.area;n<3*grid.area;n++){if(!reachable[n])continue;const q=grid.xyz(n),d=Math.hypot(q[0]-origin[0],q[1]-origin[1]);if(d>dist){dist=d;far=n;}}const p=grid.xyz(far);state.starts.interchange={p:p.slice(0,2),floor:2};state.exit.interchange=String(m().extracts.findIndex(e=>/железной дороге/i.test(e.name)));$('exitSelect').value=state.exit.interchange;renderExit();await plan();if(!state.route)throw Error($('status').textContent);const floors=[...new Set(state.route.polyline.map(p=>p[2]))];if(floors.length!==3)throw Error('Route omitted a floor');setView(true);const layers=[];
 for(const f of [0,1,2]){$('floor').value=f;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();if(!$('renderRoute').querySelector('polyline'))throw Error('No floor overlay '+f);layers.push({floor:f,points:$('renderRoute').querySelector('polyline').getAttribute('points').slice(0,80)});}
 $('floor').value=1;$('floor').dispatchEvent(new Event('change'));tab('route');return {ok:true,links:grid.links.size,floors,layers,distance:state.route.distance};
};
window.researchPortals=async(scenario)=>{
 changeMap(scenario==='customs'?'ground-zero':'reserve');setView(false);document.body.classList.add('panelHidden');state.view=[0,0,m().viewBox[2],m().viewBox[3]];draw();const svg=$('mapSvg');
 const under=svg.querySelector('#'+m().floors[0][0]);under.style.display='';const css=S('style');css.textContent=`#${m().floors[0][0]},#${m().floors[0][0]} *{fill:#67ddf9!important;stroke:#087aaf!important;stroke-width:.5!important;opacity:.65}`;svg.append(css);svg.append(under);
 for(let x=0;x<m().viewBox[2];x+=state.map==='reserve'?40:20){svg.append(S('path',{d:`M${x} 0V${m().viewBox[3]}`,stroke:'#fdf5','stroke-width':.3}));for(let y=20;y<m().viewBox[3];y+=state.map==='reserve'?40:20){const t=S('text',{x:x+1,y,fill:'#fff','font-size':state.map==='reserve'?6:3});t.textContent=x+','+y;svg.append(t);}}
 for(const l of m().labels){const p=RA.mapPoint(m(),{x:l.position[0],z:l.position[1]}),t=S('text',{x:p[0],y:p[1],fill:'#ffb65b','font-size':state.map==='reserve'?9:5});t.textContent=l.text;svg.append(t);}
 return {map:state.map,paths:[...svg.querySelectorAll('#'+m().floors[0][0]+' path')].map((p,i)=>({i,bbox:{x:p.getBBox().x,y:p.getBBox().y,width:p.getBBox().width,height:p.getBBox().height},d:p.getAttribute('d')}))};
};

window.researchUpper=async()=>{await researchPortals('customs');const svg=$('mapSvg');for(const [i,color]of [[2,'#ffce59'],[3,'#ee78ca']]){const g=svg.querySelector('#'+m().floors[i][0]);g.style.display='';svg.append(g);const css=S('style');css.textContent=`#${g.id} *{fill:${color}!important;stroke:#000!important;stroke-width:.2!important;opacity:.65}`;svg.append(css);}return {ok:true};};

window.auditTransitions=async(scenario)=>{changeMap(scenario==='customs'?'ground-zero':'reserve');const grid=await makeGrid();const nodes=grid.transitionAudit.flatMap(t=>t.ends.filter(e=>e.node>=0));const connected=[];for(const e of nodes){const reach=await grid.reachable(e.node);connected.push({p:e.snapped,byFloor:grid.masks.map((_,i)=>reach.slice(i*grid.area,(i+1)*grid.area).reduce((s,x)=>s+x,0))});}setView(false);return {map:state.map,audit:grid.transitionAudit,connected};};
window.researchPortalDetails=async()=>{changeMap('reserve');const grid=await makeGrid(),aud=grid.transitionAudit.map(t=>({...t,nearest:t.ends.map(e=>{const n=grid.snap(e.p,e.floor,15);return n<0?null:grid.xyz(n);})}));document.body.replaceChildren();document.body.style.cssText='display:flex;background:#14212d;color:white;margin:0;height:100vh;gap:8px';for(const [name,box]of [['Black bishop',[565,335,95,85]],['Dome',[385,590,95,80]],['Storage',[220,205,150,125]]]){const panel=E('div');panel.style.cssText='width:33%;height:100%;display:flex;flex-direction:column';panel.append(E('h2','',name));const svg=new DOMParser().parseFromString(m().svg,'image/svg+xml').documentElement;svg.setAttribute('viewBox',box.join(' '));svg.style.cssText='width:100%;height:90%';const css=S('style');css.textContent='#Bunkers path{fill:#72daf5;fill-opacity:.6;stroke:#fff;stroke-width:.25}';svg.append(css);for(let x=box[0];x<box[0]+box[2];x+=5)for(let y=box[1];y<box[1]+box[3];y+=5){const t=S('text',{x,y,fill:'#fff','font-size':1.8});t.textContent=x+','+y;svg.append(t);}panel.append(svg);document.body.append(panel);}return aud;};
window.runBasementRoutes=async(scenario)=>{
 const id=scenario==='customs'?'ground-zero':'reserve';changeMap(id);state.selected.clear();state.done.clear();state.owned.clear();state.choices={};$('riskMode').value='short';$('budget').value=50;
 const names=id==='reserve'?['Бункер']:['Спасение крота','Стрельба по баночкам'];for(const name of names){const task=CATALOG.tasks.find(t=>t.name===name);if(!task)throw Error('Missing task '+name);state.selected.add(task.id);for(const o of task.objectives)for(const k of RA.flatten(o.requiredKeys))state.owned.add(k.id);}
 for(const g of goals())if(g.ambiguous)state.choices[g.id]={index:0,floor:g.floor};refresh();const grid=await makeGrid();state.grid=grid;
 const audit=grid.transitionAudit;if(audit.some(t=>!t.valid))throw Error('Invalid transitions: '+audit.filter(t=>!t.valid).map(t=>t.id).join(', '));
 const roundtrips=[];for(const p of audit){const [a,b]=p.ends.map(e=>e.node);if(!grid.links.get(a)?.includes(b)||!grid.links.get(b)?.includes(a))throw Error('One-way transition '+p.id);roundtrips.push(p.id);}
 const start=id==='reserve'?{p:[430,310],floor:1}:{p:[170,190],floor:0};state.starts[id]=start;const exIndex=m().extracts.findIndex(e=>id==='reserve'?e.name==='Спуск со скалы':e.name.includes('Nakatani'));if(exIndex<0)throw Error('Missing extraction');state.exit[id]=String(exIndex);$('exitSelect').value=exIndex;renderExit();await plan();if(!state.route)throw Error($('status').textContent);
 if(state.route.order.length!==goals().length)throw Error('Dropped a required goal');if(!state.route.transitions.some(t=>t.to[2]>t.from[2]))throw Error('No ascent in route');if(!state.route.transitions.some(t=>t.to[2]<t.from[2]))throw Error('No descent in route');
 for(let i=0;i<state.route.polyline.length;i++){const p=state.route.polyline[i],node=p[2]*grid.area+Math.floor(p[1]/grid.step)*grid.w+Math.floor(p[0]/grid.step);if(!grid.open(node))throw Error('Blocked normal path cell');if(i&&state.route.polyline[i-1][2]!==p[2]&&!FloorTransitions.describe(grid,state.route.polyline[i-1],p))throw Error('Unregistered floor jump');}
 let d2=null;if(id==='reserve'){const ex=m().extracts.find(e=>e.name==='Д-2'),end=grid.snap(RA.mapPoint(m(),ex.position),exitFloor(ex),2.5),a=grid.snap(start.p,start.floor,2.5),r=await grid.path(a,end);if(!r)throw Error('D2 unreachable');d2={distance:r.distance,floors:[...new Set(r.path.map(n=>grid.xyz(n)[2]))]};}
 tab('route');setView(true);await $('renderImage').decode();const first=state.route.transitions[0];showTransitionFloor(first.from[2],first.from);const marker=$('renderRoute').querySelector('[data-transition]');if(!marker)throw Error('No interactive stair marker');const before=state.floor;marker.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(state.floor===before)throw Error('Stair marker did not switch floor');const active=$('floorButtons').querySelector('[aria-pressed="true"]');if(Number(active.dataset.floor)!==state.floor)throw Error('Floor buttons not in sync');if(!$('renderRoute').querySelector('[data-transition]'))throw Error('Return stair marker missing');
 if($('routeResult').querySelectorAll('.transitionStep').length!==state.route.transitions.length)throw Error('Missing staircase instructions');$('routeResult').querySelector('.transitionStep').click();if(state.floor!==first.from[2])throw Error('Step did not focus entry');$('routeResult').querySelector('.transitionNext').click();if(state.floor!==first.to[2])throw Error('Step did not show destination');
 const route=state.route;state.floor=0;$('floor').value=0;draw();mapViewer.fitFloor();await new Promise(r=>setTimeout(r,150));return {ok:true,map:id,portalCount:audit.length,allEndpointsOpen:true,roundtrips,tasks:names,goals:route.order.length,floors:[...new Set(route.polyline.map(p=>p[2]))],transitions:route.transitions.map(t=>({name:t.name,from:t.from,to:t.to})),d2,interactiveMarkers:true,routeSteps:true,normalCellsVerified:true,distance:route.distance};
};

window.runUndergroundView=async(scenario)=>{
 const route=await runBasementRoutes(scenario),conf=mapViewer.config();
 if(!conf.underground||$('renderPane').dataset.layer!==m().floors[0][0])throw Error('Underground artwork not selected');
 await $('renderImage').decode();const src=$('renderImage').src,xml=new DOMParser().parseFromString(decodeURIComponent(src.split(',').slice(1).join(',')),'image/svg+xml');
 if(xml.getElementById('Ground_Level'))throw Error('Surface buildings remain on underground artwork');
 if(!xml.getElementById(m().floors[0][0]))throw Error('Underground geometry missing');
 for(const p of state.route.polyline.filter(p=>p[2]===0)){const q=RouteProjection.project(p,imageProjection());if(Math.hypot(q[0]-p[0],q[1]-p[1])>1e-7)throw Error('Underground route distorted');}
 const old=$('renderRoute').getAttribute('viewBox');mapViewer.zoom(1.2);mapViewer.x+=25;mapViewer.paint();if($('renderRoute').getAttribute('viewBox')===old)throw Error('Camera did not move');assertFloorCamera();
 const stairs=$('renderRoute').querySelectorAll('[data-transition]');if(!stairs.length)throw Error('No underground stairs');stairs[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));await $('renderImage').decode();if(state.floor===0||mapViewer.config().underground||$('renderImage').src===src)throw Error('Ascent did not restore surface artwork');
 $('floorButtons').querySelector('[data-floor="0"]').click();await $('renderImage').decode();if($('renderImage').src!==src)throw Error('Basement button did not restore underground image');
 const p=state.route.polyline.find(p=>p[2]===0),box=$('renderPane').getBoundingClientRect();state.place=true;handleImageClick({clientX:box.left+mapViewer.x+p[0]*mapViewer.scale,clientY:box.top+mapViewer.y+p[1]*mapViewer.scale});if(state.starts[state.map].floor!==0||Math.hypot(...state.starts[state.map].p.map((v,i)=>v-p[i]))>1e-6)throw Error('Underground start misplaced');
 await plan();if(!state.route)throw Error('Route from underground start failed');setView(true);mapViewer.fitFloor();await $('renderImage').decode();
 return {...route,undergroundArtwork:true,noSurfaceBuildings:true,exactRouteCoordinates:true,ascentRestoresSurface:true,startPlacement:true,cameraAligned:true,stairs:stairs.length,layer:conf.layer};
};
window.runFactoryExits=async()=>{
 changeMap('factory');state.showExits=true;$('showExits').checked=true;mapViewer.factoryStyle='model';setView(true);const floors=[];
 for(let f=0;f<m().floors.length;f++){$('floor').value=f;$('floor').dispatchEvent(new Event('change'));await Factory3D.ready();await new Promise(r=>setTimeout(r,60));updateRouteOverlays();const expected=m().extracts.filter(exitVisible).length,info=Factory3D.exitInfo();if(info.length!==expected)throw Error('Missing all-floor exits on factory model '+f);floors.push({floor:f,exits:info.length});}
 const ex=m().extracts.findIndex(e=>exitFloor(e)===1);$('floorButtons').querySelector('[data-floor="1"]').click();await Factory3D.ready();updateRouteOverlays();const button=document.querySelector('.modelExit[data-index="'+ex+'"]');if(!button||button.hidden)throw Error('No visible exit button');button.click();await Factory3D.ready();if(String(state.exit.factory)!==String(ex)||!Factory3D.exitInfo().find(e=>e.index===ex)?.selected)throw Error('Factory exit selection failed');
 const before=Factory3D.exitInfo();Factory3D.rotate();const after=Factory3D.exitInfo();if(!after.some((x,i)=>Math.abs(x.x-before[i].x)+Math.abs(x.y-before[i].y)>1))throw Error('Exit pins not following camera');
 $('showExits').checked=false;$('showExits').dispatchEvent(new Event('change'));if(Factory3D.exitInfo().length)throw Error('Hidden exits still visible');$('showExits').checked=true;$('showExits').dispatchEvent(new Event('change'));if(!Factory3D.exitInfo().length)throw Error('Exits not restored');if($('showExits').closest('label').hidden)throw Error('Exit visibility switch hidden');
 const underground=m().extracts.findIndex(e=>exitFloor(e)===0),overviewFloor=state.floor;if(underground>=0){selectExit(underground,true);await Factory3D.ready();await new Promise(r=>setTimeout(r,100));if(!mapViewer.isModel()||Factory3D.info().floor!==overviewFloor||!Factory3D.exitInfo().find(e=>e.index===underground)?.selected)throw Error('Exit list changed the overview model');}
 selectExit(ex,true);await Factory3D.ready();await new Promise(r=>setTimeout(r,100));Factory3D.fit();tab('exits');
 return {ok:true,floors,clickSelection:true,selectedHighlight:true,cameraTracking:true,visibilityToggle:true,exitListFocus:true,info:Factory3D.exitInfo()};
};

window.runAllFloorPlans=async()=>{
 const rows=[];state.selected.clear();state.done.clear();state.owned.clear();
 for(const id of ['customs','shoreline','reserve','interchange','ground-zero','streets-of-tarkov']){
  changeMap(id);setView(true);const grid=await makeGrid();state.grid=grid;const sources=new Set();
  for(let f=0;f<m().floors.length;f++){
   if(f===m().defaultFloor)continue;
   $('floorButtons').querySelector('[data-floor="'+f+'"]').click();await $('renderImage').decode();const conf=mapViewer.config();
   if(!conf.floorPlan||conf.layer!==m().floors[f][0]||$('renderPane').dataset.layer!==conf.layer)throw Error(id+': wrong floor artwork '+f);
   if(sources.has($('renderImage').src))throw Error(id+': floors share artwork');sources.add($('renderImage').src);
   const xml=new DOMParser().parseFromString(decodeURIComponent(conf.src.split(',').slice(1).join(',')),'image/svg+xml'),groups=[...xml.documentElement.children].filter(e=>e.tagName.toLowerCase()==='g');
   if(!groups.length||groups.some(e=>e.id!==conf.layer&&e.dataset.keepWithGroup!==conf.layer))throw Error(id+': unrelated floor geometry visible');
   const rect=conf.regions[f];if(!rect||rect.some(x=>!Number.isFinite(x))||rect[2]<=24||rect[3]<=24)throw Error(id+': empty floor');
   const base=f*grid.area;let start=-1;for(let q=0;q<grid.area;q++){if(!grid.open(base+q))continue;const nearby=[...grid.neighbors(base+q)].filter(([n])=>Math.floor(n/grid.area)===f);if(nearby.length>=3){start=base+q;break;}}
   if(start<0)throw Error(id+': no walkable interior '+f);
   const seen=new Set([start]),queue=[start];for(let head=0;head<queue.length&&queue.length<4000;head++)for(const [n]of grid.neighbors(queue[head]))if(Math.floor(n/grid.area)===f&&!seen.has(n)){seen.add(n);queue.push(n);}
   const path=await grid.path(start,queue.at(-1));if(!path||path.path.length<2)throw Error(id+': no room path '+f);
   const points=path.path.map(n=>grid.xyz(n));if(points.some(p=>p[2]!==f))throw Error(id+': unexpected floor hop');
   const other=m().defaultFloor;state.route={polyline:[...points,[points.at(-1)[0],points.at(-1)[1],other],[points.at(-1)[0]+2,points.at(-1)[1],other]],order:[],goalPoints:{}};draw();
   const lines=[...$('renderRoute').querySelectorAll('polyline')];if(lines.length!==2)throw Error(id+': wrong-floor route leaked into '+f);
   const actual=lines[0].getAttribute('points').split(' ').map(v=>v.split(',').map(Number));if(actual.length!==points.length||actual.some((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])>1e-7))throw Error(id+': room path misaligned');
   const pins=[...$('renderPins').children];if(pins.some(p=>exitFloor(m().extracts[Number(p.dataset.index)])!==f))throw Error(id+': wrong-floor exit');
   mapViewer.zoom(1.2);mapViewer.x+=20;mapViewer.paint();assertFloorCamera();
   rows.push({map:id,floor:f,layer:conf.layer,routeNodes:points.length,onlySelectedFloor:true,coordinatesMatch:true,panZoomAligned:true});
   state.route=null;
  }
  $('floorButtons').querySelector('[data-floor="'+m().defaultFloor+'"]').click();await $('renderImage').decode();if(mapViewer.config().floorPlan||$('renderImage').src.startsWith('data:image/svg'))throw Error(id+': surface not restored');
 }
 // Single-level maps retain their image; Factory retains its individual 3D floors.
 for(const id of ['woods','lighthouse','the-labyrinth','icebreaker','terminal']){changeMap(id);setView(true);await $('renderImage').decode();if(mapViewer.config().floorPlan)throw Error(id+': unexpected floor plan');}
 changeMap('factory');setView(true);$('floorButtons').querySelector('[data-floor="2"]').click();await Factory3D.ready();if(!mapViewer.isModel()||Factory3D.info().floor!==2)throw Error('Factory 3D floor changed');
 return {ok:true,floorPlans:rows.length,rows,surfaceRestored:true,singleFloorMapsPreserved:true,factoryModelPreserved:true};
};
window.previewUpperFloor=async(scenario)=>{
 changeMap(scenario==='customs'?'customs':'shoreline');state.selected.clear();state.route=null;setView(true);$('floor').value=3;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();mapViewer.fitFloor();return {ok:true,map:state.map,layer:mapViewer.config().layer};
};
window.runGroundUpperRoute=async()=>{
 const result=await runBasementRoutes('customs');$('floor').value=2;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();mapViewer.fitFloor();if(!mapViewer.config().floorPlan||!$('renderRoute').querySelector('polyline'))throw Error('Upper interior route not displayed');return {...result,upperInterior:true};
};
window.runRoomLabels=async(scenario)=>{
 const id=scenario==='customs'?'shoreline':'customs',name=id==='customs'?'Золотые понты':'Врачебная тайна. Часть 2',number=id==='customs'?'303':'306';
 changeMap(id);state.selected.clear();state.done.clear();state.choices={};const task=CATALOG.tasks.find(t=>t.name===name);state.selected.add(task.id);refresh();setView(true);$('floor').value=3;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();mapViewer.fitFloor();
 const goal=goals().find(g=>g.type==='findQuestItem'),loc=FloorLabels.forGoal(goal);if(loc?.door.number!==number||loc.door.floor!==3)throw Error('Wrong quest room');if(id==='shoreline'&&!loc.building.includes('западное'))throw Error('Confused east/west wing');
 const button=document.querySelector('.showGoalRoom[data-goal="'+goal.id+'"]');if(!button)throw Error('No task focus button');button.click();await $('renderImage').decode();if(state.floor!==3||$('roomDetails').hidden||!$('roomDetails').textContent.includes(number)||!$('roomDetails').textContent.includes(name))throw Error('Room detail missing');
 if(!$('renderRoute').querySelector('[data-goal-area="'+goal.id+'"]')||!$('renderRoute').querySelector('[data-floor-label="goal"]'))throw Error('Quest room is not highlighted');
 const before=$('renderRoute').style.transform;mapViewer.zoom(1.25);mapViewer.x+=20;mapViewer.paint();if($('renderRoute').style.transform===before||$('renderRoute').style.transform!==$('renderImage').style.transform)throw Error('Labels detached during pan/zoom');
 $('floorButtons').querySelector('[data-floor="2"]').click();await $('renderImage').decode();if(!$('roomDetails').hidden||$('renderRoute').querySelector('[data-goal-area="'+goal.id+'"]'))throw Error('Wrong-floor target visible');
 const check=FloorLabels.doors().find(d=>d.floor===2&&d.number);FloorLabels.focusDoor(check.id);if(!$('roomDetails').textContent.includes(check.number)||$('roomDetails').hidden)throw Error('Room click detail failed');
 FloorLabels.focusGoal(goal.id);mapViewer.fitFloor();await new Promise(r=>setTimeout(r,120));const buildings=[...$('renderRoute').querySelectorAll('[data-floor-label="building"]')].map(g=>g.textContent);if(!buildings.length)throw Error('Building names missing');
 return {ok:true,map:id,task:name,room:number,building:loc.building,doors:FloorLabels.doors().length,numberedDoors:FloorLabels.doors().filter(d=>d.number).length,buildingLabels:buildings,roomLabels:$('renderRoute').querySelectorAll('[data-floor-label="room"]').length,goalCaption:true,goalHighlight:true,focusButton:true,roomDetails:true,floorIsolation:true,panZoomAligned:true};
};
window.runLabelCoverage=async()=>{
 const rows=[];state.selected.clear();state.done.clear();
 for(const map of CATALOG.maps){if(map.manual||map.id==='factory'||!map.hasPlan)continue;changeMap(map.id);setView(true);
  for(let f=0;f<map.floors.length;f++){if(!FloorMaps.get(map.id,f))continue;$('floor').value=f;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();const roomNodes=[...$('renderRoute').querySelectorAll('[data-floor-label="room"]')];for(const n of roomNodes){if(FloorLabels.doors().find(d=>d.id===n.dataset.labelId)?.floor!==f)throw Error('Wrong floor room '+map.id);}
   rows.push({map:map.id,floor:f,buildings:[...$('renderRoute').querySelectorAll('[data-floor-label="building"] text')].map(n=>n.textContent),rooms:roomNodes.length});
  }
 }
 changeMap('customs');setView(false);$('floor').value=3;$('floor').dispatchEvent(new Event('change'));if(!$('mapSvg').querySelector('[data-floor-label="room"]'))throw Error('Schematic room labels missing');const n=$('mapSvg').querySelector('[data-floor-label="room"]');n.dispatchEvent(new MouseEvent('click',{bubbles:true}));if($('roomDetails').hidden)throw Error('Schematic room click failed');
 changeMap('interchange');setView(true);$('floor').value=2;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();mapViewer.fitFloor();return {ok:true,rows,schematicLabels:true,schematicClick:true};
};
window.runPlaceSearch=async()=>{
 changeMap('customs');$('placeSearch').value='306 западное крыло';$('placeSearch').dispatchEvent(new Event('input'));if($('placeResults').hidden||$('placeResults').querySelectorAll('button').length!==1)throw Error('Room search not unique');$('placeSearch').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await $('renderImage').decode();if(state.map!=='shoreline'||state.floor!==3||$('roomDetails').hidden||!$('roomDetails').textContent.includes('306')||!$('roomDetails').textContent.includes('западное'))throw Error('Wrong room/wing/floor');
 const room=PlaceSearch.search('104 западное')[0];PlaceSearch.open(room);if(state.floor!==1||mapViewer.mode!=='plan'||!$('mapSvg').querySelector('[data-floor-label="room"]')||$('roomDetails').hidden)throw Error('First-floor room not on interior plan');
 const shop=PlaceSearch.search('TECHLIGHT')[0];if(!shop||shop.floor!==2)throw Error('Shop search missing');PlaceSearch.open(shop);if(state.map!=='interchange'||state.floor!==2||mapViewer.mode!=='plan')throw Error('Building search floor wrong');
 const target=PlaceSearch.search('306 западное крыло')[0];PlaceSearch.open(target);await $('renderImage').decode();$('placeSearch').value='306 западное крыло';$('placeSearch').dispatchEvent(new Event('input'));const bounds=$('placeSearch').getBoundingClientRect();if(bounds.right>$('viewport').getBoundingClientRect().right)throw Error('Search layout overflow');
 return {ok:true,globalSearch:true,correctWing:true,correctFloor:true,firstFloorInterior:true,shopFloor:true,keyboardEnter:true,viewport:innerWidth};
};
window.runAutoExits=async()=>{
 await runBasementRoutes('factory');const ids=['Спуск со скалы','Д-2'].map(name=>m().extracts.findIndex(e=>e.name===name));if(ids.some(i=>i<0))throw Error('Missing known exits');state.availableExits.reserve=[];state.exitMode.reserve='auto';renderExit();
 for(const index of ids){const cb=$('exitList').querySelector('[data-index="'+index+'"] .exitAvailable input');if(!cb)throw Error('No exit checkbox');cb.checked=true;cb.dispatchEvent(new Event('change'));}
 await plan();if(!state.route?.autoExit||state.route.order.length!==7||state.route.comparisons.length!==2)throw Error('Auto comparison omitted a goal or exit: '+$('status').textContent);const best={index:state.route.exitIndex,cost:state.route.comparisons[0].cost,goals:state.route.order.length},comparison=state.route.comparisons.map(c=>({...c}));
 const manual=[];for(const index of ids){state.exitMode.reserve='manual';state.exit.reserve=String(index);await plan();if(!state.route)throw Error('Manual baseline failed');manual.push({index,cost:state.route.comparisons[0].cost,goals:state.route.order.length});}
 if(best.cost!==Math.min(...manual.map(m=>m.cost)))throw Error('Auto choice differs from independently planned exits');
 ExitOptions.toggle(best.index,false);await plan();if(state.route?.exitIndex===best.index||!state.route)throw Error('Unchecked exit used');
 const include=$('selectedTasks').querySelector('.includeTask input');include.checked=false;include.dispatchEvent(new Event('change'));if(goals().length!==0)throw Error('Disabled task still in route');await plan();if(!state.route||state.route.order.length)throw Error('Zero-task route failed');
 for(const index of [...ExitOptions.indices()])ExitOptions.toggle(index,false);await plan();if(state.route||!$('status').textContent.includes('Отметь доступные'))throw Error('Empty selection reused old exit');
 const restored=$('selectedTasks').querySelector('.includeTask input');restored.checked=true;restored.dispatchEvent(new Event('change'));for(const index of ids)ExitOptions.toggle(index,true);await plan();if(!state.route||state.route.order.length!==7)throw Error('Restored goals missing');
 const saved=JSON.parse(localStorage.getItem('raid-atlas-v1'));if(saved.availableExits.reserve.length!==2||saved.excludedTasks.length)throw Error('Selections not persisted');tab('route');setView(true);$('floor').value=0;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();mapViewer.fitFloor();$('routeResult').querySelector('details.exitComparison').open=true;
 return {ok:true,best,comparison,manual,allGoalsRetained:true,uncheckedExitExcluded:true,zeroTaskRoute:true,emptyExitSelectionBlocked:true,persistence:true};
};

function assertFloorCamera(){
 const base=$('renderFloor'),overlay=$('renderRoute'),pane=$('renderPane').getBoundingClientRect();
 if(!base||getComputedStyle(base).display==='none'||getComputedStyle($('renderImage')).display!=='none')throw Error('Floor is not rendered as live vectors');
 for(const svg of [base,overlay]){
  if(svg.style.transform!=='none')throw Error('Vector viewport is CSS-scaled');
  const bounds=svg.getBoundingClientRect();if(Math.abs(bounds.width-pane.width)>1||Math.abs(bounds.height-pane.height)>1)throw Error('Oversized vector texture');
  const matrix=svg.getScreenCTM();
  for(const p of [[0,0],[180,160],[250,250]]){
   const q=new DOMPoint(...p).matrixTransform(matrix);
   if(Math.hypot(q.x-(pane.left+mapViewer.x+p[0]*mapViewer.scale),q.y-(pane.top+mapViewer.y+p[1]*mapViewer.scale))>.1)throw Error('Vector camera is misaligned');
  }
 }
 if(base.getAttribute('viewBox')!==overlay.getAttribute('viewBox'))throw Error('Labels detached from walls');
}
window.runFloorQuality=async()=>{
 state.selected.clear();changeMap('customs');setView(true);$('floor').value=3;$('floor').dispatchEvent(new Event('change'));
 await $('renderImage').decode();assertFloorCamera();const scales=[];
 for(const factor of [1.35,1.35,.7,1.8]){
  mapViewer.zoom(factor);mapViewer.x+=23;mapViewer.y-=11;mapViewer.paint();assertFloorCamera();
  const label=$('renderRoute').querySelector('[data-floor-label="room"] text');if(!label)throw Error('No room number');
  const font=parseFloat(label.getAttribute('font-size'))*label.getScreenCTM().a;
  if(Math.abs(font-11)>.1)throw Error('Room text shrunk during zoom');scales.push(mapViewer.scale);
 }
 const label=$('renderRoute').querySelector('[data-floor-label="room"][role="button"]');label.dispatchEvent(new MouseEvent('click',{bubbles:true}));assertFloorCamera();if($('roomDetails').hidden)throw Error('Room click failed');
 $('floor').value=1;$('floor').dispatchEvent(new Event('change'));await $('renderImage').decode();if(getComputedStyle($('renderImage')).display==='none'||getComputedStyle($('renderFloor')).display!=='none')throw Error('Surface image not restored');
 $('floor').value=3;$('floor').dispatchEvent(new Event('change'));assertFloorCamera();mapViewer.fitFloor();$('roomDetails').hidden=true;await new Promise(r=>setTimeout(r,200));
 return {ok:true,liveVectors:true,viewportSized:true,roomTextScreenSize:11,zoomScales:scales,roomClick:true,surfaceRestored:true,retina:devicePixelRatio};
};

window.runScavExits=async()=>{
 const rows=[];
 for(const id of ['customs','shoreline','reserve']){
  changeMap(id);setView(true);tab('exits');
  const scav=m().extracts.map((ex,i)=>({ex,i})).filter(({ex})=>ex.factions.includes('scav'));
  if(!scav.length)throw Error(id+': no Scav exits');
  for(const {ex,i} of scav){
   selectExit(i,true);setView(true);
   if(!document.querySelector('#exitList [data-index="'+i+'"]')?.textContent.includes('Дикий'))throw Error(ex.name+': missing list label');
   if(!document.querySelector('#renderPins [data-index="'+i+'"]'))throw Error(ex.name+': missing map marker');
   ExitOptions.toggle(i,true);
   if(!ExitOptions.indices().includes(i))throw Error(ex.name+': cannot mark available');
  }
  const stored=JSON.parse(localStorage.getItem('raid-atlas-v1'));
  if(!scav.every(({ex})=>stored.availableExits[id].includes(ex.id)))throw Error(id+': not saved');
  rows.push({map:id,scav:scav.length,all:m().extracts.length});
 }
 changeMap('customs');setView(true);tab('exits');await $('renderImage').decode();return {ok:true,maps:rows};
};

window.runExitFilter=async()=>{
 const rows=[];
 for(const id of ['customs','shoreline','factory']){
  changeMap(id);state.availableExits[id]=m().extracts.map(e=>e.id);
  for(const side of ['all','pmc','scav']){
   document.querySelector('[data-faction="'+side+'"]').click();
   const expected=m().extracts.flatMap((e,i)=>side==='all'||e.factions.includes(side)||e.factions.includes('shared')?[i]:[]);
   const equal=(actual,label)=>{if(JSON.stringify([...actual].sort((a,b)=>a-b))!==JSON.stringify([...expected].sort((a,b)=>a-b)))throw Error(id+' '+side+' '+label);};
   equal([...$('exitList').children].map(e=>Number(e.dataset.index)),'list');
   equal([...$('exitSelect').options].filter(e=>e.value!=='').map(e=>Number(e.value)),'selector');
   equal(ExitOptions.indices(),'route candidates');
   for(let f=0;f<m().floors.length;f++){
    $('floor').value=f;$('floor').dispatchEvent(new Event('change'));setView(false);
    const floorExpected=expected.filter(i=>exitFloor(m().extracts[i])===f);
    const actual=[...$('mapSvg').querySelectorAll('.exitMarker')].map(e=>Number(e.dataset.index));
    if(JSON.stringify(actual)!==JSON.stringify(floorExpected))throw Error(id+' '+side+' scheme floor '+f);
    setView(true);
    if(id==='factory'){await Factory3D.ready();updateRouteOverlays();const model=Factory3D.exitInfo().map(e=>e.index);if(JSON.stringify(model)!==JSON.stringify(expected))throw Error(side+' factory model');}
    else{const pins=[...$('renderPins').children].map(e=>Number(e.dataset.index));if(pins.some(i=>!expected.includes(i)))throw Error(id+' '+side+' image');}
   }
   if(expected.length){ExitOptions.toggle(expected[0],false);ExitOptions.toggle(expected[0],true);}
   if(state.availableExits[id].length!==m().extracts.length)throw Error('Hidden marks lost');
   rows.push({map:id,side,count:expected.length});
  }
 }
 changeMap('customs');setExitFaction('all');const pmc=m().extracts.findIndex(e=>e.factions.includes('pmc')&&!e.factions.includes('scav'));selectExit(pmc);setExitFaction('scav');
 if($('exitSelect').value!==''||!$('clearExit').hidden||state.route)throw Error('Hidden selection still active');
 if(JSON.parse(localStorage.getItem('raid-atlas-v1')).exitFaction!=='scav')throw Error('Filter not persisted');
 setExitFaction('pmc');if($('exitSelect').value!==String(pmc))throw Error('Selection not restored');
 setExitFaction('scav');tab('exits');setView(true);await $('renderImage').decode();return {ok:true,rows,persistence:true,hiddenMarksPreserved:true};
};

window.runExitHighlight=async()=>{
 const rows=[];setExitFaction('all');
 for(const id of ['customs','factory']){
  changeMap(id);state.exit[id]='';state.availableExits[id]=[];setView(true);if(id==='factory')await Factory3D.ready();
  const visible=m().extracts.flatMap((e,i)=>exitFloor(e)===state.floor?[i]:[]),[first,second]=visible;
  if(second===undefined)throw Error('Need two exits');
  const selector=id==='factory'?'.modelExit':'.imageExit';
  const markers=()=>[...document.querySelectorAll(selector)];
  const normal=()=>{const e=document.querySelector(selector+'[data-index="'+second+'"]');const s=getComputedStyle(id==='factory'?e.querySelector('.modelExitSymbol'):e);return [s.backgroundColor,s.opacity,s.filter].join('|');};
  draw();renderExit();const count=markers().length,before=normal();
  ExitOptions.toggle(first,true);
  if(markers().length!==count||normal()!==before)throw Error('Unmarked exits changed');
  if(!document.querySelector(selector+'[data-index="'+first+'"].available'))throw Error('Missing highlight');
  ExitOptions.toggle(second,true);if(markers().filter(e=>e.classList.contains('available')).length!==2)throw Error('Multiple highlights missing');
  setView(false);if($('mapSvg').querySelectorAll('.exitMarker.available').length!==2)throw Error('Scheme highlights missing');
  selectExit(first);if(!$('mapSvg').querySelector('.exitMarker.selected.available')||!$('mapSvg').querySelector('.exitMarker.selected').textContent.includes('✓'))throw Error('Selected marker not distinct');
  ExitOptions.toggle(first,false);if($('mapSvg').querySelectorAll('.exitMarker.available').length!==1)throw Error('Highlight not removed');
  setView(true);if(id==='factory')await Factory3D.ready();updateRouteOverlays();
  if(markers().length!==count||markers().filter(e=>e.classList.contains('available')).length!==1)throw Error('Render state mismatch');
  const stored=JSON.parse(localStorage.getItem('raid-atlas-v1'));if(!stored.availableExits[id].includes(m().extracts[second].id))throw Error('Not saved');
  rows.push({map:id,markers:count,highlighted:1,unmarkedUnchanged:true});
 }
 changeMap('customs');setView(true);tab('exits');await $('renderImage').decode();return {ok:true,rows};
};

window.runExitLevels=async()=>{
 const rows=[];setExitFaction('all');
 for(const id of ['customs','shoreline','reserve','interchange','ground-zero','streets-of-tarkov','factory']){
  changeMap(id);setView(true);if(id==='factory')await Factory3D.ready();updateRouteOverlays();
  const isModel=id==='factory',selector=isModel?'.modelExit':'.imageExit',getPins=()=>[...document.querySelectorAll(selector)];
  const located=m().extracts.flatMap((e,i)=>{const p=RA.mapPoint(m(),e.position);return isModel||id==='customs'||e.overviewAnchor||p.every((x,k)=>x>=0&&x<=m().viewBox[k+2])?[i]:[];});
  if(getPins().length!==located.length)throw Error(id+': missing located overview exits '+getPins().length+'/'+located.length);
  const others=located.filter(i=>exitFloor(m().extracts[i])!==m().defaultFloor);
  for(const i of others){
   const pin=document.querySelector(selector+'[data-index="'+i+'"]');
   if(!pin.textContent.includes(exitLevelLabel(m().extracts[i])))throw Error(id+': missing floor label');
   const floor=state.floor,src=$('renderImage').getAttribute('src'),camera=[mapViewer.x,mapViewer.y,mapViewer.scale];pin.click();if(isModel)await Factory3D.ready();
   if(state.floor!==floor||!exitOverview()||$('renderImage').getAttribute('src')!==src)throw Error(id+': click switched floor');
   if(!isModel&&JSON.stringify(camera)!==JSON.stringify([mapViewer.x,mapViewer.y,mapViewer.scale]))throw Error(id+': pin click moved camera');
   selectExit(i,true);if(isModel)await Factory3D.ready();
   if(state.floor!==floor||!exitOverview())throw Error(id+': list selection switched floor');
   ExitOptions.toggle(i,true);if(!document.querySelector(selector+'[data-index="'+i+'"].available'))throw Error('Missing highlight');
  }
  rows.push({map:id,located:getPins().length,otherFloors:others.length,outsideMap:m().extracts.length-located.length});
  if(others.length){
   setView(false);selectExit(others[0],true);
   if(state.floor!==exitFloor(m().extracts[others[0]]))throw Error('Scheme did not focus actual floor');
   if([...$('mapSvg').querySelectorAll('.exitMarker')].some(e=>exitFloor(m().extracts[Number(e.dataset.index)])!==state.floor))throw Error('Scheme has other floors');
   if(!isModel){setView(true);if(!mapViewer.config().floorPlan)throw Error('Detailed plan missing');if([...$('renderPins').children].some(e=>exitFloor(m().extracts[Number(e.dataset.index)])!==state.floor))throw Error('Detailed plan has other floors');}
  }
 }
 changeMap('reserve');setView(true);tab('exits');await $('renderImage').decode();return {ok:true,rows};
};

window.runExitCorrections=async()=>{
 setExitFaction('all');changeMap('interchange');setView(true);tab('exits');
 const i=m().extracts.findIndex(e=>e.id==='1e65f8bedbd9322074ae387892f0972883bdb794');
 const pin=document.querySelector('#renderPins [data-index="'+i+'"]');if(!pin)throw Error('River exit missing');
 const a=mapViewer.config().anchors[m().extracts[i].id];if(Math.hypot(a[0]-25,a[1]-746)>.01)throw Error('River marker misaligned');
 const expectedCount=m().extracts.length;if($('renderPins').children.length!==expectedCount)throw Error('Interchange lost exits');
 pin.click();ExitOptions.toggle(i,true);
 if(!exitOverview()||!document.querySelector('#renderPins [data-index="'+i+'"].selected.available'))throw Error('River interaction failed');
 const before=mapViewer.scale;mapViewer.zoom(1.3);const moved=document.querySelector('#renderPins [data-index="'+i+'"]');
 if(Math.abs(parseFloat(moved.style.left)-(mapViewer.x+25*mapViewer.scale))>.01)throw Error('Marker detached during zoom');mapViewer.zoom(before/mapViewer.scale);
 const river={count:expectedCount,anchor:a,selected:true,highlighted:true};
 changeMap('ground-zero');setView(true);tab('exits');
 if(m().extracts.length!==6||$('renderPins').children.length!==6||$('exitList').children.length!==6)throw Error('Ground Zero catalog/view mismatch');
 if(m().extracts.some(e=>/Pinewood|Бункер Диких|Южный пост ООН/i.test(e.name)))throw Error('Foreign exit leaked');
 const ground={count:m().extracts.length,names:m().extracts.map(e=>e.name)};
 changeMap('interchange');setView(true);tab('exits');await $('renderImage').decode();mapViewer.fitAll();return {ok:true,river,ground};
};

window.runExitAudit=async()=>{
 const rows=[];state.showExits=true;setExitFaction('all');
 for(const map of CATALOG.maps){
  changeMap(map.id);tab('exits');
  const styles=map.id==='customs'?['classic','realistic']:map.id==='factory'?['plan','model']:['default'];
  for(const style of styles){
   if(map.id==='factory')mapViewer.factoryStyle=style;
   if(map.id==='customs')mapViewer.style=style;
   setView(true);const model=mapViewer.isModel();
   if(model){await Factory3D.ready();updateRouteOverlays();}else await $('renderImage').decode();
   const selector=model?'.modelExit':'#renderPins .imageExit';
   if(document.querySelectorAll(selector).length!==map.extracts.length)throw Error(map.id+'/'+style+': missing exits');
   if($('exitList').querySelectorAll('.exitCard').length!==map.extracts.length)throw Error(map.id+': list mismatch');
   if(!model){
    mapViewer.zoom(1.25);
    for(const pin of document.querySelectorAll(selector)){
     const a=mapViewer.config().anchors[pin.dataset.id];
     if(!a?.every((v,i)=>Number.isFinite(v)&&v>=0&&v<=mapViewer.config().size[i]))throw Error(map.id+': bad anchor '+pin.dataset.id);
     if(Math.abs(parseFloat(pin.style.left)-(mapViewer.x+a[0]*mapViewer.scale))>.01||Math.abs(parseFloat(pin.style.top)-(mapViewer.y+a[1]*mapViewer.scale))>.01)throw Error(map.id+': zoom detached marker');
    }
    mapViewer.fitAll();
   }
   if(map.extracts.length){
    const i=map.extracts.findIndex(e=>e.overviewAnchors?.length),index=i<0?0:i;
    document.querySelector(selector+'[data-index="'+index+'"]').click();ExitOptions.toggle(index,true);
    if(model){await Factory3D.ready();updateRouteOverlays();}
    if(!document.querySelector(selector+'[data-index="'+index+'"].selected.available')||state.floor!==map.defaultFloor)throw Error(map.id+': selection/highlight/floor regression');
   }
   for(const faction of ['pmc','scav','all']){
    setExitFaction(faction);if(model)updateRouteOverlays();
    if(document.querySelectorAll(selector).length!==map.extracts.filter(exitVisible).length)throw Error(map.id+': faction mismatch '+faction);
   }
   rows.push({map:map.id,style,exits:map.extracts.length,allLocated:true,selection:true,filters:true});
  }
 }
 changeMap('woods');setView(true);tab('exits');await $('renderImage').decode();mapViewer.fitAll();return {ok:true,rows};
};
