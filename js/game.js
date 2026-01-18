class Game {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.players = [];
        this.projectiles = [];
        this.effects = [];
        
        this.keys = {};
        this.mouse = { x: 0, y: 0, left: false, right: false };
        
        this.gameLoop = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.gameState = 'waiting'; // waiting, countdown, playing, paused, ended
        this.round = 1;
        this.maxRounds = 2;
        this.roundTime = 99;
        this.timer = this.roundTime;
        
        this.isOnline = false;
        this.isHost = false;
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        // Установка размеров канваса
        this.canvas.width = 1024;
        this.canvas.height = 576;
        
        // Масштабирование для разных размеров экрана
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Сохранение соотношения сторон 16:9
        const aspectRatio = 16 / 9;
        let width = containerWidth;
        let height = containerWidth / aspectRatio;
        
        if (height > containerHeight) {
            height = containerHeight;
            width = containerHeight * aspectRatio;
        }
        
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
    
    setupEventListeners() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Абилки по цифрам
            if (key >= '1' && key <= '4') {
                const abilityIndex = parseInt(key) - 1;
                this.useAbility(abilityIndex);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });
        
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
            
            if (this.gameState === 'playing') {
                if (e.button === 0) this.attack();
                if (e.button === 2) this.dash();
            }
            
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    initOffline() {
        // Инициализация оффлайн игры с ботом
        this.isOnline = false;
        
        const playerCharacter = this.gameApp.characters.getCurrent();
        const botCharacter = this.gameApp.characters.getCharacter('yuji');
        
        // Создание игрока
        this.players.push(new Player({
            x: 200,
            y: 400,
            character: playerCharacter,
            isPlayer: true,
            side: 'left',
            username: this.gameApp.profile.getUsername(),
            avatar: this.gameApp.profile.getAvatar()
        }));
        
        // Создание бота
        this.players.push(new Player({
            x: 700,
            y: 400,
            character: botCharacter,
            isPlayer: false,
            side: 'right',
            username: 'AI Bot',
            avatar: null,
            isBot: true
        }));
        
        this.setupHUD();
        this.startCountdown();
    }
    
    initOnline(gameData) {
        // Инициализация онлайн игры
        this.isOnline = true;
        this.isHost = this.gameApp.network.isHost;
        
        const hostData = gameData.host;
        const guestData = gameData.guest;
        
        // Определяем, кто есть кто
        const isHost = this.isHost;
        const playerData = isHost ? hostData : guestData;
        const opponentData = isHost ? guestData : hostData;
        
        // Создание игрока
        this.players.push(new Player({
            x: 200,
            y: 400,
            character: this.gameApp.characters.getCharacter(playerData.character),
            isPlayer: true,
            side: 'left',
            username: playerData.username,
            avatar: playerData.avatar
        }));
        
        // Создание противника
        this.players.push(new Player({
            x: 700,
            y: 400,
            character: this.gameApp.characters.getCharacter(opponentData.character),
            isPlayer: false,
            side: 'right',
            username: opponentData.username,
            avatar: opponentData.avatar
        }));
        
        this.setupHUD();
        this.startCountdown();
    }
    
    setupHUD() {
        // Настройка HUD для игроков
        const player = this.players[0];
        const opponent = this.players[1];
        
        // Игрок 1
        document.getElementById('hud-name-1').textContent = player.username;
        document.getElementById('health-1').style.width = '100%';
        document.getElementById('health-1').parentElement.querySelector('.health-text').textContent = '100/100';
        
        const avatar1 = document.getElementById('hud-avatar-1');
        if (player.avatar) {
            avatar1.style.backgroundImage = `url(${player.avatar})`;
            avatar1.style.backgroundSize = 'cover';
            avatar1.querySelector('.avatar-letter').style.display = 'none';
        } else {
            avatar1.querySelector('.avatar-letter').textContent = 
                player.username.charAt(0).toUpperCase();
        }
        
        // Игрок 2
        document.getElementById('hud-name-2').textContent = opponent.username;
        document.getElementById('health-2').style.width = '100%';
        document.getElementById('health-2').parentElement.querySelector('.health-text').textContent = '100/100';
        
        const avatar2 = document.getElementById('hud-avatar-2');
        if (opponent.avatar) {
            avatar2.style.backgroundImage = `url(${opponent.avatar})`;
            avatar2.style.backgroundSize = 'cover';
            avatar2.querySelector('.avatar-letter').style.display = 'none';
        } else {
            avatar2.querySelector('.avatar-letter').textContent = 
                opponent.username.charAt(0).toUpperCase();
        }
        
        // Настройка способностей
        this.setupAbilitiesHUD();
    }
    
    setupAbilitiesHUD() {
        const player = this.players[0];
        const abilities = player.character.abilities;
        
        abilities.forEach((ability, index) => {
            const slot = document.querySelector(`[data-ability="${index + 1}"]`);
            if (slot) {
                slot.querySelector('.ability-name').textContent = ability.name;
            }
        });
    }
    
    startCountdown() {
        this.gameState = 'countdown';
        
        let count = 3;
        const countdownElement = document.getElementById('countdown');
        const numberElement = countdownElement.querySelector('.countdown-number');
        
        countdownElement.classList.remove('hidden');
        
        const countdownInterval = setInterval(() => {
            numberElement.textContent = count;
            numberElement.style.animation = 'none';
            void numberElement.offsetWidth; // Trigger reflow
            numberElement.style.animation = 'countdownPulse 1s ease-out';
            
            if (count === 0) {
                clearInterval(countdownInterval);
                countdownElement.classList.add('hidden');
                this.startGame();
            }
            
            count--;
        }, 1000);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.timer = this.roundTime;
        this.lastTime = performance.now();
        
        // Запуск игрового цикла
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        
        // Запуск таймера раунда
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.timer--;
                document.getElementById('round-timer').textContent = this.timer;
                
                if (this.timer <= 0) {
                    this.handleTimeOut();
                }
            }
        }, 1000);
    }
    
    update(currentTime) {
        if (!this.gameLoop) return;
        
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Очистка канваса
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            // Обновление игроков
            this.players.forEach(player => {
                if (player.isBot) {
                    this.updateBot(player);
                }
                player.update(this.keys, this.mouse, this.deltaTime);
            });
            
            // Обновление снарядов
            this.projectiles.forEach((proj, index) => {
                proj.update(this.deltaTime);
                if (proj.isOffScreen(this.canvas)) {
                    this.projectiles.splice(index, 1);
                }
            });
            
            // Обновление эффектов
            this.effects.forEach((effect, index) => {
                effect.update(this.deltaTime);
                if (effect.isFinished) {
                    this.effects.splice(index, 1);
                }
            });
            
            // Проверка столкновений
            this.checkCollisions();
            
            // Проверка победы
            this.checkWinCondition();
            
            // Синхронизация онлайн
            if (this.isOnline) {
                this.syncOnlineState();
            }
        }
        
        // Отрисовка
        this.drawBackground();
        this.drawPlayers();
        this.drawProjectiles();
        this.drawEffects();
        
        // Продолжить цикл
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }
    
    updateBot(bot) {
        // Простой ИИ для бота
        const player = this.players[0];
        
        // Определение расстояния до игрока
        const distance = Math.abs(bot.x - player.x);
        
        // Случайные действия
        const random = Math.random();
        
        if (distance > 300) {
            // Подойти ближе
            if (bot.x < player.x) {
                bot.keys['d'] = true;
                bot.keys['a'] = false;
            } else {
                bot.keys['a'] = true;
                bot.keys['d'] = false;
            }
        } else if (distance < 100) {
            // Отойти подальше
            if (bot.x < player.x) {
                bot.keys['a'] = true;
                bot.keys['d'] = false;
            } else {
                bot.keys['d'] = true;
                bot.keys['a'] = false;
            }
            
            // Атаковать с вероятностью
            if (random < 0.1) {
                bot.attack();
            }
        } else {
            // Случайное движение
            if (random < 0.02) {
                bot.keys['a'] = !bot.keys['a'];
            }
            if (random < 0.02) {
                bot.keys['d'] = !bot.keys['d'];
            }
            if (random < 0.01 && bot.isGrounded) {
                bot.keys['w'] = true;
            }
            
            // Атака с вероятностью
            if (random < 0.05) {
                bot.attack();
            }
            
            // Использование способности с вероятностью
            if (random < 0.01) {
                const abilityIndex = Math.floor(Math.random() * bot.abilities.length);
                bot.useAbility(abilityIndex);
            }
        }
    }
    
    drawBackground() {
        // Градиентный фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#0f3460');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Платформа
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 450, this.canvas.width, this.canvas.height - 450);
        
        // Детали платформы
        this.ctx.fillStyle = '#0f3460';
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.fillRect(i, 450, 25, 5);
        }
    }
    
    drawPlayers() {
        this.players.forEach(player => {
            player.draw(this.ctx);
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(proj => {
            proj.draw(this.ctx);
        });
    }
    
    drawEffects() {
        this.effects.forEach(effect => {
            effect.draw(this.ctx);
        });
    }
    
    attack() {
        const player = this.players[0];
        if (player.canAttack()) {
            player.attack();
            
            // Проверка попадания
            this.checkAttackHit(player, this.players[1]);
        }
    }
    
    dash() {
        const player = this.players[0];
        player.dash();
    }
    
    useAbility(index) {
        const player = this.players[0];
        const ability = player.abilities[index];
        
        if (ability && !ability.onCooldown && player.awake >= ability.cost) {
            player.useAbility(index);
            
            // Создание эффекта способности
            this.createAbilityEffect(player, ability);
            
            // Синхронизация онлайн
            if (this.isOnline) {
                this.gameApp.network.send({
                    type: 'ability_used',
                    data: {
                        player: this.isHost ? 'host' : 'guest',
                        ability: index,
                        position: { x: player.x, y: player.y },
                        direction: player.facing
                    }
                });
            }
        }
    }
    
    createAbilityEffect(player, ability) {
        // Создание визуального эффекта способности
        const effect = {
            x: player.x + (player.facing === 'right' ? player.width : -50),
            y: player.y + player.height / 2,
            width: 100,
            height: 100,
            type: ability.type,
            lifetime: 0.5,
            maxLifetime: 0.5,
            draw: function(ctx) {
                ctx.save();
                ctx.globalAlpha = this.lifetime / this.maxLifetime;
                
                switch(this.type) {
                    case 'melee':
                        ctx.fillStyle = '#ffcc00';
                        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                        break;
                    case 'projectile':
                        ctx.fillStyle = '#ff0033';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 'domain':
                        ctx.fillStyle = '#6600ff';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                }
                
                ctx.restore();
            },
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.isFinished = this.lifetime <= 0;
            }
        };
        
        this.effects.push(effect);
    }
    
    checkAttackHit(attacker, target) {
        const attackHitbox = attacker.getAttackHitbox();
        const targetHitbox = target.getHitbox();
        
        if (this.checkCollision(attackHitbox, targetHitbox)) {
            const damage = attacker.calculateDamage();
            
            // Проверка блока
            let finalDamage = damage;
            if (target.isBlocking) {
                finalDamage = Math.floor(damage * 0.3); // Блок уменьшает урон на 70%
                this.createEffect('block', target.x, target.y);
            }
            
            target.takeDamage(finalDamage);
            this.createDamageText(finalDamage, target.x, target.y);
            
            // Обновление HUD
            this.updateHealthBars();
            
            // Увеличение шкалы Awake при нанесении урона
            attacker.awake = Math.min(100, attacker.awake + 5);
            this.updateAwakeBars();
            
            // Проверка победы
            if (target.health <= 0) {
                this.handlePlayerDefeated(target);
            }
            
            // Синхронизация онлайн
            if (this.isOnline) {
                this.gameApp.network.send({
                    type: 'damage',
                    data: {
                        attacker: attacker === this.players[0] ? 'player1' : 'player2',
                        target: target === this.players[0] ? 'player1' : 'player2',
                        damage: finalDamage
                    }
                });
            }
        }
    }
    
    checkCollisions() {
        // Проверка столкновений снарядов с игроками
        this.projectiles.forEach((proj, projIndex) => {
            this.players.forEach(player => {
                if (proj.owner !== player) {
                    const playerHitbox = player.getHitbox();
                    const projHitbox = proj.getHitbox();
                    
                    if (this.checkCollision(projHitbox, playerHitbox)) {
                        const damage = proj.damage;
                        player.takeDamage(damage);
                        this.createDamageText(damage, player.x, player.y);
                        
                        // Удаление снаряда
                        this.projectiles.splice(projIndex, 1);
                        
                        // Обновление HUD
                        this.updateHealthBars();
                        
                        if (player.health <= 0) {
                            this.handlePlayerDefeated(player);
                        }
                    }
                }
            });
        });
        
        // Проверка столкновений игроков друг с другом
        const player1 = this.players[0];
        const player2 = this.players[1];
        
        if (this.checkCollision(player1.getHitbox(), player2.getHitbox())) {
            // Отталкивание при столкновении
            const overlap = 10;
            if (player1.x < player2.x) {
                player1.x -= overlap;
                player2.x += overlap;
            } else {
                player1.x += overlap;
                player2.x -= overlap;
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkWinCondition() {
        const player = this.players[0];
        const opponent = this.players[1];
        
        // Проверка тайм-аута
        if (this.timer <= 0) {
            if (player.health > opponent.health) {
                this.handleRoundWin(player);
            } else if (opponent.health > player.health) {
                this.handleRoundWin(opponent);
            } else {
                // Ничья - дополнительный раунд
                this.handleDraw();
            }
        }
    }
    
    handlePlayerDefeated(player) {
        const winner = player === this.players[0] ? this.players[1] : this.players[0];
        this.handleRoundWin(winner);
    }
    
    handleRoundWin(winner) {
        winner.roundsWon++;
        
        // Обновление индикатора раундов
        this.updateRoundIndicator();
        
        if (winner.roundsWon >= this.maxRounds) {
            // Конец игры
            this.endGame(winner);
        } else {
            // Следующий раунд
            this.nextRound();
        }
    }
    
    handleDraw() {
        // Ничья - дополнительный раунд
        this.maxRounds++;
        this.nextRound();
    }
    
    handleTimeOut() {
        this.checkWinCondition();
    }
    
    nextRound() {
        this.round++;
        this.timer = this.roundTime;
        
        // Сброс игроков
        this.players.forEach(player => {
            player.reset();
            player.health = 100;
        });
        
        // Обновление HUD
        this.updateHealthBars();
        this.updateAwakeBars();
        
        // Запуск отсчета
        this.startCountdown();
    }
    
    endGame(winner) {
        this.gameState = 'ended';
        
        // Остановка игрового цикла
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.timerInterval);
        
        // Обновление статистики
        const isPlayerWinner = winner === this.players[0];
        if (isPlayerWinner) {
            this.gameApp.profile.updateStats('win');
        } else {
            this.gameApp.profile.updateStats('loss');
        }
        
        // Показать экран победы
        this.showGameOver(winner);
    }
    
    showGameOver(winner) {
        // Создание элемента game over, если его нет
        let gameOverScreen = document.getElementById('game-over');
        if (!gameOverScreen) {
            gameOverScreen = document.createElement('div');
            gameOverScreen.id = 'game-over';
            gameOverScreen.innerHTML = `
                <div class="game-over-content">
                    <div class="victory-text">VICTORY</div>
                    <div class="winner-name">${winner.username}</div>
                    <div class="game-over-stats">
                        <div class="game-over-stat">
                            <div class="stat-label">Rounds Won</div>
                            <div class="stat-value">${winner.roundsWon}/${this.maxRounds}</div>
                        </div>
                        <div class="game-over-stat">
                            <div class="stat-label">Health Remaining</div>
                            <div class="stat-value">${Math.floor(winner.health)}%</div>
                        </div>
                    </div>
                    <div class="game-over-buttons">
                        <button class="btn" id="rematch-btn">REMATCH</button>
                        <button class="btn" id="menu-btn">MAIN MENU</button>
                    </div>
                </div>
            `;
            document.getElementById('game-screen').appendChild(gameOverScreen);
            
            // Обработчики кнопок
            document.getElementById('rematch-btn').addEventListener('click', () => {
                this.rematch();
            });
            
            document.getElementById('menu-btn').addEventListener('click', () => {
                this.gameApp.showScreen('menu');
            });
        }
        
        gameOverScreen.style.display = 'flex';
    }
    
    rematch() {
        // Начать матч заново
        document.getElementById('game-over').style.display = 'none';
        
        this.round = 1;
        this.maxRounds = 2;
        this.players.forEach(player => {
            player.reset();
            player.roundsWon = 0;
        });
        
        this.startCountdown();
    }
    
    updateHealthBars() {
        this.players.forEach((player, index) => {
            const healthBar = document.getElementById(`health-${index + 1}`);
            const healthText = healthBar.parentElement.querySelector('.health-text');
            
            if (healthBar) {
                healthBar.style.width = `${player.health}%`;
                healthText.textContent = `${Math.floor(player.health)}/100`;
            }
        });
    }
    
    updateAwakeBars() {
        this.players.forEach((player, index) => {
            const awakeBar = document.getElementById(`awake-${index + 1}`);
            if (awakeBar) {
                awakeBar.style.width = `${player.awake}%`;
            }
        });
    }
    
    updateRoundIndicator() {
        const dots = document.querySelectorAll('.round-indicator');
        dots.forEach((dot, index) => {
            if (index < this.round - 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    createDamageText(damage, x, y) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-text';
        damageText.textContent = `-${damage}`;
        damageText.style.left = `${x}px`;
        damageText.style.top = `${y}px`;
        
        document.getElementById('game-screen').appendChild(damageText);
        
        // Удаление через 1 секунду
        setTimeout(() => {
            damageText.remove();
        }, 1000);
    }
    
    createEffect(type, x, y) {
        // Создание визуального эффекта
        const effect = {
            x, y,
            type,
            lifetime: 1,
            draw: function(ctx) {
                // Временная реализация
                ctx.save();
                ctx.globalAlpha = this.lifetime;
                
                if (type === 'block') {
                    ctx.fillStyle = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            },
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.isFinished = this.lifetime <= 0;
            }
        };
        
        this.effects.push(effect);
    }
    
    syncOnlineState() {
        if (!this.isOnline || !this.isHost) return;
        
        const gameState = {
            players: this.players.map(player => ({
                x: player.x,
                y: player.y,
                health: player.health,
                awake: player.awake,
                state: player.state
            })),
            projectiles: this.projectiles.map(proj => ({
                x: proj.x,
                y: proj.y,
                type: proj.type
            })),
            timer: this.timer,
            round: this.round
        };
        
        this.gameApp.network.sendGameState(gameState);
    }
    
    updateOnlineState(state) {
        if (this.isOnline && !this.isHost) {
            // Обновление состояния от хоста
            state.players.forEach((playerState, index) => {
                if (index < this.players.length) {
                    const player = this.players[index];
                    if (!player.isPlayer) { // Не обновляем управляемого игрока
                        player.x = playerState.x;
                        player.y = playerState.y;
                        player.health = playerState.health;
                        player.awake = playerState.awake;
                        player.state = playerState.state;
                    }
                }
            });
            
            this.timer = state.timer;
            this.round = state.round;
            this.updateRoundIndicator();
        }
    }
    
    pause() {
        this.gameState = 'paused';
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.timerInterval);
    }
    
    resume() {
        this.gameState = 'playing';
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        
        // Перезапуск таймера
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.timer--;
                document.getElementById('round-timer').textContent = this.timer;
                
                if (this.timer <= 0) {
                    this.handleTimeOut();
                }
            }
        }, 1000);
    }
    
    stop() {
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.timerInterval);
        this.gameLoop = null;
    }
}

