const supabaseUrl = 'https://lzcrcjzbvzisvmctsvyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Y3Jjanpidnppc3ZtY3RzdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjQ2ODAsImV4cCI6MjA1MjMwMDY4MH0.sPitOHsVyC86QtjkSkp0FCLs061V11Snmw7IgGFtxHQ'; // Insira sua chave de API
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas não encontrado na página!');
    return;
  }

  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 400;

  const urlParams = new URLSearchParams(window.location.search);
  const jogoId = urlParams.get('jogo_id');

  let personagem = { x: 100, y: 350, size: 30, emoji: '❤️', pontos: 0 };
  let perguntas = [];
  let perguntaAtual = 0;
  let progresso = 0;

  const somAcerto = new Audio('acerto.mp3');
  const somErro = new Audio('erro.mp3');

  // GSAP movimentação contínua
  function iniciarMovimentoContinuo() {
    gsap.to(personagem, {
      x: canvas.width - 150,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
      onUpdate: desenharCenario,
    });
  }

  // Função para carregar perguntas do Supabase
  async function carregarPerguntas() {
    if (!jogoId) {
      alert('ID do jogo não encontrado na URL!');
      return;
    }

    const { data, error } = await supabase
      .from('perguntas')
      .select('*')
      .eq('jogo_id', jogoId);

    if (error) {
      alert('Erro ao carregar perguntas: ' + error.message);
      return;
    }

    perguntas = data;
    exibirPergunta();
  }

  // Função para desenhar o personagem
  function desenharPersonagem() {
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.arc(personagem.x, personagem.y, personagem.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // Função para desenhar o cenário
  function desenharCenario() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(0, 360, canvas.width, 40); // Caminho

    desenharPersonagem();

    // Desenhar a barra de progresso
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(10, 10, progresso * 7.8, 20);
    ctx.strokeStyle = '#ffb6c1';
    ctx.strokeRect(10, 10, 780, 20);

    // Exibir pontuação
    ctx.fillStyle = '#333';
    ctx.font = '18px Arial';
    ctx.fillText(`Pontuação: ${personagem.pontos}`, 650, 50);
  }

  // Função para mover o personagem para a resposta
  function moverParaResposta(opcao) {
    const destinoX = opcao === 'correta' ? canvas.width - 150 : 50;
    gsap.to(personagem, {
      x: destinoX,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => verificarResposta(opcao === 'correta'),
    });
  }

  // Função para verificar resposta
  function verificarResposta(acertou) {
    if (acertou) {
      somAcerto.play();
      personagem.pontos++;
      progresso = ((perguntaAtual + 1) / perguntas.length) * 100;
      perguntaAtual++;
      exibirPergunta();
    } else {
      somErro.play();
      alert('Resposta errada! Tente novamente.');
    }
  }

  // Função para exibir pergunta
  function exibirPergunta() {
    const questionBox = document.getElementById('questionBox');
    const questionText = document.getElementById('questionText');
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');

    if (perguntaAtual >= perguntas.length) {
      questionBox.innerHTML = `
        <p>❤️ Isso foi uma surpresa para a gente se conhecer melhor, e uma lembrancinha para provar que te amo meu amor! Obrigado por ser você! ❤️</p>
        <p>Pontuação final: ${personagem.pontos}</p>
        <button onclick="reiniciarJogo()">Jogar Novamente</button>
      `;
      questionBox.style.display = 'block';
      return;
    }

    const pergunta = perguntas[perguntaAtual];
    questionText.textContent = pergunta.pergunta;
    option1.textContent = pergunta.correta;
    option2.textContent = pergunta.errada;

    questionBox.style.display = 'block';

    option1.onclick = () => moverParaResposta('correta');
    option2.onclick = () => moverParaResposta('errada');
  }

  // Função para reiniciar o jogo
  function reiniciarJogo() {
    perguntaAtual = 0;
    progresso = 0;
    personagem.pontos = 0;
    personagem.x = 100;
    exibirPergunta();
  }

  // Inicialização do jogo
  carregarPerguntas();
  iniciarMovimentoContinuo();
});
