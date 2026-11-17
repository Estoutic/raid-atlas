/* Navigation over the original RE3MR image; anchors refer to printed exit symbols,
   not to inferred 3D geometry and are never used for route calculation. */
const RENDER_MAPS = {
  factory: {
    size:[2048,1014],file:'factory-web-render.png',
    regions:{0:[1495,116,548,561],1:[987,116,513,561],2:[496,116,492,561],3:[4,116,491,561]},
    anchors:{
      '4b93f765fc6e0b6379679b3c827074d4e57ff680':[1475,490],
      'f261d229a5b13a3292a4a49dced2a4949dfc342b':[1863,142],
      'f16ce849a9d153a8813b6bf6a049d530f1cc44c2':[1011,204],
      '51efd2aabf8b603f7a5d54327aa3d8a94e22af6b':[1902,211],
      'b1e817c36812ebf2a8b1ac141ca88449a0b0469c':[999,332],
      'f3494ee4a96ff19ab2946746e7e15ba0d12871dc':[1423,242],
      '99c2f21880da0baf75d431a5f45b462fde2f79b1':[1046,663]
    }
  },
  'customs-realistic': {
    size:[1984,1271],file:'customs-web-render.png',regions:{1:[15,195,1955,790]},
    anchors:{
      'ab12c1f902a669fb0c940820e8cc40d7131e3208':[1926,568],
      '1dd5cede4fa747d279b076872c45fc59a4c3b916':[961,315],
      '3f7e27d7bae8ffb6e3004af071b18bf0e7d896b8':[1018,390],
      '59c2c12e375a1b45a8e5ac1a32c5581b593aa4df':[134,419],
      'f4cdf3dbe54ef647a2a798266a39f1761f871b96':[1883,334],
      'fed921b46204418ef8fa0174468c6886e91325c4':[975,961],
      'c936f6e98a38c78963a308892b708474c54f4718':[693,382],
      'c1e0123c42bbd048096fffbe5c98fa28e866680b':[1368,860],
      'cdae9cc1c431a141431e9022a901eaaa70ef67ea':[443,447]
    }
  },
  customs: {
    size:[2048,1152],file:'customs-classic-render.png',regions:{1:[0,130,2048,850]},
    anchors:{
      'ab12c1f902a669fb0c940820e8cc40d7131e3208':[2014,375],
      'aa56e9228b8452533873eeffa11b587007f49429':[1367,280],
      '1dd5cede4fa747d279b076872c45fc59a4c3b916':[930,182],
      '3f7e27d7bae8ffb6e3004af071b18bf0e7d896b8':[1086,243],
      '59c2c12e375a1b45a8e5ac1a32c5581b593aa4df':[219,339],
      'f4cdf3dbe54ef647a2a798266a39f1761f871b96':[1877,150],
      'fed921b46204418ef8fa0174468c6886e91325c4':[1130,922],
      'c936f6e98a38c78963a308892b708474c54f4718':[777,255],
      'c1e0123c42bbd048096fffbe5c98fa28e866680b':[1533,746],
      'cdae9cc1c431a141431e9022a901eaaa70ef67ea':[494,343]
    }
  }

};

