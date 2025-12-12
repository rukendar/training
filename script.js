// JavaScript Logic
class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('habitForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();
        if (!name) return;

        const habit = {
            id: Date.now(),
            name,
            streak: 0,
            lastCompleted: null,
            completedToday: false
        };

        this.habits.push(habit);
        this.save();
        input.value = '';
        this.render();
    }

    completeHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        const today = new Date().toDateString();

        if (habit.lastCompleted !== today) {
            habit.streak = habit.lastCompleted === new Date(Date.now() - 86400000).toDateString() ? habit.streak + 1 : 1;
            habit.lastCompleted = today;
            habit.completedToday = true;
            this.save();
            this.render();
        }
    }

    deleteHabit(id) {
        this.habits = this.habits.filter(h => h.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    getLongestStreak() {
        return Math.max(...this.habits.map(h => h.streak), 0);
    }

    checkToday() {
        const today = new Date().toDateString();
        this.habits.forEach(habit => {
            if (habit.lastCompleted !== today) {
                habit.completedToday = false;
            }
        });
        this.save();
    }

    render() {
        this.checkToday();
        const list = document.getElementById('habitsList');
        const emptyState = document.getElementById('emptyState');
        const streakDisplay = document.getElementById('streakDisplay');
        const longestStreakEl = document.getElementById('longestStreak');

        if (this.habits.length === 0) {
            list.innerHTML = '';
            emptyState.style.display = 'block';
            streakDisplay.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        streakDisplay.style.display = 'block';
        longestStreakEl.textContent = `${this.getLongestStreak()} days`;

        list.innerHTML = this.habits.map(habit => `
            <li class="habit-item">
                <div style="display: flex; align-items: center; flex: 1;">
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-streak">Streak: ${habit.streak} days</span>
                </div>
                <div>
                    <button class="complete-btn ${habit.completedToday ? 'completed' : ''}" 
                            ${habit.completedToday ? 'disabled' : ''} 
                            onclick="tracker.completeHabit(${habit.id})">
                        ${habit.completedToday ? '✓ Done Today' : 'Mark Complete'}
                    </button>
                    <button class="delete-btn" onclick="tracker.deleteHabit(${habit.id})">Delete</button>
                </div>
            </li>
        `).join('');
    }
}

// Initialize the tracker
const tracker = new HabitTracker();