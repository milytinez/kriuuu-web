const questions = [
  { topic: "Pipeline real", text: "¿El pipeline refleja tu proceso de venta real, o son las etapas de fábrica que nadie tocó?", category: "selling" },
  { topic: "Actividad automática", text: "¿Las llamadas y reuniones se registran solas, o dependen de que alguien se acuerde de escribirlas?", category: "selling" },
  { topic: "Seguimiento inteligente", text: "¿El sistema crea las tareas de seguimiento solo, o depende de la memoria del comercial?", category: "selling" },
  { topic: "Venta móvil", text: "¿Tu equipo puede cerrar una venta desde el celular sin volver a la oficina?", category: "selling" },
  { topic: "Adopción diaria", text: "¿Tu equipo usa Salesforce todos los días sin que se lo exijan?", category: "selling" },
  { topic: "Visibilidad ejecutiva", text: "¿El dueño o CEO ve el estado real del negocio sin pedirle un reporte a nadie?", category: "control" },
  { topic: "Control de duplicados", text: "¿Tu sistema evita que dos personas llamen al mismo lead el mismo día?", category: "control" },
  { topic: "Seguridad bien definida", text: "¿Sabés quién puede ver y editar qué, sin que todos sean \"medio admin\"?", category: "control" },
  { topic: "Asignación de casos", text: "¿Los casos se asignan automáticamente, o alguien los reparte a mano?", category: "service", optional: true },
  { topic: "SLA medible", text: "¿Tenés un tiempo de respuesta que podés medir, o es \"lo que tarde\"?", category: "service", optional: true },
  { topic: "Autoservicio de clientes", text: "¿Tus clientes pueden ver pedidos, casos o facturas sin llamarte?", category: "service", optional: true },
  { topic: "ROI de campañas", text: "¿Sabés qué campaña generó cada venta, en pesos?", category: "marketing", optional: true },
  { topic: "Marketing conectado", text: "¿Los leads de marketing entran solos a ventas, o alguien los pasa a mano?", category: "marketing", optional: true },
  { topic: "Integraciones sin copy-paste", text: "¿Tu equipo evita copiar y pegar datos entre Salesforce y otros sistemas?", category: "marketing", optional: true }
];

const categories = {
  selling: ["A", "¿Te ayuda a VENDER?", "Lente vendedor · 10 puntos · aplica a todos"],
  control: ["B", "¿Te da CONTROL y datos confiables?", "Lente gerencia · 6 puntos · aplica a todos"],
  service: ["C", "Servicio y post-venta", "Opcional · solo si usás Servicio · admite N/A"],
  marketing: ["D", "Marketing y conexiones", "Opcional · admite N/A"]
};

const groups = {
  selling: [0, 1, 2, 3, 4],
  control: [5, 6, 7],
  service: [8, 9, 10],
  marketing: [11, 12, 13]
};

function render(container, start, end) {
  let html = "";
  let previous = "";
  questions.slice(start, end).forEach((question, offset) => {
    const index = start + offset;
    if (question.category !== previous) {
      if (previous) html += "</div></section>";
      const category = categories[question.category];
      html += `<section class="question-category ${question.category}" data-category="${question.category}"><header><span>${category[0]}</span><b>${category[1]}</b><small>(${category[2]})</small></header><div>`;
      previous = question.category;
    }
    html += `<article class="question"><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><div><h3>${question.topic}</h3><p>${question.text}</p></div><fieldset aria-label="${question.topic}"><label><input type="radio" name="q${index}" value="2">SÍ</label><label><input type="radio" name="q${index}" value="1">PARCIAL</label><label><input type="radio" name="q${index}" value="0">NO</label>${question.optional ? `<label class="na"><input type="radio" name="q${index}" value="na">N/A</label>` : ""}</fieldset></article>`;
  });
  container.innerHTML = html + "</div></section>";
}

render(document.querySelector("#questions-one"), 0, 8);
render(document.querySelector("#questions-two"), 8, 14);
document.querySelector("#audit-result").setAttribute("aria-live", "polite");
document.querySelector("#score-ring").setAttribute("role", "img");

const productSelect = document.querySelector("#profile-products");
const profileSelects = [...document.querySelectorAll(".audit-profile select")];

function categoryApplies(category) {
  if (category === "selling" || category === "control") return true;
  if (category === "service") return ["service", "multiple"].includes(productSelect.value);
  if (category === "marketing") return ["marketing", "multiple"].includes(productSelect.value);
  return false;
}

