import {cloudConfigured,connectJournal} from "./cloud-journal.mjs";
import {hexagramReadings} from "./hexagram-readings.mjs";
import {practiceGuide,yarrowInstructions} from "./practice-guide.mjs";
import {illustrationDescriptions} from "./illustrations.mjs";
import {figures,trigrams,trigramOrder,states,figureNumber,calculate,choosePassages,simulatedYarrow,valuesFromFigure} from "./engine.mjs";

const main=document.querySelector("main");
if(cloudConfigured)document.getElementById("account-nav").hidden=false;
const book=await fetch(new URL("./book.json",import.meta.url)).then(response=>{
 if(!response.ok) throw new Error("No se pudo cargar el libro.");
 return response.json();
}).catch(()=>null);
const key="iching-journal-v1";
let journal=[];
let storageAvailable=true;
try {
 const saved=JSON.parse(localStorage.getItem(key)||"[]");
 if(Array.isArray(saved))journal=saved.filter(item=>item&&typeof item.id==="string"&&/^[\w-]+$/.test(item.id)&&["coins","yarrow"].includes(item.method)&&Array.isArray(item.values)&&item.values.length===6&&item.values.every(value=>Object.hasOwn(states,value)&&Number.isInteger(value)));
}
catch {storageAvailable=false;}
const localEntries=journal;
if(cloudConfigured)journal=[];
let question="", method="coins", input="coins", values=[], coins=[false,false,false], coinTouched=[false,false,false], reflection="", activeId=null;
let topic="", context="", followUp="", consultedOn="";
let externalDraft=null;
let language="es", readingMode="guided", builder="111000";
const methods={coins:"Tres monedas",yarrow:"Milenrama"};
const externalLabel="Consulta externa";
const methodLabel=method=>method==="external"?externalLabel:methods[method];
const countPattern=/^[1-9][0-9]?$/;
const html=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const clean=text=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const number=id=>String(id).padStart(2,"0");
const diaryDate=date=>new Date(date).toLocaleDateString("es",{dateStyle:"long"});
const consultationDate=item=>item.consultedOn?diaryDate(item.consultedOn+"T12:00:00"):diaryDate(item.date);
const heading=(section,title,description)=>`<header class="page-head"><p class="eyebrow">${section}</p><h1 class="page-title">${title}</h1><p>${description}</p></header>`;
const action=(label,click,extra="")=>`<button type="button" class="button ${extra}" data-act="${click}">${label}</button>`;
const toggle=(label,click,selected)=>`<button type="button" class="button" data-act="${click}" aria-pressed="${selected}">${label}</button>`;
const pool=new Uint8Array(3);
const labels={es:"Español · adaptación",zh:"Chino clásico",en:"Inglés · Legge (histórico)"};
const notes=[
 "Iniciativa y vigor. Observa cuándo es momento de actuar y cuándo dejar madurar una posibilidad.",
 "Receptividad y constancia. Considera qué cambia si primero escuchas o das apoyo.",
 "El comienzo puede ser confuso. Ordenar lo inmediato y pedir ayuda puede dar forma al primer paso.",
 "La inexperiencia abre una ocasión de aprender. Acércate con una pregunta sincera y atención a la respuesta.",
 "Hay situaciones que todavía no maduran. Usa la espera para sostenerte y prepararte.",
 "Un desacuerdo invita a examinar hasta dónde conviene insistir y dónde buscar mediación.",
 "Coordinar esfuerzos requiere disciplina, una dirección clara y cuidado por quienes participan.",
 "La unión se construye con confianza. Piensa qué vínculo quieres sostener y en qué condiciones.",
 "Los efectos modestos también se acumulan. Dale tiempo a una fuerza que recién se está reuniendo.",
 "El modo de avanzar importa. Presta atención a los límites y al terreno que pisas.",
 "Cuando lo de arriba y lo de abajo se comunican, hay espacio para el intercambio y el crecimiento.",
 "Cuando se corta el intercambio, distingue lo que puedes preservar de lo que aún no puedes mover.",
 "La comunidad se forma al compartir un propósito. La imagen del campo abierto invita a ampliar el encuentro más allá del propio clan.",
 "Tener recursos o influencia plantea cómo usarlos con amplitud y responsabilidad.",
 "La modestia ayuda a equilibrar los excesos. Reconoce el peso real de tu aporte y el de otros.",
 "El entusiasmo moviliza. Considera qué preparación y qué acuerdos permiten sostenerlo.",
 "Seguir implica ajustar el paso a las circunstancias y examinar a quién o a qué das tu confianza.",
 "Lo que se deterioró merece atención. Busca el origen del problema antes de repararlo.",
 "Algo se acerca o crece. Aprovecha el momento teniendo presente que también cambiará.",
 "Toma distancia para observar. Examina qué revelan los patrones de una situación y tus propios actos.",
 "Un obstáculo requiere claridad para abordarlo. Distingue qué límite o decisión debe hacerse explícito.",
 "La forma puede ayudar a expresar lo esencial. Mira qué enriquece la apariencia y qué encubre.",
 "Cuando una estructura se deshace, conviene reconocer lo que se va y cuidar lo que puede sostenerse.",
 "Después de un giro aparece una ocasión de volver. Observa el primer movimiento de renovación.",
 "Actúa con franqueza y examina qué parte de tu impulso responde a un cálculo innecesario.",
 "Contener una fuerza puede hacerla más útil. Considera qué estás acumulando y para qué.",
 "Mira lo que te alimenta, lo que ofreces a otros y el cuidado que pones en tus palabras.",
 "Una carga excesiva revela dónde cede la estructura. Considera qué apoyo falta o qué necesita cambiar.",
 "Ante un riesgo repetido, busca una manera constante de atravesarlo y conservar la lucidez.",
 "La claridad depende de aquello a lo que se adhiere. Examina qué sostiene tu atención.",
 "La influencia mutua comienza con la disposición a percibir. Observa cómo se encuentran dos sensibilidades.",
 "Perdurar requiere una dirección firme y capacidad de ajustarse durante el camino.",
 "Retirarse a tiempo puede preservar fuerzas y abrir espacio para otra posición.",
 "Con gran fuerza, cuida la forma de usarla. Pregúntate qué sostiene un avance legítimo.",
 "Cuando hay ocasión de avanzar y volverse visible, considera qué merece salir a la luz.",
 "En condiciones adversas, protege tu lucidez y elige cuándo mostrarla.",
 "Los vínculos íntimos se sostienen mediante responsabilidades claras y prácticas cotidianas.",
 "Puntos de vista distintos pueden convivir. Empieza por aquello en lo que es posible cooperar.",
 "Si el camino está bloqueado, busca apoyo y considera otra ruta.",
 "Cuando se afloja una tensión, distingue lo que necesita acción de lo que puede dejarse atrás.",
 "Reducir algo puede liberar recursos para lo esencial. Observa qué quitas y qué cuidas al hacerlo.",
 "Aumentar supone distribuir bien los recursos. Mira dónde un aporte puede tener mayor efecto.",
 "Una decisión difícil requiere claridad y una forma pública y cuidadosa de comunicarla.",
 "Un encuentro inesperado puede tener influencia. Observa sus efectos antes de darle más espacio.",
 "Reunir personas o recursos requiere un centro de atención y preparación.",
 "El ascenso puede ser gradual. Busca apoyos y pasos que puedas sostener.",
 "La presión y el agotamiento invitan a distinguir qué puedes conservar cuando los recursos escasean.",
 "Una fuente compartida depende del modo en que se mantiene y se hace accesible.",
 "Cambiar una estructura exige reconocer cuándo llegó el momento y cómo se gana la confianza.",
 "Al transformar lo que nutre a una comunidad, también cambia lo que esta puede producir.",
 "Una sacudida altera la atención. Observa cómo recuperar la calma y recordar lo importante.",
 "Detenerse en el momento adecuado permite reconocer qué acción corresponde después.",
 "Lo que crece por etapas necesita tiempo, arraigo y continuidad.",
 "Los acuerdos y vínculos pueden ofrecer poco margen. Mira dónde te sitúas y qué puedes decidir.",
 "La abundancia trae intensidad y es pasajera. Observa qué requiere atención mientras está a tu alcance.",
 "Como quien viaja, muévete con cuidado al habitar provisionalmente un lugar.",
 "Una influencia suave y constante puede alcanzar lo que la fuerza directa no alcanza.",
 "La alegría compartida nace del intercambio. Examina qué sostiene la apertura.",
 "Lo disperso puede volver a encontrarse al disolver barreras y recuperar un propósito común.",
 "Los límites dan forma a lo que puedes sostener. Distingue una medida útil de una restricción excesiva.",
 "La confianza requiere sinceridad y disposición a escuchar lo que suele pasar inadvertido.",
 "En condiciones delicadas convienen los pasos modestos y la atención a los detalles.",
 "Tras completar algo, cuida los detalles que permiten sostener el orden alcanzado.",
 "Cerca del final, aún importa cómo se da el último paso. Revisa qué queda por cruzar."
];
function stack(bits,moving=[],small=false) {
 return `<span class="stack ${small?"small":""}" aria-hidden="true">${Array.from(bits,(bit,index)=>`<i class="${bit==="0"?"yin":bit==="1"?"yang":"empty"} ${moving.includes(index+1)?"move":""}"></i>`).reverse().join("")}</span>`;
}
function trigramPair(id) {
 const bits=figures[id-1];
 return `<div class="trigram-pair"><span class="tag">Arriba · ${trigrams[bits.slice(3)][2]}</span><span class="tag">Abajo · ${trigrams[bits.slice(0,3)][2]}</span></div>`;
}
function hexName(id) { return book[id-1].name; }
function hexLink(id,label) { return `<a href="#hex/${id}">${label??`${number(id)} · ${html(hexName(id))}`}</a>`; }
function figureIllustration(id) {
 return `<img class="figure-illustration" src="./illustrations/${number(id)}.webp" alt="${html(illustrationDescriptions[id-1])}" width="720" height="960" decoding="async">`;
}
function figureCard(id,label,moving=[]) {
 const row=book[id-1];
 return `<div class="panel result-card">
 <div class="reading-head"><div><p class="eyebrow">${label} · ${number(id)}</p><h2>${html(row.name)}</h2><span class="muted">${html(row.zh)} · ${html(row.pinyin)}</span></div>${stack(figures[id-1],moving)}</div>
 <div class="figure-content">
  ${figureIllustration(id)}
  <div>${trigramPair(id)}<p>${notes[id-1]}</p><a class="caption-link" href="#hex/${id}">Abrir ficha del hexagrama</a></div>
 </div>
 </div>`;
}
const genderNotes={
 "4:2":"El pasaje sitúa el aprendizaje dentro de un hogar según los roles familiares de la época.",
 "20:2":"El texto vincula la mirada a través de una rendija con el papel doméstico asignado a las mujeres en ese contexto.",
 "32:5":"El contraste refleja los roles de género de la sociedad en que circuló el texto. Al leerlo hoy, una pregunta posible es cuándo perseverar sostiene una relación y cuándo la vuelve rígida.",
 "37:judgment":"El dictamen está situado en un orden familiar antiguo. La constancia en el cuidado del hogar puede leerse como responsabilidad compartida.",
 "44:judgment":"El matrimonio es la imagen histórica del pasaje. En la lectura contemporánea, puede servir para pensar qué lugar dar a un encuentro intenso.",
 "54:judgment":"El matrimonio en una posición subordinada es una imagen del orden social antiguo. Permite pensar en los márgenes de acción dentro de un acuerdo desigual."
};
function passage(ref, linkFigure = true) {
 const row=book[ref.id-1];
 const texts=row[language==="zh"?"zh_text":language]||row.en;
 const label=ref.kind==="line"?`Línea ${ref.index}`:ref.kind==="special"?(ref.id===1?"Uso de los nueves":"Uso de los seises"):ref.kind==="image"?"Imagen":"Dictamen";
 const note=language==="es"&&genderNotes[`${ref.id}:${ref.kind==="line"?ref.index:ref.kind}`];
 const quote=(ref.kind==="line"?texts.lines[ref.index-1]:texts[ref.kind])||row.en[ref.kind];
 return `<article class="passage"><strong>${label}${linkFigure ? ` · ${hexLink(ref.id,null)}` : ""}</strong>${ref.main?`<span class="tag">Prioridad</span>`:""}<p class="quote" lang="${language}">${html(quote)}</p>${note?`<p class="fine"><strong>Contexto histórico.</strong> ${note}</p>`:""}</article>`;
}
function editionChoices() {return `<div class="choose" aria-label="Idioma del texto">${Object.entries(labels).map(([id,label])=>toggle(label,`lang:${id}`,language===id)).join("")}</div>`;}
function status(message){const el=document.querySelector("[role=status]");if(el)el.textContent=message;}

