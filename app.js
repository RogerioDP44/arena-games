// ==========================================
// ARENA GAMES - RETRO MATCHMAKER CONTROLLER
// ==========================================

// Lista de Jogos Clássicos Suportados (todos com suporte a Direct IP / servidor dedicado)
const GAMES_LIST = [
    // ── FPS & Ação ──────────────────────────────────────────────────────
    { id: 'cs16',      name: 'Counter-Strike 1.6',          icon: 'fa-crosshairs',   color: 'linear-gradient(135deg, #4b5320, #13170a)', protocol: 'udp', supportsCustomPort: true },
    { id: 'quake3',    name: 'Quake III Arena',              icon: 'fa-bolt',         color: 'linear-gradient(135deg, #c71585, #3a0022)', protocol: 'udp', supportsCustomPort: true },
    { id: 'doom',      name: 'Doom (1993)',                  icon: 'fa-fire',         color: 'linear-gradient(135deg, #1e5c1e, #071707)', protocol: 'udp', supportsCustomPort: false },
    { id: 'halflife',  name: 'Half-Life / Deathmatch',       icon: 'fa-flask',        color: 'linear-gradient(135deg, #c27c0a, #1a0f00)', protocol: 'udp', supportsCustomPort: true },
    { id: 'ut2004',    name: 'Unreal Tournament 2004',       icon: 'fa-bullseye',     color: 'linear-gradient(135deg, #b34700, #2d0000)', protocol: 'udp', supportsCustomPort: true },
    { id: 'bf1942',    name: 'Battlefield 1942',             icon: 'fa-explosion',    color: 'linear-gradient(135deg, #5a4a00, #1a1000)', protocol: 'udp', supportsCustomPort: true },
    { id: 'mohaa',     name: 'Medal of Honor: Allied Assault', icon: 'fa-medal',      color: 'linear-gradient(135deg, #4a3800, #0d0900)', protocol: 'udp', supportsCustomPort: true },
    // ── RTS ─────────────────────────────────────────────────────────────
    { id: 'aoe2',      name: 'Age of Empires II',            icon: 'fa-shield-halved',color: 'linear-gradient(135deg, #b8860b, #3b0066)', protocol: 'udp', supportsCustomPort: false },
    { id: 'starcraft', name: 'StarCraft: Brood War',         icon: 'fa-rocket',       color: 'linear-gradient(135deg, #0b457c, #001f3f)', protocol: 'udp', supportsCustomPort: false },
    { id: 'warcraft3', name: 'Warcraft III: Frozen Throne',  icon: 'fa-dragon',       color: 'linear-gradient(135deg, #0a3d8f, #001040)', protocol: 'tcp', supportsCustomPort: false },
    // ── RPG & Aventura ───────────────────────────────────────────────────
    { id: 'diablo1',   name: 'Diablo I / Hellfire',          icon: 'fa-dungeon',      color: 'linear-gradient(135deg, #4a0000, #0a0000)', protocol: 'tcp', supportsCustomPort: false },
    { id: 'diablo2',   name: 'Diablo II',                    icon: 'fa-skull',        color: 'linear-gradient(135deg, #8b0000, #110000)', protocol: 'tcp', supportsCustomPort: false },
    { id: 'homm3',     name: 'Heroes of Might & Magic III',  icon: 'fa-chess-knight', color: 'linear-gradient(135deg, #8b6914, #1a0f00)', protocol: 'tcp', supportsCustomPort: false },
    // ── Sandbox & Mundo Aberto ───────────────────────────────────────────
    { id: 'terraria',  name: 'Terraria',                     icon: 'fa-tree',         color: 'linear-gradient(135deg, #2d7a2d, #1a4a0a)', protocol: 'tcp', supportsCustomPort: true },
    { id: 'minecraft', name: 'Minecraft Java Edition',       icon: 'fa-cube',         color: 'linear-gradient(135deg, #5a8a1a, #2d3a00)', protocol: 'tcp', supportsCustomPort: true },
    // ── Outros ──────────────────────────────────────────────────────────
    { id: 'worms',     name: 'Worms Armageddon',             icon: 'fa-worm',         color: 'linear-gradient(135deg, #4a7c00, #1a0066)', protocol: 'tcp', supportsCustomPort: false },
    { id: 'samp',      name: 'GTA: SA-MP',                   icon: 'fa-car',          color: 'linear-gradient(135deg, #7b1fa2, #00b0ff)', protocol: 'udp', supportsCustomPort: true },
    { id: 'custom',    name: 'Outro / Custom',               icon: 'fa-puzzle-piece', color: 'linear-gradient(135deg, #374151, #1f2937)', protocol: 'udp', supportsCustomPort: true }
];

