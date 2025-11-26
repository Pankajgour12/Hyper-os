/**
 * HYPER-OS CONTROLLER
 * Focus: Stability, Smoothness, and Persistence.
 */

const App = {
    tasks: [],

    init() {
        this.loadTasks();
        this.startClock();
        this.setupEventListeners();
        this.render();
    },

    // --- DATA MANAGEMENT ---
    loadTasks() {
        const saved = localStorage.getItem('hyper-os-tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        } else {
            // Initial Seed Data
            this.tasks = [
                { id: 1, text: 'Review System Architecture', status: 'todo', tag: 'System' },
                { id: 2, text: 'Design High-Fidelity Mockups', status: 'progress', tag: 'Design' }
            ];
        }
    },

    saveTasks() {
        localStorage.setItem('hyper-os-tasks', JSON.stringify(this.tasks));
        this.render();
    },

    addTask(text) {
        const newTask = {
            id: Date.now(),
            text: text,
            status: 'todo',
            tag: Math.random() > 0.5 ? 'Design' : 'System' // Auto-tag simulation
        };
        this.tasks.push(newTask);
        this.saveTasks();
        this.playSfx('pop');
    },

    updateTaskStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id == id);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            this.saveTasks();
            this.playSfx('whoosh');
        }
    },

    // --- RENDERING ---
    render() {
        // Clear columns
        ['todo', 'progress', 'done'].forEach(status => {
            document.getElementById(`stack-${status}`).innerHTML = '';
            // Update counts
            const count = this.tasks.filter(t => t.status === status).length;
            document.querySelector(`#zone-${status} .count`).innerText = count;
        });

        // Create Cards
        this.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('draggable', true);
            card.setAttribute('data-id', task.id);
            
            // Visual Tag Color
            const tagClass = task.tag === 'Design' ? 'tag-purple' : 'tag-blue';

            card.innerHTML = `
                <span class="card-tag ${tagClass}">${task.tag}</span>
                <p>${task.text}</p>
                <div class="card-meta">
                    <span>#${task.id.toString().slice(-4)}</span>
                    <span>Now</span>
                </div>
            `;

            this.attachDragEvents(card);
            document.getElementById(`stack-${task.status}`).appendChild(card);
        });
    },

    // --- INTERACTIONS ---
    setupEventListeners() {
        // Input Logic
        const input = document.getElementById('task-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                this.addTask(input.value.trim());
                input.value = '';
            }
        });

        // Drop Zone Logic
        ['todo', 'progress', 'done'].forEach(status => {
            const zone = document.getElementById(`zone-${status}`);
            
            zone.addEventListener('dragover', (e) => {
                e.preventDefault(); // Essential for dropping
                zone.style.borderColor = 'var(--accent)';
            });

            zone.addEventListener('dragleave', () => {
                zone.style.borderColor = 'var(--glass-border)';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.style.borderColor = 'var(--glass-border)';
                const id = e.dataTransfer.getData('text/plain');
                this.updateTaskStatus(id, status);
            });
        });
    },

    attachDragEvents(card) {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    },

    // --- UTILITIES ---
    startClock() {
        const update = () => {
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };
        setInterval(update, 1000);
        update();
    },

    playSfx(type) {
        // Simple Audio Feedback Generator
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'pop') {
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'whoosh') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    }
};

// Boot OS
window.onload = () => App.init();