let cloud=null, account=null, accountMode="login", journalMessage="";
let journalBusy=false, journalLoading=cloudConfigured, journalReady=!cloudConfigured;
let accountVersion=0;
const importedLocally=new Set();

function accountPage(){
 const intro=heading("CUENTA","Tu cuenta","Accede a tus consultas desde cualquier dispositivo.");
 if(!cloud) return intro+'<section class="panel"><p>El acceso a cuentas todavía no está disponible.</p></section>';
 if(account) return intro+`<section class="panel"><p>${html(account.email)}</p><div class="actions"><a class="button primary" href="#diario">Abrir mi diario</a>${action("Cerrar sesión","sign-out")}</div><p class="toast" role="status"></p></section>`;
 const signup=accountMode==="signup";
 return intro+`<section class="panel"><div class="choose">${toggle("Iniciar sesión","auth-mode:login",!signup)}${toggle("Crear cuenta","auth-mode:signup",signup)}</div>
 <form id="account-form">
 <label class="field">Correo electrónico<input name="email" type="email" autocomplete="email" required></label>
 <label class="field">Contraseña<input name="password" type="password" autocomplete="${signup?"new-password":"current-password"}" ${signup?'minlength="6"':""} required></label>
 <button class="button primary" type="submit">${signup?"Crear cuenta":"Iniciar sesión"}</button>
 </form><p class="toast" role="status"></p></section>`;
}