function applyRouting() {
  ["service", "marketing"].forEach(category => {
    const section = document.querySelector(`[data-category="${category}"]`);
    const applies = categoryApplies(category);
    section.hidden = !applies;
    section.setAttribute("aria-hidden", String(!applies));
    groups[category].forEach(index => {
      if (!applies) document.querySelector(`input[name="q${index}"][value="na"]`).checked = true;
    });
  });
}

function visibleIndices() {
  return questions.map((question, index) => ({ question, index })).filter(({ question }) => categoryApplies(question.category)).map(({ index }) => index);
}

function answerValue(index) {
  return document.querySelector(`input[name="q${index}"]:checked`)?.value;
}

function groupScore(indices) {
  const values = indices.map(answerValue).filter(value => value && value !== "na").map(Number);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / (values.length * 2) * 100) : null;
}

function profileIsComplete() {
  return profileSelects.every(select => select.value);
}

function modeVerdict(selling, control) {
  const sells = selling >= 50;
  const controls = control >= 50;
  if (!sells && controls) return "Tu Salesforce es un archivo, no una herramienta de venta.";
  if (sells && !controls) return "Vende, pero a ciegas: sin datos confiables arriba.";
  if (!sells && !controls) return "Estás pagando Salesforce y casi no lo usás.";
  return "Bien construido — a afinar detalles.";
}

function contrastMessage(selling, control) {
  const objective = document.querySelector("#profile-objective").value;
  if (objective === "sell" && selling < 50) return "Hay una contradicción clave: el objetivo declarado es vender mejor, pero Salesforce hoy puntúa bajo como herramienta de venta.";
  if (objective === "control" && control < 50) return "Hay una contradicción clave: el objetivo declarado es dar visibilidad a la gerencia, pero el bloque Controlar hoy puntúa bajo.";
  if (objective === "both" && (selling < 50 || control < 50)) return "El objetivo declarado combina venta y control, pero al menos una de esas dos capacidades todavía está por debajo de lo esperado.";
  return "";
}

function currentState() {
  const applicable = visibleIndices();
  const answers = applicable.map(answerValue);
  const questionsComplete = answers.every(Boolean);
  const complete = profileIsComplete() && questionsComplete;
  const scored = answers.filter(value => value && value !== "na").map(Number);
  const score = complete && scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / (scored.length * 2) * 100) : null;
  return { applicable, answers, complete, score };
}

function update() {
  const { applicable, answers, complete, score } = currentState();
  const findings = answers.filter(value => value === "0" || value === "1").length;
  const selling = complete ? groupScore(groups.selling) : null;
  const control = complete ? groupScore(groups.control) : null;

  document.querySelector("#no-count").textContent = findings;
  document.querySelector("#applicable-count").textContent = applicable.length;
  document.querySelector("#score-value").textContent = score === null ? "—" : score;
  document.querySelector("#score-ring").setAttribute("aria-label", score === null ? "Puntaje pendiente" : `Puntaje ${score} de 100`);
  document.querySelector("#score-ring").style.setProperty("--score", score === null ? "0deg" : `${score * 3.6}deg`);

  [["selling", selling], ["control", control]].forEach(([key, value]) => {
    document.querySelector(`#${key}-score`).textContent = value === null ? "—" : `${value}%`;
    document.querySelector(`#${key}-bar`).style.width = value === null ? "0%" : `${value}%`;
  });

  let status = "Completá la auditoría";
  let title = "Descubrí dónde tenés dinero parado.";
  let copy = "Respondé el perfil y los puntos visibles para medir cuánto valor real le está devolviendo Salesforce a tu empresa.";
  let level = "pending";
  if (complete && score > 75) {
    status = "Bien construido";
    title = "La base es sólida. Ahora toca afinar los detalles.";
    copy = "Salesforce acompaña al negocio y aprovecha buena parte de su capacidad estándar. Los hallazgos parciales muestran dónde está el próximo salto.";
    level = "excellent";
  } else if (complete && score >= 50) {
    status = "Palanca sin usar";
    title = "Funciona, pero todavía deja dinero arriba de la mesa.";
    copy = "Hay procesos manuales y capacidades estándar sin aprovechar. Resolverlos puede acelerar ventas y mejorar el control sin desarrollo a medida.";
    level = "improvable";
  } else if (complete) {
    status = "Te cuesta plata";
    title = "Tu Salesforce está frenando al equipo todos los meses.";
    copy = "La fricción es estructural: se pierde tiempo comercial, información y visibilidad. La buena noticia es que gran parte puede resolverse con herramientas estándar.";
    level = "urgent";
  }

  const result = document.querySelector("#audit-result");
  result.dataset.level = level;
  document.querySelector("#result-status").textContent = status;
  document.querySelector("#result-title").textContent = title;
  document.querySelector("#result-copy").textContent = copy;

  const verdict = document.querySelector("#mode-verdict");
  const contrast = document.querySelector("#contrast-note");
  verdict.hidden = !complete;
  if (complete) {
    document.querySelector("#mode-verdict-text").textContent = modeVerdict(selling, control);
    const contrastText = contrastMessage(selling, control);
    contrast.hidden = !contrastText;
    contrast.textContent = contrastText;
  }

  const gate = document.querySelector("#result-gate");
  const preview = document.querySelector("#result-preview");
  if (!complete) {
    gate.hidden = true;
    preview.classList.remove("is-locked");
    preview.removeAttribute("aria-hidden");
  } else if (!result.classList.contains("is-revealed")) {
    gate.hidden = false;
    preview.classList.add("is-locked");
    preview.setAttribute("aria-hidden", "true");
  }
}

