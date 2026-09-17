// =========================================================================
// BRIGADA BOXER - Gestão de ATA
// =========================================================================

let brigadistasAtivos = [];

document.addEventListener("DOMContentLoaded", () => {
  mostrarAvisoConfiguracao();
  setupTabsAta();
  carregarBrigadistasParaDatalist();
  atualizarEmptyAcoes();

  document.getElementById("btn-add-acao").addEventListener("click", adicionarLinhaAcao);
  document.getElementById("btn-salvar-ata").addEventListener("click", salvarAta);

  carregarHistorico();
});

// ---------------- Tabs ----------------
function setupTabsAta() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((sec) => (sec.style.display = "none"));
      document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
      if (btn.dataset.tab === "historico") carregarHistorico();
    });
  });
}

// ---------------- Brigadistas (para autocomplete e assinatura) ----------------
async function carregarBrigadistasParaDatalist() {
  if (!CONFIGURADO) return;
  try {
    const { data, error } = await supabaseClient
      .from("brigadistas")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    brigadistasAtivos = data || [];
    const datalist = document.getElementById("lista-brigadistas");
    datalist.innerHTML = brigadistasAtivos.map((b) => `<option value="${escapeHtmlAta(b.nome)}"></option>`).join("");
  } catch (err) {
    console.error(err);
  }
}

// ---------------- Linhas de ação dinâmicas ----------------
function adicionarLinhaAcao() {
  const tpl = document.getElementById("tpl-acao-row");
  const clone = tpl.content.cloneNode(true);
  const row = clone.querySelector(".acao-row");
  row.querySelector(".btn-remove-acao").addEventListener("click", () => {
    row.remove();
    atualizarEmptyAcoes();
  });
  document.getElementById("acoes-container").appendChild(clone);
  atualizarEmptyAcoes();
}

function atualizarEmptyAcoes() {
  const container = document.getElementById("acoes-container");
  document.getElementById("acoes-empty").style.display = container.children.length === 0 ? "block" : "none";
}

function coletarAcoesFormulario() {
  const rows = document.querySelectorAll("#acoes-container .acao-row");
  const acoes = [];
  rows.forEach((row) => {
    const descricao = row.querySelector(".acao-descricao").value.trim();
    const responsavel = row.querySelector(".acao-responsavel").value.trim();
    const prazo = row.querySelector(".acao-prazo").value;
    if (descricao && responsavel && prazo) {
      acoes.push({ descricao, responsavel, prazo });
    }
  });
  return acoes;
}

// ---------------- Salvar ATA ----------------
async function salvarAta() {
  if (!CONFIGURADO) {
    showToast("Configure o Supabase antes de salvar.", "error");
    return;
  }

  const data_reuniao = document.getElementById("ata-data").value;
  const conteudo = document.getElementById("ata-conteudo").value.trim();

  if (!data_reuniao || !conteudo) {
    showToast("Preencha a data e o conteúdo da reunião.", "error");
    return;
  }

  const acoesForm = coletarAcoesFormulario();
  const btn = document.getElementById("btn-salvar-ata");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const { data: ataInserida, error: ataError } = await supabaseClient
      .from("atas")
      .insert({ data_reuniao, conteudo })
      .select()
      .single();
    if (ataError) throw ataError;

    if (acoesForm.length > 0) {
      const hoje = new Date().toISOString().slice(0, 10);
      const payloadAcoes = acoesForm.map((a) => ({
        ata_id: ataInserida.id,
        descricao: a.descricao,
        responsavel: a.responsavel,
        prazo: a.prazo,
        status: a.prazo < hoje ? "Atrasada" : "Em andamento",
        origem: "ATA",
      }));
      const { error: acoesError } = await supabaseClient.from("acoes").insert(payloadAcoes);
      if (acoesError) throw acoesError;
    }

    if (brigadistasAtivos.length > 0) {
      const payloadAssinaturas = brigadistasAtivos.map((b) => ({
        ata_id: ataInserida.id,
        brigadista_id: b.id,
        assinado: false,
      }));
      const { error: assError } = await supabaseClient.from("ata_assinaturas").insert(payloadAssinaturas);
      if (assError) throw assError;
    }

    showToast(
      acoesForm.length > 0
        ? `ATA registrada! ${acoesForm.length} ação(ões) enviada(s) ao Plano de Ação.`
        : "ATA registrada com sucesso!",
      "success"
    );

    document.getElementById("ata-data").value = "";
    document.getElementById("ata-conteudo").value = "";
    document.getElementById("acoes-container").innerHTML = "";
    atualizarEmptyAcoes();

    document.querySelector('.tab-btn[data-tab="historico"]').click();
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar ATA: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Salvar ATA";
  }
}