Object.assign(RENDER_MAPS,window.EXTRA_RENDER_MAPS||{});
class RenderCamera {
  constructor(pane,image){
    this.pane=pane;this.image=image;this.x=0;this.y=0;this.scale=1;this.map=null;
    this.drag=null;this.mode='render';this.cameras={};this.style='classic';this.factoryStyle='model';
    image.draggable=false;
    pane.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('button,input,#miniMap'))return;
      this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:this.x,oy:this.y};
      if(e.isTrusted)pane.setPointerCapture(e.pointerId);
      pane.classList.add('dragging');
    });
    pane.addEventListener('pointermove',e=>{
      if(!this.drag||e.pointerId!==this.drag.id)return;
      this.x=this.drag.ox+e.clientX-this.drag.x;this.y=this.drag.oy+e.clientY-this.drag.y;this.paint();
    });
    const end=e=>{if(this.drag&&e.type==='pointerup'&&Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)<5)window.handleImageClick?.(e);this.drag=null;pane.classList.remove('dragging');};
    pane.addEventListener('pointerup',end);pane.addEventListener('pointercancel',end);pane.addEventListener('lostpointercapture',end);
    pane.addEventListener('wheel',e=>{
      e.preventDefault();const box=pane.getBoundingClientRect();
      if(e.shiftKey){this.x-=e.deltaX||e.deltaY;this.y-=e.deltaX?e.deltaY:0;this.paint();}
      else this.zoom(Math.exp(-Math.max(-150,Math.min(150,e.deltaY))*.004),e.clientX-box.left,e.clientY-box.top);
    },{passive:false});
    pane.addEventListener('dblclick',e=>{if(state.manualEdit||state.place)return;if(e.target.closest('button,input,#miniMap'))return;const b=pane.getBoundingClientRect();this.zoom(1.8,e.clientX-b.left,e.clientY-b.top);});
    let gestureScale=1;
    pane.addEventListener('gesturestart',e=>{e.preventDefault();gestureScale=e.scale||1;});
    pane.addEventListener('gesturechange',e=>{e.preventDefault();this.zoom(e.scale/gestureScale);gestureScale=e.scale;});
    $('miniMap').onclick=e=>{
      const b=$('miniMap').getBoundingClientRect(),[w,h]=this.config().size;
      this.center((e.clientX-b.left)/b.width*w,(e.clientY-b.top)/b.height*h);
    };
    new ResizeObserver(()=>{if(!this.map||this.mode!=='render')return;this.paint();}).observe(pane);
  }
  isModel(){return state.map==='factory'&&this.factoryStyle==='model'&&this.mode==='render';}
  config(){return window.FloorMaps?.get(this.map,state.floor)||RENDER_MAPS[this.map==='customs'&&this.style==='realistic'?'customs-realistic':this.map];}
  remember(){if(this.key)this.cameras[this.key]={x:this.x,y:this.y,scale:this.scale};}
  useMap(id){
    const floorPlan=window.FloorMaps?.get(id,state.floor),key=id+(floorPlan?':'+floorPlan.layer:'')+(id==='customs'?':'+this.style:'');
    if(key===this.key){this.loadImage();return;}
    this.remember();this.map=id;this.key=key;const old=this.cameras[key];
    this.loadImage();
    if(old&&old.scale>0)Object.assign(this,old);else this.fitFloor(false);
    this.paint();
  }
  loadImage(){const conf=this.config(),src=conf.src||'data/'+(conf.file||m().reference);if(this.image.getAttribute('src')!==src)this.image.src=src;if($('miniImage').getAttribute('src')!==src)$('miniImage').src=src;this.image.alt=conf.floorPlan?m().floors[state.floor][1]+' — план этажа':'Объёмная карта';this.pane.dataset.layer=conf.floorPlan?conf.layer:'surface';
    // Draw interiors directly as vectors in a viewport-sized SVG. CSS scaling
    // lets WebKit magnify a cached texture, blurring both walls and room labels.
    this.image.style.display=conf.floorPlan?'none':'block';
    if(conf.floorPlan){
      if(this.floorSource!==src){
        this.floorImage?.remove();
        this.floorImage=document.importNode(new DOMParser().parseFromString(decodeURIComponent(src.slice(src.indexOf(',')+1)),'image/svg+xml').documentElement,true);
        this.floorImage.id='renderFloor';this.floorImage.setAttribute('aria-label',this.image.alt);
        this.floorImage.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';
        this.image.after(this.floorImage);this.floorSource=src;
      }
      this.floorImage.style.display='block';
    }else if(this.floorImage)this.floorImage.style.display='none';
    if(state.map==='customs')$('renderStyle').hidden=this.mode!=='render'||!!conf.floorPlan;}
  vectorCamera(svg){
    const pw=this.pane.parentElement.clientWidth,ph=this.pane.parentElement.clientHeight,s=this.scale;
    svg.setAttribute('viewBox',[-this.x/s,-this.y/s,pw/s,ph/s].join(' '));
    svg.setAttribute('preserveAspectRatio','none');
    svg.style.width=pw+'px';svg.style.height=ph+'px';svg.style.transform='none';
  }
  fitRect(rect){
    const [x,y,w,h]=rect,p=this.pane.parentElement;
    this.scale=Math.min((p.clientWidth-64)/w,(p.clientHeight-64)/h);
    this.x=p.clientWidth/2-(x+w/2)*this.scale;this.y=p.clientHeight/2-(y+h/2)*this.scale;this.paint();
  }
  fitAll(){const [w,h]=this.config().size;this.fitRect([0,0,w,h]);}
  fitFloor(paint=true){
    const conf=this.config(),rect=conf.regions[state.floor]||conf.regions[1];
    if(paint)this.fitRect(rect);else {const [x,y,w,h]=rect;this.scale=Math.min((this.pane.parentElement.clientWidth-64)/w,(this.pane.parentElement.clientHeight-64)/h);this.x=this.pane.parentElement.clientWidth/2-(x+w/2)*this.scale;this.y=this.pane.parentElement.clientHeight/2-(y+h/2)*this.scale;}
  }
  limits(){const [w,h]=this.config().size;const fit=Math.min(this.pane.parentElement.clientWidth/w,this.pane.parentElement.clientHeight/h);return [fit*.65,fit*24];}
  zoom(factor,cx=this.pane.parentElement.clientWidth/2,cy=this.pane.parentElement.clientHeight/2){
    const [min,max]=this.limits(),s=Math.max(min,Math.min(max,this.scale*factor)),r=s/this.scale;
    this.x=cx-(cx-this.x)*r;this.y=cy-(cy-this.y)*r;this.scale=s;this.paint();
  }
  center(x,y){this.x=this.pane.parentElement.clientWidth/2-x*this.scale;this.y=this.pane.parentElement.clientHeight/2-y*this.scale;this.paint();}
  focusExit(index){
    const a=this.config().anchors[m().extracts[index]?.id];if(!a)return false;
    const minScale=this.map==='factory'?1.5:1.25;
    this.scale=Math.max(this.scale,minScale);this.center(...a);return true;
  }
  paint(){
    if(!this.map||this.pane.parentElement.clientWidth===0)return;
    const [w,h]=this.config().size,pw=this.pane.parentElement.clientWidth,ph=this.pane.parentElement.clientHeight;
    // Keep at least a strip of the map visible while allowing edge exits to be centred.
    this.x=Math.max(80-w*this.scale,Math.min(pw-80,this.x));this.y=Math.max(80-h*this.scale,Math.min(ph-80,this.y));
    this.image.style.width=w+'px';this.image.style.height=h+'px';
    this.image.style.transform=`translate(${this.x}px,${this.y}px) scale(${this.scale})`;
    if(this.config().floorPlan&&this.floorImage)this.vectorCamera(this.floorImage);
    for(const pin of $('renderPins').children){const a=this.config().anchors[pin.dataset.id];if(!a)continue;pin.style.left=(this.x+a[0]*this.scale)+'px';pin.style.top=(this.y+a[1]*this.scale)+'px';pin.classList.toggle('edgeRight',this.x+a[0]*this.scale>pw-150);pin.classList.toggle('edgeLeft',this.x+a[0]*this.scale<150);}
    const fit=Math.min(pw/w,ph/h);$('zoomValue').textContent=Math.round(this.scale/fit*100)+'%';
    const mini=$('miniMap');mini.style.aspectRatio=w+'/'+h;
    const left=Math.max(0,-this.x/this.scale),top=Math.max(0,-this.y/this.scale),right=Math.min(w,(pw-this.x)/this.scale),bottom=Math.min(h,(ph-this.y)/this.scale);
    Object.assign($('miniWindow').style,{left:left/w*100+'%',top:top/h*100+'%',width:Math.max(0,right-left)/w*100+'%',height:Math.max(0,bottom-top)/h*100+'%'});
    this.remember();if(window.paintImageRoute)paintImageRoute();
  }
  pins(){
    this.useMap(state.map);window.prepareImageAnchors?.();const list=[];
    if(state.showExits!==false)for(const [i,ex]of m().extracts.entries()){
      if(!exitVisible(ex)||!this.config().anchors[ex.id])continue;
      const pin=E('button','imageExit'+(String(state.exit[state.map])===String(i)?' selected':'')+(exitAvailable(i)?' available':''));
      pin.dataset.id=ex.id;pin.dataset.index=i;pin.title=ex.name+' · '+exitFaction(ex)+' · '+m().floors[exitFloor(ex)][1]+(exitAvailable(i)?' · Доступен в рейде':'');pin.setAttribute('aria-label','Выбрать выход: '+ex.name);pin.setAttribute('aria-pressed',String(String(state.exit[state.map])===String(i)));
      pin.append(E('span','pinSymbol',String(state.exit[state.map])===String(i)?'✓':'↗'),E('span','pinName',ex.name+' · '+exitFaction(ex)+' · '+m().floors[exitFloor(ex)][1]));
      if(exitOverview()&&exitLevelLabel(ex))pin.append(E('span','exitLevelBadge',exitLevelLabel(ex)));
      pin.onclick=e=>{e.stopPropagation();selectExit(i,false);};
      list.push(pin);
    }
    $('renderPins').replaceChildren(...list);this.paint();
  }
}

