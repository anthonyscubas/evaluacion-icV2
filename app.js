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
 ADMINISTRADOR:[['dashboard','▦','Resumen ejecutivo'],['schedule','▣','Fechas de evaluación'],['admin:analistas','◎','Analistas'],['admin:coordinadores','◈','Coordinadores'],['admin:controllers','◉','Controllers'],['admin:alicorp','▣','Alicorp'],['admin:canales','▦','Canales'],['history','▤','Histórico']],
 COORDINADOR:[['dashboard','▦','Resumen ejecutivo']],
 CONTROLLER:[['survey','▤','Evaluación interna']],
 ALICORP:[['survey','▤','Evaluación']]
};
function navigate(key){
 const allowed=permissions[S.role]||[];
 if(!allowed.some(x=>x[0]===key))return;
 const view=key.startsWith('admin:')?'admin':key;
 S.screen=key;document.querySelectorAll('.ic-screen').forEach(x=>x.hidden=x.id!==view);
 document.querySelectorAll('#menu a').forEach(x=>x.classList.toggle('active',x.dataset.screen===key));
 if(view==='admin')drawAdmin(key.split(':')[1]);
 if(view==='survey')drawMatrix();
 if(view==='schedule')drawSchedule();
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
 $('userName').textContent=S.user.nombre||S.role;$('userEmail').textContent=S.email;$('avatar').textContent=S.email.slice(0,2).toUpperCase();
     $('roleTag').textContent = S.role === 'ALICORP' ? '' : S.role;
     $('roleTag').hidden = S.role === 'ALICORP';
 $('surveyUser').textContent=S.user.nombre;
     $('surveyRole').textContent = S.role === 'ALICORP' ? '' : S.role;
     $('surveyRole').hidden = S.role === 'ALICORP';
     drawNav();
 navigate((permissions[S.role]||[])[0][0]);

 if (S.role === 'ALICORP' || S.role === 'CONTROLLER') {
   abrirGuia();
 }
 try{await refresh()}catch(err){notice('Ingresaste, pero no se pudieron cargar los datos: '+err.message,true)}
 }catch(err){const el=$('loginForm').querySelector('.ic-error')||document.createElement('p');el.className='ic-error';el.textContent=err.message;$('loginForm').append(el)}
 finally{btn.disabled=false;btn.textContent='Ver mi módulo →'}}
async function refresh() {
    S.data = await api({
        action: 'data',
        email: S.email
    });

    console.log('Datos recibidos:', S.data);
    console.log('Analistas:', S.data?.analistas?.length || 0);
    console.log('Evaluaciones:', S.data?.evaluaciones?.length || 0);

    if (S.screen.startsWith('admin:')) {
        drawAdmin(S.adminTab);
    }

    if (S.screen === 'dashboard') {
        drawDashboard();
    }

    if (S.screen === 'history') {
        drawHistory();
    }

    if (S.screen === 'survey') {
        drawMatrix();
    }
}
function selectedRows() {
    const periodo = String($('dashboardPeriod').value).trim();
    const analistas = S.data?.analistas || [];
    const evaluaciones = S.data?.evaluaciones || [];

    return analistas.map(a => {
        const registros = evaluaciones.filter(e =>
            String(e.analista_id).trim() === String(a.id).trim() &&
            String(e.periodo).trim() === periodo &&
            ['COMPLETA', 'COMPLETADO', 'FINALIZADA', 'FINALIZADO']
                .includes(String(e.estado || '').trim().toUpperCase())
        );

        const interna = registros
            .filter(e => String(e.tipo || '').trim().toUpperCase() === 'INTERNA')
            .sort((x, y) => String(y.fecha || '').localeCompare(String(x.fecha || '')))[0];

        const alicorp = registros
            .filter(e => String(e.tipo || '').trim().toUpperCase() === 'ALICORP')
            .sort((x, y) => String(y.fecha || '').localeCompare(String(x.fecha || '')))[0];

        const n = Number(!!interna) + Number(!!alicorp);

        const s =
            (interna ? Number(interna.puntaje) : 40.5) +
            (alicorp ? Number(alicorp.puntaje) : 49.5);

        const level = n === 0
            ? 'Sin evaluar'
            : s >= 90
                ? 'Excelente'
                : s >= 75
                    ? 'Cumple'
                    : s >= 60
                        ? 'En desarrollo'
                        : 'Requiere mejora';

        return {
            a,
            i: interna,
            v: alicorp,
            n,
            s,
            level
        };
    });
}
function drawDashboard(){if(!S.data)return;const rows=selectedRows(),covered=rows.filter(x=>x.n>0);
 $('kAverage').textContent=covered.length?(covered.reduce((x,y)=>x+y.s,0)/covered.length).toFixed(2):'—';
 $('kComplete').textContent=rows.filter(x=>x.n===2).length;
 $('kProgress').textContent=rows.filter(x=>x.n===1).length;
 $('kMissing').textContent=rows.filter(x=>x.n===0).length;
 $('dashboardRows').innerHTML=rows.map(x=>`<tr><td><strong>${esc(x.a.nombre)}</strong></td><td>${esc(x.a.canal)}</td><td>${x.i?Number(x.i.puntaje).toFixed(2):'<span class="ic-muted">40.50 (provisional)</span>'}</td><td>${x.v?Number(x.v.puntaje).toFixed(2):'<span class="ic-muted">49.50 (provisional)</span>'}</td><td><strong>${x.s.toFixed(2)}</strong></td><td>${x.n}/2</td><td><span class="ic-status">${esc(x.level)}</span></td></tr>`).join('')||'<tr><td colspan="7">No hay analistas registrados.</td></tr>'}
