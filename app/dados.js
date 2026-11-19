/* AprendIA — conteúdo do questionário (3º ano)
   24 questões de múltipla escolha (A, B, C), 3 para cada um dos 8 conteúdos.
   As questões, o gabarito e as estratégias são ilustrativos. */

const SERIE = "3º ano";

const DISCIPLINAS = {
  lp: "Língua Portuguesa",
  mat: "Matemática"
};

const CONTEUDOS = [
  {
    id: "decodificacao",
    disciplina: "lp",
    nome: "Decodificação",
    estrategia: "Ler em voz alta todos os dias textos curtos, separando as palavras em sílabas e montando novas palavras com sílabas móveis."
  },
  {
    id: "localizar_informacao",
    disciplina: "lp",
    nome: "Localizar informação",
    estrategia: "Depois de cada leitura, responder perguntas de quem, onde, quando e quanto, sublinhando no texto o trecho que traz a resposta."
  },
  {
    id: "inferencia",
    disciplina: "lp",
    nome: "Inferência",
    estrategia: "Ler pequenas histórias e conversar sobre o que não está escrito: como o personagem se sente e por que ele agiu assim."
  },
  {
    id: "ortografia",
    disciplina: "lp",
    nome: "Ortografia",
    estrategia: "Fazer ditados curtos e jogos de completar palavras com as letras que mais confundem (s/z, ss/ç, ch/x), corrigindo junto com o aluno."
  },
  {
    id: "numeros",
    disciplina: "mat",
    nome: "Números",
    estrategia: "Usar o material dourado e o quadro de centenas, dezenas e unidades para comparar, ordenar e decompor números até 999."
  },
  {
    id: "operacoes",
    disciplina: "mat",
    nome: "Operações",
    estrategia: "Resolver situações-problema do dia a dia com adição, subtração e multiplicação, primeiro com objetos e desenhos e depois com a conta armada."
  },
  {
    id: "geometria",
    disciplina: "mat",
    nome: "Geometria",
    estrategia: "Procurar formas geométricas em objetos da sala, contar lados e vértices e montar figuras com palitos ou recortes de papel."
  },
  {
    id: "grandezas_medidas",
    disciplina: "mat",
    nome: "Grandezas e medidas",
    estrategia: "Medir objetos da sala com régua e fita métrica, ler as horas no relógio e brincar de mercadinho com cédulas e moedas de brinquedo."
  }
];

const TEXTO_FEIRA = "Ana foi à feira com a avó no sábado. Elas compraram três maçãs e um abacaxi.";

