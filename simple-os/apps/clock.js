// Clock & Timer App
os.registerApp({
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    category: 'utilities',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.mode = 'clock';
        this.timerSeconds = 0;
        this.timerInterval = null;
        this.stopwatchSeconds = 0;
        this.stopwatchInterval = null;

        const content = os.getWindowContent(windowId);
        this.render(content);
        this.startClock();
    },

    render(content) {
        content.innerHTML = `
            <div class="clock-app">
                <div class="clock-tabs">
                    <button class="clock-tab ${this.mode === 'clock' ? 'active' : ''}"
                            onclick="os.apps['clock'].switchMode('clock')">🕐 Clock</button>
                    <button class="clock-tab ${this.mode === 'timer' ? 'active' : ''}"
                            onclick="os.apps['clock'].switchMode('timer')">⏲️ Timer</button>
                    <button class="clock-tab ${this.mode === 'stopwatch' ? 'active' : ''}"
                            onclick="os.apps['clock'].switchMode('stopwatch')">⏱️ Stopwatch</button>
                    <button class="clock-tab ${this.mode === 'alarm' ? 'active' : ''}"
                            onclick="os.apps['clock'].switchMode('alarm')">⏰ Alarm</button>
                </div>
                <div class="clock-content" id="clock-content">
                    ${this.renderMode()}
                </div>
            </div>
        `;
    },

    switchMode(mode) {
        this.mode = mode;
        const content = os.getWindowContent(this.windowId);
        this.render(content);

        if (mode === 'clock') {
            this.startClock();
        }
    },

    renderMode() {
        switch (this.mode) {
            case 'clock':
                return this.renderClock();
            case 'timer':
                return this.renderTimer();
            case 'stopwatch':
                return this.renderStopwatch();
            case 'alarm':
                return this.renderAlarm();
            default:
                return '';
        }
    },

    renderClock() {
        return `
            <div class="clock-display-container">
                <div class="clock-time" id="clock-time">--:--:--</div>
                <div class="clock-date" id="clock-date">--- --- --</div>
                <div class="clock-timezone" id="clock-timezone">---</div>
            </div>
        `;
    },

    renderTimer() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        return `
            <div class="clock-display-container">
                <div class="timer-display" id="timer-display">${display}</div>
                <div class="timer-controls">
                    <input type="number" id="timer-minutes" min="0" max="999" placeholder="Minutes"
                           value="${minutes}" ${this.timerInterval ? 'disabled' : ''}>
                    <input type="number" id="timer-seconds" min="0" max="59" placeholder="Seconds"
                           value="${seconds}" ${this.timerInterval ? 'disabled' : ''}>
                </div>
                <div class="timer-buttons">
                    ${this.timerInterval
                        ? '<button onclick="os.apps[\'clock\'].pauseTimer()">⏸️ Pause</button>'
                        : '<button onclick="os.apps[\'clock\'].startTimer()">▶️ Start</button>'}
                    <button onclick="os.apps['clock'].resetTimer()">🔄 Reset</button>
                </div>
            </div>
        `;
    },

    renderStopwatch() {
        const hours = Math.floor(this.stopwatchSeconds / 3600);
        const minutes = Math.floor((this.stopwatchSeconds % 3600) / 60);
        const seconds = this.stopwatchSeconds % 60;
        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        return `
            <div class="clock-display-container">
                <div class="stopwatch-display" id="stopwatch-display">${display}</div>
                <div class="stopwatch-buttons">
                    ${this.stopwatchInterval
                        ? '<button onclick="os.apps[\'clock\'].pauseStopwatch()">⏸️ Pause</button>'
                        : '<button onclick="os.apps[\'clock\'].startStopwatch()">▶️ Start</button>'}
                    <button onclick="os.apps['clock'].resetStopwatch()">🔄 Reset</button>
                </div>
            </div>
        `;
    },

    renderAlarm() {
        return `
            <div class="clock-display-container">
                <div class="alarm-container">
                    <h3>Set Alarm</h3>
                    <div class="alarm-controls">
                        <input type="time" id="alarm-time">
                        <button onclick="os.apps['clock'].setAlarm()">⏰ Set Alarm</button>
                    </div>
                    <div id="alarm-status" class="alarm-status"></div>
                </div>
            </div>
        `;
    },

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    },

    updateClock() {
        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');
        const timezoneEl = document.getElementById('clock-timezone');

        if (!timeEl) return;

        const now = new Date();

        timeEl.textContent = now.toLocaleTimeString();
        dateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const offset = -now.getTimezoneOffset() / 60;
        timezoneEl.textContent = `UTC${offset >= 0 ? '+' : ''}${offset}`;
    },

    startTimer() {
        const minutesInput = document.getElementById('timer-minutes');
        const secondsInput = document.getElementById('timer-seconds');

        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;

        this.timerSeconds = minutes * 60 + seconds;

        if (this.timerSeconds === 0) {
            alert('Please set a timer duration');
            return;
        }

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;

            const display = document.getElementById('timer-display');
            const mins = Math.floor(this.timerSeconds / 60);
            const secs = this.timerSeconds % 60;
            display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                alert('⏰ Timer finished!');
                this.switchMode('timer');
            }
        }, 1000);

        this.switchMode('timer');
    },

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.switchMode('timer');
        }
    },

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerSeconds = 0;
        this.switchMode('timer');
    },

    startStopwatch() {
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchSeconds++;

            const display = document.getElementById('stopwatch-display');
            const hours = Math.floor(this.stopwatchSeconds / 3600);
            const minutes = Math.floor((this.stopwatchSeconds % 3600) / 60);
            const seconds = this.stopwatchSeconds % 60;
            display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);

        this.switchMode('stopwatch');
    },

    pauseStopwatch() {
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
            this.switchMode('stopwatch');
        }
    },

    resetStopwatch() {
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
        }
        this.stopwatchSeconds = 0;
        this.switchMode('stopwatch');
    },

    setAlarm() {
        const timeInput = document.getElementById('alarm-time');
        const alarmTime = timeInput.value;

        if (!alarmTime) {
            alert('Please select a time');
            return;
        }

        const [hours, minutes] = alarmTime.split(':').map(Number);
        const now = new Date();
        const alarm = new Date(now);
        alarm.setHours(hours, minutes, 0, 0);

        if (alarm <= now) {
            alarm.setDate(alarm.getDate() + 1);
        }

        const timeUntilAlarm = alarm - now;

        setTimeout(() => {
            alert(`⏰ Alarm! It's ${alarmTime}`);
        }, timeUntilAlarm);

        const statusEl = document.getElementById('alarm-status');
        statusEl.textContent = `✅ Alarm set for ${alarmTime}`;
        statusEl.style.color = '#27ae60';
    }
});