async function refreshJournal(){
 const userId=account?.id, version=accountVersion;
 if(!userId)return;
 journalLoading=true;
 journalMessage="";
 if(route()[0]==="diario") show();
 try{
  const entries=await cloud.list(userId);
  if(accountVersion!==version)return;
  journal=entries;
  journalReady=true;
 }catch{
  if(accountVersion!==version)return;
  journalReady=false;
  journalMessage="No se pudo cargar tu diario. Vuelve a intentarlo.";
 }finally{
  if(accountVersion===version){
   journalLoading=false;
   if(["diario","resultado"].includes(route()[0])) show();
  }
 }
}

async function syncAccount(user){
 const previous=account?.id;
 if(previous===user?.id && (previous || !journalLoading))return;
 accountVersion++;
 journalBusy=false;
 account=user??null;
 journal=[];
 journalReady=false;
 journalLoading=false;
 journalMessage="";
 if(previous){restart();externalDraft=null;question="";topic="";context="";}
 if(route()[0]==="cuenta" && account) location.hash=values.length===6?"resultado":"diario";
 else if(previous && route()[0]==="resultado") location.hash="diario";
 else show();
 if(account) await refreshJournal();
}

async function startAccount(){
 try{
  cloud=await connectJournal();
  cloud.auth.onAuthStateChange((_event,session)=>{
   setTimeout(()=>void syncAccount(session?.user),0);
  });
  if(route()[0]==="cuenta") show();
 }catch{
  journalLoading=false;
  if(["diario","resultado","cuenta"].includes(route()[0])) show();
 }
}

async function journalOperation(button, operation){
 const accountId=account?.id, version=accountVersion;
 if(!accountId || !journalReady || journalBusy)return;
 journalBusy=true;
 if(button)button.disabled=true;
 try{
  return await operation(accountId,()=>accountVersion===version);
 }catch(error){
  if(accountVersion!==version)return;
  const message=error.message==="journal_conflict"
   ?"La consulta cambió en otro dispositivo. Tu borrador sigue aquí. Abre el diario y vuelve a cargar la entrada antes de editarla."
   :"No se pudo guardar el cambio en tu cuenta. Vuelve a intentarlo.";
  status(message);
 }finally{
  if(accountVersion===version)journalBusy=false;
  if(button)button.disabled=false;
 }
}

