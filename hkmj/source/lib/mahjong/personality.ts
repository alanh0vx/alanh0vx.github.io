export const PERSONALITIES=['好脾氣','心急派','寸嘴派'] as const;
export type Personality=typeof PERSONALITIES[number];
type Event='think'|'meld'|'win'|'lose'|'nudge';
const lines:Record<Personality,Record<Event,string[]>>={
 '好脾氣':{think:['諗清楚先，唔急。 🙂','呢手有啲意思喎。'],meld:['多謝晒，啱啱好！ 😊','借隻牌用吓先。'],win:['承讓承讓，下舖再嚟！ 😊','好彩啫，大家打得好！'],lose:['靚牌！下舖再努力。 🙂','哎吔，恭喜晒先！'],nudge:['站長，慢慢諗，揀好就出啦。 🙂','到你喇，站長，唔使緊張。']},
 '心急派':{think:['等陣，等陣，我諗到喇！','出邊隻好呢… 😅'],meld:['等陣！我要呢隻！ ✋','啱喇啱喇！'],win:['終於到我喇！ 🎉','食糊！開下一舖啦！'],lose:['哎吔！差一隻咋！ 😫','唉，遲咗一步添！'],nudge:['快啲啦，站長！等緊你呀！ ⏳','站長，諗好未呀？茶都凍喇！']},
 '寸嘴派':{think:['呢手牌考起我喎。 🤨','等我計清楚，唔好催。'],meld:['呢隻我就唔客氣喇。 😏','送到埋嚟，梗係要啦！'],win:['唔好意思，今日手風順。 😎','食糊！多謝各位支持。 😏'],lose:['好啦，今舖俾你威吓。 🙄','哎吔，早知打隔籬嗰隻！'],nudge:['站長，你喺度寫緊攻略呀？ 😏','諗咁耐，隻牌就快退休喇！','站長，等到我杯茶都生苔喇！']}
};
export function personalityLine(personality:Personality,event:Event,random= Math.random){const options=lines[personality][event];return options[Math.floor(random()*options.length)];}
export function pickPersonalities(random=Math.random):Personality[]{const options=[...PERSONALITIES];return Array.from({length:3},()=>options.splice(Math.floor(random()*options.length),1)[0]);}
