// js/effects.js
class EffectsManager {
    constructor() {
        this.activeEffects = [];
    }
    
    // Создать эффект способности
    createAbilityEffect(abilityName, x, y, direction) {
        const effect = {
            type: abilityName,
            x: x,
            y: y,
            direction: direction,
            lifetime: 100, // Кадры жизни
            maxLifetime: 100,
            scale: Sprites.SCALE,
            draw: this.drawAbilityEffect.bind(this)
        };
        
        this.activeEffects.push(effect);
        return effect;
    }
    
    drawAbilityEffect(ctx, effect) {
        const alpha = effect.lifetime / effect.maxLifetime;
        
        switch(effect.type) {
            case 'Divergent Fist':
                this.drawDivergentFist(ctx, effect, alpha);
                break;
                
            case 'Black Flash':
                this.drawBlackFlash(ctx, effect, alpha);
                break;
                
            case 'Hollow Purple':
                this.drawHollowPurple(ctx, effect, alpha);
                break;
                
            case 'Domain Expansion':
                this.drawDomainExpansion(ctx, effect, alpha);
                break;
                
            default:
                this.drawBasicEffect(ctx, effect, alpha);
        }
    }
    
    drawDivergentFist(ctx, effect, alpha) {
        ctx.save();
        
        const size = 20 * effect.scale * (1 - alpha * 0.5);
        const x = effect.direction === 'right' ? 
            effect.x + size : 
            effect.x - size;
        
        // Внутренний круг
        ctx.fillStyle = `rgba(255, 204, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, effect.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Внешний круг
        ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, effect.y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Пиксельный эффект
        const sprite = Sprites.effects.divergent_fist;
        const palette = [
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            `rgba(255, 204, 0, ${alpha})`,
            `rgba(255, 102, 0, ${alpha})`
        ];
        sprite.palette = palette;
        
        Sprites.drawSprite(
            ctx,
            sprite,
            x - (sprite[0].length * effect.scale) / 2,
            effect.y - (sprite.length * effect.scale) / 2,
            effect.scale
        );
        
        ctx.restore();
    }
    
    drawBlackFlash(ctx, effect, alpha) {
        ctx.save();
        
        const size = 30 * effect.scale * (1 - alpha * 0.5);
        const x = effect.x;
        const y = effect.y;
        
        // Черная сфера
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Фиолетовые искры
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sparkLength = size * (1.5 + Math.random());
            const sparkX = x + Math.cos(angle) * sparkLength;
            const sparkY = y + Math.sin(angle) * sparkLength;
            
            // Градиент для искры
            const gradient = ctx.createLinearGradient(x, y, sparkX, sparkY);
            gradient.addColorStop(0, `rgba(102, 0, 204, ${alpha})`);
            gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(sparkX, sparkY);
            ctx.stroke();
        }
        
        // Пиксельный эффект черной вспышки
        const sprite = Sprites.effects.black_flash;
        const palette = [
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            `rgba(102, 0, 204, ${alpha})`
        ];
        sprite.palette = palette;
        
        Sprites.drawSprite(
            ctx,
            sprite,
            x - (sprite[0].length * effect.scale) / 2,
            y - (sprite.length * effect.scale) / 2,
            effect.scale
        );
        
        ctx.restore();
    }
    
    drawHollowPurple(ctx, effect, alpha) {
        ctx.save();
        
        const size = 50 * effect.scale * (1 - alpha * 0.3);
        const x = effect.x;
        const y = effect.y;
        
        // Фиолетовая сфера
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(153, 51, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Вращающиеся частицы
        const time = Date.now() / 1000;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time;
            const particleX = x + Math.cos(angle) * size * 0.8;
            const particleY = y + Math.sin(angle) * size * 0.8;
            const particleSize = 5 + Math.sin(time * 10 + i) * 3;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawDomainExpansion(ctx, effect, alpha) {
        ctx.save();
        
        const size = 100 * effect.scale;
        const x = effect.x;
        const y = effect.y;
        
        // Фоновый узор
        const bgSprite = Sprites.effects.domain_expansion.background;
        const bgPalette = Sprites.effects.domain_expansion.palette;
        bgSprite.palette = bgPalette.map(color => {
            const rgba = this.hexToRgba(color, alpha * 0.7);
            return rgba;
        });
        
        // Рисуем узор несколько раз для создания большого поля
        const patternSize = bgSprite[0].length * effect.scale;
        for (let dy = -size; dy < size; dy += patternSize) {
            for (let dx = -size; dx < size; dx += patternSize) {
                if (Math.sqrt(dx*dx + dy*dy) < size) {
                    Sprites.drawSprite(
                        ctx,
                        bgSprite,
                        x + dx - patternSize/2,
                        y + dy - patternSize/2,
                        effect.scale
                    );
                }
            }
        }
        
        // Граница домена
        ctx.strokeStyle = `rgba(102, 0, 204, ${alpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Вращающиеся символы
        const time = Date.now() / 1000;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.5;
            const symbolX = x + Math.cos(angle) * size * 0.7;
            const symbolY = y + Math.sin(angle) * size * 0.7;
            
            ctx.save();
            ctx.translate(symbolX, symbolY);
            ctx.rotate(angle);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('呪', 0, 0);
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    drawBasicEffect(ctx, effect, alpha) {
        ctx.save();
        
        const size = 15 * effect.scale;
        const x = effect.direction === 'right' ? 
            effect.x + size : 
            effect.x - size;
        
        ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, effect.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    update() {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.lifetime--;
            
            if (effect.lifetime <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.activeEffects.forEach(effect => {
            effect.draw(ctx, effect);
        });
    }
}