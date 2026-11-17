const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {start,root}=require('./runtime.cjs');
(async()=>{
 const runtime=await start(),page=await runtime.browser.newPage({viewport:{width:1920,height:1080}});
 const dir=path.join(root,'cache/promo-v2');fs.mkdirSync(dir,{recursive:true});
 try{
  await page.goto(runtime.base+'/promo/film-v2.html');await page.evaluate(()=>window.ready);
  if(process.argv.includes('--preview')){
   for(const t of [0.5,2.2,6.5,8,9,12,14,16,17,19,20.7,23,25,27,29,31.5,33.5]){
    const b=await page.evaluate(async t=>{await render(t);return document.querySelector('canvas').toDataURL('image/png').split(',')[1]},t);
    fs.writeFileSync(path.join(dir,'frame-'+t+'.png'),Buffer.from(b,'base64'));
   }return;
  }
  const output=path.join(root,'releases/Raid-Atlas-Promo-v2-1080p.mp4');
  const ff=spawn('ffmpeg',['-y','-v','warning','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-ss','32.25','-i',path.join(dir,'music/venom.mp3'),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-ar','48000','-af','afade=t=in:d=0.045,afade=t=out:st=33.6:d=1.4,loudnorm=I=-16:TP=-1.5:LRA=7','-t','35','-movflags','+faststart','-metadata','title=Raid Atlas — Action Cut','-metadata','comment=Music: Venom by Scott Buckley — CC BY 4.0 — https://www.scottbuckley.com.au/library/venom/ ; edited excerpt. Maps: RE3MR, Shebuka / tarkov.dev. 3D models: TKL. Non-commercial fan project.',output],{stdio:['pipe','inherit','inherit']});
  const done=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('exit',n=>n===0?resolve():reject(Error('ffmpeg '+n)))});
  for(let f=0;f<1050;f++){
   const b=await page.evaluate(async t=>{await render(t);return document.querySelector('canvas').toDataURL('image/jpeg',.96).split(',')[1]},f/30);
   if(!ff.stdin.write(Buffer.from(b,'base64')))await new Promise(r=>ff.stdin.once('drain',r));
   if(f%150===0)console.log('Rendered '+f/30+'/35s');
  }ff.stdin.end();await done;console.log(output);
 }finally{await runtime.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
