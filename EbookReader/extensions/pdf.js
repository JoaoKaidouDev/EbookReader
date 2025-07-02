// Arquivo: extensions/pdf.js (VERSÃO APRIMORADA)

export async function processarPDF(data) {
    try {
        // Configuração do PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        let paragrafosProcessados = [];
        let paragrafoAtual = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Ordena os itens de texto por sua posição vertical e depois horizontal.
            const items = textContent.items.sort((a, b) => {
                if (a.transform[5] > b.transform[5]) return -1; // Compara Y
                if (a.transform[5] < b.transform[5]) return 1;
                if (a.transform[4] > b.transform[4]) return 1;  // Compara X
                if (a.transform[4] < b.transform[4]) return -1;
                return 0;
            });

            let ultimoY = -1;
            let alturaDaLinha = 0;

            for (const item of items) {
                if (ultimoY === -1) {
                    // Primeira linha, apenas armazena a posição
                    paragrafoAtual += item.str;
                    ultimoY = item.transform[5];
                    alturaDaLinha = item.height;
                    continue;
                }

                const yAtual = item.transform[5];
                const deltaY = Math.abs(yAtual - ultimoY);

                // Se o espaço vertical for maior que 1.5x a altura da linha anterior,
                // consideramos uma quebra de parágrafo.
                if (deltaY > alturaDaLinha * 1.5) {
                    paragrafosProcessados.push(paragrafoAtual.trim());
                    paragrafoAtual = item.str;
                } else {
                    // Se não, é apenas um espaço ou continuação da mesma linha.
                    paragrafoAtual += (paragrafoAtual.endsWith(' ') ? '' : ' ') + item.str;
                }
                
                ultimoY = yAtual;
                if (item.height > 0) alturaDaLinha = item.height;
            }
        }
        
        // Adiciona o último parágrafo que sobrou no buffer
        if (paragrafoAtual.trim().length > 0) {
            paragrafosProcessados.push(paragrafoAtual.trim());
        }

        // Filtra quaisquer parágrafos vazios que possam ter sido criados
        return paragrafosProcessados.filter(p => p.length > 0);

    } catch (err) {
        console.error("Erro drástico ao processar o PDF:", err);
        alert("Este arquivo PDF parece estar corrompido ou em um formato não suportado.");
        return [];
    }
}