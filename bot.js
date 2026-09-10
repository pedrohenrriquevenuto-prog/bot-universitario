const fs = require('fs');
const path = require('path');

// Limpa trava
function cleanLocks(dir){
    if(!fs.existsSync(dir)) return;
    try{
        fs.readdirSync(dir).forEach(f=>{
            const p = path.join(dir,f);
            try{
                if(fs.statSync(p).isDirectory()) cleanLocks(p);
                else if(f.includes('Singleton')) fs.unlinkSync(p);
            }catch{}
        });
    }catch{}
}
cleanLocks('/app/.wwebjs_auth');

const { Client, LocalAuth } = require('whatsapp-web.js');

let client;

function startBot(){
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth', clientId: 'bot-final' }),
        puppeteer: {
            headless: true,
            protocolTimeout: 180000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-extensions'
            ]
        },
        webVersionCache: { 
            type: 'remote', 
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' 
        },
        takeoverOnConflict: true,
        restartOnAuthFail: true
    });

    client.on('qr', qr => {
        console.log('QR NOVO: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(qr));
    });

    client.on('ready', () => {
        console.log('✅ Bot conectado com sucesso! - PRONTO - ATIVO AGORA');
    });

    client.on('disconnected', (reason) => {
        console.log('⚠️ Desconectado:', reason, '- Tentando reconectar em 5s...');
        setTimeout(() => {
            try{ client.destroy(); }catch{}
            startBot();
        }, 5000);
    });

    client.on('auth_failure', (m) => {
        console.log('Auth fail:', m);
    });

    const GRUPO='Universitário-Noite - Fortaleza';
    const MSG='13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv';
    let enviado=null;

    client.on('message', async m=>{
        try{
            if(!m.from.endsWith('@g.us')) return;
            const chat=await m.getChat().catch(()=>null);
            if(!chat || chat.name!==GRUPO) return;
            const hoje=new Date();
            const dia=hoje.getDay();
            if(dia!==2 && dia!==4) return; // só ter e qui
            if(enviado===hoje.toDateString()) return;
            const t=(m.body||'').toLowerCase();
            if(!t.includes('1.') || !t.includes('fametro')) return;
            console.log('Lista detectada! Aguardando 15s...');
            await new Promise(r=>setTimeout(r,15000));
            await chat.sendMessage(MSG);
            enviado=hoje.toDateString();
            console.log('✅ Mensagem enviada!');
        }catch(e){ console.log('Erro mensagem:', e.message); }
    });

    client.initialize().catch(e=>{
        console.log('Erro initialize:', e.message);
        setTimeout(startBot, 10000);
    });
}

startBot();

// Mantém o Railway como Active
require('http').createServer((_,res)=>res.end('Bot online')).listen(process.env.PORT||3000);

// Anti-crash: se der erro não fecha o processo
process.on('uncaughtException', e => console.log('uncaught:', e.message));
process.on('unhandledRejection', e => console.log('unhandled:', e?.message));
