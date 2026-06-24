const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const companionDir = __dirname;
const exeName = 'arena-companion.exe';
const blobName = 'sea-prep.blob';
const exePath = path.join(companionDir, exeName);
const blobPath = path.join(companionDir, blobName);
const distDir = path.join(companionDir, 'dist');

console.log('[Build] Iniciando compilação do Companion App...');

// Função para escanear o executável do Node e encontrar a assinatura de fusível (sentinel) exata
function findSentinel(nodePath) {
    try {
        const nodeBinary = fs.readFileSync(nodePath);
        const prefix = 'NODE_SEA_FUSE_';
        const prefixBuffer = Buffer.from(prefix);
        
        let index = -1;
        for (let i = 0; i < nodeBinary.length - prefixBuffer.length; i++) {
            let match = true;
            for (let j = 0; j < prefixBuffer.length; j++) {
                if (nodeBinary[i + j] !== prefixBuffer[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                index = i;
                break;
            }
        }
        
        if (index !== -1) {
            const hashLength = 32;
            const sentinel = nodeBinary.toString('utf8', index, index + prefix.length + hashLength);
            return sentinel;
        }
    } catch (err) {
        console.error('[Build] Erro ao escanear o binário para encontrar o sentinel:', err.message);
    }
    return null;
}

try {
    // 1. Instalar dependências locais
    console.log('[Build] Instalando dependências locais (npm install)...');
    execSync('npm install', { cwd: companionDir, stdio: 'inherit' });

    // 2. Empacotar todo o código JS e dependências (como 'ws') em um arquivo único usando @vercel/ncc
    console.log('[Build] Empacotando dependências com @vercel/ncc...');
    execSync('npx -y @vercel/ncc build companion.js -o dist --minify', { cwd: companionDir, stdio: 'inherit' });

    // 3. Gerar o blob do SEA baseado no arquivo empacotado dist/index.js
    console.log('[Build] Gerando blob do Node.js SEA...');
    execSync('node --experimental-sea-config sea-config.json', { cwd: companionDir, stdio: 'inherit' });

    // 4. Descobrir o Sentinel do executável local
    console.log('[Build] Detectando assinatura de fusível (sentinel) do node.exe atual...');
    const sentinel = findSentinel(process.execPath);
    if (!sentinel) {
        throw new Error('Não foi possível encontrar a assinatura do fusível NODE_SEA_FUSE no binário do node.exe.');
    }
    console.log(`[Build] Assinatura detectada: ${sentinel}`);

    // 5. Copiar o executável do Node.exe atual
    console.log(`[Build] Copiando o binário do Node (${process.execPath}) para ${exeName}...`);
    fs.copyFileSync(process.execPath, exePath);

    // 6. Injetar o blob no executável usando postject
    console.log('[Build] Injetando o blob no executável usando npx postject...');
    const postjectCmd = `npx postject "${exePath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse ${sentinel}`;
    execSync(postjectCmd, { cwd: companionDir, stdio: 'inherit' });

    // 7. Limpeza de arquivos temporários e pasta dist
    console.log('[Build] Limpando arquivos temporários...');
    if (fs.existsSync(blobPath)) {
        fs.unlinkSync(blobPath);
    }
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }

    console.log(`\n[Build] COMPILADO COM SUCESSO! Executável gerado em:\n  => ${exePath}\n`);
} catch (err) {
    console.error('\n[Build] ERRO durante a compilação:', err.message);
    process.exit(1);
}
