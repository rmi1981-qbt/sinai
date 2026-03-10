// Variáveis globais
let allCells = [];
let map;
let markersLayer;

// Mapeamento constante dos cabeçalhos do CSV
const HEADERS = {
    REDE: 'rede',
    NOME: 'nome_celula',
    UF: 'uf',
    CIDADE: 'cidade',
    BAIRRO: 'bairro',
    ENDERECO: 'endereco', 
    LATLNG: 'latitude', // O CSV juntou a coluna de latitude e longitude sem ; separador
    RAIO: 'raio',
    DIA: 'dia_da_semana',
    HORA: 'horainicio',
    LIDERES: 'lideres',
    CONTATO: 'contato'
};

const NETWORK_COLORS = {
    'azul': '#3388ff',
    'vermelho': '#e84545',
    'verde': '#2b9348',
    'amarelo': '#f4d35e',
    'laranja': '#f77f00',
    'roxo': '#9d4edd',
    'rosa': '#ff4d6d',
    'branco': '#ffffff',
    'preto': '#2b2d42'
};

function getColorForRede(redeName) {
    if (!redeName) return '#cfa660'; 
    const normalized = redeName.trim().toLowerCase();
    return NETWORK_COLORS[normalized] || '#cfa660'; // Dourado padrão
}

function createCustomIcon(color) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
    
    return L.divIcon({
        className: '', // Remove o css de fundo branco padrão do leaflet
        html: svgIcon,
        iconSize: [36, 36],
        iconAnchor: [18, 36], // Posiciona a ponta do pino em baixo
        popupAnchor: [0, -36] // Faz o popup abrir acima do pin
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadCSV();
    bindFilters();
});

function initMap() {
    // Inicializa o mapa centralizado no Brasil, depois ele atualiza sozinho com os limites dos pinos
    map = L.map('map').setView([-14.235, -51.925], 4);

    // Carrega a camada visual do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Camada para gerenciar todos os círculos/marcadores, para podermos limpar facilmente depois
    markersLayer = L.layerGroup().addTo(map);
}