function drawHistory() {
    if (!S.data) return;

    const periodo = String($('historyPeriod').value || '').trim();

    const evaluaciones = (S.data.evaluaciones || [])
        .filter(e => {
            const periodoExcel = String(e.periodo || '').trim();
            return !periodo || periodoExcel === periodo;
        })
        .sort((a, b) =>
            String(b.fecha || '').localeCompare(String(a.fecha || ''))
        );

    console.log('Evaluaciones recibidas:', S.data.evaluaciones);
    console.log('Evaluaciones del periodo:', evaluaciones);

    $('historyRows').innerHTML = evaluaciones.map(e => `
        <tr>
            <td>${esc(String(e.fecha || '').slice(0, 10))}</td>
            <td>${esc(e.periodo)}</td>
            <td>${esc(e.analista)}</td>
            <td>${esc(e.tipo)}</td>
            <td>${esc(e.evaluador)}</td>
            <td>${esc(e.estado)}</td>
            <td>${esc(e.puntaje)} / ${esc(e.maximo)}</td>
        </tr>
    `).join('') || `
        <tr>
            <td colspan="7">
                No se encontraron evaluaciones para ${esc(periodo)}.
            </td>
        </tr>
    `;
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
      function drawSchedule() {
  const tipo = $('scheduleType').value;
  const config = (S.data?.configEvaluaciones || [])
    .find(c => c.tipo === tipo);

  $('scheduleStart').value = config?.fecha_inicio || '';
  $('scheduleEnd').value = config?.fecha_fin || '';
  $('scheduleEnabled').checked = config?.habilitado ?? false;

  $('scheduleStatus').textContent = config
    ? 'Configuración actual cargada.'
    : 'Todavía no se ha configurado este formulario.';
}

async function saveSchedule(e) {
  e.preventDefault();

  const btn = e.submitter;
  const inicio = $('scheduleStart').value;
  const fin = $('scheduleEnd').value;

  if (inicio > fin) {
    $('scheduleStatus').textContent =
      'La fecha de cierre no puede ser anterior al inicio.';
    return;
  }

  btn.disabled = true;
  $('scheduleStatus').textContent = 'Guardando configuración...';

  try {
    await api({
      action: 'saveConfigEvaluacion',
      email: S.email,
      tipo: $('scheduleType').value,
      fecha_inicio: inicio,
      fecha_fin: fin,
      habilitado: String($('scheduleEnabled').checked)
    });

    await refresh();
    $('scheduleStatus').textContent =
      'Configuración guardada correctamente.';
  } catch (err) {
    $('scheduleStatus').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

$('scheduleType').addEventListener('change', drawSchedule);
$('scheduleForm').addEventListener('submit', saveSchedule);
      
function abrirGuia() {
  if (!['CONTROLLER', 'ALICORP'].includes(S.role)) return;

  const tipo = surveyType();
  const preguntas = Q[tipo];
  const total = preguntas.reduce((suma, p) => suma + p[2], 0);

  $('guiaTitulo').textContent =
    tipo === 'INTERNA'
      ? 'Evaluación Controller'
      : 'Evaluación Alicorp';

  $('guiaDescripcion').textContent =
    tipo === 'INTERNA'
      ? 'Evaluación interna del desempeño de los analistas IC.'
      : 'Evaluación del desempeño de los analistas IC por parte del cliente.';

  $('guiaPreguntas').innerHTML = preguntas.map((p, i) => `
    <tr>
      <td>${i + 1}. ${esc(p[1])}</td>
      <td><strong>${p[2]} pts</strong></td>
    </tr>
  `).join('');

  $('guiaTotal').textContent = total + ' puntos';

  const ejemplo = preguntas[0];
  const puntos = (4 / 5) * ejemplo[2];

  $('guiaEjemplo').textContent =
    `Ejemplo: Si una pregunta vale ${ejemplo[2]} puntos ` +
    `y seleccionas 4 (Casi siempre), obtienes ` +
    `${puntos.toFixed(1)} puntos.`;

  $('modalGuia').showModal();
}

function cerrarGuiaEvaluacion() {
  $('modalGuia').close();
}

$('btnVerGuia').addEventListener('click', abrirGuia);
$('cerrarGuia').addEventListener('click', cerrarGuiaEvaluacion);
$('entendiGuia').addEventListener('click', cerrarGuiaEvaluacion);

function surveyType(){return S.role==='CONTROLLER'?'INTERNA':'ALICORP'}
function surveyAnalysts() {
    const analistas = S.data?.analistas || [];
    const correo = norm(S.email);
    const rol = norm(S.role).toUpperCase();

    if (rol === 'CONTROLLER') {
        return analistas.filter(a =>
            norm(a.controller) === correo
        );
    }

    if (rol === 'ALICORP') {
        return analistas.filter(a =>
            norm(a.alicorp ?? a.ALICORP) === correo
        );
    }

    return [];

}
function controlarDisponibilidad() {
  const tipo = surveyType();
  const config = (S.data?.configEvaluaciones || [])
    .find(c => c.tipo === tipo);

  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date())
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value])
  );
  
  const hoy = `${partes.year}-${partes.month}-${partes.day}`;

  let motivo = '';

  if (!config) {
    motivo = 'El Formulario expiro, intente nuevamente el siguiente mes.';
  } else if (!config.habilitado) {
    motivo = 'El formulario está deshabilitado.';
  } else if (hoy < config.fecha_inicio) {
    motivo = `Disponible desde el ${config.fecha_inicio}.`;
  } else if (hoy > config.fecha_fin) {
    motivo = `El periodo finalizó el ${config.fecha_fin}.`;
  }

  const cerrado = Boolean(motivo);

  $('surveyClosed').hidden = !cerrado;
  $('surveyClosedMessage').textContent = motivo;
  $('surveyForm').hidden = cerrado;

  return !cerrado;
}
function drawMatrix() {
    if (!S.data) return;
    if (!controlarDisponibilidad()) return;

    const type = surveyType();
    const q = Q[type];
    const list = surveyAnalysts();
    console.table(list.map(a => ({
       id: a.id,
       nombre: a.nombre,
       canal: a.canal
    })));
    const history = S.data.evaluaciones || [];
    const period = $('surveyPeriod').value;

    $('surveyKicker').textContent = 'EVALUACIÓN ANALISTAS';
    $('surveyTitle').textContent = type === 'INTERNA'
        ? 'Matriz de evaluación interna de analistas'
        : 'Matriz de evaluación de analistas';

    // Encabezados: preguntas primero, analistas después
    $('matrixHead').innerHTML = `
        <tr>
            <th class="matrix-question">Preguntas</th>
            ${list.map(a => `
               <th class="matrix-person">
                   <button
                       type="button"
                       class="analista-enlace"
                       data-id="${esc(a.id)}"
                   >
                       ${esc(a.nombre)}
                   </button>
           
                   <small style="display:block">
                       ${esc(a.canal)}
                   </small>
               </th>
           `).join('')}
        </tr>
    `;

    const anteriores = {};

    list.forEach(a => {
        const prev = history.find(e =>
            String(e.analista_id) === String(a.id) &&
            e.periodo === period &&
            e.tipo === type &&
            norm(e.evaluador) === S.email
        );

        let answers = [];
        try {
            answers = JSON.parse(prev?.respuestas_json || '[]');
        } catch {}

        anteriores[a.id] = {
            answers,
            comentario: prev?.comentario || ''
        };
    });

    // Filas: una por cada pregunta
    const filas = q.map((item, i) => `
        <tr>
            <th class="matrix-question">
                <span class="matrix-question-number">
                    P${i + 1} · ${item[2]} PTS
                </span>
                <span class="matrix-question-title">
                    ${esc(item[1])}
                </span>
            </th>

            ${list.map(a => `
                <td class="matrix-score-cell">
                    <div class="matrix-options">
                        ${[1, 2, 3, 4, 5].map(v => `
                            <label title="${[
                                'Nunca',
                                'Pocas veces',
                                'A veces',
                                'Casi siempre',
                                'Siempre'
                            ][v - 1]}">
                                <input
                                    type="radio"
                                    name="q_${esc(a.id)}_${i}"
                                    value="${v}"
                                    ${anteriores[a.id].answers[i] === v ? 'checked' : ''}
                                >
                                <span>${v}</span>
                            </label>
                        `).join('')}
                    </div>
                </td>
            `).join('')}
        </tr>
    `).join('');

    // Comentarios por analista
    const comentarios = `
        <tr>
            <th class="matrix-question">Comentario</th>
            ${list.map(a => `
                <td>
                    <textarea
                        class="ic-comment"
                        data-analyst="${esc(a.id)}"
                        maxlength="400"
                        rows="2"
                        placeholder="Observación opcional"
                    >${esc(anteriores[a.id].comentario)}</textarea>
                </td>
            `).join('')}
        </tr>
    `;

    $('matrixBody').innerHTML = list.length
        ? filas + comentarios
        : '<tr><td>No hay analistas asignados.</td></tr>';

    updateProgress();
}


