const fs = require('fs');
try {
    const base = '/app/.wwebjs_auth/bot-final';
    ['SingletonLock','SingletonCookie','SingletonSocket'].forEach(f=>{
        const p = `${base}/${f}`;
        if (fs.existsSync(p)) fs.unlinkSync(p);
    });
} catch {}

const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth', clientId: 'bot-final' }),
    puppeteer: {
        headless: true,
        protocolTimeout: 180000,
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']
    },
    // ISSO CONSERTA O "ÚLTIMA SESSÃO"
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    takeoverOnConflict: true,
    takeoverTimeoutMs: 0,
    restartOnAuthFail: true
});

client.on('qr', qr => {
    console.log('LINK QR: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(qr));
});

client.on('ready', () => console.log('✅ Bot conectado com sucesso! - PRONTO - AGUARDANDO LISTA'));
client.on('disconnected', r => console.log('DESCONECTADO:', r));
client.on('auth_failure', m => console.log('AUTH FAIL:', m));

const GRUPO = 'Universitário-Noite - Fortaleza';
const MSG = '13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv';
let enviado = null;

client.on('message', async msg => {
    try {
        if (!msg.from.endsWith('@g.us')) return;
        const chat = await msg.getChat();
        if (chat.name !== GRUPO) return;
        const hoje = new Date();
        if (hoje.getDay() !== 2 && hoje.getDay() !== 4) return;
        if (enviado === hoje.toDateString()) return;
        const t = (msg.body||'').toLowerCase();
        if (!t.includes('1.') || !t.includes('fametro')) return;
        console.log('Lista achada! Enviando em 15s');
        await new Promise(r=>setTimeout(r,15000));
        await chat.sendMessage(MSG);
        enviado = hoje.toDateString();
        console.log('Enviado!');
    } catch(e){ console.log(e.message); }
});

client.initialize();
require('http').createServer((_,res)=>res.end('online')).listen(process.env.PORT||3000);