// Sintetizador de Áudio 8-Bit (Arcade Sound Effects) via Web Audio API
const AudioSynth = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playClick() {
        if (state.isMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    },
    playCoin() {
        if (state.isMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // nota Si5
        osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.07); // nota Mi6
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },
    playLaser() {
        if (state.isMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },
    playChat() {
        if (state.isMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // nota Dó5
        osc.frequency.exponentialRampToValueAtTime(783.99, this.ctx.currentTime + 0.07); // nota Sol5
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
};

// Dicionário de Idiomas
const TRANSLATIONS = {
    'pt-BR': {
        hero_title: 'Encontre parceiros para jogar clássicos por IP',
        hero_subtitle: 'Crie salas em tempo real ou junte-se a partidas ativas agora mesmo.',
        search_placeholder: 'Buscar salas ou jogos...',
        active_rooms: 'Salas Ativas',
        btn_host: 'Hospedar Sala',
        loading_rooms: 'Carregando salas...',
        no_rooms_found: 'Nenhuma sala ativa encontrada. Que tal criar uma?',
        back_to_list: 'Voltar para a lista',
        hosted_by: 'Hospedado por',
        connection_details: 'Detalhes de Conexão Direct IP',
        active_status: 'Ativa',
        btn_copy: 'Copiar IP',
        btn_copied: 'Copiado!',
        connection_tip: 'Abra o jogo multiplayer do lobby, selecione a opção de conexão TCP/IP ou Direct IP e insira o endereço acima.',
        players_in_lobby: 'Jogadores na Sala',
        lobby_chat: 'Chat da Sala',
        chat_placeholder: 'Digite sua mensagem...',
        btn_confirm: 'Confirmar',
        modal_create_title: 'Hospedar Nova Sala',
        label_room_title: 'Título da Sala',
        label_game: 'Jogo Clássico',
        label_ip: 'Endereço IP (Host)',
        label_port: 'Porta (Opcional)',
        label_max_players: 'Máximo de Jogadores',
        label_password: 'Senha da Sala (Opcional)',
        label_desc: 'Descrição / Detalhes de Conexão',
        btn_cancel: 'Cancelar',
        btn_create: 'Criar Sala',
        footer_rights: 'Todos os direitos reservados. Feito com ❤️ para gamers nostálgicos.',
        system_joined: 'entrou na sala',
        system_left: 'saiu da sala',
        fill_all_fields: 'Por favor, preencha todos os campos obrigatórios.',
        login_title: 'Entrar na Arena',
        btn_login: 'Entrar',
        dont_have_account: 'Não tem uma conta?',
        switch_register: 'Cadastre-se',
        register_title: 'Criar Conta',
        btn_register: 'Cadastrar',
        already_have_account: 'Já tem uma conta?',
        switch_login: 'Fazer Login',
        modal_profile_title: 'Editar Perfil',
        profile_nickname_label: 'Seu Apelido',
        profile_avatar_label: 'URL da Foto de Perfil (Avatar)',
        avatar_presets_label: 'Ou selecione um estilo retro:',
        btn_save_profile: 'Salvar Perfil',
        profile_saved: 'Perfil atualizado com sucesso!',
        btn_share: 'Compartilhar Sala',
        share_success: 'Link de compartilhamento copiado para a área de transferência!',
        footer_privacy: 'Políticas de Privacidade (LGPD)',
        modal_privacy_title: 'Políticas de Privacidade (LGPD)',
        cookie_text: 'Nós usamos cookies e armazenamento local para melhorar sua experiência retrô no Arena Games, alinhado com a LGPD.',
        cookie_link: 'saber mais',
        cookie_btn_accept: 'Aceitar',
        btn_close: 'Fechar',
        privacy_sec1_title: '1. Coleta de Dados',
        privacy_sec1_text: 'O Arena Games coleta apenas as informações necessárias para possibilitar o matchmaking de jogos retrô em tempo real. Isso inclui seu apelido (nickname) e a imagem de perfil (avatar) que você escolher ao se cadastrar ou editar seu perfil.',
        privacy_sec2_title: '2. Cookies e Armazenamento Local',
        privacy_sec2_text: 'Utilizamos o armazenamento local do navegador (localStorage) para salvar suas preferências, como idioma e controle de áudio, além da sua sessão ativa de login. Também podem ser exibidos anúncios de terceiros que utilizam cookies para otimização de campanhas publicitárias.',
        privacy_sec3_title: '3. Seus Direitos (LGPD)',
        privacy_sec3_text: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem total controle sobre seus dados. Você pode alterar seu apelido e avatar a qualquer momento na seção de perfil ou excluir as informações limpando os dados de navegação.',
        privacy_sec4_title: '4. Segurança',
        privacy_sec4_text: 'As senhas das salas criadas são processadas com verificação server-side de segurança (RPC) no banco de dados e nunca são expostas aos demais usuários.'
    },
    'en': {
        hero_title: 'Find partners to play classic games via Direct IP',
        hero_subtitle: 'Create real-time lobbies or join active matches right now.',
        search_placeholder: 'Search rooms or games...',
        active_rooms: 'Active Lobbies',
        btn_host: 'Host Room',
        loading_rooms: 'Loading rooms...',
        no_rooms_found: 'No active rooms found. How about hosting one?',
        back_to_list: 'Back to list',
        hosted_by: 'Hosted by',
        connection_details: 'Direct IP Connection Details',
        active_status: 'Active',
        btn_copy: 'Copy IP',
        btn_copied: 'Copied!',
        connection_tip: 'Open the multiplayer menu in your game, select TCP/IP or Direct IP connection, and enter the address above.',
        players_in_lobby: 'Players in Room',
        lobby_chat: 'Room Chat',
        chat_placeholder: 'Type your message...',
        btn_confirm: 'Confirm',
        modal_create_title: 'Host New Room',
        label_room_title: 'Room Title',
        label_game: 'Classic Game',
        label_ip: 'Host IP Address',
        label_port: 'Port (Optional)',
        label_max_players: 'Max Players',
        label_password: 'Room Password (Optional)',
        label_desc: 'Description / Connection Details',
        btn_cancel: 'Cancel',
        btn_create: 'Create Room',
        footer_rights: 'All rights reserved. Made with ❤️ for nostalgic gamers.',
        system_joined: 'joined the room',
        system_left: 'left the room',
        fill_all_fields: 'Please fill out all required fields.',
        login_title: 'Enter the Arena',
        btn_login: 'Login',
        dont_have_account: 'Don\'t have an account?',
        switch_register: 'Sign Up',
        register_title: 'Create Account',
        btn_register: 'Register',
        already_have_account: 'Already have an account?',
        switch_login: 'Login here',
        modal_profile_title: 'Edit Profile',
        profile_nickname_label: 'Your Nickname',
        profile_avatar_label: 'Profile Picture URL (Avatar)',
        avatar_presets_label: 'Or select a retro style:',
        btn_save_profile: 'Save Profile',
        profile_saved: 'Profile updated successfully!',
        btn_share: 'Share Room',
        share_success: 'Share link copied to clipboard!',
        footer_privacy: 'Privacy Policies (LGPD)',
        modal_privacy_title: 'Privacy Policies (LGPD)',
        cookie_text: 'We use cookies and local storage to improve your retro experience on Arena Games, in compliance with LGPD.',
        cookie_link: 'learn more',
        cookie_btn_accept: 'Accept',
        btn_close: 'Close',
        privacy_sec1_title: '1. Data Collection',
        privacy_sec1_text: 'Arena Games collects only the information necessary to enable real-time matchmaking for retro games. This includes your nickname and profile picture (avatar) that you choose when registering or editing your profile.',
        privacy_sec2_title: '2. Cookies and Local Storage',
        privacy_sec2_text: 'We use browser local storage (localStorage) to save your preferences, such as language and audio controls, as well as your active login session. Third-party advertisements may also be displayed, using cookies for advertising campaign optimization.',
        privacy_sec3_title: '3. Your Rights (LGPD)',
        privacy_sec3_text: 'In compliance with the General Data Protection Law (LGPD), you have full control over your data. You can change your nickname and avatar at any time in the profile section or delete this information by clearing your browser data.',
        privacy_sec4_title: '4. Security',
        privacy_sec4_text: 'Passwords for created rooms are processed with secure server-side verification (RPC) in the database and are never exposed to other users.'
    }
};

// Estado da Aplicação
let state = {
    supabaseUrl: 'https://ktolhnpbeimrqeygxvjj.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b2xobnBiZWltcnFleWd4dmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzg3NDMsImV4cCI6MjA5NzgxNDc0M30.cXK8ta7JlwhS_oshzyWEu8rQ06Yym6_ILQWRbLrUvUE',
    supabase: null,
    user: null,
    profile: {
        username: 'Jogador',
        avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'
    },
    language: 'pt-BR',
    activeFilter: 'all',
    searchQuery: '',
    currentLobby: null,
    lobbiesSubscription: null,
    currentLobbyDbSubscription: null,
    lobbyPresenceChannel: null,
    presenceInitialSyncDone: false,
    isMuted: false,
    companionWs: null,
    companionStatus: 'offline', // 'offline', 'connected'
    companionTunnelActive: false
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carregar Idioma
    const savedLang = localStorage.getItem('arena_lang');
    if (savedLang) {
        state.language = savedLang;
    } else {
        const navLang = navigator.language;
        state.language = navLang.startsWith('en') ? 'en' : 'pt-BR';
    }
    updateLanguageButtons();
    applyTranslations();

    // Carregar preferência de áudio
    state.isMuted = localStorage.getItem('arena_muted') === 'true';
    updateAudioBtnIcon();

    // 2. Inicializar Filtros de Jogos
    renderGameFilters();
    populateGameSelect();

    // Auto-preencher porta ao selecionar o jogo
    const gameSelect = document.getElementById('room-game');
    if (gameSelect) {
        gameSelect.addEventListener('change', handleGameSelectChange);
    }

    // 3. Configurar Event Listeners de Busca
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderLobbies();
    });

    // Desbloquear áudio após interação do usuário (exigência de navegadores modernos)
    document.body.addEventListener('click', () => {
        AudioSynth.init();
    }, { once: true });

    // Suporte a tecla Enter no modal de senha
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.getElementById('password-modal')?.style.display === 'flex') {
            e.preventDefault();
            confirmPasswordAndJoin();
        }
        if (e.key === 'Escape' && document.getElementById('password-modal')?.style.display === 'flex') {
            closePasswordModal();
        }
        if (e.key === 'Escape' && document.getElementById('privacy-modal')?.style.display === 'flex') {
            closePrivacyModal();
        }
    });

    // 4. Iniciar Cookies Banner
    if (localStorage.getItem('arena_cookies_accepted') !== 'true') {
        document.getElementById('cookie-consent').style.display = 'flex';
    }

    // 5. Iniciar Conexão com o Companion App Local
    connectToLocalCompanion();
});

// Aguarda todos os recursos (incluindo CDN do Supabase) carregarem antes de inicializar
window.addEventListener('load', () => {
    initSupabase();
});

// Auxiliar: Timeout para promessas que podem travar
function withTimeout(promise, ms = 10000) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
}

// Alternar controle de áudio Mute/Unmute
function toggleMute() {
    state.isMuted = !state.isMuted;
    localStorage.setItem('arena_muted', state.isMuted);
    updateAudioBtnIcon();
    if (!state.isMuted) {
        AudioSynth.playClick();
    }
}

function updateAudioBtnIcon() {
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
        btn.innerHTML = state.isMuted 
            ? '<i class="fa-solid fa-volume-xmark" style="color: var(--accent-pink);"></i>' 
            : '<i class="fa-solid fa-volume-high" style="color: var(--accent-cyan);"></i>';
    }
}

