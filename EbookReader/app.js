// Arquivo: app.js (VERSÃO "MODERNA")

// --- MAPEAMENTO DOS ELEMENTOS DO DOM ---
const seletorArquivoInput = document.getElementById('seletorArquivo');
const containerArquivoDiv = document.getElementById('container-arquivo');
const labelArquivo = document.querySelector('.label-arquivo');
const infoArquivoDiv = document.getElementById('info-arquivo');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');
const leitorDiv = document.getElementById('leitor');
const toastDiv = document.getElementById('toast-notification');

// --- VARIÁVEIS DE ESTADO ---
let paragrafosDoLivro = [];
let mapaDasPaginas = [];
let paginaAtual = 0;

// --- CONFIGURAÇÃO INICIAL DOS EVENTOS ---
seletorArquivoInput.addEventListener('change', handleFileSelect);
btnAnterior.addEventListener('click', mostrarPaginaAnterior);
btnProximo.addEventListener('click', mostrarProximaPagina);

import { processarEpub } from "./extensions/epub.js";
import { processarPDF } from "./extensions/pdf.js";
// --- LÓGICA DO SELETOR DE TEMA ---
const themeToggle = document.getElementById('theme-toggle');

// 1. Verifica se já existe um tema salvo no localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.classList.add(savedTheme);
    if (savedTheme === 'light-theme') {
        themeToggle.checked = true;
    }
}

// 2. Adiciona o ouvinte de evento para a mudança do interruptor
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        // Se estiver marcado, adiciona a classe do tema claro
        document.body.classList.add('light-theme');
        // Salva a preferência
        localStorage.setItem('theme', 'light-theme');
    } else {
        // Se não, remove a classe
        document.body.classList.remove('light-theme');
        // Salva a preferência
        localStorage.setItem('theme', 'dark-theme');
    }
});
// --- FUNÇÕES PRINCIPAIS ---

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) { return; }
    
    gerenciarHandlerResize(false);
    leitorDiv.innerHTML = '<p>Carregando e processando o livro...</p>';
    atualizarUIArquivo(file.name);

    const leitor = new FileReader();
    leitor.onload = async function(e) {
        const conteudo = e.target.result;
        try {
            if (file.name.endsWith('.pdf')) {
                paragrafosDoLivro = await processarPDF(conteudo);
            } else if (file.name.endsWith('.epub')) {
                paragrafosDoLivro = await processarEpub(conteudo);
            } else {
                mostrarToast('Formato de arquivo não suportado!', 'error');
                resetarUI();
                return;
            }

            if (paragrafosDoLivro && paragrafosDoLivro.length > 0) {
                await calcularPaginacao();
                iniciarLeitura();
                gerenciarHandlerResize(true); 
            } else {
                mostrarToast("Não foi possível extrair conteúdo do arquivo.", 'error');
                resetarUI();
            }
        } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            mostrarToast("Ocorreu um erro ao processar o arquivo.", 'error');
            resetarUI();
        }
    };
    leitor.readAsArrayBuffer(file);
}

async function calcularPaginacao() {
    mapaDasPaginas = [0];
    const alturaMaxima = leitorDiv.clientHeight;
    leitorDiv.style.visibility = 'hidden';
    leitorDiv.innerHTML = '';
    const leitorEstilos = window.getComputedStyle(leitorDiv);
    const pEstilos = window.getComputedStyle(document.querySelector('#leitor p') || document.createElement('p'));

    for (let i = 0; i < paragrafosDoLivro.length; i++) {
        const p = document.createElement('p');
        p.textContent = paragrafosDoLivro[i];
        p.style.textIndent = pEstilos.textIndent;
        p.style.marginBottom = pEstilos.marginBottom;
        p.style.marginTop = pEstilos.marginTop;
        
        leitorDiv.appendChild(p);
        if (leitorDiv.scrollHeight > alturaMaxima) {
            mapaDasPaginas.push(i);
            leitorDiv.innerHTML = '';
            const pClone = p.cloneNode(true);
            pClone.style.textIndent = pEstilos.textIndent;
            pClone.style.marginBottom = pEstilos.marginBottom;
            pClone.style.marginTop = pEstilos.marginTop;
            leitorDiv.appendChild(pClone);
        }
    }
    leitorDiv.innerHTML = '';
    leitorDiv.style.visibility = 'visible';
}

