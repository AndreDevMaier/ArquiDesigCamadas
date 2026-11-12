// Valores iguais aos enums do backend (StatusChamado, Prioridade, Perfil)
const STATUS = [
  ["ABERTO", "Aberto"],
  ["EM_ATENDIMENTO", "Em atendimento"],
  ["AGUARDANDO_CLIENTE", "Aguardando cliente"],
  ["FECHADO", "Fechado"]
];
const PRIORIDADES = [["BAIXA", "Baixa"], ["MEDIA", "Média"], ["ALTA", "Alta"], ["CRITICA", "Crítica"]];
const PERFIS = [["ADMIN", "Admin"], ["TECNICO", "Técnico"]];

// Espelha StatusChamado.podeIrPara() do backend
const TRANSICOES = {
  ABERTO: ["EM_ATENDIMENTO"],
  EM_ATENDIMENTO: ["AGUARDANDO_CLIENTE", "FECHADO"],
  AGUARDANDO_CLIENTE: ["EM_ATENDIMENTO", "FECHADO"],
  FECHADO: []
};

const ROTULOS = Object.fromEntries([...STATUS, ...PRIORIDADES, ...PERFIS]);
const PLURAL = { ABERTO: "Abertos", EM_ATENDIMENTO: "Em atendimento", AGUARDANDO_CLIENTE: "Aguardando cliente", FECHADO: "Fechados" };

// fonte: opções carregadas da API | obrigatorio: false permite vazio (enviado como null)
// soEdicao: campo que só aparece ao editar | transicoes: lista só os status permitidos
const ENTIDADES = {
  chamados: {
    pagina: "index.html", titulo: "Chamados", singular: "chamado", novo: "Novo chamado",
    url: "/chamados", lista: "/chamados?size=1000",
    colunas: [["id","ID"],["titulo","Título"],["clienteNome","Cliente"],["categoriaNome","Categoria"],
              ["tecnicoNome","Técnico"],["status","Status"],["prioridade","Prioridade"]],
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "text", obrigatorio: true },
      { nome: "descricao", rotulo: "Descrição", tipo: "textarea", obrigatorio: true },
      { nome: "clienteId", rotulo: "Cliente", tipo: "select", obrigatorio: true, fonte: { url: "/cliente", texto: "nome" } },
      { nome: "categoriaId", rotulo: "Categoria", tipo: "select", obrigatorio: true, fonte: { url: "/categorias", texto: "nome" } },
      { nome: "tecnicoId", rotulo: "Técnico (opcional)", tipo: "select", fonte: { url: "/tecnicos", texto: "nome" } },
      { nome: "prioridade", rotulo: "Prioridade", tipo: "select", obrigatorio: true, opcoes: PRIORIDADES },
      { nome: "status", rotulo: "Status", tipo: "select", obrigatorio: true, opcoes: STATUS, soEdicao: true, transicoes: true }
    ]
  },
  clientes: {
    pagina: "clientes.html", titulo: "Clientes", singular: "cliente", novo: "Novo cliente",
    url: "/cliente", lista: "/cliente",
    contarPor: "clienteId",
    colunas: [["id","ID"],["nome","Nome"],["email","E-mail"],["telefone","Telefone"],["qtdChamados","Chamados"]],
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
      { nome: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true },
      { nome: "telefone", rotulo: "Telefone (opcional)", tipo: "text" }
    ]
  },
  categorias: {
    pagina: "categorias.html", titulo: "Categorias", singular: "categoria", novo: "Nova categoria",
    url: "/categorias", lista: "/categorias",
    contarPor: "categoriaId",
    colunas: [["id","ID"],["nome","Nome"],["descricao","Descrição"],["qtdChamados","Chamados"]],
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
      { nome: "descricao", rotulo: "Descrição (opcional)", tipo: "text" }
    ]
  },
  tecnicos: {
    pagina: "tecnicos.html", titulo: "Técnicos", singular: "técnico", novo: "Novo técnico",
    url: "/tecnicos", lista: "/tecnicos",
    contarPor: "tecnicoId",
    colunas: [["id","ID"],["nome","Nome"],["email","E-mail"],["perfil","Perfil"],["qtdChamados","Chamados"]],
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
      { nome: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true },
      { nome: "perfil", rotulo: "Perfil", tipo: "select", obrigatorio: true, opcoes: PERFIS }
    ]
  },
  comentarios: {
    pagina: "comentarios.html", titulo: "Comentários", singular: "comentário", novo: "Novo comentário",
    somenteCriar: true,   // a API não tem listar/editar/excluir comentário
    colunas: [["id","ID"],["chamadoTitulo","Chamado"],["autor","Autor"],["texto","Texto"],["data","Data"]],
    campos: [
      { nome: "chamadoId", rotulo: "Chamado", tipo: "select", obrigatorio: true, fonte: { url: "/chamados?size=1000", texto: "titulo" } },
      { nome: "autor", rotulo: "Autor", tipo: "text", obrigatorio: true },
      { nome: "texto", rotulo: "Texto", tipo: "textarea", obrigatorio: true }
    ]
  }
};

