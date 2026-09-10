const fs = require('fs');
const path = require('path');

function apagarTudoSeTravar(mensagemErro){
    if(mensagemErro && mensagemErro.includes('Code: 21')){
        console.log('⚠️ Volume travado! Apagando tudo pra destravar...');
        try{
            fs.rmSync('/app/.wwebjs_auth', { recursive: true, force: true });
            console.log('Volume apagado, vai pedir QR novo limpo agora');
        }catch(e){ console.log('Erro ao apagar:', e.message); }
    }
}

// limpa antes de começar
try{ fs.rmSync('/app/.wwebjs_auth/bot-final/Default', { recursive: true, force: true }); }catch{}
try{ fs.rmSync('/app/.wwebjs_auth/bot-final', { recursive: true, force: true }); }catch{}

const { Client, LocalAuth } = require('whatsapp-web.js');

function start(){
    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth', clientId: 'bot-final' }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']
        },
        webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' }
    });

    client.on('qr', qr => console.log('QR: https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodeURIComponent(qr)));
    client.on('ready', () => console.log('✅ Bot conectado com sucesso! - PRONTO'));
    
    client.on('disconnected', r => {
        console.log('Desconectado', r, 'reconectar em 5s');
        setTimeout(start, 5000);
    });

    client.on('message', async m=>{
        if(!m.from.endsWith('@g.us')) return;
        const chat = await m.getChat().catch(()=>null);
        if(!chat || chat.name !== 'Universitário-Noite - Fortaleza') return;
        const hoje = new Date();
        if(hoje.getDay()!==2 && hoje.getDay()!==4) return;
        if((m.body||'').toLowerCase().includes('1.') && (m.body||'').toLowerCase().includes('fametro')){
            await new Promise(r=>setTimeout(r,15000));
            await chat.sendMessage('13. Pedro Henrique *Unifametro* 19:00 às 21:45 vv');
        }
    });

    client.initialize().catch(err=>{
        console.log('Erro initialize:', err.message);
        apagarTudoSeTravar(err.message);
        console.log('Tentando de novo em 10s...');
        setTimeout(start, 10000);
    });
}

start();
require('http').createServer((_,res)=>res.end('ok')).listen(process.env.PORT||3000);