window.mapViewer=new RenderCamera($('renderPane'),$('renderImage'));
mapViewer.setMode=function(ref){
  this.mode=ref?'render':'plan';$('renderPane').hidden=!ref;$('mapSvg').style.display=ref?'none':'';
  $('miniMap').hidden=!ref;$('renderCaption').hidden=!ref;$('renderCaption').style.top=state.map==='factory'?'12px':'53px';$('renderStyle').hidden=!ref||state.map!=='customs';$('renderCaption').textContent=state.map==='customs'&&this.style==='classic'?'Карта из твоего примера · архивная версия RE3MR':!['factory','customs'].includes(state.map)?'RE3MR · карта локации':'Обозначения выходов на карте RE3MR';
  $('mapHint').textContent=ref?'Перетаскивай карту · прокрутка — масштаб · двойной клик — приблизить':'Перетаскивай карту · прокрутка — масштаб · нажми на выход';
  $('floor').disabled=false;
  $('zoomValue').hidden=!ref;
  this.useMap(state.map);window.prepareImageAnchors?.();this.pins();
  const model=ref&&state.map==='factory'&&this.factoryStyle==='model';
  $('rotateBtn').hidden=!model;
  $('showExits').closest('label').hidden=ref&&!model&&Object.keys(this.config().anchors).length===0;
  if(model){$('renderPane').hidden=true;$('miniMap').hidden=true;$('zoomValue').hidden=true;$('renderCaption').textContent='Готовая модель TKL / EFT Library · CC BY-NC-ND 4.0';$('mapHint').textContent='Перетаскивай — перемещение · прокрутка — масштаб · правая кнопка — поворот';Factory3D.show(state.floor).catch(e=>status('Не удалось загрузить объёмный этаж: '+e.message));}
  else Factory3D.hide();
  $('renderStyle').hidden=!ref||!!this.config().floorPlan||!['factory','customs'].includes(state.map);
  if($('renderStyle').dataset.map!==state.map){$('renderStyle').dataset.map=state.map;$('renderStyle').replaceChildren(...(state.map==='factory'?[new Option('Объёмный Завод','model'),new Option('План этажей','plan')]:[new Option('Как в примере','classic'),new Option('Обновлённая карта','realistic')]));}
  $('renderStyle').value=state.map==='factory'?this.factoryStyle:this.style;
  $('renderCaption').style.top=['factory','customs'].includes(state.map)?'53px':'12px';

  $('renderView').classList.toggle('on',ref);$('planView').classList.toggle('on',!ref);
  $('renderView').setAttribute('aria-pressed',String(ref));$('planView').setAttribute('aria-pressed',String(!ref));
  $('mapFoot').textContent=model?'Маршрут на выбранном этаже · привязка приблизительная':ref&&state.map==='customs'?'Маршрут поверх карты · привязка приблизительная · этажи пунктиром':ref?'RE3MR · готовая карта с объёмным видом':'Маршрут по схеме · экспериментально';updateRouteOverlays();
};
$('fitBtn').onclick=()=>{if(mapViewer.isModel())Factory3D.fit();else if(mapViewer.mode==='render')mapViewer.fitFloor();else{state.view=null;draw();}};
$('allBtn').onclick=()=>{if(mapViewer.isModel())Factory3D.fit();else if(mapViewer.mode==='render')mapViewer.fitAll();else{state.view=null;draw();}};
function zoomActive(factor){if(mapViewer.isModel()){Factory3D.zoom(factor);return;}if(mapViewer.mode==='render')mapViewer.zoom(factor);else{const v=state.view,r=1/factor;state.view=[v[0]+v[2]*(1-r)/2,v[1]+v[3]*(1-r)/2,v[2]*r,v[3]*r];draw();}}
$('zoomIn').onclick=()=>zoomActive(1.35);$('zoomOut').onclick=()=>zoomActive(1/1.35);
$('floor').onchange=()=>{state.floor=Number($('floor').value);draw();if(mapViewer.isModel())Factory3D.show(state.floor).catch(e=>status(e.message));else if(mapViewer.mode==='render')mapViewer.fitFloor();window.ManualPlan?.refresh();};
$('showExits').onchange=()=>{state.showExits=$('showExits').checked;draw();mapViewer.pins();};
$('togglePanel').onclick=()=>{document.body.classList.toggle('panelHidden');$('togglePanel').textContent=document.body.classList.contains('panelHidden')?'Показать панель':'Скрыть панель';};
$('quickExits').onclick=()=>{document.body.classList.remove('panelHidden');$('togglePanel').textContent='Скрыть панель';tab('exits');};
$('clearExit').onclick=()=>selectExit('',false);
$('exitSearch').oninput=renderExitList;
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')||$('sources').open||$('atlasDialog').open)return;
  if(e.key==='Escape'){state.place=false;draw();return;}
  if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')$('fitBtn').click();else zoomActive(e.key==='-'?1/1.25:1.25);}
  if(mapViewer.mode==='render'&&!mapViewer.isModel()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();mapViewer.x+=e.key==='ArrowLeft'?80:e.key==='ArrowRight'?-80:0;mapViewer.y+=e.key==='ArrowUp'?80:e.key==='ArrowDown'?-80:0;mapViewer.paint();}
});
$('rotateBtn').onclick=()=>Factory3D.rotate();
$('renderStyle').onchange=()=>{if(state.map==='factory')mapViewer.factoryStyle=$('renderStyle').value;else mapViewer.style=$('renderStyle').value;mapViewer.setMode(true);if(!mapViewer.isModel())mapViewer.fitFloor();renderExit();};
setView(true);renderExit();draw();

$('mapTotal').textContent=CATALOG.maps.length;
$('mapSelect').replaceChildren(...CATALOG.maps.map(x=>new Option(x.name,x.id)));$('mapSelect').value=state.map;
$('mapSelect').onchange=()=>changeMap($('mapSelect').value);
$('atlasBtn').onclick=()=>$('atlasDialog').showModal();$('closeAtlas').onclick=()=>$('atlasDialog').close();
for(const map of CATALOG.maps){const card=E('button','atlasCard');card.dataset.map=map.id;
 if(!['factory','customs'].includes(map.id)){const im=E('img');im.src='data/thumbs/'+map.id+'.jpg';im.alt='';im.loading='lazy';card.append(im);}else card.append(E('div','atlasPlaceholder',map.id==='factory'?'3D':'↗'));
 card.append(E('b','',map.name),E('small','',map.id==='factory'?'Объёмная модель · 4 этажа':map.routing?'Карта и расчёт маршрута':'Карта и ручной план'));card.onclick=()=>{$('atlasDialog').close();changeMap(map.id);setView(true);};$('atlasCards').append(card);}