class Player {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = 80;
        this.height = 180;
        this.character = config.character;
        this.isPlayer = config.isPlayer;
        this.side = config.side;
        this.username = config.username;
        this.avatar = config.avatar;
        this.isBot = config.isBot || false;
        
        this.health = 100;
        this.maxHealth = 100;
        this.awake = 0;
        this.maxAwake = 100;
        
        this.speed = config.character.speed || 5;
        this.jumpForce = config.character.jump || 15;
        this.damage = config.character.damage || 10;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.facing = 'right';
        
        this.state = 'idle'; // idle, walk, jump, attack, hurt, block, dash
        this.attackCooldown = 0;
        this.attackCombo = 0;
        this.lastAttackTime = 0;
        this.comboTimer = 0;
        
        this.isAttacking = false;
        this.isDashing = false;
        this.isBlocking = false;
        this.dashCooldown = 0;
        
        this.abilities = this.setupAbilities();
        this.activeEffects = [];
        
        this.roundsWon = 0;
        
        this.keys = {};
        this.mouse = { left: false, right: false };
        
        // Добавляем регенерационный таймер
        this.regenTimer = 0;
    }
    
    setupAbilities() {
        return this.character.abilities.map(ability => ({
            ...ability,
            onCooldown: false,
            cooldownTimer: 0,
            cost: ability.type === 'domain' ? 100 : 20
        }));
    }
    
    update(keys, mouse, deltaTime) {
        this.keys = keys;
        this.mouse = mouse;
        
        if (this.isPlayer && !this.isBot) {
            this.handleInput();
        }
        
        // Обновление таймеров
        this.updateTimers(deltaTime);
        
        // Применение физики
        this.applyPhysics(deltaTime);
        
        // Обновление состояния
        this.updateState();
        
        // Обновление эффектов
        this.updateEffects(deltaTime);
        
        // Регенерация (Reverse Cursed Technique)
        this.updateRegeneration(deltaTime);
    }
    
    handleInput() {
        // Движение
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.velocityX = -this.speed;
            this.facing = 'left';
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.velocityX = this.speed;
            this.facing = 'right';
        } else {
            this.velocityX = 0;
        }
        
        // Прыжок
        if ((this.keys['w'] || this.keys['arrowup'] || this.keys[' ']) && this.isGrounded) {
            this.jump();
        }
        
        // Приседание
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.crouch();
        } else {
            this.uncrouch();
        }
        
        // Блок
        if (this.keys['f']) {
            this.block();
        } else {
            this.unblock();
        }
        
        // Атака мышью
        if (this.mouse.left && this.canAttack()) {
            this.attack();
        }
        
        // Даш мышью
        if (this.mouse.right && this.canDash()) {
            this.dash();
        }
    }
    
    updateTimers(deltaTime) {
        // Таймер атаки
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Таймер комбо
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.attackCombo = 0;
            }
        }
        
        // Таймер даша
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        // Таймеры способностей
        this.abilities.forEach(ability => {
            if (ability.onCooldown) {
                ability.cooldownTimer -= deltaTime;
                if (ability.cooldownTimer <= 0) {
                    ability.onCooldown = false;
                    this.updateAbilityUI();
                }
            }
        });
    }
    
    applyPhysics(deltaTime) {
        // Гравитация
        if (!this.isGrounded) {
            this.velocityY += 50 * deltaTime; // Гравитация
        }
        
        // Даш
        if (this.isDashing) {
            const dashSpeed = 20;
            this.velocityX = this.facing === 'right' ? dashSpeed : -dashSpeed;
        }
        
        // Обновление позиции
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Границы экрана
        this.x = Math.max(0, Math.min(this.x, 1024 - this.width));
        
        // Проверка земли
        if (this.y >= 400) {
            this.y = 400;
            this.velocityY = 0;
            this.isGrounded = true;
            this.isDashing = false; // Даш прекращается при приземлении
        } else {
            this.isGrounded = false;
        }
    }
    
    updateState() {
        if (this.isAttacking) {
            this.state = 'attack';
        } else if (this.isDashing) {
            this.state = 'dash';
        } else if (this.isBlocking) {
            this.state = 'block';
        } else if (!this.isGrounded) {
            this.state = 'jump';
        } else if (Math.abs(this.velocityX) > 0) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
    }
    
    updateEffects(deltaTime) {
        this.activeEffects.forEach((effect, index) => {
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
                this.activeEffects.splice(index, 1);
            }
        });
    }
    
    updateRegeneration(deltaTime) {
        // Reverse Cursed Technique - восстановление здоровья
        this.regenTimer += deltaTime;
        
        if (this.regenTimer >= 17) { // Каждые 17 секунд
            this.regenTimer = 0;
            const healAmount = 5 + Math.floor(this.awake / 20);
            this.health = Math.min(this.maxHealth, this.health + healAmount);
            
            // Уменьшение шкалы awake на 2-3%
            if (this.awake > 0) {
                this.awake = Math.max(0, this.awake - (2 + Math.random()));
            }
        }
    }
    
    jump() {
        if (this.isGrounded) {
            this.velocityY = -this.jumpForce;
            this.isGrounded = false;
        }
    }
    
    crouch() {
        this.height = 150;
        this.y = 430; // Корректировка позиции при приседании
    }
    
    uncrouch() {
        this.height = 180;
        this.y = 400;
    }
    
    block() {
        this.isBlocking = true;
        this.speed = 2; // Замедление при блоке
    }
    
    unblock() {
        this.isBlocking = false;
        this.speed = this.character.speed || 5;
    }
    
    canAttack() {
        return this.attackCooldown <= 0 && !this.isDashing;
    }
    
    attack() {
        this.isAttacking = true;
        this.attackCooldown = 0.5; // 500ms кд
        
        this.attackCombo++;
        this.comboTimer = 1; // 1 секунда на комбо
        
        // Увеличение шкалы awake при атаке
        this.awake = Math.min(this.maxAwake, this.awake + 2);
        
        // Сброс атаки через время
        setTimeout(() => {
            this.isAttacking = false;
        }, 200);
    }
    
    canDash() {
        return this.dashCooldown <= 0 && this.isGrounded;
    }
    
    dash() {
        this.isDashing = true;
        this.dashCooldown = 1; // 1 секунда кд
        
        // Даш прекращается через 0.3 секунды
        setTimeout(() => {
            if (this.isDashing) {
                this.isDashing = false;
            }
        }, 300);
    }
    
    useAbility(index) {
        const ability = this.abilities[index];
        if (!ability || ability.onCooldown || this.awake < ability.cost) {
            return false;
        }
        
        ability.onCooldown = true;
        ability.cooldownTimer = ability.cooldown / 1000; // Конвертируем мс в секунды
        
        // Расход awake
        this.awake = Math.max(0, this.awake - ability.cost);
        
        // Активация эффекта способности
        this.activateAbilityEffect(ability);
        
        // Обновление UI
        this.updateAbilityUI();
        
        return true;
    }
    
    activateAbilityEffect(ability) {
        switch(ability.name) {
            case 'Black Flash':
                // Увеличение урона
                this.activeEffects.push({
                    type: 'damageBoost',
                    multiplier: 2.5,
                    duration: 1 // 1 секунда
                });
                break;
                
            case 'Divergent Fist':
                // Дополнительный удар
                this.activeEffects.push({
                    type: 'doubleHit',
                    duration: 0.5 // 0.5 секунды
                });
                break;
                
            // Другие способности...
        }
    }
    
    updateAbilityUI() {
        if (!this.isPlayer) return;
        
        this.abilities.forEach((ability, index) => {
            const slot = document.querySelector(`[data-ability="${index + 1}"]`);
            if (slot) {
                const cooldownOverlay = slot.querySelector('.cooldown-overlay');
                
                if (ability.onCooldown) {
                    cooldownOverlay.style.display = 'flex';
                    
                    // Анимация кулдауна
                    const percentage = (ability.cooldownTimer / (ability.cooldown / 1000)) * 100;
                    cooldownOverlay.style.height = `${percentage}%`;
                    
                    // Текст кулдауна
                    cooldownOverlay.textContent = Math.ceil(ability.cooldownTimer);
                } else {
                    cooldownOverlay.style.display = 'none';
                }
                
                // Подсветка, если способность доступна
                if (!ability.onCooldown && this.awake >= ability.cost) {
                    slot.style.borderColor = '#00ffaa';
                } else {
                    slot.style.borderColor = ability.type === 'domain' ? '#6600ff' : 'rgba(255, 255, 255, 0.2)';
                }
            }
        });
    }
    
    takeDamage(damage) {
        // Уменьшение урона при блоке
        let finalDamage = damage;
        if (this.isBlocking) {
            finalDamage = Math.floor(damage * 0.3);
            this.state = 'block';
        }
        
        this.health = Math.max(0, this.health - finalDamage);
        this.state = 'hurt';
        
        // Эффект отбрасывания
        this.applyKnockback(finalDamage);
        
        // Сброс состояния через время
        setTimeout(() => {
            if (this.state === 'hurt') {
                this.state = 'idle';
            }
        }, 200);
        
        return finalDamage;
    }
    
    applyKnockback(damage) {
        const knockback = damage * 0.5;
        this.velocityX = this.facing === 'right' ? -knockback : knockback;
        this.velocityY = -knockback * 0.5;
    }
    
    calculateDamage() {
        let damage = this.damage;
        
        // Модификаторы из эффектов
        this.activeEffects.forEach(effect => {
            if (effect.type === 'damageBoost') {
                damage *= effect.multiplier;
            }
        });
        
        // Комбо модификатор
        if (this.attackCombo > 3) {
            damage *= 1.2;
        }
        
        return Math.floor(damage);
    }
    
    getAttackHitbox() {
        const attackRange = 80;
        const attackHeight = 60;
        
        return {
            x: this.facing === 'right' ? this.x + this.width : this.x - attackRange,
            y: this.y + this.height / 2 - attackHeight / 2,
            width: attackRange,
            height: attackHeight
        };
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    draw(ctx) {
        ctx.save();
        
        // Отрисовка персонажа
        this.drawCharacter(ctx);
        
        // Отрисовка хитбокса (для отладки)
        // this.drawHitbox(ctx);
        
        // Отрисовка имени
        this.drawName(ctx);
        
        ctx.restore();
    }
    
    drawCharacter(ctx) {
        // Временная отрисовка персонажа (в реальной игре здесь были бы спрайты)
        const color = this.character.color || 'linear-gradient(45deg, #ff0033, #ff6600)';
        
        // Тело
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, this.side === 'left' ? '#ff0033' : '#00e5ff');
        gradient.addColorStop(1, this.side === 'left' ? '#cc0000' : '#0066cc');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Детали в зависимости от состояния
        ctx.fillStyle = '#000';
        
        switch(this.state) {
            case 'attack':
                // Анимация атаки
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(
                    this.facing === 'right' ? this.x + this.width : this.x - 30,
                    this.y + this.height/2 - 10,
                    30, 20
                );
                break;
                
            case 'hurt':
                // Анимация получения урона
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(
                    this.x + this.width/2 - 10,
                    this.y + this.height/2 - 10,
                    20, 20
                );
                break;
                
            case 'block':
                // Анимация блока
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(
                    this.facing === 'right' ? this.x - 10 : this.x + this.width,
                    this.y,
                    10, this.height
                );
                break;
                
            case 'dash':
                // Эффект даша
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(
                        this.x - (this.facing === 'right' ? -i * 20 : i * 20),
                        this.y,
                        this.width,
                        this.height
                    );
                }
                break;
        }
    }
    
    drawHitbox(ctx) {
        // Для отладки
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        const attackHitbox = this.getAttackHitbox();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.strokeRect(attackHitbox.x, attackHitbox.y, attackHitbox.width, attackHitbox.height);
    }
    
    drawName(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.username, this.x + this.width/2, this.y - 10);
    }
    
    reset() {
        // Сброс позиции
        this.x = this.side === 'left' ? 200 : 700;
        this.y = 400;
        
        // Сброс состояния
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isAttacking = false;
        this.isDashing = false;
        this.isBlocking = false;
        this.state = 'idle';
        
        // Сброс комбо
        this.attackCombo = 0;
        this.comboTimer = 0;
        
        // Сброс регенерации
        this.regenTimer = 0;
    }
}