export async function processarPDF(data) {
    // A biblioteca pdfjsLib precisa ser carregada no HTML primeiro
    // para que este objeto esteja disponível globalmente.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let textoCompleto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // O método 'getTextContent' nos dá os pedaços de texto.
        // Vamos juntá-los com espaços. Adicionamos uma quebra de linha dupla
        // no final de cada página para ajudar a separar o conteúdo.
        const textoDaPagina = textContent.items.map(item => item.str).join(' ');
        textoCompleto += textoDaPagina + '\n\n';
    }

    // Agora, vamos processar o texto completo para criar os parágrafos.
    // 1. Substituímos múltiplos espaços por um só.
    // 2. Dividimos o texto por duas ou mais quebras de linha, que geralmente separam parágrafos.
    const paragrafos = textoCompleto.split(/\n\s*\n/);
    
    // Criamos o array final, removendo parágrafos vazios.
    const linhasProcessadas = paragrafos.map(p => p.trim()).filter(p => p.length > 0);

    // Em vez de chamar iniciarLeitura(), retornamos o array de parágrafos.
    return linhasProcessadas;
}