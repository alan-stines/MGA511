import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFeed,inRegion} from '../feed.js';
test('demo requires no upstream request',async()=>{const result=await createFeed({fetcher:()=>{throw Error();}})();assert.equal(result.mode,'demo');assert.equal(result.events.length,5);});
test('region rejects invalid and distant coordinates',()=>{assert.equal(inRegion({Latitude:32.5,Longitude:-83}),true);assert.equal(inRegion({Latitude:null,Longitude:-83}),false);assert.equal(inRegion({Latitude:34,Longitude:-83}),false);});
test('concurrent clients share cache and retain stale data after a failure',async()=>{let calls=0,time=0,fail=false;const get=createFeed({key:'test',now:()=>time,fetcher:async()=>{calls++;if(fail)throw Error();return {ok:true,json:async()=>[]};}});const results=await Promise.all([get(),get(),get()]);assert.equal(calls,2);assert.equal(results[0].mode,'live');await get();assert.equal(calls,2);time=61000;fail=true;const stale=await get();assert.equal(stale.stale,true);assert.equal(stale.updatedAt,results[0].updatedAt);await get();assert.equal(calls,4);});
test('failed startup backs off without serving demonstration events',async()=>{let calls=0;const get=createFeed({key:'test',fetcher:async()=>{calls++;throw Error();}});await assert.rejects(get());await assert.rejects(get());assert.equal(calls,2);});
