(function(root){
 function words(s){return root.RA.normalize(s).replace(/запад[а-я]*/g,'запад').replace(/восточ[а-я]*/g,'восток').replace(/крыл[а-я]*/g,'крыло').split(' ').filter(Boolean);}
 function matches(query,text){const hay=words(text);return words(query).every(q=>hay.some(w=>/^\d+$/.test(q)?w===q:w.startsWith(q)));}
 function index(catalog){const entries=[];for(const map of catalog.maps){if(!map.hasPlan||map.manual)continue;
  for(const lock of map.locks.filter(l=>l.lockType==='door')){const floor=root.RA.floorFor(map,lock.position),d=root.FloorLabelData.door(map,lock,floor),title=d.number?(d.label.startsWith('Кв.')?'Квартира ':'Комната ')+d.number:d.label;entries.push({kind:'room',id:lock.id,map:map.id,floor,p:root.RA.mapPoint(map,lock.position),title,subtitle:[d.building,map.name,map.floors[floor][1]].filter(Boolean).join(' · '),search:[title,d.title,d.building,map.name,/запад/i.test(d.building)?'зк west wing':'',/восточ/i.test(d.building)?'вк east wing':''].join(' ')});}
  let labels=map.labels;if(map.id==='customs')labels=[...labels.filter(l=>l.text!=='Dorms'),{text:'Общежитие · 3 этажа',position:[181,165]},{text:'Общежитие · 2 этажа',position:[230,147]}];
  for(const label of labels){const title=root.FloorLabelData.translate(label.text),heightScoped=label.bottom!==undefined&&(map.id==='interchange'||label.top-label.bottom<15),floor=heightScoped?root.RA.floorFor(map,{x:label.position[0],z:label.position[1],y:label.bottom+.5}):map.defaultFloor,p=root.RA.mapPoint(map,{x:label.position[0],z:label.position[1]});entries.push({kind:'building',id:label.text,map:map.id,floor,p,title,subtitle:map.name+' · '+map.floors[floor][1],search:[title,label.text,map.name].join(' ')});}
 }return entries;}
 root.PlaceSearchData={words,matches,index};if(typeof module!=='undefined')module.exports=root.PlaceSearchData;
})(typeof window!=='undefined'?window:globalThis);
if(typeof window!=='undefined')window.PlaceSearch=(()=>{
 const entries=PlaceSearchData.index(CATALOG);let results=[],active=0;
 function hide(){$('placeResults').hidden=true;$('placeSearch').setAttribute('aria-expanded','false');}
 function open(entry){if(state.map!==entry.map)changeMap(entry.map);hide();$('placeSearch').value=entry.title;if(entry.kind==='room'){FloorLabels.focusDoor(entry.id);return;}
  $('floor').value=entry.floor;$('floor').dispatchEvent(new Event('change'));setView(false);const width=Math.min(m().viewBox[2],110),height=Math.min(m().viewBox[3],90);state.view=[entry.p[0]-width/2,entry.p[1]-height/2,width,height];draw();status(entry.title);
 }
 function search(q){if(!q.trim())return [];const numeric=/\d/.test(q);return entries.filter(e=>PlaceSearchData.matches(q,e.search)).sort((a,b)=>(numeric?Number(a.kind!=='room')-Number(b.kind!=='room'):Number(a.kind!=='building')-Number(b.kind!=='building'))||Number(b.map===state.map)-Number(a.map===state.map)||a.title.localeCompare(b.title,'ru')).slice(0,14);}
 function paint(){const box=$('placeResults');box.replaceChildren(...(results.length?results.map((r,i)=>{const b=E('button','placeResult'+(i===active?' active':''));b.append(E('strong','',r.title),E('small','',r.subtitle));b.onpointerdown=e=>e.preventDefault();b.onclick=()=>open(r);return b;}):[E('p','muted','Нет совпадений')]));box.hidden=false;$('placeSearch').setAttribute('aria-expanded','true');}
 $('placeSearch').oninput=()=>{results=search($('placeSearch').value);active=0;if(!$('placeSearch').value.trim())hide();else paint();};$('placeSearch').onfocus=()=>{if($('placeSearch').value) $('placeSearch').oninput();};
 $('placeSearch').onkeydown=e=>{if(e.key==='Escape'){hide();return;}if(e.key==='Enter'){e.preventDefault();if(results[active])open(results[active]);}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(results.length){active=(active+(e.key==='ArrowDown'?1:-1)+results.length)%results.length;paint();$('placeResults').children[active]?.scrollIntoView({block:'nearest'});}}};
 document.addEventListener('click',e=>{if(!e.target.closest('.placeSearch'))hide();});return {search,open};
})();