function updateProgress() {
    const type = surveyType();
    const total = surveyAnalysts().length * Q[type].length;

    const answered = $('matrixBody')
        .querySelectorAll('input[type="radio"]:checked').length;

    const pct = total
        ? Math.round(answered / total * 100)
        : 0;

    $('progressPct').textContent = pct + ' %';
    $('progressBar').style.width = pct + '%';
    $('progressCount').textContent =
        `${answered} de ${total} respuestas seleccionadas`;
}


function mostrarEncuestasCompletadas() {
    if (document.getElementById('pantallaCompletada')) return;

    const pantalla = document.createElement('div');
    pantalla.id = 'pantallaCompletada';

    pantalla.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(12px);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    pantalla.innerHTML = `
        <div style="
            background: white;
            padding: 48px 35px;
            border-radius: 24px;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 25px 80px rgba(0,0,0,.25);
        ">
            <div style="
                width: 85px;
                height: 85px;
                background: #dcfce7;
                color: #16a34a;
                border-radius: 50%;
                margin: 0 auto 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 45px;
            ">✓</div>

            <h2 style="color:#0f172a;font-size:26px;">
                ¡Encuestas Completadas!
            </h2>

            <p style="color:#475569;margin-top:12px;">
                Todas las evaluaciones han sido
                guardadas correctamente.
            </p>

            <p style="color:#64748b;margin-top:25px;font-size:13px;">
                Cerrando sesión y regresando al inicio...
            </p>
        </div>
    `;

    document.body.appendChild(pantalla);

    setTimeout(() => {
        window.location.reload();
    }, 3000);
}


