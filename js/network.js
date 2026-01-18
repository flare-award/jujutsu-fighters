class NetworkManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.peer = null;
        this.connection = null;
        
        this.roomCode = null;
        this.isHost = false;
        this.isReady = false;
        
        this.players = {
            host: null,
            guest: null
        };
        
        this.messages = [];
    }
    
    async initialize() {
        try {
            // Инициализация PeerJS
            this.peer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                debug: 2
            });
            
            this.peer.on('open', (id) => {
                console.log('PeerJS connected with ID:', id);
            });
            
            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });
            
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                this.showError('Connection error. Please try again.');
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize PeerJS:', error);
            return false;
        }
    }
    
    createRoom() {
        if (!this.peer) {
            alert('Please wait for connection initialization');
            return;
        }
        
        // Генерация кода комнаты
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        
        // Установка информации хоста
        this.players.host = {
            id: this.peer.id,
            username: this.gameApp.profile.getUsername(),
            avatar: this.gameApp.profile.getAvatar(),
            character: null,
            ready: false
        };
        
        // Показать лобби
        this.gameApp.showScreen('lobby');
        
        console.log('Room created with code:', this.roomCode);
    }
    
    joinRoom(roomCode) {
        if (!this.peer) {
            alert('Please wait for connection initialization');
            return;
        }
        
        this.roomCode = roomCode;
        this.isHost = false;
        
        // Подключение к хосту
        try {
            this.connection = this.peer.connect(roomCode, {
                reliable: true
            });
            
            this.setupConnection(this.connection);
            
            // Отправить информацию о себе
            this.send({
                type: 'join',
                data: {
                    username: this.gameApp.profile.getUsername(),
                    avatar: this.gameApp.profile.getAvatar()
                }
            });
            
            this.gameApp.showScreen('lobby');
            
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. Please check the code and try again.');
        }
    }
    
    setupConnection(conn) {
        conn.on('open', () => {
            console.log('Connected to peer');
        });
        
        conn.on('data', (data) => {
            this.handleMessage(data);
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            this.handleDisconnection();
        });
        
        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
        
        this.connection = conn;
    }
    
    handleIncomingConnection(conn) {
        if (!this.isHost) return;
        
        this.setupConnection(conn);
        
        // Отправить информацию о комнате новому игроку
        this.send({
            type: 'room_info',
            data: {
                host: this.players.host,
                roomCode: this.roomCode
            }
        });
        
        // Обновить информацию о госте
        this.players.guest = {
            id: conn.peer,
            username: 'Connecting...',
            avatar: null,
            character: null,
            ready: false
        };
        
        this.updateLobby();
    }
    
    handleMessage(data) {
        console.log('Received message:', data);
        this.messages.push(data);
        
        switch (data.type) {
            case 'join':
                this.handleJoinMessage(data);
                break;
                
            case 'room_info':
                this.handleRoomInfoMessage(data);
                break;
                
            case 'player_update':
                this.handlePlayerUpdateMessage(data);
                break;
                
            case 'game_start':
                this.handleGameStartMessage(data);
                break;
                
            case 'game_state':
                this.handleGameStateMessage(data);
                break;
                
            case 'character_select':
                this.handleCharacterSelectMessage(data);
                break;
                
            case 'ready':
                this.handleReadyMessage(data);
                break;
        }
    }
    
    handleJoinMessage(data) {
        if (this.isHost) {
            this.players.guest = {
                id: this.connection.peer,
                username: data.data.username,
                avatar: data.data.avatar,
                character: null,
                ready: false
            };
            
            this.updateLobby();
            
            // Отправить обновление хосту
            this.send({
                type: 'player_update',
                data: this.players
            });
        }
    }
    
    handleRoomInfoMessage(data) {
        if (!this.isHost) {
            this.players.host = data.data.host;
            this.roomCode = data.data.roomCode;
            this.updateLobby();
        }
    }
    
    handlePlayerUpdateMessage(data) {
        this.players = data.data;
        this.updateLobby();
    }
    
    handleGameStartMessage(data) {
        this.gameApp.startOnlineGame(data.data);
    }
    
    handleGameStateMessage(data) {
        if (this.gameApp.game) {
            this.gameApp.game.updateOnlineState(data.data);
        }
    }
    
    handleCharacterSelectMessage(data) {
        if (this.isHost) {
            this.players.guest.character = data.data.character;
        } else {
            this.players.host.character = data.data.character;
        }
        this.updateLobby();
    }
    
    handleReadyMessage(data) {
        if (this.isHost) {
            this.players.guest.ready = data.data.ready;
        } else {
            this.players.host.ready = data.data.ready;
        }
        this.updateLobby();
        
        // Проверить, все ли готовы
        this.checkAllReady();
    }
    
    toggleReady() {
        this.isReady = !this.isReady;
        
        if (this.isHost) {
            this.players.host.ready = this.isReady;
        } else {
            this.send({
                type: 'ready',
                data: { ready: this.isReady }
            });
        }
        
        this.updateLobby();
        this.checkAllReady();
    }
    
    checkAllReady() {
        if (this.isHost && this.players.host && this.players.guest) {
            const allReady = this.players.host.ready && this.players.guest.ready;
            const allSelected = this.players.host.character && this.players.guest.character;
            
            if (allReady && allSelected) {
                // Начать игру
                setTimeout(() => {
                    this.startGame();
                }, 1000);
            }
        }
    }
    
    selectCharacter(characterId) {
        if (this.isHost) {
            this.players.host.character = characterId;
        } else {
            this.players.guest.character = characterId;
            this.send({
                type: 'character_select',
                data: { character: characterId }
            });
        }
        
        this.updateLobby();
    }
    
    startGame() {
        const gameData = {
            host: this.players.host,
            guest: this.players.guest,
            roomCode: this.roomCode
        };
        
        // Отправить данные о начале игры
        this.send({
            type: 'game_start',
            data: gameData
        });
        
        // Начать игру у себя
        this.gameApp.startOnlineGame(gameData);
    }
    
    sendGameState(state) {
        this.send({
            type: 'game_state',
            data: state
        });
    }
    
    send(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    }
    
    updateLobby() {
        this.gameApp.updateLobby();
    }
    
    leaveRoom() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        
        this.roomCode = null;
        this.isHost = false;
        this.isReady = false;
        this.players = { host: null, guest: null };
    }
    
    handleDisconnection() {
        alert('Player disconnected from the room.');
        this.leaveRoom();
        this.gameApp.showScreen('online');
    }
    
    getPlayers() {
        return this.players;
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    showError(message) {
        alert(message);
    }
}