// Lista de vídeos fornecida
const VIDEOS = [
    { title: "Célula", subtitle: "Vídeo 1", id: "TdteRds4Dv0" },
    { title: "Testemunho", subtitle: "Vídeo 2", id: "IF7ZP0K-eeQ" },
    { title: "Visão Celular", subtitle: "Vídeo 3", id: "g8hZbzMOAlA" }
];

let player;
let currentVideoIndex = 0;

// Renderizar o menu lateral de vídeos
function renderPlaylist() {
    const playlistContainer = document.getElementById('playlist');
    playlistContainer.innerHTML = '';

    VIDEOS.forEach((video, index) => {
        const li = document.createElement('li');
        // Define classe active se for o video rodando no momento
        if (index === currentVideoIndex) {
            li.classList.add('active');
        }

        // Recuperar miniatura do youtube via URL (maxresdefault nem sempre tem, hqdefault é mais seguro)
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

// Essa função é chamada automaticamente pelo script da API do YouTube assim que ela carrega
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: VIDEOS[currentVideoIndex].id,
        playerVars: {
            'autoplay': 1,
            'rel': 0, // Minimiza vídeos recomendados de outros canais
            'showinfo': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    renderPlaylist();
}

function onPlayerReady(event) {
    // Se quiser que inicie mutado pra forçar o autoplay nos navegadores
    // event.target.mute();
}

// Função escuta as mudanças do player (Play, Pausa, Acabou)
function onPlayerStateChange(event) {
    // Quando o video terminar de tocar (estado 0)
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

function playVideo(index) {
    currentVideoIndex = index;
    renderPlaylist(); // Refaz o menu para iluminar o selecionado
    
    if (player && player.loadVideoById) {
        player.loadVideoById(VIDEOS[currentVideoIndex].id);
    }
}

function playNextVideo() {
    // Avança 1 casa. Se passar o total, zera pro primeiro vídeo
    currentVideoIndex++;
    if (currentVideoIndex >= VIDEOS.length) {
        currentVideoIndex = 0;
    }
    
    playVideo(currentVideoIndex);
}

// Inicia renderização visual básica aguardando a API do Youtube ser inserida
renderPlaylist();
