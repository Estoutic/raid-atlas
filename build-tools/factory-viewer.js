import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import dracoSource from './node_modules/three/examples/jsm/libs/draco/draco_decoder.js.txt';
// Original TKL models are loaded unchanged. Camera and annotations are separate.
let scene,camera,renderer,controls,root,active=false,frame=0,epoch=0,currentFloor=-1;
const cache=new Map();let loading=null;let annotationGroup=null,annotationData={segments:[],marks:[],exits:[]};let exitLayer=null,exitButtons=[];
function viewport(){return document.getElementById('factoryScene');}
function render(){if(!active)return;renderer.render(scene,camera);positionExits();}
function resize(){if(!renderer)return;const p=viewport(),w=p.clientWidth,h=p.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const span=180;camera.left=-span*w/h;camera.right=span*w/h;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();render();}
function init(){
 if(renderer)return;
 const pane=viewport();scene=new THREE.Scene();scene.background=new THREE.Color('#101823');
 camera=new THREE.OrthographicCamera(-250,250,180,-180,.1,3000);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;pane.append(renderer.domElement);exitLayer=document.createElement('div');exitLayer.className='modelExits';pane.append(exitLayer);
 scene.add(new THREE.HemisphereLight(0xf4f8ff,0x64747b,1.5));const sun=new THREE.DirectionalLight(0xffffff,2.0);sun.position.set(160,300,180);scene.add(sun);
 controls=new OrbitControls(camera,renderer.domElement);controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI/2-.05;controls.enableDamping=false;controls.zoomToCursor=true;controls.addEventListener('change',render);
 new ResizeObserver(resize).observe(pane);resize();
}
function fit(){if(!root)return;const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());controls.target.copy(center);const r=Math.max(size.x,size.z);camera.position.copy(center).add(new THREE.Vector3(r*.8,r*1.2,r*.9));camera.zoom=Math.min((camera.right-camera.left)/(r*1.5),360/(r*1.15));camera.updateProjectionMatrix();controls.update();render();}
async function model(floor){
 if(cache.has(floor))return cache.get(floor);
 const decoder=new DRACOLoader();decoder.setDecoderConfig({type:'js'});decoder.setWorkerLimit(1);decoder._loadLibrary=()=>Promise.resolve(dracoSource);
 const loader=new GLTFLoader().setDRACOLoader(decoder);const raw=atob(window.FACTORY_MODELS[floor]);const data=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;
 try{const gltf=await loader.parseAsync(data,'');cache.set(floor,gltf.scene);return gltf.scene;}finally{decoder.dispose();}
}
async function show(floor){
 init();active=true;viewport().hidden=false;resize();const token=++epoch;
 if(currentFloor===floor&&root){drawAnnotations();render();return;}
 const label=document.getElementById('sceneStatus');label.hidden=false;label.textContent='Загружаю объёмный Завод…';
 loading=model(floor);try{const next=await loading;if(token!==epoch)return;if(root)scene.remove(root);root=next;scene.add(root);currentFloor=floor;fit();drawAnnotations();label.hidden=true;}catch(e){label.textContent='Модель не загрузилась. Переключись на план этажей.';console.error(e);throw e;}
}
function hide(){active=false;epoch++;if(viewport())viewport().hidden=true;}

