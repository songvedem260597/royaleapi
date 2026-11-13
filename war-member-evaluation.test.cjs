const assert=require('node:assert/strict');
const {test}=require('node:test');
const {evaluate,rankByLatestWar}=require('./war-member-evaluation.js');

function mk(fame,decks=4,other={}) {
 const latest={season:'138-1',date:'2026-11-09',fame,fameVerified:fame!=null,
   decks,decksVerified:decks!=null,recordedInWarLog:fame!=null,...other};
 return {tag:'#TEST',cw2History:[latest,
   {season:'137-4',date:'2026-11-02',fame:500,fameVerified:true,
   decks:4,decksVerified:true,recordedInWarLog:true}]};
}
test('Clan War policy uses verified Fame cutoffs 400 and 1600 inclusively',()=>{
 assert.equal(evaluate(mk(0,0)).status,'warning');
 assert.equal(evaluate(mk(400)).status,'warning');
 assert.equal(evaluate(mk(401)).status,'average');
 assert.equal(evaluate(mk(1599)).status,'average');
 assert.equal(evaluate(mk(1600)).status,'good');
 assert.equal(evaluate(mk(3200)).status,'good');
});
test('two complete observed zero Deck War races require officer review',()=>{
 const m=mk(0,0);
 m.cw2History[1]={season:'137-4',date:'2026-11-02',fame:0,fameVerified:true,
  decks:0,decksVerified:true,recordedInWarLog:true};
 const e=evaluate(m);
 assert.equal(e.status,'kick');
 assert.equal(e.twoVerifiedZeroDecks,true);
 assert.equal(e.decisionRequiresOfficer,true);
 assert.match(e.reason,/nghỉ phép/);
});
test('unknown Fame or membership never becomes zero, warning or Kick',()=>{
 const m=mk(null,null);
 m.cw2History[0]={season:'138-1',fame:null,decks:0,decksVerified:false,
   fameVerified:false,recordedInWarLog:false};
 m.cw2History[1].decks=0;
 assert.equal(evaluate(m).status,'unknown');
 assert.equal(evaluate(m).latestFame,null);
 assert.equal(evaluate(m).twoVerifiedZeroDecks,false);
});
test('one zero and one played War is warning, not Kick',()=>{
 const m=mk(0,0);
 m.cw2History[1].decks=4;
 assert.equal(evaluate(m).status,'warning');
});
test('high Fame is not penalized solely for low donations or offline time',()=>{
 assert.equal(evaluate({...mk(1600),donations:0,daysOffline:30}).status,'good');
});
test('Top 3 contributions rank actual Fame, not internal score',()=>{
 const members=[mk(900),mk(2200),mk(1600),mk(null)].map((m,i)=>({
  ...m,tag:'#'+i,score:100-i*20,warEvaluation:evaluate(m)
 }));
 assert.deepEqual(rankByLatestWar(members).map(x=>x.tag),['#1','#2','#0']);
});