function updateMissing() {
  const unanswered = visibleIndices().filter(index => !answerValue(index)).length;
  const missingProfile = profileSelects.filter(select => !select.value).length;
  const notice = document.querySelector("#answers-missing");
  notice.hidden = unanswered === 0 && missingProfile === 0;
  const parts = [];
  if (unanswered) parts.push(unanswered === 1 ? "1 respuesta de auditoría" : `${unanswered} respuestas de auditoría`);
  if (missingProfile) parts.push(missingProfile === 1 ? "1 dato de perfil" : `${missingProfile} datos de perfil`);
  notice.textContent = parts.length ? `Faltan ${parts.join(" y ")} para calcular tu puntaje.` : "";
}

document.addEventListener("change", event => {
  if (event.target === productSelect) applyRouting();
  update();
  updateMissing();
});

document.querySelector("#restart").addEventListener("click", () => {
  document.querySelectorAll(".question input").forEach(input => { input.checked = false; });
  profileSelects.forEach(select => { select.value = ""; });
  document.querySelector("#audit-result").classList.remove("is-revealed");
  applyRouting();
  update();
  updateMissing();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#lead-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#lead-message");
  const button = document.querySelector("#lead-submit");
  const state = currentState();
  if (!state.complete) {
    message.textContent = "Completá el perfil y las respuestas pendientes antes de guardar el resultado.";
    document.querySelector("#answers-missing").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const answers = questions.map((question, index) => ({ key: `q${index + 1}`, label: question.topic, value: answerValue(index) || "na" }));
  const data = new FormData(form);
  const optionText = select => select.options[select.selectedIndex]?.text || "";
  const selling = groupScore(groups.selling);
  const control = groupScore(groups.control);
  const payload = {
    name: data.get("name"), email: data.get("email"), company: data.get("company"), role: data.get("role"), consent: data.get("consent") === "on",
    profile: { products: optionText(productSelect), objective: optionText(document.querySelector("#profile-objective")), objectiveKey: document.querySelector("#profile-objective").value, implementationAge: document.querySelector("#profile-age").value, administration: document.querySelector("#profile-administration").value },
    answers,
    score: state.score,
    categoryScores: { selling, control, service: groupScore(groups.service), marketing: groupScore(groups.marketing), verdict: modeVerdict(selling, control) }
  };

  button.disabled = true;
  button.textContent = "Guardando…";
  message.textContent = "";
  try {
    const response = await fetch("/api/audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("No se pudo guardar");
    form.reset();
    document.querySelector("#audit-result").classList.add("is-revealed");
    document.querySelector("#result-preview").classList.remove("is-locked");
    document.querySelector("#result-preview").removeAttribute("aria-hidden");
    document.querySelector("#result-gate").hidden = true;
    document.querySelector("#result-preview").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    message.textContent = "No pudimos guardar el resultado. Intentá nuevamente o escribinos a hola@kriuuu.com.";
  } finally {
    button.disabled = false;
    button.textContent = "Guardar resultado y contactarme →";
  }
});

applyRouting();
update();
updateMissing();
