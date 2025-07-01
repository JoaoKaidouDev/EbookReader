document.getElementById('seletorArquivo').addEventListener('change', handleFileSelect, false);
document.getElementById('btnAnterior').addEventListener('click', mostrarPaginaAnterior);
document.getElementById('btnProximo').addEventListener('click', mostrarProximaPagina);

let linhasDoLivro = [];
let paginaAtual = 0;
const paragrafosPorPagina = 5;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        if (file.name.endsWith('.pdf')) {
            processarPDF(conteudo);
        } else if (file.name.endsWith('.epub')) {
            processarEpub(conteudo);
        } else {
            alert('Formato de arquivo não suportado!');
        }
    };

    if (file.name.endsWith('.pdf')) {
        leitor.readAsArrayBuffer(file);
    } else {
        leitor.readAsArrayBuffer(file);
    }
}
// --- SUBSTITUA A FUNÇÃO processarPDF PELA VERSÃO ABAIXO ---

async function processarPDF(data) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let textoCompleto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Em vez de juntar tudo, vamos adicionar espaços e quebras de linha para manter a estrutura.
        const textoDaPagina = textContent.items.map(item => item.str).join(' ');
        textoCompleto += textoDaPagina.replace(/\s+/g, ' ') + '\n'; // Normaliza espaços e adiciona quebra de linha por página
    }

    // Quebra o texto em sentenças para simular linhas curtas.
    // Isso ajuda a dividir parágrafos longos em partes menores.
    linhasDoLivro = textoCompleto.match(/[^.!?]+[.!?]+/g) || [textoCompleto];
    
    // Remove espaços em branco extras de cada "linha"
    linhasDoLivro = linhasDoLivro.map(linha => linha.trim()).filter(linha => linha.length > 0);

    iniciarLeitura();
}


// --- SUBSTITUA A FUNÇÃO processarEpub PELA VERSÃO ABAIXO ---

async function processarEpub(data) {
    const book = ePub(data);
    await book.ready;
    
    linhasDoLivro = [];

    // Usaremos uma Promise.all para esperar que todas as seções sejam processadas.
    await Promise.all(book.spine.items.map(async (section) => {
        const contents = await section.load(book.load.bind(book));
        const doc = new DOMParser().parseFromString(contents, 'text/html');

        // Itera sobre os elementos do corpo do capítulo (parágrafos, títulos, etc.)
        doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(element => {
            let texto = element.textContent.trim();
            if (texto.length > 0) {
                // Se for um título, podemos adicionar uma marcação para destacá-lo
                if (element.tagName.startsWith('H')) {
                    texto = `** ${texto} **`;
                }
                linhasDoLivro.push(texto);
            }
        });
    }));

    iniciarLeitura();
}
function iniciarLeitura() {
    paginaAtual = 0;
    mostrarPagina(paginaAtual);
    atualizarBotoes();
}

function mostrarPagina(numeroDaPagina) {
    const leitorDiv = document.getElementById('leitor');
    leitorDiv.innerHTML = ''; // Limpa o conteúdo anterior

    const inicio = numeroDaPagina * paragrafosPorPagina;
    const fim = inicio + paragrafosPorPagina;
    const linhasDaPagina = linhasDoLivro.slice(inicio, fim);

    linhasDaPagina.forEach(linha => {
        const p = document.createElement('p');
        p.textContent = linha;
        leitorDiv.appendChild(p);
    });
}

function mostrarProximaPagina() {
    if ((paginaAtual + 1) * paragrafosPorPagina < linhasDoLivro.length) {
        paginaAtual++;
        mostrarPagina(paginaAtual);
        atualizarBotoes();
    }
}

function mostrarPaginaAnterior() {
    if (paginaAtual > 0) {
        paginaAtual--;
        mostrarPagina(paginaAtual);
        atualizarBotoes();
    }
}

function atualizarBotoes() {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');

    btnAnterior.disabled = paginaAtual === 0;
    btnProximo.disabled = (paginaAtual + 1) * paragrafosPorPagina >= linhasDoLivro.length;
}