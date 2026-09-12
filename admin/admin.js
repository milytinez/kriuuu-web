let audits = [];
const cards = document.querySelector("#cards");
const status = document.querySelector("#status");
const detail = document.querySelector("#detail");
const answerLabel = { "0": "No", "1": "Parcial", "2": "Sí", "na": "N/A" };
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

async function load(query = "") {
  status.textContent = "Cargando auditorías…";
  try {
    const response = await fetch(`/admin/api/audits?q=${encodeURIComponent(query)}`, { headers: { accept: "application/json" } });
    if (response.status === 401) throw new Error("Tu sesión no está autorizada.");
    if (!response.ok) throw new Error("No pudimos cargar los datos.");
    audits = (await response.json()).results;
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

function render() {
  document.querySelector("#total").textContent = audits.length;
  document.querySelector("#export").disabled = !audits.length;
  status.textContent = audits.length ? "" : "Todavía no hay auditorías guardadas.";
  cards.innerHTML = audits.map((audit, index) => `<button class="card" data-index="${index}">
    <span class="score ${audit.score < 50 ? "low" : audit.score <= 75 ? "mid" : "high"}">${audit.score}<small>/100</small></span>
    <span class="person"><strong>${esc(audit.name)}</strong><small>${esc(audit.company || "Sin empresa")} · ${esc(audit.role || "Sin rol")}</small></span>
    <span class="contact">${esc(audit.email)}</span><time>${new Date(audit.created_at + "Z").toLocaleDateString("es-AR")}</time><b>Ver diagnóstico →</b>
  </button>`).join("");
  cards.querySelectorAll(".card").forEach(card => card.addEventListener("click", () => openDetail(audits[Number(card.dataset.index)])));
}

function openDetail(audit) {
  const profile = audit.profile || {};
  document.querySelector("#detail-content").innerHTML = `<p class="eyebrow">DIAGNÓSTICO GUARDADO</p><h2>${esc(audit.name)} <em>${audit.score}/100</em></h2>
    <p><a href="mailto:${encodeURIComponent(audit.email)}">${esc(audit.email)}</a> · ${esc(audit.company || "Sin empresa")} · ${esc(audit.role || "Sin rol")}</p>
    <div class="scores"><span>Comercial <b>${audit.categoryScores?.commercial ?? "—"}%</b></span><span>Datos <b>${audit.categoryScores?.data ?? "—"}%</b></span><span>Nubes <b>${audit.categoryScores?.clouds ?? "—"}%</b></span></div>
    <dl><div><dt>Productos</dt><dd>${esc(profile.products || "—")}</dd></div><div><dt>Antigüedad</dt><dd>${esc(profile.implementationAge || "—")}</dd></div><div><dt>Administración</dt><dd>${esc(profile.administration || "—")}</dd></div><div><dt>Objetivo</dt><dd>${esc(profile.objective || "—")}</dd></div></dl>
    <ol>${audit.answers.map(answer => `<li><span>${esc(answer.label)}</span><b>${answerLabel[answer.value] || "—"}</b></li>`).join("")}</ol>`;
  detail.showModal();
}

let timer;
document.querySelector("#search").addEventListener("input", event => { clearTimeout(timer); timer = setTimeout(() => load(event.target.value), 250); });
document.querySelector(".close").addEventListener("click", () => detail.close());
document.querySelector("#export").addEventListener("click", () => {
  const quote = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [["Fecha","Nombre","Email","Empresa","Rol","Puntaje","Comercial","Datos","Nubes"], ...audits.map(a => [a.created_at,a.name,a.email,a.company,a.role,a.score,a.categoryScores?.commercial,a.categoryScores?.data,a.categoryScores?.clouds])];
  const blob = new Blob(["\ufeff" + rows.map(row => row.map(quote).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `kriuuu-auditorias-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
});
load();
