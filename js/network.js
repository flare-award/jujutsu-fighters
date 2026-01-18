class NetworkManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        
        // Firebase инициализация
        this.firebase = null;
        this.database = null;
        this.auth = null;
        
        this.roomCode = null;
        this.isHost = false;
        this.isReady = false;
        this.myPlayerId = null;
        this.myCharacter = null;
        
        // Информация о комнате и игроках
        this.roomRef = null;
        this.playersRef = null;
        this.gameStateRef = null;
        
        this.players = {
            host: null,
            guest: null
        };
        
        this.messages = [];
        this.listeners = {};
        
        // Генерируем уникальный ID игрока
        this.myPlayerId = this.generatePlayerId();
    }
    
    async initialize() {
        try {
            // Проверяем, инициализирован ли Firebase
            if (!firebase.apps.length) {
                // Firebase конфигурация (замените на свою)
                const firebaseConfig = {
                    apiKey: "YOUR_API_KEY",
                    authDomain: "YOUR_AUTH_DOMAIN",
                    databaseURL: "YOUR_DATABASE_URL",
                    projectId: "YOUR_PROJECT_ID",
                    storageBucket: "YOUR_STORAGE_BUCKET",
                    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
                    appId: "YOUR_APP_ID"
                };
                
                // Инициализация Firebase
                firebase.initializeApp(firebaseConfig);
            }
            
            this.firebase = firebase;
            this.database = firebase.database();
            this.auth = firebase.auth();
            
            // Анонимная аутентификация
            await this.auth.signInAnonymously();
            
            console.log('Firebase initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            this.showError('Connection error. Please check your internet connection.');
            return false;
        }
    }
    
    // Создание комнаты
    async createRoom() {
        try {
            // Генерация кода комнаты
            this.roomCode = this.generateRoomCode();
            this.isHost = true;
            
            // Создаем комнату в Firebase
            this.roomRef = this.database.ref(`rooms/${this.roomCode}`);
            this.playersRef = this.roomRef.child('players');
            this.gameStateRef = this.roomRef.child('gameState');
            
            // Создаем информацию о комнате
            await this.roomRef.set({
                createdAt: Date.now(),
                status: 'waiting',
                hostId: this.myPlayerId,
                maxPlayers: 2
            });
            
            // Добавляем себя как хоста
            const hostData = {
                id: this.myPlayerId,
                username: this.gameApp.profile.getUsername(),
                avatar: this.gameApp.profile.getAvatar(),
                character: null,
                ready: false,
                isHost: true,
                joinedAt: Date.now()
            };
            
            await this.playersRef.child(this.myPlayerId).set(hostData);
            
            // Сохраняем локально
            this.players.host = hostData;
            
            // Устанавливаем слушатели
            this.setupRoomListeners();
            
            // Показать лобби
            this.gameApp.showScreen('lobby');
            this.updateLobby();
            
            console.log('Room created with code:', this.roomCode);
            
            // Автоматически удаляем комнату через 1 час бездействия
            setTimeout(() => {
                if (this.roomRef) {
                    this.roomRef.remove();
                }
            }, 3600000);
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.showError('Failed to create room. Please try again.');
        }
    }
    
    // Присоединение к комнате
    async joinRoom(roomCode) {
        try {
            this.roomCode = roomCode.toUpperCase();
            this.isHost = false;
            
            // Получаем ссылку на комнату
            this.roomRef = this.database.ref(`rooms/${this.roomCode}`);
            this.playersRef = this.roomRef.child('players');
            this.gameStateRef = this.roomRef.child('gameState');
            
            // Проверяем существование комнаты
            const snapshot = await this.roomRef.once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }
            
            const roomData = snapshot.val();
            
            if (roomData.status !== 'waiting') {
                throw new Error('Room is not available');
            }
            
            // Проверяем количество игроков
            const playersSnapshot = await this.playersRef.once('value');
            const players = playersSnapshot.val() || {};
            
            if (Object.keys(players).length >= roomData.maxPlayers) {
                throw new Error('Room is full');
            }
            
            // Добавляем себя как гостя
            const guestData = {
                id: this.myPlayerId,
                username: this.gameApp.profile.getUsername(),
                avatar: this.gameApp.profile.getAvatar(),
                character: null,
                ready: false,
                isHost: false,
                joinedAt: Date.now()
            };
            
            await this.playersRef.child(this.myPlayerId).set(guestData);
            
            // Обновляем статус комнаты
            await this.roomRef.update({
                status: 'full'
            });
            
            // Устанавливаем слушатели
            this.setupRoomListeners();
            
            // Показать лобби
            this.gameApp.showScreen('lobby');
            
            console.log('Joined room:', this.roomCode);
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.showError(`Failed to join room: ${error.message}`);
            this.roomCode = null;
            this.roomRef = null;
        }
    }
    
    // Настройка слушателей Firebase
    setupRoomListeners() {
        if (!this.playersRef) return;
        
        // Слушаем изменения в списке игроков
        this.listeners.players = this.playersRef.on('value', (snapshot) => {
            this.handlePlayersUpdate(snapshot.val());
        });
        
        // Слушаем состояние игры
        this.listeners.gameState = this.gameStateRef.on('value', (snapshot) => {
            const gameState = snapshot.val();
            if (gameState) {
                this.handleGameStateUpdate(gameState);
            }
        });
        
        // Слушаем изменения статуса комнаты
        this.listeners.room = this.roomRef.on('value', (snapshot) => {
            const roomData = snapshot.val();
            if (roomData && roomData.status === 'game_started') {
                this.handleGameStart();
            }
        });
    }
    
    // Обработка обновления списка игроков
    handlePlayersUpdate(playersData) {
        if (!playersData) return;
        
        const players = Object.values(playersData);
        
        // Находим хоста и гостя
        const host = players.find(p => p.isHost);
        const guest = players.find(p => !p.isHost);
        
        this.players.host = host || null;
        this.players.guest = guest || null;
        
        // Проверяем, не отключился ли второй игрок
        if (this.isHost && !guest) {
            this.players.guest = null;
        }
        
        this.updateLobby();
        
        // Проверяем, все ли готовы
        if (host && guest) {
            this.checkAllReady();
        }
    }
    
    // Обработка обновления состояния игры
    handleGameStateUpdate(gameState) {
        if (!this.gameApp.game) return;
        
        switch (gameState.type) {
            case 'character_select':
                if (this.isHost && gameState.playerId !== this.myPlayerId) {
                    this.players.guest.character = gameState.character;
                } else if (!this.isHost && gameState.playerId !== this.myPlayerId) {
                    this.players.host.character = gameState.character;
                }
                this.updateLobby();
                break;
                
            case 'ready':
                if (this.isHost && gameState.playerId !== this.myPlayerId) {
                    this.players.guest.ready = gameState.ready;
                } else if (!this.isHost && gameState.playerId !== this.myPlayerId) {
                    this.players.host.ready = gameState.ready;
                }
                this.updateLobby();
                this.checkAllReady();
                break;
                
            case 'game_action':
                if (this.gameApp.game && gameState.playerId !== this.myPlayerId) {
                    this.gameApp.game.handleOpponentAction(gameState.action, gameState.data);
                }
                break;
                
            case 'game_sync':
                if (this.gameApp.game && this.isHost && gameState.playerId !== this.myPlayerId) {
                    this.gameApp.game.syncGameState(gameState.state);
                }
                break;
        }
    }
    
    // Обработка начала игры
    handleGameStart() {
        if (this.players.host && this.players.guest) {
            const gameData = {
                host: this.players.host,
                guest: this.players.guest,
                roomCode: this.roomCode,
                isHost: this.isHost
            };
            
            this.gameApp.startOnlineGame(gameData);
        }
    }
    
    // Отправить информацию о выборе персонажа
    async selectCharacter(characterId) {
        if (!this.gameStateRef) return;
        
        this.myCharacter = characterId;
        
        if (this.isHost) {
            this.players.host.character = characterId;
        } else {
            this.players.guest.character = characterId;
        }
        
        await this.gameStateRef.set({
            type: 'character_select',
            playerId: this.myPlayerId,
            character: characterId,
            timestamp: Date.now()
        });
        
        this.updateLobby();
    }
    
    // Переключение готовности
    async toggleReady() {
        if (!this.gameStateRef) return;
        
        this.isReady = !this.isReady;
        
        if (this.isHost) {
            this.players.host.ready = this.isReady;
        } else {
            this.players.guest.ready = this.isReady;
        }
        
        await this.gameStateRef.set({
            type: 'ready',
            playerId: this.myPlayerId,
            ready: this.isReady,
            timestamp: Date.now()
        });
        
        this.updateLobby();
        this.checkAllReady();
    }
    
    // Проверка, все ли готовы
    async checkAllReady() {
        if (!this.isHost) return;
        
        if (this.players.host && this.players.guest) {
            const allReady = this.players.host.ready && this.players.guest.ready;
            const allSelected = this.players.host.character && this.players.guest.character;
            
            if (allReady && allSelected) {
                // Начинаем игру через 1 секунду
                setTimeout(async () => {
                    await this.startGame();
                }, 1000);
            }
        }
    }
    
    // Начать игру
    async startGame() {
        if (!this.roomRef) return;
        
        // Обновляем статус комнаты
        await this.roomRef.update({
            status: 'game_started',
            gameStartedAt: Date.now()
        });
        
        const gameData = {
            host: this.players.host,
            guest: this.players.guest,
            roomCode: this.roomCode,
            isHost: this.isHost
        };
        
        this.gameApp.startOnlineGame(gameData);
    }
    
    // Отправить игровое действие
    async sendGameAction(action, data = {}) {
        if (!this.gameStateRef) return;
        
        await this.gameStateRef.set({
            type: 'game_action',
            playerId: this.myPlayerId,
            action: action,
            data: data,
            timestamp: Date.now()
        });
    }
    
    // Синхронизация состояния игры (для хоста)
    async sendGameSync(state) {
        if (!this.isHost || !this.gameStateRef) return;
        
        await this.gameStateRef.set({
            type: 'game_sync',
            playerId: this.myPlayerId,
            state: state,
            timestamp: Date.now()
        });
    }
    
    // Обновление лобби
    updateLobby() {
        if (this.gameApp && this.gameApp.updateLobby) {
            this.gameApp.updateLobby();
        }
    }
    
    // Выход из комнаты
    async leaveRoom() {
        // Удаляем слушатели
        if (this.listeners.players && this.playersRef) {
            this.playersRef.off('value', this.listeners.players);
        }
        if (this.listeners.gameState && this.gameStateRef) {
            this.gameStateRef.off('value', this.listeners.gameState);
        }
        if (this.listeners.room && this.roomRef) {
            this.roomRef.off('value', this.listeners.room);
        }
        
        // Удаляем игрока из комнаты
        if (this.playersRef && this.myPlayerId) {
            await this.playersRef.child(this.myPlayerId).remove();
            
            // Проверяем, есть ли еще игроки в комнате
            const snapshot = await this.playersRef.once('value');
            const players = snapshot.val() || {};
            
            // Если игроков не осталось, удаляем комнату
            if (Object.keys(players).length === 0) {
                await this.roomRef.remove();
            } else if (this.isHost) {
                // Если вышел хост, назначаем нового хоста
                const remainingPlayers = Object.values(players);
                if (remainingPlayers.length > 0) {
                    const newHostId = remainingPlayers[0].id;
                    await this.playersRef.child(newHostId).update({ isHost: true });
                    await this.roomRef.update({ hostId: newHostId });
                }
            }
        }
        
        // Сбрасываем состояние
        this.resetRoomState();
        
        this.gameApp.showScreen('online');
    }
    
    // Сброс состояния комнаты
    resetRoomState() {
        this.roomCode = null;
        this.isHost = false;
        this.isReady = false;
        this.myCharacter = null;
        
        this.roomRef = null;
        this.playersRef = null;
        this.gameStateRef = null;
        
        this.players = {
            host: null,
            guest: null
        };
        
        this.listeners = {};
    }
    
    // Получить информацию об игроках
    getPlayers() {
        return this.players;
    }
    
    // Генерация ID игрока
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Генерация кода комнаты
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // Показать ошибку
    showError(message) {
        if (this.gameApp && this.gameApp.showError) {
            this.gameApp.showError(message);
        } else {
            alert(message);
        }
    }
    
    // Получить текущий код комнаты
    getRoomCode() {
        return this.roomCode;
    }
    
    // Проверить, подключены ли к комнате
    isInRoom() {
        return this.roomCode !== null;
    }
}