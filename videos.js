// Arrays dinâmicos que serão preenchidos pelo CSV
let VIDEOS = [];
let player;
let currentVideoIndex = 0;

// Variáveis de controle para o Assincronismo: O Youtube e o Banco de Dados vão baixar ao mesmo tempo
let isYoutubeReady = false;
let isCsvLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    loadCSV();
});

// Faz o download do arquivo de videos usando carimbo de tempo pra quebrar Cache do navegador
function loadCSV() {
    fetch(`videos.csv?t=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar videos.csv");
            return response.text();
        })
        .then(text => {
            parseCSV(text);
            isCsvLoaded = true;
            checkReady(); // Avisa que os dados já chegaram
        })
        .catch(err => {
            console.error(err);
            document.getElementById('playlist').innerHTML = `<li style="color:red; margin: 10px;">Erro ao carregar vídeos do Banco de Dados: ${err.message}</li>`;
        });
}

function parseCSV(text) {
    // Limpezas de segurança essenciais provenientes de bugs do Bloco de Notas / Excel no modo CSV
    text = text.replace(/^\uFEFF/, ''); 
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return; 

    // Ignoramos a primeira linha (cabeçalho) e lemos a partir do índice 1
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Separa colunas como titulo; subtitulo; url
        const values = line.split(';');
        const title = values[0] ? values[0].trim() : `Vídeo ${i}`;
        const subtitle = values[1] ? values[1].trim() : '';
        const rawUrl = values[2] ? values[2].trim() : '';
        
        // A função inteligente entende caso ele jogue o link da web ou link do app do Youtube
        const videoId = extractYouTubeID(rawUrl);
        if (videoId) {
            VIDEOS.push({ title, subtitle, id: videoId });
        }
    }
}

// Extrator inteligente via Expressões Regulares de Javascript para aceitar vários formatos de links
function extractYouTubeID(url) {
    if (!url) return null;
    
    // Tenta arrancar só o "Código Mágico" de 11 Letras do Link inteiro do youtube caso o usuario jogue completo
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    // Caso o usuário insira só o código limpo no Excel sem link do site, a gente só repassa as 11 letras diretas
    return (match && match[2].length === 11) ? match[2] : url.trim();
}

// Esta função é chamada magicamente pela biblioteca externa <script src="https://www.youtube.com/iframe_api">
// quando ela terminar o download de internet.
function onYouTubeIframeAPIReady() {
    isYoutubeReady = true;
    checkReady(); // Avisa que o player virtual está de pé
}

// Controle de tráfego: Se o vídeo e o player baixaram ao mesmo tempo, podemos dar boot  na tela
function checkReady() {
    if (isCsvLoaded) {
        if (VIDEOS.length > 0) {
            renderPlaylist();
            
            // Só inicializa o IFRAME do Youtube se a API do Google já terminou de baixar na página
            if (isYoutubeReady && !player) {
                initPlayer();
            }
        } else {
            // Se o CSV está vazio de linhas
            document.getElementById('playlist').innerHTML = `<li style="padding:15px; text-align:center;">Nenhum vídeo cadastrado em vídeos.csv</li>`;
        }
    }
}

function initPlayer() {
    // Pega o domínio completo dinamicamente (útil para o Github/Appfy liberar o video)
    const currentOrigin = window.location.origin;

    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: VIDEOS[currentVideoIndex].id,
        playerVars: {
            'autoplay': 0, // Tiramos o autoplay forçado pois os navegadores modernos bloqueiam videos com som não solicitados
            'rel': 0, // Inibe mostrar recomendações forçadas do Youtube de outros canais
            'showinfo': 0,
            'modestbranding': 1,
            'origin': currentOrigin // Envia o dominio atual para o Youtube para evitar bloqueio de segurança
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError // Adicionado para relatar erros (já implementado no arquivo)
        }
    });
}

function renderPlaylist() {
    const playlistContainer = document.getElementById('playlist');
    playlistContainer.innerHTML = '';

    VIDEOS.forEach((video, index) => {
        const li = document.createElement('li');
        if (index === currentVideoIndex) {
            li.classList.add('active'); // Destaca na lista de episódios
        }

        // Tenta roubar a imagem de miniatura mais alta gerada pelo próprio Youtube 
        const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

        li.innerHTML = `
            <div class="video-thumb" style="background-image: url('${thumbUrl}')"></div>
            <div class="video-info">
                <span class="video-title">${video.title}</span>
                <span class="video-subtitle">${video.subtitle}</span>
            </div>
        `;

        li.addEventListener('click', () => {
            playVideo(index);
        });

        playlistContainer.appendChild(li);
    });
}

// Ouve se o estado do youtube mudou (tipo: pausou, bufferizou ou finalizou a metrica do video)
function onPlayerStateChange(event) {
    // 0 é o gatilho que a barrinha bateu no infinito.. se sim passa pro proximo cap.
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

// Intercepta erros graves de reprodução que o Youtube cospe de volta
function onPlayerError(event) {
    const errorCodes = {
        2: "Parâmetro de vídeo inválido fornecido ao YouTube.",
        5: "Vídeo HTML5 incompatível com o navegador.",
        100: "Vídeo não encontrado. Pode ter sido removido ou está privado no YouTube.",
        101: "O dono deste vídeo não permite que ele seja reproduzido fora do site do YouTube (Incorporação Desativada).",
        150: "O dono deste vídeo não permite que ele seja reproduzido fora do site do YouTube (Incorporação Desativada)."
    };
    
    const explanation = errorCodes[event.data] || "Erro desconhecido de reprodução.";
    
    // Apaga a tela preta e bota um aviso bem chamativo
    const wrapper = document.querySelector('.video-player-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #fff;">
                <h3 style="color:red; margin-bottom:10px;">Vídeo Bloqueado pelo YouTube</h3>
                <p>${explanation}</p>
                <a href="https://www.youtube.com/watch?v=${VIDEOS[currentVideoIndex].id}" target="_blank" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#fff; color:#000; border-radius:5px; text-decoration:none; font-weight:bold;">Assistir Diretamente no YouTube</a>
            </div>
        `;
    }
}

function playVideo(index) {
    currentVideoIndex = index;
    renderPlaylist(); // Acende a bolinha certa do menu
    
    // Injeta na TV o novo ID de video 
    if (player && player.loadVideoById) {
        player.loadVideoById(VIDEOS[currentVideoIndex].id);
    }
}

function playNextVideo() {
    currentVideoIndex++;
    
    // Se zerei o final da fita, volta po cap 1
    if (currentVideoIndex >= VIDEOS.length) {
        currentVideoIndex = 0;
    }
    
    playVideo(currentVideoIndex);
}
