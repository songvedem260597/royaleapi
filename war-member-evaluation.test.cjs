const assert=require('node:assert/strict');
const {test}=require('node:test');
const {evaluate,rankByLatestWar}=require('./war-member-evaluation.js');

function mk(fame,decks=4,other={}) {
  const latest={season:'138-1',date:'2026-11-09',fame,fameVerified:fame!=null,
    decks,decksVerified:decks!=null,recordedInWarLog:fame!=null,...other};
  return {tag:'#TEST',cw2History:[latest,
    {season:'137-4',date:'2026-11-02',fame,fameVerified:fame!=null,
     decks:4,decksVerified:true,recordedInWarLog:fame!=null}]};
}
test('Clan War policy uses verified personal Fame average cutoffs 400 and 1600',()=>{
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
test('unknown personal War records are not zero and do not trigger Kick',()=>{
 const m=mk(null,null);
 m.cw2History[0]={season:'138-1',fame:null,decks:0,decksVerified:false,
    fameVerified:false,recordedInWarLog:false};
 m.cw2History[1].decks=0;
 const e=evaluate(m);
 assert.equal(e.status,'unknown');
 assert.equal(e.averageFame,null);
 assert.equal(e.latestFame,null);
 assert.equal(e.twoVerifiedZeroDecks,false);
});
test('unverified latest race does not erase known historical average',()=>{
 const m=mk(null,null);
 m.cw2History[1]={season:'137-4',date:'2026-11-02',fame:2000,
   fameVerified:true,decks:12,decksVerified:true,recordedInWarLog:true};
 const e=evaluate(m);
 assert.equal(e.status,'good');
 assert.equal(e.averageFame,2000);
 assert.equal(e.latestFame,null);
 assert.match(e.reason,/không có bản ghi không tính là 0/);
});
test('all individually verified War races are averaged, not a fixed five-race slice',()=>{
 const fame=[600,1800,1700,2000,1900,1900,2200,2200];
 const member={cw2History:fame.map((f,i)=>({season:'W'+i,date:'2026-10-01',
   fame:f,fameVerified:true,recordedInWarLog:true,decks:12,decksVerified:true}))};
 const e=evaluate(member);
 assert.equal(e.averagedWarWeeks,8);
 assert.equal(e.averageFame,fame.reduce((a,b)=>a+b)/8);
 assert.equal(e.status,'good');
 assert.equal(e.latestFame,600);
});
test('rejects invented or unrecorded Fame even if fameVerified flag is set',()=>{
 const m=mk(null,null);
 m.cw2History[0]={season:'138-1',fame:9900,fameVerified:true,
   recordedInWarLog:false,decks:16,decksVerified:false};
 assert.equal(evaluate(m).status,'unknown');
});
test('one zero and one played War is warning, not Kick',()=>{
 const m=mk(0,0);
 m.cw2History[1].decks=4;
 assert.equal(evaluate(m).status,'warning');
});
test('high verified Fame average is not penalized solely for donations or offline time',()=>{
 assert.equal(evaluate({...mk(1600),donations:0,daysOffline:30}).status,'good');
});
test('latest-week Fame helper still ranks current War independently of lifetime average',()=>{
 const members=[mk(900),mk(2200),mk(1600),mk(null)].map((m,i)=>({
   ...m,tag:'#'+i,score:100-i*20,warEvaluation:evaluate(m)
 }));
 assert.deepEqual(rankByLatestWar(members).map(x=>x.tag),['#1','#2','#0']);
});
