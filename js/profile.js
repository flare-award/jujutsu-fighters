class ProfileManager {
    constructor() {
        this.profile = {
            username: '',
            avatar: null,
            stats: {
                wins: 0,
                losses: 0,
                fights: 0
            }
        };
        
        this.usedUsernames = new Set();
    }
    
    async load() {
        // Загрузка профиля из localStorage
        const saved = localStorage.getItem('jujutsu_profile');
        if (saved) {
            this.profile = JSON.parse(saved);
        } else {
            // Создание нового профиля
            this.profile.username = this.generateUsername();
            this.save();
        }
        
        // Загрузка занятых имен (в реальной игре это было бы с сервера)
        const used = localStorage.getItem('jujutsu_used_usernames');
        if (used) {
            this.usedUsernames = new Set(JSON.parse(used));
        }
        
        this.updateDisplay();
        return this.profile;
    }
    
    save() {
        // Сохранение профиля
        localStorage.setItem('jujutsu_profile', JSON.stringify(this.profile));
        
        // Обновление занятых имен
        this.usedUsernames.add(this.profile.username);
        localStorage.setItem('jujutsu_used_usernames', 
            JSON.stringify(Array.from(this.usedUsernames)));
        
        this.updateDisplay();
    }
    
    generateUsername() {
        let username;
        do {
            const randomNum = Math.floor(Math.random() * 10000);
            username = `Player_${randomNum.toString().padStart(4, '0')}`;
        } while (this.usedUsernames.has(username));
        
        return username;
    }
    
    setUsername(username) {
        const trimmed = username.trim();
        
        if (!trimmed) {
            throw new Error('Username cannot be empty');
        }
        
        if (trimmed.length > 16) {
            throw new Error('Username must be 16 characters or less');
        }
        
        if (this.usedUsernames.has(trimmed) && trimmed !== this.profile.username) {
            throw new Error('Username already taken');
        }
        
        // Удаляем старое имя из списка
        this.usedUsernames.delete(this.profile.username);
        
        this.profile.username = trimmed;
        return true;
    }
    
    setAvatar(avatarData) {
        this.profile.avatar = avatarData;
    }
    
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('Image size must be less than 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.setAvatar(e.target.result);
            this.updateAvatarPreview();
        };
        reader.readAsDataURL(file);
    }
    
    updateStats(result) {
        this.profile.stats.fights++;
        
        if (result === 'win') {
            this.profile.stats.wins++;
        } else if (result === 'loss') {
            this.profile.stats.losses++;
        }
        
        this.save();
    }
    
    getUsername() {
        return this.profile.username;
    }
    
    getAvatar() {
        return this.profile.avatar;
    }
    
    getStats() {
        return {
            ...this.profile.stats,
            winRate: this.profile.stats.fights > 0 ? 
                Math.round((this.profile.stats.wins / this.profile.stats.fights) * 100) : 0
        };
    }
    
    display() {
        // Отображение информации профиля
        const usernameInput = document.getElementById('profile-username');
        const previewLetter = document.getElementById('preview-letter');
        const avatarPreview = document.getElementById('avatar-preview');
        
        if (usernameInput) {
            usernameInput.value = this.profile.username;
        }
        
        // Обновление аватара
        this.updateAvatarPreview();
        
        // Обновление статистики
        const stats = this.getStats();
        document.getElementById('stat-wins').textContent = stats.wins;
        document.getElementById('stat-losses').textContent = stats.losses;
        document.getElementById('stat-winrate').textContent = `${stats.winRate}%`;
        document.getElementById('stat-fights').textContent = stats.fights;
        
        // Обработчик изменения имени
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.validateUsername(usernameInput.value);
            });
        }
    }
    
    updateAvatarPreview() {
        const previewLetter = document.getElementById('preview-letter');
        const avatarPreview = document.getElementById('avatar-preview');
        
        if (this.profile.avatar) {
            avatarPreview.style.backgroundImage = `url(${this.profile.avatar})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.style.backgroundPosition = 'center';
            if (previewLetter) previewLetter.style.display = 'none';
        } else {
            avatarPreview.style.backgroundImage = '';
            avatarPreview.style.background = 
                'linear-gradient(45deg, #ff0033, #ff6600)';
            if (previewLetter) {
                previewLetter.style.display = 'flex';
                previewLetter.textContent = this.profile.username.charAt(0).toUpperCase();
            }
        }
    }
    
    updateDisplay() {
        // Обновление отображения в меню
        const usernameElement = document.getElementById('username');
        const avatarElement = document.getElementById('user-avatar');
        const previewLetter = avatarElement.querySelector('.avatar-letter');
        
        if (usernameElement) {
            usernameElement.textContent = this.profile.username;
        }
        
        if (this.profile.avatar) {
            avatarElement.style.backgroundImage = `url(${this.profile.avatar})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
            previewLetter.style.display = 'none';
        } else {
            avatarElement.style.backgroundImage = '';
            avatarElement.style.background = 
                'linear-gradient(45deg, #ff0033, #ff6600)';
            previewLetter.style.display = 'flex';
            previewLetter.textContent = this.profile.username.charAt(0).toUpperCase();
        }
    }
    
    validateUsername(username) {
        const errorElement = document.getElementById('username-error');
        
        try {
            if (!username.trim()) {
                throw new Error('Username cannot be empty');
            }
            
            if (username.length > 16) {
                throw new Error('Username must be 16 characters or less');
            }
            
            if (this.usedUsernames.has(username) && username !== this.profile.username) {
                throw new Error('Username already taken');
            }
            
            errorElement.textContent = '';
            return true;
            
        } catch (error) {
            errorElement.textContent = error.message;
            return false;
        }
    }
}