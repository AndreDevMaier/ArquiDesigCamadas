// Mude para true quando o backend estiver pronto
const USAR_API = false;

const DADOS = {
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

const ENTIDADES = {
  chamados:    { pagina: "index.html",       titulo: "Chamados",    url: "/chamados",
                 colunas: [["id","ID"],["titulo","Título"],["status","Status"],["prioridade","Prioridade"]] },
  clientes:    { pagina: "clientes.html",    titulo: "Clientes",    url: "/clientes",
                 colunas: [["id","ID"],["nome","Nome"],["email","E-mail"]] },
  categorias:  { pagina: "categorias.html",  titulo: "Categorias",  url: "/categorias",
                 colunas: [["id","ID"],["nome","Nome"]] },
  tecnicos:    { pagina: "tecnicos.html",    titulo: "Técnicos",    url: "/tecnicos",
                 colunas: [["id","ID"],["nome","Nome"],["email","E-mail"]] },
  comentarios: { pagina: "comentarios.html", titulo: "Comentários", url: "/comentarios",
                 colunas: [["id","ID"],["texto","Texto"],["chamadoId","Chamado"]] }
};

const chave = document.body.dataset.entidade;
const cfg = ENTIDADES[chave];

// Menu
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

// Cabeçalho da página (título + contador) e tabela dentro de um cartão
const main = document.querySelector("main");
const h1 = document.getElementById("titulo");
h1.textContent = cfg.titulo;

const cabecalho = document.createElement("div");
cabecalho.className = "cabecalho";
const contador = document.createElement("span");
contador.className = "contador";
main.insertBefore(cabecalho, h1);
cabecalho.appendChild(h1);
cabecalho.appendChild(contador);

const tabela = document.querySelector("table");
const wrap = document.createElement("div");
wrap.className = "tabela-wrap";
tabela.parentNode.insertBefore(wrap, tabela);
wrap.appendChild(tabela);

// Cabeçalho da tabela
const trHead = document.createElement("tr");
cfg.colunas.forEach(([, rotulo]) => {
  const th = document.createElement("th");
  th.textContent = rotulo;
  trHead.appendChild(th);
});
document.querySelector("thead").appendChild(trHead);

// Formatação de valores
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

// Dados
async function obterLista() {
  if (!USAR_API) return DADOS[chave];
  const resp = await fetch(cfg.url);
  if (!resp.ok) throw new Error("Erro " + resp.status);
  const dados = await resp.json();
  return Array.isArray(dados) ? dados : (dados.content || []);
}

async function carregar() {
  const msg = document.getElementById("msg");
  const tbody = document.querySelector("tbody");
  try {
    const lista = await obterLista();
    contador.textContent = lista.length + (lista.length === 1 ? " registro" : " registros");

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
carregar();