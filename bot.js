const { Client, LocalAuth } = require('whatsapp-web.js');

const GRUPO_ALVO = 'Universitário-Noite - Fortaleza';
const MINHA_MSG = '13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv';
let jaEnvieiHoje = null;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    // Gera um link de imagem que seu celular consegue ler facil
    const link = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    console.log('\n\n=================================');
    console.log('ABRA ESSE LINK PARA ESCANEAR:');
    console.log(link);
    console.log('=================================\n\n');
});

client.on('ready', () => console.log('✅ Bot conectado com sucesso!'));

client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        if (!chat.isGroup || chat.name !== GRUPO_ALVO) return;
        const hoje = new Date();
        if (hoje.getDay() !== 2 && hoje.getDay() !== 4) return; // so terca e quinta
        if (jaEnvieiHoje === hoje.toDateString()) return;
        const texto = msg.body.toLowerCase();
        if (!texto.includes('1.') || !texto.includes('fametro')) return;
        console.log('Lista detectada, esperando 15s...');
        await new Promise(r => setTimeout(r, 15000));
        await chat.sendMessage(MINHA_MSG);
        jaEnvieiHoje = hoje.toDateString();
        console.log('✅ Mensagem enviada!');
    } catch (e) { console.error(e); }
});

client.initialize();
