/* Explicitly reviewed routing exception. No blocked grid cells are opened. */
let cachedFlareExit=null;
const FLARE_EXIT_ID='1dd5cede4fa747d279b076872c45fc59a4c3b916';
function specialExit(ex){
 if(state.map!=='customs'||ex?.id!==FLARE_EXIT_ID)return null;
 if(cachedFlareExit)return cachedFlareExit;
 const doc=new DOMParser().parseFromString(m().svg,'image/svg+xml'),rail=doc.querySelector('#Railway path');
 // The published railway geometry stops inside the extraction outline.
 // Stop normal navigation before the sniper area; the last stretch is conditional.
 const len=rail.getTotalLength(),approach=rail.getPointAtLength(len-62),tail=[];
 for(let d=len-62;d<=len-20;d+=2){const p=rail.getPointAtLength(d);tail.push([p.x,p.y,1]);}
 return cachedFlareExit={p:[approach.x,approach.y],floor:1,label:'Подход к сигнальной зоне',conditional:tail,
  instruction:'На месте дождись сообщения о входе в сигнальную зону и запусти зелёный сигнал вверх. После подтверждения активации выходи по рельсам. Пунктир — участок только после сигнала; не сходи с путей.',
  source:'https://escapefromtarkov.fandom.com/wiki/Customs'};
}
