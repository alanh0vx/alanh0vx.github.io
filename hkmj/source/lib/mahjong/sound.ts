export type SoundCue='shuffle'|'stack'|'dice'|'deal'|'tile'|'draw'|'flower'|'pung'|'kong'|'win';
let context:AudioContext|null=null;
let enabled=false;
const playing=new Set<AudioScheduledSourceNode>();
export function stopSounds(){for(const node of playing){try{node.stop();}catch{/* Already ended. */}}playing.clear();}
export function setSoundEnabled(value:boolean){enabled=value;if(!value)stopSounds();}
/** Reuse one context, unlocked by an actual click/tap. Audio failure never blocks play. */
export function unlockSound(){
 if(!enabled)return;
 try{const C=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!C)return;if(!context||context.state==='closed')context=new C();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Audio may be unavailable. */}
}
export function playSound(cue:SoundCue){
 if(!enabled||!context||context.state!=='running'||document.hidden)return;
 const c=context,now=c.currentTime;
 function track(node:AudioScheduledSourceNode,end:number){playing.add(node);node.onended=()=>{playing.delete(node);node.disconnect();};node.stop(end);}
 function tone(at:number,frequency:number,duration:number,volume=.045){
  const oscillator=c.createOscillator(),gain=c.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(c.destination);oscillator.start(at);track(oscillator,at+duration+.01);oscillator.onended=()=>{playing.delete(oscillator);oscillator.disconnect();gain.disconnect();};
 }
 function clack(at:number,pitch=1000,volume=.1,duration=.06){
  const source=c.createBufferSource(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);
  // Independent noise stream must not consume the gameplay RNG.
  let seed=123456789;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*(1-i/data.length);}
  source.buffer=buffer;const filter=c.createBiquadFilter(),gain=c.createGain();filter.type='bandpass';filter.frequency.value=pitch;filter.Q.value=.8;gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.start(at);track(source,at+duration+.01);source.onended=()=>{playing.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};tone(at,220,duration,.025);
 }
 try{
  if(cue==='shuffle'){for(let i=0;i<24;i++)clack(now+i*.052,750+(i*337)%1900,.08,.13);}
  else if(cue==='dice'){for(let i=0;i<12;i++)clack(now+i*.04+i*i*.003,1600+(i*431)%2100,.11-i*.005,.04);}
  else if(cue==='stack'||cue==='deal'){clack(now,1100);clack(now+.075,1500);if(cue==='stack'){clack(now+.22,950);clack(now+.30,1450);}}
  else if(cue==='tile')clack(now,1150,.14,.085);
  else if(cue==='draw')clack(now,1800,.065,.045);
  else if(cue==='flower'){[660,880,1100].forEach((f,i)=>tone(now+i*.10,f,.18,.04));}
  else if(cue==='pung'||cue==='kong'){clack(now,800,.14);clack(now+.10,1000,.13);if(cue==='kong')clack(now+.20,700,.15);tone(now+.12,cue==='kong'?392:523,.25);}
  else if(cue==='win'){[523,659,784,1047].forEach((f,i)=>tone(now+i*.13,f,.38,.055));}
 }catch{/* Sound is optional; gameplay must continue. */}
}
