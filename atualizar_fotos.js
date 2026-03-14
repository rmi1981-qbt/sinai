const fs = require('fs');
const path = require('path');

// Diretório onde as fotos estão salvas
const directoryPath = path.join(__dirname, 'assets', 'images', 'fotos');

// Arquivo final Javascript que será lido pelo site estático
const outputPath = path.join(__dirname, 'fotos-data.js');

try {
    // Lê os arquivos da pasta
    const files = fs.readdirSync(directoryPath);
    
    // Filtra apenas arquivos de imagem (jpg, jpeg, png, etc) e descarta arquivos ocultos (como .DS_Store)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return validExtensions.includes(ext);
    });

    // Cria o conteúdo do javascript gerado dinamicamente
    const jsContent = `// Arquivo gerado automaticamente pelo script atualizar_fotos.js\nconst FOTOS_CELULA = ${JSON.stringify(imageFiles, null, 4)};`;

    // Grava no disco
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    
    console.log(`✅ Sucesso! O site foi atualizado. ${imageFiles.length} fotos prontas para exibição no carrossel.`);
} catch (err) {
    console.error('❌ Erro ao ler a pasta de fotos:', err.message);
}
