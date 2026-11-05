(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLowerCase();
const Q={
 INTERNA:[
 ['solicita_datos_tiempo','¿El analista solicita los datos necesarios para realizar el reporte a tiempo?',5],
 ['envia_validar_plazo','¿El analista envía a validar la información relevada en los plazos solicitados?',5],
 ['publica_reportes_tiempo','¿El analista envía / publica los reportes / solicitudes a tiempo?',7],
 ['comunica_incidencias_tiempo','¿El analista comunica a tiempo incidencias encontradas en la data al equipo comercial y cliente?',5],
 ['resuelve_incidencias_tiempo','¿El analista atiende y resuelve las incidencias levantadas a tiempo?',6],
 ['capacita_actualizaciones','¿El analista capacita al equipo comercial en el uso de plataforma app / web cuando hay actualizaciones?',4],
 ['comunica_status_tiempo','¿El analista comunica status de avances del relevo de la información a tiempo?',4],
 ['registra_inconsistencias','¿El analista registró inconsistencia en el/los reporte a cargo del analista?',5],
 ['propone_soluciones',"¿El analista aplica soluciones innovadoras en el/los reportes/KPI a su cargo?",4]],
 ALICORP:[
 ['publica_reportes_tiempo','¿El analista envía / publica los reportes / solicitudes a tiempo?',14],
 ['participa_reuniones','¿El analista participa en reuniones CLAVES con el cliente?',9],
 ['resuelve_incidencias_tiempo','¿El analista atiende y resuelve las incidencias levantadas a tiempo?',13],
 ['registra_inconsistencias','¿El analista registró inconsistencia en el/los reporte a cargo del analista?',10],
 ['propone_soluciones',"¿El analista aplica soluciones innovadoras en el/los reportes/KPI a su cargo?",9]]
};
const S={email:'',user:null,data:null,role:'',screen:'',adminTab:'analistas'};
const today=new Date(),currentPeriod=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
['surveyPeriod','dashboardPeriod','historyPeriod'].forEach(id=>$(id).value=currentPeriod);
function notice(msg,bad=false){const el=$('notice');el.textContent=msg;el.hidden=!msg;el.classList.toggle('bad',bad)}
function api(p){const url=window.IC_CONFIG?.scriptUrl?.trim();if(!url||!url.startsWith('https://script.google.com/macros/s/'))return Promise.reject(Error('Configura scriptUrl en config.js.'));
return new Promise((resolve,reject)=>{const cb='icCb'+Date.now()+Math.floor(Math.random()*99999),sc=document.createElement('script');let done=false;
const timeout=setTimeout(()=>finish(Error('Tiempo de espera agotado')),30000);
function finish(e,d){if(done)return;done=true;clearTimeout(timeout);delete window[cb];sc.remove();e?reject(e):resolve(d)}
window[cb]=r=>r?.ok?finish(null,r.data):finish(Error(r?.error||'Respuesta inválida'));
sc.onerror=()=>finish(Error('No se pudo conectar a Apps Script'));
sc.src=url+'?'+new URLSearchParams({...p,callback:cb,_:Date.now()});document.head.appendChild(sc);
})}
const permissions={
 ADMINISTRADOR:[['dashboard','▦','Resumen ejecutivo'],['admin:analistas','◎','Analistas'],['admin:coordinadores','◈','Coordinadores'],['admin:controllers','◉','Controllers'],['admin:alicorp','▣','Alicorp'],['admin:canales','▦','Canales'],['history','▤','Histórico']],
 COORDINADOR:[['dashboard','▦','Resumen ejecutivo']],
 CONTROLLER:[['survey','▤','Evaluación interna']],
 ALICORP:[['survey','▤','Evaluación Alicorp']]
};
function navigate(key){
 const allowed=permissions[S.role]||[];
 if(!allowed.some(x=>x[0]===key))return;
 const view=key.startsWith('admin:')?'admin':key;
 S.screen=key;document.querySelectorAll('.ic-screen').forEach(x=>x.hidden=x.id!==view);
 document.querySelectorAll('#menu a').forEach(x=>x.classList.toggle('active',x.dataset.screen===key));
 if(view==='admin')drawAdmin(key.split(':')[1]);
 if(view==='survey')drawMatrix();
 if(view==='dashboard')drawDashboard();
 if(view==='history')drawHistory();
 const item=allowed.find(x=>x[0]===key);
 $('topTitle').textContent=item?.[2]||'Plataforma';
 notice('');
 if(innerWidth<=820)document.body.classList.remove('ic-menu-open');
}
function drawNav(){const opts=permissions[S.role]||[];$('menu').innerHTML=opts.map(([id,sym,label])=>`<a href="#${esc(id)}" data-screen="${esc(id)}"><span class="menu-symbol">${sym}</span>${esc(label)}</a>`).join('');
 $('menu').querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.screen)}))}
