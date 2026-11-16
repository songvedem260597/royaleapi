'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('rank review button opens a safe panel and refreshes after render', () => {
  const events={};
  const button={ textContent:'', attrs:{}, addEventListener:(event,fn)=>{events[event]=fn;},
    setAttribute(k,v){this.attrs[k]=v;}, focus(){} };
  const panel={hidden:true, innerHTML:'', scrollIntoView(){},
    querySelector(){return {addEventListener() {}};}};
  const fixture={members:[{
    name:'<img onerror=alert(1)>',tag:'#HELLO',roleLabel:'Thành viên',
    rankReview:{status:'promote',reason:'12/16 và 12/16 Deck'}
  }],warSeasons:[{date:'2026-11-16'}],warLogStale:false};
  let originalRenderCount=0;
  const context={
    window:{render(){originalRenderCount++;}},
    currentClan:fixture,
    document:{getElementById:id=> id==='btn-rank-review'?button : id==='rank-review-output'?panel : null}
  };
  vm.runInNewContext(fs.readFileSync('rank-review-ui.js','utf8'),context);
  assert.match(button.textContent,/\(1\)/);
  events.click();
  assert.equal(panel.hidden,false);
  assert.equal(button.attrs['aria-expanded'],'true');
  assert.match(panel.innerHTML,/Đề xuất lên Trưởng lão/);
  assert.match(panel.innerHTML,/&lt;img onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(panel.innerHTML,/<img onerror/);
  context.currentClan={...fixture,members:[]};
  context.window.render();
  assert.equal(originalRenderCount,1);
  assert.doesNotMatch(button.textContent,/\(1\)/);
});
