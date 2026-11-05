(()=>{'use strict';
const Q={
 INTERNA:[
 ['solicita_datos_tiempo','Solicita los datos necesarios a tiempo',5],
 ['envia_validar_plazo','Envía la información para validar dentro del plazo',5],
 ['publica_reportes_tiempo','Publica reportes a tiempo',7],
 ['comunica_incidencias_tiempo','Comunica incidencias oportunamente',5],
 ['resuelve_incidencias_tiempo','Resuelve incidencias a tiempo',6],
 ['capacita_actualizaciones','Se capacita y actualiza sus conocimientos',4],
 ['comunica_status_tiempo','Comunica el estado de sus tareas a tiempo',4],
 ['registra_inconsistencias','Frecuencia de inconsistencias registradas (puntuación inversa)',5],
 ['propone_soluciones','Propone soluciones y mejoras',4]],
 ALICORP:[
 ['publica_reportes_tiempo','Publica reportes a tiempo',14],
 ['participa_reuniones','Participa en reuniones',9],
 ['resuelve_incidencias_tiempo','Resuelve incidencias a tiempo',13],
 ['registra_inconsistencias','Frecuencia de inconsistencias registradas (puntuación inversa)',10],
 ['propone_soluciones','Propone soluciones y mejoras',9]]
};
const $=id=>document.getElementById(id), state={email:'',user:null,data:null};
function alertMsg(s){$('alert').textContent=s||''}
function api(params){
 const url=window.IC_CONFIG?.scriptUrl?.trim();
 if(!url||!/^https:\/\/script\.google\.com\/macros\/s\//.test(url))return Promise.reject(Error('Configura la URL de Apps Script en config.js'));
 return new Promise((resolve,reject)=>{
  const cb='icCb'+Date.now()+Math.floor(Math.random()*100000),script=document.createElement('script');
  let done=false;
  const timeout=setTimeout(()=>finish(Error('Tiempo de espera agotado')),18000);
  function finish(err,data){if(done)return;done=true;clearTimeout(timeout);delete window[cb];script.remove();err?reject(err):resolve(data)}
  window[cb]=r=>r.ok?finish(null,r.data):finish(Error(r.error||'Error'));
  script.onerror=()=>finish(Error('No se pudo conectar con Google Apps Script'));
  script.src=url+'?'+new URLSearchParams({...params,callback:cb,_:Date.now()});
  document.head.appendChild(script);
 });
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(view){
 document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==view);
 document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 $('sectionName').textContent=({inicio:'Inicio',evaluar:'Evaluaciones',historial:'Historial',admin:'Administración'})[view]||'Acceso';
 if(view==='historial')renderHistory();
}
async function refresh(){
 state.data=await api({action:'data',email:state.email});
 const d=state.data;
 $('countAnalysts').textContent=d.analistas.length;
 $('countEvals').textContent=d.evaluaciones.length;
 $('countComplete').textContent=d.evaluaciones.filter(x=>x.estado==='COMPLETA').length;
 $('analista').innerHTML='<option value="">Seleccionar analista</option>'+d.analistas.map(a=>`<option value="${escape(a.id)}">${escape(a.nombre)} · ${escape(a.canal)}</option>`).join('');
 $('usersList').innerHTML=d.usuarios.map(u=>`<div>${escape(u.nombre)} — ${escape(u.correo)} <b>${escape(u.rol)}</b></div>`).join('')||'Sin usuarios';
 renderHistory();
}
function renderHistory(){
 $('historyRows').innerHTML=(state.data?.evaluaciones||[]).map(e=>`<tr><td>${escape(e.periodo)}</td><td>${escape(e.analista)}</td><td>${escape(e.tipo)}</td><td>${escape(e.evaluador)}</td><td>${escape(e.estado)}</td><td>${escape(e.puntaje)} / ${escape(e.maximo)}</td></tr>`).join('')||'<tr><td colspan="6">Sin evaluaciones</td></tr>';
}
function renderQuestions(){
 const type=$('tipo').value;
 $('questions').innerHTML=Q[type].map(([key,label,weight],i)=>`<div class="question"><h3>${i+1}. ${escape(label)} <small>(${weight} puntos)</small></h3><div class="scale">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="q${i}" value="${v}">${v}</label>`).join('')}</div></div>`).join('');
}
async function login(e){
 e.preventDefault();alertMsg('Ingresando…');
 try{
  const email=$('email').value.trim().toLowerCase(),res=await api({action:'login',email});
  state.email=email;state.user=res.user;
  $('login').hidden=true;$('nav').hidden=false;$('logout').hidden=false;
  $('who').textContent=res.user.nombre+' · '+res.user.rol;
  const admin=res.user.rol.toUpperCase()==='ADMINISTRADOR';
  $('adminLink').hidden=!admin;
  const allowed=res.user.rol.toUpperCase();
  $('tipo').innerHTML=['ADMINISTRADOR','CONTROLLER','COORDINADOR'].includes(allowed)?'<option value="INTERNA">Evaluación interna · 45 puntos</option>':'';
  if(['ADMINISTRADOR','ALICORP'].includes(allowed))$('tipo').innerHTML+='<option value="ALICORP">Evaluación Alicorp · 55 puntos</option>';
  renderQuestions();await refresh();show('inicio');alertMsg('');
 }catch(err){alertMsg(err.message)}
}
async function save(complete){
 alertMsg('Guardando…');
 try{
  const type=$('tipo').value,answers=Q[type].map((_,i)=>{const el=document.querySelector(`input[name="q${i}"]:checked`);return el?Number(el.value):null});
  if(complete&&answers.some(v=>v===null))throw Error('Responde todas las preguntas para completar la evaluación');
  if(!$('analista').value)throw Error('Selecciona un analista');
  const result=await api({action:'save',email:state.email,tipo:type,analista_id:$('analista').value,periodo:$('periodo').value,comentario:$('comentario').value,respuestas:JSON.stringify(answers)});
  await refresh();alertMsg(`Guardado: ${result.estado}. Puntaje: ${result.puntaje}`);show('historial');
 }catch(err){alertMsg(err.message)}
}
async function submitAdmin(e,action){
 e.preventDefault();alertMsg('Guardando…');
 try{const params=Object.fromEntries(new FormData(e.target).entries());await api({...params,action,email:state.email});e.target.reset();await refresh();alertMsg('Registro guardado correctamente')}
 catch(err){alertMsg(err.message)}
}
$('loginForm').addEventListener('submit',login);
$('logout').addEventListener('click',()=>location.reload());
document.querySelectorAll('[data-view]').forEach(x=>x.addEventListener('click',()=>{alertMsg('');show(x.dataset.view)}));
$('tipo').addEventListener('change',renderQuestions);
$('evalForm').addEventListener('submit',e=>{e.preventDefault();save(true)});
$('draft').addEventListener('click',()=>save(false));
$('userForm').addEventListener('submit',e=>submitAdmin(e,'addUser'));
$('analystForm').addEventListener('submit',e=>submitAdmin(e,'addAnalyst'));
$('periodo').value=new Date().toISOString().slice(0,7);
})();