async function login(e){e.preventDefault();const btn=e.submitter||$('loginForm').querySelector('button');btn.disabled=true;btn.textContent='Verificando…';
 try{S.email=norm($('email').value);const r=await api({action:'login',email:S.email});S.user=r.user;S.role=String(r.user.rol||'').toUpperCase();
 if(!permissions[S.role])throw Error('Rol no reconocido.');
 $('access').hidden=true;$('workspace').hidden=false;document.body.classList.remove('guest-layout');document.body.classList.add('has-sidebar');
 $('userName').textContent=S.user.nombre||S.role;$('userEmail').textContent=S.email;$('avatar').textContent=S.email.slice(0,2).toUpperCase();$('roleTag').textContent=S.role;
 $('surveyUser').textContent=S.user.nombre;$('surveyRole').textContent=S.role;drawNav();
 navigate((permissions[S.role]||[])[0][0]);
 try{await refresh()}catch(err){notice('Ingresaste, pero no se pudieron cargar los datos: '+err.message,true)}
 }catch(err){const el=$('loginForm').querySelector('.ic-error')||document.createElement('p');el.className='ic-error';el.textContent=err.message;$('loginForm').append(el)}
 finally{btn.disabled=false;btn.textContent='Ver mi módulo →'}}
async function refresh(){S.data=await api({action:'data',email:S.email});if(S.screen.startsWith('admin:'))drawAdmin(S.adminTab);if(S.screen==='dashboard')drawDashboard();if(S.screen==='history')drawHistory();if(S.screen==='survey')drawMatrix()}
function selectedRows(){const p=$('dashboardPeriod').value;return(S.data?.analistas||[]).map(a=>{
 const e=(S.data.evaluaciones||[]).filter(x=>String(x.analista_id)===String(a.id)&&String(x.periodo)===p&&x.estado==='COMPLETA');
 const i=e.find(x=>x.tipo==='INTERNA'),v=e.find(x=>x.tipo==='ALICORP'),n=Number(Boolean(i))+Number(Boolean(v));
 const s=(i?Number(i.puntaje):40.5)+(v?Number(v.puntaje):49.5);
 const level=n===0?'Sin evaluar':s>=90?'Excelente':s>=75?'Cumple':s>=60?'En desarrollo':'Requiere mejora';
 return {a,i,v,n,s,level}
})}
function drawDashboard(){if(!S.data)return;const rows=selectedRows(),covered=rows.filter(x=>x.n>0);
 $('kAverage').textContent=covered.length?(covered.reduce((x,y)=>x+y.s,0)/covered.length).toFixed(2):'—';
 $('kComplete').textContent=rows.filter(x=>x.n===2).length;
 $('kProgress').textContent=rows.filter(x=>x.n===1).length;
 $('kMissing').textContent=rows.filter(x=>x.n===0).length;
 $('dashboardRows').innerHTML=rows.map(x=>`<tr><td><strong>${esc(x.a.nombre)}</strong></td><td>${esc(x.a.canal)}</td><td>${x.i?Number(x.i.puntaje).toFixed(2):'<span class="ic-muted">40.50 (provisional)</span>'}</td><td>${x.v?Number(x.v.puntaje).toFixed(2):'<span class="ic-muted">49.50 (provisional)</span>'}</td><td><strong>${x.s.toFixed(2)}</strong></td><td>${x.n}/2</td><td><span class="ic-status">${esc(x.level)}</span></td></tr>`).join('')||'<tr><td colspan="7">No hay analistas registrados.</td></tr>'}
