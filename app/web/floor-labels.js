/* Labels from bundled tarkov.dev map metadata and keyed doors.
   Door labels identify an entrance, not an invented room polygon. */
(function(root){
 const ru={'Big Red':'Большой красный','Dorms':'Общежития','New Gas':'Новая заправка','Old Gas':'Старая заправка','Fortress':'Крепость','Crackhouse':'Медлаборатория','Streamer House':'Дом стримера','Repair Shop':'Ремонтная мастерская','Old Construction':'Старая стройка','Skeleton':'Скелет','Depot':'Депо','Warehouse 3':'Склад 3','Warehouse 4':'Склад 4','Warehouse 7':'Склад 7','Warehouse 17':'Склад 17','Military Checkpoint':'Военный КПП','Resort':'Санаторий','West Wing':'Западное крыло','East Wing':'Восточное крыло','Admin':'Администрация','Power Station':'Электростанция','Gas Station':'Заправка','Weather Station':'Метеостанция','Science Office':'Офис лаборанта','White Pawn':'Белая пешка','Black Pawn':'Чёрная пешка','White Bishop':'Белый слон','Black Bishop':'Чёрный слон','White King':'Белый король','Dome':'Купол','Kilmov Shopping Mall':'ТЦ «Климовский»','Cardinal Apartments':'ЖК Cardinal','Pinewood Hotel':'Отель Pinewood','Cinema':'Кинотеатр','Post Office':'Почта','School':'Школа','Vet Clinic':'Ветклиника','Abandon Factory':'Заброшенный завод','Marked Hotel':'Меченый отель','South Hotel':'Южный отель','Office':'Офис','Book Store':'Книжный','Goshan':'ГОШАН','Pharmacy 1':'Аптека','Pharmacy 2':'Аптека','Pharmacy 3':'Аптека'};
 function roomNumber(name){const m=name.match(/(?:комнат[аы]|номер[а]?|кабинет[а]?|квартир[аеуы])\s+(\d+[А-Яа-я]?)(?!\d)/u);return m?m[1]:null;}
 function building(map,lock){const n=lock.keyName;
  if(map.id==='customs'&&/общежит/i.test(n))return lock.position.x>210?'Общежитие · 2 этажа':'Общежитие · 3 этажа';
  if(map.id==='shoreline'&&/западного крыла/i.test(n))return 'Санаторий · западное крыло';
  if(map.id==='shoreline'&&/восточного крыла/i.test(n))return 'Санаторий · восточное крыло';
  if(/Concordia/i.test(n))return 'Concordia';if(/Pinewood/i.test(n))return 'Отель Pinewood';if(/Cardinal/i.test(n))return 'ЖК Cardinal';
  const address=n.match(/(?:Змейском|Приморском|Чеканной)\s+[\d–-]+/);if(address)return address[0].replace('Змейском','Змейский пер.,').replace('Приморском','Приморский пр.,').replace('Чеканной','Чеканная ул.,');
  return '';
 }
 function door(map,lock,floor){const number=roomNumber(lock.keyName),b=building(map,lock);return {id:lock.id,key:lock.key,number,building:b,floor,world:lock.position,label:number?(/квартир/i.test(lock.keyName)?'Кв. ':'')+number:lock.keyName.replace(/^Ключ (?:с пометкой )?от /,'').replace(/^подсобок/,'Подсобки').replace(/^комнаты/,'Комната').replace(/^кабинета/,'Кабинет'),title:lock.keyName,source:'tarkov.dev locks'};}
 root.FloorLabelData={roomNumber,building,door,translate:s=>ru[s]||s};if(typeof module!=='undefined')module.exports=root.FloorLabelData;
})(typeof window!=='undefined'?window:globalThis);

