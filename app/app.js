/* AprendIA — fluxo da aplicação: identificação, questionário, correção e diagnóstico */

const estado = {
  aluno: "",
  turma: "",
  atual: 0,
  respostas: new Array(QUESTOES.length).fill(null)
};

const $ = (id) => document.getElementById(id);

/* ---------- navegação entre telas ---------- */
function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- tela 1: identificação ---------- */
$("form-inicio").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nome = $("campo-nome").value.trim();
  const turma = $("campo-turma").value.trim();

  if (!nome || !turma) {
    $("erro-inicio").textContent = "Preencha o nome do aluno e a turma para começar.";
    $("erro-inicio").hidden = false;
    return;
  }

  $("erro-inicio").hidden = true;
  estado.aluno = nome;
  estado.turma = turma;
  estado.atual = 0;
  estado.respostas.fill(null);
  mostrarQuestao();
  mostrarTela("tela-questionario");
});

/* ---------- tela 2: questionário ---------- */
function conteudoDe(id) {
  return CONTEUDOS.find((c) => c.id === id);
}

function mostrarQuestao() {
  const q = QUESTOES[estado.atual];
  const conteudo = conteudoDe(q.conteudo);
  const total = QUESTOES.length;

  $("contador").textContent = `Questão ${estado.atual + 1} de ${total} · ${conteudo.nome}`;
  $("barra-progresso").style.width = `${(estado.atual / total) * 100}%`;

  const etiqueta = $("disciplina-questao");
  etiqueta.textContent = DISCIPLINAS[conteudo.disciplina];
  etiqueta.className = `etiqueta etiqueta-${conteudo.disciplina}`;

  $("texto-apoio").hidden = !q.texto;
  $("texto-apoio").textContent = q.texto || "";
  $("enunciado").textContent = q.enunciado;

  const caixa = $("alternativas");
  caixa.innerHTML = "";
  Object.entries(q.alternativas).forEach(([letra, texto]) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "alternativa";
    botao.setAttribute("role", "radio");
    botao.setAttribute("aria-checked", estado.respostas[estado.atual] === letra);
    if (estado.respostas[estado.atual] === letra) botao.classList.add("selecionada");

    const marca = document.createElement("span");
    marca.className = "letra";
    marca.textContent = letra;
    const rotulo = document.createElement("span");
    rotulo.textContent = texto;
    botao.append(marca, rotulo);

    botao.addEventListener("click", () => escolher(letra));
    caixa.appendChild(botao);
  });

  $("botao-voltar").disabled = estado.atual === 0;
  $("botao-avancar").disabled = estado.respostas[estado.atual] === null;
  $("botao-avancar").textContent = estado.atual === total - 1 ? "Ver resultado" : "Próxima";
}

function escolher(letra) {
  estado.respostas[estado.atual] = letra;
  mostrarQuestao();
}

$("botao-voltar").addEventListener("click", () => {
  if (estado.atual > 0) {
    estado.atual--;
    mostrarQuestao();
  }
});

$("botao-avancar").addEventListener("click", () => {
  if (estado.respostas[estado.atual] === null) return;
  if (estado.atual < QUESTOES.length - 1) {
    estado.atual++;
    mostrarQuestao();
  } else {
    mostrarResultado(diagnosticar());
    mostrarTela("tela-resultado");
  }
});

/* teclado: A, B ou C escolhe; Enter avança */
document.addEventListener("keydown", (evento) => {
  if (!$("tela-questionario").classList.contains("ativa")) return;
  const tecla = evento.key.toUpperCase();
  if (["A", "B", "C"].includes(tecla)) escolher(tecla);
  if (evento.key === "Enter" && !$("botao-avancar").disabled) $("botao-avancar").click();
});

/* ---------- correção e diagnóstico ---------- */
function situacaoPorAcertos(acertos) {
  if (acertos === 3) return "sem_lacuna";
  if (acertos === 2) return "a_confirmar";
  return "lacuna";
}