function iniciarLeitura() {
    paginaAtual = 0;
    mostrarPagina(paginaAtual);
    atualizarBotoes();
}

function mostrarPagina(numeroDaPagina) {
    leitorDiv.innerHTML = '';
    const indiceInicial = mapaDasPaginas[numeroDaPagina];
    const indiceFinal = mapaDasPaginas[numeroDaPagina + 1] || paragrafosDoLivro.length;
    const paragrafosDaPagina = paragrafosDoLivro.slice(indiceInicial, indiceFinal);
    
    paragrafosDaPagina.forEach(paragrafo => {
        const p = document.createElement('p');
        p.textContent = paragrafo;
        leitorDiv.appendChild(p);
    });

    // Ativa a animação de fade-in
    leitorDiv.classList.add('fade-in');
    setTimeout(() => leitorDiv.classList.remove('fade-in'), 500);
}

// --- FUNÇÕES DE UI E UTILITÁRIAS ---

function mostrarToast(mensagem, tipo = 'info') {
    toastDiv.textContent = mensagem;
    toastDiv.className = 'show';
    if (tipo === 'error') {
        toastDiv.classList.add('error');
    }
    setTimeout(() => {
        toastDiv.className = toastDiv.className.replace('show', '');
    }, 4000); // A notificação some após 4 segundos
}

function atualizarUIArquivo(nomeArquivo) {
    labelArquivo.style.display = 'none';
    infoArquivoDiv.classList.remove('hidden');
    infoArquivoDiv.innerHTML = `
        <span>${nomeArquivo}</span>
        <button id="btn-limpar" title="Limpar arquivo">&times;</button>
    `;
    document.getElementById('btn-limpar').addEventListener('click', resetarUI);
}

function resetarUI() {
    seletorArquivoInput.value = ''; // Limpa a seleção de arquivo
    labelArquivo.style.display = 'inline-flex';
    infoArquivoDiv.classList.add('hidden');
    leitorDiv.innerHTML = '<p>Por favor, selecione um livro em formato PDF ou ePub.</p>';
    paragrafosDoLivro = [];
    mapaDasPaginas = [];
    btnAnterior.disabled = true;
    btnProximo.disabled = true;
}

// Funções de navegação e responsividade (sem alterações)
function mostrarProximaPagina() { if (paginaAtual < mapaDasPaginas.length - 1) { paginaAtual++; mostrarPagina(paginaAtual); atualizarBotoes(); } }
function mostrarPaginaAnterior() { if (paginaAtual > 0) { paginaAtual--; mostrarPagina(paginaAtual); atualizarBotoes(); } }
function atualizarBotoes() { btnAnterior.disabled = paginaAtual === 0; btnProximo.disabled = paginaAtual >= mapaDasPaginas.length - 1; }

let timeoutResize;
const onWindowResize = () => { clearTimeout(timeoutResize); timeoutResize = setTimeout(async () => { if (paragrafosDoLivro.length > 0) { await calcularPaginacao(); if (paginaAtual >= mapaDasPaginas.length) { paginaAtual = mapaDasPaginas.length - 1; } mostrarPagina(paginaAtual); atualizarBotoes(); } }, 500); };
function gerenciarHandlerResize(ativar) { if (ativar) { window.addEventListener('resize', onWindowResize); } else { window.removeEventListener('resize', onWindowResize); } }

// Adicione este código no final do seu app.js

document.addEventListener('keydown', (event) => {
    //Impede a troca de páginas se o usuário
    // estiver digitando em algum campo de texto.
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    // Usamos um 'switch' que é uma forma limpa de lidar com múltiplos 'if's.
    switch (event.key) {
        case 'ArrowRight':
            // Previne o comportamento padrão do navegador (como rolar a página)
            event.preventDefault(); 
            // Simula o clique no botão "Próximo"
            btnProximo.click();
            break;
            
        case 'ArrowLeft':
            // Previne o comportamento padrão do navegador
            event.preventDefault();
            // Simula o clique no botão "Anterior"
            btnAnterior.click();
            break;
    }
});