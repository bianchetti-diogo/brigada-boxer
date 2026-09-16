// =========================================================================
// BRIGADA BOXER - Cadastro e gestão de Brigadistas
// =========================================================================

let brigadistasCache = [];
let fotoArquivoSelecionado = null;

document.addEventListener("DOMContentLoaded", () => {
  mostrarAvisoConfiguracao();
  setupTabs();
  setupForm();
  carregarBrigadistas();

  document.getElementById("btn-print-quadro").addEventListener("click", () => window.print());
  document.getElementById("btn-export-pdf").addEventListener("click", exportarListaPDF);
});

// ---------------- Tabs ----------------
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((sec) => (sec.style.display = "none"));
      document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    });
  });
}

// ---------------- Form ----------------
function setupForm() {
  document.getElementById("foto-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fotoArquivoSelecionado = file;
    document.getElementById("foto-preview").src = URL.createObjectURL(file);
  });

  document.getElementById("form-brigadista").addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvarBrigadista();
  });

  document.getElementById("btn-cancelar-edicao").addEventListener("click", resetarFormulario);
}

function resetarFormulario() {
  document.getElementById("form-brigadista").reset();
  document.getElementById("brigadista-id").value = "";
  document.getElementById("foto-preview").src = "https://placehold.co/96x96?text=Foto";
  document.getElementById("form-title").textContent = "Novo Brigadista";
  document.getElementById("btn-cancelar-edicao").style.display = "none";
  fotoArquivoSelecionado = null;
}

async function salvarBrigadista() {
  if (!CONFIGURADO) {
    showToast("Configure o Supabase antes de salvar (js/supabaseClient.js).", "error");
    return;
  }

  const id = document.getElementById("brigadista-id").value;
  const nome = document.getElementById("campo-nome").value.trim();
  const cargo = document.getElementById("campo-cargo").value;
  const area = document.getElementById("campo-area").value;
  const piso = document.getElementById("campo-piso").value;
  const funcao = document.getElementById("campo-funcao").value;

  if (!nome || !cargo || !area || !piso || !funcao) {
    showToast("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  const submitBtn = document.querySelector("#form-brigadista button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando...";

  try {
    let foto_url;
    if (fotoArquivoSelecionado) {
      foto_url = await uploadArquivo(BUCKET_FOTOS, fotoArquivoSelecionado, "brigadistas/");
    }

    const payload = { nome, cargo, area, piso, funcao, updated_at: new Date().toISOString() };
    if (foto_url) payload.foto_url = foto_url;

    if (id) {
      const { error } = await supabaseClient.from("brigadistas").update(payload).eq("id", id);
      if (error) throw error;
      showToast("Brigadista atualizado com sucesso!", "success");
    } else {
      const { error } = await supabaseClient.from("brigadistas").insert(payload);
      if (error) throw error;
      showToast("Brigadista cadastrado com sucesso!", "success");
    }

    resetarFormulario();
    await carregarBrigadistas();
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar: " + err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "💾 Salvar Brigadista";
  }
}

function editarBrigadista(id) {
  const b = brigadistasCache.find((x) => x.id === id);
  if (!b) return;
  document.getElementById("brigadista-id").value = b.id;
  document.getElementById("campo-nome").value = b.nome;
  document.getElementById("campo-cargo").value = b.cargo;
  document.getElementById("campo-area").value = b.area;
  document.getElementById("campo-piso").value = b.piso;
  document.getElementById("campo-funcao").value = b.funcao;
  document.getElementById("foto-preview").src = b.foto_url || "https://placehold.co/96x96?text=Foto";
  document.getElementById("form-title").textContent = "Editar Brigadista";
  document.getElementById("btn-cancelar-edicao").style.display = "inline-flex";
  fotoArquivoSelecionado = null;
  document.querySelector('.tab-btn[data-tab="cadastro"]').click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirBrigadista(id) {
  if (!confirm("Tem certeza que deseja excluir este brigadista?")) return;
  try {
    const { error } = await supabaseClient.from("brigadistas").delete().eq("id", id);
    if (error) throw error;
    showToast("Brigadista removido.", "success");
    await carregarBrigadistas();
  } catch (err) {
    showToast("Erro ao excluir: " + err.message, "error");
  }
}

// ---------------- Carregamento ----------------
async function carregarBrigadistas() {
  if (!CONFIGURADO) {
    renderOrgChart([]);
    renderLista([]);
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("brigadistas")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    brigadistasCache = data || [];
  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar brigadistas: " + err.message, "error");
    brigadistasCache = [];
  }
  renderOrgChart(brigadistasCache);
  renderLista(brigadistasCache);
}

// ---------------- Quadro Hierárquico ----------------
function renderOrgChart(lista) {
  const container = document.getElementById("orgchart-container");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum brigadista cadastrado ainda.</div>';
    return;
  }

  const coordenadores = lista.filter((b) => b.cargo === "Coordenador");
  const lideres = lista.filter((b) => b.cargo === "Líder de Área");
  const integrantes = lista.filter((b) => b.cargo === "Integrante");

  container.appendChild(criarLinhaOrg("Coordenação", coordenadores, "coordenador"));
  container.appendChild(criarLinhaOrg("Líderes de Área", lideres, "lider"));
  container.appendChild(criarLinhaOrg("Socorristas e Combatentes", integrantes, "integrante"));
}

function criarLinhaOrg(titulo, pessoas, classe) {
  const wrapper = document.createElement("div");
  if (pessoas.length === 0) return wrapper;

  const label = document.createElement("div");
  label.className = "org-row-label";
  label.textContent = titulo;
  wrapper.appendChild(label);

  const row = document.createElement("div");
  row.className = "org-row";
  pessoas.forEach((p) => {
    const card = document.createElement("div");
    card.className = "org-card " + classe;
    card.innerHTML = `
      <img class="avatar" src="${p.foto_url || "https://placehold.co/64x64?text=Foto"}" />
      <div class="nome">${escapeHtml(p.nome)}</div>
      <div class="info">${escapeHtml(p.funcao)}</div>
      <div class="info">${escapeHtml(p.area)}</div>
    `;
    row.appendChild(card);
  });
  wrapper.appendChild(row);
  return wrapper;
}

// ---------------- Lista ----------------
function renderLista(lista) {
  const tbody = document.getElementById("tabela-lista-body");
  const emptyState = document.getElementById("lista-empty");
  tbody.innerHTML = "";

  if (lista.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  lista.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="avatar" src="${b.foto_url || "https://placehold.co/40x40?text=?"}" /></td>
      <td>${escapeHtml(b.nome)}</td>
      <td>${escapeHtml(b.cargo)}</td>
      <td>${escapeHtml(b.area)}</td>
      <td>${escapeHtml(b.piso)}</td>
      <td>${escapeHtml(b.funcao)}</td>
      <td class="row">
        <button class="btn btn-secondary" onclick="editarBrigadista('${b.id}')">✏️</button>
        <button class="btn btn-secondary" onclick="excluirBrigadista('${b.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarListaPDF() {
  if (brigadistasCache.length === 0) {
    showToast("Não há brigadistas para exportar.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("BRIGADA BOXER - Lista de Integrantes", 14, 16);
  doc.setFontSize(10);
  doc.text("Gerado em " + new Date().toLocaleDateString("pt-BR"), 14, 22);

  const rows = brigadistasCache.map((b) => [b.nome, b.cargo, b.area, b.piso, b.funcao]);
  doc.autoTable({
    startY: 28,
    head: [["Nome", "Cargo", "Área", "Piso", "Função"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [193, 18, 31] },
  });

  doc.save("brigada-boxer-integrantes.pdf");
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
