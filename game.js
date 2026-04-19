(function () {
    'use strict';

    const CELL = 20;
    const BASE_SPEED = 160;

    const DIRS = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

    const FOOD_TYPES = {
        normal: { color: '#ff4757', points: 10, chance: 0.60, label: '🍎', name: '苹果' },
        speed: { color: '#ffa502', points: 15, chance: 0.12, label: '⚡', name: '加速果', effect: 'speed', duration: 4000 },
        slow: { color: '#7bed9f', points: 12, chance: 0.08, label: '🌿', name: '减速果', effect: 'slow', duration: 5000 },
        invisible: { color: '#a29bfe', points: 20, chance: 0.06, label: '👻', name: '隐身果', effect: 'invisible', duration: 3500 },
        clone: { color: '#ff6b81', points: 25, chance: 0.05, label: '👥', name: '分身果', effect: 'clone' },
        timefreeze: { color: '#70a1ff', points: 30, chance: 0.04, label: '❄️', name: '时间静止', effect: 'timefreeze', duration: 3000 },
        golden: { color: '#ffd700', points: 50, chance: 0.03, label: '⭐', name: '金果实', glow: true },
        bomb: { color: '#ff3838', points: -5, chance: 0.02, label: '💣', name: '炸弹', danger: true }
    };

    const SKINS = [
        { id: 'hero', name: '小主角', headColor: '#5dade2', bodyColor: '#3498db', imageSkin: true, unlocked: true, desc: '专属形象' },
        { id: 'classic', name: '经典绿', headColor: '#00cc66', bodyColor: '#00aa55', unlocked: true, desc: '默认皮肤' },
        { id: 'neon', name: '霓虹炫彩', headColor: '#00ffff', bodyColor: '#ff00ff', gradient: true, unlockScore: 200, desc: '累计得分200解锁' },
        { id: 'fire', name: '烈焰之蛇', headColor: '#ff4500', bodyColor: '#ff8c00', glow: true, unlockScore: 500, desc: '累计得分500解锁' },
        { id: 'ice', name: '冰霜巨蛇', headColor: '#00bfff', bodyColor: '#87ceeb', glow: true, unlockScore: 800, desc: '累计得分800解锁' },
        { id: 'gold', name: '黄金蟒', headColor: '#ffd700', bodyColor: '#daa520', glow: true, unlockScore: 1500, desc: '累计得分1500解锁' },
        { id: 'rainbow', name: '彩虹蛇', headColor: '#ff0000', bodyColor: null, rainbow: true, unlockScore: 2500, desc: '累计得分2500解锁' },
        { id: 'pixel', name: '复古像素', headColor: '#00ff88', bodyColor: '#00cc66', pixel: true, unlockScore: 1000, desc: '通关普通难度解锁' },
        { id: 'galaxy', name: '星河之蛇', headColor: '#9b59b6', bodyColor: '#3498db', galaxy: true, unlockScore: 3000, desc: '累计得分3000解锁' }
    ];

    const ACHIEVEMENTS = [
        { id: 'first_food', name: '初尝滋味', icon: '🍎', desc: '吃下第一个食物', check: s => s.totalFoods >= 1 },
        { id: 'length_10', name: '小有成就', icon: '🐍', desc: '蛇身长度达到10', check: s => s.maxLength >= 10 },
        { id: 'length_25', name: '长蛇之王', icon: '🐉', desc: '蛇身长度达到25', check: s => s.maxLength >= 25 },
        { id: 'length_50', name: '百蛇之王', icon: '👑', desc: '蛇身长度达到50', check: s => s.maxLength >= 50 },
        { id: 'score_500', name: '小试牛刀', icon: '💰', desc: '单局得分超过500', check: s => s.score >= 500 },
        { id: 'score_1000', name: '千分达人', icon: '💎', desc: '单局得分超过1000', check: s => s.score >= 1000 },
        { id: 'score_3000', name: '三千世界', icon: '🏆', desc: '单局得分超过3000', check: s => s.score >= 3000 },
        { id: 'combo_5', name: '连击新手', icon: '⚡', desc: '达成5连击', check: s => s.maxCombo >= 5 },
        { id: 'combo_10', name: '连击达人', icon: '🔥', desc: '达成10连击', check: s => s.maxCombo >= 10 },
        { id: 'combo_20', name: '连击大师', icon: '💫', desc: '达成20连击', check: s => s.maxCombo >= 20 },
        { id: 'survive_2min', name: '坚韧不拔', icon: '⏱️', desc: '存活超过2分钟', check: s => s.surviveTime >= 120 },
        { id: 'eat_special', name: '特效猎人', icon: '🎯', desc: '吃下5个特效食物', check: s => s.specialFoods >= 5 },
        { id: 'eat_golden', name: '黄金猎手', icon: '⭐', desc: '吃下金果实', check: s => s.goldenEaten > 0 },
        { id: 'no_bomb', name: '排雷专家', icon: '🛡️', desc: '一局未吃到炸弹且得分超300', check: s => s.bombEaten === 0 && s.score >= 300 },
        { id: 'master_clear', name: '大师通关', icon: '🎖️', desc: '大师难度存活超过3分钟', check: s => s.difficulty === 'master' && s.surviveTime >= 180 },
        { id: 'games_10', name: '老玩家', icon: '🎮', desc: '游玩10局', check: () => getStat('totalGames') >= 10 },
        { id: 'games_50', name: '贪吃蛇迷', icon: '🐍', desc: '游玩50局', check: () => getStat('totalGames') >= 50 }
    ];

    const MAP_THEMES = {
        starfield: { bg: '#0a0a1a', stars: true },
        forest: { bg: '#0a1f0a', grid: '#0d2a0d', accent: '#1a4a1a' },
        city: { bg: '#0a0a14', grid: '#111122', accent: '#1a1a2e' },
        pixel: { bg: '#1a1a2e', grid: '#222244', accent: '#333355', pixel: true }
    };

    let canvas, ctx;
    let gameState = 'menu';
    let gameMode = 'classic';
    let difficulty = 'easy';
    let timedSeconds = 0;
    let animationId = null;
    let lastTime = 0;
    let accumulator = 0;

    let snakes = [];
    let foods = [];
    let obstacles = [];
    let movingObstacles = [];
    let particles = [];
    let trails = [];

    let score = 0;
    let highScores = {};
    let comboCount = 0;
    let comboTimer = 0;
    let comboTimeout = 10000;
    let timeRemaining = 0;
    let gameTime = 0;
    let timeFrozen = false;
    let freezeTimer = 0;

    let currentSkin = 'hero';
    let mapTheme = 'starfield';
    let infiniteMode = false;
    let bgmVolume = 0.5;
    let sfxVolume = 0.7;
    let showTrail = true;
    let showParticles = true;
    let controlMode = 'buttons';

    let sessionStats = {};
    let totalScoreAllTime = 0;
    let unlockedSkins = ['classic'];
    let unlockedAchievements = [];
    let totalGamesPlayed = 0;

    let audioCtx = null;
    let bgmOscillator = null;
    let bgmGain = null;
    let bgmPlaying = false;

    let touchStartX = 0, touchStartY = 0;
    let tutorialStep = 0;

    const heroImg = new Image();
    heroImg.src = '主角.jpg';
    let heroReady = false;
    let headCache = null;
    let bodyCache = null;

    heroImg.onload = function () {
        heroReady = true;

        const headSize = CELL - 2;
        const hc = document.createElement('canvas');
        hc.width = headSize; hc.height = headSize;
        const hctx = hc.getContext('2d');
        roundPath(hctx, 0, 0, headSize, headSize, headSize * 0.35);
        hctx.clip();
        hctx.drawImage(heroImg, -headSize * 0.08, 0, headSize * 1.12, headSize);
        hctx.strokeStyle = 'rgba(93,173,226,0.8)';
        hctx.lineWidth = 2;
        hctx.stroke();
        headCache = hc;

        const bodySize = CELL - 5;
        const bc = document.createElement('canvas');
        bc.width = bodySize; bc.height = bodySize;
        const bctx = bc.getContext('2d');
        bctx.beginPath();
        bctx.arc(bodySize / 2, bodySize / 2, bodySize / 2 - 1, 0, Math.PI * 2);
        bctx.closePath();
        bctx.clip();
        bctx.drawImage(heroImg, -bodySize * 0.05, bodySize * 0.08, bodySize * 1.1, bodySize * 0.9);
        bctx.strokeStyle = 'rgba(93,173,226,0.6)';
        bctx.lineWidth = 1.5;
        bctx.stroke();
        bodyCache = bc;
    };

    function roundPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function drawHeroHead(x, y, dir) {
        if (!heroReady || !headCache) return;
        ctx.save();
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        ctx.translate(cx, cy);
        let angle = 0;
        if (dir[0] === 1) angle = 0;
        else if (dir[0] === -1) angle = Math.PI;
        else if (dir[1] === 1) angle = Math.PI / 2;
        else if (dir[1] === -1) angle = -Math.PI / 2;
        ctx.rotate(angle);

        ctx.shadowColor = 'rgba(93,173,226,0.7)';
        ctx.shadowBlur = 8;
        ctx.drawImage(headCache, -CELL / 2 + 1, -CELL / 2 + 1);
        ctx.restore();
    }

    function drawHeroBody(x, y) {
        if (!heroReady || !bodyCache) return;
        ctx.save();
        ctx.shadowColor = 'rgba(93,173,226,0.3)';
        ctx.shadowBlur = 4;
        ctx.drawImage(bodyCache, x + 2.5, y + 2.5);
        ctx.restore();
    }

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        loadSettings();
        bindEvents();
        resizeCanvas();
        renderSkins();
        renderAchievements();
        updateSettingsUI();
        showScreen('main-menu');
        if (!getStat('tutorialDone')) {
            setTimeout(() => showTutorial(), 500);
        }
    }

    function loadSettings() {
        try {
            const d = JSON.parse(localStorage.getItem('snake_settings') || '{}');
            if (d.currentSkin) currentSkin = d.currentSkin;
            if (d.mapTheme) mapTheme = d.mapTheme;
            if (d.bgmVolume !== undefined) bgmVolume = d.bgmVolume;
            if (d.sfxVolume !== undefined) sfxVolume = d.sfxVolume;
            if (d.showTrail !== undefined) showTrail = d.showTrail;
            if (d.showParticles !== undefined) showParticles = d.showParticles;
            if (d.controlMode) controlMode = d.controlMode;
            if (d.unlockedSkins) unlockedSkins = d.unlockedSkins;
            if (d.unlockedAchievements) unlockedAchievements = d.unlockedAchievements;
            if (d.highScores) highScores = d.highScores;
            totalScoreAllTime = getStat('totalScoreAllTime') || 0;
            totalGamesPlayed = getStat('totalGames') || 0;
        } catch (e) { }
    }

    function saveSettings() {
        try {
            localStorage.setItem('snake_settings', JSON.stringify({
                currentSkin, mapTheme, bgmVolume, sfxVolume,
                showTrail, showParticles, controlMode,
                unlockedSkins, unlockedAchievements, highScores
            }));
        } catch (e) { }
    }

    function getStat(key) {
        try { return parseInt(localStorage.getItem('snake_' + key)) || 0; } catch (e) { return 0; }
    }
    function setStat(key, val) {
        try { localStorage.setItem('snake_' + key, val); } catch (e) { }
    }

    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { audioCtx = null; }
    }

    function playSound(type, volMult = 1) {
        if (!audioCtx || sfxVolume <= 0) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const v = Math.max(0, Math.min(1, sfxVolume * volMult));
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.value = v * 0.3;
            switch (type) {
                case 'eat':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.15); break;
                case 'eatSpecial':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(660, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
                    gain.gain.value = v * 0.35;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.25); break;
                case 'speed':
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.2);
                    gain.gain.value = v * 0.2;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.25); break;
                case 'invisible':
                    osc.type = 'triangle'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.15);
                    osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.3);
                    gain.gain.value = v * 0.2;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.35); break;
                case 'clone':
                    osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
                    gain.gain.value = v * 0.18;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.2); break;
                case 'timefreeze':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
                    gain.gain.value = v * 0.22;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.4); break;
                case 'golden':
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                            o.connect(g); g.connect(audioCtx.destination);
                            o.type = 'sine'; o.frequency.setValueAtTime(880 + i * 200, audioCtx.currentTime);
                            g.gain.setValueAtTime(v * 0.2, audioCtx.currentTime);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                            o.start(); o.stop(audioCtx.currentTime + 0.3);
                        }, i * 60);
                    }
                    return;
                case 'bomb':
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
                    gain.gain.value = v * 0.3;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.35); break;
                case 'death':
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.5);
                    gain.gain.value = v * 0.25;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.55); break;
                case 'combo':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(1046, audioCtx.currentTime);
                    osc.frequency.setValueAtTime(1318, audioCtx.currentTime + 0.06);
                    osc.frequency.setValueAtTime(1567, audioCtx.currentTime + 0.12);
                    gain.gain.value = v * 0.25;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.2); break;
                case 'levelup':
                    const notes = [523, 659, 784, 1046];
                    notes.forEach((n, i) => {
                        setTimeout(() => {
                            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
                            o2.connect(g2); g2.connect(audioCtx.destination);
                            o2.type = 'sine'; o2.frequency.setValueAtTime(n, audioCtx.currentTime);
                            g2.gain.setValueAtTime(v * 0.2, audioCtx.currentTime);
                            g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                            o2.start(); o2.stop(audioCtx.currentTime + 0.2);
                        }, i * 80);
                    });
                    return;
                case 'click':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.05); break;
                case 'grow':
                    osc.type = 'triangle'; osc.frequency.setValueAtTime(100, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                    gain.gain.value = v * 0.15;
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.12); break;
            }
        } catch (e) { }
    }

    function startBGM() {
        if (!audioCtx || bgmVolume <= 0 || bgmPlaying) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            bgmPlaying = true;
            const melody = difficulty === 'master' ? [262, 330, 392, 523, 392, 330, 262] :
                difficulty === 'hard' ? [294, 349, 440, 349, 294] :
                    [349, 440, 523, 440, 349];
            let noteIdx = 0;
            function playNote() {
                if (!bgmPlaying) return;
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(audioCtx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(melody[noteIdx % melody.length], audioCtx.currentTime);
                g.gain.setValueAtTime(bgmVolume * 0.06, audioCtx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
                osc.start(); osc.stop(audioCtx.currentTime + 0.35);
                noteIdx++;
                if (bgmPlaying) setTimeout(playNote, 380);
            }
            playNote();
        } catch (e) { bgmPlaying = false; }
    }

    function stopBGM() {
        bgmPlaying = false;
    }

    function resizeCanvas() {
        const headerH = document.getElementById('game-header').offsetHeight || 44;
        const maxW = window.innerWidth - 16;
        const maxH = window.innerHeight - headerH - 80;
        const cols = Math.floor(maxW / CELL);
        const rows = Math.floor(maxH / CELL);
        canvas.width = cols * CELL;
        canvas.height = rows * CELL;
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    function hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    function showOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    class Snake {
        constructor(x, y, dir, playerIndex = 0) {
            this.body = [{ x, y }];
            this.dir = dir;
            this.nextDir = dir;
            this.speed = BASE_SPEED;
            this.baseSpeed = BASE_SPEED;
            this.alive = true;
            this.playerIndex = playerIndex;
            this.effects = { speed: 0, slow: 0, invisible: 0 };
            this.cloneSegments = [];
            this.moveAccum = 0;
            this.skinId = playerIndex === 0 ? currentSkin : 'fire';
            this.dirBuffer = [];
            this.score = 0;
        }

        get head() { return this.body[0]; }

        setDirection(d) {
            if (!d || d.length !== 2) return;
            const checkAgainst = this.dirBuffer.length > 0 ? this.dirBuffer[this.dirBuffer.length - 1] : this.nextDir;
            if (checkAgainst[0] === -d[0] && checkAgainst[1] === -d[1]) return;
            if (this.dirBuffer.length < 2) {
                this.dirBuffer.push(d);
            } else {
                this.dirBuffer[1] = d;
            }
        }

        update(dt) {
            if (!this.alive) return;
            this.updateEffects(dt);

            let spd = this.baseSpeed;
            if (this.effects.speed > 0) spd *= 0.6;
            if (this.effects.slow > 0) spd *= 1.6;

            this.moveAccum += dt;
            if (this.moveAccum < spd) return;
            this.moveAccum = 0;

            this.dir = [...this.nextDir];
            if (this.dirBuffer.length > 0) {
                const buf = this.dirBuffer.shift();
                if (this.nextDir[0] !== -buf[0] || this.nextDir[1] !== -buf[1]) {
                    this.nextDir = buf;
                }
            }
            const newHead = { x: this.head.x + this.dir[0], y: this.head.y + this.dir[1] };

            const gw = canvas.width / CELL, gh = canvas.height / CELL;
            
            if (infiniteMode) {
                if (newHead.x < 0) newHead.x = gw - 1;
                else if (newHead.x >= gw) newHead.x = 0;
                if (newHead.y < 0) newHead.y = gh - 1;
                else if (newHead.y >= gh) newHead.y = 0;
            } else {
                if (newHead.x < 0 || newHead.x >= gw || newHead.y < 0 || newHead.y >= gh) {
                    this.die(); return;
                }
            }

            for (let i = 1; i < this.body.length; i++) {
                if (this.body[i].x === newHead.x && this.body[i].y === newHead.y) {
                    if (this.effects.invisible > 0) continue;
                    this.die(); return;
                }
            }

            for (const obs of obstacles) {
                if (obs.x === newHead.x && obs.y === newHead.y) { this.die(); return; }
            }
            for (const obs of movingObstacles) {
                if (Math.round(obs.x) === newHead.x && Math.round(obs.y) === newHead.y) { this.die(); return; }
            }

            this.body.unshift(newHead);

            let ate = false;
            for (let i = foods.length - 1; i >= 0; i--) {
                if (foods[i].x === newHead.x && foods[i].y === newHead.y) {
                    ate = true;
                    handleEatFood(foods[i], this);
                    foods.splice(i, 1);
                    break;
                }
            }

            if (!ate) {
                this.body.pop();
            } else {
                playSound('grow');
                if (showTrail) addTrail(this.head.x, this.head.y, this.getSkinColor());
            }
        }

        updateEffects(dt) {
            for (const k of ['speed', 'slow', 'invisible']) {
                if (this.effects[k] > 0) this.effects[k] -= dt;
            }
            this.cloneSegments = this.cloneSegments.filter(c => c.life > 0);
            this.cloneSegments.forEach(c => c.life -= dt);
        }

        die() {
            this.alive = false;
            playSound('death');
            spawnParticles(this.head.x * CELL + CELL / 2, this.head.y * CELL + CELL / 2, 20, this.getSkinColor());
        }

        getSkinColor() {
            const skin = SKINS.find(s => s.id === this.skinId) || SKINS[0];
            return skin.bodyColor || skin.headColor;
        }

        draw() {
            if (!this.alive && this.body.length === 0) return;
            const skin = SKINS.find(s => s.id === this.skinId) || SKINS[0];

            this.cloneSegments.forEach((c, ci) => {
                const alpha = c.life / 5000;
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = skin.bodyColor || skin.headColor;
                roundRect(c.x * CELL + 2, c.y * CELL + 2, CELL - 4, CELL - 4, 5);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            if (skin.imageSkin && heroReady) {
                this.body.forEach((seg, i) => {
                    const px = seg.x * CELL;
                    const py = seg.y * CELL;
                    ctx.save();
                    if (this.effects.invisible > 0) {
                        ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 100) * 0.2;
                    }
                    if (i === 0) {
                        drawHeroHead(px, py, this.dir);
                    } else {
                        drawHeroBody(px, py);
                    }
                    ctx.restore();
                });
                return;
            }

            this.body.forEach((seg, i) => {
                const isHead = i === 0;
                let fillColor, strokeColor;

                if (skin.rainbow) {
                    const hue = ((Date.now() / 20) + i * 15) % 360;
                    fillColor = `hsl(${hue}, 80%, ${isHead ? 55 : 45}%)`;
                    strokeColor = `hsl(${hue}, 90%, ${isHead ? 65 : 55}%)`;
                } else if (skin.gradient) {
                    const t = i / Math.max(1, this.body.length - 1);
                    fillColor = lerpColor(skin.headColor, skin.bodyColor, t);
                    strokeColor = lighten(fillColor, 20);
                } else if (skin.galaxy) {
                    const hue = ((Date.now() / 30) + i * 10) % 360;
                    fillColor = `hsl(${hue + 240}, 70%, ${isHead ? 50 : 40}%)`;
                    strokeColor = `hsl(${hue + 240}, 80%, 60%)`;
                } else {
                    fillColor = isHead ? skin.headColor : skin.bodyColor;
                    strokeColor = lighten(fillColor, 25);
                }

                ctx.save();

                if (skin.glow || skin.id === 'fire') {
                    ctx.shadowColor = fillColor;
                    ctx.shadowBlur = isHead ? 14 : 8;
                }

                if (this.effects.invisible > 0) {
                    ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 100) * 0.2;
                }

                ctx.fillStyle = fillColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;

                const px = seg.x * CELL;
                const py = seg.y * CELL;
                const pad = skin.pixel ? 1 : 2;
                const r = skin.pixel ? 3 : 6;

                roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, r);
                ctx.fill();
                ctx.stroke();

                if (isHead) {
                    ctx.fillStyle = '#fff';
                    const eyeSize = 4;
                    const eyeOff = 5;
                    let e1x, e1y, e2x, e2y;
                    if (this.dir[0] === 1) {
                        e1x = px + CELL - eyeOff; e1y = py + eyeOff;
                        e2x = px + CELL - eyeOff; e2y = py + CELL - eyeOff;
                    } else if (this.dir[0] === -1) {
                        e1x = px + eyeOff; e1y = py + eyeOff;
                        e2x = px + eyeOff; e2y = py + CELL - eyeOff;
                    } else if (this.dir[1] === -1) {
                        e1x = px + eyeOff; e1y = py + eyeOff;
                        e2x = px + CELL - eyeOff; e2y = py + eyeOff;
                    } else {
                        e1x = px + eyeOff; e1y = py + CELL - eyeOff;
                        e2x = px + CELL - eyeOff; e2y = py + CELL - eyeOff;
                    }
                    ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2); ctx.fill();
                }

                ctx.restore();
            });

            if (this.effects.speed > 0) {
                ctx.save();
                ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 60) * 0.3;
                ctx.strokeStyle = '#ffa502';
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                this.body.forEach(seg => {
                    ctx.strokeRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
                });
                ctx.restore();
            }
            if (this.effects.invisible > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 80) * 0.2;
                ctx.strokeStyle = '#a29bfe';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                this.body.forEach(seg => {
                    ctx.strokeRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
                });
                ctx.restore();
            }
        }
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function lerpColor(c1, c2, t) {
        const hex = s => parseInt(s.slice(1), 16);
        const r1 = (hex(c1) >> 16) & 255, g1 = (hex(c1) >> 8) & 255, b1 = hex(c1) & 255;
        const r2 = (hex(c2) >> 16) & 255, g2 = (hex(c2) >> 8) & 255, b2 = hex(c2) & 255;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r},${g},${b})`;
    }

    function lighten(hex, amt) {
        let c = hex.startsWith('#') ? hex.slice(1) : hex;
        if (c.startsWith('rgb')) return hex;
        const num = parseInt(c, 16);
        let r = Math.min(255, ((num >> 16) & 255) + amt);
        let g = Math.min(255, ((num >> 8) & 255) + amt);
        let b = Math.min(255, (num & 255) + amt);
        return `rgb(${r},${g},${b})`;
    }

    function spawnFood() {
        const gw = canvas.width / CELL, gh = canvas.height / CELL;
        const maxFoods = difficulty === 'master' ? 5 : difficulty === 'hard' ? 4 : 3;
        if (foods.length >= maxFoods) return;

        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * gw);
            const y = Math.floor(Math.random() * gh);
            if (isOccupied(x, y)) { attempts++; continue; }

            const rand = Math.random();
            let cumulative = 0;
            let selectedType = 'normal';
            for (const [type, info] of Object.entries(FOOD_TYPES)) {
                cumulative += info.chance;
                if (rand < cumulative) { selectedType = type; break; }
            }

            const info = FOOD_TYPES[selectedType];
            foods.push({
                x, y, type: selectedType,
                color: info.color, points: info.points,
                spawnTime: Date.now(),
                pulsePhase: Math.random() * Math.PI * 2
            });
            if (info.effect !== 'normal') playSound('eatSpecial', 0.3);
            break;
            attempts++;
        }
    }

    function isOccupied(x, y) {
        for (const s of snakes) {
            for (const seg of s.body) { if (seg.x === x && seg.y === y) return true; }
        }
        for (const f of foods) { if (f.x === x && f.y === y) return true; }
        for (const o of obstacles) { if (o.x === x && o.y === y) return true; }
        for (const o of movingObstacles) { if (Math.round(o.x) === x && Math.round(o.y) === y) return true; }
        return false;
    }

    function handleEatFood(food, snake) {
        const info = FOOD_TYPES[food.type];

        sessionStats.totalFoods = (sessionStats.totalFoods || 0) + 1;

        if (food.type === 'bomb') {
            sessionStats.bombEaten = (sessionStats.bombEaten || 0) + 1;
            score = Math.max(0, score + food.points);
            snake.score = (snake.score || 0) + food.points;
            comboCount = 0;
            showToast('💣 炸弹！-5分', '#ff3838');
            playSound('bomb');
            snake.body.pop();
            snake.body.pop();
            if (snake.body.length < 3) snake.body = [{ x: snake.head.x, y: snake.head.y }, { x: snake.head.x, y: snake.head.y + 1 }, { x: snake.head.x, y: snake.head.y + 2 }];
            updateHUD();
            return;
        }

        if (food.type === 'golden') sessionStats.goldenEaten = (sessionStats.goldenEaten || 0) + 1;
        if (info.effect) sessionStats.specialFoods = (sessionStats.specialFoods || 0) + 1;

        comboCount++;
        comboTimer = comboTimeout;
        const multiplier = Math.min(5, 1 + Math.floor(comboCount / 3));
        const earned = food.points * multiplier;
        score += earned;
        snake.score = (snake.score || 0) + earned;

        showToast(`${info.label} ${info.name} +${earned}`, info.color);
        playSound(info.effect ? info.effect : (food.type === 'golden' ? 'golden' : 'eat'));

        if (info.effect && info.duration) {
            snake.effects[info.effect] = info.duration;
            showEffectDisplay(info.name, info.color, info.duration);
        }

        if (info.effect === 'clone') {
            const tail = snake.body[snake.body.length - 1];
            snake.cloneSegments.push({ x: tail.x, y: tail.y, life: 5000 });
            for (let i = 0; i < 3; i++) {
                const cx = tail.x + (Math.random() > 0.5 ? 1 : -1) * (i + 1);
                const cy = tail.y + (Math.random() > 0.5 ? 1 : -1) * (i + 1);
                snake.cloneSegments.push({ x: cx, y: cy, life: 5000 });
            }
        }

        if (info.effect === 'timefreeze') {
            timeFrozen = true;
            freezeTimer = info.duration;
        }

        if (multiplier > 1) {
            playSound('combo');
            document.getElementById('combo-display').innerHTML = `连击 x<strong>${multiplier}</strong>`;
            document.getElementById('combo-display').classList.remove('hidden');
        }

        spawnParticles(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 10, info.color);
        updateHUD();
    }

    function showEffectDisplay(name, color, duration) {
        const el = document.getElementById('effect-display');
        el.textContent = `${name} ${Math.ceil(duration / 1000)}s`;
        el.style.background = `${color}33`;
        el.style.border = `1px solid ${color}`;
        el.style.color = color;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), duration);
    }

    function showToast(text, borderColor) {
        const toast = document.getElementById('food-toast');
        document.getElementById('toast-text').textContent = text;
        toast.style.borderColor = borderColor;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3200);
    }

    function generateObstacles() {
        obstacles = [];
        movingObstacles = [];
        const gw = Math.floor(canvas.width / CELL);
        const gh = Math.floor(canvas.height / CELL);
        const cx = Math.floor(gw / 2), cy = Math.floor(gh / 2);

        if (difficulty === 'normal') {
            const patterns = [
                [[cx - 3, cy - 4], [cx - 3, cy - 3], [cx - 3, cy - 2]],
                [[cx + 3, cy + 2], [cx + 3, cy + 3], [cx + 3, cy + 4]],
                [[cx - 5, cy], [cx - 4, cy], [cx - 3, cy]],
                [[cx + 3, cy - 2], [cx + 4, cy - 2], [cx + 5, cy - 2]]
            ];
            patterns.flat().forEach(p => { if (p[0] > 0 && p[0] < gw - 1 && p[1] > 0 && p[1] < gh - 1) obstacles.push({ x: p[0], y: p[1] }); });
        } else if (difficulty === 'hard') {
            for (let i = 0; i < 8; i++) {
                const ox = 3 + Math.floor(Math.random() * (gw - 6));
                const oy = 3 + Math.floor(Math.random() * (gh - 6));
                if (Math.abs(ox - cx) > 4 || Math.abs(oy - cy) > 4) obstacles.push({ x: ox, y: oy });
            }
            for (let i = 0; i < 3; i++) {
                movingObstacles.push({ x: 2 + i * 5, y: 2 + i * 4, dx: (Math.random() > 0.5 ? 1 : -1) * 0.03, dy: (Math.random() > 0.5 ? 1 : -1) * 0.02 });
            }
        } else if (difficulty === 'master') {
            const count = 15 + Math.floor(Math.random() * 10);
            for (let i = 0; i < count; i++) {
                const ox = 2 + Math.floor(Math.random() * (gw - 4));
                const oy = 2 + Math.floor(Math.random() * (gh - 4));
                if (Math.abs(ox - cx) > 3 || Math.abs(oy - cy) > 3) obstacles.push({ x: ox, y: oy });
            }
            for (let i = 0; i < 5; i++) {
                movingObstacles.push({
                    x: 2 + Math.random() * (gw - 4), y: 2 + Math.random() * (gh - 4),
                    dx: (Math.random() - 0.5) * 0.05, dy: (Math.random() - 0.5) * 0.04
                });
            }
        }
    }

    function updateMovingObstacles(dt) {
        const gw = canvas.width / CELL, gh = canvas.height / CELL;
        movingObstacles.forEach(o => {
            if (timeFrozen) return;
            o.x += o.dx * dt;
            o.y += o.dy * dt;
            if (o.x <= 1 || o.x >= gw - 2) o.dx *= -1;
            if (o.y <= 1 || o.y >= gh - 2) o.dy *= -1;
            o.x = Math.max(1, Math.min(gw - 2, o.x));
            o.y = Math.max(1, Math.min(gh - 2, o.y));
        });
    }

    function startGame(mode, diff, timeLimit = 0) {
        initAudio();
        gameMode = mode;
        difficulty = diff;
        timedSeconds = timeLimit;
        timeRemaining = timeLimit;
        score = 0;
        comboCount = 0;
        comboTimer = 0;
        gameTime = 0;
        timeFrozen = false;
        freezeTimer = 0;
        foods = [];
        particles = [];
        trails = [];
        snakes = [];

        sessionStats = { score: 0, maxLength: 3, maxCombo: 0, totalFoods: 0, specialFoods: 0, goldenEaten: 0, bombEaten: 0, surviveTime: 0, difficulty: diff };

        resizeCanvas();
        const gw = canvas.width / CELL, gh = canvas.height / CELL;
        const sx = Math.floor(gw / 4), sy = Math.floor(gh / 2);

        if (mode === 'multiplayer') {
            snakes.push(new Snake(sx, sy, DIRS.RIGHT, 0));
            snakes.push(new Snake(Math.floor(gw * 3 / 4), sy, DIRS.LEFT, 1));
        } else {
            snakes.push(new Snake(sx, sy, DIRS.RIGHT, 0));
        }

        generateObstacles();
        for (let i = 0; i < 3; i++) spawnFood();

        document.getElementById('timer-display').classList.toggle('hidden', !timeLimit);
        document.getElementById('combo-display').classList.add('hidden');
        document.getElementById('effect-display').classList.add('hidden');

        const isMulti = mode === 'multiplayer';
        document.getElementById('single-hud').classList.toggle('hidden', isMulti);
        document.getElementById('multi-hud').classList.toggle('hidden', !isMulti);
        document.getElementById('p2-controls').classList.toggle('hidden', !isMulti);

        showScreen('game-screen');
        gameState = 'playing';
        lastTime = performance.now();
        accumulator = 0;

        startBGM();
        updateHUD();
        gameLoop(lastTime);
    }

    function gameLoop(timestamp) {
        if (gameState !== 'playing') return;
        animationId = requestAnimationFrame(gameLoop);

        const dt = timestamp - lastTime;
        lastTime = timestamp;
        accumulator += dt;

        if (timeFrozen) {
            freezeTimer -= dt;
            if (freezeTimer <= 0) { timeFrozen = false; }
        } else {
            gameTime += dt;
            sessionStats.surviveTime = Math.floor(gameTime / 1000);

            if (timedSeconds > 0) {
                timeRemaining -= dt / 1000;
                if (timeRemaining <= 0) {
                    endGame(true);
                    return;
                }
            }

            if (comboTimer > 0) {
                comboTimer -= dt;
                if (comboTimer <= 0) {
                    comboCount = 0;
                    document.getElementById('combo-display').classList.add('hidden');
                }
            }

            snakes.forEach(s => s.update(dt));
            updateMovingObstacles(dt);

            if (!timeFrozen && Math.random() < 0.01) spawnFood();
        }

        sessionStats.score = score;
        sessionStats.maxLength = Math.max(sessionStats.maxLength, snakes[0]?.body?.length || 3);
        sessionStats.maxCombo = Math.max(sessionStats.maxCombo, comboCount);

        const allDead = snakes.every(s => !s.alive);
        if (allDead) { endGame(false); return; }

        render();
        updateHUD();
    }

    function render() {
        const theme = MAP_THEMES[mapTheme] || MAP_THEMES.starfield;

        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (theme.stars) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let i = 0; i < 50; i++) {
                const sx = ((i * 137 + 13) * 7919) % canvas.width;
                const sy = ((i * 149 + 17) * 7907) % canvas.height;
                const sz = ((i % 3) + 1);
                ctx.fillRect(sx, sy, sz, sz);
            }
        }

        ctx.strokeStyle = theme.grid || 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gw = canvas.width / CELL, gh = canvas.height / CELL;
        for (let x = 0; x <= gw; x++) {
            ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= gh; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
        }

        if (showTrail) {
            trails = trails.filter(t => t.life > 0);
            trails.forEach(t => {
                t.life -= 16;
                ctx.globalAlpha = t.life / 300 * 0.3;
                ctx.fillStyle = t.color;
                roundRect(t.x * CELL + 4, t.y * CELL + 4, CELL - 8, CELL - 8, 4);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = theme.accent || 'rgba(255,255,255,0.08)';
        obstacles.forEach(o => {
            roundRect(o.x * CELL + 1, o.y * CELL + 1, CELL - 2, CELL - 2, 3);
            ctx.fill();
        });

        movingObstacles.forEach(o => {
            ctx.save();
            ctx.translate(o.x * CELL + CELL / 2, o.y * CELL + CELL / 2);
            ctx.rotate(gameTime / 500);
            ctx.fillStyle = '#ff4757';
            ctx.globalAlpha = 0.7;
            roundRect(-CELL / 2 + 2, -CELL / 2 + 2, CELL - 4, CELL - 4, 4);
            ctx.fill();
            ctx.restore();
        });

        const now = Date.now();
        foods.forEach(f => {
            const info = FOOD_TYPES[f.type];
            const pulse = Math.sin(now / 200 + f.pulsePhase) * 0.15 + 1;
            const size = CELL * 0.7 * (f.type !== 'normal' ? pulse : 1);
            const offset = (CELL - size) / 2;

            ctx.save();
            if (info.glow) {
                ctx.shadowColor = info.color;
                ctx.shadowBlur = 15;
            }
            if (f.type !== 'normal') {
                ctx.shadowColor = info.color;
                ctx.shadowBlur = 10;
            }

            if (timeFrozen) {
                ctx.globalAlpha = 0.5 + Math.sin(now / 100) * 0.3;
            }

            ctx.fillStyle = info.color;
            ctx.beginPath();
            ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            if (f.type === 'bomb') {
                ctx.fillStyle = '#222';
                ctx.font = `${size * 0.6}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💣', f.x * CELL + CELL / 2, f.y * CELL + CELL / 2);
            } else if (info.label && info.label.length > 1) {
                ctx.font = `${size * 0.55}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(info.label, f.x * CELL + CELL / 2, f.y * CELL + CELL / 2);
            }

            ctx.restore();
        });

        snakes.forEach(s => s.draw());

        if (showParticles) {
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                p.life -= 16;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                ctx.globalAlpha = p.life / p.maxLife;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        if (timeFrozen) {
            ctx.save();
            ctx.fillStyle = 'rgba(112, 161, 255, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(112, 161, 255, 0.6)';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`❄️ 时间冻结 ${Math.ceil(freezeTimer / 1000)}s`, canvas.width / 2, 36);
            ctx.restore();
        }
    }

    function spawnParticles(x, y, count, color) {
        if (!showParticles) return;
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                size: 2 + Math.random() * 4,
                color, life: 500, maxLife: 500
            });
        }
    }

    function addTrail(x, y, color) {
        trails.push({ x, y, color, life: 300 });
    }

    function updateHUD() {
        document.querySelector('#score-display strong').textContent = score;
        document.querySelector('#length-display strong').textContent = snakes[0]?.body?.length || 3;
        if (gameMode === 'multiplayer' && snakes.length >= 2) {
            const p1El = document.getElementById('p1-score');
            const p1Len = document.getElementById('p1-length');
            const p2El = document.getElementById('p2-score');
            const p2Len = document.getElementById('p2-length');
            if (p1El) p1El.textContent = snakes[0].score || 0;
            if (p1Len) p1Len.textContent = snakes[0]?.body?.length || 3;
            if (p2El) p2El.textContent = snakes[1].score || 0;
            if (p2Len) p2Len.textContent = snakes[1]?.body?.length || 3;
        }
        if (timedSeconds > 0) {
            document.querySelector('#timer-display strong').textContent = Math.ceil(Math.max(0, timeRemaining));
        }
        const key = `${gameMode}-${difficulty}`;
        const hs = highScores[key] || 0;
        document.querySelector('#highscore-display strong').textContent = Math.max(hs, score);
    }

    function pauseGame() {
        if (gameState !== 'playing') return;
        gameState = 'paused';
        cancelAnimationFrame(animationId);
        stopBGM();
        showOverlay('pause-overlay');
    }

    function resumeGame() {
        if (gameState !== 'paused') return;
        hideOverlay('pause-overlay');
        gameState = 'playing';
        initAudio();
        startBGM();
        lastTime = performance.now();
        gameLoop(lastTime);
    }

    function endGame(timeUp = false) {
        gameState = 'ended';
        cancelAnimationFrame(animationId);
        stopBGM();

        const key = `${gameMode}-${difficulty}`;
        if (!(highScores[key]) || score > highScores[key]) {
            highScores[key] = score;
            playSound('levelup');
        }

        totalScoreAllTime += score;
        setStat('totalScoreAllTime', totalScoreAllTime);
        totalGamesPlayed++;
        setStat('totalGames', totalGamesPlayed);

        sessionStats.score = score;
        sessionStats.maxLength = snakes[0]?.body?.length || 3;
        sessionStats.maxCombo = sessionStats.maxCombo || 0;

        checkAndUnlockSkins();
        checkAchievements();

        saveSettings();

        document.getElementById('gameover-title').textContent = timeUp ? '⏱️ 时间到！' : '💀 游戏结束';
        document.getElementById('go-score').textContent = score;
        document.getElementById('go-length').textContent = sessionStats.maxLength;
        document.getElementById('go-combo').textContent = sessionStats.maxCombo;
        document.getElementById('go-foods').textContent = sessionStats.totalFoods || 0;
        document.getElementById('go-time').textContent = sessionStats.surviveTime + 's';

        const newAchEl = document.getElementById('new-achievements');
        newAchEl.innerHTML = '';
        newAchEl.classList.add('hidden');

        showOverlay('gameover-overlay');
    }

    function checkAndUnlockSkins() {
        SKINS.forEach(skin => {
            if (unlockedSkins.includes(skin.id)) return;
            if (skin.unlockScore && totalScoreAllTime >= skin.unlockScore) {
                unlockedSkins.push(skin.id);
            }
        });
    }

    function checkAchievements() {
        const newOnes = [];
        ACHIEVEMENTS.forEach(a => {
            if (unlockedAchievements.includes(a.id)) return;
            try {
                if (a.check(sessionStats)) {
                    unlockedAchievements.push(a.id);
                    newOnes.push(a);
                }
            } catch (e) { }
        });

        if (newOnes.length > 0) {
            const el = document.getElementById('new-achievements');
            el.innerHTML = '<h4>🎉 新解锁成就：</h4>' +
                newOnes.map(a => `<div style="color:#ffc107;font-size:13px;margin:4px 0">${a.icon} ${a.name} - ${a.desc}</div>`).join('');
            el.classList.remove('hidden');
        }
    }

    function renderSkins() {
        const grid = document.getElementById('skins-grid');
        grid.innerHTML = '';
        SKINS.forEach(skin => {
            const unlocked = unlockedSkins.includes(skin.id);
            const equipped = currentSkin === skin.id;
            const card = document.createElement('div');
            card.className = `skin-card ${equipped ? 'equipped' : ''} ${!unlocked ? 'locked' : ''}`;
            if (skin.imageSkin) {
                card.innerHTML = `
                    <div class="skin-preview" style="background:#1a1a2e;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:4px;">
                        <img src="主角.jpg" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="${skin.name}">
                    </div>
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-status">${equipped ? '✅ 使用中' : (unlocked ? '点击装备' : '🔒 ' + (skin.desc || '未解锁'))}</div>
                `;
            } else {
                card.innerHTML = `
                    <div class="skin-preview" style="background:linear-gradient(135deg,${skin.headColor},${skin.bodyColor||skin.headColor});border-radius:10px;"></div>
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-status">${equipped ? '✅ 使用中' : (unlocked ? '点击装备' : '🔒 ' + (skin.desc || '未解锁'))}</div>
                `;
            }
            if (unlocked && !equipped) {
                card.onclick = () => {
                    currentSkin = skin.id;
                    saveSettings();
                    renderSkins();
                    playSound('click');
                };
            }
            grid.appendChild(card);
        });
    }

    function renderAchievements() {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        ACHIEVEMENTS.forEach(a => {
            const unlocked = unlockedAchievements.includes(a.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <span class="ach-icon">${a.icon}</span>
                <div class="ach-info">
                    <div class="ach-name">${a.name}</div>
                    <div class="ach-desc">${a.desc}</div>
                </div>
            `;
            list.appendChild(item);
        });
    }

    function updateSettingsUI() {
        document.getElementById('bgm-volume').value = bgmVolume * 100;
        document.getElementById('bgm-vol-val').textContent = Math.round(bgmVolume * 100) + '%';
        document.getElementById('sfx-volume').value = sfxVolume * 100;
        document.getElementById('sfx-vol-val').textContent = Math.round(sfxVolume * 100) + '%';
        document.getElementById('map-theme').value = mapTheme;
        document.getElementById('control-mode').value = controlMode;
        document.getElementById('trail-toggle').checked = showTrail;
        document.getElementById('particle-toggle').checked = showParticles;
        updateMobileControlsVisibility();
    }

    function updateMobileControlsVisibility() {
        const mc = document.getElementById('mobile-controls');
        mc.style.display = controlMode === 'buttons' ? 'flex' : 'none';
    }

    function showTutorial() {
        tutorialStep = 0;
        showOverlay('tutorial-overlay');
        renderTutorialStep();
    }

    function renderTutorialStep() {
        const steps = [
            { title: '欢迎来到贪吃蛇！', text: '使用方向键 ↑↓←→ 或 WASD 控制蛇的移动方向。' },
            { title: '吃食物变长', text: '吞噬食物让蛇变长，获得分数。小心不要撞墙或咬到自己！' },
            { title: '特效食物', text: '金色光晕的是特效食物：加速⚡、隐身👻、分身👥、时间冻结❄️ 等，每种都有独特效果！' },
            { title: '准备好了吗？', text: '选择难度开始游戏吧！祝你玩得开心 🎮' }
        ];
        const step = steps[tutorialStep];
        document.getElementById('tut-title').textContent = step.title;
        document.getElementById('tut-text').textContent = step.text;
        document.getElementById('tut-progress').textContent = `${tutorialStep + 1}/${steps.length}`;
        document.getElementById('tut-prev').disabled = tutorialStep === 0;
        document.getElementById('tut-next').textContent = tutorialStep === steps.length - 1 ? '开始游戏！' : '下一步';

        const tCanvas = document.getElementById('tutorial-canvas');
        const tCtx = tCanvas.getContext('2d');
        tCtx.clearRect(0, 0, 300, 200);
        tCtx.fillStyle = '#111';
        tCtx.fillRect(0, 0, 300, 200);

        const demoSnake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }];
        demoSnake.forEach((seg, i) => {
            tCtx.fillStyle = i === 0 ? '#00cc66' : '#00aa55';
            tCtx.fillRect(seg.x * 15 + 2, seg.y * 15 + 2, 11, 11);
        });
        tCtx.fillStyle = '#ff4757';
        tCtx.beginPath(); tCtx.arc(8 * 15 + 7.5, 5 * 15 + 7.5, 6, 0, Math.PI * 2); tCtx.fill();
        tCtx.fillStyle = '#ffd700';
        tCtx.beginPath(); tCtx.arc(11 * 15 + 7.5, 3 * 15 + 7.5, 6, 0, Math.PI * 2); tCtx.fill();
    }

    function bindEvents() {
        document.getElementById('btn-classic').onclick = () => { playSound('click'); showScreen('difficulty-screen'); };
        document.getElementById('btn-timed').onclick = () => { playSound('click'); showScreen('timed-screen'); };
        document.getElementById('btn-multiplayer').onclick = () => { playSound('click'); startGame('multiplayer', 'normal'); };
        document.getElementById('btn-infinite').onclick = () => {
            playSound('click');
            infiniteMode = !infiniteMode;
            const btn = document.getElementById('btn-infinite');
            btn.style.background = infiniteMode ? 'rgba(0, 255, 136, 0.3)' : '';
            btn.style.borderColor = infiniteMode ? '#00ff88' : '';
            showToast(infiniteMode ? '♾️ 无限模式已开启' : '🎮 经典模式已开启', infiniteMode ? '#00ff88' : '#5dade2');
        };
        document.getElementById('btn-skins').onclick = () => { playSound('click'); renderSkins(); showScreen('skins-screen'); };
        document.getElementById('btn-achievements').onclick = () => { playSound('click'); renderAchievements(); showScreen('achievements-screen'); };
        document.getElementById('btn-settings').onclick = () => { playSound('click'); showScreen('settings-screen'); };

        document.querySelectorAll('.diff-btn:not(.timed-btn)').forEach(btn => {
            btn.onclick = () => { playSound('click'); startGame('classic', btn.dataset.diff); };
        });
        document.querySelectorAll('.timed-btn').forEach(btn => {
            btn.onclick = () => { playSound('click'); startGame('timed', 'normal', parseInt(btn.dataset.time)); };
        });

        document.getElementById('back-from-diff').onclick = () => { playSound('click'); showScreen('main-menu'); };
        document.getElementById('back-from-timed').onclick = () => { playSound('click'); showScreen('main-menu'); };
        document.getElementById('back-from-skins').onclick = () => { playSound('click'); showScreen('main-menu'); };
        document.getElementById('back-from-achieve').onclick = () => { playSound('click'); showScreen('main-menu'); };
        document.getElementById('back-from-settings').onclick = () => { playSound('click'); showScreen('main-menu'); };

        document.getElementById('btn-pause').onclick = () => pauseGame();
        document.getElementById('btn-resume').onclick = () => resumeGame();
        document.getElementById('btn-restart').onclick = () => { hideOverlay('pause-overlay'); startGame(gameMode, difficulty, timedSeconds); };
        document.getElementById('btn-quit-menu').onclick = () => { hideOverlay('pause-overlay'); stopBGM(); showScreen('main-menu'); };

        document.getElementById('btn-playagain').onclick = () => { hideOverlay('gameover-overlay'); startGame(gameMode, difficulty, timedSeconds); };
        document.getElementById('btn-back-menu').onclick = () => { hideOverlay('gameover-overlay'); showScreen('main-menu'); };

        document.getElementById('bgm-volume').oninput = function () {
            bgmVolume = this.value / 100;
            document.getElementById('bgm-vol-val').textContent = this.value + '%';
            saveSettings();
        };
        document.getElementById('sfx-volume').oninput = function () {
            sfxVolume = this.value / 100;
            document.getElementById('sfx-vol-val').textContent = this.value + '%';
            saveSettings();
        };
        document.getElementById('map-theme').onchange = function () {
            mapTheme = this.value; saveSettings();
        };
        document.getElementById('control-mode').onchange = function () {
            controlMode = this.value; saveSettings(); updateMobileControlsVisibility();
        };
        document.getElementById('trail-toggle').onchange = function () {
            showTrail = this.checked; saveSettings();
        };
        document.getElementById('particle-toggle').onchange = function () {
            showParticles = this.checked; saveSettings();
        };

        document.addEventListener('keydown', e => {
            if (gameState !== 'playing') {
                if (e.key === 'Escape' && gameState === 'paused') resumeGame();
                return;
            }
            const wasdMap = {
                w: DIRS.UP, W: DIRS.UP, s: DIRS.DOWN, S: DIRS.DOWN,
                a: DIRS.LEFT, A: DIRS.LEFT, d: DIRS.RIGHT, D: DIRS.RIGHT
            };
            const arrowMap = {
                ArrowUp: DIRS.UP, ArrowDown: DIRS.DOWN,
                ArrowLeft: DIRS.LEFT, ArrowRight: DIRS.RIGHT
            };
            if (gameMode === 'multiplayer') {
                if (wasdMap[e.key]) { e.preventDefault(); snakes[0]?.setDirection(wasdMap[e.key]); }
                if (arrowMap[e.key]) { e.preventDefault(); snakes[1]?.setDirection(arrowMap[e.key]); }
            } else {
                const allKeys = { ...wasdMap, ...arrowMap };
                if (allKeys[e.key]) { e.preventDefault(); snakes[0]?.setDirection(allKeys[e.key]); }
            }
            if (e.key === ' ') { e.preventDefault(); pauseGame(); }
            if (e.key === 'Escape') pauseGame();
        });

        document.querySelectorAll('.ctrl-btn').forEach(btn => {
            let lastPressTime = 0;
            function onPress(e) {
                const now = Date.now();
                if (now - lastPressTime < 30) return;
                lastPressTime = now;
                e.preventDefault();
                const playerIdx = parseInt(btn.dataset.player || '0');
                handleControlInput(btn.dataset.dir, playerIdx);
                btn.classList.add('ctrl-pressed');
                setTimeout(() => btn.classList.remove('ctrl-pressed'), 100);
            }
            btn.addEventListener('pointerdown', onPress, { passive: false });
            btn.addEventListener('click', onPress, { passive: false });
            btn.addEventListener('touchend', e => { e.preventDefault(); }, { passive: false });
        });

        canvas.addEventListener('touchstart', e => {
            if (controlMode !== 'swipe' || gameState !== 'playing') return;
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            if (controlMode !== 'swipe' || gameState !== 'playing') return;
            e.preventDefault();
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                handleControlInput(dx > 0 ? 'right' : 'left');
            } else {
                handleControlInput(dy > 0 ? 'down' : 'up');
            }
        }, { passive: false });

        document.getElementById('tut-prev').onclick = () => {
            if (tutorialStep > 0) { tutorialStep--; renderTutorialStep(); playSound('click'); }
        };
        document.getElementById('tut-next').onclick = () => {
            if (tutorialStep < 3) { tutorialStep++; renderTutorialStep(); playSound('click'); }
            else { hideOverlay('tutorial-overlay'); setStat('tutorialDone', 1); showScreen('difficulty-screen'); }
        };

        window.addEventListener('resize', () => { if (gameState === 'playing') resizeCanvas(); });
    }

    function handleControlInput(dir, playerIdx) {
        if (gameState !== 'playing') return;
        const dirMap = { up: DIRS.UP, down: DIRS.DOWN, left: DIRS.LEFT, right: DIRS.RIGHT };
        if (dirMap[dir] && snakes[playerIdx]) {
            snakes[playerIdx].setDirection(dirMap[dir]);
            playSound('click');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
