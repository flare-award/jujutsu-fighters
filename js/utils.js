// Утилиты для игры
const Utils = {
    // Генерация случайного числа в диапазоне
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Проверка столкновения двух прямоугольников
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    // Проверка столкновения круга с прямоугольником
    circleRectCollision(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width / 2);
        const distY = Math.abs(circle.y - rect.y - rect.height / 2);
        
        if (distX > (rect.width / 2 + circle.radius)) return false;
        if (distY > (rect.height / 2 + circle.radius)) return false;
        
        if (distX <= (rect.width / 2)) return true;
        if (distY <= (rect.height / 2)) return true;
        
        const dx = distX - rect.width / 2;
        const dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= (circle.radius * circle.radius));
    },
    
    // Линейная интерполяция
    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    },
    
    // Ограничение значения
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Форматирование времени
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Загрузка изображения
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },
    
    // Загрузка JSON
    async loadJSON(url) {
        const response = await fetch(url);
        return await response.json();
    },
    
    // Сохранение в localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    },
    
    // Загрузка из localStorage
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    },
    
    // Создание элемента с атрибутами
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'class') {
                element.className = value;
            } else if (key === 'text') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    // Анимация элемента
    animate(element, animation, duration = 300) {
        return new Promise(resolve => {
            element.style.animation = `${animation} ${duration}ms`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    },
    
    // Виброотклик (если поддерживается)
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },
    
    // Копирование в буфер обмена
    copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    },
    
    // Предзагрузка ресурсов
    preloadResources(resources) {
        return Promise.all(
            resources.map(resource => {
                if (resource.endsWith('.json')) {
                    return this.loadJSON(resource);
                } else {
                    return this.loadImage(resource);
                }
            })
        );
    }
};

// Экспорт утилит
window.Utils = Utils;