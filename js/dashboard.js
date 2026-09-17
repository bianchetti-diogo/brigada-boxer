// =========================================================================
// BRIGADA BOXER - Dashboard Geral
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  mostrarAvisoConfiguracao();
  carregarDashboard();
});

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function diasEntreDash(dataFutura) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dataFutura + "T00:00:00");
  return Math.round((alvo - hoje) / 86400000);
}

function statusEfetivoAcao(a) {
  if (a.data_conclusao) return "Concluída";
  return a.prazo < hojeISO() ? "Atrasada" : "Em andamento";
}

function formatarDataDash(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function carregarDashboard() {
  if (!CONFIGURADO) {
    return;
  }

  try {
    const [brigadistasRes, acoesRes, extintoresRes, hidrantesRes, inspExtRes, inspHidRes] = await Promise.all([
      supabaseClient.from("brigadistas").select("*").eq("ativo", true),
      supabaseClient.from("acoes").select("*"),
      supabaseClient.from("extintores").select("*").eq("ativo", true),
      supabaseClient.from("hidrantes").select("*").eq("ativo", true),
      supabaseClient.from("inspecoes_extintor").select("extintor_id, data_inspecao"),
      supabaseClient.from("inspecoes_hidrante").select("hidrante_id, data_inspecao"),
    ]);

    const brigadistas = brigadistasRes.data || [];
    const acoes = acoesRes.data || [];
    const extintores = extintoresRes.data || [];
    const hidrantes = hidrantesRes.data || [];
    const inspecoesExt = inspExtRes.data || [];
    const inspecoesHid = inspHidRes.data || [];

    // ---------------- Indicadores ----------------
    const acoesComStatus = acoes.map((a) => ({ ...a, statusEfetivo: statusEfetivoAcao(a) }));
    const totalAcoes = acoesComStatus.length;
    const acoesAtrasadas = acoesComStatus.filter((a) => a.statusEfetivo === "Atrasada");
    const acoesConcluidas = acoesComStatus.filter((a) => a.statusEfetivo === "Concluída");

    const extintoresAlerta = extintores.filter((e) => diasEntreDash(e.data_vencimento) <= 30);
    const hidrantesAlerta = hidrantes.filter((h) => diasEntreDash(h.data_vencimento) <= 30);

    document.getElementById("dash-brigadistas").textContent = brigadistas.length;
    document.getElementById("dash-acoes-total").textContent = totalAcoes;
    document.getElementById("dash-acoes-atrasadas").textContent = acoesAtrasadas.length;
    document.getElementById("dash-extintores-alerta").textContent = extintoresAlerta.length;
    document.getElementById("dash-hidrantes-alerta").textContent = hidrantesAlerta.length;

    // ---------------- Cumprimento do Plano de Ação ----------------
    const pctPlano = totalAcoes > 0 ? Math.round((acoesConcluidas.length / totalAcoes) * 100) : 0;
    document.getElementById("pct-plano").textContent = pctPlano + "%";
    document.getElementById("bar-plano").style.width = pctPlano + "%";

    // ---------------- Cumprimento das inspeções do mês ----------------
    const agora = new Date();
    const prefixoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    const extintoresInspecionadosEsteMes = new Set(
      inspecoesExt.filter((i) => (i.data_inspecao || "").startsWith(prefixoMes)).map((i) => i.extintor_id)
    );
    const hidrantesInspecionadosEsteMes = new Set(
      inspecoesHid.filter((i) => (i.data_inspecao || "").startsWith(prefixoMes)).map((i) => i.hidrante_id)
    );

    const pctExt = extintores.length > 0 ? Math.round((extintoresInspecionadosEsteMes.size / extintores.length) * 100) : 0;
    const pctHid = hidrantes.length > 0 ? Math.round((hidrantesInspecionadosEsteMes.size / hidrantes.length) * 100) : 0;

    document.getElementById("pct-ext").textContent = pctExt + "%";
    document.getElementById("bar-ext").style.width = pctExt + "%";
    document.getElementById("pct-hid").textContent = pctHid + "%";
    document.getElementById("bar-hid").style.width = pctHid + "%";

    // ---------------- Alertas ----------------
    const alertas = [];

    acoesAtrasadas.forEach((a) => {
      alertas.push({
        titulo: "Ação atrasada: " + a.descricao,
        sub: `Responsável: ${a.responsavel} · Prazo: ${formatarDataDash(a.prazo)}`,
        badge: '<span class="badge badge-danger">Ação</span>',
      });
    });

    extintoresAlerta.forEach((e) => {
      const dias = diasEntreDash(e.data_vencimento);
      const sub = dias < 0 ? `Vencido há ${Math.abs(dias)} dia(s)` : `Vence em ${dias} dia(s)`;
      alertas.push({
        titulo: `Extintor ${e.identificador} - ${e.localizacao}`,
        sub,
        badge: dias < 0 ? '<span class="badge badge-danger">Vencido</span>' : '<span class="badge badge-warn">Extintor</span>',
      });
    });

    hidrantesAlerta.forEach((h) => {
      const dias = diasEntreDash(h.data_vencimento);
      const sub = dias < 0 ? `Vencido há ${Math.abs(dias)} dia(s)` : `Vence em ${dias} dia(s)`;
      alertas.push({
        titulo: `Hidrante ${h.localizacao}`,
        sub,
        badge: dias < 0 ? '<span class="badge badge-danger">Vencido</span>' : '<span class="badge badge-warn">Hidrante</span>',
      });
    });

    renderAlertas(alertas);
  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar dashboard: " + err.message, "error");
  }
}

function renderAlertas(alertas) {
  const container = document.getElementById("dash-alertas-lista");
  const empty = document.getElementById("dash-alertas-empty");
  container.innerHTML = "";

  if (alertas.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  alertas.forEach((a) => {
    const div = document.createElement("div");
    div.className = "alert-item";
    div.innerHTML = `
      <div>
        <div class="titulo">${escapeHtmlDash(a.titulo)}</div>
        <div class="sub">${escapeHtmlDash(a.sub)}</div>
      </div>
      ${a.badge}
    `;
    container.appendChild(div);
  });
}

function escapeHtmlDash(str) {
  if (str == null) return "";
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
