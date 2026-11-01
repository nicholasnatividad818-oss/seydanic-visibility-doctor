import test from 'node:test';
import assert from 'node:assert/strict';
import {auditProducts} from '../app/lib/audit.mjs';
const product = (id, overrides={})=>({id, title:'Unique product '+id, description:'Detailed '.repeat(20), status:'ACTIVE', onlineStoreUrl:'https://example.com/products/x', seo:{title:'Title',description:'Description'},media:{nodes:[{id:'m1'}]},...overrides});
test('empty product list',()=>assert.deepEqual(auditProducts([]).counts,{high:0,medium:0,low:0}));
test('detects missing media, SEO and short copy',()=>{const r=auditProducts([product('1',{description:'short',seo:{},media:{nodes:[]}})]);assert.deepEqual(new Set(r.issues.map(i=>i.code)),new Set(['THIN_DESCRIPTION','MISSING_IMAGE','MISSING_SEO_TITLE','MISSING_META_DESCRIPTION']));});
test('normalizes and flags duplicate titles',()=>{const r=auditProducts([product('1',{title:'Classic Tee'}),product('2',{title:'  classic  TEE  '})]);assert.equal(r.issues.filter(i=>i.code==='DUPLICATE_TITLE').length,2);});
test('does not flag drafts as incomplete listings',()=>{const r=auditProducts([product('1',{status:'DRAFT',description:'',media:{nodes:[]},seo:{}})]);assert.equal(r.issues.length,0);});
test('does not confuse unavailable URL with confirmed unpublishing',()=>{const r=auditProducts([product('1',{onlineStoreUrl:null})]);assert.equal(r.issues[0].code,'STOREFRONT_URL_UNAVAILABLE');});
