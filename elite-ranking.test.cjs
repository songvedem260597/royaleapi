const assert = require('node:assert/strict');
const { test } = require('node:test');
const { calculate, rankMembers, POLICY } = require('./elite-ranking.js');

function player(fame, donations=250, trophies=7000, extra={}) {
  return {
    name: 'Candidate', tag: '#P0J2Y', donations, trophies,
    cw2History: fame.map(f => f == null
      ? { fame: null, fameVerified: false, recordedInWarLog: false }
      : { fame: f, fameVerified: true, recordedInWarLog: true }),
    ...extra
  };
}

test('composite score is 60 percent verified average War Fame plus 20 Donate and 20 trophies', () => {
  const x=calculate(player([2000,2000,2000,2000,2000],250,7000));
  assert.equal(x.qualified,true);
  assert.equal(x.avgWarFame,2000);
  assert.equal(x.warPoints,40);
  assert.equal(x.donationPoints,10);
  assert.equal(x.trophyPoints,10);
  assert.equal(x.score,60);
  assert.deepEqual([POLICY.warWeight,POLICY.donationWeight,POLICY.trophyWeight],[60,20,20]);
});

test('averages all observed completed War weeks, not just latest',()=>{
  const x=calculate(player([200,2000,2500,3000,3500],500,14000));
  assert.equal(x.verifiedWeeks,5);
  assert.equal(x.avgWarFame,2240);
  assert.equal(x.score,84.8); // 44.8 War + 20 Donate + 20 trophies
});

test('only official verified Fame counts, missing War cannot become 0 or a bonus',()=>{
  const m=player([1800,1900,null,2000,2100,2200,null],400,12000);
  const x=calculate(m);
  assert.equal(x.verifiedWeeks,5);
  assert.equal(x.avgWarFame,2000);
  assert.equal(x.qualified,true);
  const fake=player([1800,1900,9000,2000,2100,2200,null],400,12000);
  fake.cw2History[2].recordedInWarLog=false;
  assert.equal(calculate(fake).avgWarFame,2000);
});

test('players with fewer than 5 verified races are not ranked',()=>{
  const x=calculate(player([3500,3400,3300,3200,null,null],500,14000));
  assert.equal(x.verifiedWeeks,4);
  assert.equal(x.score,null);
  assert.equal(x.reason,'insufficient-verified-wars');
});

test('eligible elite requires average Fame at least 1600, not one impressive week',()=>{
  const low=calculate(player([3200,1200,1200,1200,1100],500,14000));
  assert.equal(low.qualified,false);
  assert.equal(low.reason,'below-elite-average');
  const boundary=calculate(player([1600,1600,1600,1600,1600],250,7000));
  assert.equal(boundary.qualified,true);
});

test('missing donation or trophy source excludes rather than filling a made-up zero',()=>{
  assert.equal(calculate(player([2000,2000,2000,2000,2000],null,14000)).score,null);
  assert.equal(calculate(player([2000,2000,2000,2000,2000],300,null)).score,null);
  assert.equal(calculate(player([2000,2000,2000,2000,2000],0,0)).score,40);
});

test('a consistent all-round contributor can outrank a single-week Fame leader',()=>{
  const a=player([3200,3000,3100,3250,3050],100,14000,{name:'War only',tag:'#A'});
  const b=player([2600,2650,2500,2700,2675,2625,2600,2550],500,14000,{name:'Balanced',tag:'#B'});
  const members=[a,b].map(m=>({...m,eliteRanking:calculate(m)}));
  assert.equal(rankMembers(members)[0].name,'Balanced');
});

test('stable tie breaks use average War Fame then donations, trophies and tag',()=>{
  const a=player([2000,2000,2000,2000,2000],250,7000,{tag:'#A'});
  const b=player([2000,2000,2000,2000,2000],250,7000,{tag:'#B'});
  assert.deepEqual(rankMembers([b,a].map(m=>({...m,eliteRanking:calculate(m)}))).map(m=>m.tag),['#A','#B']);
});