function route() {return (location.hash.slice(1)||"inicio").split("/");}
function show(reFocus=false) {
 const [page,id]=route();
 main.dataset.page=page;
 for(const nav of document.querySelectorAll(".top nav a")) {
  const active=nav.hash===`#${page}`||(page==="hex"&&nav.hash==="#explorar")||(page==="resultado"&&method!=="external"&&nav.hash==="#consultar")||(page==="resultado"&&method==="external"&&nav.hash==="#diario");
  if(active)nav.setAttribute("aria-current","page");else nav.removeAttribute("aria-current");
 }
 if(!book) {main.innerHTML=heading("I CHING","El libro de los cambios","El texto no pudo cargarse. Vuelve a abrir la página para intentarlo de nuevo.");return;}
 const pages={consultar:consult, resultado:reading, explorar:explore, aprender:learn, diario:()=>id==="registrar"?externalPage():diary(), instalar:installPage, cuenta:accountPage, fuentes:sources, hex:()=>hexDetail(countPattern.test(id)?Number(id):0)};
 if(Object.hasOwn(pages,page)) main.innerHTML=pages[page]();
 else main.replaceChildren(document.querySelector("#landing").content.cloneNode(true));
 if(page==="explorar")filterGrid("");
 if(page==="diario"&&id==="registrar"){
  const form=main.querySelector("#external-form");
  if(form&&externalDraft){
   form.elements.initial.value=externalDraft.initial;
   form.elements.expected.value=externalDraft.expected;
   for(const line of form.querySelectorAll('[name="lines"]'))line.checked=externalDraft.lines.includes(Number(line.value));
  }
  updateExternalPreview(form);
 }
 if(page==="instalar")document.dispatchEvent(new Event("render-install-page"));
 if(reFocus){
  const guideSection=page==="aprender"&&["preguntas","diario","metodos","figuras"].includes(id)?document.getElementById(id):null;
  if(guideSection){guideSection.focus({preventScroll:true});guideSection.scrollIntoView(); }
  else{main.focus({preventScroll:true});window.scrollTo(0,0);}
 }
}
function consult() {
 if(method==="external"){restart();question="";topic="";context="";}
 const step=values.length+1, total=6+coins.filter(Boolean).length;
 const track=Array.from({length:6},(_,i)=>[i+1,values[i]]).map(([i,v])=>`<div><strong class="level">${i} ${v?`· ${v}`:""}</strong><span>${v?states[v]:"Pendiente"}</span></div>`).reverse().join("");
 const coinsControl=`<p>Pulsa cada moneda hasta que muestre el lado que salió. Cara vale 3 y cruz vale 2.</p><div class="coins">${coins.map((face,i)=>`<button type="button" class="coin" data-act="coin:${i}" aria-pressed="${face}" aria-label="Moneda ${i+1}: ${!coinTouched[i]?"sin registrar":face?"cara":"cruz"}">${!coinTouched[i]?"?":face?"Cara":"Cruz"}<small>${!coinTouched[i]?`Moneda ${i+1}`:face?"3":"2"}</small></button>`).join("")}</div><div class="row">${action(coinTouched.every(Boolean)?`Registrar ${total} · ${states[total]}`:"Registrar las tres monedas","confirm-coins","primary").replace("data-act",coinTouched.every(Boolean)?"data-act":"disabled data-act")}<button class="button" data-act="all-tails">Tres cruces</button></div>`;
 const directControl=`<p>Elige el valor que obtuviste para esta línea.</p><div class="choose">${Object.entries(states).map(([n,s])=>`<button type="button" class="button line-choice" data-act="add:${n}" title="${s}">${n} · ${s}</button>`).join("")}</div>`;
 const simControl=`<p>${method==="coins"?"Cada moneda virtual tiene la misma probabilidad de salir cara o cruz.":"La simulación reproduce las probabilidades convencionales de la milenrama."}</p>${action(method==="coins"?"Lanzar tres monedas":"Simular una línea","random","primary")}`;
 return heading("CONSULTA","Realiza una tirada","Construye seis líneas, empezando abajo y añadiendo cada nueva línea encima de la anterior.")+
 `<div class="workspace"><div class="flow"><section class="panel">
 <label class="field">Tu pregunta <small>Opcional. Describe una situación y qué te interesa comprender o decidir.</small><textarea id="question" maxlength="1200" placeholder="Escribe aquí tu pregunta…">${html(question)}</textarea></label>
 <p class="fine"><a href="#aprender/preguntas">Ideas para formular tu pregunta</a></p>
 <strong>Método de consulta</strong><div class="choose">${Object.entries(methods).map(([m,label])=>toggle(label,`method:${m}`,method===m)).join("")}</div>
 <strong>Cómo registrar la tirada</strong><div class="choose">${method==="coins"?toggle("Registrar monedas","input:coins",input==="coins"):""}${toggle("Introducir valores","input:values",input==="values")}${toggle("Simular","input:sim",input==="sim")}</div>
 </section><section class="panel casting-panel"><progress class="cast-progress" max="6" value="${values.length}" aria-label="Líneas registradas"></progress><p class="eyebrow">${step<=6?`LÍNEA ${step} DE 6`:"TIRADA COMPLETA"}</p><h2>${step<=6?(step===1?"La línea de abajo":step===6?"La línea de arriba":"Añade una línea"):"Tu hexagrama está listo"}</h2>
 ${step<=6?(input==="coins"?coinsControl:input==="values"?directControl:simControl):`<a href="#resultado" class="button primary">Leer el resultado ↗</a>`}
 <div class="choose">${values.length?action("Deshacer última línea","undo"):""}${values.length?action("Reiniciar tirada","reset"):""}</div>
 <p class="toast" role="status"></p></section>
 ${method==="yarrow"?`<section class="panel"><details ${input==="values"?"open":""}><summary>Cómo usar 50 varillas físicas</summary>${yarrowInstructions}</details></section>`:""}</div>
 <aside class="panel dark"><p class="eyebrow">TU FIGURA</p><h2>${values.length} de 6 líneas</h2>${stack(Array.from({length:6},(_,i)=>values[i]?values[i]%2:"x").join(""),values.flatMap((v,i)=>v===6||v===9?[i+1]:[]))}<div class="track">${track}</div><p class="muted">La primera tirada va abajo. El color marca las líneas cambiantes.</p></aside></div>`;
}
function reading(){
 if(values.length!==6)return heading("CONSULTA","Tu lectura","Completa seis líneas para abrir los textos de tu consulta.")+`<a class="button primary" href="#consultar">Ir a la tirada</a>`;
 const result=calculate(values);
 const saved=journal.find(item=>item.id===activeId);
 const followUps=saved?.followUps??[];
 const saveControl=!cloudConfigured||journalReady
  ? action(activeId?"Actualizar en el diario":"Guardar en el diario","save","primary")
  : account?"<a class=\"button\" href=\"#diario\">Revisar el estado del diario</a>":'<a class="button primary" href="#cuenta">Inicia sesión para guardar</a>';
 const guides=[
  "Sin cambios, la lectura guiada se centra en el dictamen inicial.",
  "Con un cambio, lee el texto de esa línea en el hexagrama inicial.",
  "Con dos cambios, lee ambas líneas del hexagrama inicial. La más alta tiene prioridad.",
  "Con tres cambios, lee los dictámenes de ambos hexagramas.",
  "Con cuatro cambios, lee en el hexagrama resultante las dos posiciones que quedaron estables. La más baja tiene prioridad.",
  "Con cinco cambios, lee en el hexagrama resultante la única posición que quedó estable.",
  result.initial<=2?"En los hexagramas 1 y 2, cuando cambian las seis líneas, se consulta el pasaje especial.":"Con seis cambios, lee el dictamen del hexagrama resultante."
 ];
 return heading("LECTURA","Tu consulta",`${methodLabel(method)} · ${result.changes.length?result.changes.length===1?"Cambia la línea "+result.changes[0]:"Cambian las líneas "+result.changes.join(", "):"Sin líneas cambiantes"}`)+
 `<div class="flow">${question?`<div class="panel"><p class="eyebrow">TU PREGUNTA</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">${html(question)}</p></div>`:""}
 <div class="reader-grid">${figureCard(result.initial,"INICIAL",result.changes)}${result.changes.length?figureCard(result.final,"RESULTANTE"):""}</div>
 <section class="panel"><h2>Qué leer</h2><div class="choose">${toggle("Lectura guiada","read:guided",readingMode==="guided")}${toggle("Todas las líneas cambiantes","read:all",readingMode==="all")}</div>
 <p class="muted">${readingMode==="guided"?guides[result.changes.length]:"Lee el dictamen inicial, las líneas que cambiaron y, si lo hay, el dictamen del hexagrama resultante."}</p>
 ${editionChoices()}${choosePassages(result,readingMode).map(ref=>passage(ref)).join("")}
 <a class="caption-link" href="#fuentes">Sobre la edición y la regla de lectura</a></section>
 <section class="panel" aria-labelledby="reading-journal"><h2 id="reading-journal">Registrar en el diario</h2>
 <p class="muted">${method==="external"&&consultedOn?"Fecha de consulta · "+consultationDate({consultedOn})+". ":""}Puedes guardar la consulta aunque todavía no tengas una reflexión.</p>
 <label class="field">Tema <small>Opcional. Por ejemplo, obra, trabajo o vínculos.</small><input id="topic" maxlength="80" value="${html(topic)}"></label>
 <label class="field">Contexto <small>¿Qué estaba pasando al momento de consultar?</small><textarea id="context" maxlength="1600">${html(context)}</textarea></label>
 <label class="field">Primera reflexión <small>¿Qué pasaje te llamó la atención? ¿Qué quedó abierto?</small><textarea id="reflection" maxlength="4600">${html(reflection)}</textarea></label>
 ${saved?`<h3>Relecturas</h3>${followUps.length?`<ul class="journal-followups">${followUps.map(note=>`<li><time datetime="${html(note.date)}">${diaryDate(note.date)}</time><p>${html(note.text)}</p></li>`).join("")}</ul>`:`<p class="fine">Todavía no hay relecturas.</p>`}<label class="field">Añadir una relectura <small>Al actualizar la entrada, esta nota se guarda con la fecha de hoy.</small><textarea id="follow-up" maxlength="2400" placeholder="¿Qué ocurrió desde la consulta? ¿Cómo la lees ahora?">${html(followUp)}</textarea></label>`:""}
 <div class="actions">${saveControl} ${saved?`<a class="button" href="#diario">Ver mi diario</a>`:method==="external"?`<a class="button" href="#diario/registrar">Editar resultado</a>`:`<a class="button" href="#consultar">Volver a la tirada</a>`} ${action("Nueva consulta","new")}</div>
 <p class="toast" role="status"></p></section></div>`;
}
function gridTile(entry){
 return `<a class="tile" href="#hex/${entry.id}">
 <img src="./illustrations/${number(entry.id)}.webp" alt="" width="720" height="960" loading="lazy" decoding="async">
 <div class="tile-copy"><span class="number">${number(entry.id)} <span>${html(entry.zh)}</span></span>${stack(figures[entry.id-1],[],true)}<b>${html(entry.name)}</b></div></a>`;
}
function filterGrid(value){
 const search=clean(value.trim());
 const rows=book.filter(item=>/^\d+$/.test(search)?item.id===Number(search):clean(`${item.id} ${number(item.id)} ${item.name} ${item.pinyin} ${item.zh} ${notes[item.id-1]}`).includes(search));
 document.querySelector("#hex-grid").innerHTML=rows.length?rows.map(gridTile).join(""):`<p>No se encontraron hexagramas.</p>`;
 document.querySelector("#hex-count").textContent=`${rows.length} de 64`;
}
function trigramOptions(value){
 return trigramOrder.map(bits=>`<option value="${bits}" ${bits===value?"selected":""}>${trigrams[bits][2]} · ${trigrams[bits][1]}</option>`).join("");
}
function builderSection(){
 const id=figureNumber(builder);
 return `<section class="panel"><h2>Construye un hexagrama</h2><p class="muted">Cambia una línea de yin a yang o elige sus dos trigramas. La línea 1 está abajo.</p><div class="builder"><div class="builder-lines">${Array.from(builder,(bit,i)=>`<button type="button" class="button" data-act="flip:${i}" aria-label="Línea ${i+1}: ${bit==="1"?"yang":"yin"}. Invertir"><span>${i+1} · ${bit==="1"?"Yang":"Yin"}</span>${stack(bit,[],true)}</button>`).reverse().join("")}</div><div><label class="field">Trigrama superior<select id="upper">${trigramOptions(builder.slice(3))}</select></label><label class="field">Trigrama inferior<select id="lower">${trigramOptions(builder.slice(0,3))}</select></label><div role="status">${hexLink(id,null)}</div></div></div></section>`;
}
function explore(){
 return heading("EXPLORADOR","Los 64 hexagramas","Encuentra una figura por número, nombre o idea, o constrúyela cambiando sus líneas.")+
 `<div class="atlas"><div class="atlas-toolbar"><label class="field">Buscar un hexagrama<input id="search" type="search" placeholder="Ej. 24, Retorno o Fù"></label><span class="fine" id="hex-count" role="status"></span></div><details class="atlas-builder"><summary>Construir con líneas o trigramas</summary><div id="builder">${builderSection()}</div></details><div id="hex-grid" class="grid"></div></div>`;
}
function hexDetail(id){
 if(!book[id-1]) return heading("EXPLORADOR","No encontramos esa figura","El orden del rey Wen contiene 64 hexagramas.")+`<a href="#explorar">Volver al explorador</a>`;
 const row=book[id-1];
 const title = heading(`HEXAGRAMA ${number(id)} · ${html(row.zh)}`,html(row.name),html(row.pinyin));
 const overview = `<section class="hex-overview">
 <div class="hex-overview-heading">${title}</div>
 ${figureIllustration(id)}
 <div class="hex-overview-summary">${stack(figures[id-1])}${trigramPair(id)}<p>${notes[id-1]}</p></div>
 </section>`;
 const [imageReading, generalReading] = hexagramReadings[id-1];
 const analysis = `<section class="panel hex-analysis"><h2>Lectura general</h2>
 <h3>La imagen y su tensión</h3><p>${html(imageReading)}</p>
 <h3>Cómo entenderla hoy</h3><p>${html(generalReading)}</p></section>`;
 return overview + `<div class="workspace"><div class="flow">${analysis}<section class="panel"><h2>Textos del hexagrama</h2>${editionChoices()}${[{id,kind:"judgment"},{id,kind:"image"},...Array.from({length:6},(_,i)=>({id,kind:"line",index:i+1})),...(id<=2?[{id,kind:"special"}]:[])].map(ref=>passage(ref,false)).join("")}<a class="caption-link" href="${html(row.source)}" target="_blank" rel="noopener">Fuente de la edición española ↗</a></section></div>
 <aside class="flow"><div class="panel"><h3>Explorar una mutación</h3><p class="muted">Si cambia solo una línea, la figura se transforma así.</p><div class="flow">${Array.from(figures[id-1],(bit,i)=>`<div><span class="fine">Línea ${i+1} → </span>${hexLink(figureNumber(figures[id-1].slice(0,i)+(bit==="1"?"0":"1")+figures[id-1].slice(i+1)),null)}</div>`).join("")}</div></div><div class="row">${id>1?`<a class="button" href="#hex/${id-1}">← Anterior</a>`:""}<a class="button" href="#explorar">Índice</a>${id<64?`<a class="button" href="#hex/${id+1}">Siguiente →</a>`:""}</div></aside></div>`;
}
function learn(){
 return heading("GUÍA","Aprender el I Ching","Formula una pregunta, registra la tirada y vuelve a leerla con el tiempo.")+
 `<div class="flow">${practiceGuide}
 <section class="page-head" id="figuras" tabindex="-1"><h2 class="guide-section-title">Cómo nace una figura</h2><p>Dos tipos de línea bastan para construir todo el sistema de figuras del I Ching.</p></section>
 <div class="cols">
 <section class="panel"><p class="eyebrow">DOS FORMAS</p><h3>Yin y yang</h3>${stack("01",[],true)}<p>Yang se dibuja con una línea continua y yin con una partida. Son cualidades complementarias. Piensa en la luz y la sombra de una ladera, que cambian según su relación con el sol.</p></section>
 <section class="panel"><p class="eyebrow">OCHO FIGURAS</p><h3>¿Por qué tres líneas?</h3><p>A una línea le puedes añadir otra yin o yang y obtener cuatro combinaciones. Añade una tercera y obtienes ocho. En el <i>Shuogua</i>, Cielo, Tierra y humanidad dan sentido a esas tres posiciones. Es una explicación simbólica tradicional. El origen histórico de las figuras es una cuestión distinta.</p></section>
 <section class="panel"><p class="eyebrow">64 COMBINACIONES</p><h3>Dos trigramas se encuentran</h3><p>Combina un trigrama inferior con otro superior. Elige uno de ocho para cada lugar y obtienes 8 × 8 figuras. En una tirada las líneas 1 a 3 forman el de abajo y las líneas 4 a 6, el de arriba.</p></section></div>
 <section class="panel"><h2>De la unidad a los trigramas</h2><p>El <i>Xici</i> describe un orden simbólico. Del <i>Taiji</i> (Gran Último) surgen dos modalidades, de ellas cuatro imágenes y de estas los ocho trigramas. La tercera línea sigue siendo yin o yang. En la lectura de las tres potencias, la línea inferior corresponde a la Tierra, la intermedia a la humanidad y la superior al Cielo.</p></section>
 <section><div class="page-head"><p class="eyebrow">BĀGUÀ · 八卦</p><h2 class="guide-section-title">Los ocho trigramas</h2></div><div class="trigram-grid">${trigramOrder.map(bits=>{const [zh,pinyin,title,quality,description]=trigrams[bits];return `<article class="panel trigram-card"><img src="./trigrams/${bits}.webp" alt="" width="480" height="640" loading="lazy" decoding="async"><div class="trigram-copy">${stack(bits,[],true)}<h3>${title}</h3><span class="fine">${zh} · ${pinyin} · ${quality}</span><p>${description}</p></div></article>`;}).join("")}</div></section>
 <div id="builder">${builderSection()}</div>
 <section class="panel"><h2>Qué cambia en una tirada</h2><p>Una línea puede ser yin o yang, y además estable o cambiante. Suma las tres monedas con cara = 3 y cruz = 2, o registra el total obtenido con varillas.</p>
 <table><thead><tr><th>Valor</th><th>Línea inicial</th><th>En el resultado</th><th>Monedas</th><th>Varillas*</th></tr></thead><tbody><tr><th>6</th><td>Yin cambiante</td><td>Yang</td><td>1/8</td><td>1/16</td></tr><tr><th>7</th><td>Yang estable</td><td>Yang</td><td>3/8</td><td>5/16</td></tr><tr><th>8</th><td>Yin estable</td><td>Yin</td><td>3/8</td><td>7/16</td></tr><tr><th>9</th><td>Yang cambiante</td><td>Yin</td><td>1/8</td><td>3/16</td></tr></tbody></table>
 <p class="fine">*Modelo convencional de la simulación de milenrama. El gesto de dividir varillas físicas puede producir diferencias.</p><a class="button primary" href="#consultar">Probar una tirada ↗</a></section></div>`;
}
function externalPage(){
 if(!account || !journalReady || journalLoading)return diary();
 const draft=externalDraft;
 const options=book.map(row=>`<option value="${row.id}">${number(row.id)} · ${html(row.name)}</option>`).join("");
 const figureSelect=(name,label,placeholder,required=false)=>`<label class="field">${label}
  <select name="${name}" ${required?"required":""}><option value="">${placeholder}</option>${options}</select></label>`;
 return heading("DIARIO","Registrar consulta externa","Introduce el resultado de una tirada hecha fuera de la app y abre su lectura.")+
 `<form id="external-form" class="panel external-form">
 ${figureSelect("initial","Hexagrama inicial","Elige un hexagrama",true)}
 <fieldset class="external-lines"><legend>Líneas cambiantes</legend><p class="fine">La línea 1 es la de abajo y la 6 la de arriba. Si no hubo cambios, deja todas sin marcar.</p>
 <div class="external-line-options">${[1,2,3,4,5,6].map(line=>`<label><input type="checkbox" name="lines" value="${line}"> ${line}</label>`).join("")}</div></fieldset>
 ${figureSelect("expected","Hexagrama resultante anotado (opcional)","Calcular con las líneas marcadas")}
 <p id="external-preview" class="muted" aria-live="polite"></p>
 <label class="field">Fecha de la consulta (opcional)<input type="date" name="consultedOn" value="${html(draft?.consultedOn)}"></label>
 <label class="field">Pregunta (opcional)<textarea name="question" maxlength="1200">${html(draft?.question)}</textarea></label>
 <div class="actions"><button class="button primary" type="submit">Ver lectura</button><a class="button" href="#diario">Volver al diario</a></div>
 </form>`;
}

function externalResult(form){
 const fields=new FormData(form);
 const initial=Number(fields.get("initial"));
 const changes=fields.getAll("lines").map(Number);
 return initial?calculate(valuesFromFigure(initial,changes)):null;
}

function updateExternalPreview(form){
 if(!form)return;
 const result=externalResult(form);
 const expected=form.elements.expected;
 const preview=form.querySelector("#external-preview");
 expected.setCustomValidity("");
 if(!result){preview.textContent="";return;}
 if(expected.value && (!result.changes.length || Number(expected.value)!==result.final)){
  expected.setCustomValidity("El hexagrama anotado no coincide. Revisa las líneas cambiantes o el hexagrama resultante.");
  preview.textContent=expected.validationMessage;
  return;
 }
 preview.textContent=result.changes.length
  ?`Resultante calculado: ${number(result.final)} · ${hexName(result.final)}.`
  :"Sin cambios. La lectura se queda en el hexagrama inicial.";
}

function openExternalReading(form){
 if(!account || !journalReady || journalLoading)return;
 const fields=new FormData(form);
 const initial=Number(fields.get("initial"));
 const lines=fields.getAll("lines").map(Number);
 const expected=fields.get("expected");
 const date=fields.get("consultedOn");
 const draftQuestion=fields.get("question");
 const editing=method==="external"&&activeId===null;
 if(!editing){restart();topic="";context="";}
 externalDraft={initial,lines,expected,consultedOn:date,question:draftQuestion};
 values=valuesFromFigure(initial,lines);
 method="external";consultedOn=date;question=draftQuestion;
 location.hash="resultado";
}

function installPage(){
 return heading("APLICACIÓN","Instalar I Ching","Abre el libro desde un icono en la pantalla de inicio.")+
 `<section class="panel"><button type="button" class="button primary" id="install-app" hidden>Instalar aplicación</button>
 <p class="fine" id="install-status" role="status"></p>
 <h2>En el teléfono</h2>
 <p><strong>iPhone o iPad.</strong> Abre esta página en Safari. En Compartir, elige «Agregar a pantalla de inicio» y activa «Abrir como app web» si aparece.</p>
 <p><strong>Android.</strong> En Chrome, abre el menú y elige «Instalar aplicación» o «Añadir a pantalla de inicio».</p>
 </section>`;
}
function diary(){
 if(cloudConfigured && !account) return heading("DIARIO","Tus consultas","Inicia sesión para acceder a tu diario personal.")+'<a class="button primary" href="#cuenta">Ir a mi cuenta</a>';
 const list=journal.map(item=>{
  const result=calculate(item.values);
  return `<article class="journal-item"><a class="journal-image" href="#hex/${result.initial}" aria-label="Abrir ficha del hexagrama ${result.initial}"><img src="./illustrations/${number(result.initial)}.webp" alt="" width="720" height="960" loading="lazy"></a><div class="journal-copy"><p class="eyebrow">${consultationDate(item)} · ${methodLabel(item.method)}${item.topic?` · ${html(item.topic)}`:""}</p><h3>${html(item.question||"Consulta sin pregunta")}</h3><div>${hexLink(result.initial,null)}${result.changes.length?` → ${hexLink(result.final,null)}`:""}</div>${item.reflection?`<p>${html(item.reflection)}</p>`:""}${item.followUps?.length?`<span class="fine">Relecturas: ${item.followUps.length}</span>`:""}<div class="actions">${action("Abrir lectura",`open:${item.id}`,"primary")}${action("Eliminar",`delete:${item.id}`)}</div></div></article>`;
 });
 const intro=cloudConfigured?"Las consultas se guardan en tu cuenta. Puedes añadir una relectura fechada.":"Guarda tus consultas en este navegador. Puedes añadir una relectura fechada.";
 const cloudTools=cloudConfigured?`<div class="actions">${journalReady&&!journalLoading?`<a class="button primary" href="#diario/registrar">Registrar consulta externa</a>`:""}<a class="button" href="#cuenta">Mi cuenta</a>${!journalLoading?action("Recargar diario","reload-journal"):""}${journalReady&&!journalLoading&&localEntries.length&&!importedLocally.has(account.id)?action("Importar consultas de este navegador","import-journal"):""}</div><p class="toast" role="status">${html(journalLoading?"Cargando tus consultas…":journalMessage)}</p>`:"";
 return heading("DIARIO","Tus consultas",intro)+
 `<div class="flow">${cloudTools}<p class="fine"><a href="#aprender/diario">Cómo llevar y releer tu diario</a></p>${!cloudConfigured&&!storageAvailable?`<p class="toast">Este navegador no permite usar el almacenamiento local.</p>`:""}${journalLoading||!journalReady?"":list.length?list.join(""):`<section class="panel empty-state"><h2>Aún no hay consultas</h2><p class="muted">Luego de una tirada, puedes guardar la pregunta, el resultado y tu reflexión.</p><a class="button primary" href="#consultar">Abrir una consulta</a></section>`}</div><dialog id="delete-dialog"><form method="dialog"><h2>Eliminar esta consulta</h2><p>Se eliminarán la tirada, su reflexión y sus relecturas${cloudConfigured?" de tu cuenta":" de este navegador"}.</p><div class="row"><button class="button" value="cancel">Cancelar</button><button class="button primary" value="delete">Eliminar</button></div></form></dialog>`;
}
function sources(){
 return heading("EDICIÓN Y MÉTODO","Fuentes y créditos","Consulta los textos en tres idiomas y revisa la pauta que decide qué pasajes se muestran.")+
 `<div class="flow"><section class="panel"><h2>Los textos</h2>
 <p><strong>Español.</strong> Adaptación editorial de la traducción de Dailingna Romero / El I Chingón, basada en la edición alemana de Richard Wilhelm (1924). La adaptación usa expresiones como «la persona noble» y «quienes se reúnen» para los referentes genéricos. Conserva los vínculos y roles de género cuando forman parte de una escena histórica. Las notas de contexto acompañan algunos de esos pasajes. Cada ficha enlaza a la versión de Romero. <a href="https://elichingon.com/licencias/" target="_blank" rel="noopener">Atribución y licencia del sitio</a> · <a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener">CC BY 4.0</a>.</p>
 <p><strong>Chino clásico e inglés.</strong> <i>Zhōuyì</i>, texto recibido, y <i>The Yî King</i>, traducción de James Legge (1882, dominio público). <a href="https://ctext.org/book-of-changes/yi-jing" target="_blank" rel="noopener">Chinese Text Project</a> · <a href="https://ludobench.com/es/fortunes/iching/book" target="_blank" rel="noopener">Transcripción bilingüe utilizada</a>.</p>
 <p><strong>Notas para la consulta.</strong> Las notas breves y la «Lectura general» de cada ficha son comentarios editoriales en español, inspirados en el dictamen, la imagen tradicional y las líneas. Son iguales para cualquier consulta que produzca ese hexagrama y aparecen aparte de los pasajes clásicos. La sección «Qué leer» muestra los pasajes de la edición que elijas. La traducción inglesa se incluye como referencia histórica y conserva su vocabulario de época.</p></section>
 <section class="panel"><h2>Cómo se eligen los pasajes</h2><p>La lectura guiada adapta las reglas de Zhu Xi del <i>Yixue qimeng</i>. Cuando cambian tres líneas, muestra los dos dictámenes con el mismo peso. La formulación original establece una prioridad mediante sus tablas. También puedes seleccionar «Todas las líneas cambiantes» para ver el dictamen de origen, cada línea que cambia y el dictamen resultante.</p>
 <p class="fine">Referencias: <a href="https://zh.wikisource.org/wiki/易學啟蒙通釋_(四庫全書本)/全覽" target="_blank" rel="noopener">Texto de la tradición de Zhu Xi</a> · <a href="https://www2.kenyon.edu/Depts/Religion/Fac/Adler/Writings/Divination.htm" target="_blank" rel="noopener">Joseph A. Adler, estudio sobre Zhu Xi</a> · <a href="https://ctext.org/book-of-changes/shuo-gua" target="_blank" rel="noopener">Shuogua</a> · <a href="https://ctext.org/book-of-changes/xi-ci-shang" target="_blank" rel="noopener">Xici</a>.</p></section>
 <section class="panel"><h2>Cómo se calcula</h2><p>La tirada queda definida por seis valores. Las líneas 6 y 9 se invierten para producir el segundo hexagrama. El cálculo y la selección de textos siguen reglas fijas, sin IA. La simulación usa el azar del navegador para generar los valores. La pregunta se usa como título y contexto personal en el diario.</p></section></div>`;
}
function clearCoin(){
 coins=[false,false,false];
 coinTouched=[false,false,false];
}
function restart() {
 values=[];reflection="";followUp="";activeId=null;consultedOn="";
 if(method==="external"){method="coins";input="coins";}
 clearCoin();
}
function onAdd(value,detail="") {
 if(values.length===6)return;
 values.push(value);clearCoin();show();
 status(`Línea ${values.length} registrada · ${value} · ${states[value]}${detail}`);
 if(values.length===6)main.querySelector('a[href="#resultado"]')?.focus({preventScroll:true});
 else main.querySelector('[data-act=random], [data-act^="coin:"], [data-act^="add:"]')?.focus({preventScroll:true});
}
function writeJournal(next) {
 try {localStorage.setItem(key,JSON.stringify(next));journal=next;return true;}
 catch {storageAvailable=false;status("No se pudo guardar en el diario de este navegador.");return false;}
}
function redrawBuilder(target){
 const el=document.querySelector("#builder");
 el.innerHTML=builderSection();
 el.querySelector(target)?.focus({preventScroll:true});
}
main.addEventListener("input",event=>{
 const {id,value}=event.target;
 if(id==="question")question=value;
 if(id==="reflection")reflection=value;
 if(id==="topic")topic=value;
 if(id==="context")context=value;
 if(id==="follow-up")followUp=value;
 if(id==="search")filterGrid(value);
});
main.addEventListener("change",event=>{
 const {id,value}=event.target;
 if(id==="upper")builder=builder.slice(0,3)+value;
 if(id==="lower")builder=value+builder.slice(3);
 if(id==="upper"||id==="lower")redrawBuilder(`#${id}`);
 if(event.target.form?.id==="external-form")updateExternalPreview(event.target.form);
});
main.addEventListener("submit",async event=>{
 if(event.target.id==="external-form"){
  event.preventDefault();
  openExternalReading(event.target);
  return;
 }
 if(event.target.id!=="account-form")return;
 event.preventDefault();
 if(!cloud || account)return;
 const form=event.target;
 const submit=form.querySelector('button[type="submit"]');
 if(submit.disabled)return;
 submit.disabled=true;
 const fields=new FormData(form);
 const email=String(fields.get("email")).trim(),password=String(fields.get("password"));
 const signup=accountMode==="signup";
 try{
  const url=new URL(location.href);
  url.hash="";url.search="";
  const {data,error}=signup
   ?await cloud.auth.signUp({email,password,options:{emailRedirectTo:url.href}})
   :await cloud.auth.signInWithPassword({email,password});
  if(error) {
   status(error.code==="email_not_confirmed"?"Confirma tu correo antes de iniciar sesión.":signup?"No se pudo crear la cuenta. Revisa el correo y la contraseña.":"No se pudo iniciar sesión. Revisa el correo y la contraseña.");
  }else if(!data.session){
   form.reset();
   status("Revisa tu correo para confirmar la cuenta.");
  }
 }catch{status("No se pudo contactar al servicio de cuentas. Vuelve a intentarlo.");}
 finally{submit.disabled=false;}
});
main.addEventListener("click",async event=>{
 const button=event.target.closest("[data-act]");
 if(!button)return;
 const [act,arg]=button.dataset.act.split(":");
 switch(act){
  case "auth-mode":accountMode=arg;break;
  case "sign-out":{
   const {error}=await cloud.auth.signOut({scope:"local"});
   if(error)status("No se pudo cerrar la sesión. Vuelve a intentarlo.");
   return;
  }
  case "reload-journal":if(!journalBusy)await refreshJournal();return;
  case "import-journal":{
   if(!confirm("¿Copiar las consultas de este navegador a tu cuenta? Las entradas que ya existan en tu cuenta se conservan."))return;
   await journalOperation(button,async (userId,isCurrent)=>{
    await cloud.importLocal(userId,localEntries);
    if(!isCurrent())return;
    importedLocally.add(userId);
    await refreshJournal();
    if(isCurrent()&&journalReady)status("Consultas importadas.");
   });
   return;
  }
  case "method":
   if(arg!==method && (!values.length||confirm("Cambiar el método reiniciará las líneas registradas. ¿Continuar?"))){method=arg;input=arg==="coins"?"coins":"values";restart();}
   break;
  case "input":input=arg;clearCoin();break;
  case "coin":{
   const i=Number(arg);
   coins[i]=!coinTouched[i]||!coins[i];coinTouched[i]=true;break;
  }
  case "all-tails":coins.fill(false);coinTouched.fill(true);break;
  case "confirm-coins":if(coinTouched.every(Boolean))onAdd(6+coins.filter(Boolean).length);return;
  case "add":onAdd(Number(arg));return;
  case "random":{
   crypto.getRandomValues(pool);
   const faces=Array.from(pool,n=>n%2);
   if(method==="coins")onAdd(6+faces.reduce((a,b)=>a+b,0),` · ${faces.map(face=>face?"Cara":"Cruz").join(", ")}`);
   else onAdd(simulatedYarrow(pool[0]%16));
   return;
  }
  case "new":restart();question="";topic="";context="";location.hash="consultar";return;
  case "undo":values.pop();clearCoin();break;
  case "reset":if(confirm("¿Reiniciar las seis líneas?"))restart();break;
  case "read":readingMode=arg;break;
  case "lang":language=arg;break;
  case "flip":{
   const i=Number(arg);
   builder=builder.slice(0,i)+(builder[i]==="1"?"0":"1")+builder.slice(i+1);
   redrawBuilder(`[data-act="flip:${i}"]`);return;
  }
  case "save":{
   if(values.length!==6)return;
   const existing=journal.find(entry=>entry.id===activeId);
   const followUps=[...(existing?.followUps??[])];
   if(existing&&followUp.trim())followUps.push({date:new Date().toISOString(),text:followUp.trim()});
   const item={id:existing?.id||crypto.randomUUID(),date:existing?.date||new Date().toISOString(),values:[...values],question,method,reflection,language,readingMode,topic:topic.trim(),context,followUps,...(consultedOn?{consultedOn}:{})};
   const withEntry=entry=>existing?journal.map(row=>row.id===entry.id?entry:row):[entry,...journal];
   const onSaved=()=>{
    if(route()[0]!=="resultado")return;
    activeId=item.id;followUp="";if(item.method==="external")externalDraft=null;show();status("Consulta guardada en el diario.");
    main.querySelector('[data-act="save"]')?.focus({preventScroll:true});
   };
   if(cloudConfigured){
    const originalValues=values;
    await journalOperation(button,async (userId,isCurrent)=>{
     const entry=await cloud.save(userId,item,existing);
     if(!isCurrent())return;
     journal=withEntry(entry);
     if(originalValues===values && values.length===6 && values.every((value,index)=>value===item.values[index]))onSaved();
     if(route()[0]==="diario")show();
    });
   }else if(writeJournal(withEntry(item)))onSaved();
   return;
  }
  case "open":{
   const item=journal.find(entry=>entry.id===arg);
   if(!item)return;
   values=[...item.values];question=item.question;method=item.method;input="values";activeId=item.id;reflection=item.reflection??"";language=Object.hasOwn(labels,item.language)?item.language:"es";readingMode=item.readingMode==="all"?"all":"guided";
   topic=item.topic??"";context=item.context??"";followUp="";consultedOn=item.consultedOn??"";
   location.hash="resultado";return;
  }
  case "delete":{
   const dialog=document.querySelector("#delete-dialog");
   dialog.returnValue="cancel";
   const item=journal.find(entry=>entry.id===arg);
   dialog.addEventListener("close",async ()=>{
    if(dialog.returnValue!=="delete" || !item)return;
    const withoutEntry=()=>journal.filter(row=>row.id!==arg);
    const onDeleted=()=>{
     if(activeId===arg)activeId=null;
     if(route()[0]==="diario"){show();main.focus({preventScroll:true});}
    };
    if(cloudConfigured){
     await journalOperation(button,async (userId,isCurrent)=>{
      await cloud.remove(userId,item);
      if(isCurrent()){journal=withoutEntry();onDeleted();}
     });
    }else if(writeJournal(withoutEntry()))onDeleted();
   },{once:true});
   dialog.showModal();return;
  }
  default:return;
 }
 show();
 Array.from(main.querySelectorAll("[data-act]")).find(el=>el.dataset.act===button.dataset.act)?.focus({preventScroll:true});
});
window.addEventListener("hashchange",()=>{if(location.hash!=="#contenido")show(true);});
show(location.hash.startsWith("#aprender/"));
if(cloudConfigured) void startAccount();