// Independent annotation geometry; the original TKL model is not changed.
function projectPoint(p){const shifts={0:-.098,1:0,2:-7.4295,3:8.2495},heights={0:-3.5,1:.8,2:10.3,3:20};return new THREE.Vector3(p[0]*1.76-114.4+shifts[p[2]],heights[p[2]],p[1]*1.83-120);}
function ribbon(points,width,color,order){const v=[];for(let i=1;i<points.length;i++){const a=projectPoint(points[i-1]),b=projectPoint(points[i]),dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)continue;const x=-dz/len*width/2,z=dx/len*width/2;v.push(a.x+x,a.y,a.z+z,a.x-x,a.y,a.z-z,b.x+x,b.y,b.z+z,b.x+x,b.y,b.z+z,a.x-x,a.y,a.z-z,b.x-x,b.y,b.z-z);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));mesh.renderOrder=order;return mesh;}
function positionExits(){if(!exitLayer||!camera)return;const pane=viewport();for(const {button,point}of exitButtons){const p=projectPoint(point).project(camera);button.hidden=p.z< -1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1;button.style.left=((p.x+1)*pane.clientWidth/2)+'px';button.style.top=((1-p.y)*pane.clientHeight/2)+'px';button.classList.toggle('edgeRight',(p.x+1)*pane.clientWidth/2+button.offsetWidth>pane.clientWidth-12);}}
function drawExits(){if(!exitLayer)return;exitLayer.replaceChildren();exitButtons=[];for(const ex of annotationData.exits||[]){if(!ex.overview&&ex.p[2]!==currentFloor)continue;const button=document.createElement('button');button.className='modelExit'+(ex.selected?' selected':'')+(ex.available?' available':'');button.dataset.index=ex.index;button.setAttribute('aria-label','Выбрать выход: '+ex.name);button.setAttribute('aria-pressed',String(ex.selected));button.title=ex.name+(ex.available?' · Доступен в рейде':'');const symbol=document.createElement('span');symbol.className='modelExitSymbol';symbol.textContent=ex.selected?'✓':'↗';const label=document.createElement('span');label.className='modelExitName';label.textContent=ex.name+(ex.level?' · '+ex.level:'');button.append(symbol,label);button.onpointerdown=e=>e.stopPropagation();button.ondblclick=e=>e.stopPropagation();button.onclick=e=>{e.stopPropagation();window.selectExit(ex.index,false);};exitLayer.append(button);exitButtons.push({button,point:ex.p});}positionExits();}
function focusPoint(point){if(!root)return;const target=projectPoint(point),offset=camera.position.clone().sub(controls.target);controls.target.copy(target);camera.position.copy(target).add(offset);controls.update();render();}
function drawAnnotations(){if(!renderer||!root)return;drawExits();if(annotationGroup){scene.remove(annotationGroup);annotationGroup.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}annotationGroup=new THREE.Group();scene.add(annotationGroup);
 for(const seg of annotationData.segments){if(seg.floor!==currentFloor)continue;annotationGroup.add(ribbon(seg.points,2.2,0x17212d,20),ribbon(seg.points,1.1,0xffd15c,21));}
 for(const mark of annotationData.marks){if(mark.p[2]!==currentFloor)continue;const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');c.beginPath();c.arc(64,64,51,0,Math.PI*2);c.fillStyle=mark.color;c.fill();c.lineWidth=9;c.strokeStyle='#152232';c.stroke();c.fillStyle='#12202a';c.font='bold 58px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(mark.label,64,65);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false,depthWrite:false}));sprite.position.copy(projectPoint(mark.p));sprite.position.y+=1.2;sprite.scale.set(10,10,1);sprite.renderOrder=22;annotationGroup.add(sprite);}
 render();
}
window.Factory3D={focusPoint,exitInfo(){return exitButtons.map(({button,point})=>({index:Number(button.dataset.index),floor:point[2],selected:button.getAttribute('aria-pressed')==='true',hidden:button.hidden,x:parseFloat(button.style.left),y:parseFloat(button.style.top)}));},overlay(data){annotationData=data;drawAnnotations();},annotationInfo(){return {floor:currentFloor,segments:annotationData.segments.filter(s=>s.floor===currentFloor).length,marks:annotationData.marks.filter(m=>m.p[2]===currentFloor).length,children:annotationGroup?.children.length||0};},top(){camera.position.copy(controls.target).add(new THREE.Vector3(0,500,.001));controls.update();render();},details(){let ys=new Map();root.traverse(o=>{let a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++){let y=Math.round(a.getY(i)*10)/10;ys.set(y,(ys.get(y)||0)+1);}});let b=new THREE.Box3().setFromObject(root);return {min:b.min.toArray(),max:b.max.toArray(),ys:[...ys].sort((a,b)=>b[1]-a[1]).slice(0,15)};},show,hide,fit,zoom(factor){if(!camera)return;camera.zoom=Math.max(.2,Math.min(20,camera.zoom*factor));camera.updateProjectionMatrix();render();},rotate(){if(!root)return;const d=camera.position.clone().sub(controls.target);d.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);camera.position.copy(controls.target).add(d);controls.update();render();},async ready(){if(loading)await loading;},info(){return {loaded:!!root,floor:currentFloor,meshes:root?root.children.length:0,triangles:renderer?.info.render.triangles,webgl:!!renderer,bounds:root?new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).toArray():[]};}};