// ---------------- Histórico ----------------
async function carregarHistorico() {
  const container = document.getElementById("historico-lista");
  const empty = document.getElementById("historico-empty");

  if (!CONFIGURADO) {
    container.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  try {
    const { data: atas, error } = await supabaseClient
      .from("atas")
      .select("*")
      .order("data_reuniao", { ascending: false });
    if (error) throw error;

    if (!atas || atas.length === 0) {
      container.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    const { data: todasAcoes } = await supabaseClient.from("acoes").select("*").eq("origem", "ATA");

    container.innerHTML = "";
    atas.forEach((ata) => {
      const acoesDaAta = (todasAcoes || []).filter((a) => a.ata_id === ata.id);
      const card = document.createElement("div");
      card.className = "panel";
      card.style.marginBottom = "14px";
      card.innerHTML = `
        <div class="row justify-between">
          <div>
            <h3 style="margin:0 0 4px;">Reunião de ${formatarDataAta(ata.data_reuniao)}</h3>
            <p class="text-muted small" style="margin:0;">
              ${acoesDaAta.length} ação(ões) geradas ·
              ${ata.arquivo_assinado_url ? '<span class="badge badge-ok">ATA assinada anexada</span>' : '<span class="badge badge-warn">Aguardando anexo assinado</span>'}
            </p>
          </div>
          <div class="row">
            <button class="btn btn-outline btn-gerar-pdf" data-id="${ata.id}">📄 Gerar PDF</button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              📎 Anexar assinada
              <input type="file" accept="application/pdf,image/*" class="input-upload-assinada" data-id="${ata.id}" style="display:none;" />
            </label>
            ${ata.arquivo_assinado_url ? `<a href="${ata.arquivo_assinado_url}" target="_blank" class="btn btn-secondary">👁️ Ver assinada</a>` : ""}
            <button class="btn btn-secondary btn-excluir-ata" data-id="${ata.id}">🗑️</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll(".btn-gerar-pdf").forEach((btn) => {
      btn.addEventListener("click", () => gerarPdfAta(btn.dataset.id, atas, todasAcoes || []));
    });
    container.querySelectorAll(".input-upload-assinada").forEach((input) => {
      input.addEventListener("change", (e) => anexarAtaAssinada(e, input.dataset.id));
    });
    container.querySelectorAll(".btn-excluir-ata").forEach((btn) => {
      btn.addEventListener("click", () => excluirAta(btn.dataset.id));
    });
  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar histórico: " + err.message, "error");
  }
}

function formatarDataAta(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function anexarAtaAssinada(e, ataId) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    showToast("Enviando arquivo...");
    const url = await uploadArquivo(BUCKET_DOCUMENTOS, file, "atas/");
    const { error } = await supabaseClient.from("atas").update({ arquivo_assinado_url: url }).eq("id", ataId);
    if (error) throw error;
    showToast("ATA assinada anexada com sucesso!", "success");
    carregarHistorico();
  } catch (err) {
    showToast("Erro ao anexar: " + err.message, "error");
  }
}

async function excluirAta(ataId) {
  if (!confirm("Excluir esta ATA? As ações já geradas continuam no Plano de Ação, mas perdem o vínculo com esta ATA.")) return;
  try {
    const { error } = await supabaseClient.from("atas").delete().eq("id", ataId);
    if (error) throw error;
    showToast("ATA excluída.", "success");
    carregarHistorico();
  } catch (err) {
    showToast("Erro ao excluir: " + err.message, "error");
  }
}

// ---------------- Geração de PDF ----------------
function gerarPdfAta(ataId, atas, todasAcoes) {
  const ata = atas.find((a) => a.id === ataId);
  if (!ata) return;
  const acoesDaAta = todasAcoes.filter((a) => a.ata_id === ataId);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const marginX = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const corTabela = [31, 78, 121];
  let y = 20;

  doc.setTextColor(225, 29, 46);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ATA DA REUNIÃO DA BRIGADA BOXER", pageWidth / 2, y, { align: "center" });
  y += 9;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Data da reunião: " + formatarDataAta(ata.data_reuniao), pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Conteúdo da reunião:", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const linhasConteudo = doc.splitTextToSize(ata.conteudo || "-", contentWidth);
  doc.text(linhasConteudo, marginX, y, { maxWidth: contentWidth, align: "justify" });
  y += linhasConteudo.length * 5 + 8;

  if (y > 255) {
    doc.addPage();
    y = 18;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Ações geradas nesta reunião:", marginX, y);

  if (acoesDaAta.length > 0) {
    doc.autoTable({
      startY: y + 4,
      head: [["Descrição", "Responsável", "Prazo"]],
      body: acoesDaAta.map((a) => [a.descricao, a.responsavel, formatarDataAta(a.prazo)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: corTabela },
      margin: { left: marginX, right: marginX },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Nenhuma ação gerada nesta reunião.", marginX, y + 6);
    y += 16;
  }

  if (y > 245) {
    doc.addPage();
    y = 18;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Assinatura dos integrantes da Brigada:", marginX, y);

  doc.autoTable({
    startY: y + 4,
    head: [["Nome", "Cargo", "Assinatura"]],
    body: brigadistasAtivos.map((b) => [b.nome, b.cargo, ""]),
    styles: { fontSize: 9, minCellHeight: 10 },
    headStyles: { fillColor: corTabela },
    margin: { left: marginX, right: marginX },
  });

  doc.save(`ata-brigada-boxer-${ata.data_reuniao}.pdf`);
}

function escapeHtmlAta(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
