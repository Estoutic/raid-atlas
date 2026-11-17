const fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
const {start,root}=require('./runtime.cjs');
(async()=>{
 fs.mkdirSync(path.join(root,'cache'),{recursive:true});fs.mkdirSync(path.join(root,'releases'),{recursive:true});
 const runtime=await start(),page=await runtime.browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 try{
  await page.goto(runtime.base+'/promo/film.html');await page.evaluate(()=>window.ready);
  const png=async(t,file)=>{const bytes=await page.evaluate(t=>{render(t);return document.getElementById('film').toDataURL('image/png').split(',')[1]},t);fs.writeFileSync(file,Buffer.from(bytes,'base64'));};
  await png(-1,path.join(root,'docs/media/hero.png'));
  for(const t of [2,6,10,15,20,25,31,38,44,49,53,58])await png(t,path.join(root,`cache/promo-${t}.png`));
  if(process.argv.includes('--preview'))return;
  const scenes=await page.evaluate(()=>window.scenesForExport);
  const timestamp=s=>new Date(Math.round(s*1000)).toISOString().slice(11,23).replace('.',',');
  fs.writeFileSync(path.join(root,'releases/Raid-Atlas-Promo-ru.srt'),scenes.map((s,i)=>`${i+1}\n${timestamp(s.at)} --> ${timestamp(s.end)}\n${s.lines.join(' ')}\n${s.sub}\n`).join('\n'));

  const score=path.join(root,'cache/promo-score.wav');execFileSync(process.execPath,[path.join(root,'promo/soundtrack.cjs'),score]);
  const output=path.join(root,'releases/Raid-Atlas-Promo-1080p.mp4');
  const ff=spawn('ffmpeg',['-y','-v','warning','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',score,'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-af','loudnorm=I=-17:TP=-1.5:LRA=8','-t','60','-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
  const finished=new Promise((r,j)=>{ff.on('error',j);ff.on('exit',code=>code===0?r():j(Error('ffmpeg exit '+code)));});
  for(let f=0;f<1800;f++){
   const bytes=await page.evaluate(t=>{render(t);return document.getElementById('film').toDataURL('image/jpeg',.95).split(',')[1]},f/30);
   if(!ff.stdin.write(Buffer.from(bytes,'base64')))await new Promise(r=>ff.stdin.once('drain',r));
   if(f%150===0)console.log(`Rendered ${f/30}/60 seconds`);
  }
  ff.stdin.end();await finished;console.log(output);
 }finally{await runtime.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
