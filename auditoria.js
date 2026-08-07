const questions = [
  ["Pipeline real", "¿El pipeline refleja tu proceso de venta real, o son las etapas de fábrica que nadie tocó?", "commercial", false],
  ["Actividad automática", "¿Las llamadas y reuniones se registran solas, o dependen de que alguien se acuerde de escribirlas?", "commercial", false],
  ["Seguimiento inteligente", "¿El sistema crea las tareas de seguimiento solo, o depende de la memoria del comercial?", "data", false],
  ["Control de duplicados", "¿Tu sistema evita que dos personas llamen al mismo lead el mismo día?", "data", false],
  ["Visibilidad ejecutiva", "¿El dueño o CEO ve el estado real del negocio sin pedirle un reporte a nadie?", "commercial", false],
  ["Adopción diaria", "¿Tu equipo usa Salesforce todos los días sin que se lo exijan?", "commercial", false],
  ["Asignación de casos", "¿Los casos se asignan automáticamente, o alguien los reparte a mano?", "clouds", true],
  ["SLA medible", "¿Tenés un tiempo de respuesta que podés medir, o es “lo que tarde”?", "clouds", true],
  ["ROI de campañas", "¿Sabés qué campaña generó cada venta, en pesos?", "clouds", true],
  ["Marketing conectado", "¿Los leads de marketing entran solos a ventas, o alguien los pasa a mano?", "clouds", true],
  ["Autoservicio de clientes", "¿Tus clientes pueden ver pedidos, casos o facturas sin llamarte?", "clouds", true],
  ["Integraciones sin copy-paste", "¿Tu equipo evita copiar y pegar datos entre Salesforce y otros sistemas?", "data", true],
  ["Seguridad bien definida", "¿Sabés quién puede ver y editar qué, sin que todos sean “medio admin”?", "data", true],
  ["Venta móvil", "¿Tu equipo puede cerrar una venta desde el celular sin volver a la oficina?", "clouds", true]
];

const cats = {
  commercial: ["I", "Núcleo comercial", "Ventas, visibilidad y adopción"],
  data: ["II", "Datos & automatización", "Calidad, seguimiento y seguridad"],
  clouds: ["III", "Nubes extendidas", "Solo si usás esa funcionalidad"]
};

function render(el, start, end) {
  let html = "", previous = "";
  questions.slice(start, end).forEach((q, offset) => {
    const index = start + offset;
    if (q[2] !== previous) {
      if (previous) html += "</div></section>";
      const category = cats[q[2]];
      html += `<section class="question-category ${q[2]}"><header><span>${category[0]}</span><b>${category[1]}</b><small>(${category[2]})</small></header><div>`;
      previous = q[2];
    }
    html += `<article class="question"><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${q[0]}${q[3] ? " · Extendido" : ""}</h3><p>${q[1]}</p></div><fieldset><label><input type="radio" name="q${index}" value="2">SÍ</label><label><input type="radio" name="q${index}" value="1">PARCIAL</label><label><input type="radio" name="q${index}" value="0">NO</label>${q[3] ? `<label class="na"><input type="radio" name="q${index}" value="na">N/A</label>` : ""}</fieldset></article>`;
  });
  el.innerHTML = html + "</div></section>";
}

render(document.querySelector("#questions-one"), 0, 6);
render(document.querySelector("#questions-two"), 6, 14);

const groups = { commercial: [0, 1, 4, 5], data: [2, 3, 11, 12], clouds: [6, 7, 8, 9, 10, 13] };
function groupScore(indices) {
  const values = indices.map(i => document.querySelector(`input[name="q${i}"]:checked`)?.value).filter(v => v && v !== "na").map(Number);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / (values.length * 2) * 100) : null;
}

function update() {
  const answers = questions.map((_, i) => document.querySelector(`input[name="q${i}"]:checked`)?.value);
  const complete = answers.every(Boolean);
  const scored = answers.filter(v => v && v !== "na").map(Number);
  const score = complete && scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / (scored.length * 2) * 100) : null;
  const findings = answers.filter(v => v === "0" || v === "1").length;
  document.querySelector("#no-count").textContent = findings;
  document.querySelector("#score-value").textContent = score === null ? "—" : score;
  document.querySelector("#score-ring").style.setProperty("--score", score === null ? "0deg" : `${score * 3.6}deg`);
  Object.entries(groups).forEach(([key, indices]) => {
    const value = complete ? groupScore(indices) : null;
    document.querySelector(`#${key}-score`).textContent = value === null ? "—" : `${value}%`;
    document.querySelector(`#${key}-bar`).style.width = value === null ? "0%" : `${value}%`;
  });

  let status = "Completá la auditoría", title = "Descubrí dónde tenés dinero parado.", copy = "Respondé los 14 puntos para medir cuánto valor real le está devolviendo Salesforce a tu empresa.", level = "pending";
  if (complete && score > 75) {
    status = "Salesforce bien construido"; title = "Tu Salesforce vende. El próximo salto está en optimizar."; copy = "La base funciona y acompaña al negocio. Revisá los hallazgos parciales para encontrar mejoras de alto impacto."; level = "excellent";
  } else if (complete && score >= 50) {
    status = "Hay palanca sin usar"; title = "Funciona, pero todavía deja dinero arriba de la mesa."; copy = "Hay procesos manuales y capacidades nativas sin aprovechar. Resolverlos puede acelerar ventas sin desarrollo a medida."; level = "improvable";
  } else if (complete) {
    status = "Te está costando plata"; title = "Tu Salesforce está frenando al equipo todos los meses."; copy = "La fricción es estructural: se pierde información, tiempo comercial y visibilidad. La buena noticia es que puede resolverse con herramientas estándar."; level = "urgent";
  }
  document.querySelector("#audit-result").dataset.level = level;
  document.querySelector("#result-status").textContent = status;
  document.querySelector("#result-title").textContent = title;
  document.querySelector("#result-copy").textContent = copy;
}

function updateMissing() {
  const remaining = questions.filter((_, i) => !document.querySelector(`input[name="q${i}"]:checked`)).length;
  const notice = document.querySelector("#answers-missing");
  notice.hidden = remaining === 0;
  notice.textContent = remaining === 1 ? "Falta 1 respuesta para calcular tu puntaje." : `Faltan ${remaining} respuestas para calcular tu puntaje.`;
}

document.onchange = () => { update(); updateMissing(); };
document.querySelector("#restart").onclick = () => { document.querySelectorAll(".question input").forEach(input => input.checked = false); update(); updateMissing(); window.scrollTo({top: 0, behavior: "smooth"}); };
update(); updateMissing();