function loadCSV() {
    // Como estamos na pasta local usando o 'serve', ler arquivos assim é bem simples
    // Usamos um timestamp para garantir que o navegador não cacheie a versão velha do CSV
    fetch(`celulas.csv?t=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar celulas.csv");
            return response.text();
        })
        .then(text => {
            parseCSV(text);
            populateFilters();
            updateSummary();
            renderMap(allCells);
        })
        .catch(err => {
            console.error("Erro ao carregar ou processar celulas.csv:", err);
            // Mostrar mensagem de erro na tela se falhar o CSV (para sabermos fácil)
            const mapDiv = document.getElementById('map');
            if(mapDiv) mapDiv.innerHTML = `<div style="padding:20px; color:red;">Erro ao ler celulas.csv! Verifique o console: ${err.message}</div>`;
        });
}

function parseCSV(text) {
    // Tenta limpar caracteres indesejados caso venham do bloco de notas
    text = text.replace(/^\uFEFF/, ''); // Remove BOM se houver
    
    // Divide pelas quebras de linha com cuidado (regex para Windows \r\n e Linux \n)
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
        console.warn("CSV parece estar vazio ou só tem cabeçalho:", text);
        return; 
    }

    // O cabeçalho é a linha 0
    // Opcionalmente podemos usar ToLowerCase para ser case-insensitive
    const keys = lines[0].split(';').map(k => k.trim().toLowerCase());
    
    console.log("Cabeçalhos detectados:", keys);
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Pula linhas em branco
        
        const values = line.split(';');
        
        let row = {};
        keys.forEach((key, index) => {
            row[key] = (values[index] || '').trim();
        });
        allCells.push(row);
    }
    console.log("Células parseadas:", allCells);
}

function populateFilters() {
    const filterSelectors = {
        'filter-rede': HEADERS.REDE,
        'filter-uf': HEADERS.UF,
        'filter-cidade': HEADERS.CIDADE,
        'filter-bairro': HEADERS.BAIRRO,
        'filter-dia': HEADERS.DIA,
        'filter-horario': HEADERS.HORA
    };

    for (const [selectId, field] of Object.entries(filterSelectors)) {
        const selectElement = document.getElementById(selectId);
        
        // Pega todos os valores únicos ignorando células vazias
        const uniqueValues = [...new Set(allCells.map(c => c[field]))].filter(v => v);
        uniqueValues.sort(); // Alfabetico
        
        uniqueValues.forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            selectElement.appendChild(option);
        });
    }
}

function bindFilters() {
    const selects = document.querySelectorAll('.sidebar select');
    selects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const rede = document.getElementById('filter-rede').value;
    const uf = document.getElementById('filter-uf').value;
    const cidade = document.getElementById('filter-cidade').value;
    const bairro = document.getElementById('filter-bairro').value;
    const dia = document.getElementById('filter-dia').value;
    const horario = document.getElementById('filter-horario').value;

    const filtered = allCells.filter(cell => {
        const matchDia = !dia || (cell[HEADERS.DIA] && cell[HEADERS.DIA].toLowerCase() === dia);
        
        return (!rede || cell[HEADERS.REDE] === rede) &&
               (!uf || cell[HEADERS.UF] === uf) &&
               (!cidade || cell[HEADERS.CIDADE] === cidade) &&
               (!bairro || cell[HEADERS.BAIRRO] === bairro) &&
               matchDia &&
               (!horario || cell[HEADERS.HORA] === horario);
    });

    renderMap(filtered);

    // Ilumina o dia na caixinha de resumo se a pessoa usou o select normal de dia
    document.querySelectorAll('#summary-list li').forEach(li => {
        if (dia && li.dataset.day === dia) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

function updateSummary() {
    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = '';

    // Contagem rápida das celulas para cada dia
    const countByDay = {};
    allCells.forEach(cell => {
        const day = cell[HEADERS.DIA];
        if (day) {
            countByDay[day.toLowerCase()] = (countByDay[day.toLowerCase()] || 0) + 1;
        }
    });

    // Ordem natural dos dias da semana pra exibir SEMPRE, mesmo que count seja 0
    const dayOrder = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    
    // Cria as 'li' e coloca o evento de click exclusivo
    dayOrder.forEach(day => {
        const count = countByDay[day] || 0;
        
        const li = document.createElement('li');
        li.dataset.day = day; // guarda minusculo
        li.innerHTML = `<span style="text-transform: capitalize;">${day}</span> <span class="badge">${count}</span>`;
        
        // Lógica de clicar no painel resumo
        li.addEventListener('click', () => {
            const diaSelect = document.getElementById('filter-dia');
            
            if (diaSelect.value === day) {
                // Se já estiver clicado, desmarca
                diaSelect.value = '';
                li.classList.remove('active');
            } else {
                // Senão ele sobrepõe com a seleção deste dia
                diaSelect.value = day;
            }
            
            // Depois ele dispara o filtro total de forma automatica
            applyFilters();
        });

        summaryList.appendChild(li);
    });
}

function renderMap(cells) {
    // Toda vez que filtramos limpamos os pinos anteriores
    markersLayer.clearLayers();
    
    if (cells.length === 0) return;

    // Guardaremos as bordas de todos os pontos plotados
    const bounds = [];

    cells.forEach(cell => {
        // Agora, por causa do CSV modificado (lat,log juntos sem ponto e virgula dividindo a coluna):
        // Ex: -23.485900,-46.838003 (salvo tudo na propriedade LATLNG)
        let lat = NaN;
        let lng = NaN;

        if (cell[HEADERS.LATLNG]) {
           const parts = cell[HEADERS.LATLNG].split(',');
           if (parts.length >= 2) {
               lat = parseFloat(parts[0]);
               lng = parseFloat(parts[1]);
           }
        }
        
        // Pega o raio de forma segura. Se vier sujo, vazio ou não for número, assume 1 km.
        let rawRadius = cell[HEADERS.RAIO];
        let radiusKm = parseFloat(rawRadius);
        if (isNaN(radiusKm) || radiusKm <= 0) {
            radiusKm = 1;
        }
        
        if (isNaN(lat) || isNaN(lng)) return;

        bounds.push([lat, lng]);

        // Traduz e Pega a cor baseada na coluna da rede
        const redeColor = getColorForRede(cell[HEADERS.REDE]);

        // Cria o círculo de abrangência
        const circle = L.circle([lat, lng], {
            color: redeColor, // Borda externa
            weight: 2, // Borda um pouco mais grossa
            fillColor: redeColor, // Preenchimento interno
            fillOpacity: 0.5, // 50% de transparência para não ficar tão sumido dependendo do zoom
            radius: radiusKm * 1000 // Leaflet usa metros
        }).addTo(markersLayer);

        // Cria o pino central customizado em vez do pino basico usando a mesma cor
        const marker = L.marker([lat, lng], { icon: createCustomIcon(redeColor) }).addTo(markersLayer);

        // Prepara o popup de HTML
        const whatsappNumber = cell[HEADERS.CONTATO].replace(/\D/g, ''); // limpa tudo, deixa sós os numeros para o link
        const popupContent = `
            <div style="font-family: 'Outfit', sans-serif;">
                <h3 style="margin:0 0 5px 0; color: #111;">Célula ${cell[HEADERS.NOME]}</h3>
                <p style="margin:0 0 5px 0; font-size:13px; color:#555;">${cell[HEADERS.BAIRRO]}, ${cell[HEADERS.CIDADE]} - ${cell[HEADERS.UF]}</p>
                <hr style="border:0; border-top:1px solid #ccc; margin:5px 0;">
                <p style="margin:2px 0;"><strong>Líderes:</strong> ${cell[HEADERS.LIDERES]}</p>
                <p style="margin:2px 0;"><strong>Quando:</strong> ${cell[HEADERS.DIA]} às ${cell[HEADERS.HORA]}</p>
                <p style="margin:2px 0;"><strong>Rede:</strong> ${cell[HEADERS.REDE]}</p>
                <a href="https://wa.me/55${whatsappNumber}?text=Olá!%20Gostaria%20de%20visitar%20a%20célula%20${cell[HEADERS.NOME]}%21" 
                   target="_blank" 
                   style="display:inline-block; margin-top:8px; padding:6px 12px; background:#25D366; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold; width:100%; text-align:center; box-sizing:border-box;">
                   Falar no WhatsApp
                </a>
            </div>
        `;
        
        // Vincula o popup de informação a ambos (clicar na borda ou pino dá na mesma)
        marker.bindPopup(popupContent);
        circle.bindPopup(popupContent);
    });

    // Anima a câmera do mapa para dar caber todos os pontos encontrados
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}
