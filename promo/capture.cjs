// Captures the real application in an ephemeral browser context, never personal progress.
const fs=require('node:fs');
const path=require('node:path');
const {start,root}=require('./runtime.cjs');
(async()=>{
 const runtime=await start(),page=await runtime.browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const out=path.join(root,'docs/media/screens');fs.mkdirSync(out,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 const report={capturedAt:new Date().toISOString(),source:'Actual app/web UI in an isolated Chromium profile',scenes:{}};
 async function shot(name){
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.offsetWidth).map(i=>i.decode().catch(()=>{})));});
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,name+'.png')});
  report.scenes[name]=await page.evaluate(()=>({map:state.map,floor:state.floor,selected:[...state.selected],route:!!state.route}));
  console.log('Captured '+name);
 }
 try{
  await page.goto(runtime.base+'/app/web/index.html');
  await page.waitForFunction(()=>typeof Factory3D!=='undefined');
  await page.evaluate(async()=>{changeMap('factory');setView(true);await Factory3D.ready();});
  await shot('factory');
  await page.click('#locationMenu');await shot('locations');await page.click('#closeLocations');
  await page.evaluate(()=>document.getElementById('atlasBtn').click());await shot('atlas');await page.click('#closeAtlas');
  const route=await page.evaluate(async()=>{const r=await runSmoke('customs');setView(true);mapViewer.fitFloor();status('');return r;});
  if(!route.planned)throw Error('Customs route was not calculated');report.route=route;
  await shot('route');
  await page.evaluate(()=>tab('tasks'));await shot('tasks');
  await page.evaluate(()=>{const t=CATALOG.tasks.find(t=>t.maps.includes('customs')&&t.objectives.some(o=>RA.flatten(o.requiredKeys).length));if(t)addTask(t);tab('gear');status('');});await shot('gear');
  await page.evaluate(()=>{tab('exits');state.exitFaction='pmc';renderExit();});await shot('exits');
  await page.evaluate(async()=>{await runPlaceSearch();status('');});await shot('search');
  await page.evaluate(()=>{document.getElementById('placeResults').hidden=true;document.getElementById('placeSearch').value='';});await shot('floors');
  await page.evaluate(async()=>{await runAutoExits();status('');});await shot('auto-exits');
  await page.evaluate(()=>{changeMap('icebreaker');setView(true);tab('route');});
  await page.click('#manualAdd');const box=await page.locator('#viewport').boundingBox();
  for(const [x,y]of [[.35,.38],[.45,.52],[.59,.44],[.68,.62]])await page.mouse.click(box.x+box.width*x,box.y+box.height*y);
  await page.click('#manualAdd');await page.evaluate(()=>status(''));await shot('manual');
  await page.evaluate(async()=>{await runSmoke('factory');mapViewer.factoryStyle='model';setView(true);tab('tasks');status('');await Factory3D.ready();Factory3D.fit();});
  for(let i=0;i<8;i++){await page.evaluate(()=>Factory3D.rotate());await shot('factory-'+i);}
  const frames=path.join(root,'cache/promo-factory');fs.mkdirSync(frames,{recursive:true});
  await page.evaluate(()=>Factory3D.fit());
  const scene=await page.locator('#factoryScene').boundingBox();
  await page.mouse.move(scene.x+scene.width*.4,scene.y+scene.height*.5);await page.mouse.down({button:'right'});
  for(let i=0;i<72;i++){
   await page.mouse.move(scene.x+scene.width*(.4+i*.003),scene.y+scene.height*.5);
   await page.screenshot({path:path.join(frames,String(i).padStart(3,'0')+'.jpg'),type:'jpeg',quality:94});
  }
  await page.mouse.up({button:'right'});
  report.factory=await page.evaluate(()=>Factory3D.info());
  if(!report.factory.loaded||report.factory.triangles<100)throw Error('3D model was not rendered');
  if(errors.length)throw Error(errors.join('\n'));
  report.ok=true;fs.writeFileSync(path.join(root,'checks/promo-capture.json'),JSON.stringify(report,null,2)+'\n');
 }finally{await runtime.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
