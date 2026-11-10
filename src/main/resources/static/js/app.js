// Mude para true quando o backend estiver pronto
const USAR_API = false;

const DADOS_EXEMPLO = {
  chamados: [
    { id: 1, titulo: "Computador não liga", status: "ABERTO", prioridade: "ALTA" },
    { id: 2, titulo: "Erro ao acessar o sistema", status: "EM_ANDAMENTO", prioridade: "MEDIA" },
    { id: 3, titulo: "Solicitar novo mouse", status: "FECHADO", prioridade: "BAIXA" }
  ],
  clientes: [
    { id: 1, nome: "Maria Souza", email: "maria@email.com" },
    { id: 2, nome: "João Pereira", email: "joao@email.com" }
  ],
  categorias: [
    { id: 1, nome: "Hardware" },
    { id: 2, nome: "Software" },
    { id: 3, nome: "Rede" }
  ],
  tecnicos: [
    { id: 1, nome: "Carlos Lima", email: "carlos@empresa.com" },
    { id: 2, nome: "Ana Costa", email: "ana@empresa.com" }
  ],
  comentarios: [
    { id: 1, texto: "Verificando a fonte do computador.", chamadoId: 1 },
    { id: 2, texto: "Cliente reiniciou e o erro continua.", chamadoId: 2 }
  ]
};

const STATUS = [["ABERTO", "Aberto"], ["EM_ANDAMENTO", "Em andamento"], ["FECHADO", "Fechado"]];
const PRIORIDADES = [["ALTA", "Alta"], ["MEDIA", "Média"], ["BAIXA", "Baixa"]];

// campos: [nome, rótulo, tipo, opções]
const ENTIDADES = {
  chamados: {
    pagina: "index.html", titulo: "Chamados", singular: "chamado", url: "/chamados",
    colunas: [["id","ID"],["titulo","Título"],["status","Status"],["prioridade","Prioridade"]],
    campos: [["titulo","Título","text"],["status","Status","select",STATUS],["prioridade","Prioridade","select",PRIORIDADES]]
  },
  clientes: {
    pagina: "clientes.html", titulo: "Clientes", singular: "cliente", url: "/clientes",
    colunas: [["id","ID"],["nome","Nome"],["email","E-mail"]],
    campos: [["nome","Nome","text"],["email","E-mail","email"]]
  },
  categorias: {
    pagina: "categorias.html", titulo: "Categorias", singular: "categoria", url: "/categorias",
    colunas: [["id","ID"],["nome","Nome"]],
    campos: [["nome","Nome","text"]]
  },
  tecnicos: {
    pagina: "tecnicos.html", titulo: "Técnicos", singular: "técnico", url: "/tecnicos",
    colunas: [["id","ID"],["nome","Nome"],["email","E-mail"]],
    campos: [["nome","Nome","text"],["email","E-mail","email"]]
  },
  comentarios: {
    pagina: "comentarios.html", titulo: "Comentários", singular: "comentário", url: "/comentarios",
    colunas: [["id","ID"],["texto","Texto"],["chamadoId","Chamado"]],
    campos: [["texto","Texto","textarea"],["chamadoId","Nº do chamado","number"]]
  }
};

const chave = document.body.dataset.entidade;
const cfg = ENTIDADES[chave];

// ---------- Armazenamento (localStorage) ----------
const CHAVE_STORAGE = "chamados-dados";

function lerTudo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
    if (salvo) return salvo;
  } catch (e) { /* ignora */ }
  return JSON.parse(JSON.stringify(DADOS_EXEMPLO));
}

function salvarTudo(dados) {
  try { localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados)); } catch (e) { /* ignora */ }
}

let todos = lerTudo();

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
btnNovo.textContent = "+ Novo " + cfg.singular;

acoes.appendChild(contador);
if (!USAR_API) {
  const btnReset = document.createElement("button");
  btnReset.className = "btn-link";
  btnReset.textContent = "Restaurar exemplos";
  btnReset.onclick = () => {
    if (confirm("Voltar todos os dados para os exemplos?")) {
      todos = JSON.parse(JSON.stringify(DADOS_EXEMPLO));
      salvarTudo(todos);
      desenhar();
    }
  };
  acoes.appendChild(btnReset);
}
acoes.appendChild(btnNovo);

main.insertBefore(cabecalho, h1);
cabecalho.appendChild(h1);
cabecalho.appendChild(acoes);

const tabela = document.querySelector("table");
const wrap = document.createElement("div");
wrap.className = "tabela-wrap";
tabela.parentNode.insertBefore(wrap, tabela);
wrap.appendChild(tabela);

