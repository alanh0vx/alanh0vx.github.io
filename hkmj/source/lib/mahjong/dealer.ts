export type DealerState={dealer:number;roundIndex:number;handIndex:number;repeats:number};
export const initialDealer=(dealer=0):DealerState=>({dealer,roundIndex:0,handIndex:0,repeats:0});
export const seatWind=(player:number,dealer:number)=>'東南西北'[(player-dealer+4)%4];
export function advanceDealer(state:DealerState,winner:number|null):DealerState{
 if(winner===null||winner===state.dealer)return {...state,repeats:state.repeats+1};
 return {dealer:(state.dealer+1)%4,roundIndex:state.roundIndex+(state.handIndex===3?1:0),handIndex:(state.handIndex+1)%4,repeats:0};
}
export const roundLimit=(rounds:string)=>rounds==='東圈'?1:rounds==='東南圈'?2:4;
