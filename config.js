const supabaseUrl = 'https://lzcrcjzbvzisvmctsvyf.supabase.co'; // Insira seu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Y3Jjanpidnppc3ZtY3RzdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjQ2ODAsImV4cCI6MjA1MjMwMDY4MH0.sPitOHsVyC86QtjkSkp0FCLs061V11Snmw7IgGFtxHQ'; // Insira sua chave de API
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step1Form = document.getElementById('step1Form');
const perguntasContainer = document.getElementById('perguntasContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const saveGameBtn = document.getElementById('saveGameBtn');
const gameLinkDiv = document.getElementById('gameLink');
const linkElement = document.getElementById('link');

// Perguntas padrão
const perguntasPadrao = [
  { pergunta: 'O que preferimos fazer juntos?', correta: 'Netflix em casa', errada: 'Ir ao cinema' },
  { pergunta: 'Qual foi a primeira música que ouvimos juntos?', correta: '...', errada: '...' },
  { pergunta: 'Qual seria o nosso destino perfeito para uma viagem?', correta: 'Uma praia paradisíaca', errada: 'Um lugar frio e aconchegante' },
];

// Avançar para a etapa 2
document.getElementById('nextStepBtn').addEventListener('click', () => {
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const titulo = document.getElementById('titulo').value;

  if (!nome || !email || !titulo) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  // Esconde a etapa 1 e exibe a etapa 2
  step1.style.display = 'none';
  step2.style.display = 'block';

  // Carrega perguntas padrão
  adicionarPerguntasPadrao();
});

// Adicionar perguntas padrão
function adicionarPerguntasPadrao() {
  perguntasPadrao.forEach(p => {
    adicionarPergunta(p.pergunta, p.correta, p.errada);
  });
}

// Adicionar nova pergunta
function adicionarPergunta(pergunta = '', correta = '', errada = '') {
  const div = document.createElement('div');
  div.className = 'grid-item';
  div.innerHTML = `
    <label>Pergunta:</label>
    <input type="text" name="pergunta" value="${pergunta}" required>
    <label>Correta:</label>
    <input type="text" name="correta" value="${correta}" required>
    <label>Errada:</label>
    <input type="text" name="errada" value="${errada}" required>
    <button type="button" class="removerPerguntaBtn btn-small">Remover</button>
  `;
  perguntasContainer.appendChild(div);

  div.querySelector('.removerPerguntaBtn').addEventListener('click', () => {
    perguntasContainer.removeChild(div);
  });
}

// Adicionar pergunta ao clicar no botão
addQuestionBtn.addEventListener('click', () => adicionarPergunta());

// Salvar jogo e gerar link
saveGameBtn.addEventListener('click', async () => {
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const titulo = document.getElementById('titulo').value;

  const usuarioId = await cadastrarUsuario(nome, email);
  if (!usuarioId) return;

  const jogoId = await criarJogo(usuarioId, titulo);
  if (!jogoId) return;

  const perguntas = Array.from(perguntasContainer.querySelectorAll('.grid-item')).map(item => ({
    pergunta: item.querySelector('input[name="pergunta"]').value,
    correta: item.querySelector('input[name="correta"]').value,
    errada: item.querySelector('input[name="errada"]').value,
  }));

  const sucesso = await salvarPerguntas(jogoId, perguntas);
  if (!sucesso) return;

  const jogoUrl = `${window.location.origin}/jogo.html?jogo_id=${jogoId}`;
  linkElement.href = jogoUrl;
  linkElement.textContent = jogoUrl;
  gameLinkDiv.style.display = 'block';
  alert('Jogo criado com sucesso!');

  // Enviar o link por e-mail
  await enviarLinkPorEmail(email, jogoUrl);
});

// Enviar o link por e-mail
async function enviarLinkPorEmail(email, link) {
  const { error } = await supabase.rpc('send_email_link', {
    email: email,
    link: link
  });

  if (error) {
    console.error('Erro ao enviar e-mail:', error.message);
    alert('Erro ao enviar o link por e-mail.');
  } else {
    alert('O link foi enviado para o e-mail fornecido.');
  }
}

// Funções de banco de dados
async function cadastrarUsuario(nome, email) {
  const { data, error } = await supabase.from('usuarios').insert({ nome, email }).select('id');
  return data?.[0]?.id || null;
}

async function criarJogo(usuarioId, titulo) {
  const jogoId = `jogo-${Date.now()}`;
  const { data, error } = await supabase.from('jogos').insert({ usuario_id: usuarioId, jogo_id: jogoId, titulo }).select('jogo_id');
  return data?.[0]?.jogo_id || null;
}

async function salvarPerguntas(jogoId, perguntas) {
  const perguntasFormatadas = perguntas.map(p => ({
    jogo_id: jogoId,
    pergunta: p.pergunta,
    correta: p.correta,
    errada: p.errada,
  }));
  const { error } = await supabase.from('perguntas').insert(perguntasFormatadas);
  return !error;
}
