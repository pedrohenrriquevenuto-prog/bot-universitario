const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const CONFIG = {
    GRUPO: 'Universitário-Noite - Fortaleza',
    MENSAGEM: 'Pedro Henrique *Unifametro* 19:00 às 21:45 vv',
    DIAS_PERMITIDOS: [2, 4], // 0=Domingo, 1=Segunda, 2=Terça, 4=Quinta
    TEMPO_ESPERA_DIGITANDO: 15000, // 15 segundos esperando ninguém digitar
    ARQUIVO_CONTROLE: './controle_envio.json'
};

let timerEspera = null;

console.log('Iniciando bot Universitário-Noite...');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "universitario-bot" }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

client.on('qr', qr => {
    console.log('--- QR CODE GERADO ---');
    console.log('Escaneie em até 30 segundos:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ Bot conectado com sucesso no grupo: ' + CONFIG.GRUPO);
    console.log('Modo: Apenas Terça e Quinta, 1 vez por dia, respeitando digitação');
});

function jaEnvieiHoje() {
    if (!fs.existsSync(CONFIG.ARQUIVO_CONTROLE)) return false;
    try {
        const dados = JSON.parse(fs.readFileSync(CONFIG.ARQUIVO_CONTROLE));
        const hoje = new Date().toDateString();
        return dados.ultimoEnvio === hoje;
    } catch { return false; }
}

function marcarComoEnviado() {
    const hoje = new Date().toDateString();
    fs.writeFileSync(CONFIG.ARQUIVO_CONTROLE, JSON.stringify({ ultimoEnvio: hoje, grupo: CONFIG.GRUPO }));
}

function ehDiaPermitido() {
    const hoje = new Date().getDay();
    const permitido = CONFIG.DIAS_PERMITIDOS.includes(hoje);
    if (!permitido) {
        // Log silencioso para não poluir, só avisa uma vez
        // console.log(`Hoje não é Terça/Quinta (${hoje}), ignorando...`);
    }
    return permitido;
}

client.on('message', async msg => {
    try {
        const chat = await msg.getChat();
        if (!chat.isGroup || chat.name !== CONFIG.GRUPO) return;
        if (!ehDiaPermitido()) return;
        if (jaEnvieiHoje()) return;

        const texto = msg.body;
        if (!/\d+\s*[.)-]\s*/.test(texto)) return;
        if (texto.toLowerCase().includes('pedro henrique')) return;

        console.log(`[${new Date().toLocaleTimeString()}] Lista detectada... aguardando ${CONFIG.TEMPO_ESPERA_DIGITANDO/1000}s`);

        if (timerEspera) clearTimeout(timerEspera);

        timerEspera = setTimeout(async () => {
            try {
                const mensagens = await chat.fetchMessages({ limit: 30 });
                const textoCompleto = mensagens.map(m => m.body).join('\n');

                if (textoCompleto.toLowerCase().includes('pedro henrique')) {
                    console.log('Você já está na lista, cancelando envio.');
                    return;
                }

                const regex = /(\d+)\s*[.)-]/g;
                let match;
                let ultimoNumero = 0;
                let m;
                while ((m = regex.exec(textoCompleto)) !== null) {
                    const num = parseInt(m[1]);
                    if (num > ultimoNumero) ultimoNumero = num;
                }

                if (ultimoNumero === 0) return;

                const proximo = ultimoNumero + 1;
                const mensagemFinal = `${proximo}. ${CONFIG.MENSAGEM}`;

                console.log(`Ninguém mais digitou. Enviando: ${mensagemFinal}`);

                await chat.sendStateTyping();
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
                
                await chat.sendMessage(mensagemFinal);
                marcarComoEnviado();
                console.log('✅ Mensagem enviada e travada até amanhã');

            } catch (e) {
                console.log('Erro ao enviar:', e.message);
            }
        }, CONFIG.TEMPO_ESPERA_DIGITANDO);

    } catch (e) {
        console.log('Erro geral:', e.message);
    }
});

client.initialize();
