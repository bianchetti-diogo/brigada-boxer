# BRIGADA BOXER — Fase 1 (Cadastro de Brigadistas)

Esta é a primeira fase do sistema. Já está pronto: Menu principal, Cadastro de
Brigadistas (com foto), Quadro Hierárquico e Lista de Integrantes com exportação
em PDF. Os outros botões do menu (ATA, Plano de Ação, Extintor, Hidrante,
Dashboard) estão como "em construção" — serão preenchidos nas próximas fases.

Para o site funcionar, você precisa de duas coisas gratuitas: um projeto no
**Supabase** (banco de dados + fotos) e um repositório no **GitHub** (hospedagem
do site). Siga o passo a passo abaixo, na ordem.

---

## PARTE 1 — Criar o projeto no Supabase

1. Acesse **https://supabase.com** e clique em **Start your project** / **Sign up**.
2. Crie a conta (pode ser com o e-mail da empresa ou com login do GitHub).
3. Clique em **New project**.
   - Escolha um nome, por exemplo `brigada-boxer`.
   - Crie uma senha de banco (guarde-a, mas ela **não** será usada no site).
   - Escolha a região mais próxima (ex: São Paulo/`sa-east-1`, se disponível).
   - Clique em **Create new project** e aguarde alguns minutos.
4. Quando o projeto abrir, vá em **SQL Editor** (menu lateral) → **New query**.
5. Abra o arquivo `sql/schema.sql` (está na pasta que eu gerei), copie **todo o
   conteúdo** e cole no editor do Supabase.
6. Clique em **Run**. Isso cria todas as tabelas do sistema (brigadistas, atas,
   ações, extintores, hidrantes, inspeções) de uma vez só — já preparado para as
   próximas fases.
7. Vá em **Storage** (menu lateral) → **Create a new bucket**:
   - Crie um bucket chamado `fotos` e marque como **Public bucket**.
   - Crie um segundo bucket chamado `documentos` e marque também como **Public bucket**
     (vamos usar nas próximas fases, para PDFs assinados anexados).
8. Vá em **Project Settings** (ícone de engrenagem) → **API**.
   - Copie o valor de **Project URL**.
   - Copie o valor de **anon public** (chave pública).

## PARTE 2 — Conectar o site ao Supabase

1. Abra o arquivo `js/supabaseClient.js` (dentro da pasta do site).
2. Substitua:
   ```js
   const SUPABASE_URL = "COLE_AQUI_A_SUA_PROJECT_URL";
   const SUPABASE_ANON_KEY = "COLE_AQUI_A_SUA_ANON_KEY";
   ```
   pelos valores que você copiou no passo anterior.
3. Salve o arquivo.

> Aviso de segurança: como o sistema não usa senha (conforme pedido), qualquer
> pessoa com o link do site poderá ler e editar os dados. Isso é aceitável para
> uso interno da empresa, mas não compartilhe o link publicamente.

## PARTE 3 — Publicar no GitHub Pages

1. Acesse **https://github.com** e crie uma conta, se ainda não tiver.
2. Clique no **+** no canto superior direito → **New repository**.
   - Nome sugerido: `brigada-boxer`.
   - Marque como **Public** (necessário para o GitHub Pages gratuito).
   - Clique em **Create repository**.
3. Na página do repositório recém-criado, clique em **uploading an existing file**
   (ou **Add file → Upload files**).
4. Arraste **todos os arquivos e pastas** que eu gerei (index.html, brigadistas.html,
   ata.html, plano-acao.html, extintores.html, hidrantes.html, dashboard.html,
   as pastas `css/`, `js/` e `sql/`) para a área de upload.
5. Clique em **Commit changes**.
6. Vá em **Settings** (do repositório) → **Pages** (menu lateral).
7. Em **Branch**, selecione `main` e a pasta `/ (root)`, depois **Save**.
8. Aguarde 1-2 minutos. O GitHub vai mostrar o link do site, algo como:
   `https://SEU-USUARIO.github.io/brigada-boxer/`

Pronto — esse link é o endereço da ferramenta. Qualquer atualização futura
(novas fases) será feita subindo os arquivos atualizados no mesmo repositório
(o GitHub Pages atualiza sozinho a cada novo upload).

---

## O que já funciona nesta Fase 1

- Menu principal com os 4 botões pedidos + acesso ao cadastro de brigadistas.
- Cadastro de brigadista: foto, nome, cargo, área, piso e função (todos os
  campos e listas exatamente como especificado).
- Quadro hierárquico automático: Coordenador no topo, Líderes de Área no meio,
  Socorristas/Combatentes na base.
- Lista de integrantes (foto, nome, cargo, função) com botão de exportar PDF.
- Editar e excluir brigadistas.

## O que vem nas próximas fases

- **Fase 2:** Gestão de ATA (registro de reunião, ações, geração de PDF,
  vínculo com assinaturas dos brigadistas, histórico e upload da ATA assinada).
- **Fase 3:** Plano de Ação (indicadores, filtros, status automático por prazo,
  exportação em PDF).
- **Fase 4:** Cadastro e cronograma de inspeção de Extintores e Hidrantes
  (alertas de vencimento, inspeção mensal com 2 assinaturas, PDF, upload).
- **Fase 5:** Dashboard geral consolidado.

Quando você tiver o Supabase e o GitHub Pages configurados (ou me passar a
Project URL/anon key), me avise que seguimos para a Fase 2.
