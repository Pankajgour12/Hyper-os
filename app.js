/**
 * HYPER-OS ULTIMATE CONTROLLER
 * Features: Smart Tags, Search, Persistence, Confetti
 */

const App = {
    tasks: [],

    init() {
        this.loadTasks();
        this.render();
        this.setupEventListeners();
        console.log("Hyper-OS 2.0: Online");
    },

    // --- DATA ---
    loadTasks() {
        const saved = localStorage.getItem('hyperOS_v2');
        this.tasks = saved ? JSON.parse(saved) : [
            { id: 1, text: 'Review new UI Components', tag: 'design', status: 'todo' },
            { id: 2, text: 'Fix navigation bug', tag: 'urgent', status: 'progress' }
        ];
    },

    saveTasks() {
        localStorage.setItem('hyperOS_v2', JSON.stringify(this.tasks));
        this.render(); // Re-render to reflect changes
    },

    // --- SMART ADD ---
    addTask(rawText) {
        // Smart Tag Extraction logic
        let tag = 'general';
        let cleanText = rawText;

        if (rawText.includes('#urgent')) { tag = 'urgent'; cleanText = rawText.replace('#urgent', ''); }
        else if (rawText.includes('#design')) { tag = 'design'; cleanText = rawText.replace('#design', ''); }
        else if (rawText.includes('#dev')) { tag = 'dev'; cleanText = rawText.replace('#dev', ''); }

        const newTask = {
            id: Date.now(),
            text: cleanText.trim(),
            tag: tag,
            status: 'todo',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.playSfx('pop');
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id != id);
        this.saveTasks();
        this.playSfx('delete');
    },

    updateStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id == id);
        if(task && task.status !== newStatus) {
            task.status = newStatus;
            this.saveTasks();
            this.playSfx('whoosh');
            
            // 🎉 FEATURE: Confetti Blast on Done
            if(newStatus === 'done') this.triggerConfetti();
        }
    },

    // --- RENDER ---
    render(filterText = '') {
        ['todo', 'progress', 'done'].forEach(status => {
            const stack = document.getElementById(`stack-${status}`);
            stack.innerHTML = '';
            
            // Filter tasks based on search
            const filteredTasks = this.tasks.filter(t => 
                t.status === status && t.text.toLowerCase().includes(filterText.toLowerCase())
            );

            // Update Counts
            document.querySelector(`#zone-${status} .count`).innerText = filteredTasks.length;

            filteredTasks.forEach(task => {
                const card = document.createElement('div');
                card.className = 'card';
                card.draggable = true;
                card.dataset.id = task.id;

                card.innerHTML = `
                    <span class="card-tag tag-${task.tag}">${task.tag}</span>
                    <p>${task.text}</p>
                    <div class="card-meta">
                        <span>#${task.id.toString().slice(-4)}</span>
                        <span>${task.timestamp}</span>
                    </div>
                `;

                // Drag Events
                card.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setTimeout(() => card.classList.add('dragging'), 0);
                });
                card.addEventListener('dragend', () => card.classList.remove('dragging'));

                // 🗑️ FEATURE: Double Click to Delete
                card.addEventListener('dblclick', () => {
                    if(confirm("Delete this task?")) this.deleteTask(task.id);
                });

                stack.appendChild(card);
            });
        });
    },

    // --- EVENTS ---
    setupEventListeners() {
        // Add Task Input
        const input = document.getElementById('task-input');
        const addBtn = document.getElementById('add-btn');

        const handleAdd = () => {
            if(input.value.trim()) {
                this.addTask(input.value);
                input.value = '';
            }
        };

        input.addEventListener('keypress', e => e.key === 'Enter' && handleAdd());
        addBtn.onclick = handleAdd;

        // Drop Zones
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

        // Search Bar Logic
        const searchInput = document.getElementById('global-search');
        searchInput.addEventListener('input', (e) => this.render(e.target.value));

        // Keyboard Shortcuts
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggleSearch();
            }
            if (e.key === 'Escape') {
                document.getElementById('search-overlay').classList.remove('active');
            }
        });
    },

    // --- UTILS ---
    toggleSearch() {
        const overlay = document.getElementById('search-overlay');
        overlay.classList.toggle('active');
        if(overlay.classList.contains('active')) document.getElementById('global-search').focus();
    },

    triggerConfetti() {
        confetti({
            particleCount: 100, spread: 70, origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#f472b6']
        });
    },

    playSfx(type) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if(type === 'pop') {
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'delete') {
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        }
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }
};

window.onload = () => App.init();