if(typeof window!=='undefined')window.FloorLabels=(()=>{
 const cache=new Map(),objectives=new Map(CATALOG.tasks.flatMap(t=>t.objectives).map(o=>[o.id,o]));let focused=null;
 const point=p=>RA.mapPoint(m(),p);
 function doors(){if(cache.has(state.map))return cache.get(state.map);const entries=m().locks.filter(l=>l.lockType==='door').map(l=>({...FloorLabelData.door(m(),l,estimateFloor(l.position)),p:point(l.position)}));cache.set(state.map,entries);return entries;}
 function objective(id){return objectives.get(id);}
 function forGoal(g){const o=objective(g.id),keys=new Set(RA.flatten(o?.requiredKeys).map(k=>k.id));
  const candidates=doors().filter(d=>d.floor===g.floor&&keys.has(d.key)&&Math.hypot(d.world.x-g.world.x,d.world.z-g.world.z)<22).sort((a,b)=>Math.hypot(a.world.x-g.world.x,a.world.z-g.world.z)-Math.hypot(b.world.x-g.world.x,b.world.z-g.world.z));
  const d=candidates[0],alternatives=new Set(candidates.map(d=>d.key)).size>1;return d?{door:d,label:alternatives?'Вход: '+d.label:d.number?(d.label.startsWith('Кв.')?'Квартира '+d.number:'Комната '+d.number):d.label,building:d.building}:null;
 }
 function activeContext(){return focused?.map===state.map?focused:null;}
 function detail(title,subtitle,key,related){const box=$('roomDetails');if(!box)return;box.replaceChildren();const close=E('button','roomClose','×');close.title='Закрыть';close.onclick=()=>{focused=null;box.hidden=true;draw();};box.append(close,E('strong','',title));if(subtitle)box.append(E('div','roomSubtitle',subtitle));if(key)box.append(E('div','roomKey',key));for(const g of related)box.append(E('div','roomTask',g.task+' — '+g.label));box.hidden=false;}
 function focus(g,d){const floor=g?.floor??d.floor,p=g?.p||d.p;setView(floor!==m().defaultFloor||state.map==='factory');showTransitionFloor(floor,[...p,floor]);if(mapViewer.isModel()){Factory3D.ready().then(()=>{if(state.floor===floor&&mapViewer.isModel())Factory3D.focusPoint([...p,floor]);});}else if(mapViewer.mode==='render'){const conf=mapViewer.config(),q=RouteProjection.project(p,imageProjection());if(conf.floorPlan){const w=$('viewport').clientWidth,h=$('viewport').clientHeight;mapViewer.scale=Math.min(mapViewer.limits()[1],Math.min(w/65,h/50));}mapViewer.center(...q);}else{state.view=[p[0]-32,p[1]-25,64,50];}draw();}

 function focusGoal(id){const g=goals().find(g=>g.id===id);if(!g)return;const loc=forGoal(g);focused={map:state.map,goal:id,door:loc?.door.id,floor:g.floor};focus(g,loc?.door);detail(loc?.label||'Цель задания',[loc?.building,m().floors[g.floor][1]].filter(Boolean).join(' · '),loc?.door.title,[g]);}
 function focusDoor(id){const d=doors().find(d=>d.id===id);if(!d)return;focused={map:state.map,door:id,floor:d.floor};focus(null,d);detail(d.number?(d.label.startsWith('Кв.')?'Квартира '+d.number:'Комната '+d.number):d.label,[d.building,m().floors[d.floor][1]].filter(Boolean).join(' · '),d.title,goals().filter(g=>forGoal(g)?.door.id===id));}
 function sync(){const c=activeContext();if(!c||c.floor!==state.floor){$('roomDetails').hidden=true;return;}if(c.goal&&!goals().some(g=>g.id===c.goal)){focused=null;$('roomDetails').hidden=true;}}
 function buildings(conf){
  let labels=m().labels.filter(l=>!/(?:St\.|Ave\.|Alley|Приморск|Prospect)/i.test(l.text));
  if(state.map==='customs')labels=[...labels.filter(l=>l.text!=='Dorms'),{position:[181,165],text:'Общежитие · 3 этажа'},{position:[230,147],text:'Общежитие · 2 этажа'}];
  if(state.map==='streets-of-tarkov'){const seen=new Set();for(const d of doors()){if(!/^(Змейский|Приморский|Чеканная)/.test(d.building)||seen.has(d.building))continue;seen.add(d.building);labels.push({position:[d.world.x,d.world.z],text:d.building,tolerance:4});}}
  if(state.map==='shoreline')labels=labels.filter(l=>['West Wing','East Wing','Admin'].includes(l.text));
  if(state.map==='reserve')return [];// Entrance labels already identify the bunker buildings.
  const portalBuildings=[];if(state.map==='ground-zero'&&!conf.underground){const seen=new Set();for(const entry of FloorTransitions.data[state.map]||[]){const end=[entry.a,entry.b].find(e=>e[0]===conf.layer),name=entry.name.split(' · ')[0];if(!end||seen.has(name))continue;seen.add(name);portalBuildings.push({p:[end[1],end[2]],text:name,kind:'building'});}labels=labels.filter(l=>!seen.has(l.text));}
  return [...portalBuildings,...labels.filter(l=>{
   if(state.map==='interchange'){const y=l.bottom===undefined?0:l.bottom+.5;return estimateFloor({x:l.position[0],z:l.position[1],y})===state.floor;}
   if(conf.underground)return false;
   if(l.bottom!==undefined&&l.top!==undefined&&l.top-l.bottom>=0&&l.top-l.bottom<15)return estimateFloor({x:l.position[0],z:l.position[1],y:l.bottom+.5})===state.floor;
   return true;
  }).map(l=>({p:point({x:l.position[0],z:l.position[1]}),text:FloorLabelData.translate(l.text),kind:'building',tolerance:l.tolerance??24})).filter(l=>conf.inkRects.some(r=>Math.hypot(Math.max(r[0]-l.p[0],0,l.p[0]-r[0]-r[2]),Math.max(r[1]-l.p[1],0,l.p[1]-r[1]-r[3]))<l.tolerance))];
 }
 function areas(svg,conf,scale){if(!conf.floorPlan)return;const group=S('g',{'data-goal-areas':'true'});for(const g of goals().filter(g=>g.floor===state.floor)){if(g.outline?.length>=3)group.append(S('polygon',{points:g.outline.map(p=>p.join(',')).join(' '),fill:'#ffcd502b',stroke:'#ffd365','stroke-width':1.5/scale,'stroke-dasharray':4/scale+' '+3/scale,'data-goal-area':g.id}));else group.append(S('circle',{cx:g.p[0],cy:g.p[1],r:18/scale,fill:'#ffcd5030',stroke:'#ffd365','stroke-width':1.2/scale,'data-goal-area':g.id}));}svg.append(group);}
 function labels(svg,conf,scale,payload){if(!conf.floorPlan)return;sync();const layer=S('g',{'data-floor-labels':conf.layer}),occupied=[],go=goals().filter(g=>g.floor===state.floor),ctx=activeContext();
  // Reserve route icons first; labels are laid out around them, never over them.
  for(const mark of payload.marks.filter(m=>m.p[2]===state.floor))occupied.push([mark.p[0]*scale-13,mark.p[1]*scale-13,26,26]);
  const overlap=(a,b)=>a[0]<b[0]+b[2]+3&&a[0]+a[2]+3>b[0]&&a[1]<b[1]+b[3]+3&&a[1]+a[3]+3>b[1];
  function place(entry){const anchor=entry.p.map(v=>v*scale),font=entry.kind==='building'?12:11,w=Math.max(26,entry.text.length*(entry.kind==='building'?7:6.6)+14,(entry.sub?.length||0)*5.3+14),h=entry.sub?35:23;
   const candidates=entry.kind==='building'?[[anchor[0]-w/2,anchor[1]-h-20],[anchor[0]-w/2,anchor[1]+18]]:[[anchor[0]+17,anchor[1]-h/2],[anchor[0]-w-17,anchor[1]-h/2],[anchor[0]-w/2,anchor[1]-h-18],[anchor[0]-w/2,anchor[1]+18]];
   if(entry.priority)for(let j=1;j<7;j++)candidates.push([anchor[0]+20,anchor[1]-h/2-j*(h+4)]);
   const box=candidates.map(c=>[...c,w,h]).find(b=>!occupied.some(a=>overlap(a,b)));if(!box)return;occupied.push(box);
   const [x,y]=box.map(v=>v/scale),gold=entry.kind==='goal'||entry.selected,group=S('g',{'data-floor-label':entry.kind,'data-label-id':entry.id||entry.text});
   if(entry.kind!=='building')group.append(S('line',{x1:entry.p[0],y1:entry.p[1],x2:Math.max(x,Math.min(entry.p[0],x+w/scale)),y2:Math.max(y,Math.min(entry.p[1],y+h/scale)),stroke:gold?'#ffd36a':'#98afc7','stroke-width':1/scale}));
   group.append(S('rect',{x,y,width:w/scale,height:h/scale,rx:4/scale,fill:gold?'#3d331beb':'#12202bed',stroke:gold?'#ffd36a':'#52687b','stroke-width':1/scale}));
   const t=S('text',{x:x+7/scale,y:y+15/scale,'font-size':font/scale,'font-weight':entry.kind==='room'?600:700,fill:gold?'#ffe6a2':'#deebf6'});t.textContent=entry.text;group.append(t);
   if(entry.sub){const sub=S('text',{x:x+7/scale,y:y+29/scale,'font-size':9/scale,fill:'#c5d0dd'});sub.textContent=entry.sub;group.append(sub);}
   const title=S('title');title.textContent=entry.title||entry.text;group.append(title);
   if(entry.click){group.style.pointerEvents='all';group.style.cursor='pointer';group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',entry.title||entry.text);group.onpointerdown=e=>e.stopPropagation();group.onclick=e=>{e.stopPropagation();entry.click();};group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();entry.click();}};}
   layer.append(group);
  }
  for(const g of go){const loc=forGoal(g),text=loc?.label||'Цель: '+g.task;place({p:state.route?.goalPoints?.[g.id]||g.p,text,sub:loc?(g.task.length>36?g.task.slice(0,34)+'…':g.task):undefined,title:[loc?.building,loc?.label,g.task,g.label].filter(Boolean).join(' · '),kind:'goal',id:g.id,priority:true,click:()=>focusGoal(g.id)});}
  for(const b of buildings(conf))place(b);
  const linked=new Set(go.map(g=>forGoal(g)?.door.id).filter(Boolean));
  for(const d of doors().filter(d=>d.floor===state.floor&&!linked.has(d.id)&&conf.inkRects.some(r=>Math.hypot(Math.max(r[0]-d.p[0],0,d.p[0]-r[0]-r[2]),Math.max(r[1]-d.p[1],0,d.p[1]-r[1]-r[3]))<8)).sort((a,b)=>Number(b.id===ctx?.door)-Number(a.id===ctx?.door))){if(!d.number&&scale<3)continue;place({p:d.p,text:d.label.length>29?d.label.slice(0,27)+'…':d.label,title:[d.building,d.title].filter(Boolean).join(' · '),kind:'room',id:d.id,selected:ctx?.door===d.id,priority:ctx?.door===d.id,click:()=>focusDoor(d.id)});}
  svg.append(layer);
 }
 return {doors,forGoal,focusGoal,focusDoor,areas,labels,sync,buildings};
})();
