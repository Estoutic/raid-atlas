const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function start(){
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end();return;}
   const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css','.json':'application/json','.wav':'audio/wav','.mp4':'video/mp4','.webm':'video/webm'};
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.setHeader('Accept-Ranges','bytes');
   let start=0,end=stat.size-1;
   if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!match){res.writeHead(416);res.end();return;}
    start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;
    if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
    res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
   }
   res.setHeader('Content-Length',end-start+1);fs.createReadStream(file,{start,end}).pipe(res);
  });
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const options={headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']};
 if(process.env.PROMO_CHROME)options.executablePath=process.env.PROMO_CHROME;
 else options.channel='chrome';
 let browser;try{browser=await chromium.launch(options);}catch(error){server.close();throw error;}
 return {browser,base:`http://127.0.0.1:${server.address().port}`,close:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
module.exports={start,root};