function nivelPorLacunas(lacunas) {
  if (lacunas === 0) return "adequado";
  if (lacunas <= 2) return "desenvolvimento";
  return "abaixo";
}

function diagnosticar() {
  const conteudos = CONTEUDOS.map((c) => {
    const acertos = QUESTOES.reduce(
      (soma, q, i) => soma + (q.conteudo === c.id && estado.respostas[i] === q.resposta ? 1 : 0), 0);
    return { ...c, acertos, situacao: situacaoPorAcertos(acertos) };
  });

  const niveis = Object.keys(DISCIPLINAS).map((disciplina) => {
    const daDisciplina = conteudos.filter((c) => c.disciplina === disciplina);
    const lacunas = daDisciplina.filter((c) => c.situacao === "lacuna").length;
    const aConfirmar = daDisciplina.filter((c) => c.situacao === "a_confirmar").length;
    return { disciplina, lacunas, aConfirmar, nivel: nivelPorLacunas(lacunas) };
  });

  /* reforço: lacunas primeiro, depois "a confirmar"; dentro de cada grupo, menos acertos primeiro */
  const peso = { lacuna: 0, a_confirmar: 1 };
  const reforco = conteudos
    .filter((c) => c.situacao !== "sem_lacuna")
    .sort((a, b) => peso[a.situacao] - peso[b.situacao] || a.acertos - b.acertos);

  return { conteudos, niveis, reforco };
}

/* ---------- tela 3: resultado ---------- */
function mostrarResultado({ conteudos, niveis, reforco }) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  $("identificacao").textContent = `${estado.aluno} · Turma ${estado.turma} · ${SERIE} · ${hoje}`;

  $("niveis").innerHTML = "";
  niveis.forEach((n) => {
    const cartao = document.createElement("div");
    cartao.className = `nivel ${n.nivel}`;
    cartao.innerHTML = `
      <p class="nivel-disciplina"></p>
      <p class="nivel-valor"></p>
      <p class="nivel-detalhe"></p>`;
    cartao.querySelector(".nivel-disciplina").textContent = DISCIPLINAS[n.disciplina];
    cartao.querySelector(".nivel-valor").textContent = NIVEIS[n.nivel].nome;
    const detalhe = `${n.lacunas} lacuna(s)` + (n.aConfirmar ? ` · ${n.aConfirmar} a confirmar` : "");
    cartao.querySelector(".nivel-detalhe").textContent = `${detalhe}. ${NIVEIS[n.nivel].orientacao}`;
    $("niveis").appendChild(cartao);
  });

  $("lista-conteudos").innerHTML = "";
  conteudos.forEach((c) => {
    const linha = document.createElement("div");
    linha.className = "conteudo";
    linha.innerHTML = `
      <span class="conteudo-nome"></span>
      <span class="situacao ${c.situacao}"></span>
      <span class="conteudo-acertos"></span>`;
    linha.querySelector(".conteudo-nome").textContent = c.nome;
    linha.querySelector(".situacao").textContent = SITUACOES[c.situacao];
    linha.querySelector(".conteudo-acertos").textContent = `${DISCIPLINAS[c.disciplina]} · ${c.acertos} de 3 acertos`;
    $("lista-conteudos").appendChild(linha);
  });

  const lista = $("lista-reforco");
  lista.innerHTML = "";
  if (reforco.length === 0) {
    const item = document.createElement("p");
    item.className = "sem-reforco";
    item.textContent = "Nenhum conteúdo precisa de reforço. Parabéns!";
    lista.appendChild(item);
  } else {
    reforco.forEach((c) => {
      const item = document.createElement("li");
      item.innerHTML = "<strong></strong><p></p>";
      item.querySelector("strong").textContent = `${c.nome} — ${SITUACOES[c.situacao]}`;
      item.querySelector("p").textContent = c.estrategia;
      lista.appendChild(item);
    });
  }
}

$("botao-imprimir").addEventListener("click", () => window.print());

$("botao-novo").addEventListener("click", () => {
  $("form-inicio").reset();
  mostrarTela("tela-inicio");
  $("campo-nome").focus();
});