function iniciarCargaGuardado(total) {
    const overlay = document.getElementById('overlayGuardado');
    overlay.hidden = false;

    document.getElementById('loadingTitulo').textContent =
        'Guardando evaluaciones';

    document.getElementById('loadingDescripcion').textContent =
        `Preparando el registro de ${total} evaluación(es)...`;

    document.getElementById('loadingBarra').style.width = '0%';
    document.getElementById('loadingPorcentaje').textContent = '0%';
}

function actualizarCargaGuardado(actual, total) {
    const porcentaje = Math.round((actual / total) * 100);

    document.getElementById('loadingBarra').style.width =
        porcentaje + '%';

    document.getElementById('loadingPorcentaje').textContent =
        porcentaje + '%';

    document.getElementById('loadingDescripcion').textContent =
        `Registrando evaluación ${actual} de ${total}...`;
}

function finalizarCargaGuardado() {
    document.getElementById('loadingTitulo').textContent =
        '¡Evaluaciones guardadas correctamente!';

    document.getElementById('loadingDescripcion').textContent =
        'Todas las respuestas enviadas fueron registradas.';

    document.getElementById('loadingBarra').style.width = '100%';
    document.getElementById('loadingPorcentaje').textContent = '100%';

    const spinner = document.querySelector('.ic-loading-spinner');
    spinner.style.animationPlayState = 'paused';
}

