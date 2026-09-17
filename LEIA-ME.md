# BRIGADA BOXER

Sistema completo de gestão da brigada de incêndio: cadastro de brigadistas,
gestão de ATA, plano de ação, cronograma de inspeção de extintores e
hidrantes, e dashboard geral. Todas as 5 fases estão entregues.

O projeto já está publicado em:
- Supabase (banco de dados + storage de fotos/documentos) — projeto "BRIGADA BOXER"
- GitHub Pages — repositório `brigada-boxer`

## Como atualizar o site publicado

Sempre que eu (Claude) gerar novos arquivos ou alterações aqui nesta pasta
(`D:\PROGRAMAS CLAUDE\BRIGADA BOXER`), para refletir no site público:

1. Acesse o repositório no GitHub.
2. Clique em **Add file → Upload files**.
3. Arraste os arquivos atualizados desta pasta (mantendo a mesma estrutura de
   pastas: `css/`, `js/`, `sql/` e os `.html` na raiz).
4. Clique em **Commit changes**.
5. O GitHub Pages atualiza automaticamente em 1-2 minutos.

## Conexão com o Supabase

O arquivo `js/supabaseClient.js` já está configurado com a Project URL e a
chave anon do projeto Supabase "BRIGADA BOXER". Os buckets de Storage `fotos`
e `documentos` já foram criados como públicos, e o `sql/schema.sql` já foi
executado (todas as tabelas do sistema completo já existem no banco, com as
políticas de acesso público nas tabelas e no Storage).

> Nota técnica: marcar um bucket como "Public" no Supabase libera só a
> **leitura** dos arquivos. Para permitir o **upload** de fotos sem login, o
> `schema.sql` também cria políticas específicas na tabela `storage.objects`
> para os buckets `fotos` e `documentos`. Se um dia você recriar o projeto do
> zero, rode o `schema.sql` inteiro (inclui essa parte) — já testado e
> validado em produção.

> Aviso de segurança: como o sistema não usa senha (conforme pedido), qualquer
> pessoa com o link do site poderá ler e editar os dados. Isso é aceitável para
> uso interno da empresa, mas não compartilhe o link publicamente.

---

## O que já funciona (testado em produção ✅ / entregue ✔️)

- Menu principal com os 4 botões pedidos + acesso ao cadastro de brigadistas.
- Cadastro de brigadista com foto (upload testado e funcionando): nome, cargo,
  área, piso e função (todos os campos e listas exatamente como especificado).
- Quadro hierárquico automático: Coordenador no topo, Líderes de Área no meio,
  Socorristas/Combatentes na base.
- Lista de integrantes (foto, nome, cargo, função) com botão de exportar PDF.
- Editar e excluir brigadistas.
- Identidade visual: tema escuro moderno, logo Boxer (`assets/logo.svg`) e
  fonte Inter em todas as páginas.
- **Fase 2 — Gestão de ATA (✔️ entregue):** registro da data e do conteúdo da
  reunião, ações adicionadas dinamicamente (descrição, responsável, prazo) que
  caem automaticamente no Plano de Ação, geração de PDF (título "ATA DA
  REUNIÃO DA BRIGADA BOXER", conteúdo, ações e tabela de assinatura de todos
  os brigadistas ativos), histórico de ATAs consultável e campo de upload para
  anexar a ATA assinada digitalizada.

- **Fase 3 — Plano de Ação (✔️ entregue):** balões de indicadores (total, em
  andamento, atrasadas, concluídas), filtro por status, ordenação por prazo/
  status/responsável, busca por texto, inserção manual de ações, edição
  direta na tabela (descrição, responsável, prazo, data de conclusão), status
  recalculado automaticamente comparando o prazo com a data atual, e
  exportação em PDF.

- **Fase 4 — Extintores e Hidrantes (✔️ entregue):**
  - Extintores: cadastro (ID, tipo, tamanho, localização, foto, data da
    última recarga), vencimento calculado automaticamente (+1 ano), coluna
    "Recarregar até" (15 dias antes do vencimento) e badge de situação
    (Em dia / alerta a partir de 30 dias / Vencido).
  - Hidrantes: cadastro (localização, mangueira/esguicho/chave-unha, foto,
    data do teste hidrostático), vencimento +1 ano e mesmo alerta de 30 dias.
  - Inspeção mensal de ambos: checklist (conteúdo/mangueira, lacre/esguicho,
    integridade, armazenamento/chave-unha, sinalização), observações, 2
    brigadistas responsáveis, geração de PDF e upload da inspeção assinada.

- **Fase 5 — Dashboard (✔️ entregue):** indicadores gerais (brigadistas
  ativos, ações totais/atrasadas, extintores/hidrantes vencidos ou em
  alerta), barras de cumprimento (Plano de Ação, inspeção de extintores e de
  hidrantes no mês atual) e lista de alertas e pendências.

## Projeto completo — todas as 5 fases entregues ✔️
