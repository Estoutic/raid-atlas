// Actual pointer-driven recordings. No fabricated routes or UI overlays beyond the visible cursor.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {start,root}=require('./runtime.cjs');
const out=path.join(root,'cache/promo-v2/clips');fs.mkdirSync(out,{recursive:true});
const cursorScript=()=>{addEventListener('DOMContentLoaded',()=>{const style=document.createElement('style');style.textContent='#filmCursor{position:fixed;left:-100px;top:-100px;width:27px;height:35px;pointer-events:none;z-index:999999;filter:drop-shadow(0 2px 3px #0008)}#filmClick{position:fixed;width:16px;height:16px;border:3px solid #f3c553;border-radius:100%;pointer-events:none;z-index:999998;opacity:0}';document.head.append(style);const d=document.createElement('div');d.id='filmCursor';d.innerHTML='<svg viewBox="0 0 27 35"><path d="M2 2v27l7-7 5 10 5-3-5-10 10-1Z" fill="white" stroke="#101923" stroke-width="2"/></svg>';const ring=document.createElement('div');ring.id='filmClick';document.body.append(d,ring);addEventListener('pointermove',e=>{d.style.left=e.clientX+'px';d.style.top=e.clientY+'px'});addEventListener('pointerdown',e=>{ring.style.left=(e.clientX-8)+'px';ring.style.top=(e.clientY-8)+'px';ring.animate([{opacity:.9,transform:'scale(.6)'},{opacity:0,transform:'scale(4)'}],{duration:450})});});};
(async()=>{
 const runtime=await start(),only=new Set(process.argv.slice(2)),reportPath=path.join(root,'checks/promo-v2-capture.json');const report=only.size&&fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath)):{scenes:[],source:'Real UI recordings; isolated contexts; visible cursor follows actual pointer events'};
 async function clip(name,setup,act){
  if(only.size&&!only.has(name))return;
  const ctx=await runtime.browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,recordVideo:{dir:path.join(out,'raw'),size:{width:1920,height:1080}}});await ctx.addInitScript(cursorScript);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(runtime.base+'/app/web/index.html');await p.waitForFunction(()=>typeof PlaceSearch!=='undefined');await p.evaluate(()=>Factory3D.ready());await setup(p);
  await p.evaluate(async()=>{status('');await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.offsetWidth).map(i=>i.decode().catch(()=>{})))});
  await p.mouse.move(1750,1040);await p.waitForTimeout(300);
  const startTime=Date.now();await p.waitForTimeout(600);await act(p);await p.waitForTimeout(900);
  const seconds=(Date.now()-startTime)/1000;
  const state=await p.evaluate(()=>({map:state.map,floor:state.floor,route:!!state.route,style:mapViewer.style,model:mapViewer.isModel()}));
  await p.screenshot({path:path.join(out,name+'-end.png')});
  const video=p.video();await ctx.close();const raw=path.join(out,'raw',name+'.webm');await video.saveAs(raw);
  const total=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',raw],{encoding:'utf8'}));
  const offset=Math.max(0,total-seconds-.08);
  execFileSync('ffmpeg',['-y','-v','error','-ss',String(offset),'-i',raw,'-t',String(seconds),'-vf','fps=30','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-an',path.join(out,name+'.mp4')]);
  report.scenes=report.scenes.filter(s=>s.name!==name);report.scenes.push({name,seconds,offset,state,errors});console.log('Recorded',name,seconds.toFixed(2)+'s');if(errors.length)throw Error(errors.join('\n'));
 }
 async function hidePanel(p){if(!(await p.evaluate(()=>document.body.classList.contains('panelHidden'))))await p.click('#togglePanel');}
 async function setupMap(p,id){await p.evaluate(id=>{state.selected.clear();state.done.clear();changeMap(id);setView(true);},id);await hidePanel(p);await p.evaluate(()=>mapViewer.fitFloor());}
 async function move(p,x,y,duration=500){const old=await p.evaluate(()=>({x:parseFloat(document.getElementById('filmCursor').style.left)||0,y:parseFloat(document.getElementById('filmCursor').style.top)||0}));for(let i=1;i<=20;i++){const a=i/20,e=a*a*(3-2*a);await p.mouse.move(old.x+(x-old.x)*e,old.y+(y-old.y)*e);await p.waitForTimeout(duration/20);}}
 async function click(p,selector){const b=await p.locator(selector).first().boundingBox();if(!b)throw Error('Missing '+selector);await move(p,b.x+b.width/2,b.y+b.height/2,350);await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}
 async function zoom(p,x,y,delta=-95){await move(p,x,y,350);for(let i=0;i<14;i++){await p.mouse.wheel(0,delta/14);await p.waitForTimeout(22);}}
 async function drag(p,x,y,dx,dy,right=false){await move(p,x,y,300);await p.mouse.down({button:right?'right':'left'});for(let i=1;i<=36;i++){const a=i/36,e=a*a*(3-2*a);await p.mouse.move(x+dx*e,y+dy*e);await p.waitForTimeout(23);}await p.mouse.up({button:right?'right':'left'});}
 try{
  await clip('woods',p=>setupMap(p,'woods'),async p=>{await zoom(p,1010,560,-105);await drag(p,1100,570,-200,55);await p.waitForTimeout(400);});
  await clip('customs',async p=>{await p.evaluate(async()=>{await runSmoke('customs');mapViewer.style='realistic';setView(true);mapViewer.fitFloor();state.route=null;paintImageRoute();status('');});},async p=>{await click(p,'#routeBtn');await p.waitForFunction(()=>!!state.route);await p.waitForTimeout(500);await click(p,'#togglePanel');await zoom(p,850,555,-65);});
  await clip('shoreline',p=>setupMap(p,'shoreline'),async p=>{await zoom(p,1150,520,-80);await p.waitForTimeout(250);await click(p,'#placeSearch');await p.locator('#placeSearch').pressSequentially('306 западное',{delay:50});await p.waitForTimeout(350);await click(p,'#placeResults button');await p.waitForTimeout(700);});
  await clip('interchange',p=>setupMap(p,'interchange'),async p=>{await zoom(p,1050,565,-70);await drag(p,1080,570,-135,45);await click(p,'#floorButtons [data-floor="2"]');await p.waitForTimeout(350);await click(p,'#floorButtons [data-floor="1"]');});
  await clip('factory',async p=>{await p.evaluate(async()=>{await runSmoke('factory');mapViewer.factoryStyle='model';setView(true);await Factory3D.ready();for(const floor of [3,1]){state.floor=floor;setView(true);await Factory3D.ready();}Factory3D.fit();});await hidePanel(p);await p.locator('#showExits').uncheck();},async p=>{await drag(p,1000,565,260,45,true);await click(p,'#floorButtons [data-floor="3"]');await p.evaluate(()=>Factory3D.ready());await p.waitForTimeout(350);await drag(p,1030,555,-130,15,true);});
  report.ok=true;fs.writeFileSync(path.join(root,'checks/promo-v2-capture.json'),JSON.stringify(report,null,2)+'\n');
 }finally{await runtime.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