// Inicializar cliente Supabase e monitorar autenticação
function initSupabase() {
    // Evitar inicialização dupla
    if (state.supabase) return;

    try {
        // O SDK Supabase v2 via CDN expõe window.supabase com createClient
        const supabaseLib = window.supabase;
        if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
            console.error('Supabase SDK não carregado. Verifique a conexão com a internet.');
            showNotification('Erro: SDK não carregado. Recarregue a página.', 'error');
            return;
        }

        state.supabase = supabaseLib.createClient(state.supabaseUrl, state.supabaseKey);
        console.log('Supabase inicializado com sucesso.');
        
        // Escutar alterações de autenticação (Login / Cadastro / Logout)
        state.supabase.auth.onAuthStateChange((event, session) => {
            // Ignorar eventos duplicados que não mudam estado
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

            if (session) {
                state.user = session.user;

                // Usar dados do JWT imediatamente (sem consultar o banco)
                const meta = session.user.user_metadata || {};
                const nick = meta.username || session.user.email?.split('@')[0] || 'Jogador';
                const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${session.user.id}`;
                state.profile = { username: nick, avatar_url: avatar };

                // Mostrar a interface da aplicação e ocultar tela de login
                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('app-content').style.display = 'flex';

                // Atualizar header com dados do JWT e gerenciar interface de login
                updateAuthUI();

                // Carregar perfil completo do banco em segundo plano (não bloqueia)
                loadUserProfile().catch(err => console.warn('Perfil não carregado:', err));

                // Buscar lobbies e assinar tempo real (apenas se ainda não inscrito)
                subscribeToLobbies();
                fetchLobbies();

                // Verificar se há uma sala compartilhada ou pendente
                if (state.pendingSharedLobbyId) {
                    const pendingId = state.pendingSharedLobbyId;
                    state.pendingSharedLobbyId = null;
                    joinLobby(pendingId);
                } else {
                    checkSharedLobby();
                }
            } else {
                state.user = null;
                state.profile = { username: 'Jogador', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default' };
                
                // Cancelar inscrição realtime ao sair
                if (state.lobbiesSubscription) {
                    state.supabase.removeChannel(state.lobbiesSubscription);
                    state.lobbiesSubscription = null;
                }
                if (state.currentLobbyDbSubscription) {
                    state.supabase.removeChannel(state.currentLobbyDbSubscription);
                    state.currentLobbyDbSubscription = null;
                }

                // Mostrar conteúdo mesmo não logado (hóspedes navegam livremente)
                document.getElementById('app-content').style.display = 'flex';
                document.getElementById('auth-screen').style.display = 'none';
                updateAuthUI();

                // Buscar lobbies públicos mesmo não logado
                subscribeToLobbies();
                fetchLobbies();
            }
        });
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        showNotification('Erro crítico ao inicializar. Recarregue a página.', 'error');
    }
}

// Carregar perfil completo do usuário autenticado (em segundo plano)
async function loadUserProfile() {
    if (!state.supabase || !state.user) return;

    try {
        const { data, error } = await withTimeout(
            state.supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', state.user.id)
                .single(),
            8000
        );

        if (error || !data) {
            // Perfil não existe ainda — criar com dados do JWT
            const defaultNick = state.user.user_metadata?.username
                || (state.user.email ? state.user.email.split('@')[0] : 'Jogador');
            const defaultAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.user.id}`;

            await withTimeout(
                state.supabase.from('profiles').upsert([{
                    id: state.user.id,
                    username: defaultNick,
                    avatar_url: defaultAvatar
                }]),
                8000
            );

            state.profile = { username: defaultNick, avatar_url: defaultAvatar };
        } else {
            state.profile = data;
        }
    } catch (err) {
        console.warn('[Arena] loadUserProfile falhou (RLS ou timeout):', err.message);
        // Usa dados do JWT como fallback — já foram definidos no callback
    }

    // Atualizar cabeçalho com dados do banco
    document.getElementById('user-display-name').textContent = state.profile.username;
    document.getElementById('user-avatar-img').src = state.profile.avatar_url;
}

// ==========================================
// SEÇÃO: AUTENTICAÇÃO (LOGIN & REGISTRO)
// ==========================================

function toggleAuthForms(showRegister) {
    document.getElementById('login-form').style.display = showRegister ? 'none' : 'block';
    document.getElementById('register-form').style.display = showRegister ? 'block' : 'none';
}

async function handleLoginSubmit(e) {
    e.preventDefault();

    if (!state.supabase) {
        showNotification('Aguarde... conectando ao servidor. Tente novamente em instantes.', 'error');
        return;
    }

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button[type="submit"]');

    // Mostrar loading no botão
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Entrando...';

    try {
        console.log('[Arena] Tentando login com:', email);
        const result = await withTimeout(
            state.supabase.auth.signInWithPassword({ email, password }),
            10000
        );
        console.log('[Arena] Resposta do Supabase:', JSON.stringify(result));

        const { error } = result;

        btn.disabled = false;
        btn.innerHTML = originalHtml;

        if (error) {
            console.error('[Arena] Erro de login:', error);
            // Traduz erros comuns do Supabase
            let msg = error.message;
            if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.';
            else if (msg.includes('Email not confirmed')) msg = 'Confirme seu e-mail antes de entrar.';
            else if (msg.includes('Too many requests')) msg = 'Muitas tentativas. Aguarde antes de tentar novamente.';
            showNotification('Erro ao entrar: ' + msg, 'error');
        } else {
            console.log('[Arena] Login bem-sucedido!');
            AudioSynth.playCoin();
        }
    } catch (err) {
        console.error('[Arena] Exceção no login:', err);
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        if (err.message === 'TIMEOUT') {
            showNotification('⏱ Tempo esgotado! O servidor Supabase pode estar hibernando. Acesse o dashboard do Supabase e reactive o projeto, depois tente novamente.', 'error');
        } else {
            showNotification('Erro de conexão: ' + err.message, 'error');
        }
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();

    if (!state.supabase) {
        showNotification('Aguarde... conectando ao servidor. Tente novamente em instantes.', 'error');
        return;
    }

    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const nickname = document.getElementById('register-nickname').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');

    // Mostrar loading no botão
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Cadastrando...';

    try {
        const { data, error } = await withTimeout(
            state.supabase.auth.signUp({
                email,
                password,
                options: { data: { username: nickname } }
            }),
            10000
        );

        btn.disabled = false;
        btn.innerHTML = originalHtml;

        if (error) {
            showNotification('Erro ao cadastrar: ' + error.message, 'error');
        } else {
            AudioSynth.playCoin();
            showNotification('Cadastro realizado! Verifique seu e-mail para confirmar a conta.', 'success');
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        if (err.message === 'TIMEOUT') {
            showNotification('⏱ Tempo esgotado! O projeto Supabase pode estar hibernando. Acesse o dashboard e reative.', 'error');
        } else {
            showNotification('Erro de conexão: ' + err.message, 'error');
        }
    }
}

async function handleLogout() {
    if (state.currentLobby) {
        await leaveCurrentLobby();
    }
    if (state.lobbiesSubscription) {
        state.supabase.removeChannel(state.lobbiesSubscription);
        state.lobbiesSubscription = null;
    }
    await state.supabase.auth.signOut();
}

// ==========================================
// SEÇÃO: PERFIL DE USUÁRIO
// ==========================================

function openProfileModal() {
    document.getElementById('profile-nickname').value = state.profile.username;
    document.getElementById('profile-avatar-url').value = state.profile.avatar_url;
    document.getElementById('profile-avatar-preview').src = state.profile.avatar_url;
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function updateAvatarPreview(url) {
    const preview = document.getElementById('profile-avatar-preview');
    if (url) {
        preview.src = url;
    } else {
        preview.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.user.id}`;
    }
}

function selectAvatarPreset(seed) {
    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
    document.getElementById('profile-avatar-url').value = avatarUrl;
    updateAvatarPreview(avatarUrl);
}

async function saveProfile() {
    const nickname = document.getElementById('profile-nickname').value.trim();
    const avatarUrl = document.getElementById('profile-avatar-url').value.trim();

    if (!nickname) {
        alert(getTranslation('fill_all_fields'));
        return;
    }

    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.user.id}`;

    const { error } = await state.supabase
        .from('profiles')
        .update({
            username: nickname,
            avatar_url: finalAvatar,
            updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);

    if (error) {
        console.error('Erro ao salvar perfil:', error);
        showNotification('Erro ao atualizar perfil.', 'error');
    } else {
        state.profile.username = nickname;
        state.profile.avatar_url = finalAvatar;
        
        // Atualizar topo
        document.getElementById('user-display-name').textContent = nickname;
        document.getElementById('user-avatar-img').src = finalAvatar;
        
        // Se estiver num lobby, atualizar presença
        if (state.currentLobby && state.lobbyPresenceChannel) {
            await state.lobbyPresenceChannel.track({
                nickname: nickname,
                avatar_url: finalAvatar,
                online_at: new Date().toISOString()
            });
        }
        
        closeProfileModal();
        showNotification(getTranslation('profile_saved'), 'success');
    }
}

// ==========================================
// SEÇÃO: IDIOMA & DICIONÁRIO
// ==========================================

function setLanguage(lang) {
    state.language = lang;
    localStorage.setItem('arena_lang', lang);
    updateLanguageButtons();
    applyTranslations();
    renderGameFilters();
    populateGameSelect();
    if (state.supabase && state.user) {
        fetchLobbies();
    }
}

function updateLanguageButtons() {
    document.getElementById('lang-btn-pt').classList.toggle('active', state.language === 'pt-BR');
    document.getElementById('lang-btn-en').classList.toggle('active', state.language === 'en');
}

function applyTranslations() {
    const dict = TRANSLATIONS[state.language];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.setAttribute('placeholder', dict[key]);
        }
    });
}

function getTranslation(key) {
    return TRANSLATIONS[state.language][key] || key;
}

// ==========================================
// SEÇÃO: RENDERIZAÇÃO DO FILTRO DE JOGOS
// ==========================================

function renderGameFilters() {
    const container = document.getElementById('game-filters-container');
    container.innerHTML = '';

    const allChip = document.createElement('div');
    allChip.className = `filter-chip ${state.activeFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `<i class="fa-solid fa-border-all"></i> <span>${state.language === 'en' ? 'All Games' : 'Todos'}</span>`;
    allChip.onclick = () => selectFilter('all');
    container.appendChild(allChip);

    GAMES_LIST.forEach(game => {
        const chip = document.createElement('div');
        chip.className = `filter-chip ${state.activeFilter === game.id ? 'active' : ''}`;
        chip.innerHTML = `<i class="fa-solid ${game.icon}"></i> <span>${game.name}</span>`;
        chip.onclick = () => selectFilter(game.id);
        container.appendChild(chip);
    });
}

function populateGameSelect() {
    const select = document.getElementById('room-game');
    select.innerHTML = '';
    
    GAMES_LIST.forEach(game => {
        const opt = document.createElement('option');
        opt.value = game.id;
        opt.textContent = game.name;
        select.appendChild(opt);
    });
}

function selectFilter(filterId) {
    AudioSynth.playClick();
    state.activeFilter = filterId;
    renderGameFilters();
    renderLobbies();
}

// ==========================================
// SEÇÃO: CONTROLLER DOS LOBBIES (TEMPO REAL)
// ==========================================

let activeLobbiesList = [];

async function fetchLobbies() {
    if (!state.supabase) return;

    // Limpeza passiva de salas fantasma em background (sem bloquear o carregamento)
    state.supabase.rpc('cleanup_stale_lobbies').then(({ data, error }) => {
        if (!error && data > 0) {
            console.log(`[Arena] ${data} sala(s) fantasma removidas automaticamente.`);
        }
    });

    // Nunca incluir o campo 'password' — verificação é feita server-side via RPC
    const { data, error } = await state.supabase
        .from('lobbies')
        .select('id, title, game, description, host_name, host_id, ip_address, port, max_players, active_players, is_active, created_at, has_password')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar lobbies:', error);
        return;
    }

    activeLobbiesList = data;
    renderLobbies();
}

function subscribeToLobbies() {
    if (!state.supabase) return;

    // Evitar inscrição duplicada
    if (state.lobbiesSubscription) {
        state.supabase.removeChannel(state.lobbiesSubscription);
        state.lobbiesSubscription = null;
    }

    state.lobbiesSubscription = state.supabase
        .channel('public:lobbies')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const exists = activeLobbiesList.some(l => l.id === payload.new.id);
                if (!exists) {
                    activeLobbiesList.unshift(payload.new);
                }
            } else if (payload.eventType === 'UPDATE') {
                const idx = activeLobbiesList.findIndex(l => l.id === payload.new.id);
                if (idx !== -1) {
                    if (payload.new.is_active) {
                        activeLobbiesList[idx] = payload.new;
                    } else {
                        activeLobbiesList.splice(idx, 1);
                    }
                } else if (payload.new.is_active) {
                    activeLobbiesList.unshift(payload.new);
                }
            } else if (payload.eventType === 'DELETE') {
                activeLobbiesList = activeLobbiesList.filter(l => l.id !== payload.old.id);
            }
            renderLobbies();
        })
        .subscribe((status, err) => {
            console.log('[Arena] Lobbies subscription status:', status, err);
        });
}

function renderLobbies() {
    const grid = document.getElementById('lobbies-grid');
    grid.innerHTML = '';

    const filtered = activeLobbiesList.filter(lobby => {
        const matchesFilter = state.activeFilter === 'all' || lobby.game === state.activeFilter;
        const gameObj = GAMES_LIST.find(g => g.id === lobby.game);
        const gameName = gameObj ? gameObj.name.toLowerCase() : '';
        const matchesSearch = lobby.title.toLowerCase().includes(state.searchQuery) || gameName.includes(state.searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ghost"></i>
                <p>${getTranslation('no_rooms_found')}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(lobby => {
        const gameObj = GAMES_LIST.find(g => g.id === lobby.game) || GAMES_LIST[GAMES_LIST.length - 1];
        const isFull = lobby.active_players >= lobby.max_players;
        const hasPassword = !!lobby.has_password;

        const card = document.createElement('div');
        card.className = 'lobby-card';
        card.innerHTML = `
            <div class="lobby-card-header">
                <span class="lobby-game-tag" style="background: ${gameObj.color.replace('135deg', '90deg')}; color: white;">
                    <i class="fa-solid ${gameObj.icon}"></i> ${gameObj.name}
                </span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${hasPassword ? '<span class="lobby-lock-badge" title="Sala com senha"><i class="fa-solid fa-lock"></i></span>' : ''}
                    <span class="lobby-players-status ${isFull ? 'full' : ''}">
                        <i class="fa-solid fa-users"></i> ${lobby.active_players}/${lobby.max_players}
                    </span>
                </div>
            </div>
            <div class="lobby-card-body">
                <h4>${escapeHtml(lobby.title)}</h4>
                <p>${escapeHtml(lobby.description || '')}</p>
            </div>
            <div class="lobby-card-footer">
                <span class="lobby-host">${getTranslation('hosted_by')}: <strong>${escapeHtml(lobby.host_name)}</strong></span>
                <button class="btn btn-secondary btn-sm" onclick="tryJoinLobby('${lobby.id}')" ${isFull ? 'disabled' : ''}>
                    ${isFull ? 'Full' : (hasPassword ? '<i class="fa-solid fa-lock" style="font-size:0.7rem;"></i> Join' : 'Join')}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// SEÇÃO: VERIFICAR SENHA E ENTRAR NA SALA
// ==========================================

// ID do lobby aguardando confirmação de senha
let pendingLobbyId = null;

// Tentar entrar num lobby: abre modal de senha se necessário
function tryJoinLobby(lobbyId) {
    if (!state.user) {
        showNotification(state.language === 'en' ? 'Please log in to join a room.' : 'Por favor, faça login para entrar em uma sala.', 'info');
        openAuthModal();
        return;
    }
    const lobby = activeLobbiesList.find(l => l.id === lobbyId);

    // Se a sala tem senha, pedir antes de entrar
    if (lobby && lobby.has_password) {
        pendingLobbyId = lobbyId;

        // Resetar estado do modal
        const input = document.getElementById('room-password-input');
        const errorMsg = document.getElementById('pwd-error-msg');
        if (input) input.value = '';
        if (errorMsg) errorMsg.style.display = 'none';

        // Traduzir textos do modal
        const title = document.getElementById('pwd-modal-title');
        const desc = document.getElementById('pwd-modal-desc');
        const btn = document.getElementById('pwd-confirm-btn');
        if (title) title.textContent = state.language === 'en' ? 'Protected Room' : 'Sala Protegida';
        if (desc) desc.textContent = state.language === 'en'
            ? `"${lobby.title}" requires a password to join.`
            : `"${lobby.title}" requer uma senha para entrar.`;
        if (btn) btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> ${state.language === 'en' ? 'Join' : 'Entrar'}`;

        document.getElementById('password-modal').style.display = 'flex';
        setTimeout(() => input && input.focus(), 100);
    } else {
        // Sala sem senha: entrar direto
        joinLobby(lobbyId);
    }
}

function closePasswordModal() {
    document.getElementById('password-modal').style.display = 'none';
    pendingLobbyId = null;
    const errorMsg = document.getElementById('pwd-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';
}

async function confirmPasswordAndJoin() {
    if (!pendingLobbyId || !state.supabase) return;

    const input = document.getElementById('room-password-input');
    const entered = input ? input.value.trim() : '';
    if (!entered) return;

    // Feedback visual de carregamento
    const btn = document.getElementById('pwd-confirm-btn');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    }

    try {
        // Verificação server-side via RPC — a senha NUNCA é comparada no cliente
        const { data: isValid, error } = await state.supabase
            .rpc('verify_lobby_password', {
                lobby_id: pendingLobbyId,
                entered_password: entered
            });

        if (error) {
            console.error('Erro ao verificar senha:', error);
            showNotification(
                state.language === 'en' ? 'Error verifying password. Try again.' : 'Erro ao verificar senha. Tente novamente.',
                'error'
            );
            if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
            return;
        }

        if (isValid) {
            // Senha correta — entrar na sala
            AudioSynth.playCoin();
            const id = pendingLobbyId;
            closePasswordModal();
            joinLobby(id);
        } else {
            // Senha errada — feedback visual sem fechar o modal
            if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
            AudioSynth.playClick();
            const errorMsg = document.getElementById('pwd-error-msg');
            const errorText = document.getElementById('pwd-error-text');
            if (errorText) errorText.textContent = state.language === 'en' ? 'Wrong password. Try again.' : 'Senha incorreta. Tente novamente.';
            if (errorMsg) errorMsg.style.display = 'block';
            if (input) {
                input.style.borderColor = 'var(--accent-pink)';
                input.style.boxShadow = '0 0 10px rgba(255, 0, 127, 0.4)';
                input.value = '';
                input.focus();
                setTimeout(() => { input.style.borderColor = ''; input.style.boxShadow = ''; }, 1500);
            }
        }
    } catch (err) {
        console.error('Erro inesperado na verificação de senha:', err);
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        showNotification(
            state.language === 'en' ? 'Connection error.' : 'Erro de conexão.',
            'error'
        );
    }
}


function openCreateRoomModal() {
    if (!state.user) {
        showNotification(state.language === 'en' ? 'Please log in to host a room.' : 'Por favor, faça login para hospedar uma sala.', 'info');
        openAuthModal();
        return;
    }
    document.getElementById('create-room-modal').style.display = 'flex';
    
    // Auto-preencher a porta padrão
    handleGameSelectChange();
}

function closeCreateRoomModal() {
    document.getElementById('create-room-modal').style.display = 'none';
}

async function submitCreateRoom(e) {
    e.preventDefault();
    if (!state.supabase || !state.user) return;

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>...';

    try {
        // Verificar se o usuário já tem 2 ou mais salas ativas no Supabase
        const { data: userLobbies, error: countError } = await state.supabase
            .from('lobbies')
            .select('id')
            .eq('host_id', state.user.id)
            .eq('is_active', true);

        if (countError) {
            console.error('Erro ao verificar limite de salas:', countError);
        } else if (userLobbies && userLobbies.length >= 2) {
            showNotification(
                state.language === 'en' 
                    ? 'Limit reached! You can only host up to 2 active rooms. Close an existing room first.' 
                    : 'Limite atingido! Você só pode hospedar até 2 salas ativas. Encerre uma sala antes de criar outra.', 
                'error'
            );
            return;
        }

        const title = document.getElementById('room-title').value.trim();
        const game = document.getElementById('room-game').value;
        const connType = document.getElementById('room-conn-type').value;
        const ip = document.getElementById('room-ip').value.trim();
        const port = document.getElementById('room-port').value.trim();
        const maxPlayers = parseInt(document.getElementById('room-max-players').value);
        const password = document.getElementById('room-password').value.trim();
        const description = document.getElementById('room-description').value.trim();

        // Garantir que o perfil existe antes (evita violação de FK)
        const nick = state.profile?.username
            || state.user.user_metadata?.username
            || state.user.email?.split('@')[0]
            || 'Jogador';
        const avatar = state.profile?.avatar_url
            || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.user.id}`;

        await state.supabase.from('profiles').upsert([
            { id: state.user.id, username: nick, avatar_url: avatar }
        ], { onConflict: 'id' });

        const finalIp = connType === 'companion' ? '127.0.0.1' : ip;

        const { data, error } = await state.supabase
            .from('lobbies')
            .insert([{
                title,
                game,
                ip_address: finalIp,
                port: port || null,
                max_players: maxPlayers,
                password: password || null,
                has_password: !!password,
                description: description || null,
                host_name: nick,
                host_id: state.user.id,
                active_players: 1,
                is_active: true,
                connection_type: connType
            }])
            .select('id, title, game, description, host_name, host_id, ip_address, port, max_players, active_players, is_active, created_at, has_password, connection_type');

        if (error) {
            console.error('Erro ao criar sala:', error);
            let errMsg = error.message || 'Erro desconhecido';
            if (errMsg.includes('violates row-level security')) errMsg = 'Permissão negada (RLS). Verifique as políticas da tabela lobbies no Supabase.';
            else if (errMsg.includes('foreign key')) errMsg = 'Perfil de usuário não encontrado. Tente sair e entrar novamente.';
            showNotification('Erro ao criar sala: ' + errMsg, 'error');
            return;
        }

        AudioSynth.playCoin();
        closeCreateRoomModal();
        if (data && data[0]) {
            joinLobby(data[0].id);
        }
    } catch (err) {
        console.warn('Erro ao criar sala:', err);
        showNotification('Erro inesperado ao criar sala: ' + err.message, 'error');
    } finally {
        // Sempre reativar o botão ao terminar, independentemente do resultado
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

// ==========================================
// SEÇÃO: DETALHES DO LOBBY E CHAT (TEMPO REAL)
// ==========================================

async function joinLobby(lobbyId) {
    if (!state.supabase || !state.user) return;

    // Nunca incluir o campo 'password' — verificação é server-side via RPC
    const { data, error } = await state.supabase
        .from('lobbies')
        .select('id, title, game, description, host_name, host_id, ip_address, port, max_players, active_players, is_active, created_at, has_password, connection_type')
        .eq('id', lobbyId)
        .single();

    if (error || !data) {
        console.error('Erro ao entrar na sala:', error);
        showNotification('Esta sala não existe mais.', 'error');
        return;
    }

    state.currentLobby = data;
    AudioSynth.playLaser();

    const gameObj = GAMES_LIST.find(g => g.id === data.game) || GAMES_LIST[GAMES_LIST.length - 1];
    const banner = document.getElementById('lobby-game-banner');
    banner.style.background = gameObj.color;
    banner.innerHTML = `<i class="fa-solid ${gameObj.icon}" style="font-size: 2rem; margin-right: 10px;"></i> ${gameObj.name}`;

    document.getElementById('lobby-detail-title').textContent = data.title;
    document.getElementById('lobby-detail-host').textContent = data.host_name;
    document.getElementById('lobby-detail-desc').innerHTML = linkify(data.description || '');
    
    // O contador de jogadores será atualizado pelo sistema de presença (updatePlayersList)
    document.getElementById('lobby-players-count').textContent = `?/${data.max_players}`;

    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('lobby-view').style.display = 'flex';

    // Renderizar painel de conexão dinâmico
    renderConnectionBox(data);

    // Exibir/Ocultar botão de Encerrar Sala
    const isHost = state.user.id === data.host_id;
    const btnCloseLobby = document.getElementById('btn-close-lobby');
    if (btnCloseLobby) {
        btnCloseLobby.style.display = isHost ? 'inline-flex' : 'none';
    }

    document.getElementById('chat-messages').innerHTML = '';

    subscribeToCurrentLobbyDb(lobbyId);
    connectLobbyPresenceAndChat(lobbyId);
    fetchChatHistory(lobbyId);
}

function subscribeToCurrentLobbyDb(lobbyId) {
    if (state.currentLobbyDbSubscription) {
        state.supabase.removeChannel(state.currentLobbyDbSubscription);
        state.currentLobbyDbSubscription = null;
    }

    state.currentLobbyDbSubscription = state.supabase
        .channel(`lobby_db_${lobbyId}`)
        // 1. Escutar alterações no lobby (como encerramento da sala)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, (payload) => {
            if (payload.eventType === 'DELETE' || (payload.new && !payload.new.is_active)) {
                showNotification(state.language === 'en' ? 'The room was closed by the host.' : 'A sala foi fechada pelo host.', 'info');
                leaveCurrentLobby();
                return;
            }
            if (!payload.new) return;

            state.currentLobby = payload.new;
            document.getElementById('lobby-detail-title').textContent = payload.new.title;
            document.getElementById('lobby-detail-desc').innerHTML = linkify(payload.new.description || '');
            
            // Re-renderizar box de conexão
            renderConnectionBox(payload.new);
            
            // Se o jogo mudou ou o max_players mudou na tabela lobbies, precisamos atualizar o banner e a contagem
            const gameObj = GAMES_LIST.find(g => g.id === payload.new.game) || GAMES_LIST[GAMES_LIST.length - 1];
            const banner = document.getElementById('lobby-game-banner');
            if (banner) {
                banner.style.background = gameObj.color;
                banner.innerHTML = `<i class="fa-solid ${gameObj.icon}" style="font-size: 2rem; margin-right: 10px;"></i> ${gameObj.name}`;
            }
            // Força a atualização da lista de jogadores e contagem baseados no presence e max_players atualizado
            if (state.lobbyPresenceChannel) {
                const presenceState = state.lobbyPresenceChannel.presenceState();
                updatePlayersList(presenceState);
            }
        })
        // 2. Escutar novas mensagens inseridas no chat (postgres_changes na tabela 'messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `lobby_id=eq.${lobbyId}` }, (payload) => {
            // Ignorar mensagens que o próprio usuário enviou (já são exibidas localmente ao clicar em enviar)
            if (state.user && payload.new.sender_id === state.user.id) return;
            
            AudioSynth.playChat();
            const time = new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            appendChatMessage(payload.new.sender_name, payload.new.content, time);
        })
        .subscribe((status, err) => {
            console.log(`[Arena] Lobby DB subscription status for ${lobbyId}:`, status, err);
        });
}

function connectLobbyPresenceAndChat(lobbyId) {
    if (state.lobbyPresenceChannel) {
        state.supabase.removeChannel(state.lobbyPresenceChannel);
        state.lobbyPresenceChannel = null;
    }

    state.presenceInitialSyncDone = false;
    setTimeout(() => {
        state.presenceInitialSyncDone = true;
    }, 1500);

    state.lobbyPresenceChannel = state.supabase.channel(`lobby_room_${lobbyId}`, {
        config: {
            presence: {
                key: state.user.id,
            },
        },
    });

    state.lobbyPresenceChannel
        .on('presence', { event: 'sync' }, () => {
            const presenceState = state.lobbyPresenceChannel.presenceState();
            updatePlayersList(presenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (!state.presenceInitialSyncDone) return;
            newPresences.forEach(presence => {
                if (key !== state.user.id) {
                    appendChatMessage('SYSTEM', `${presence.nickname || 'Jogador'} ${getTranslation('system_joined')}`);
                }
            });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            leftPresences.forEach(presence => {
                appendChatMessage('SYSTEM', `${presence.nickname || 'Jogador'} ${getTranslation('system_left')}`);
            });
        })
        .subscribe(async (status, err) => {
            console.log(`[Arena] Presence subscription status for ${lobbyId}:`, status, err);
            if (status === 'SUBSCRIBED') {
                await state.lobbyPresenceChannel.track({
                    nickname: state.profile.username,
                    avatar_url: state.profile.avatar_url,
                    online_at: new Date().toISOString()
                });
            }
        });
}

function updatePlayersList(presenceState) {
    // Guard: se o lobby foi encerrado enquanto esta função rodava, abortar
    if (!state.currentLobby) return;
    const listContainer = document.getElementById('lobby-players-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const users = [];
    Object.keys(presenceState).forEach(key => {
        const userPresences = presenceState[key];
        if (userPresences && userPresences.length > 0) {
            users.push({
                id: key,
                nickname: userPresences[0].nickname || 'Jogador',
                avatar_url: userPresences[0].avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default',
                online_at: userPresences[0].online_at,
                isHost: key === state.currentLobby.host_id
            });
        }
    });

    users.sort((a, b) => {
        if (a.isHost) return -1;
        if (b.isHost) return 1;
        return new Date(a.online_at) - new Date(b.online_at);
    });

    users.forEach(user => {
        const row = document.createElement('div');
        row.className = `player-row ${user.isHost ? 'is-host' : ''}`;
        row.innerHTML = `
            <img class="user-avatar-small" src="${user.avatar_url}" alt="Avatar" style="width: 24px; height: 24px; border: 1px solid var(--accent-cyan); box-shadow: none;">
            <span>${escapeHtml(user.nickname)}</span>
        `;
        listContainer.appendChild(row);
    });

    const count = users.length;
    const countBadge = document.getElementById('lobby-players-count');
    if (countBadge) {
        countBadge.textContent = `${count}/${state.currentLobby.max_players}`;
    }

    // Atualizar contagem no banco — somente o host (comparação por ID) faz isso para evitar conflitos
    if (state.currentLobby && state.user && state.currentLobby.host_id === state.user.id && state.currentLobby.active_players !== count) {
        updateLobbyPlayerCount(state.currentLobby.id, count);
    }
}

async function updateLobbyPlayerCount(lobbyId, count) {
    if (!state.supabase) return;
    await state.supabase
        .from('lobbies')
        .update({ active_players: count })
        .eq('id', lobbyId);
}

async function leaveCurrentLobby() {
    if (!state.supabase || !state.currentLobby) return;

    AudioSynth.playClick();

    // Parar túnel se estiver ativo ao sair (apenas para não-hosts, pois hosts mantêm o servidor rodando)
    const isHost = state.user && state.currentLobby && state.user.id === state.currentLobby.host_id;
    console.log('[Companion/Web] leaveCurrentLobby - isHost:', isHost, 'userID:', state.user?.id, 'hostID:', state.currentLobby?.host_id);
    if (!isHost && state.companionStatus === 'connected' && state.companionTunnelActive) {
        toggleCompanionTunnel(false);
    }

    // Salvar referência local antes de nullar para evitar race conditions
    const lobbySnapshot = state.currentLobby;
    state.currentLobby = null;

    if (state.lobbyPresenceChannel) {
        state.supabase.removeChannel(state.lobbyPresenceChannel);
        state.lobbyPresenceChannel = null;
    }
    if (state.currentLobbyDbSubscription) {
        state.supabase.removeChannel(state.currentLobbyDbSubscription);
        state.currentLobbyDbSubscription = null;
    }

    // Usar a snapshot para operações que dependem do lobby anterior
    void lobbySnapshot;

    document.getElementById('lobby-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';

    // Garantir que a inscrição da dashboard está ativa e atualizada
    subscribeToLobbies();
    fetchLobbies();
}


async function fetchChatHistory(lobbyId) {
    if (!state.supabase) return;

    const { data, error } = await state.supabase
        .from('messages')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('created_at', { ascending: true })
        .limit(50);

    if (error) {
        console.error('Erro ao buscar chat:', error);
        return;
    }

    data.forEach(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        appendChatMessage(msg.sender_name, msg.content, time);
    });
}

async function sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content || !state.currentLobby || !state.supabase) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Exibir mensagem localmente imediatamente (sem esperar broadcast de volta)
    appendChatMessage(state.profile.username, content, time);
    input.value = '';

    await state.supabase
        .from('messages')
        .insert([{
            lobby_id: state.currentLobby.id,
            sender_name: state.profile.username,
            sender_id: state.user.id,
            content: content
        }]);
}

function appendChatMessage(sender, message, time) {
    const container = document.getElementById('chat-messages');
    
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg';
    
    const isSystem = sender === 'SYSTEM';
    if (isSystem) {
        msgEl.className = 'chat-msg system';
        msgEl.textContent = message;
    } else {
        msgEl.innerHTML = `
            <span class="msg-sender">${escapeHtml(sender)}:</span>
            <span class="msg-content">${escapeHtml(message)}</span>
            <span class="msg-time">${time}</span>
        `;
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

// Copiar IP
function copyIpAddress() {
    const ipText = document.getElementById('lobby-detail-ip').textContent;
    navigator.clipboard.writeText(ipText).then(() => {
        const btnText = document.getElementById('copy-btn-text');
        btnText.textContent = getTranslation('btn_copied');
        
        setTimeout(() => {
            btnText.textContent = getTranslation('btn_copy');
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar IP:', err);
    });
}

// Auxiliar: Escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Auxiliar: Escapar HTML e linkar URLs
function linkify(text) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    // Regex para encontrar URLs (http/https ou iniciando com www.)
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/g;
    return escaped.replace(urlRegex, function(url) {
        const href = url.startsWith('http') ? url : 'http://' + url;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); text-decoration: underline; word-break: break-all;">${url}</a>`;
    });
}

// Exibir Notificação Customizada (Premium Toast)
function showNotification(message, type = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    // Mapear tipo de notificação para ícone FontAwesome correto
    let icon = 'fa-circle-info';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    else if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'info') icon = 'fa-circle-info';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remover notificação após 4 segundos
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Compartilhar Sala
function shareLobby() {
    if (!state.currentLobby) return;

    const shareUrl = window.location.origin + window.location.pathname + '?lobby=' + state.currentLobby.id;
    navigator.clipboard.writeText(shareUrl).then(() => {
        AudioSynth.playCoin();
        
        const btnText = document.getElementById('share-btn-text');
        if (btnText) {
            const originalText = btnText.textContent;
            btnText.textContent = state.language === 'en' ? 'Copied!' : 'Copiado!';
            setTimeout(() => {
                btnText.textContent = originalText;
            }, 2000);
        }
        
        showNotification(getTranslation('share_success'), 'success');
    }).catch(err => {
        console.error('Erro ao compartilhar sala:', err);
        showNotification(state.language === 'en' ? 'Failed to copy link.' : 'Erro ao copiar link de compartilhamento.', 'error');
    });
}

// Verificar sala compartilhada via query parameters na URL
function checkSharedLobby() {
    const params = new URLSearchParams(window.location.search);
    const lobbyId = params.get('lobby') || params.get('sala');
    if (lobbyId && state.supabase) {
        // Limpar os parâmetros da URL para evitar redirecionamentos em recarregamentos futuros
        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        if (!state.user) {
            state.pendingSharedLobbyId = lobbyId;
            showNotification(state.language === 'en' ? 'Login to join the shared room!' : 'Faça login para entrar na sala compartilhada!', 'info');
            openAuthModal();
        } else {
            console.log('[Arena] Detectou link compartilhado para a sala:', lobbyId);
            showNotification(state.language === 'en' ? 'Entering shared room...' : 'Entrando na sala compartilhada...', 'info');
            joinLobby(lobbyId);
        }
    }
}

// Encerrar Sala (Host)
async function closeCurrentLobby() {
    if (!state.supabase || !state.currentLobby) return;

    const confirmMsg = state.language === 'en' 
        ? 'Are you sure you want to close this room? All players will be disconnected.' 
        : 'Tem certeza que deseja encerrar esta sala? Todos os jogadores serão desconectados.';
        
    if (!confirm(confirmMsg)) return;

    AudioSynth.playLaser();
    const lobbyId = state.currentLobby.id;

    // Parar o túnel do Companion se estiver ativo ao encerrar a sala
    if (state.companionStatus === 'connected' && state.companionTunnelActive) {
        toggleCompanionTunnel(false);
    }

    if (state.lobbyPresenceChannel) {
        state.supabase.removeChannel(state.lobbyPresenceChannel);
        state.lobbyPresenceChannel = null;
    }
    if (state.currentLobbyDbSubscription) {
        state.supabase.removeChannel(state.currentLobbyDbSubscription);
        state.currentLobbyDbSubscription = null;
    }

    state.currentLobby = null;

    // Excluir a sala do banco de dados (deletando as mensagens associadas automaticamente via CASCADE)
    const { error } = await state.supabase
        .from('lobbies')
        .delete()
        .eq('id', lobbyId);

    if (error) {
        console.error('Erro ao encerrar sala:', error);
        showNotification(state.language === 'en' ? 'Error closing room.' : 'Erro ao encerrar sala.', 'error');
    } else {
        showNotification(state.language === 'en' ? 'Room closed successfully!' : 'Sala encerrada com sucesso!', 'success');
    }

    document.getElementById('lobby-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';

    // Garantir que a inscrição da dashboard está ativa e atualizada
    subscribeToLobbies();
    fetchLobbies();
}

function goHome() {
    AudioSynth.playClick();
    if (state.currentLobby) {
        leaveCurrentLobby();
    } else {
        fetchLobbies();
    }
}

// Controle do Modal de Privacidade
function openPrivacyModal(e) {
    if (e) e.preventDefault();
    AudioSynth.playClick();
    const modal = document.getElementById('privacy-modal');
    if (modal) modal.style.display = 'flex';
}

function closePrivacyModal() {
    AudioSynth.playClick();
    const modal = document.getElementById('privacy-modal');
    if (modal) modal.style.display = 'none';
}

// Aceitar cookies
function acceptCookies() {
    AudioSynth.playClick();
    localStorage.setItem('arena_cookies_accepted', 'true');
    const banner = document.getElementById('cookie-consent');
    if (banner) {
        banner.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 300);
    }
}

// Gerenciar estado da UI de Autenticação para Hóspedes vs Logados
function updateAuthUI() {
    const isGuest = !state.user;
    
    const editBtn = document.getElementById('edit-profile-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const displayNameEl = document.getElementById('user-display-name');
    const avatarImg = document.getElementById('user-avatar-img');
    const userBadge = document.getElementById('user-badge');

    if (isGuest) {
        if (editBtn) editBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (displayNameEl) displayNameEl.textContent = state.language === 'en' ? 'Login / Register' : 'Entrar / Cadastrar';
        if (avatarImg) avatarImg.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest';
        
        if (userBadge) {
            userBadge.onclick = () => openAuthModal();
            userBadge.style.cursor = 'pointer';
            userBadge.title = state.language === 'en' ? 'Click to login' : 'Clique para entrar';
        }
    } else {
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (displayNameEl) displayNameEl.textContent = state.profile.username;
        if (avatarImg) avatarImg.src = state.profile.avatar_url;
        
        if (userBadge) {
            userBadge.onclick = null;
            userBadge.style.cursor = 'default';
            userBadge.title = '';
        }
    }
}

function openAuthModal() {
    AudioSynth.playClick();
    document.getElementById('auth-screen').style.display = 'flex';
}

function closeAuthModal() {
    AudioSynth.playClick();
    document.getElementById('auth-screen').style.display = 'none';
}

// ==========================================
// SEÇÃO: INTEGRAÇÃO DO COMPANION APP LOCAL
// ==========================================

function connectToLocalCompanion() {
    const wsUrl = 'ws://127.0.0.1:18888';
    
    if (state.companionWs) {
        try { state.companionWs.close(); } catch (e) {}
    }

    state.companionWs = new WebSocket(wsUrl);

    state.companionWs.onopen = () => {
        console.log('[Companion/Web] Conectado ao Companion local.');
        state.companionStatus = 'connected';
        updateCompanionBadge();
        if (state.currentLobby) {
            renderConnectionBox(state.currentLobby);
        }
    };

    state.companionWs.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[Companion/Web] Mensagem do companion:', data);

            if (data.type === 'status') {
                state.companionTunnelActive = data.tunnelActive;
                if (state.currentLobby) {
                    renderConnectionBox(state.currentLobby);
                }
            } else if (data.type === 'tunnel_status') {
                if (data.status === 'connected') {
                    state.companionTunnelActive = true;
                    AudioSynth.playCoin();
                    showNotification(
                        state.language === 'en' ? '🚀 Network Tunnel established! Have a good game!' : '🚀 Túnel de rede estabelecido! Bom jogo!',
                        'success'
                    );
                } else if (data.status === 'disconnected') {
                    state.companionTunnelActive = false;
                    AudioSynth.playClick();
                    if (data.reason === 'host_left') {
                        showNotification(
                            state.language === 'en' ? 'Host disconnected. Tunnel closed.' : 'O Host desconectou. Túnel encerrado.',
                            'info'
                        );
                    } else {
                        showNotification(
                            state.language === 'en' ? 'Tunnel disconnected.' : 'Túnel de rede desconectado.',
                            'info'
                        );
                    }
                }
                if (state.currentLobby) {
                    renderConnectionBox(state.currentLobby);
                }
            } else if (data.type === 'error') {
                showNotification(data.message, 'error');
            }
        } catch (err) {
            console.error('[Companion/Web] Erro ao decodificar mensagem do companion:', err);
        }
    };

    state.companionWs.onclose = () => {
        handleCompanionDisconnect();
    };

    state.companionWs.onerror = () => {
        handleCompanionDisconnect();
    };
}

function handleCompanionDisconnect() {
    if (state.companionStatus !== 'offline' || state.companionTunnelActive !== false) {
        state.companionStatus = 'offline';
        state.companionTunnelActive = false;
        updateCompanionBadge();
        if (state.currentLobby) {
            renderConnectionBox(state.currentLobby);
        }
    }
    // Tenta reconectar a cada 5 segundos
    if (!state.companionReconnectTimer) {
        state.companionReconnectTimer = setTimeout(() => {
            state.companionReconnectTimer = null;
            connectToLocalCompanion();
        }, 5000);
    }
}

function updateCompanionBadge() {
    const badge = document.getElementById('companion-status-badge');
    if (!badge) return;

    if (state.companionStatus === 'connected') {
        badge.className = 'companion-status-badge online';
        badge.querySelector('.status-text').textContent = state.language === 'en' ? 'Companion Active' : 'Companion Ativo';
        badge.title = state.language === 'en' ? 'Desktop helper app is running.' : 'O app de desktop auxiliar está rodando.';
    } else {
        badge.className = 'companion-status-badge offline';
        badge.querySelector('.status-text').textContent = state.language === 'en' ? 'Companion Offline' : 'Companion Offline';
        badge.title = state.language === 'en' ? 'Start companion app on your PC to enable tunnels.' : 'Abra o companion app no PC para usar túneis.';
    }
}

function sendCompanionCommand(cmd) {
    if (state.companionWs && state.companionWs.readyState === WebSocket.OPEN) {
        state.companionWs.send(JSON.stringify(cmd));
        return true;
    }
    return false;
}

function toggleCompanionTunnel(active) {
    AudioSynth.playClick();
    if (!state.currentLobby) return;

    if (active) {
        const isHost = state.user.id === state.currentLobby.host_id;
        const relayUrl = 'wss://arena-relay-43d6.onrender.com'; // Servidor relay de produção
        const gameObj = GAMES_LIST.find(g => g.id === state.currentLobby.game);
        const protocol = gameObj && gameObj.protocol ? gameObj.protocol : 'udp';

        if (isHost) {
            sendCompanionCommand({
                action: 'host',
                lobbyId: state.currentLobby.id,
                gamePort: parseInt(state.currentLobby.port || 27015),
                protocol: protocol,
                relayUrl: relayUrl
            });
        } else {
            sendCompanionCommand({
                action: 'join',
                lobbyId: state.currentLobby.id,
                gamePort: parseInt(state.currentLobby.port || 27015),
                clientId: state.user.id,
                protocol: protocol,
                relayUrl: relayUrl
            });
        }
    } else {
        sendCompanionCommand({ action: 'stop' });
    }
}

function handleConnTypeChange() {
    const connType = document.getElementById('room-conn-type').value;
    const ipInput = document.getElementById('room-ip');
    const ipLabel = document.getElementById('room-ip-label');
    
    if (connType === 'companion') {
        ipInput.value = '127.0.0.1';
        ipInput.disabled = true;
        ipInput.style.opacity = '0.5';
        if (ipLabel) ipLabel.textContent = state.language === 'en' ? 'IP Address (Automated Tunnel)' : 'Endereço IP (Túnel Automático)';
    } else {
        ipInput.value = '';
        ipInput.disabled = false;
        ipInput.style.opacity = '1';
        if (ipLabel) ipLabel.textContent = state.language === 'en' ? 'IP Address (Host)' : 'Endereço IP (Host)';
    }
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(state.language === 'en' ? 'Copied to clipboard!' : 'Copiado para a área de transferência!', 'success');
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}

function renderConnectionBox(lobby) {
    const container = document.getElementById('connection-box-container');
    if (!container) return;

    const gameObj = GAMES_LIST.find(g => g.id === lobby.game);
    const supportsPort = gameObj ? gameObj.supportsCustomPort !== false : true;

    if (lobby.connection_type !== 'companion') {
        // Modo Direct IP tradicional
        const displayIp = (lobby.port && supportsPort) ? `${lobby.ip_address}:${lobby.port}` : lobby.ip_address;
        container.innerHTML = `
            <div class="connection-box">
                <div class="connection-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                    <h4 data-i18n="connection_details" style="font-size: 0.9rem; font-weight:600; color:var(--text-primary);">${getTranslation('connection_details')}</h4>
                    <span class="pulse-tag" data-i18n="active_status" style="background:var(--accent-green-glow); color:var(--accent-green); border:1px solid var(--accent-green); padding:2px 8px; border-radius:4px; font-size:0.7rem; font-family:var(--font-arcade);">${getTranslation('active_status')}</span>
                </div>
                <div class="ip-display-container" style="display:flex; gap:10px; margin-bottom:0.8rem;">
                    <div class="ip-address-wrap" style="flex-grow:1; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:0.6rem 1rem; border-radius:4px; font-family:var(--font-arcade); font-size:1rem; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-network-wired"></i>
                        <span id="lobby-detail-ip">${displayIp}</span>
                    </div>
                    <button class="btn btn-secondary btn-copy" onclick="copyIpAddress()" style="display:flex; align-items:center; gap:6px; padding:0.6rem 1.2rem;">
                        <i class="fa-solid fa-copy"></i> <span id="copy-btn-text">${getTranslation('btn_copy')}</span>
                    </button>
                </div>
                <p class="connection-tip" style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${getTranslation('connection_tip')}</p>
            </div>
        `;
    } else {
        // Modo Companion App!
        const isHost = state.user.id === lobby.host_id;
        const companionConnected = state.companionStatus === 'connected';

        let bodyHtml = '';
        if (!companionConnected) {
            bodyHtml = `
                <div class="companion-download-card">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: var(--accent-pink); filter: drop-shadow(0 0 5px var(--accent-pink-glow));"></i>
                    <p><strong>Companion App Offline</strong></p>
                    <p style="font-size:0.8rem; margin: 0.5rem 0; line-height:1.4;">Você precisa do aplicativo de desktop para criar a conexão automática.</p>
                    <button class="btn btn-primary" onclick="openDownloadModal(event)" style="padding: 0.5rem 1rem; font-size:0.8rem; gap: 8px; display:inline-flex; align-items:center; cursor:pointer; border:none;">
                        <i class="fa-solid fa-file-arrow-down"></i> Baixar arena-companion.exe
                    </button>
                </div>
                <div class="companion-instruction-step active" style="margin-top: 10px;">
                    <span class="step-number">1</span>
                    <div>
                        <strong>Abra o Companion no seu PC</strong>
                        <p style="font-size:0.8rem; line-height:1.4;">Baixe e abra o executável acima. Quando ele estiver rodando em segundo plano, o status aqui mudará para verde automaticamente.</p>
                    </div>
                </div>
            `;
        } else {
            // Companion ativo
            const isTunnelActive = state.companionTunnelActive;
            bodyHtml = `
                <div class="companion-tunnel-controls">
                    <span class="companion-tunnel-status-text" style="color: ${isTunnelActive ? 'var(--accent-green)' : 'var(--accent-cyan)'}; text-shadow: ${isTunnelActive ? '0 0 8px var(--accent-green-glow)' : '0 0 8px var(--accent-cyan-glow)'};">
                        <i class="fa-solid ${isTunnelActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i> 
                        ${isTunnelActive ? (isHost ? 'TÚNEL DE HOSPEDAGEM ATIVO' : 'TÚNEL DE CONEXÃO ATIVO') : 'COMPANION CONECTADO E PRONTO'}
                    </span>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; justify-content: center;">
                        ${!isTunnelActive ? `
                            <button class="btn btn-primary" onclick="toggleCompanionTunnel(true)" style="padding: 0.6rem 1.5rem; display:inline-flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-play"></i> ${isHost ? 'Iniciar Hospedagem' : 'Conectar à Sala'}
                            </button>
                        ` : `
                            <button class="btn btn-danger" onclick="toggleCompanionTunnel(false)" style="background: var(--accent-pink); box-shadow: 0 0 10px rgba(255, 0, 127, 0.4); padding: 0.6rem 1.5rem; display:inline-flex; align-items:center; gap:8px; border: 1px solid var(--accent-pink);">
                                <i class="fa-solid fa-stop"></i> Parar Conexão
                            </button>
                        `}
                        <button class="btn btn-secondary" onclick="openTutorialModal()" style="padding: 0.6rem 1.2rem; display:inline-flex; align-items:center; gap:8px; background: rgba(138,43,226,0.15); border: 1px solid var(--accent-purple);">
                            <i class="fa-solid fa-circle-question" style="color:var(--accent-cyan);"></i> Como Conectar?
                        </button>
                    </div>
                </div>
 
                <div class="companion-instruction-step ${!isTunnelActive ? 'active' : ''}">
                    <span class="step-number">1</span>
                    <div>
                        <strong>Inicie o Túnel</strong>
                        <p style="font-size:0.8rem; line-height:1.4;">Clique no botão acima para abrir a ponte de rede e conectar com os outros jogadores.</p>
                    </div>
                </div>
 
                <div class="companion-instruction-step ${isTunnelActive ? 'active' : ''}">
                    <span class="step-number">2</span>
                    <div>
                        <strong>Conecte-se no seu Jogo</strong>
                        <p style="font-size:0.8rem; line-height:1.4;">Com o jogo aberto, escolha a opção Direct IP (ou Multiplayer LAN) e digite o endereço local:</p>
                        <div class="companion-ip-display" style="margin-top: 8px;">
                            <span id="lobby-detail-ip">${(lobby.port && supportsPort) ? `127.0.0.1:${lobby.port}` : '127.0.0.1'}</span>
                            <button class="btn btn-secondary btn-sm" onclick="copyIpAddress()" style="padding: 4px 10px; font-size: 0.75rem; display:inline-flex; align-items:center; gap:4px;">
                                <i class="fa-solid fa-copy"></i> <span id="copy-btn-text">Copiar</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
 
        container.innerHTML = `
            <div class="companion-panel ${companionConnected ? 'online' : ''}">
                <div class="companion-panel-header">
                    <h4 style="font-size:0.75rem; color:var(--text-primary);"><i class="fa-solid fa-bolt" style="color:var(--accent-cyan);"></i> CONEXÃO INTELIGENTE</h4>
                    <span class="companion-status-badge ${companionConnected ? 'online' : 'offline'}" style="margin:0;">
                        <span class="status-dot"></span>
                        <span class="status-text">${companionConnected ? 'Conectado' : 'Desconectado'}</span>
                    </span>
                </div>
                <div class="companion-panel-body">
                    ${bodyHtml}
                </div>
            </div>
        `;
    }
}

function openDownloadModal(e) {
    if (e) e.preventDefault();
    AudioSynth.playClick();
    document.getElementById('download-modal').style.display = 'flex';
}

function closeDownloadModal() {
    AudioSynth.playClick();
    document.getElementById('download-modal').style.display = 'none';
}

function confirmDownloadCompanion() {
    AudioSynth.playCoin();
    closeDownloadModal();
    
    const link = document.createElement('a');
    link.href = 'companion/arena-companion.exe';
    link.download = 'arena-companion.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleGameSelectChange() {
    const gameId = document.getElementById('room-game').value;
    const portInput = document.getElementById('room-port');
    if (portInput) {
        if (gameId === 'cs16' || gameId === 'halflife') portInput.value = '27015';
        else if (gameId === 'quake3') portInput.value = '27960';
        else if (gameId === 'doom') portInput.value = '10666';
        else if (gameId === 'ut2004' || gameId === 'terraria' || gameId === 'samp') portInput.value = '7777';
        else if (gameId === 'bf1942') portInput.value = '14567';
        else if (gameId === 'mohaa') portInput.value = '12203';
        else if (gameId === 'aoe2') portInput.value = '2300';
        else if (gameId === 'starcraft' || gameId === 'warcraft3' || gameId === 'diablo2' || gameId === 'diablo1' || gameId === 'homm3') portInput.value = '6112';
        else if (gameId === 'minecraft') portInput.value = '25565';
        else if (gameId === 'worms') portInput.value = '17011';
        else portInput.value = ''; // Custom
    }
}

function openTutorialModal() {
    AudioSynth.playClick();
    const modal = document.getElementById('tutorial-modal');
    if (!modal || !state.currentLobby) return;

    const lobby = state.currentLobby;
    const gameObj = GAMES_LIST.find(g => g.id === lobby.game);
    const gameName = gameObj ? gameObj.name : 'Outro / Custom';
    const isHost = state.user.id === lobby.host_id;

    let stepsHtml = '';

    if (lobby.game === 'diablo1') {
        stepsHtml = `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                O <strong>Diablo I / Hellfire (DevilutionX)</strong> utiliza conexão TCP direta. Siga a ordem exata abaixo para evitar erros de conexão:
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(0, 245, 255, 0.1); ${isHost ? 'box-shadow: 0 0 10px rgba(0, 245, 255, 0.2); border-color: var(--accent-cyan);' : ''}">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-crown"></i> 1. Passos do Hospedador (Host)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>No site, clique em <strong>"Iniciar Hospedagem"</strong> no painel de conexão. O status deve ficar verde.</li>
                        <li><strong>Abra o jogo (DevilutionX)</strong> no seu PC.</li>
                        <li>No menu principal, selecione <strong>Jogo Multijogador</strong>.</li>
                        <li>Selecione <strong>Cliente-Servidor (TCP)</strong> e clique em <strong>Hospedar</strong>.</li>
                        <li>Escolha seu personagem, selecione o jogo e clique em <strong>Criar Jogo</strong>. Aguarde os convidados no mapa da cidade.</li>
                    </ol>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(255, 0, 127, 0.1); ${!isHost ? 'box-shadow: 0 0 10px rgba(255, 0, 127, 0.2); border-color: var(--accent-pink);' : ''}">
                    <h4 style="color: var(--accent-pink); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-user-plus"></i> 2. Passos do Convidado (Guest)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>Aguarde o Host criar o jogo acima.</li>
                        <li>No site, clique em <strong>"Conectar à Sala"</strong>. O status deve ficar verde.</li>
                        <li><strong>Abra o jogo (DevilutionX)</strong> no seu PC.</li>
                        <li>No menu principal, selecione <strong>Jogo Multijogador</strong>.</li>
                        <li>Selecione <strong>Cliente-Servidor (TCP)</strong> e clique em <strong>Entrar</strong>.</li>
                        <li>Digite o endereço local <strong><code style="color: var(--accent-cyan);">127.0.0.1</code></strong> e clique em <strong>OK</strong>.</li>
                    </ol>
                </div>
            </div>
        `;
    } else if (lobby.game === 'cs16' || lobby.game === 'halflife') {
        stepsHtml = `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                O <strong>Counter-Strike 1.6 / Half-Life</strong> utiliza conexão UDP direta. Siga o tutorial abaixo para se conectar:
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(0, 245, 255, 0.1); ${isHost ? 'box-shadow: 0 0 10px rgba(0, 245, 255, 0.2); border-color: var(--accent-cyan);' : ''}">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-crown"></i> 1. Passos do Hospedador (Host)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>No site, clique em <strong>"Iniciar Hospedagem"</strong> no painel de conexão.</li>
                        <li>Inicie o seu jogo ou servidor dedicado local do CS 1.6 na porta configurada (padrão: <strong>27015</strong>).</li>
                        <li>O jogo deve estar rodando e aguardando conexões locais.</li>
                    </ol>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(255, 0, 127, 0.1); ${!isHost ? 'box-shadow: 0 0 10px rgba(255, 0, 127, 0.2); border-color: var(--accent-pink);' : ''}">
                    <h4 style="color: var(--accent-pink); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-user-plus"></i> 2. Passos do Convidado (Guest)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>No site, clique em <strong>"Conectar à Sala"</strong>.</li>
                        <li>Abra o seu jogo no PC.</li>
                        <li>Abra o console do jogo (geralmente na tecla <strong>' (aspas)</strong> ou <strong>~ (til)</strong>).</li>
                        <li>Digite o comando <strong><code style="color: var(--accent-cyan);">connect 127.0.0.1:${lobby.port || '27015'}</code></strong> e aperte Enter.</li>
                        <li>Alternativamente, você pode procurar na aba de servidores <strong>"LAN"</strong> dentro do menu Find Servers.</li>
                    </ol>
                </div>
            </div>
        `;
    } else {
        // Genérico para outros jogos
        const defaultPort = lobby.port || '6112';
        stepsHtml = `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Guia de conexão padrão via Companion App para o jogo <strong>${gameName}</strong>:
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(0, 245, 255, 0.1); ${isHost ? 'box-shadow: 0 0 10px rgba(0, 245, 255, 0.2); border-color: var(--accent-cyan);' : ''}">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-crown"></i> 1. Passos do Hospedador (Host)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>No site, clique em <strong>"Iniciar Hospedagem"</strong> no painel.</li>
                        <li>Abra o jogo clássico e inicie a partida em modo <strong>Multiplayer LAN / Local Area Network (TCP/UDP)</strong> como Host.</li>
                        <li>Certifique-se de que a porta de hospedagem do jogo é a mesma definida na sala (porta: <strong>${defaultPort}</strong>).</li>
                    </ol>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(255, 0, 127, 0.1); ${!isHost ? 'box-shadow: 0 0 10px rgba(255, 0, 127, 0.2); border-color: var(--accent-pink);' : ''}">
                    <h4 style="color: var(--accent-pink); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-user-plus"></i> 2. Passos do Convidado (Guest)
                    </h4>
                    <ol style="margin-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        <li>No site, clique em <strong>"Conectar à Sala"</strong>.</li>
                        <li>Abra o jogo e vá na seção multijogador (LAN, TCP/IP ou Direct IP).</li>
                        <li>Insira o endereço local <strong><code style="color: var(--accent-cyan);">127.0.0.1${gameObj && gameObj.supportsCustomPort === false ? '' : `:${defaultPort}`}</code></strong> no campo de IP para conectar.</li>
                    </ol>
                </div>
            </div>
        `;
    }

    document.getElementById('tutorial-modal-body').innerHTML = stepsHtml;
    modal.style.display = 'flex';
}

function closeTutorialModal() {
    AudioSynth.playClick();
    const modal = document.getElementById('tutorial-modal');
    if (modal) modal.style.display = 'none';
}