function drawHistory(){if(!S.data)return;const p=$('historyPeriod').value;
 const evals=(S.data.evaluaciones||[]).filter(x=>!p||String(x.periodo)===p).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
 $('historyRows').innerHTML=evals.map(e=>`<tr><td>${esc(String(e.fecha||'').slice(0,10))}</td><td>${esc(e.periodo)}</td><td>${esc(e.analista)}</td><td>${esc(e.tipo)}</td><td>${esc(e.evaluador)}</td><td>${esc(e.estado)}</td><td>${esc(e.puntaje)} / ${esc(e.maximo)}</td></tr>`).join('')||'<tr><td colspan="7">Sin evaluaciones en este periodo.</td></tr>';
}
const adminTitles={analistas:'Analistas',coordinadores:'Coordinadores',controllers:'Controllers',alicorp:'Accesos Alicorp',canales:'Canales'};
function drawAdmin(tab){S.adminTab=tab;$('adminTitle').textContent=adminTitles[tab];$('adminHeading').textContent='Gestión de '+adminTitles[tab].toLowerCase();$('adminNum').textContent=String(Object.keys(adminTitles).indexOf(tab)+1).padStart(2,'0');$('adminPeriod').textContent='Periodo '+currentPeriod;
 document.querySelectorAll('#adminTabs button').forEach(b=>b.classList.toggle('is-active',b.dataset.admin===tab));
 const analyst=tab==='analistas',channel=tab==='canales';$('analystForm').hidden=!analyst;$('userForm').hidden=analyst||channel;$('channelForm').hidden=!channel;
 $('formTitle').textContent=analyst?'Nuevo analista':channel?'Nuevo canal':'Nuevo '+adminTitles[tab].slice(0,-1);
 $('listTitle').textContent=adminTitles[tab]+' registrados';
 $('adminHint').textContent=analyst?'Administra los analistas y sus canales.':channel?'Gestiona los canales disponibles.':'Administra usuarios, responsables y accesos.';
 if(!analyst&&!channel)$('newUserRole').value=tab==='coordinadores'?'COORDINADOR':tab==='controllers'?'CONTROLLER':'ALICORP';
 let values=analyst?(S.data?.analistas||[]):channel?(S.data?.canales||[]):(S.data?.usuarios||[]).filter(u=>String(u.rol).toUpperCase()===(tab==='coordinadores'?'COORDINADOR':tab==='controllers'?'CONTROLLER':'ALICORP'));
 $('adminList').innerHTML=values.map(a=>`<div class="ic-list-row"><strong>${esc(a.nombre)}</strong><small>${esc(analyst?a.canal+' · '+(a.correo||'Sin correo'):channel?'Canal activo':a.correo)}</small></div>`).join('')||'<p class="ic-muted">No hay registros todavía.</p>';
}
function surveyType(){return S.role==='CONTROLLER'?'INTERNA':'ALICORP'}
function surveyAnalysts() {
    const analistas = S.data?.analistas || [];

    if (S.role === 'CONTROLLER') {
        return analistas.filter(a =>
            !a.controller ||
            norm(a.controller) === S.email
        );
    }

    if (S.role === 'ALICORP') {
        return analistas.filter(a =>
            norm(a.alicorp) === S.email
        );
    }

    return [];
}
function drawMatrix(){if(!S.data)return;const type=surveyType(),q=Q[type],list=surveyAnalysts();
 $('surveyKicker').textContent=(type==='INTERNA'?'EVALUACIÓN INTERNA · 45 PUNTOS':'EVALUACIÓN ALICORP · 55 PUNTOS');
 $('surveyTitle').textContent=type==='INTERNA'?'Matriz de evaluación interna de analistas':'Matriz de evaluación de analistas';
 $('scaleLegend').innerHTML=['Nunca','Pocas veces','A veces','Casi siempre','Siempre'].map((x,i)=>`<div class="escala-item"><span class="escala-numero">${i+1}</span><span class="escala-titulo">${x}</span></div>`).join('');
 $('matrixHead').innerHTML='<tr><th class="matrix-person">Analista</th><th class="matrix-area">Área / canal</th>'+q.map((x,i)=>`<th class="matrix-question"><span class="matrix-question-number">P${i+1} · ${x[2]} PTS</span><span class="matrix-question-title">${esc(x[1])}</span></th>`).join('')+'<th class="matrix-area">Comentario</th></tr>';
 const history=S.data.evaluaciones||[],period=$('surveyPeriod').value;
 $('matrixBody').innerHTML=list.map(a=>{const prev=history.find(e=>String(e.analista_id)===String(a.id)&&e.periodo===period&&e.tipo===type&&norm(e.evaluador)===S.email);
 let answers=[];try{answers=JSON.parse(prev?.respuestas_json||'[]')}catch{}
 return `<tr data-analyst="${esc(a.id)}"><th class="matrix-person">${esc(a.nombre)}</th><td class="matrix-area">${esc(a.canal)}</td>`+q.map((item,i)=>`<td class="matrix-score-cell"><div class="matrix-options">${[1,2,3,4,5].map(v=>`<label title="${['Nunca','Pocas veces','A veces','Casi siempre','Siempre'][v-1]}"><input type="radio" name="q_${esc(a.id)}_${i}" value="${v}" ${answers[i]===v?'checked':''}><span>${v}</span></label>`).join('')}</div></td>`).join('')+`<td><textarea class="ic-comment" maxlength="400" rows="2" placeholder="Observación opcional">${esc(prev?.comentario||'')}</textarea></td></tr>`}).join('')||'<tr><td colspan="'+(q.length+3)+'">No hay analistas asignados. El administrador debe registrar analistas.</td></tr>';
 updateProgress();
}
function updateProgress(){const rows=[...$('matrixBody').querySelectorAll('tr[data-analyst]')],total=rows.length*Q[surveyType()].length,answered=rows.reduce((s,r)=>s+r.querySelectorAll('input:checked').length,0),pct=total?Math.round(answered/total*100):0;
 $('progressPct').textContent=pct+' %';$('progressBar').style.width=pct+'%';$('progressCount').textContent=`${answered} de ${total} respuestas seleccionadas`}