function cerrarCargaGuardado() {
    document.getElementById('overlayGuardado').hidden = true;
    document.querySelector('.ic-loading-spinner')
        .style.animationPlayState = 'running';
}

async function saveMatrix(full) {
    if (!controlarDisponibilidad()) {
      notice('El periodo de evaluación está cerrado.', true);
      return;
    }
    const type = surveyType();
    const q = Q[type];
    const period = $('surveyPeriod').value;
    const analistas = surveyAnalysts();

    const entries = analistas.map(a => ({
        analista_id: a.id,

        answers: q.map((_, i) => {
            const selector =
                `input[name="q_${CSS.escape(String(a.id))}_${i}"]:checked`;

            const input = $('matrixBody').querySelector(selector);

            return input ? Number(input.value) : null;
        }),

        comentario: [...$('matrixBody').querySelectorAll(
            'textarea[data-analyst]'
        )].find(t => t.dataset.analyst === String(a.id))?.value || ''

    })).filter(x => x.answers.some(v => v !== null));


    if (!entries.length) {
        notice('Selecciona al menos una respuesta para guardar.', true);
        return;
    }

    if (full && entries.some(x => x.answers.some(v => v === null))) {
        notice('Completa todas las preguntas antes de finalizar.', true);
        return;
    }

    const saveBtn = $('saveSurveys');
    const draftBtn = $('saveDrafts');

    saveBtn.disabled = true;
    draftBtn.disabled = true;
    iniciarCargaGuardado(entries.length);

    let good = 0;
    const guardados = new Set();

    try {
        // 1. GUARDAR RESPUESTAS
        for (const e of entries) {
            await api({
                action: 'save',
                email: S.email,
                tipo: type,
                analista_id: e.analista_id,
                periodo: period,
                comentario: e.comentario,
                respuestas: JSON.stringify(e.answers)
            });

            good++;
            actualizarCargaGuardado(good, entries.length);

            if (full) {
                guardados.add(String(e.analista_id).trim());
            }
        }

       // 2. ACTUALIZAR DATOS
       document.getElementById('loadingTitulo').textContent =
           'Verificando evaluaciones';
       
       document.getElementById('loadingDescripcion').textContent =
           'Comprobando que todas las respuestas se registraron correctamente...';
       
       await refresh();
       
       finalizarCargaGuardado();
       
       await new Promise(resolve => setTimeout(resolve, 900));
       
       cerrarCargaGuardado();


        // 3. OBTENER ANALISTAS ASIGNADOS
        const asignados = surveyAnalysts();

        // 4. OBTENER EVALUACIONES COMPLETADAS
        const estadosValidos = [
            'COMPLETA',
            'COMPLETADO',
            'COMPLETADA',
            'FINALIZADA',
            'FINALIZADO'
        ];

        const evaluaciones = S.data?.evaluaciones || [];

        const completados = new Set(guardados);

        for (const ev of evaluaciones) {
            const mismoTipo =
                String(ev.tipo || '').trim().toUpperCase() === type;

            const mismoPeriodo =
                String(ev.periodo || '').trim() === period;

            const mismoEvaluador =
                norm(ev.evaluador) === norm(S.email);

            const estadoValido = estadosValidos.includes(
                String(ev.estado || '').trim().toUpperCase()
            );

            if (
                mismoTipo &&
                mismoPeriodo &&
                mismoEvaluador &&
                estadoValido
            ) {
                completados.add(
                    String(ev.analista_id).trim()
                );
            }
        }

        // 5. COMPROBAR TODOS LOS CUESTIONARIOS
        const todosCompletados =
            asignados.length > 0 &&
            asignados.every(a =>
                completados.has(String(a.id).trim())
            );

        console.log('Analistas asignados:', asignados.length);
        console.log('Cuestionarios completados:', completados.size);
        console.log('Todos completados:', todosCompletados);

        // 6. FINALIZAR Y CERRAR SESIÓN
        if (full && todosCompletados) {
            mostrarEncuestasCompletadas();
            return;
        }

        notice(`${good} evaluación(es) guardada(s)`);

        if (good === entries.length) {
            mostrarMensajeGuardado();
        }

    } catch (err) {
        cerrarCargaGuardado();
    
        notice(
            `Se guardaron ${good} de ${entries.length}. Error: ${err.message}`,
            true
        );
    
    } finally {
        cerrarCargaGuardado();
    
        saveBtn.disabled = false;
        draftBtn.disabled = false;
    }
}

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

