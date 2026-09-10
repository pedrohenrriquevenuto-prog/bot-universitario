const { Client, LocalAuth } = require('whatsapp-web.js');

const GRUPO_ALVO = 'Universitário-Noite - Fortaleza';
const MINHA_MSG = '13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv';
let jaEnvieiHoje = null;

const client = new Client({
    authStrategy: new LocalAuth({ 
        dataPath: '/app/.wwebjs_auth',
        clientId: 'bot-final' // mudei pra forçar login limpo
    }),
    puppeteer: {
        headless: true,
        protocolTimeout: 180000, // aumenta o tempo que estava dando erro
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote'
        ]
    },
    takeoverOnConflict: true,
    restartOnAuthFail: true
});

client.on('qr', (qr) => {
    const link = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    console.log('\nABRA ESSE LINK PARA ESCANEAR:');
    console.log(link + '\n');
});

client.on('ready', () => console.log('✅ Bot conectado com sucesso! - PRONTO'));
client.on('disconnected', (r) => console.log('Desconectado:', r));
client.on('auth_failure', (m) => console.log('Falha auth:', m));

client.on('message', async (msg) => {
    try {
        if (!msg.from.endsWith('@g.us')) return;
        const chat = await msg.getChat().catch(() => null);
        if (!chat || chat.name !== GRUPO_ALVO) return;

        const hoje = new Date();
        if (hoje.getDay() !== 2 && hoje.getDay() !== 4) return;
        if (jaEnvieiHoje === hoje.toDateString()) return;

        const texto = (msg.body || '').toLowerCase();
        if (!texto.includes('1.')) return;
        if (!texto.includes('fametro')) return;

        console.log('Lista detectada, enviando em 15s...');
        await new Promise(r => setTimeout(r, 15000));
        await chat.sendMessage(MINHA_MSG);
        jaEnvieiHoje = hoje.toDateString();
        console.log('✅ Enviado!');
    } catch (e) {
        console.log('Erro na msg ignorado:', e.message);
    }
});

client.initialize();