const chave = document.body.dataset.entidade;
const cfg = ENTIDADES[chave];

let listaAtual = [];
let editandoId = null;
let entradas = {};

// ---------- API ----------
async function lerErro(resp) {
  try {
    const j = await resp.json();
    const base = j.erro || j.message || j.error || ("Erro " + resp.status);
    return (j.detalhes && j.detalhes.length) ? base + " (" + j.detalhes.join("; ") + ")" : base;
  } catch (e) {
    return "Erro " + resp.status;
  }
}

async function chamarApi(url, opcoes) {
  const resp = await fetch(url, opcoes);
  if (!resp.ok) throw new Error(await lerErro(resp));
  return resp.status === 204 ? null : resp.json();
}

async function listarApi(url) {
  const dados = await chamarApi(url);
  return Array.isArray(dados) ? dados : (dados.content || []);
}

function enviarJson(metodo, corpo) {
  return { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) };
}

async function obterLista() {
  if (chave === "comentarios") {
    const chamados = await listarApi("/chamados?size=1000");
    const detalhes = await Promise.all(chamados.map(c => chamarApi("/chamados/" + c.id)));
    return detalhes.flatMap(d => d.comentarios.map(c => ({
      ...c, chamadoId: d.chamado.id, chamadoTitulo: d.chamado.titulo
    })));
  }
  const lista = await listarApi(cfg.lista);
  if (cfg.contarPor) {   // quantos chamados cada registro tem
    const chamados = await listarApi("/chamados?size=1000");
    lista.forEach(i => { i.qtdChamados = chamados.filter(c => c[cfg.contarPor] === i.id).length; });
  }
  return lista;
}

// ---------- Menu ----------
const menu = document.getElementById("menu");
const marca = document.createElement("span");
marca.className = "marca";
marca.textContent = "Sistema de Chamados";
menu.appendChild(marca);

for (const [k, e] of Object.entries(ENTIDADES)) {
  const a = document.createElement("a");
  a.href = e.pagina;
  a.textContent = e.titulo;
  if (k === chave) a.className = "ativo";
  menu.appendChild(a);
}

// ---------- Cabeçalho da página ----------
const main = document.querySelector("main");
const h1 = document.getElementById("titulo");
h1.textContent = cfg.titulo;

const cabecalho = document.createElement("div");
cabecalho.className = "cabecalho";
const acoes = document.createElement("div");
acoes.className = "acoes";
const contador = document.createElement("span");
contador.className = "contador";
const btnNovo = document.createElement("button");
btnNovo.className = "btn btn-primario";
btnNovo.textContent = "+ " + cfg.novo;
acoes.appendChild(contador);
acoes.appendChild(btnNovo);

main.insertBefore(cabecalho, h1);
cabecalho.appendChild(h1);
cabecalho.appendChild(acoes);

// ---------- Busca / filtros ----------
const barra = document.createElement("div");
barra.className = "barra";
const inputBusca = document.createElement("input");
inputBusca.type = "search";
inputBusca.placeholder = "Buscar em " + cfg.titulo.toLowerCase() + "...";
barra.appendChild(inputBusca);

let filtroStatus = null;
let filtroPrioridade = null;

function criarFiltro(rotuloTodos, opcoes) {
  const s = document.createElement("select");
  const o0 = document.createElement("option");
  o0.value = "";
  o0.textContent = rotuloTodos;
  s.appendChild(o0);
  opcoes.forEach(([valor, texto]) => {
    const o = document.createElement("option");
    o.value = valor;
    o.textContent = texto;
    s.appendChild(o);
  });
  barra.appendChild(s);
  return s;
}

