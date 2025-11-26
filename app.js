/**
 * HYPER-OS 3.0 LOGIC
 */

const App = {
    tasks: [],

    init() {
        this.loadTasks();
        this.loadTheme(); // Load saved theme
        this.render();
        this.setupEvents();
    },

    // --- THEME ENGINE ---
    setTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('hyperOS_theme', themeName);
        
        // Update Buttons Visual
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.theme-btn[onclick="App.setTheme('${themeName}')"]`).classList.add('active');
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('hyperOS_theme') || 'dark';
        this.setTheme(savedTheme);
    },

    // --- DATA ---
    loadTasks() {
        const saved = localStorage.getItem('hyperOS_v3_tasks');
        this.tasks = saved ? JSON.parse(saved) : [
            { id: 1, text: 'Check responsive layout', tag: 'bug', status: 'todo' },
            { id: 2, text: 'Design new theme icons', tag: 'urg', status: 'progress' }
        ];
    },

    saveTasks() {
        localStorage.setItem('hyperOS_v3_tasks', JSON.stringify(this.tasks));
        this.render();
    },

    // --- ACTIONS ---
    addTask(text) {
        let tag = 'gen';
        let cleanText = text;

        if (text.includes('#urg')) { tag = 'urg'; cleanText = text.replace('#urg', ''); }
        else if (text.includes('#bug')) { tag = 'bug'; cleanText = text.replace('#bug', ''); }

        const newTask = {
            id: Date.now(),
            text: cleanText.trim(),
            tag: tag,
            status: 'todo'
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.playSfx('pop');
    },

    updateStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id == id);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            this.saveTasks();
            this.playSfx('swish');
            if(newStatus === 'done') this.triggerConfetti();
        }
    },

    clearDone() {
        if(confirm("Clear all completed tasks?")) {
            this.tasks = this.tasks.filter(t => t.status !== 'done');
            this.saveTasks();
            this.playSfx('trash');
        }
    },

    // --- RENDER ---
    render() {
        ['todo', 'progress', 'done'].forEach(status => {
            const stack = document.getElementById(`stack-${status}`);
            stack.innerHTML = '';
            
            const filtered = this.tasks.filter(t => t.status === status);
            document.querySelector(`#zone-${status} .count`).innerText = filtered.length;

            filtered.forEach(task => {
                const card = document.createElement('div');
                card.className = 'card';
                card.draggable = true;
                
                // Tag Display
                let tagName = task.tag === 'urg' ? 'Urgent' : (task.tag === 'bug' ? 'Bug' : 'General');
                
                card.innerHTML = `
                    <span class="card-tag tag-${task.tag}">${tagName}</span>
                    <p>${task.text}</p>
                `;

                // Events
                card.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', task.id);
                    card.style.opacity = '0.5';
                });
                card.addEventListener('dragend', () => card.style.opacity = '1');
                
                // Double Click Delete
                card.addEventListener('dblclick', () => {
                     if(confirm('Delete?')) {
                         this.tasks = this.tasks.filter(t => t.id !== task.id);
                         this.saveTasks();
                     }
                });

                stack.appendChild(card);
            });
        });
    },

    // --- EVENTS ---
    setupEvents() {
        // Input
        const input = document.getElementById('task-input');
        const btn = document.getElementById('add-btn');
        const add = () => { if(input.value.trim()){ this.addTask(input.value); input.value=''; }};
        
        input.addEventListener('keypress', e => e.key === 'Enter' && add());
        btn.onclick = add;

        // Drop Logic
        ['todo', 'progress', 'done'].forEach(status => {
            const zone = document.getElementById(`zone-${status}`);
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                zone.style.borderColor = 'var(--accent)';
            });
            zone.addEventListener('dragleave', () => zone.style.borderColor = 'var(--border)');
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.style.borderColor = 'var(--border)';
                const id = e.dataTransfer.getData('text/plain');
                this.updateStatus(id, status);
            });
        });
    },

    // --- FX ---
    triggerConfetti() {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#6366f1', '#22c55e'] });
    },

    playSfx(type) {
        // Simple SFX implementation
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if(type==='pop') osc.frequency.setValueAtTime(600, ctx.currentTime);
        if(type==='swish') osc.frequency.setValueAtTime(300, ctx.currentTime);
        
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
};

window.onload = () => App.init();