const QUESTOES = [
  // Decodificação
  { conteudo: "decodificacao", enunciado: "Quantas sílabas tem a palavra BORBOLETA?",
    alternativas: { A: "3", B: "4", C: "5" }, resposta: "B" },
  { conteudo: "decodificacao", enunciado: "Qual palavra começa com a mesma sílaba de MACACO?",
    alternativas: { A: "Mala", B: "Pato", C: "Casa" }, resposta: "A" },
  { conteudo: "decodificacao", enunciado: "Qual palavra se forma juntando as sílabas CA – VA – LO?",
    alternativas: { A: "Calovo", B: "Valoca", C: "Cavalo" }, resposta: "C" },

  // Localizar informação
  { conteudo: "localizar_informacao", texto: TEXTO_FEIRA, enunciado: "Com quem Ana foi à feira?",
    alternativas: { A: "Com a mãe", B: "Com a avó", C: "Com o irmão" }, resposta: "B" },
  { conteudo: "localizar_informacao", texto: TEXTO_FEIRA, enunciado: "Em que dia elas foram à feira?",
    alternativas: { A: "Domingo", B: "Segunda-feira", C: "Sábado" }, resposta: "C" },
  { conteudo: "localizar_informacao", texto: TEXTO_FEIRA, enunciado: "Quantas maçãs elas compraram?",
    alternativas: { A: "Duas", B: "Três", C: "Quatro" }, resposta: "B" },

  // Inferência
  { conteudo: "inferencia", texto: "Pedro pegou o guarda-chuva antes de sair de casa.",
    enunciado: "Por que Pedro pegou o guarda-chuva?",
    alternativas: { A: "Porque estava chovendo ou ia chover", B: "Porque estava muito calor", C: "Porque ia nadar" }, resposta: "A" },
  { conteudo: "inferencia", texto: "Lia bocejou, esfregou os olhos e deitou no sofá.",
    enunciado: "Como Lia estava se sentindo?",
    alternativas: { A: "Com fome", B: "Com sono", C: "Com raiva" }, resposta: "B" },
  { conteudo: "inferencia", texto: "O cachorro abanava o rabo quando viu o dono chegar.",
    enunciado: "Como o cachorro estava?",
    alternativas: { A: "Triste", B: "Feliz", C: "Assustado" }, resposta: "B" },

  // Ortografia
  { conteudo: "ortografia", enunciado: "Qual palavra está escrita corretamente?",
    alternativas: { A: "Caza", B: "Kasa", C: "Casa" }, resposta: "C" },
  { conteudo: "ortografia", enunciado: "Complete a frase: O ______ late no quintal.",
    alternativas: { A: "cachorro", B: "caxorro", C: "cachoro" }, resposta: "A" },
  { conteudo: "ortografia", enunciado: "Qual palavra está escrita corretamente?",
    alternativas: { A: "Pasarinho", B: "Passarinho", C: "Paçarinho" }, resposta: "B" },

  // Números
  { conteudo: "numeros", enunciado: "Qual número vem logo depois de 299?",
    alternativas: { A: "300", B: "290", C: "301" }, resposta: "A" },
  { conteudo: "numeros", enunciado: "Qual é o maior número?",
    alternativas: { A: "485", B: "458", C: "548" }, resposta: "C" },
  { conteudo: "numeros", enunciado: "No número 372, quanto vale o algarismo 7?",
    alternativas: { A: "700", B: "7", C: "70" }, resposta: "C" },

  // Operações
  { conteudo: "operacoes", enunciado: "Quanto é 25 + 18?",
    alternativas: { A: "33", B: "42", C: "43" }, resposta: "C" },
  { conteudo: "operacoes", enunciado: "Lucas tinha 50 figurinhas e deu 15 para a irmã. Com quantas ele ficou?",
    alternativas: { A: "35", B: "45", C: "65" }, resposta: "A" },
  { conteudo: "operacoes", enunciado: "Uma caixa tem 4 fileiras com 5 ovos em cada uma. Quantos ovos há na caixa?",
    alternativas: { A: "20", B: "9", C: "25" }, resposta: "A" },

  // Geometria
  { conteudo: "geometria", enunciado: "Qual figura tem 3 lados?",
    alternativas: { A: "Quadrado", B: "Círculo", C: "Triângulo" }, resposta: "C" },
  { conteudo: "geometria", enunciado: "Uma bola de futebol tem a forma parecida com qual figura?",
    alternativas: { A: "Esfera", B: "Cubo", C: "Cilindro" }, resposta: "A" },
  { conteudo: "geometria", enunciado: "Quantos lados tem um retângulo?",
    alternativas: { A: "3", B: "5", C: "4" }, resposta: "C" },

  // Grandezas e medidas
  { conteudo: "grandezas_medidas", enunciado: "Qual instrumento usamos para medir o comprimento de uma mesa?",
    alternativas: { A: "Relógio", B: "Régua ou fita métrica", C: "Balança" }, resposta: "B" },
  { conteudo: "grandezas_medidas", enunciado: "Quantos minutos tem uma hora?",
    alternativas: { A: "60", B: "30", C: "100" }, resposta: "A" },
  { conteudo: "grandezas_medidas", enunciado: "Júlia tinha R$ 2,00 e ganhou R$ 3,00. Quanto ela tem agora?",
    alternativas: { A: "R$ 1,00", B: "R$ 5,00", C: "R$ 6,00" }, resposta: "B" }
];

/* Regras do diagnóstico (mesma lógica do AprendIA, por acertos)
   - situação do conteúdo: 3 acertos = sem lacuna; 2 = a confirmar pelo professor; 0 ou 1 = lacuna
   - nível da disciplina: 0 lacunas = adequado; 1 ou 2 = em desenvolvimento; 3 ou 4 = abaixo do esperado */
const SITUACOES = {
  sem_lacuna: "Sem lacuna",
  a_confirmar: "A confirmar pelo professor",
  lacuna: "Lacuna"
};

const NIVEIS = {
  adequado: { nome: "Adequado", orientacao: "Manter as atividades da série e propor desafios." },
  desenvolvimento: { nome: "Em desenvolvimento", orientacao: "Reforçar os conteúdos indicados nas próximas semanas." },
  abaixo: { nome: "Abaixo do esperado", orientacao: "Planejar reforço prioritário e acompanhamento próximo." }
};
