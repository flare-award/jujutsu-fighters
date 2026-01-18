class CharacterManager {
    constructor() {
        this.characters = {};
        this.unlocked = new Set(['yuji_young']);
        this.currentCharacter = 'yuji_young';
        this.selectedCharacter = null;
    }
    
    async load() {
        // Загрузка данных персонажей
        this.characters = {
            yuji_young: {
                id: 'yuji_young',
                name: 'Yuji Itadori (Young)',
                grade: 'Grade 3',
                color: 'linear-gradient(45deg, #ff0033, #ff6600)',
                health: 100,
                speed: 5,
                jump: 15,
                damage: 10,
                abilities: [
                    {
                        name: 'Divergent Fist',
                        description: 'Second impact after punch',
                        damage: 25,
                        cooldown: 5000,
                        key: '1',
                        type: 'melee'
                    },
                    {
                        name: 'Black Flash',
                        description: '2.5x damage multiplier',
                        damage: 40,
                        cooldown: 10000,
                        key: '2',
                        type: 'special'
                    },
                    {
                        name: 'Small Knife',
                        description: 'Double dash attack',
                        damage: 20,
                        cooldown: 7000,
                        key: '3',
                        type: 'dash'
                    }
                ],
                domain: null,
                passive: 'Cursed Energy Reinforcement'
            },
            
            yuji: {
                id: 'yuji',
                name: 'Yuji Itadori',
                grade: 'Grade 1',
                color: 'linear-gradient(45deg, #ff3333, #cc0000)',
                health: 110,
                speed: 5,
                jump: 16,
                damage: 12,
                abilities: [
                    {
                        name: 'Piercing Blood',
                        description: 'Blood beam at speed of sound',
                        damage: 35,
                        cooldown: 8000,
                        key: '1',
                        type: 'projectile'
                    },
                    {
                        name: 'Dismantle',
                        description: 'Slashing attack through touch',
                        damage: 30,
                        cooldown: 6000,
                        key: '2',
                        type: 'melee'
                    },
                    {
                        name: 'Black Flash',
                        description: 'Enhanced 2.5x multiplier',
                        damage: 50,
                        cooldown: 12000,
                        key: '3',
                        type: 'special'
                    }
                ],
                domain: null,
                locked: true
            },
            
            gojo: {
                id: 'gojo',
                name: 'Satoru Gojo',
                grade: 'Special Grade',
                color: 'linear-gradient(45deg, #00ffff, #0066cc)',
                health: 120,
                speed: 6,
                jump: 18,
                damage: 15,
                abilities: [
                    {
                        name: 'Lapse Blue',
                        description: 'Creates vacuum pulling matter',
                        damage: 30,
                        cooldown: 7000,
                        key: '1',
                        type: 'aoe'
                    },
                    {
                        name: 'Reversal Red',
                        description: 'Powerful repulsive force',
                        damage: 40,
                        cooldown: 9000,
                        key: '2',
                        type: 'push'
                    },
                    {
                        name: 'Hollow Purple',
                        description: 'Imaginary mass destruction',
                        damage: 60,
                        cooldown: 15000,
                        key: '3',
                        type: 'projectile'
                    },
                    {
                        name: 'Unlimited Void',
                        description: 'Domain Expansion',
                        damage: 80,
                        cooldown: 90000,
                        key: '4',
                        type: 'domain'
                    }
                ],
                domain: 'Unlimited Void',
                locked: true
            },
            
            sukuna: {
                id: 'sukuna',
                name: 'Ryomen Sukuna',
                grade: 'Special Grade',
                color: 'linear-gradient(45deg, #ff00ff, #6600cc)',
                health: 130,
                speed: 5,
                jump: 15,
                damage: 18,
                abilities: [
                    {
                        name: 'Dismantle',
                        description: 'Ranged slashing attack',
                        damage: 35,
                        cooldown: 5000,
                        key: '1',
                        type: 'projectile'
                    },
                    {
                        name: 'Cleave',
                        description: 'Adaptive slashing attack',
                        damage: 45,
                        cooldown: 8000,
                        key: '2',
                        type: 'melee'
                    },
                    {
                        name: 'Divine Flame',
                        description: 'Fire manipulation',
                        damage: 55,
                        cooldown: 12000,
                        key: '3',
                        type: 'fire'
                    },
                    {
                        name: 'Malevolent Shrine',
                        description: 'Domain Expansion',
                        damage: 90,
                        cooldown: 90000,
                        key: '4',
                        type: 'domain'
                    }
                ],
                domain: 'Malevolent Shrine',
                locked: true
            },
            
            toji: {
                id: 'toji',
                name: 'Toji Fushiguro',
                grade: 'Sorcerer Killer',
                color: 'linear-gradient(45deg, #00cc00, #006600)',
                health: 115,
                speed: 7,
                jump: 20,
                damage: 20,
                abilities: [
                    {
                        name: 'Weapon Master',
                        description: 'Nullifies cursed techniques',
                        damage: 30,
                        cooldown: 6000,
                        key: '1',
                        type: 'melee'
                    },
                    {
                        name: 'Strong Blows',
                        description: 'Superhuman strength',
                        damage: 40,
                        cooldown: 8000,
                        key: '2',
                        type: 'melee'
                    },
                    {
                        name: 'Speed Moves',
                        description: 'Superhuman speed and reflexes',
                        damage: 25,
                        cooldown: 5000,
                        key: '3',
                        type: 'dash'
                    }
                ],
                domain: null,
                locked: true
            },
            
            yuta: {
                id: 'yuta',
                name: 'Yuta Okkotsu',
                grade: 'Special Grade',
                color: 'linear-gradient(45deg, #ffffff, #999999)',
                health: 125,
                speed: 5,
                jump: 16,
                damage: 14,
                abilities: [
                    {
                        name: 'Katana Hits',
                        description: 'Enhanced swordsmanship',
                        damage: 35,
                        cooldown: 6000,
                        key: '1',
                        type: 'melee'
                    },
                    {
                        name: 'Copy',
                        description: 'Copies random technique',
                        damage: 0,
                        cooldown: 20000,
                        key: '2',
                        type: 'special'
                    },
                    {
                        name: 'Summon Rika',
                        description: 'Cursed spirit companion',
                        damage: 50,
                        cooldown: 15000,
                        key: '3',
                        type: 'summon'
                    },
                    {
                        name: 'Authentic Mutual Love',
                        description: 'Domain Expansion',
                        damage: 85,
                        cooldown: 90000,
                        key: '4',
                        type: 'domain'
                    }
                ],
                domain: 'Authentic Mutual Love',
                locked: true
            }
        };
        
        // Загрузить разблокированных персонажей из localStorage
        const saved = localStorage.getItem('jujutsu_unlocked');
        if (saved) {
            const unlocked = JSON.parse(saved);
            unlocked.forEach(id => this.unlocked.add(id));
        }
        
        return this.characters;
    }
    
    getCharacter(id) {
        return this.characters[id];
    }
    
    getCurrent() {
        return this.characters[this.currentCharacter];
    }
    
    getSelected() {
        return this.selectedCharacter ? this.characters[this.selectedCharacter] : null;
    }
    
    selectCharacter(id) {
        if (this.isUnlocked(id)) {
            this.selectedCharacter = id;
            return true;
        }
        return false;
    }
    
    isUnlocked(id) {
        return this.unlocked.has(id);
    }
    
    unlockCharacter(id) {
        this.unlocked.add(id);
        this.saveUnlocked();
    }
    
    saveUnlocked() {
        const unlockedArray = Array.from(this.unlocked);
        localStorage.setItem('jujutsu_unlocked', JSON.stringify(unlockedArray));
    }
    
    displayAll() {
        const container = document.getElementById('characters-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(this.characters).forEach(char => {
            const isUnlocked = this.isUnlocked(char.id);
            const element = this.createCharacterElement(char, isUnlocked);
            container.appendChild(element);
        });
    }
    
    displaySelectable() {
        const container = document.getElementById('character-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(this.characters).forEach(char => {
            const isUnlocked = this.isUnlocked(char.id);
            const element = this.createSelectableCharacterElement(char, isUnlocked);
            
            element.addEventListener('click', () => {
                if (isUnlocked) {
                    // Убрать выделение у всех
                    container.querySelectorAll('.character-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Выделить выбранного
                    element.classList.add('selected');
                    
                    // Сохранить выбор
                    this.selectedCharacter = char.id;
                    
                    // Показать информацию о персонаже
                    this.displayCharacterInfo(char);
                }
            });
            
            container.appendChild(element);
        });
        
        // Показать информацию о первом доступном персонаже
        const firstChar = Object.values(this.characters).find(char => this.isUnlocked(char.id));
        if (firstChar) {
            this.displayCharacterInfo(firstChar);
            container.querySelector('.character-item').classList.add('selected');
            this.selectedCharacter = firstChar.id;
        }
    }
    
    createCharacterElement(char, isUnlocked) {
        const div = document.createElement('div');
        div.className = `character-item ${isUnlocked ? '' : 'locked'}`;
        
        div.innerHTML = `
            <div class="character-preview-box" style="background: ${char.color}"></div>
            <div class="character-name">${char.name}</div>
            <div class="character-grade ${this.getGradeClass(char.grade)}">${char.grade}</div>
            ${!isUnlocked ? '<div class="locked-label">LOCKED</div>' : ''}
        `;
        
        return div;
    }
    
    createSelectableCharacterElement(char, isUnlocked) {
        const div = document.createElement('div');
        div.className = `character-item ${isUnlocked ? '' : 'locked'}`;
        
        div.innerHTML = `
            <div class="character-preview-box" style="background: ${char.color}"></div>
            <div class="character-name">${char.name}</div>
            <div class="character-grade ${this.getGradeClass(char.grade)}">${char.grade}</div>
            ${!isUnlocked ? '<div class="locked-label">LOCKED</div>' : ''}
        `;
        
        return div;
    }
    
    displayCharacterInfo(char) {
        const nameElement = document.getElementById('char-name');
        const gradeElement = document.getElementById('char-grade');
        const abilitiesElement = document.getElementById('char-abilities');
        
        if (nameElement) nameElement.textContent = char.name;
        if (gradeElement) {
            gradeElement.textContent = char.grade;
            gradeElement.className = `char-grade ${this.getGradeClass(char.grade)}`;
        }
        
        if (abilitiesElement) {
            abilitiesElement.innerHTML = '';
            char.abilities.forEach(ability => {
                const abilityElement = document.createElement('div');
                abilityElement.className = 'ability';
                abilityElement.textContent = ability.name;
                abilitiesElement.appendChild(abilityElement);
            });
        }
    }
    
    getGradeClass(grade) {
        const gradeMap = {
            'Grade 4': 'grade-4',
            'Grade 3': 'grade-3',
            'Semi-Grade 2': 'semi-grade-2',
            'Grade 2': 'grade-2',
            'Semi-Grade 1': 'semi-grade-1',
            'Grade 1': 'grade-1',
            'Special Grade 1': 'special-grade-1',
            'Special Grade': 'special-grade',
            'Sorcerer Killer': 'sorcerer-killer'
        };
        
        return gradeMap[grade] || 'grade-unknown';
    }
    
    // Метод для отрисовки спрайта персонажа (упрощенная версия)
    drawCharacter(ctx, characterId, x, y, width, height, state = 'idle', frame = 0) {
        const char = this.characters[characterId];
        if (!char) return;
        
        // Сохраняем контекст
        ctx.save();
        
        // Отрисовка упрощенного спрайта (в реальной игре здесь были бы настоящие спрайты)
        ctx.fillStyle = char.color;
        ctx.fillRect(x, y, width, height);
        
        // Добавляем детали в зависимости от состояния
        ctx.fillStyle = '#000';
        
        if (state === 'attack') {
            // Анимация атаки
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(x + width, y + height/2 - 10, 30, 20);
        } else if (state === 'hurt') {
            // Анимация получения урона
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x + width/2 - 10, y + height/2 - 10, 20, 20);
        } else if (state === 'block') {
            // Анимация блока
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(x - 10, y, 10, height);
        }
        
        // Восстанавливаем контекст
        ctx.restore();
    }
}