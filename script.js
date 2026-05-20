const appState = {
  dataControle: null,
  tarefasProcessadas: [],
  filtros: {
    busca: "",
    macro: "",
    responsavel: "",
    status: "",
    prioridade: ""
  }
};

const STATUS_KEY = "zeus_status_tarefas";
const LOGO_KEY = "zeus_logo_data_url";

const statusOptions = CRONOGRAMA_ZEUS.statusDisponiveis;
const el = (id) => document.getElementById(id);

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  const date = parseDate(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatMonth(dateString) {
  const date = parseDate(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(date).replace(/^./, (m) => m.toUpperCase());
}

function daysBetween(from, to) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86400000);
}

function isDone(status) {
  return ["Publicado", "Concluído"].includes(status);
}

function getSavedStatuses() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStatus(taskId, status) {
  const current = getSavedStatuses();
  current[taskId] = status;
  localStorage.setItem(STATUS_KEY, JSON.stringify(current));
}

function getTaskStatus(task) {
  const saved = getSavedStatuses();
  return saved[task.id] || task.statusInicial || "Não iniciado";
}

function calculateDynamicPriority(task, controlDate) {
  const status = getTaskStatus(task);
  const prazo = parseDate(task.prazoInterno);
  const entrega = parseDate(task.dataEntrega);
  const diasPrazo = daysBetween(controlDate, prazo);
  const diasEntrega = daysBetween(controlDate, entrega);

  if (isDone(status)) {
    return {
      label: "Concluído",
      level: "done",
      alert: "FINALIZADO",
      diasPrazo,
      diasEntrega
    };
  }

  if (diasPrazo < 0) {
    return {
      label: "P0 - ATRASADO",
      level: "p0",
      alert: "ATRASADO",
      diasPrazo,
      diasEntrega
    };
  }

  if (diasPrazo <= 2) {
    return {
      label: "P1 - URGENTE",
      level: "p1",
      alert: "URGENTE",
      diasPrazo,
      diasEntrega
    };
  }

  if (diasPrazo <= 5) {
    return {
      label: "P2 - ATENÇÃO",
      level: "p2",
      alert: "FINALIZAR EM BREVE",
      diasPrazo,
      diasEntrega
    };
  }

  const base = task.prioridadeBase || "P3 - Baixa";
  let level = "p3";
  if (base.startsWith("P1")) level = "p1";
  if (base.startsWith("P2")) level = "p2";
  if (base.startsWith("P0")) level = "p0";

  return {
    label: base,
    level,
    alert: "PLANEJADO",
    diasPrazo,
    diasEntrega
  };
}

function processTasks() {
  const controlDate = parseDate(appState.dataControle);
  appState.tarefasProcessadas = CRONOGRAMA_ZEUS.tarefas.map((task) => {
    const status = getTaskStatus(task);
    const prioridade = calculateDynamicPriority(task, controlDate);
    return { ...task, status, prioridade };
  });
}

function uniqueValues(field) {
  return [...new Set(CRONOGRAMA_ZEUS.tarefas.map((t) => t[field]).filter(Boolean))].sort();
}

