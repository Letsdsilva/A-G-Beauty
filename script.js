const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const db=()=>{try{return JSON.parse(localStorage.getItem('agBeautyDB')||'null')}catch{return null}};
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const backdrop=$('#bookingBackdrop');
let state={pro:null,service:null,date:null,time:null,promoFlow:null};
const categoryToPro={cilios:'grazielle',cabelo:'ana',nail:'nail'};
$('#menuToggle')?.addEventListener('click',()=>$('#mainNav').classList.toggle('open'));
$$('nav a').forEach(a=>a.addEventListener('click',()=>$('#mainNav').classList.remove('open')));
$$('[data-open-booking]').forEach(b=>b.addEventListener('click',()=>openBooking()));
$$('[data-category-booking]').forEach(b=>b.addEventListener('click',()=>openBooking(b.dataset.categoryBooking)));
$$('.professional-card').forEach(c=>c.addEventListener('click',e=>{if(!e.target.closest('button')) openBooking(c.dataset.category)}));
renderPublicPromos();
$('#bookingClose').addEventListener('click',closeBooking);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeBooking()});
function getProfessionals(){const d=db();return d?.professionals?.filter(p=>p.active!==false)||[]}
function renderPublicPromos(){const section=$('#promocoes');if(!section)return;let list=section.querySelector('.live-promos');if(!list){list=document.createElement('div');list.className='live-promos';section.querySelector('.promo-inner').appendChild(list)}const pros=getProfessionals().filter(p=>p.promo);list.innerHTML=pros.length?pros.map(p=>{const partner=getProfessionals().find(x=>x.id===p.promoPartnerId);return `<article class="live-promo-card"><strong>${esc(p.promo)}</strong><p>${esc(p.name)}${partner?` + ${esc(partner.name)}`:''}</p>${partner?'<small>✨ Combo em parceria: você agenda os dois serviços em sequência.</small>':''}${p.promoTerms?`<small>${esc(p.promoTerms)}</small>`:''}<button class="button" data-promo-book="${esc(p.id)}">${partner?'Agendar combo →':'Agendar promoção →'}</button></article>`}).join(''):'<p class="promo-empty">As ofertas publicadas pelas profissionais aparecerão aqui.</p>';list.querySelectorAll('[data-promo-book]').forEach(b=>b.addEventListener('click',()=>openPromoBooking(b.dataset.promoBook)))}
function openPromoBooking(id){const p=getProfessionals().find(x=>x.id===id);if(!p)return;const partner=p.promoPartnerId?getProfessionals().find(x=>x.id===p.promoPartnerId):null;state={pro:p.id,service:null,date:null,time:null,promoFlow:partner?{originProId:p.id,partnerProId:partner.id,currentIndex:0,selections:[],client:null}:null};backdrop.hidden=false;document.body.style.overflow='hidden';renderBooking()}
function openBookingById(id){openPromoBooking(id)}
function openBooking(category=null){state={pro:categoryToPro[category]||null,service:null,date:null,time:null,promoFlow:null};backdrop.hidden=false;document.body.style.overflow='hidden';renderBooking()}
function closeBooking(){backdrop.hidden=true;document.body.style.overflow='';state={pro:null,service:null,date:null,time:null,promoFlow:null}}
function currentPromoPro(){if(!state.promoFlow)return null;const ids=[state.promoFlow.originProId,state.promoFlow.partnerProId];return getProfessionals().find(p=>p.id===ids[state.promoFlow.currentIndex])||null}
function renderBooking(){
 const pros=getProfessionals();
 if(state.promoFlow){
  const p=currentPromoPro();
  $('#professionalsList').innerHTML=p?`<div class="promo-step-banner"><span>AGENDAMENTO DA PROMOÇÃO</span><strong>Etapa ${state.promoFlow.currentIndex+1} de 2</strong><small>${esc(p.name)} · ${esc(p.category||'Profissional')}</small></div>`:'';
  renderProfessionalBooking(p,true);
  return;
 }
 $('#professionalsList').innerHTML=pros.length?pros.map(p=>`<button class="pro-choice ${state.pro===p.id?'active':''}" data-pro="${esc(p.id)}"><strong>${esc(p.name)}</strong><small>${esc(p.category||'Profissional')}</small></button>`).join(''):'<div class="empty-state">Nenhuma profissional disponível.</div>';
 $$('[data-pro]').forEach(b=>b.onclick=()=>{state={pro:b.dataset.pro,service:null,date:null,time:null,promoFlow:null};renderBooking()});
 const p=pros.find(x=>x.id===state.pro)||null;
 if(!p){clearBookingSteps();return}
 renderProfessionalBooking(p,false);
}
function clearBookingSteps(){$('#serviceStep').innerHTML='<div class="empty-state">Escolha uma profissional para ver os serviços.</div>';$('#dateStep').innerHTML='';$('#timeStep').innerHTML='';$('#clientStep').hidden=true}
function renderProfessionalBooking(p,isPromo){
 if(!p){clearBookingSteps();return}
 const promo=state.promoFlow;
 const stepTitle=isPromo?`<div class="promo-current"><b>Agora: ${esc(p.name)}</b><span>Escolha o serviço, a data e o horário.</span></div>`:'';
 $('#serviceStep').innerHTML=`${stepTitle}<div class="step-title">01 · ESCOLHA O SERVIÇO</div><div class="service-grid">${(p.services||[]).map((s,i)=>{const photo=s.photo?`<img class="service-photo" src="${s.photo}" alt="${esc(s.name)}">`:'<div class="service-photo no-photo">♡</div>';return `<button class="service-choice ${state.service===i?'active':''}" data-service="${i}">${photo}<span><b>${esc(s.name)}</b><span>${money(s.price)}</span></span></button>`}).join('')}</div>`;
 $$('[data-service]').forEach(b=>b.onclick=()=>{state.service=Number(b.dataset.service);state.date=null;state.time=null;renderBooking()});
 if(state.service===null){$('#dateStep').innerHTML='';$('#timeStep').innerHTML='';$('#clientStep').hidden=true;return}
 const s=p.services[state.service];
 const avail=(p.availability||[]).filter(a=>Array.isArray(a.times)&&a.times.length).map(a=>a.date).filter(Boolean).sort();
 $('#dateStep').innerHTML=`<div class="date-area"><div class="step-title">02 · ESCOLHA A DATA</div>${avail.length?`<div class="date-grid">${avail.map(d=>`<button class="date-choice ${state.date===d?'active':''}" data-date="${d}">${formatDate(d)}</button>`).join('')}</div>`:'<div class="empty-state">Essa profissional ainda não disponibilizou horários.</div>'}</div>`;
 $$('[data-date]').forEach(b=>b.onclick=()=>{state.date=b.dataset.date;state.time=null;renderBooking()});
 if(!state.date){$('#timeStep').innerHTML='';$('#clientStep').hidden=true;return}
 const entry=(p.availability||[]).find(a=>a.date===state.date);const booked=(db()?.bookings||[]).filter(b=>b.proId===p.id&&b.date===state.date).map(b=>b.time);const times=(entry?.times||[]).filter(t=>!booked.includes(t)).sort();
 $('#timeStep').innerHTML=`<div class="time-area"><div class="step-title">03 · HORÁRIO DISPONÍVEL</div>${times.length?`<div class="time-grid">${times.map(t=>`<button class="time-choice ${state.time===t?'active':''}" data-time="${t}">${t}</button>`).join('')}</div>`:'<div class="empty-state">Todos os horários dessa data já estão ocupados.</div>'}</div>`;
 $$('[data-time]').forEach(b=>b.onclick=()=>{state.time=b.dataset.time;renderBooking()});
 if(!state.time){$('#clientStep').hidden=true;return}
 if(isPromo && promo && promo.currentIndex===0){
   $('#clientStep').hidden=false;
   $('#clientStep').innerHTML=`<div class="client-area"><div class="step-title">04 · PRÓXIMA ETAPA</div><div class="summary"><b>${esc(p.name)}</b> · ${esc(s.name)} · ${formatDate(state.date)} às ${esc(state.time)}</div><div class="summary"><b>✨ E depois?</b><br>Agora você vai escolher o horário do segundo serviço da promoção com ${esc(getProfessionals().find(x=>x.id===promo.partnerProId)?.name||'a profissional parceira')}.</div><button class="button" type="button" id="nextPromoStep">Escolher segundo horário →</button></div>`;
   $('#nextPromoStep').onclick=()=>{promo.selections[0]={proId:p.id,service:s.name,date:state.date,time:state.time};promo.currentIndex=1;state.pro=promo.partnerProId;state.service=null;state.date=null;state.time=null;renderBooking()};
   return;
 }
 $('#clientStep').hidden=false;
 const linkedPromo=p.promo?`<div class="summary"><b>Promoção:</b> ${esc(p.promo)}${p.promoTerms?`<br>${esc(p.promoTerms)}`:''}</div>`:'';
 const req=p.bookingRequirements?`<div class="summary"><b>Orientações para confirmar</b><br>${esc(p.bookingRequirements)}<br><small>Prazo: ${esc(p.confirmationDeadline||'Assim que possível')}</small></div>`:'';
 const promoSummary=promo?`<div class="summary"><b>✨ Combo completo</b><br>${esc(getProfessionals().find(x=>x.id===promo.originProId)?.name||'Profissional 1')} + ${esc(getProfessionals().find(x=>x.id===promo.partnerProId)?.name||'Profissional 2')}<br><small>Os dois horários serão registrados juntos para a mesma cliente.</small></div>`:'';
 $('#clientStep').innerHTML=`<div class="client-area"><div class="step-title">04 · ${promo?'CONFIRME OS DOIS AGENDAMENTOS':'CONFIRME SEU PEDIDO'}</div>${promo?promoSummary:''}<div class="summary"><b>${esc(p.name)}</b> · ${esc(s.name)} · ${formatDate(state.date)} às ${esc(state.time)}</div>${linkedPromo}${req}<form class="client-form" id="clientForm"><label>Seu nome<input name="nome" required placeholder="Seu nome"></label><label>WhatsApp<input name="whatsapp" required placeholder="(11) 99999-9999"></label><textarea name="observacao" rows="2" placeholder="Observação (opcional)"></textarea><button class="button" type="submit">${promo?'Confirmar os dois horários →':'Solicitar este horário →'}</button></form></div>`;
 $('#clientForm').onsubmit=e=>submitBooking(e,p,s);
}
function formatDate(d){const [y,m,day]=d.split('-');return new Date(Number(y),Number(m)-1,Number(day)).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}).replace('.','')}
function submitBooking(e,p,s){
 e.preventDefault();const f=new FormData(e.target),d=db()||{professionals:[],bookings:[]};d.bookings=d.bookings||[];const now=Date.now();
 const base={name:f.get('nome'),whatsapp:f.get('whatsapp'),observacao:f.get('observacao')||''};
 if(state.promoFlow){
   const promo=state.promoFlow;promo.selections[1]={proId:p.id,proName:p.name,service:s.name,date:state.date,time:state.time};
   const origin=getProfessionals().find(x=>x.id===promo.originProId),partner=getProfessionals().find(x=>x.id===promo.partnerProId);
   promo.selections.forEach((sel,i)=>{const pro=getProfessionals().find(x=>x.id===sel.proId);d.bookings.push({id:now+i,proId:sel.proId,proName:pro?.name||sel.proName,service:sel.service,date:sel.date,time:sel.time,name:base.name,whatsapp:base.whatsapp,observacao:base.observacao,partnerIds:[i===0?promo.partnerProId:promo.originProId],promo:origin?.promo||'',promoTerms:origin?.promoTerms||'',linkedBookingId:now+(i===0?1:0),promoBookingId:now,bookingType:'partnership',requirements:pro?.bookingRequirements||'',confirmationDeadline:pro?.confirmationDeadline||'Assim que possível'});});
   localStorage.setItem('agBeautyDB',JSON.stringify(d));
   const msg=`Olá! Novo combo da A&G Beauty.%0A%0ACliente: ${encodeURIComponent(base.name)}%0APromoção: ${encodeURIComponent(origin?.promo||'Combo em parceria')}%0A%0A${encodeURIComponent(origin?.name||'Profissional 1')}: ${encodeURIComponent(promo.selections[0].service)} — ${encodeURIComponent(formatDate(promo.selections[0].date))} às ${encodeURIComponent(promo.selections[0].time)}%0A${encodeURIComponent(partner?.name||'Profissional 2')}: ${encodeURIComponent(promo.selections[1].service)} — ${encodeURIComponent(formatDate(promo.selections[1].date))} às ${encodeURIComponent(promo.selections[1].time)}%0AWhatsApp: ${encodeURIComponent(base.whatsapp)}`;
   const originPhone=origin?.confirmationWhatsapp||'',partnerPhone=partner?.confirmationWhatsapp||'';const links=[];if(originPhone)links.push({label:`Enviar para ${origin.name}`,url:`https://wa.me/${originPhone.replace(/\D/g,'')}?text=${msg}`});if(partnerPhone)links.push({label:`Enviar para ${partner.name}`,url:`https://wa.me/${partnerPhone.replace(/\D/g,'')}?text=${msg}`});showSuccess('Combo agendado com sucesso!',`Os dois horários foram registrados. Envie a confirmação para as profissionais pelos botões abaixo.`,links);if(links[0])window.open(links[0].url,'_blank');return;
 }
 d.bookings.push({id:now,proId:p.id,proName:p.name,service:s.name,date:state.date,time:state.time,name:base.name,whatsapp:base.whatsapp,observacao:base.observacao,partnerIds:[],promo:p.promo||'',requirements:p.bookingRequirements||'',confirmationDeadline:p.confirmationDeadline||'Assim que possível'});localStorage.setItem('agBeautyDB',JSON.stringify(d));
 const msg=`Olá! Novo agendamento na A&G Beauty.%0A%0ACliente: ${encodeURIComponent(base.name)}%0AServiço: ${encodeURIComponent(s.name)}%0AData: ${encodeURIComponent(formatDate(state.date))}%0AHorário: ${encodeURIComponent(state.time)}%0AWhatsApp: ${encodeURIComponent(base.whatsapp)}%0AOrientações: ${encodeURIComponent(p.bookingRequirements||'Sem exigências adicionais')}%0APrazo de confirmação: ${encodeURIComponent(p.confirmationDeadline||'Assim que possível')}`;
 const phone=p.confirmationWhatsapp||'';const url=phone?`https://wa.me/${phone.replace(/\D/g,'')}?text=${msg}`:'';showSuccess('Solicitação registrada!',phone?'O horário foi reservado. A mensagem de confirmação está pronta para a profissional.':'O horário foi reservado no sistema. A profissional poderá consultar a agenda.',phone?[{label:`Enviar confirmação para ${p.name}`,url}]:[]);if(url)window.open(url,'_blank');
}
function showSuccess(title,text,links=[]){$('#serviceStep').innerHTML=`<div class="success-booking"><div class="check">✓</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${links.map(l=>`<a class="button" target="_blank" rel="noopener" href="${l.url}">${esc(l.label)} ↗</a>`).join('')}<button class="button" onclick="closeBooking()">Fechar</button></div>`;$('#dateStep').innerHTML='';$('#timeStep').innerHTML='';$('#clientStep').hidden=true;$('#professionalsList').innerHTML=''}
