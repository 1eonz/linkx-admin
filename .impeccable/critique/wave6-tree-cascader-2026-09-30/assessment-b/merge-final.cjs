const fs=require('fs'),path=require('path')
const dir=path.resolve('.impeccable/critique/wave6-tree-cascader-2026-09-30/assessment-b')
const base=JSON.parse(fs.readFileSync(path.join(dir,'browser-result.json'),'utf8'))
const supplements=['tree-loading-immediate','cascader-clear'].map((name)=>{const meta=JSON.parse(fs.readFileSync(path.join(dir,'screenshots',name+'.meta.json'),'utf8')); return {name, route:name.startsWith('tree')?'lxtreeselect':'lxcascader', viewport:{width:1280,height:900}, observed:meta.observed, injected:{overlayInjected:meta.overlayInjected}, screenshot:path.join(dir,'screenshots',name+'.png'), console:path.join(dir,'screenshots',name+'.console.json'), requests:path.join(dir,'screenshots',name+'.requests.json'), meta:path.join(dir,'screenshots',name+'.meta.json') }})
const failures=(base.failures||[]).filter((item)=>!['cascader-clear'].includes(item.name))
const captures=[...(base.captures||[]),...supplements]
const allReq=[];for(const f of fs.readdirSync(path.join(dir,'screenshots')).filter((x)=>x.endsWith('.requests.json'))){allReq.push(...JSON.parse(fs.readFileSync(path.join(dir,'screenshots',f),'utf8')))}
const external=Array.from(new Set(allReq.filter((url)=>!['http://127.0.0.1:4191','http://127.0.0.1:8411'].includes(new URL(url).origin))))
fs.writeFileSync(path.join(dir,'browser-result-final.json'),JSON.stringify({status:failures.length?'partial':'passed',fallback:base.fallback,captures,failures,externalRequests:external,totalRequests:allReq.length},null,2))
const origins={};for(const url of allReq){const origin=new URL(url).origin;origins[origin]=(origins[origin]||0)+1}
fs.writeFileSync(path.join(dir,'external-requests-summary-final.json'),JSON.stringify({totalRequests:allReq.length,origins,externalRequests:external},null,2))
console.log(JSON.stringify({captures:captures.length,failures:failures.length,totalRequests:allReq.length,externalRequests:external}))