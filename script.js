// script.js
class HabitTracker {
    constructor() {
        let loadedHabits = JSON.parse(localStorage.getItem('habits')) || [];
        // Sanitize loaded habits to prevent errors from corrupted data
        this.habits = loadedHabits.filter(habit => habit && typeof habit === 'object' && habit.id !== undefined && habit.name && typeof habit.name === 'string');
        this.habits.forEach(habit => {
            if (!habit.completed || typeof habit.completed !== 'object') {
                habit.completed = {};
            }
            if (typeof habit.streak !== 'number') {
                habit.streak = 0;
            }
            if (typeof habit.longestStreak !== 'number') {
                habit.longestStreak = 0;
            }
        });
        this.currentDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.renderCalendar();
        this.renderChart();
        this.loadTheme();
    }

    bindEvents() {
        // Add habit
        document.getElementById('habitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });

        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal events
        document.getElementById('habitModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.id === 'cancelEditBtn') {
                this.closeModal();
            }
        });

        document.getElementById('saveEditBtn').addEventListener('click', () => {
            this.saveEdit();
        });
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();
        if (!name) return;

        const habit = {
            id: Date.now(),
            name,
            completed: {},
            streak: 0,
            longestStreak: 0
        };
        this.habits.push(habit);
        input.value = '';
        this.save();
        this.render();
        this.updateStats();
        this.renderCalendar();
        this.renderChart();
    }

    toggleComplete(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.currentDate;
        const wasCompletedToday = habit.completed[today];

        if (wasCompletedToday) {
            // Undo completion
            delete habit.completed[today];
            this.updateStreak(habit, false);
        } else {
            // Mark as completed
            habit.completed[today] = true;
            this.updateStreak(habit, true);
        }

        this.save();
        this.render();
        this.updateStats();
        this.renderCalendar();
        this.renderChart();
    }

    updateStreak(habit, completedToday) {
        const dates = Object.keys(habit.completed).sort();
        let currentStreak = 0;
        let longestStreak = habit.longestStreak;

        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            if (dates[i + 1] === nextDateStr) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
        }

        if (completedToday) {
            const lastDate = dates[dates.length - 1];
            if (lastDate === this.currentDate) {
                // Check if yesterday was completed
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                if (habit.completed[yesterdayStr]) {
                    habit.streak++;
                } else {
                    habit.streak = 1;
                }
            } else {
                habit.streak = 1;
            }
            habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
        } else {
            habit.streak = 0;
        }

        habit.longestStreak = longestStreak;
    }

    editHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        document.getElementById('editHabitInput').value = habit.name;
        document.getElementById('habitModal').dataset.habitId = habitId;
        document.getElementById('habitModal').style.display = 'flex';
    }

    saveEdit() {
        const habitId = parseInt(document.getElementById('habitModal').dataset.habitId);
        const input = document.getElementById('editHabitInput');
        const newName = input.value.trim();
        if (!newName) return;

        const habit = this.habits.find(h => h.id === habitId);
        habit.name = newName;
        input.value = '';
        this.closeModal();
        this.save();
        this.render();
    }

    confirmDelete(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        if (confirm(`Are you sure you want to delete "${habit.name}"? This cannot be undone.`)) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.save();
            this.render();
            this.updateStats();
            this.renderCalendar();
            this.renderChart();
        }
    }

    closeModal() {
        document.getElementById('habitModal').style.display = 'none';
        delete document.getElementById('habitModal').dataset.habitId;
    }

    render() {
        const list = document.getElementById('habitsList');
        const emptyState = document.getElementById('emptyState');
        const chartSection = document.getElementById('chartSection');

        if (this.habits.length === 0) {
            list.innerHTML = '';
            emptyState.style.display = 'block';
            chartSection.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        chartSection.style.display = 'block';

        list.innerHTML = this.habits.map(habit => `
            <li class="habit-item">
                <label style="display: flex; align-items: center; flex: 1; cursor: pointer;">
                    <input type="checkbox" class="habit-checkbox" ${habit.completed && habit.completed[this.currentDate] ? 'checked' : ''} onchange="tracker.toggleComplete(${habit.id})">
                    <span class="habit-name">${habit.name}</span>
                </label>
                <span class="habit-streak">Streak: ${habit.streak || 0} days</span>
                <div class="habit-actions">
                    <button class="edit-btn" onclick="tracker.editHabit(${habit.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="tracker.confirmDelete(${habit.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </li>
        `).join('');
    }

    updateStats() {
        const totalHabits = this.habits.length;
        const todayCompletions = this.habits.filter(h => h.completed && h.completed[this.currentDate]).length;
        const longestStreak = Math.max(...this.habits.map(h => h.longestStreak || 0), 0);

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('todayCompletions').textContent = todayCompletions;
        document.getElementById('longestStreak').textContent = `${longestStreak} days`;
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();

        let html = '';
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isCompleted = this.habits.some(h => h.completed && h.completed[dateStr]);
            const isToday = dateStr === this.currentDate;
            html += `<div class="calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" onclick="tracker.viewDay('${dateStr}')">${day}</div>`;
        }
        calendar.innerHTML = html;
    }

    viewDay(dateStr) {
        // For now, just alert; can enhance to show modal with completions
        const completions = this.habits.filter(h => h.completed && h.completed[dateStr]).length;
        alert(`On ${dateStr}: ${completions} habits completed`);
    }

    renderChart() {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Simple bar chart for last 7 days
        const labels = [];
        const data = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(dateStr.split('-').slice(1).join('/'));
            const completions = this.habits.filter(h => h.completed && h.completed[dateStr]).length;
            data.push(completions);
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bars
        const barWidth = 40;
        const maxHeight = 150;
        const maxData = Math.max(...data, 1);
        data.forEach((value, index) => {
            const height = (value / maxData) * maxHeight;
            ctx.fillStyle = value > 0 ? '#28a745' : '#dee2e6';
            ctx.fillRect(index * 60 + 20, canvas.height - height - 20, barWidth, height);
            ctx.fillStyle = '#212529';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], index * 60 + 40, canvas.height - 5);
            ctx.fillText(value, index * 60 + 40, canvas.height - height - 25);
        });
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        document.getElementById('themeBtn').innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('themeBtn').innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    save() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }
}

// Global tracker instance
const tracker = new HabitTracker();
