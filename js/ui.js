// js/ui.js
class UIManager {
    constructor() {
        this.elements = {};
        this.notifications = [];
        this.comboCounter = 0;
        this.comboTimer = 0;
        this.damageNumbers = [];
    }
    
    // Создание UI элементов
    createHealthBar(playerId, x, y, width, height) {
        const bar = {
            id: `health-${playerId}`,
            x: x,
            y: y,
            width: width,
            height: height,
            value: 100,
            maxValue: 100,
            color: playerId === 1 ? '#ff3333' : '#3366ff',
            bgColor: '#333333',
            borderColor: '#666666',
            draw: this.drawHealthBar.bind(this)
        };
        
        this.elements[bar.id] = bar;
        return bar;
    }
    
    createAwakeBar(playerId, x, y, width, height) {
        const bar = {
            id: `awake-${playerId}`,
            x: x,
            y: y,
            width: width,
            height: height,
            value: 0,
            maxValue: 100,
            color: '#9900ff',
            bgColor: '#222222',
            borderColor: '#6600cc',
            glow: false,
            draw: this.drawAwakeBar.bind(this)
        };
        
        this.elements[bar.id] = bar;
        return bar;
    }
    
    // Отрисовка элементов
    drawHealthBar(ctx, bar) {
        // Фон
        ctx.fillStyle = bar.bgColor;
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        
        // Рамка
        ctx.strokeStyle = bar.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
        
        // Здоровье
        const healthWidth = (bar.value / bar.maxValue) * bar.width;
        
        // Градиент для здоровья
        const gradient = ctx.createLinearGradient(
            bar.x, bar.y, 
            bar.x + healthWidth, bar.y
        );
        
        if (bar.id.includes('1')) {
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#ff9900');
            gradient.addColorStop(1, '#00ff00');
        } else {
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.5, '#9900ff');
            gradient.addColorStop(1, '#0066ff');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(bar.x, bar.y, healthWidth, bar.height);
        
        // Текст
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `${Math.floor(bar.value)}/${bar.maxValue}`,
            bar.x + bar.width / 2,
            bar.y + bar.height / 2
        );
    }
    
    drawAwakeBar(ctx, bar) {
        // Фон
        ctx.fillStyle = bar.bgColor;
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        
        // Рамка с подсветкой
        ctx.strokeStyle = bar.glow ? '#ff00ff' : bar.borderColor;
        ctx.lineWidth = bar.glow ? 3 : 2;
        ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
        
        // Шкала пробуждения
        const awakeWidth = (bar.value / bar.maxValue) * bar.width;
        
        // Градиент для шкалы
        const gradient = ctx.createLinearGradient(
            bar.x, bar.y, 
            bar.x + awakeWidth, bar.y
        );
        gradient.addColorStop(0, '#6600cc');
        gradient.addColorStop(0.5, '#9900ff');
        gradient.addColorStop(1, '#ff00ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(bar.x, bar.y, awakeWidth, bar.height);
        
        // Текст "DOMAIN"
        ctx.fillStyle = bar.glow ? '#ffffff' : '#cccccc';
        ctx.font = 'bold 10px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            'DOMAIN',
            bar.x + bar.width / 2,
            bar.y + bar.height / 2
        );
        
        // Свечение при полной шкале
        if (bar.value >= bar.maxValue) {
            bar.glow = !bar.glow;
            this.createGlowEffect(bar.x, bar.y, bar.width, bar.height, '#ff00ff');
        } else {
            bar.glow = false;
        }
    }
    
    // Эффекты
    createGlowEffect(x, y, width, height, color) {
        const effect = {
            x: x,
            y: y,
            width: width,
            height: height,
            color: color,
            alpha: 1,
            lifetime: 30,
            draw: this.drawGlowEffect.bind(this)
        };
        
        this.notifications.push(effect);
    }
    
    drawGlowEffect(ctx, effect) {
        ctx.save();
        
        ctx.globalAlpha = effect.alpha;
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = effect.color;
        ctx.fillRect(
            effect.x - 5,
            effect.y - 5,
            effect.width + 10,
            effect.height + 10
        );
        
        ctx.restore();
        
        effect.alpha -= 1 / effect.lifetime;
    }
    
    // Комбо-система
    addCombo() {
        this.comboCounter++;
        this.comboTimer = 60; // 60 кадров = 1 секунда
        
        if (this.comboCounter >= 3) {
            this.showComboText();
        }
    }
    
    showComboText() {
        const comboText = {
            text: `${this.comboCounter} HIT COMBO!`,
            x: 512, // Центр экрана
            y: 200,
            size: 24 + this.comboCounter * 4,
            color: this.getComboColor(),
            alpha: 1,
            lifetime: 60,
            draw: this.drawComboText.bind(this)
        };
        
        this.notifications.push(comboText);
    }
    
    getComboColor() {
        if (this.comboCounter >= 10) return '#ff00ff';
        if (this.comboCounter >= 7) return '#ff9900';
        if (this.comboCounter >= 5) return '#ffff00';
        if (this.comboCounter >= 3) return '#00ffff';
        return '#ffffff';
    }
    
    drawComboText(ctx, text) {
        ctx.save();
        
        ctx.globalAlpha = text.alpha;
        ctx.fillStyle = text.color;
        ctx.font = `bold ${text.size}px "Pixelify Sans", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Тень
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(text.text, text.x, text.y);
        
        // Контур
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(text.text, text.x, text.y);
        
        ctx.restore();
        
        text.alpha -= 1 / text.lifetime;
        text.y -= 1; // Поднимаем текст вверх
    }
    
    // Числа урона
    showDamage(damage, x, y, critical = false) {
        const damageNumber = {
            value: damage,
            x: x,
            y: y,
            color: critical ? '#ff0000' : '#ff9900',
            size: critical ? 20 : 16,
            alpha: 1,
            lifetime: 30,
            velocityY: -3,
            draw: this.drawDamageNumber.bind(this)
        };
        
        this.damageNumbers.push(damageNumber);
    }
    
    drawDamageNumber(ctx, number) {
        ctx.save();
        
        ctx.globalAlpha = number.alpha;
        ctx.fillStyle = number.color;
        ctx.font = `bold ${number.size}px "Pixelify Sans", monospace`;
        ctx.textAlign = 'center';
        
        // Тень
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        
        ctx.fillText(`-${number.value}`, number.x, number.y);
        
        ctx.restore();
        
        number.alpha -= 1 / number.lifetime;
        number.y += number.velocityY;
        number.velocityY += 0.1; // Гравитация
    }
    
    // Обновление
    update() {
        // Обновление комбо-таймера
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.comboCounter = 0;
            }
        }
        
        // Обновление уведомлений
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const note = this.notifications[i];
            note.lifetime--;
            
            if (note.lifetime <= 0) {
                this.notifications.splice(i, 1);
            }
        }
        
        // Обновление чисел урона
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const number = this.damageNumbers[i];
            number.lifetime--;
            
            if (number.lifetime <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    // Отрисовка всего UI
    draw(ctx) {
        // Отрисовка всех элементов
        Object.values(this.elements).forEach(element => {
            element.draw(ctx, element);
        });
        
        // Отрисовка уведомлений
        this.notifications.forEach(note => {
            note.draw(ctx, note);
        });
        
        // Отрисовка чисел урона
        this.damageNumbers.forEach(number => {
            number.draw(ctx, number);
        });
        
        // Отображение комбо
        if (this.comboCounter > 0) {
            this.drawComboCounter(ctx);
        }
    }
    
    drawComboCounter(ctx) {
        const x = 512;
        const y = 50;
        
        ctx.save();
        
        // Фон
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 60, y - 20, 120, 40);
        
        // Текст комбо
        ctx.fillStyle = this.getComboColor();
        ctx.font = 'bold 24px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        
        ctx.fillText(`COMBO: ${this.comboCounter}`, x, y);
        
        // Таймер комбо
        const timerWidth = (this.comboTimer / 60) * 100;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x - 50, y + 15, timerWidth, 3);
        
        ctx.restore();
    }
}