const ventanaReportes = $('modal-reportes');

let reportes = [];
let reportesCargados = false;

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO',
  'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE',
  'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

function enlaceSeguro(valor, texto = 'Ver enlace') {
  const url = String(valor ?? '').trim();

  if (!/^https?:\/\//i.test(url)) {
    return esc(url || '—');
  }

  return `
    <a href="${esc(url)}"
       target="_blank"
       rel="noopener noreferrer">
       ${esc(texto)} ↗
    </a>
  `;
}

function mesReporte(valor) {
  const s = String(valor ?? '').trim();
  const n = Number(s);

  if (/^\d{4}-\d{2}$/.test(s)) {
    return Number(s.slice(5));
  }

  if (Number.isInteger(n) && n >= 1 && n <= 12) {
    return n;
  }

  return MESES.findIndex(m =>
    m.toLowerCase() === s.toLowerCase()
  ) + 1;
}

async function abrirReporteAnalista(analista) {

  const periodo = $('surveyPeriod').value;
  const mesNumero = Number(periodo.split('-')[1]);
  const mesNombre = MESES[mesNumero - 1];

  $('reporteMes').textContent = mesNombre;
  $('reporteAnalista').textContent =
    'ANALISTA: ' + analista.nombre;

  $('filasReportes').innerHTML = '';
  $('reporteInnovacion').innerHTML = '';
  $('estadoReportes').textContent = 'Cargando información...';

  ventanaReportes.showModal();

  try {

    if (!reportesCargados) {
      const respuesta = await api({
        action: 'reportes',
        email: S.email
      });

      if (!Array.isArray(respuesta)) {
        throw new Error('La respuesta de reportes no es una lista.');
      }

      reportes = respuesta;
      reportesCargados = true;
    }

    const datos = reportes.filter(r => {

      const mismoAnalista =
        norm(r.analista) === norm(analista.nombre);

      const mismoMes =
        mesReporte(r.mes) === mesNumero;

      return mismoAnalista && mismoMes;
    });

    if (!datos.length) {
      $('estadoReportes').textContent =
        'No hay reportes registrados para este analista en '
        + mesNombre + '.';
      return;
    }

    $('estadoReportes').textContent = '';

    $('filasReportes').innerHTML = datos.map(r => `
      <tr>
        <td>${esc(r.reporte)}</td>
        <td>${esc(r.kpi)}</td>
        <td>${enlaceSeguro(r.prueba_reporte, 'Ver prueba')}</td>
      </tr>
    `).join('');

    const innovaciones = [
      ...new Set(
        datos.map(r => String(r.innovacion ?? '').trim())
             .filter(Boolean)
      )
    ];

    $('reporteInnovacion').innerHTML =
      innovaciones.length
        ? innovaciones.map(url => `
            <p>${enlaceSeguro(url, 'Ver innovación')}</p>
          `).join('')
        : '<p>No se registró innovación.</p>';

  } catch (error) {

    $('estadoReportes').textContent =
      'Error al cargar reportes: ' + error.message;

  }
}

$('matrixHead').addEventListener('click', e => {
  const boton = e.target.closest('.analista-enlace');
  if (!boton) return;
  const analista = surveyAnalysts().find(a =>
    String(a.id) === String(boton.dataset.id)
  );
  if (analista) {
    abrirReporteAnalista(analista);
  }
});
$('cerrarReportes').addEventListener('click', () => {
  ventanaReportes.close();
});
})();
