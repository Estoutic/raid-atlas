/* Raid Atlas: local planner. No game process access. */
(function(root){
'use strict';
const normalize=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function mapPoint(m,p){let a=m.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);let corners=m.bounds.map(q=>[q[0]*c-q[1]*s,-(q[0]*s+q[1]*c)]);let lo=[Math.min(...corners.map(q=>q[0])),Math.min(...corners.map(q=>q[1]))],hi=[Math.max(...corners.map(q=>q[0])),Math.max(...corners.map(q=>q[1]))];return [(p.x*c-p.z*s-lo[0])/(hi[0]-lo[0])*m.viewBox[2],(-(p.x*s+p.z*c)-lo[1])/(hi[1]-lo[1])*m.viewBox[3]];}
function floorFor(map,p){if(map.id==='ground-zero'&&p.x>=30&&p.x<=70&&p.z>=125&&p.z<=180&&p.y>=28)return 2;if(map.id==='factory')return p.y<-1?0:p.y<3?1:p.y<6?2:3;for(const rule of map.floorRules||[])for(const e of rule.extents||[]){if(p.y<e.height[0]||p.y>=e.height[1])continue;if(e.bounds&&!e.bounds.some(([a,b])=>p.x>=Math.min(a[0],b[0])&&p.x<=Math.max(a[0],b[0])&&p.z>=Math.min(a[1],b[1])&&p.z<=Math.max(a[1],b[1])))continue;return map.floors.findIndex(f=>f[0]===rule.svgLayer);}return map.defaultFloor??1;}
function flatten(v){return !v?[]:Array.isArray(v)?v.flat(Infinity):[v];}
function relevant(o,map){return !o.maps?.length||o.maps.includes(map)||o.zones?.some(z=>z.map===map)||o.possibleLocations?.some(z=>z.map===map);}
function packing(tasks,map,done,optional){let take=new Map(),find=[],keys=new Map(),rules=[];const add=(it,n,why)=>{if(!it?.id)return;let r=take.get(it.id)||{...it,count:0,why:[]};r.count+=n;r.why.push(why);take.set(it.id,r);};
 for(let t of tasks)for(let o of t.objectives){if(done.has(o.id)||!relevant(o,map)||(o.optional&&!optional.has(o.id)))continue;let n=Number(o.count)||1;
  for(let group of o.requiredKeys||[]){group=flatten(group);let id=group.map(k=>k.id).sort().join('|');if(id)keys.set(id,{id,options:group,why:t.name});}
  if(o.type==='mark')add(o.markerItem,n,t.name);
  if(['plantItem','plantQuestItem'].includes(o.type)){let its=o.questItem?[o.questItem]:flatten(o.items);if(its.length===1)add(its[0],n,t.name);else if(its.length)rules.push({text:'Заложить '+n+' шт.: один из вариантов — '+its.map(x=>x.name).join(' / '),why:t.name});}
  if(['findItem','giveItem'].includes(o.type))find.push({id:o.id,names:flatten(o.items).map(x=>x.name),count:n,fir:!!o.foundInRaid,why:t.name});
  if(o.type==='findQuestItem')find.push({id:o.id,names:[o.questItem?.name||o.description],count:n,fir:false,why:t.name});
  for(let [k,label] of [['usingWeapon','Оружие'],['usingWeaponMods','Модификации'],['wearing','Надеть'],['notWearing','Не надевать'],['useAny','Использовать']]){let v=flatten(o[k]);if(v.length)rules.push({text:label+': '+v.map(x=>x.name||String(x)).join(' / '),why:t.name});}
  if(o.type==='shoot'||o.type==='extract'||o.timeFromHour||o.timeUntilHour)rules.push({text:o.description,why:t.name});
 }
 return {take:[...take.values()],find,keys:[...keys.values()],rules};}
class Heap{constructor(){this.a=[];}push(id,v){let a=this.a,i=a.length;a.push([id,v]);while(i){let p=(i-1)>>1;if(a[p][1]<=v)break;a[i]=a[p];i=p;}a[i]=[id,v];}pop(){let a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][1]<a[c][1])c++;if(a[c][1]>=last[1])break;a[i]=a[c];i=c;}a[i]=last;}return first;}get length(){return this.a.length;}}
// Raster navigation is explicitly an experimental interpretation of published SVG plans.
class Grid{
 constructor(w,h,step,masks,links=new Map(),risk=null){Object.assign(this,{w,h,step,masks,links,risk});this.area=w*h;this.size=this.area*masks.length;}
 xyz(n){let f=Math.floor(n/this.area),q=n%this.area;return [(q%this.w+.5)*this.step,(Math.floor(q/this.w)+.5)*this.step,f];}
 open(n){return n>=0&&n<this.size&&this.masks[Math.floor(n/this.area)][n%this.area]===1;}
 snap(p,f,reach=3){let x=Math.floor(p[0]/this.step),y=Math.floor(p[1]/this.step),r=Math.ceil(reach/this.step),best=-1,dist=Infinity;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){let xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=this.w||yy>=this.h)continue;let n=f*this.area+yy*this.w+xx;if(!this.open(n))continue;let d=Math.hypot((xx+.5)*this.step-p[0],(yy+.5)*this.step-p[1]);if(d<=reach&&d<dist){best=n;dist=d;}}return best;}
 *neighbors(n){let q=n%this.area,f=Math.floor(n/this.area),x=q%this.w,y=Math.floor(q/this.w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=this.w||yy>=this.h)continue;let to=f*this.area+yy*this.w+xx;if(!this.open(to))continue;if(dx&&dy&&(!this.open(n+dx)||!this.open(n+dy*this.w)))continue;yield[to,this.step*Math.hypot(dx,dy)*(1+((this.risk?.[to%this.area]||0)+(this.risk?.[q]||0))/2)];}for(let to of this.links.get(n)||[])if(this.open(to)){let a=this.xyz(n),b=this.xyz(to);yield[to,Math.hypot(a[0]-b[0],a[1]-b[1])+5*Math.abs(a[2]-b[2])];}}
 async reachable(start,{cancel=()=>false}={}){const seen=new Uint8Array(this.size);if(!this.open(start))return seen;const queue=new Int32Array(this.size);let head=0,tail=1;queue[0]=start;seen[start]=1;
 while(head<tail){const n=queue[head++],q=n%this.area,x=q%this.w,y=Math.floor(q/this.w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=this.w||yy>=this.h)continue;const v=n+dx+dy*this.w;if(seen[v]||!this.open(v)||dx&&dy&&(!this.open(n+dx)||!this.open(n+dy*this.w)))continue;seen[v]=1;queue[tail++]=v;}for(const v of this.links.get(n)||[])if(!seen[v]&&this.open(v)){seen[v]=1;queue[tail++]=v;}if(head%40000===0){await new Promise(r=>setTimeout(r,0));if(cancel())throw Error('Расчёт отменён');}}
 return seen;}
 region(polygon,f,reachable,center){if(polygon.length<3)return -1;const inside=(x,y)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);let best=-1,dist=Infinity;for(let y=Math.max(0,Math.floor(Math.min(...ys)/this.step));y<=Math.min(this.h-1,Math.ceil(Math.max(...ys)/this.step));y++)for(let x=Math.max(0,Math.floor(Math.min(...xs)/this.step));x<=Math.min(this.w-1,Math.ceil(Math.max(...xs)/this.step));x++){const n=f*this.area+y*this.w+x,px=(x+.5)*this.step,py=(y+.5)*this.step;if(!this.open(n)||reachable&&!reachable[n]||!inside(px,py))continue;const d=(px-center[0])**2+(py-center[1])**2;if(d<dist){best=n;dist=d;}}return best;}
 async path(start,end,{limit=800000,cancel=()=>false}={}){if(!this.open(start)||!this.open(end))return null;let goal=this.xyz(end),cost=new Map([[start,0]]),parent=new Map(),heap=new Heap();heap.push(start,0);let visited=new Set(),count=0;while(heap.length){let [u]=heap.pop();if(visited.has(u))continue;visited.add(u);if(u===end){let path=[u];while(u!==start){u=parent.get(u);path.push(u);}path.reverse();let dist=0;for(let i=1;i<path.length;i++){let a=this.xyz(path[i-1]),b=this.xyz(path[i]);dist+=Math.hypot(a[0]-b[0],a[1]-b[1],(a[2]-b[2])*3);}return {path,cost:cost.get(end),distance:dist};}if(++count>limit)throw Error('Расчёт достиг лимита. Сократи число целей или выбери ближнюю точку.');if(count%12000===0){await new Promise(r=>setTimeout(r,0));if(cancel())throw Error('Расчёт отменён');}for(let [v,w]of this.neighbors(u)){let g=cost.get(u)+w;if(g<(cost.get(v)??Infinity)){cost.set(v,g);parent.set(v,u);let b=this.xyz(v);heap.push(v,g+Math.hypot(b[0]-goal[0],b[1]-goal[1]));}}}return null;}
}
// Exact directed tour with all required stops and prerequisite constraints, up to 10 stops.
function optimize(matrix,n,requires=Array.from({length:n},()=>[])){
 if(n>10)throw Error('Для одного расчёта выбери не больше 10 точек. Остальные задачи можно оставить на следующий рейд.');
 if(n===0)return Number.isFinite(matrix[0][1])?{order:[],cost:matrix[0][1]}:null;
 let count=1<<n,dp=new Float64Array(count*n).fill(Infinity),prev=new Int16Array(count*n).fill(-1);
 for(let j=0;j<n;j++)if(!requires[j]?.length)dp[(1<<j)*n+j]=matrix[0][j+1];
 for(let mask=1;mask<count;mask++)for(let j=0;j<n;j++){let v=dp[mask*n+j];if(!Number.isFinite(v))continue;for(let k=0;k<n;k++){if(mask&(1<<k)||requires[k]?.some(r=>!(mask&(1<<r))))continue;let nm=mask|(1<<k),nv=v+matrix[j+1][k+1];if(nv<dp[nm*n+k]){dp[nm*n+k]=nv;prev[nm*n+k]=j;}}}
 let end=-1,cost=Infinity,mask=count-1;for(let j=0;j<n;j++){let v=dp[mask*n+j]+matrix[j+1][n+1];if(v<cost){cost=v;end=j;}}if(end<0)return null;let order=[];while(end>=0){order.push(end);let p=prev[mask*n+end];mask^=1<<end;end=p;}return{order:order.reverse(),cost};}
const api={normalize,mapPoint,floorFor,flatten,relevant,packing,Heap,Grid,optimize};root.RA=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
