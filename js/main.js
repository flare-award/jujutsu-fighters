// Главный модуль игры
class JujutsuFighters {
    constructor() {
        this.screens = {
            splash: document.getElementById('splash-screen'),
            menu: document.getElementById('main-menu'),
            mode: document.getElementById('mode-select'),
            online: document.getElementById('online-menu'),
            lobby: document.getElementById('lobby-screen'),
            character: document.getElementById('character-select'),
            game: document.getElementById('game-screen'),
            profile: document.getElementById('profile-screen'),
            characters: document.getElementById('characters-screen'),
            settings: document.getElementById('settings-screen')
        };
        
        this.currentScreen = 'splash';
        this.game = null;
        this.network = null;
        this.profile = new ProfileManager();
        this.characters = new CharacterManager();
        
        this.init();
    }
    
    async init() {
        // Загрузка профиля
        await this.profile.load();
        
        // Загрузка персонажей
        await this.characters.load();
        
        // Инициализация сетевого модуля
        this.network = new NetworkManager(this);
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Автоматический переход после заставки
        setTimeout(() => {
            this.showScreen('menu');
        }, 3000);
    }
    
    setupEventListeners() {
        // Кнопки главного меню
        document.getElementById('fight-btn').addEventListener('click', () => {
            this.showScreen('mode');
        });
        
        document.getElementById('characters-btn').addEventListener('click', () => {
            this.showScreen('characters');
            this.characters.displayAll();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showScreen('settings');
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit?')) {
                // В реальном приложении здесь можно закрыть окно
                alert('Thanks for playing!');
            }
        });
        
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.showScreen('profile');
        });
        
        // Выбор режима
        document.getElementById('offline-mode').addEventListener('click', () => {
            this.startOfflineGame();
        });
        
        document.getElementById('online-mode').addEventListener('click', () => {
            this.showScreen('online');
        });
        
        // Навигация назад
        document.getElementById('mode-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        document.getElementById('online-back').addEventListener('click', () => {
            this.showScreen('mode');
        });
        
        // Онлайн меню
        document.getElementById('create-room').addEventListener('click', () => {
            this.network.createRoom();
        });
        
        document.getElementById('join-room').addEventListener('click', () => {
            this.showModal('join-modal');
        });
        
        // Подтверждение присоединения к комнате
        document.getElementById('join-confirm').addEventListener('click', () => {
            const code = document.getElementById('room-code').value.trim().toUpperCase();
            if (code.length === 6) {
                this.network.joinRoom(code);
                this.hideModal('join-modal');
            } else {
                alert('Please enter a valid 6-digit room code');
            }
        });
        
        document.getElementById('join-cancel').addEventListener('click', () => {
            this.hideModal('join-modal');
        });
        
        // Лобби
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.network.toggleReady();
        });
        
        document.getElementById('leave-lobby').addEventListener('click', () => {
            this.network.leaveRoom();
            this.showScreen('online');
        });
        
        // Выбор персонажа
        document.getElementById('select-back').addEventListener('click', () => {
            this.showScreen('lobby');
        });
        
        document.getElementById('select-confirm').addEventListener('click', () => {
            const selected = this.characters.getSelected();
            if (selected) {
                this.network.selectCharacter(selected.id);
                this.showScreen('lobby');
            }
        });
        
        // Профиль
        document.getElementById('profile-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        document.getElementById('save-profile').addEventListener('click', () => {
            this.profile.save();
            this.showScreen('menu');
        });
        
        // Аватар
        document.getElementById('avatar-input').addEventListener('change', (e) => {
            this.profile.handleAvatarUpload(e);
        });
        
        // Настройки
        document.getElementById('settings-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        // Вкладки настроек
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchSettingsTab(tab);
            });
        });
        
        // Персонажи назад
        document.getElementById('characters-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        // Игровые события (пауза и т.д.)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentScreen === 'game') {
                this.togglePause();
            }
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('quit-match').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the match?')) {
                this.endGame();
                this.showScreen('menu');
            }
        });
    }
    
    showScreen(screenName) {
        // Скрыть все экраны
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показать нужный экран
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Обновить информацию на экране
            if (screenName === 'menu') {
                this.updateMenu();
            } else if (screenName === 'profile') {
                this.profile.display();
            } else if (screenName === 'lobby') {
                this.updateLobby();
            }
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    updateMenu() {
        // Обновить имя пользователя и аватар
        const username = this.profile.getUsername();
        const avatar = this.profile.getAvatar();
        
        document.getElementById('username').textContent = username;
        
        const avatarElement = document.getElementById('user-avatar');
        if (avatar) {
            avatarElement.style.backgroundImage = `url(${avatar})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.querySelector('.avatar-letter').style.display = 'none';
        }
        
        // Обновить текущего персонажа
        const currentChar = this.characters.getCurrent();
        if (currentChar) {
            document.getElementById('current-character').style.background = 
                currentChar.color || 'linear-gradient(45deg, #ff0033, #ff6600)';
        }
    }
    
    updateLobby() {
        // Обновить информацию в лобби
        if (this.network.roomCode) {
            document.getElementById('lobby-code').textContent = this.network.roomCode;
        }
        
        // Обновить информацию об игроках
        const players = this.network.getPlayers();
        if (players.host) {
            document.getElementById('player1-name').textContent = players.host.username;
            document.getElementById('player1-status').textContent = 
                players.host.ready ? 'READY' : 'SELECTING';
            document.getElementById('player1-status').className = 
                `player-status ${players.host.ready ? 'ready' : ''}`;
        }
        
        if (players.guest) {
            document.getElementById('player2-name').textContent = players.guest.username;
            document.getElementById('player2-status').textContent = 
                players.guest.ready ? 'READY' : 'SELECTING';
            document.getElementById('player2-status').className = 
                `player-status ${players.guest.ready ? 'ready' : ''}`;
        }
        
        // Обновить кнопку готовности
        const readyBtn = document.getElementById('ready-btn');
        if (this.network.isReady) {
            readyBtn.classList.add('active');
            readyBtn.querySelector('span').textContent = 'NOT READY';
        } else {
            readyBtn.classList.remove('active');
            readyBtn.querySelector('span').textContent = 'READY';
        }
    }
    
    switchSettingsTab(tabName) {
        // Переключить активную вкладку
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }
    
    startOfflineGame() {
        // Начать оффлайн игру с ботом
        this.game = new Game(this);
        this.game.initOffline();
        this.showScreen('game');
        this.game.start();
    }
    
    startOnlineGame(gameData) {
        // Начать онлайн игру
        this.game = new Game(this);
        this.game.initOnline(gameData);
        this.showScreen('game');
        this.game.start();
    }
    
    togglePause() {
        const pauseMenu = document.getElementById('pause-menu');
        if (this.game) {
            if (this.game.paused) {
                this.game.resume();
                pauseMenu.classList.add('hidden');
            } else {
                this.game.pause();
                pauseMenu.classList.remove('hidden');
            }
        }
    }
    
    endGame() {
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
    }
    
    showCharacterSelect() {
        this.characters.displaySelectable();
        this.showScreen('character');
    }
    
    showGameOver(winner, stats) {
        // Показать экран окончания игры
        // Реализовать позже
        console.log('Game Over! Winner:', winner, 'Stats:', stats);
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new JujutsuFighters();
});