// Original procedural score, no samples: 112 BPM pulse, analog-style bass, soft percussion.
const fs=require('node:fs');
const rate=44100,duration=60,beat=60/112;
let seed=4291;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
const samples=Buffer.alloc(rate*duration*4);
let last=0;const chords=[[55,82.4069,110],[48.9994,73.4162,97.9989],[43.6535,65.4064,87.3071],[41.2034,61.7354,82.4069]];
for(let i=0;i<rate*duration;i++){
 const t=i/rate,b=t/beat,k=Math.floor(b),phase=(b-k)*beat,e=phase;
 const chord=chords[Math.floor(b/8)%4];let v=0;
 // Restrained pad and a pulsing bass, with room for titles.
 for(const f of chord)v+=.035*Math.sin(2*Math.PI*f*t)*(.7+.3*Math.sin(2*Math.PI*.15*t));
 v+=.08*Math.sin(2*Math.PI*chord[0]*t)*Math.exp(-e*7);
 if(k%2===0)v+=.38*Math.sin(2*Math.PI*(44*e+9*(1-Math.exp(-e*24))))*Math.exp(-e*15);
 const noise=rand(),high=noise-last;last=noise;
 if(k%4===2)v+=high*.08*Math.exp(-e*25);
 const hat=(b*2-Math.floor(b*2))*beat/2;v+=high*.022*Math.exp(-hat*75);
 const arp=[chord[1]*4,chord[2]*4,chord[0]*8,chord[1]*4][k%4];
 if(t>8&&t<51)v+=.024*Math.sin(2*Math.PI*arp*t)*Math.exp(-e*9);
 for(const cut of [4.5,8,13,18,22.5,28,35,41,47,51,55]){const dt=t-cut;if(dt>-.32&&dt<.4)v+=noise*.045*Math.exp(-Math.abs(dt)*9);}
 const envelope=Math.min(1,t/1.5,(60-t)/2.8),s=Math.tanh(v)*.75*Math.max(0,envelope);
 const spread=.004*Math.sin(2*Math.PI*164.81*t);
 samples.writeInt16LE(Math.max(-32768,Math.min(32767,(s+spread*envelope)*32767)),i*4);
 samples.writeInt16LE(Math.max(-32768,Math.min(32767,(s-spread*envelope)*32767)),i*4+2);
}
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+samples.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(samples.length,40);
fs.writeFileSync(process.argv[2]||'cache/promo-score.wav',Buffer.concat([header,samples]));