async function saveMatrix(full){const rows=[...$('matrixBody').querySelectorAll('tr[data-analyst]')],type=surveyType(),q=Q[type],period=$('surveyPeriod').value;
 const entries=rows.map(r=>({analista_id:r.dataset.analyst,answers:q.map((_,i)=>{const x=r.querySelector(`input[name="q_${CSS.escape(r.dataset.analyst)}_${i}"]:checked`);return x?Number(x.value):null}),comentario:r.querySelector('textarea').value})).filter(x=>x.answers.some(v=>v!==null));
 if(!entries.length){notice('Selecciona al menos una respuesta para guardar.',true);return}
 if(full&&entries.some(x=>x.answers.some(v=>v===null))){notice('Completa todas las preguntas de cada analista que empezaste a evaluar, o guarda como borrador.',true);return}
 const saveBtn=$('saveSurveys'),draftBtn=$('saveDrafts');saveBtn.disabled=draftBtn.disabled=true;
 let good=0;try{for(const e of entries){await api({action:'save',email:S.email,tipo:type,analista_id:e.analista_id,periodo:period,comentario:e.comentario,respuestas:JSON.stringify(e.answers)});good++}
 await refresh();notice(`${good} evaluación(es) guardada(s) en Google Sheets.`)}
 catch(err){notice(`Se guardaron ${good} de ${entries.length}. Error: ${err.message}`,true)}
 finally{saveBtn.disabled=draftBtn.disabled=false}}
async function saveAdmin(e,action){e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const p=Object.fromEntries(new FormData(e.target).entries());await api({...p,action,email:S.email});e.target.reset();await refresh();notice('Registro guardado correctamente en Google Sheets.')}catch(err){notice(err.message,true)}finally{btn.disabled=false}}
function exportCsv(){const rows=[...$('historyRows').querySelectorAll('tr')].filter(r=>r.children.length===7).map(r=>[...r.children].map(td=>td.textContent));
 const data=[['Fecha','Periodo','Analista','Evaluación','Evaluador','Estado','Puntaje'],...rows].map(r=>r.map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='evaluaciones_IC_'+$('historyPeriod').value+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
$('loginForm').addEventListener('submit',login);$('logout').addEventListener('click',()=>location.reload());$('brandHome').addEventListener('click',e=>{e.preventDefault();navigate(permissions[S.role][0][0])});
$('dashboardPeriod').addEventListener('change',drawDashboard);$('historyPeriod').addEventListener('change',drawHistory);$('surveyPeriod').addEventListener('change',drawMatrix);
$('adminTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>navigate('admin:'+b.dataset.admin)));
$('analystForm').addEventListener('submit',e=>saveAdmin(e,'addAnalyst'));$('userForm').addEventListener('submit',e=>saveAdmin(e,'addUser'));$('channelForm').addEventListener('submit',e=>saveAdmin(e,'addChannel'));
$('surveyForm').addEventListener('submit',e=>{e.preventDefault();saveMatrix(true)});$('saveDrafts').addEventListener('click',()=>saveMatrix(false));$('matrixBody').addEventListener('change',updateProgress);$('exportCsv').addEventListener('click',exportCsv);
$('menuToggle').addEventListener('click',()=>document.body.classList.toggle('ic-menu-open'));
})();
