// =========================================================================
// BRIGADA BOXER - Configuração de conexão com o Supabase
//
// PREENCHA os dois valores abaixo com os dados do SEU projeto Supabase:
//   1. Acesse supabase.com > seu projeto > Project Settings > API
//   2. Copie o "Project URL" e cole em SUPABASE_URL
//   3. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY
// =========================================================================

const SUPABASE_URL = "https://eseohihuodprgkbpajcj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZW9oaWh1b2RwcmdrYnBhamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODM3MDksImV4cCI6MjEwNTE1OTcwOX0.3A3rpINA2qtpoykMtpGIviP-JU7lImYfXVcAvi85FZM";

const CONFIGURADO = !SUPABASE_URL.startsWith("COLE_AQUI") && !SUPABASE_ANON_KEY.startsWith("COLE_AQUI");

let supabaseClient = null;
if (CONFIGURADO) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Nome dos buckets de Storage (criar no painel do Supabase, ambos como "Public")
const BUCKET_FOTOS = "fotos";
const BUCKET_DOCUMENTOS = "documentos";

function mostrarAvisoConfiguracao() {
  if (CONFIGURADO) return;
  const el = document.getElementById("config-warning");
  if (el) {
    el.style.display = "block";
    el.innerHTML =
      "⚠️ O Supabase ainda não foi configurado. Edite o arquivo <code>js/supabaseClient.js</code> " +
      "e cole a Project URL e a chave anon do seu projeto Supabase.";
  }
}

function showToast(message, type = "") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " " + type : "");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function uploadArquivo(bucket, file, pastaPrefixo = "") {
  if (!CONFIGURADO) throw new Error("Supabase não configurado.");
  const ext = file.name.split(".").pop();
  const nomeArquivo = `${pastaPrefixo}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(nomeArquivo, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(nomeArquivo);
  return data.publicUrl;
}
