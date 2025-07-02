// Arquivo: app.js (VERSÃO FINAL COM PAGINAÇÃO POR COLUNAS CSS)

document.getElementById('seletorArquivo').addEventListener('change', handleFileSelect, false);
document.getElementById('btnAnterior').addEventListener('click', mostrarPaginaAnterior);
document.getElementById('btnProximo').addEventListener('click', mostrarProximaPagina);

import { processarEpub } from "./extensions/epub.js";
import { processarPDF } from "./extensions/pdf.js";

let paragrafosDoLivro = []; // Voltamos a trabalhar com parágrafos.
const leitorDiv = document.getElementById('leitor');

// --- A FUNÇÃO criarLinhasVisuais FOI REMOVIDA ---

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) { return; }

    const leitor = new FileReader();
    leitor.onload = async function(e) {
        const conteudo = e.target.result;
        try {
            if (file.name.endsWith('.pdf')) {
                paragrafosDoLivro = await processarPDF(conteudo);
            } else if (file.name.endsWith('.epub')) {
                paragrafosDoLivro = await processarEpub(conteudo);
            } else {
                alert('Formato de arquivo não suportado!');
                return;
            }

            if (paragrafosDoLivro && paragrafosDoLivro.length > 0) {
                iniciarLeitura();
            } else {
                alert("Não foi possível extrair conteúdo legível deste arquivo.");
            }
        } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            alert("Ocorreu um erro ao tentar ler o arquivo.");
        }
    };
    leitor.readAsArrayBuffer(file);
}

function iniciarLeitura() {
    // Limpamos o conteúdo anterior.
    leitorDiv.innerHTML = '';
    
    // Inserimos TODOS os parágrafos de uma vez no leitor.
    paragrafosDoLivro.forEach(paragrafo => {
        const p = document.createElement('p');
        p.textContent = paragrafo;
        leitorDiv.appendChild(p);
    });

    // Resetamos a posição de rolagem para o início do livro.
    leitorDiv.scrollLeft = 0;
    atualizarBotoes();
}

// --- AS FUNÇÕES DE PAGINAÇÃO FORAM REESCRITAS ---

function mostrarProximaPagina() {
    // A largura de uma "página" é a largura visível do container + o espaço entre colunas.
    const larguraDaPagina = leitorDiv.clientWidth + parseInt(getComputedStyle(leitorDiv).columnGap);
    
    // Rolamos o conteúdo para a esquerda pela largura de uma página.
    leitorDiv.scrollLeft += larguraDaPagina;
    atualizarBotoes();
}

function mostrarPaginaAnterior() {
    const larguraDaPagina = leitorDiv.clientWidth + parseInt(getComputedStyle(leitorDiv).columnGap);

    // Rolamos o conteúdo para a direita.
    leitorDiv.scrollLeft -= larguraDaPagina;
    atualizarBotoes();
}

function atualizarBotoes() {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');

    // O botão "Anterior" é desabilitado se estivermos no início.
    btnAnterior.disabled = leitorDiv.scrollLeft < 1;

    // O botão "Próximo" é desabilitado se não houver mais conteúdo para rolar.
    // scrollWidth é a largura total de todo o conteúdo.
    // clientWidth é a largura da área visível.
    // scrollLeft é o quanto já rolamos.
    btnProximo.disabled = leitorDiv.scrollWidth - leitorDiv.clientWidth <= leitorDiv.scrollLeft;
}