function fillSelect(selectId, values) {
  const select = el(selectId);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function renderDashboard() {
  const tasks = appState.tarefasProcessadas;
  const total = tasks.length;
  const atrasadas = tasks.filter((t) => t.prioridade.level === "p0").length;
  const urgentes = tasks.filter((t) => t.prioridade.level === "p1" && t.prioridade.alert === "URGENTE").length;
  const horas = tasks.reduce((acc, t) => acc + Number(t.tempoEstimado || 0), 0);

  el("totalTarefas").textContent = total;
  el("totalAtrasadas").textContent = atrasadas;
  el("totalUrgentes").textContent = urgentes;
  el("totalHoras").textContent = `${horas.toFixed(1).replace(".0", "")}h`;

  const byMacro = {};
  tasks.forEach((task) => {
    byMacro[task.macro] = (byMacro[task.macro] || 0) + 1;
  });

  const max = Math.max(...Object.values(byMacro));
  el("macroResumo").innerHTML = Object.entries(byMacro)
    .map(([macro, qtd]) => `
      <div class="bar-item">
        <div class="bar-name">${escapeHtml(macro)}</div>
        <div class="bar-track"><div class="bar-fill" style="width: ${(qtd / max) * 100}%"></div></div>
        <div><strong>${qtd}</strong> itens</div>
      </div>
    `).join("");
}

function renderCalendar() {
  const groupedByMonth = {};

  appState.tarefasProcessadas
    .slice()
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega))
    .forEach((task) => {
      const month = formatMonth(task.dataEntrega);
      const dateKey = task.dataEntrega;
      groupedByMonth[month] ??= {};
      groupedByMonth[month][dateKey] ??= [];
      groupedByMonth[month][dateKey].push(task);
    });

  el("calendarGrid").innerHTML = Object.entries(groupedByMonth).map(([month, days]) => `
    <div class="month-block">
      <div class="month-title">${escapeHtml(month)}</div>
      <div class="day-list">
        ${Object.entries(days).map(([date, tasks]) => `
          <article class="day-card">
            <h4>${formatDate(date)} • ${escapeHtml(tasks[0].dia)}</h4>
            ${tasks.map((task) => `
              <div class="mini-task">
                <span class="badge ${task.prioridade.level}">${escapeHtml(task.prioridade.label)}</span>
                <strong>${escapeHtml(task.titulo)}</strong>
                <span>${escapeHtml(task.responsavel)} • ${escapeHtml(task.canal)}</span>
              </div>
            `).join("")}
          </article>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function filterTasks() {
  const busca = appState.filtros.busca.trim().toLowerCase();

  return appState.tarefasProcessadas.filter((task) => {
    const haystack = [
      task.titulo,
      task.macro,
      task.campanha,
      task.tipo,
      task.canal,
      task.responsavel,
      task.apoio,
      task.observacoes
    ].join(" ").toLowerCase();

    if (busca && !haystack.includes(busca)) return false;
    if (appState.filtros.macro && task.macro !== appState.filtros.macro) return false;
    if (appState.filtros.responsavel && task.responsavel !== appState.filtros.responsavel) return false;
    if (appState.filtros.status && task.status !== appState.filtros.status) return false;
    if (appState.filtros.prioridade && !task.prioridade.label.startsWith(appState.filtros.prioridade)) return false;

    return true;
  });
}

function renderTasksTable() {
  const tasks = filterTasks().sort((a, b) => {
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3, done: 4 };
    const pa = priorityOrder[a.prioridade.level] ?? 5;
    const pb = priorityOrder[b.prioridade.level] ?? 5;
    if (pa !== pb) return pa - pb;
    return a.dataEntrega.localeCompare(b.dataEntrega);
  });

  el("contadorFiltro").textContent = `${tasks.length} itens`;

  el("tabelaTarefas").innerHTML = tasks.map((task) => `
    <tr>
      <td>
        <strong>${formatDate(task.dataEntrega)}</strong>
        <div class="task-note">${escapeHtml(task.dia)}</div>
      </td>
      <td>
        <span class="badge neutral">${escapeHtml(task.macro)}</span>
        <div class="task-note">${escapeHtml(task.tipo)}</div>
      </td>
      <td>
        <div class="task-title">${escapeHtml(task.titulo)}</div>
        ${task.observacoes ? `<div class="task-note">${escapeHtml(task.observacoes)}</div>` : ""}
      </td>
      <td>${escapeHtml(task.campanha)}</td>
      <td>
        <strong>${escapeHtml(task.responsavel)}</strong>
        <div class="task-note">${escapeHtml(task.apoio)}</div>
      </td>
      <td>
        <strong>${formatDate(task.prazoInterno)}</strong>
        <div class="task-note">${task.prioridade.diasPrazo} dias para o prazo</div>
      </td>
      <td>
        <span class="badge ${task.prioridade.level}">${escapeHtml(task.prioridade.label)}</span>
        <div class="task-note">${escapeHtml(task.prioridade.alert)}</div>
      </td>
      <td>
        <select class="status-select" data-id="${task.id}">
          ${statusOptions.map((status) => `<option value="${escapeHtml(status)}" ${status === task.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
      </td>
      <td>${Number(task.tempoEstimado).toFixed(2).replace(".00", "")}h</td>
    </tr>
  `).join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      saveStatus(event.target.dataset.id, event.target.value);
      refresh();
      showToast("Status atualizado e prioridade recalculada.");
    });
  });
}

function renderCampaigns() {
  const html = CRONOGRAMA_ZEUS.campanhas.map((campanha) => {
    const relatedTasks = appState.tarefasProcessadas.filter((task) => task.campanha === campanha.nome);
    const horas = relatedTasks.reduce((acc, task) => acc + Number(task.tempoEstimado || 0), 0);
    return `
      <article class="campaign-card">
        <h4>${escapeHtml(campanha.nome)}</h4>
        <p>${escapeHtml(campanha.visual)}</p>
        <div class="campaign-meta">
          <span class="badge p1">${escapeHtml(campanha.prioridade)}</span>
          <span class="badge neutral">${escapeHtml(campanha.periodo)}</span>
          <span class="badge neutral">${relatedTasks.length} tarefas</span>
          <span class="badge neutral">${horas.toFixed(1).replace(".0", "")}h</span>
        </div>
        <p><strong>Itens:</strong> ${escapeHtml(campanha.itens)}</p>
        <p><strong>Responsável:</strong> ${escapeHtml(campanha.responsavel)} • <strong>Apoio:</strong> ${escapeHtml(campanha.apoio)}</p>
      </article>
    `;
  }).join("");

  el("campaignCards").innerHTML = html;
}

function renderTeam() {
  const tasks = appState.tarefasProcessadas;
  el("teamCards").innerHTML = CRONOGRAMA_ZEUS.responsaveis.map((person) => {
    const related = tasks.filter((task) => task.responsavel === person.nome);
    const hours = related.reduce((acc, task) => acc + Number(task.tempoEstimado || 0), 0);
    const atrasadas = related.filter((task) => task.prioridade.level === "p0").length;

    return `
      <article class="team-card">
        <h4>${escapeHtml(person.nome)}</h4>
        <div class="team-hours">${hours.toFixed(1).replace(".0", "")}h</div>
        <p>${escapeHtml(person.foco)}</p>
        <div class="campaign-meta">
          <span class="badge neutral">${related.length} tarefas</span>
          <span class="badge ${atrasadas ? "p0" : "done"}">${atrasadas} atrasadas</span>
        </div>
        <p>${escapeHtml(person.observacao)}</p>
      </article>
    `;
  }).join("");
}

function refresh() {
  processTasks();
  renderDashboard();
  renderCalendar();
  renderTasksTable();
  renderCampaigns();
  renderTeam();
}

function setupFilters() {
  fillSelect("filtroMacro", uniqueValues("macro"));
  fillSelect("filtroResponsavel", uniqueValues("responsavel"));
  statusOptions.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    el("filtroStatus").appendChild(option);
  });

  el("busca").addEventListener("input", (e) => {
    appState.filtros.busca = e.target.value;
    renderTasksTable();
  });

  el("filtroMacro").addEventListener("change", (e) => {
    appState.filtros.macro = e.target.value;
    renderTasksTable();
  });

  el("filtroResponsavel").addEventListener("change", (e) => {
    appState.filtros.responsavel = e.target.value;
    renderTasksTable();
  });

  el("filtroStatus").addEventListener("change", (e) => {
    appState.filtros.status = e.target.value;
    renderTasksTable();
  });

  el("filtroPrioridade").addEventListener("change", (e) => {
    appState.filtros.prioridade = e.target.value;
    renderTasksTable();
  });

  el("limparFiltros").addEventListener("click", () => {
    appState.filtros = { busca: "", macro: "", responsavel: "", status: "", prioridade: "" };
    ["busca", "filtroMacro", "filtroResponsavel", "filtroStatus", "filtroPrioridade"].forEach((id) => {
      el(id).value = "";
    });
    renderTasksTable();
  });
}

function setupDateControl() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  appState.dataControle = todayIso;
  el("dataControle").value = todayIso;

  el("dataControle").addEventListener("change", (e) => {
    appState.dataControle = e.target.value || todayIso;
    refresh();
  });

  el("btnHoje").addEventListener("click", () => {
    appState.dataControle = todayIso;
    el("dataControle").value = todayIso;
    refresh();
    showToast("Data de controle ajustada para hoje.");
  });
}

function setupExport() {
  el("btnExportar").addEventListener("click", () => {
    const data = {
      exportadoEm: new Date().toISOString(),
      dataControle: appState.dataControle,
      status: getSavedStatuses()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "status-cronograma-zeus.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Arquivo de status exportado.");
  });
}

function setupLogoUpload() {
  const savedLogo = localStorage.getItem(LOGO_KEY);
  if (savedLogo) {
    el("logoPreview").src = savedLogo;
  }

  el("logoInput").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(LOGO_KEY, reader.result);
      el("logoPreview").src = reader.result;
      showToast("Logo aplicada ao sistema.");
    };
    reader.readAsDataURL(file);
  });
}

function setupNavActiveState() {
  const links = [...document.querySelectorAll(".nav a")];
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  setupDateControl();
  setupFilters();
  setupExport();
  setupLogoUpload();
  setupNavActiveState();
  refresh();
});
