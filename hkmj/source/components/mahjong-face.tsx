import type { ReactNode } from 'react';

type Face = { suit?: '萬' | '筒' | '索'; n?: number; honor?: string; flower?: number };
const ink = '#192b24', red = '#b52c28', green = '#14573b';
const numerals = ['一', '二', '三', '四', '伍', '六', '七', '八', '九'];
const positions: Record<number, [number, number][]> = {
  1: [[30, 40]], 2: [[30, 20], [30, 60]],
  3: [[16, 18], [30, 40], [44, 62]],
  4: [[16, 20], [44, 20], [16, 60], [44, 60]],
  5: [[16, 18], [44, 18], [30, 40], [16, 62], [44, 62]],
  6: [[16, 16], [44, 16], [16, 40], [44, 40], [16, 64], [44, 64]],
  7: [[13, 14], [30, 21], [47, 28], [16, 46], [44, 46], [16, 66], [44, 66]],
  8: [[16, 12], [44, 12], [16, 30], [44, 30], [16, 50], [44, 50], [16, 68], [44, 68]],
  9: [[13, 15], [30, 15], [47, 15], [13, 40], [30, 40], [47, 40], [13, 65], [30, 65], [47, 65]],
};
function Dot({ x, y, radius = 7, color }: { x: number; y: number; radius?: number; color: string }) {
  return <g fill="none" stroke={color} strokeWidth="2"><circle cx={x} cy={y} r={radius}/><circle cx={x} cy={y} r={radius * .55}/><circle cx={x} cy={y} r="1" fill={color}/></g>;
}
function Bamboo({x,y,color=green}:{x:number;y:number;color?:string}) {
  return <g stroke={color} strokeWidth="2.3" fill="none"><rect x={x-3} y={y-8} width="6" height="16" rx="3"/><path d={`M${x-4} ${y}h8 M${x-3} ${y-5}h6 M${x-3} ${y+5}h6`}/></g>;
}
export function MahjongFace({ tile }: { tile: Face }) {
  let drawing: ReactNode;
  const n = tile.n ?? 1;
  if (tile.flower !== undefined) {
    const f=tile.flower;
    drawing=<g><text x="9" y="19" fontSize="14" fill={f<4?green:red}>{f%4+1}</text><text x="44" y="25" textAnchor="middle" fontFamily="Kaiti TC, KaiTi, serif" fontWeight="700" fontSize="24" fill={red}>{['梅','蘭','菊','竹','春','夏','秋','冬'][f]}</text><path d="M29 73Q18 54 31 41M27 63Q7 61 12 50Q24 50 27 63M28 58Q44 58 47 45Q30 47 28 58" fill="none" stroke={green} strokeWidth="2.3"/>{Array.from({length:5},(_,i)=><ellipse key={i} cx="29" cy="34" rx="4" ry="8" fill="#fff3d0" stroke={f%2?green:red} strokeWidth="1.6" transform={`rotate(${i*72} 29 42)`}/>)}<circle cx="29" cy="42" r="3" fill="#c59627"/></g>;
  } else if (tile.suit === '萬') {
    drawing = <g textAnchor="middle" fontFamily="Kaiti TC, KaiTi, STKaiti, BiauKai, serif" fontWeight="700"><text x="30" y="34" fontSize="32" fill={ink}>{numerals[n-1]}</text><text x="30" y="71" fontSize="36" fill={red}>萬</text></g>;
  } else if (tile.suit === '筒') {
    drawing = n === 1 ? <g><Dot x={30} y={40} radius={23} color={green}/><Dot x={30} y={40} radius={12} color={red}/>{Array.from({length:12},(_,i)=><path key={i} d="M30 20v5" stroke={green} strokeWidth="2" transform={`rotate(${i*30} 30 40)`}/>)}</g> : positions[n].map(([x,y],i)=><Dot key={i} x={x} y={y} radius={n>=7?6.5:8} color={n===2?green:n===3?[green,red,ink][i]:n===5&&i===2?red:n===6&&i>=2?red:n===7&&i<3?green:n===9?[green,red,ink][Math.floor(i/3)]:ink}/>);
  } else if (tile.suit === '索') {
    if(n===1) drawing=<g stroke={green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M31 19C12 22 14 49 31 52L22 72 36 59 43 68 38 47C49 34 42 22 31 19Z" fill="none"/><path d="M21 30C8 31 10 40 5 42L20 42M25 31C23 48 32 47 36 36M28 48L34 59M27 54L26 65" fill="none"/><path d="M27 18C27 9 38 8 41 17L48 21 39 23" fill="none"/><circle cx="36" cy="16" r="1.5" fill={ink} stroke="none"/><path d="M27 10Q34 5 40 9M29 33Q29 43 33 45" stroke={red} fill="none"/></g>;
    else if(n===8) drawing=<g fill="none" stroke={green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12v23l18-17 18 17V12M12 68V45l18 17 18-17v23"/></g>;
    else {
      const spots = n===3?[[30,17],[16,57],[44,57]]:n===7?[[30,13],[16,36],[30,36],[44,36],[16,62],[30,62],[44,62]]:positions[n];
      drawing=spots.map(([x,y],i)=><Bamboo key={i} x={x} y={y} color={(n===5&&i===2)||(n===7&&i===0)||(n===9&&i%3===1)?red:green}/>);
    }
  } else if (tile.honor === '白') {
    drawing=<g fill="none"><rect x="10" y="9" width="40" height="62" rx="2" stroke={green} strokeWidth="3"/><path d="M15 14h30v52H15z M15 22l8-8m14 0 8 8m0 36-8 8m-14 0-8-8" stroke={red} strokeWidth="2"/></g>;
  } else {
    drawing=<text x="30" y="57" textAnchor="middle" fontFamily="Kaiti TC, KaiTi, STKaiti, BiauKai, serif" fontSize="48" fontWeight="700" fill={tile.honor==='中'?red:tile.honor==='發'?green:ink}>{tile.honor}</text>;
  }
  return <svg className="mahjong-face" viewBox="0 0 60 80" aria-hidden="true">{drawing}</svg>;
}
