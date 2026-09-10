const { Client, LocalAuth } = require('whatsapp-web.js');

const GRUPO_ALVO = 'Universitário-Noite - Fortaleza';
const MINHA_MSG = '13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv';
let jaEnvieiHoje = null;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

client.on('qr', (qr) => {
    const link = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    console.log('\nABRA ESSE LINK PARA ESCANEAR:');
    console.log(link + '\n');
});

client.on('ready', () => console.log('✅ Bot conectado com sucesso!'));
client.on('disconnected', (r) => console.log('Desconectado:', r));

client.on('message', async (msg) => {
    try {
        // Ignora mensagens que não são de grupo pra não quebrar
        if (!msg.from.endsWith('@g.us')) return;
        
        const chat = await msg.getChat().catch(() => null);
        if (!chat) return;
        if (chat.name !== GRUPO_ALVO) return;

        const hoje = new Date();
        const dia = hoje.getDay();
        if (dia !== 2 && dia !== 4) return; // só terça e quinta

        if (jaEnvieiHoje === hoje.toDateString()) return;

        const texto = (msg.body || '').toLowerCase();
        if (!texto.includes('1.') && !texto.includes('1 -')) return;
        if (!texto.includes('fametro')) return;

        console.log(`Lista detectada em ${chat.name}, esperando 15s...`);
        await new Promise(r => setTimeout(r, 15000));
        await chat.sendMessage(MINHA_MSG);
        jaEnvieiHoje = hoje.toDateString();
        console.log(`✅ Mensagem enviada em ${jaEnvieiHoje}`);

    } catch (e) {
        console.log('Erro ignorado na mensagem:', e.message);
    }
});

client.initialize();