if (chave === "chamados") {
  filtroStatus = criarFiltro("Todos os status", STATUS);
  filtroPrioridade = criarFiltro("Todas as prioridades", PRIORIDADES);
}

// ---------- Tabela ----------
const tabela = document.querySelector("table");
const wrap = document.createElement("div");
wrap.className = "tabela-wrap";
tabela.parentNode.insertBefore(wrap, tabela);
wrap.appendChild(tabela);
wrap.parentNode.insertBefore(barra, wrap);

const trHead = document.createElement("tr");
cfg.colunas.forEach(([, rotulo]) => {
  const th = document.createElement("th");
  th.textContent = rotulo;
  trHead.appendChild(th);
});
if (!cfg.somenteCriar) {
  const thAcoes = document.createElement("th");
  thAcoes.className = "col-acoes";
  thAcoes.textContent = "Ações";
  trHead.appendChild(thAcoes);
}
document.querySelector("thead").appendChild(trHead);

// ---------- Formatação ----------
function formatarEnum(valor) {
  if (ROTULOS[valor]) return ROTULOS[valor];
  const texto = String(valor).replace(/_/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function textoDaCelula(campo, valor) {
  if (valor === undefined || valor === null) return "";
  if (campo === "data" || campo === "dataAbertura") return new Date(valor).toLocaleString("pt-BR");
  if (campo === "perfil") return formatarEnum(valor);
  return String(valor);
}

function criarCelula(campo, valor) {
  const td = document.createElement("td");
  if (valor === undefined || valor === null) return td;

  if (campo === "status" || campo === "prioridade") {
    const badge = document.createElement("span");
    badge.className = "badge " + String(valor).toLowerCase();
    badge.textContent = formatarEnum(valor);
    td.appendChild(badge);
  } else {
    td.textContent = textoDaCelula(campo, valor);
  }
  return td;
}

// ---------- Cards de resumo (só em chamados) ----------
let resumo = null;

function montarResumo(lista) {
  if (chave !== "chamados") return;
  if (resumo) resumo.remove();

  const contar = status => lista.filter(c => c.status === status).length;
  const itens = [["total", "Total", lista.length]];
  STATUS.forEach(([valor, rotulo]) => {
    itens.push([valor.toLowerCase(), PLURAL[valor], contar(valor)]);
  });

  resumo = document.createElement("section");
  resumo.className = "resumo";
  itens.forEach(([classe, rotulo, valor]) => {
    const card = document.createElement("div");
    card.className = "card-resumo " + classe;
    const r = document.createElement("div");
    r.className = "rotulo";
    r.textContent = rotulo;
    const n = document.createElement("div");
    n.className = "numero";
    n.textContent = valor;
    card.appendChild(r);
    card.appendChild(n);
    resumo.appendChild(card);
  });
  main.insertBefore(resumo, cabecalho);
}

// ---------- Renderização ----------
function aplicarFiltros(lista) {
  const termo = inputBusca.value.trim().toLowerCase();
  return lista.filter(item => {
    if (filtroStatus && filtroStatus.value && item.status !== filtroStatus.value) return false;
    if (filtroPrioridade && filtroPrioridade.value && item.prioridade !== filtroPrioridade.value) return false;
    if (!termo) return true;
    return cfg.colunas.some(([campo]) => {
      const valor = item[campo];
      if (valor === undefined || valor === null) return false;
      const texto = (campo === "status" || campo === "prioridade")
        ? formatarEnum(valor) + " " + valor
        : textoDaCelula(campo, valor);
      return texto.toLowerCase().includes(termo);
    });
  });
}

function renderizar() {
  const msg = document.getElementById("msg");
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  msg.textContent = "";

  const lista = aplicarFiltros(listaAtual);
  const total = listaAtual.length;
  contador.textContent = lista.length === total
    ? total + (total === 1 ? " registro" : " registros")
    : lista.length + " de " + total + " registros";

  if (lista.length === 0) {
    msg.textContent = "Nenhum registro encontrado.";
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement("tr");
    cfg.colunas.forEach(([campo]) => tr.appendChild(criarCelula(campo, item[campo])));

    if (!cfg.somenteCriar) {
      const td = document.createElement("td");
      td.className = "col-acoes";

      const btnEditar = document.createElement("button");
      btnEditar.className = "btn-acao";
      btnEditar.textContent = "Editar";
      // A API não permite alterar chamado fechado
      if (chave === "chamados" && item.status === "FECHADO") {
        btnEditar.disabled = true;
        btnEditar.title = "Chamado fechado não pode ser alterado";
      } else {
        btnEditar.onclick = () => abrirModal(item);
      }

      const btnExcluir = document.createElement("button");
      btnExcluir.className = "btn-acao excluir";
      btnExcluir.textContent = "Excluir";
      btnExcluir.onclick = () => excluir(item);

      if (chave === "chamados") {
        const btnDetalhes = document.createElement("button");
        btnDetalhes.className = "btn-acao";
        btnDetalhes.textContent = "Detalhes";
        btnDetalhes.onclick = () => abrirDetalhe(item.id);
        td.appendChild(btnDetalhes);
      }
      td.appendChild(btnEditar);
      td.appendChild(btnExcluir);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

async function desenhar() {
  const msg = document.getElementById("msg");
  try {
    listaAtual = await obterLista();
    montarResumo(listaAtual);
    renderizar();
  } catch (e) {
    msg.textContent = "Não foi possível carregar: " + e.message;
  }
}

// ---------- Excluir ----------
async function excluir(item) {
  const nome = item.titulo || item.nome || ("#" + item.id);
  if (item.qtdChamados > 0) {
    toast("Não é possível excluir \"" + nome + "\": há " + item.qtdChamados + " chamado(s) vinculado(s).", true);
    return;
  }
  if (!confirm("Excluir \"" + nome + "\"? Essa ação não pode ser desfeita.")) return;
  try {
    await chamarApi(cfg.url + "/" + item.id, { method: "DELETE" });
    toast("Excluído com sucesso.");
    desenhar();
  } catch (e) {
    toast("Não foi possível excluir: " + e.message, true);
  }
}

// ---------- Modal (cadastrar e editar) ----------
const fundo = document.createElement("div");
fundo.className = "fundo-modal";
const modal = document.createElement("div");
modal.className = "modal";
const tituloModal = document.createElement("h2");
const form = document.createElement("div");

const erro = document.createElement("p");
erro.style.cssText = "color:#b91c1c;font-size:13px;margin:0;min-height:16px;";

const rodape = document.createElement("div");
rodape.className = "rodape-modal";
const btnCancelar = document.createElement("button");
btnCancelar.className = "btn btn-suave";
btnCancelar.textContent = "Cancelar";
const btnSalvar = document.createElement("button");
btnSalvar.className = "btn btn-primario";
btnSalvar.textContent = "Salvar";
rodape.appendChild(btnCancelar);
rodape.appendChild(btnSalvar);

modal.appendChild(tituloModal);
modal.appendChild(form);
modal.appendChild(erro);
modal.appendChild(rodape);
fundo.appendChild(modal);
document.body.appendChild(fundo);

function campoVisivel(c, item) {
  return !(c.soEdicao && !item);
}

async function abrirModal(item) {
  editandoId = item ? item.id : null;
  tituloModal.textContent = item ? "Editar " + cfg.singular : cfg.novo;
  form.innerHTML = "";
  entradas = {};
  erro.textContent = "Carregando...";
  btnSalvar.disabled = true;
  fundo.classList.add("aberto");

  try {
    for (const c of cfg.campos) {
      if (!campoVisivel(c, item)) continue;

      const campo = document.createElement("div");
      campo.className = "campo";
      const label = document.createElement("label");
      label.textContent = c.rotulo;

      let entrada;
      if (c.tipo === "select") {
        entrada = document.createElement("select");
        let opcoes = c.opcoes;
        if (c.fonte) {
          const lista = await listarApi(c.fonte.url);
          opcoes = lista.map(x => [x.id, x[c.fonte.texto]]);
        }
        if (c.transicoes && item) {
          // só o status atual e os que o backend aceita a partir dele
          const permitidos = [item.status, ...(TRANSICOES[item.status] || [])];
          opcoes = opcoes.filter(([valor]) => permitidos.includes(valor));
        }
        if (!c.obrigatorio) {
          const o = document.createElement("option");
          o.value = "";
          o.textContent = "— Nenhum —";
          entrada.appendChild(o);
        }
        opcoes.forEach(([valor, texto]) => {
          const o = document.createElement("option");
          o.value = valor;
          o.textContent = texto;
          entrada.appendChild(o);
        });
        const atual = item ? item[c.nome] : null;
        if (atual !== null && atual !== undefined) entrada.value = atual;
        else if (!c.obrigatorio) entrada.value = "";
      } else if (c.tipo === "textarea") {
        entrada = document.createElement("textarea");
        entrada.value = item ? (item[c.nome] ?? "") : "";
      } else {
        entrada = document.createElement("input");
        entrada.type = c.tipo;
        entrada.value = item ? (item[c.nome] ?? "") : "";
      }

      entradas[c.nome] = entrada;
      campo.appendChild(label);
      campo.appendChild(entrada);
      form.appendChild(campo);
    }
    erro.textContent = "";
    btnSalvar.disabled = false;
    const primeiro = Object.values(entradas)[0];
    if (primeiro) primeiro.focus();
  } catch (e) {
    erro.textContent = "Não foi possível carregar o formulário: " + e.message;
  }
}

function fecharModal() {
  fundo.classList.remove("aberto");
}

async function salvar() {
  const dados = {};
  for (const c of cfg.campos) {
    if (!entradas[c.nome]) continue;   // campo não exibido (ex.: status ao criar)
    let valor = entradas[c.nome].value.trim();
    if (!valor) {
      if (c.obrigatorio) {
        erro.textContent = "Preencha o campo \"" + c.rotulo + "\".";
        entradas[c.nome].focus();
        return;
      }
      dados[c.nome] = null;
      continue;
    }
    if (c.tipo === "email" && !/^\S+@\S+\.\S+$/.test(valor)) {
      erro.textContent = "Informe um e-mail válido.";
      entradas[c.nome].focus();
      return;
    }
    if (c.fonte) valor = Number(valor);
    dados[c.nome] = valor;
  }

  try {
    if (chave === "comentarios") {
      const { chamadoId, ...corpo } = dados;
      await chamarApi("/chamados/" + chamadoId + "/comentarios", enviarJson("POST", corpo));
    } else if (editandoId) {
      await chamarApi(cfg.url + "/" + editandoId, enviarJson("PUT", dados));
    } else {
      await chamarApi(cfg.url, enviarJson("POST", dados));
    }
    fecharModal();
    toast("Salvo com sucesso.");
    desenhar();
  } catch (e) {
    erro.textContent = "Não foi possível salvar: " + e.message;
  }
}

// ---------- Aviso (toast) ----------
function toast(texto, ruim) {
  const t = document.createElement("div");
  t.className = "toast" + (ruim ? " ruim" : "");
  t.textContent = texto;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---------- Detalhe do chamado ----------
const fundoDet = document.createElement("div");
fundoDet.className = "fundo-modal";
const painel = document.createElement("div");
painel.className = "modal detalhe";
fundoDet.appendChild(painel);
document.body.appendChild(fundoDet);
fundoDet.addEventListener("click", e => { if (e.target === fundoDet) fundoDet.classList.remove("aberto"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") fundoDet.classList.remove("aberto"); });

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function selecao(opcoes, atual) {
  const s = document.createElement("select");
  opcoes.forEach(([v, t]) => { const o = el("option", "", t); o.value = v; s.appendChild(o); });
  if (atual !== null && atual !== undefined) s.value = atual;
  return s;
}

function badge(valor) {
  return el("span", "badge " + String(valor).toLowerCase(), formatarEnum(valor));
}

function dataBr(v) {
  return v ? new Date(v).toLocaleString("pt-BR") : "—";
}

async function agir(fn, msgOk, id) {
  try {
    await fn();
    toast(msgOk);
    await abrirDetalhe(id);
    desenhar();
  } catch (e) {
    toast(e.message, true);
  }
}

async function abrirDetalhe(id) {
  fundoDet.classList.add("aberto");
  try {
    const d = await chamarApi("/chamados/" + id);
    const c = d.chamado;
    painel.innerHTML = "";

    painel.appendChild(el("h2", "", c.titulo));
    const tags = el("div", "tags");
    tags.appendChild(badge(c.status));
    tags.appendChild(badge(c.prioridade));
    painel.appendChild(tags);
    painel.appendChild(el("p", "descricao", c.descricao));

    const info = el("dl", "info");
    [["Cliente", c.clienteNome], ["Categoria", c.categoriaNome],
     ["Técnico", c.tecnicoNome || "Não atribuído"],
     ["Abertura", dataBr(c.dataAbertura)], ["Fechamento", dataBr(c.dataFechamento)]]
      .forEach(([k, v]) => { info.appendChild(el("dt", "", k)); info.appendChild(el("dd", "", v)); });
    painel.appendChild(info);

    if (c.status !== "FECHADO") {
      const tecnicos = await listarApi("/tecnicos");

      const permitidos = [c.status, ...TRANSICOES[c.status]];
      const sStatus = selecao(STATUS.filter(([v]) => permitidos.includes(v)), c.status);
      const bStatus = el("button", "btn btn-primario", "Alterar status");
      bStatus.onclick = () => agir(() => chamarApi("/chamados/" + id + "/status",
        enviarJson("PATCH", { status: sStatus.value })), "Status alterado.", id);
      const l1 = el("div", "linha-acao");
      l1.appendChild(sStatus);
      l1.appendChild(bStatus);

      const sTec = selecao(tecnicos.map(t => [t.id, t.nome]), c.tecnicoId);
      const bTec = el("button", "btn btn-primario", "Atribuir técnico");
      if (!tecnicos.length) bTec.disabled = true;
      bTec.onclick = () => agir(() => chamarApi("/chamados/" + id + "/atribuir",
        enviarJson("PATCH", { tecnicoId: Number(sTec.value) })), "Técnico atribuído.", id);
      const l2 = el("div", "linha-acao");
      l2.appendChild(sTec);
      l2.appendChild(bTec);

      painel.appendChild(l1);
      painel.appendChild(l2);
    } else {
      painel.appendChild(el("p", "vazio", "Chamado fechado: status e técnico não podem mais ser alterados."));
    }

    painel.appendChild(el("h3", "", "Comentários (" + d.comentarios.length + ")"));
    if (!d.comentarios.length) painel.appendChild(el("p", "vazio", "Nenhum comentário ainda."));
    d.comentarios.forEach(m => {
      const caixa = el("div", "comentario");
      caixa.appendChild(el("strong", "", m.autor));
      caixa.appendChild(el("span", "data", dataBr(m.data)));
      caixa.appendChild(el("p", "", m.texto));
      painel.appendChild(caixa);
    });

    const autor = el("input");
    autor.placeholder = "Seu nome";
    const texto = el("textarea");
    texto.placeholder = "Escreva um comentário...";
    const bCom = el("button", "btn btn-primario", "Comentar");
    bCom.onclick = () => {
      if (!autor.value.trim() || !texto.value.trim()) { toast("Preencha o nome e o comentário.", true); return; }
      agir(() => chamarApi("/chamados/" + id + "/comentarios",
        enviarJson("POST", { autor: autor.value.trim(), texto: texto.value.trim() })), "Comentário adicionado.", id);
    };
    const bFechar = el("button", "btn btn-suave", "Fechar");
    bFechar.onclick = () => fundoDet.classList.remove("aberto");
    const rod = el("div", "rodape-modal");
    rod.appendChild(bFechar);
    rod.appendChild(bCom);
    const formCom = el("div", "novo-comentario");
    formCom.appendChild(autor);
    formCom.appendChild(texto);
    formCom.appendChild(rod);
    painel.appendChild(formCom);
  } catch (e) {
    painel.textContent = "Não foi possível carregar o chamado: " + e.message;
  }
}

btnNovo.onclick = () => abrirModal(null);
btnCancelar.onclick = fecharModal;
btnSalvar.onclick = salvar;
fundo.addEventListener("click", e => { if (e.target === fundo) fecharModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

inputBusca.addEventListener("input", renderizar);
if (filtroStatus) filtroStatus.addEventListener("change", renderizar);
if (filtroPrioridade) filtroPrioridade.addEventListener("change", renderizar);

desenhar();