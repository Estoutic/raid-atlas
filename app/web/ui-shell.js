(function(){
 function close(){ $('locationDrawer').hidden=true;$('drawerBackdrop').hidden=true;$('locationMenu').setAttribute('aria-expanded','false'); }
 $('locationMenu').onclick=()=>{const open=$('locationDrawer').hidden;$('locationDrawer').hidden=!open;$('drawerBackdrop').hidden=!open;$('locationMenu').setAttribute('aria-expanded',String(open));};
 $('closeLocations').onclick=close;$('drawerBackdrop').onclick=close;
 const atlasOpen=$('atlasBtn').onclick;$('atlasBtn').onclick=()=>{close();atlasOpen();};
 const sourceOpen=$('sourcesBtn').onclick;$('sourcesBtn').onclick=()=>{close();sourceOpen();};
 $('modeBtn').onclick=()=>{const open=$('modeMenu').hidden;$('modeMenu').hidden=!open;$('modeBtn').setAttribute('aria-expanded',String(open));};
 document.addEventListener('click',e=>{if(!e.target.closest('.modeControl')){$('modeMenu').hidden=true;$('modeBtn').setAttribute('aria-expanded','false');}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();$('modeMenu').hidden=true;}});
 function floorLabel(f,i){const id=f[0].toLowerCase();if(/underground|basement|bunker|tunnel/.test(id))return '−1';if(m().id==='interchange')return ['0','1','2'][i]||String(i);if(/second/.test(id))return '2';if(/third/.test(id))return '3';if(/fourth/.test(id))return '4';if(/fifth/.test(id))return '5';return '1';}
 function refresh(){
  $('locationList').replaceChildren(...CATALOG.maps.map(map=>{const b=E('button','locationRow'+(map.id===state.map?' selected':''));b.dataset.map=map.id;b.setAttribute('aria-current',String(map.id===state.map));b.append(E('span','',map.name));if(map.id===state.map)b.append(E('span','locationCheck','✓'));b.onclick=()=>{changeMap(map.id);setView(true);close();};return b;}));
  $('floorButtons').replaceChildren(...m().floors.map((f,i)=>{const b=E('button','floorButton'+(i===state.floor?' active':''),floorLabel(f,i));b.title=f[1];b.setAttribute('aria-label',f[1]);b.setAttribute('aria-pressed',String(i===state.floor));b.dataset.floor=i;b.onclick=()=>{$('floor').value=i;$('floor').dispatchEvent(new Event('change'));};return b;}));$('floorButtons').hidden=m().floors.length<2;
  $('planView').textContent='Схема';const floorPlan=window.FloorMaps?.get(state.map,state.floor);$('renderView').textContent=floorPlan?(floorPlan.underground?'Подземелье':m().floors[state.floor][1]):'Объём';$('togglePanel').textContent='◧';$('togglePanel').title=document.body.classList.contains('panelHidden')?'Показать панель':'Скрыть панель';
 }
 const floorChange=$('floor').onchange;$('floor').onchange=()=>{floorChange();refresh();};
 const panelToggle=$('togglePanel').onclick;$('togglePanel').onclick=()=>{panelToggle();refresh();};
 window.RaidUI={refresh,close};refresh();
})();
