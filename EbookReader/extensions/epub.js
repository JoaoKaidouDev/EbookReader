// Arquivo: extensions/epub.js (VERSÃO FINALÍSSIMA CORRIGIDA)

export async function processarEpub(data) {
    try {
        // CORREÇÃO APLICADA AQUI: Usamos o método estático para carregar o arquivo.
        const zip = await JSZip.loadAsync(data);

        // 1. Encontrar e ler o arquivo container.xml.
        const containerFile = zip.file("META-INF/container.xml");
        if (!containerFile) {
            throw new Error("Arquivo META-INF/container.xml não encontrado. O ePub pode estar corrompido.");
        }
        const containerText = await containerFile.async("string");
        const parser = new DOMParser();
        const containerDoc = parser.parseFromString(containerText, "application/xml");
        
        // 2. Pegar o caminho do arquivo .opf (o sumário principal).
        const contentFilePath = containerDoc.getElementsByTagName("rootfile")[0].getAttribute("full-path");
        const contentFile = zip.file(contentFilePath);
        if (!contentFile) {
            throw new Error(`Arquivo de conteúdo ${contentFilePath} não encontrado.`);
        }
        const contentText = await contentFile.async("string");
        const contentDoc = parser.parseFromString(contentText, "application/xml");

        // Extrai o caminho base para resolver os caminhos dos capítulos.
        const basePath = contentFilePath.substring(0, contentFilePath.lastIndexOf("/") + 1);

        // 3. Mapeia o 'manifest': um dicionário de todos os arquivos do livro (id -> href).
        const manifestItems = {};
        const manifestElements = contentDoc.getElementsByTagName("item");
        for (let item of manifestElements) {
            const href = item.getAttribute("href");
            // Garante que o href não seja nulo ou vazio antes de adicionar
            if (href) {
                manifestItems[item.getAttribute("id")] = basePath + href;
            }
        }

        // 4. Lê a 'spine': a ordem dos capítulos do livro.
        const spineIds = [];
        const spineElements = contentDoc.getElementsByTagName("itemref");
        for (let item of spineElements) {
            spineIds.push(item.getAttribute("idref"));
        }

        // 5. Lê o conteúdo de cada capítulo na ordem correta.
        const linhasProcessadas = [];
        for (const id of spineIds) {
            const chapterPath = manifestItems[id];
            // Garante que o caminho do capítulo existe antes de tentar carregar
            if (chapterPath) {
                const chapterFile = zip.file(chapterPath);
                if (chapterFile) {
                    const chapterHtml = await chapterFile.async("string");
                    const chapterDoc = parser.parseFromString(chapterHtml, "text/html");
                    
                    const elementos = chapterDoc.body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
                    elementos.forEach(element => {
                        let texto = element.textContent.trim();
                        if (texto.length > 0) {
                            linhasProcessadas.push(texto);
                        }
                    });
                }
            }
        }
        
        return linhasProcessadas;

    } catch (err) {
        console.error("Erro drástico ao processar o EPUB com JSZip:", err);
        alert("Este arquivo ePub parece estar em um formato não convencional ou corrompido.");
        return [];
    }
}