const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const scorer=require('./contribution-score.js');
const warHistory=require('./war-history.js');
const evalWar=require('./war-member-evaluation.js');
const elite=require('./elite-ranking.js');
const snapshot=require('./wintertime-data.json');
const context={window:{WintertimeContribution:scorer,WintertimeWarHistory:warHistory,WintertimeWarEvaluation:evalWar,WintertimeEliteRanking:elite}};
vm.runInNewContext(fs.readFileSync('clan-analytics.js','utf8'),context,{filename:'clan-analytics.js'});
const clan=context.window.ClanAnalytics.analyzeClan(snapshot);

test('50 actual WinterTime members classify by verified latest weekly Fame and never by internal score',()=>{
 assert.equal(clan.members.length,50);
 assert.equal(clan.counts.good,19);
 assert.equal(clan.counts.average,14);
 assert.equal(clan.counts.warning,12);
 assert.equal(clan.counts.kick,1);
 assert.equal(clan.counts.unknown,4);
 assert.equal(Object.values(clan.counts).reduce((s,n)=>s+n,0)-clan.counts.total,50);
 assert.ok(clan.members.filter(m=>m.status==='good').every(m=>m.latestFame>=1600));
 assert.ok(clan.members.filter(m=>m.status==='average').every(m=>m.latestFame>400&&m.latestFame<1600));
 assert.ok(clan.members.filter(m=>m.status==='warning').every(m=>m.latestFame<=400));
});
test('Hung alone is flagged for officer review on two verified zero-deck War weeks',()=>{
 const kicks=clan.members.filter(m=>m.status==='kick');
 assert.deepEqual(kicks.map(m=>m.tag),['#9V8LUVJ0']);
 const m=kicks[0];
 assert.equal(m.latestFame,0);
 assert.deepEqual(m.warDecksVerifiedHistory.slice(0,2),[0,0]);
 assert.equal(m.warEvaluation.decisionRequiresOfficer,true);
 assert.equal(m.cw2History[0].fame,0);
});
test('unknown recent history is not treated as 0 and not included in Top 3',()=>{
 const unknown=clan.members.filter(m=>m.status==='unknown');
 assert.equal(unknown.length,4);
 assert.ok(unknown.every(m=>m.latestFame===null&&m.cw2History[0].fame===null));
 assert.ok(unknown.every(m=>m.status!=='kick'));
 const top=evalWar.rankByLatestWar(clan.members).slice(0,3);
 assert.deepEqual(top.map(x=>x.latestFame),[3200,2950,2775]);
 assert.equal(top[0].name,'Trịnh Lam');
 assert.equal(clan.mvpName,elite.rankMembers(clan.members)[0].name);
});
test('Top 3 all-round elite ranks by ten-war verified average, current Donate and trophies',()=>{
 const top=elite.rankMembers(clan.members).slice(0,3);
 assert.deepEqual(top.map(x=>x.name),['Tobi','Mr.chien','Trịnh Lam']);
 assert.deepEqual(top.map(x=>x.eliteRanking.score),[94.7,92.5,88.8]);
 assert.deepEqual(top.map(x=>x.eliteRanking.verifiedWeeks),[6,10,5]);
 assert.equal(Math.round(top[0].eliteRanking.avgWarFame),2733);
 assert.equal(top[0].eliteRanking.donations,527);
 assert.equal(top[0].eliteRanking.trophies,14000);
 assert.equal(clan.mvpName,top[0].name);
});
test('individual verified Fame, Decks and source history are preserved across 10 completed races',()=>{
 const m=clan.members.find(m=>m.tag==='#2LL9V9088');
 assert.equal(m.cw2History.length,10);
 assert.equal(m.cw2History[0].fame,400);
 assert.equal(m.cw2History[0].decks,4);
 assert.equal(m.cw2History[0].fameVerified,true);
 assert.equal(m.cw2History[0].decksVerified,true);
 assert.ok(m.cw2History.some(h=>h.fame>0));
 assert.equal(clan.members.filter(m=>m.cw2History[0].fameVerified).length,46);
});
