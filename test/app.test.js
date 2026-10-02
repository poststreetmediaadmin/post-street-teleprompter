import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler from '../api/token.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.code=s;return this},json(b){this.body=b;return this}}}
test('token endpoint rejects GET and never returns server key',async()=>{
 let res=response(); await handler({method:'GET'},res);assert.equal(res.code,405);
 const old=process.env.OPENAI_API_KEY, oldFetch=global.fetch;
 try{
 delete process.env.OPENAI_API_KEY;res=response();await handler({method:'POST'},res);assert.equal(res.code,500);
 process.env.OPENAI_API_KEY='test-server-secret';
 global.fetch=async(url,opts)=>{assert.equal(opts.headers.Authorization,'Bearer test-server-secret');assert.equal(JSON.parse(opts.body).session.type,'transcription');return {ok:true,json:async()=>({value:'temporary-token',expires_at:123,private:'not-for-client'})}};
 res=response();await handler({method:'POST'},res);assert.equal(res.code,200);assert.deepEqual(res.body,{value:'temporary-token',expires_at:123});assert.match(res.headers['Cache-Control'],/no-store/);
 global.fetch=async()=>({ok:false,status:401,json:async()=>({error:{message:'test-server-secret'}})});
 res=response();await handler({method:'POST'},res);assert.equal(res.code,502);assert.ok(!JSON.stringify(res.body).includes('test-server-secret'));
 }finally{global.fetch=oldFetch;if(old===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old;}
});
test('follows script, holds for freestyle, reacquires distant phrase',()=>{
 const start=code.indexOf('function tokenSimilarity');const end=code.indexOf('function recentTranscriptText');
 const context=vm.createContext({normalizedScript:('welcome to post street studios '+Array(250).fill('filler').join(' ')+' adjust the shutter before recording today').split(' '),currentIndex:0,$:()=>({value:'3'})});
 vm.runInContext(code.slice(start,end),context);
 assert.equal(vm.runInContext("findBestMatch(['welcome','to','post','street','studios']).end",context),4);
 assert.equal(vm.runInContext("findBestMatch(['my','dog','chased','a','squirrel'])",context),null);
 assert.equal(vm.runInContext("findBestMatch(['shutter','before','recording'])",context),null);
 assert.ok(vm.runInContext("findBestMatch(['adjust','the','shutter','before','recording','today']).end",context)>250);
});

test('browser speech follows revisions, holds freestyle, restarts and stops safely',()=>{
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='#sensitivity'?'3':'',checked:false,style:{setProperty(){}},classList:{remove(){},add(){},toggle(){}},addEventListener(){},querySelectorAll(){return []}});return elements.get(id)};
 const sessions=[], timers=new Map();let nextTimer=0;
 class Speech{constructor(){sessions.push(this)}start(){this.onstart()}abort(){this.aborted=true}}
 const context=vm.createContext({window:{SpeechRecognition:Speech,addEventListener(){}},document:{querySelector:element,documentElement:element('root'),addEventListener(){}},navigator:{},localStorage:{getItem(){return null}},setTimeout(fn){timers.set(++nextTimer,fn);return nextTimer},clearTimeout(id){timers.delete(id)},Date});
 vm.runInContext(code,context);
 vm.runInContext("scriptWords='welcome to post street studios adjust the shutter before recording today'.split(' '); normalizedScript=scriptWords; startVoice()",context);
 const result=(text,final=false)=>{const item=[{transcript:text}];item.isFinal=final;return item};
 const first=sessions[0];
 assert.equal(first.interimResults,true);
 first.onresult({results:[result('welcome to post street')]});
 assert.equal(vm.runInContext('currentIndex',context),3);
 first.onresult({results:[result('welcome to post street studios',true),result('my dog chased a squirrel')]});
 assert.equal(vm.runInContext('currentIndex',context),3);
 first.onresult({results:[result('welcome to post street studios',true),result('adjust the shutter before recording today',true)]});
 assert.equal(vm.runInContext('currentIndex',context),10);
 first.onend();
 for(const [id,fn] of [...timers]){timers.delete(id);fn()}
 assert.equal(sessions.length,2);
 const second=sessions[1];
 second.onerror({error:'not-allowed'});
 assert.equal(vm.runInContext('voiceActive',context),false);
 assert.equal(second.aborted,true);
 assert.equal(timers.size,0);
 assert.match(element('#status').textContent,/Microphone blocked/);
 assert.ok(!code.includes("fetch('/api/token'"));
 assert.ok(!code.includes('api.openai.com'));
});
