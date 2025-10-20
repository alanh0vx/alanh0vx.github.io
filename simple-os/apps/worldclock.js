// World Clock App
os.registerApp({
    id: 'worldclock',
    name: 'World Clock',
    icon: '🌍',
    category: 'utilities',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.clockInterval = null;
        this.selectedTimezones = this.loadSavedTimezones();
        
        const content = os.getWindowContent(windowId);
        this.render(content);
        this.startClocks();
    },

    loadSavedTimezones() {
        const saved = localStorage.getItem('worldclock_timezones');
        if (saved) {
            return JSON.parse(saved);
        }
        // Default timezones
        return [
            { name: 'Local Time', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            { name: 'New York', timezone: 'America/New_York' },
            { name: 'London', timezone: 'Europe/London' },
            { name: 'Tokyo', timezone: 'Asia/Tokyo' }
        ];
    },

    saveTimezones() {
        localStorage.setItem('worldclock_timezones', JSON.stringify(this.selectedTimezones));
    },

    render(content) {
        const timezoneOptions = this.getTimezoneOptions();
        
        content.innerHTML = `
            <div class="worldclock-app">
                <div class="worldclock-header">
                    <h2>🌍 World Clock</h2>
                    <div class="worldclock-controls">
                        <select id="timezone-select" class="timezone-select">
                            <option value="">Add a timezone...</option>
                            ${timezoneOptions}
                        </select>
                        <button onclick="os.apps['worldclock'].addTimezone()" class="add-timezone-btn">➕ Add</button>
                    </div>
                </div>
                <div class="worldclock-list" id="worldclock-list">
                    ${this.renderClocks()}
                </div>
            </div>
        `;
    },

    getTimezoneOptions() {
        const timezones = [
            // Major cities organized by region
            { group: 'Americas', zones: [
                'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                'America/Toronto', 'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo',
                'America/Buenos_Aires', 'America/Lima', 'America/Caracas'
            ]},
            { group: 'Europe', zones: [
                'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
                'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow',
                'Europe/Athens', 'Europe/Vienna', 'Europe/Zurich'
            ]},
            { group: 'Asia', zones: [
                'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
                'Asia/Seoul', 'Asia/Bangkok', 'Asia/Manila', 'Asia/Mumbai',
                'Asia/Dubai', 'Asia/Tehran', 'Asia/Jerusalem'
            ]},
            { group: 'Africa', zones: [
                'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Nairobi',
                'Africa/Casablanca', 'Africa/Tunis'
            ]},
            { group: 'Australia/Pacific', zones: [
                'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane',
                'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu'
            ]}
        ];

        let options = '';
        timezones.forEach(group => {
            options += `<optgroup label="${group.group}">`;
            group.zones.forEach(zone => {
                const cityName = zone.split('/')[1].replace(/_/g, ' ');
                options += `<option value="${zone}">${cityName}</option>`;
            });
            options += '</optgroup>';
        });

        return options;
    },

    renderClocks() {
        return this.selectedTimezones.map((tz, index) => `
            <div class="clock-item" data-index="${index}">
                <div class="clock-header">
                    <h3 class="clock-city">${tz.name}</h3>
                    <button onclick="os.apps['worldclock'].removeTimezone(${index})" class="remove-btn" title="Remove">❌</button>
                </div>
                <div class="clock-time" id="time-${index}">--:--:--</div>
                <div class="clock-date" id="date-${index}">--- --- --</div>
                <div class="clock-offset" id="offset-${index}">UTC±0</div>
            </div>
        `).join('');
    },

    addTimezone() {
        const select = document.getElementById('timezone-select');
        const selectedZone = select.value;
        
        if (!selectedZone) {
            alert('Please select a timezone to add');
            return;
        }

        // Check if already added
        if (this.selectedTimezones.some(tz => tz.timezone === selectedZone)) {
            alert('This timezone is already added');
            return;
        }

        const cityName = selectedZone.split('/')[1].replace(/_/g, ' ');
        this.selectedTimezones.push({
            name: cityName,
            timezone: selectedZone
        });

        this.saveTimezones();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
        this.startClocks();
        
        // Reset select
        select.value = '';
    },

    removeTimezone(index) {
        if (this.selectedTimezones.length <= 1) {
            alert('You must keep at least one timezone');
            return;
        }

        this.selectedTimezones.splice(index, 1);
        this.saveTimezones();
        
        const content = os.getWindowContent(this.windowId);
        this.render(content);
        this.startClocks();
    },

    startClocks() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        
        this.updateAllClocks();
        this.clockInterval = setInterval(() => this.updateAllClocks(), 1000);
    },

    updateAllClocks() {
        this.selectedTimezones.forEach((tz, index) => {
            this.updateClock(index, tz.timezone);
        });
    },

    updateClock(index, timezone) {
        const timeEl = document.getElementById(`time-${index}`);
        const dateEl = document.getElementById(`date-${index}`);
        const offsetEl = document.getElementById(`offset-${index}`);

        if (!timeEl) return;

        try {
            const now = new Date();
            
            // Format time in 24-hour format
            const timeOptions = {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            
            const dateOptions = {
                timeZone: timezone,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };

            timeEl.textContent = now.toLocaleTimeString('en-US', timeOptions);
            dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);

            // Calculate timezone offset
            const tempDate = new Date();
            const utc1 = tempDate.getTime() + (tempDate.getTimezoneOffset() * 60000);
            const utc2 = new Date(utc1 + (this.getTimezoneOffset(timezone) * 3600000));
            const offset = this.getTimezoneOffset(timezone);
            
            offsetEl.textContent = `UTC${offset >= 0 ? '+' : ''}${offset}`;
        } catch (error) {
            timeEl.textContent = 'Invalid timezone';
            dateEl.textContent = '';
            offsetEl.textContent = '';
        }
    },

    getTimezoneOffset(timezone) {
        try {
            const now = new Date();
            const localOffset = now.getTimezoneOffset();
            const targetTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            const localTime = new Date(now.toLocaleString('en-US'));
            const diff = (targetTime.getTime() - localTime.getTime()) / (1000 * 60 * 60);
            return Math.round(diff);
        } catch {
            return 0;
        }
    },

    onClose() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }
});