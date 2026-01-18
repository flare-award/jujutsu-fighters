// main.js - Основной файл управления игрой
class JujutsuFighters {
    constructor() {
        // Инициализация экранов
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
        this.effects = new EffectsManager();
        this.ui = new UIManager();
        
        this.init();
    }
    
    async init() {
        console.log('Jujutsu Fighters - Initializing...');
        
        // Загрузка профиля
        await this.profile.load();
        
        // Загрузка персонажей
        await this.characters.load();
        
        // Инициализация сетевого модуля
        this.network = new NetworkManager(this);
        await this.network.initialize();
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Автоматический переход после заставки
        setTimeout(() => {
            this.showScreen('menu');
        }, 3000);
        
        // Инициализация анимации загрузки
        this.initLoadingAnimation();
    }
    
    initLoadingAnimation() {
        const progress = document.querySelector('.loading-progress');
        let width = 0;
        
        const interval = setInterval(() => {
            width += 2;
            progress.style.width = `${width}%`;
            
            if (width >= 100) {
                clearInterval(interval);
            }
        }, 30);
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
            this.setupSettingsTabs();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit?')) {
                alert('Thanks for playing Jujutsu Fighters!');
            }
        });
        
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.showScreen('profile');
            this.profile.display();
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
            if (!this.characters.getSelected()) {
                this.showCharacterSelect();
                return;
            }
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
            try {
                const username = document.getElementById('profile-username').value;
                this.profile.setUsername(username);
                this.profile.save();
                this.showScreen('menu');
                this.updateMenu();
            } catch (error) {
                alert(error.message);
            }
        });
        
        // Аватар
        document.getElementById('avatar-input').addEventListener('change', (e) => {
            this.profile.handleAvatarUpload(e);
        });
        
        // Настройки - вкладки
        this.setupSettingsTabs();
        
        // Настройки - назад
        document.getElementById('settings-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        // Персонажи назад
        document.getElementById('characters-back').addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        // Игровые события
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentScreen === 'game') {
                this.togglePause();
            }
        });
        
        // Обработчики для pause меню
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('quit-match')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the match?')) {
                this.endGame();
                this.showScreen('menu');
            }
        });
        
        // Обновление настроек в реальном времени
        document.getElementById('round-time')?.addEventListener('change', (e) => {
            if (this.game) {
                this.game.roundTime = parseInt(e.target.value);
                this.game.timer = this.game.roundTime;
            }
        });
        
        document.getElementById('blood-effects')?.addEventListener('change', (e) => {
            localStorage.setItem('blood-effects', e.target.checked);
        });
        
        document.getElementById('screen-shake')?.addEventListener('change', (e) => {
            localStorage.setItem('screen-shake', e.target.checked);
        });
        
        document.getElementById('master-volume')?.addEventListener('input', (e) => {
            localStorage.setItem('master-volume', e.target.value);
        });
    }
    
    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Убираем активный класс у всех вкладок
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Добавляем активный класс текущей вкладке
                tab.classList.add('active');
                
                // Показываем соответствующий контент
                const tabName = tab.dataset.tab;
                const content = document.getElementById(`${tabName}-tab`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }
    
    showScreen(screenName) {
        // Скрыть все экраны
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        
        // Показать нужный экран
        const screen = this.screens[screenName];
        if (screen) {
            screen.classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Обновить информацию на экране
            switch(screenName) {
                case 'menu':
                    this.updateMenu();
                    break;
                case 'profile':
                    this.profile.display();
                    break;
                case 'lobby':
                    this.updateLobby();
                    break;
                case 'character':
                    this.characters.displaySelectable();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
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
        
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = username;
        }
        
        const avatarElement = document.getElementById('user-avatar');
        if (avatarElement) {
            if (avatar) {
                avatarElement.style.backgroundImage = `url(${avatar})`;
                avatarElement.style.backgroundSize = 'cover';
                avatarElement.style.backgroundPosition = 'center';
                const letter = avatarElement.querySelector('.avatar-letter');
                if (letter) letter.style.display = 'none';
            } else {
                avatarElement.style.backgroundImage = '';
                avatarElement.style.background = 'linear-gradient(45deg, #ff0033, #ff6600)';
                const letter = avatarElement.querySelector('.avatar-letter');
                if (letter) {
                    letter.style.display = 'flex';
                    letter.textContent = username.charAt(0).toUpperCase();
                }
            }
        }
        
        // Обновить текущего персонажа
        const currentChar = this.characters.getCurrent();
        if (currentChar) {
            const currentCharElement = document.getElementById('current-character');
            if (currentCharElement) {
                currentCharElement.style.background = currentChar.color || 'linear-gradient(45deg, #ff0033, #ff6600)';
            }
            
            const charNameElement = document.getElementById('current-char-name');
            if (charNameElement) {
                charNameElement.textContent = currentChar.name;
            }
        }
    }
    
    updateLobby() {
        // Обновить информацию в лобби
        if (this.network.roomCode) {
            const roomCodeElement = document.getElementById('lobby-code');
            if (roomCodeElement) {
                roomCodeElement.textContent = this.network.roomCode;
            }
        }
        
        // Обновить информацию об игроках
        const players = this.network.getPlayers();
        
        // Хост
        if (players.host) {
            const hostNameElement = document.getElementById('player1-name');
            const hostStatusElement = document.getElementById('player1-status');
            
            if (hostNameElement) hostNameElement.textContent = players.host.username;
            if (hostStatusElement) {
                hostStatusElement.textContent = players.host.ready ? 'READY' : 'SELECTING';
                hostStatusElement.className = `player-status ${players.host.ready ? 'ready' : ''}`;
            }
            
            // Обновить аватар хоста
            const hostAvatar = document.getElementById('player1-avatar');
            if (hostAvatar && players.host.avatar) {
                hostAvatar.style.backgroundImage = `url(${players.host.avatar})`;
                hostAvatar.style.backgroundSize = 'cover';
            }
        }
        
        // Гость
        if (players.guest) {
            const guestNameElement = document.getElementById('player2-name');
            const guestStatusElement = document.getElementById('player2-status');
            
            if (guestNameElement) guestNameElement.textContent = players.guest.username;
            if (guestStatusElement) {
                guestStatusElement.textContent = players.guest.ready ? 'READY' : 'SELECTING';
                guestStatusElement.className = `player-status ${players.guest.ready ? 'ready' : ''}`;
            }
            
            // Обновить аватар гостя
            const guestAvatar = document.getElementById('player2-avatar');
            if (guestAvatar && players.guest.avatar) {
                guestAvatar.style.backgroundImage = `url(${players.guest.avatar})`;
                guestAvatar.style.backgroundSize = 'cover';
            }
        } else {
            const guestNameElement = document.getElementById('player2-name');
            const guestStatusElement = document.getElementById('player2-status');
            
            if (guestNameElement) guestNameElement.textContent = 'Waiting...';
            if (guestStatusElement) {
                guestStatusElement.textContent = 'WAITING';
                guestStatusElement.className = 'player-status';
            }
        }
        
        // Обновить кнопку готовности
        const readyBtn = document.getElementById('ready-btn');
        if (readyBtn) {
            if (this.network.isReady) {
                readyBtn.classList.add('active');
                readyBtn.querySelector('span').textContent = 'NOT READY';
            } else {
                readyBtn.classList.remove('active');
                readyBtn.querySelector('span').textContent = 'READY';
            }
        }
    }
    
    loadSettings() {
        // Загрузить сохраненные настройки
        const bloodEffects = localStorage.getItem('blood-effects');
        const screenShake = localStorage.getItem('screen-shake');
        const masterVolume = localStorage.getItem('master-volume');
        
        if (bloodEffects !== null) {
            document.getElementById('blood-effects').checked = bloodEffects === 'true';
        }
        
        if (screenShake !== null) {
            document.getElementById('screen-shake').checked = screenShake === 'true';
        }
        
        if (masterVolume !== null) {
            document.getElementById('master-volume').value = masterVolume;
        }
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
    
    showCharacterSelect() {
        this.characters.displaySelectable();
        this.showScreen('character');
    }
    
    togglePause() {
        if (!this.game) return;
        
        const pauseMenu = document.getElementById('pause-menu');
        if (!pauseMenu) return;
        
        if (this.game.paused) {
            this.game.resume();
            pauseMenu.classList.add('hidden');
        } else {
            this.game.pause();
            pauseMenu.classList.remove('hidden');
        }
    }
    
    endGame() {
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
    }
    
    showGameOver(winner, stats) {
        // Создать или показать экран окончания игры
        let gameOverScreen = document.getElementById('game-over');
        
        if (!gameOverScreen) {
            gameOverScreen = document.createElement('div');
            gameOverScreen.id = 'game-over';
            gameOverScreen.style.position = 'absolute';
            gameOverScreen.style.top = '0';
            gameOverScreen.style.left = '0';
            gameOverScreen.style.width = '100%';
            gameOverScreen.style.height = '100%';
            gameOverScreen.style.background = 'rgba(0, 0, 0, 0.9)';
            gameOverScreen.style.display = 'flex';
            gameOverScreen.style.justifyContent = 'center';
            gameOverScreen.style.alignItems = 'center';
            gameOverScreen.style.zIndex = '400';
            
            const isPlayerWinner = winner.username === this.profile.getUsername();
            
            gameOverScreen.innerHTML = `
                <div class="game-over-content">
                    <div class="victory-text">${isPlayerWinner ? 'VICTORY' : 'DEFEAT'}</div>
                    <div class="winner-name">${winner.username}</div>
                    <div class="game-over-stats">
                        <div class="game-over-stat">
                            <div class="stat-label">Rounds Won</div>
                            <div class="stat-value">${stats.roundsWon}/${stats.maxRounds}</div>
                        </div>
                        <div class="game-over-stat">
                            <div class="stat-label">Damage Dealt</div>
                            <div class="stat-value">${stats.damageDealt}</div>
                        </div>
                        <div class="game-over-stat">
                            <div class="stat-label">Combo Max</div>
                            <div class="stat-value">${stats.maxCombo}</div>
                        </div>
                    </div>
                    <div class="game-over-buttons">
                        <button class="btn" id="rematch-btn">REMATCH</button>
                        <button class="btn" id="main-menu-btn">MAIN MENU</button>
                    </div>
                </div>
            `;
            
            document.getElementById('game-screen').appendChild(gameOverScreen);
            
            // Обработчики кнопок
            document.getElementById('rematch-btn').addEventListener('click', () => {
                gameOverScreen.remove();
                if (this.game) {
                    this.game.rematch();
                }
            });
            
            document.getElementById('main-menu-btn').addEventListener('click', () => {
                this.endGame();
                this.showScreen('menu');
            });
        } else {
            gameOverScreen.style.display = 'flex';
        }
    }
}

// Вспомогательные функции
function createButton(text, className, clickHandler) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    return button;
}

function createElement(tag, className, content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
}

// Запуск игры при загрузке страницы
let gameApp;

document.addEventListener('DOMContentLoaded', () => {
    gameApp = new JujutsuFighters();
    
    // Глобальные функции для использования в HTML
    window.showScreen = function(screenName) {
        if (gameApp) gameApp.showScreen(screenName);
    };
    
    window.hideModal = function(modalId) {
        if (gameApp) gameApp.hideModal(modalId);
    };
    
    window.quitGame = function() {
        if (confirm('Are you sure you want to quit?')) {
            alert('Thanks for playing Jujutsu Fighters!');
        }
    };
});

// Глобальный объект для доступа к приложению
window.gameApp = gameApp;