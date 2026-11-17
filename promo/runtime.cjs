const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function start(){
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
   const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css','.json':'application/json','.wav':'audio/wav'};
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);
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
