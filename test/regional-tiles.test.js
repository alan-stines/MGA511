import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clipRing} from '../public/regional-tiles.js';
test('tiles entirely outside the county receive no polygon and no request',()=>{assert.deepEqual(clipRing([[300,300],[400,300],[400,400],[300,400]]),[]);});
test('county crossing a tile clips to its edges',()=>{const points=clipRing([[-50,-50],[300,-50],[300,300],[-50,300]]);assert.equal(points.length,4);assert.ok(points.every(([x,y])=>x>=0&&x<=256&&y>=0&&y<=256));});
test('small county inside tile is retained',()=>{const ring=[[10,10],[20,10],[20,20],[10,20]];assert.deepEqual(clipRing(ring),ring);});
test('coverage includes the five campus counties and only their direct neighbors',()=>{const data=JSON.parse(readFileSync(new URL('../public/data/counties.json',import.meta.url)));const core=new Set(['Bibb','Houston','Bleckley','Laurens','Dodge']);function vertices(f){return f.geometry.coordinates.flat(f.geometry.type==='MultiPolygon'?2:1).map(p=>p.join(','));}const verticesCore=new Set(data.features.filter(f=>core.has(f.properties.NAME)).flatMap(vertices));assert.equal(data.features.filter(f=>core.has(f.properties.NAME)).length,5);assert.equal(data.features.length,20);for(const f of data.features)assert.ok(core.has(f.properties.NAME)||vertices(f).filter(v=>verticesCore.has(v)).length>=2,f.properties.NAME);});