const trHead = document.createElement("tr");
cfg.colunas.forEach(([, rotulo]) => {
  const th = document.createElement("th");
  th.textContent = rotulo;
  trHead.appendChild(th);
});
document.querySelector("thead").appendChild(trHead);

// ---------- Formatação ----------
function formatarEnum(valor) {
  const texto = String(valor).replace(/_/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
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
    td.textContent = valor;
  }
  return td;
}

// ---------- Cards de resumo (só em chamados) ----------
let resumo = null;

function montarResumo(lista) {
  if (chave !== "chamados") return;

  if (resumo) resumo.remove();
  const contar = status => lista.filter(c => c.status === status).length;
  const itens = [
    ["total",        "Total",        lista.length],
    ["aberto",       "Abertos",      contar("ABERTO")],
    ["em_andamento", "Em andamento", contar("EM_ANDAMENTO")],
    ["fechado",      "Fechados",     contar("FECHADO")]
  ];

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

// ---------- Dados ----------
async function obterLista() {
  if (!USAR_API) return todos[chave];
  const resp = await fetch(cfg.url);
  if (!resp.ok) throw new Error("Erro " + resp.status);
  const dados = await resp.json();
  return Array.isArray(dados) ? dados : (dados.content || []);
}

async function desenhar() {
  const msg = document.getElementById("msg");
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  msg.textContent = "";
  try {
    const lista = await obterLista();
    contador.textContent = lista.length + (lista.length === 1 ? " registro" : " registros");
    montarResumo(lista);

    if (lista.length === 0) {
      msg.textContent = "Nenhum registro encontrado.";
      return;
    }
    lista.forEach(item => {
      const tr = document.createElement("tr");
      cfg.colunas.forEach(([campo]) => {
        const valor = campo.split(".").reduce((o, c) => o?.[c], item);
        tr.appendChild(criarCelula(campo, valor));
      });
      tbody.appendChild(tr);
    });
  } catch (e) {
    msg.textContent = "Não foi possível carregar: " + e.message;
  }
}

// ---------- Modal de cadastro ----------
const fundo = document.createElement("div");
fundo.className = "fundo-modal";

const modal = document.createElement("div");
modal.className = "modal";

const tituloModal = document.createElement("h2");
tituloModal.textContent = "Novo " + cfg.singular;

const form = document.createElement("div");

const entradas = {};
cfg.campos.forEach(([nome, rotulo, tipo, opcoes]) => {
  const campo = document.createElement("div");
  campo.className = "campo";

  const label = document.createElement("label");
  label.textContent = rotulo;

  let entrada;
  if (tipo === "select") {
    entrada = document.createElement("select");
    opcoes.forEach(([valor, texto]) => {
      const o = document.createElement("option");
      o.value = valor;
      o.textContent = texto;
      entrada.appendChild(o);
    });
  } else if (tipo === "textarea") {
    entrada = document.createElement("textarea");
  } else {
    entrada = document.createElement("input");
    entrada.type = tipo;
    if (tipo === "number") entrada.min = "1";
  }
  entradas[nome] = entrada;
  campo.appendChild(label);
  campo.appendChild(entrada);
  form.appendChild(campo);
});

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

function abrirModal() {
  cfg.campos.forEach(([nome, , tipo, opcoes]) => {
    entradas[nome].value = tipo === "select" ? opcoes[0][0] : "";
  });
  erro.textContent = "";
  fundo.classList.add("aberto");
  const primeira = entradas[cfg.campos[0][0]];
  primeira.focus();
}

function fecharModal() {
  fundo.classList.remove("aberto");
}

async function salvar() {
  const novo = {};
  for (const [nome, rotulo, tipo] of cfg.campos) {
    let valor = entradas[nome].value.trim();
    if (!valor) {
      erro.textContent = "Preencha o campo \"" + rotulo + "\".";
      entradas[nome].focus();
      return;
    }
    if (tipo === "email" && !/^\S+@\S+\.\S+$/.test(valor)) {
      erro.textContent = "Informe um e-mail válido.";
      entradas[nome].focus();
      return;
    }
    if (tipo === "number") valor = Number(valor);
    novo[nome] = valor;
  }

  try {
    if (USAR_API) {
      const resp = await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo)
      });
      if (!resp.ok) throw new Error("Erro " + resp.status);
    } else {
      const lista = todos[chave];
      novo.id = lista.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      lista.push(novo);
      salvarTudo(todos);
    }
    fecharModal();
    desenhar();
  } catch (e) {
    erro.textContent = "Não foi possível salvar: " + e.message;
  }
}

btnNovo.onclick = abrirModal;
btnCancelar.onclick = fecharModal;
btnSalvar.onclick = salvar;
fundo.addEventListener("click", e => { if (e.target === fundo) fecharModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

desenhar();