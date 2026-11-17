/* User-authored image-space waypoints, deliberately separate from computed paths. */
(function(){
 const list=()=>state.manual[state.map]||[];
 function refresh(){
  const manual=!!m().manual;$('autoPlan').hidden=manual;$('manualPlan').hidden=!manual;$('routeHeading').textContent=manual?'Ручной план':'Маршрут';$('startBtn').disabled=false;$('startBtn').textContent=manual?'＋ Точки':'＋ Старт';
  $('manualAdd').textContent=state.manualEdit?'Готово':'Добавить точки';$('manualUndo').disabled=!list().length;$('manualClear').disabled=!list().length;$('renderPane').classList.toggle('placing',state.manualEdit||state.place);
  $('manualList').replaceChildren(...list().map((p,i)=>{const r=E('div','manualPoint'),input=E('input'),rm=E('button','','×');input.value=p.label||'';input.placeholder=i===0?'Старт':'Точка '+(i+1);input.setAttribute('aria-label','Название точки '+(i+1));input.onchange=()=>{p.label=input.value;persist();paintImageRoute();};rm.title='Удалить точку';rm.onclick=()=>{list().splice(i,1);persist();refresh();paintImageRoute();};r.append(E('b','',String(i+1)),input,rm);return r;}));
 }
 function edit(){if(!m().manual)return;state.manualEdit=!state.manualEdit;state.place=false;setView(true);tab('route');refresh();status(state.manualEdit?'Нажимай на карту, чтобы добавить точки.':'');}
 $('manualAdd').onclick=edit;$('manualUndo').onclick=()=>{list().pop();persist();refresh();paintImageRoute();};$('manualClear').onclick=()=>{state.manual[state.map]=[];persist();refresh();paintImageRoute();};
 window.handleImageClick=e=>{
  const b=$('renderPane').getBoundingClientRect(),p=[(e.clientX-b.left-mapViewer.x)/mapViewer.scale,(e.clientY-b.top-mapViewer.y)/mapViewer.scale],size=mapViewer.config().size;
  if(p.some((x,i)=>x<0||x>size[i]))return;
  if(m().manual&&state.manualEdit){(state.manual[state.map]??=[]).push({p,label:''});persist();refresh();paintImageRoute();return;}
  if(state.place){const data=imageProjection();if(!data)return;const inv={source:data.target,target:data.source,triangles:data.triangles,affine:data.inverseAffine};const q=RouteProjection.project(p,inv);if(q.some((x,i)=>x<0||x>m().viewBox[i+2]))return status('Выбери место внутри локации.');state.starts[state.map]={p:q,floor:state.floor};state.place=false;invalidate();refresh();status('');}
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){state.manualEdit=false;state.place=false;refresh();}});
 window.ManualPlan={refresh,edit};refresh();
})();
