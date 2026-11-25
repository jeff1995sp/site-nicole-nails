importScripts("/assets/nn-themes.js");
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{let data={};try{data=event.data.json()}catch{}event.waitUntil((async()=>{
let t=NicoleThemes.catalog.natal;try{const r=await fetch("/.netlify/functions/nicole-studio?action=settings",{cache:"no-store",signal:AbortSignal.timeout(2000)});if(r.ok){const s=await r.json();t=NicoleThemes.resolve(s.theme)}}catch{}
const test=data.test===true,natal=t.id==="natal",stage=data.stage==="24h"?"24h":data.stage==="2h"?"2h":test?"welcome":"2h";
const title="Nicole Nails "+(natal?"🎄":"🌷")+(stage==="24h"?" · Amanhã":stage==="2h"?" · Seu momento":"");
const messages={"24h":"Olá, linda! Seu atendimento é amanhã. Está tudo certo? Se tiver algum imprevisto ou precisar reagendar, fale com a Nicole. Esperamos você com carinho!","2h":"Seu momento de beleza está chegando! Seu atendimento é hoje. Confira seu horário e venha se cuidar. Estamos te esperando com carinho!","welcome":"Seus lembretes estão ativados! Toque para conhecer "+t.name+"."};
const options={body:(test?"Teste: ":"")+messages[stage],icon:"/.netlify/functions/nicole-art?type=icon",tag:"nn-"+(test?"test-":"reminder-")+stage,data:{test,stage},actions:[{action:"open",title:stage==="24h"?"Falar com Nicole":"Ver lembrete"}]};
if(natal)options.image="/.netlify/functions/nicole-art?type=natal";await self.registration.showNotification(title,options)})())});
self.addEventListener("notificationclick",event=>{event.notification.close();const d=event.notification.data||{},stage=d.stage==="24h"?"dia":d.stage==="2h"?"horario":"teste";const url=new URL("/?lembrete="+stage+(d.test?"&teste=1":"")+"#agendamento",self.location.origin).href;event.waitUntil(self.clients.openWindow(url))});