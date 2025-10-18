// Music Player App
os.registerApp({
    id: 'music',
    name: 'Music Player',
    icon: '🎵',
    category: 'entertainment',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.playlist = this.loadPlaylist();
        this.currentIndex = 0;
        this.isPlaying = false;
        this.audio = new Audio();

        this.audio.onended = () => this.next();
        this.audio.ontimeupdate = () => this.updateProgress();

        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    loadPlaylist() {
        const saved = localStorage.getItem('simpleOS_playlist');
        return saved ? JSON.parse(saved) : [];
    },

    savePlaylist() {
        localStorage.setItem('simpleOS_playlist', JSON.stringify(this.playlist));
    },

    render(content) {
        const currentSong = this.playlist[this.currentIndex] || { name: 'No song loaded', artist: '' };

        content.innerHTML = `
            <div class="music-player">
                <div class="music-artwork">
                    🎵
                </div>

                <div class="music-info">
                    <div class="music-title">${currentSong.name}</div>
                    <div class="music-artist">${currentSong.artist || 'Unknown Artist'}</div>
                </div>

                <div class="music-progress">
                    <span id="current-time">0:00</span>
                    <input type="range" id="progress-bar" min="0" max="100" value="0"
                           onchange="os.apps['music'].seek(this.value)">
                    <span id="duration-time">0:00</span>
                </div>

                <div class="music-controls">
                    <button onclick="os.apps['music'].previous()">⏮️</button>
                    <button onclick="os.apps['music'].togglePlay()" id="play-pause-btn">
                        ${this.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button onclick="os.apps['music'].next()">⏭️</button>
                </div>

                <div class="music-volume">
                    <span>🔊</span>
                    <input type="range" id="volume-slider" min="0" max="100" value="50"
                           onchange="os.apps['music'].setVolume(this.value)">
                </div>

                <div class="music-playlist-header">
                    <h3>Playlist</h3>
                    <button onclick="os.apps['music'].addSongUrl()">➕ Add URL</button>
                </div>

                <div class="music-playlist" id="music-playlist">
                    ${this.renderPlaylist()}
                </div>
            </div>
        `;

        // Set initial volume
        this.audio.volume = 0.5;
    },

    renderPlaylist() {
        if (this.playlist.length === 0) {
            return '<div class="playlist-empty">No songs in playlist. Add a URL to get started!</div>';
        }

        return this.playlist.map((song, index) => `
            <div class="playlist-item ${index === this.currentIndex ? 'active' : ''}"
                 onclick="os.apps['music'].playSong(${index})">
                <div class="playlist-item-info">
                    <div class="playlist-item-name">${song.name}</div>
                    <div class="playlist-item-artist">${song.artist || 'Unknown Artist'}</div>
                </div>
                <button onclick="event.stopPropagation(); os.apps['music'].removeSong(${index})"
                        class="playlist-item-remove">🗑️</button>
            </div>
        `).join('');
    },

    addSongUrl() {
        const url = prompt('Enter audio URL (mp3, wav, ogg):');
        if (!url) return;

        const name = prompt('Song name:', 'Untitled');
        const artist = prompt('Artist name:', 'Unknown Artist');

        this.playlist.push({
            url: url,
            name: name || 'Untitled',
            artist: artist || 'Unknown Artist'
        });

        this.savePlaylist();
        this.updatePlaylistUI();
    },

    removeSong(index) {
        if (!confirm('Remove this song from playlist?')) return;

        this.playlist.splice(index, 1);

        if (this.currentIndex >= this.playlist.length) {
            this.currentIndex = Math.max(0, this.playlist.length - 1);
        }

        this.savePlaylist();
        this.updatePlaylistUI();
    },

    playSong(index) {
        this.currentIndex = index;
        const song = this.playlist[index];

        if (!song) return;

        this.audio.src = song.url;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateUI();
        }).catch(err => {
            alert('Error playing song: ' + err.message);
        });
    },

    togglePlay() {
        if (this.playlist.length === 0) {
            alert('Please add songs to the playlist first');
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            if (!this.audio.src) {
                this.playSong(0);
            } else {
                this.audio.play();
                this.isPlaying = true;
            }
        }

        this.updateUI();
    },

    next() {
        if (this.playlist.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playSong(this.currentIndex);
    },

    previous() {
        if (this.playlist.length === 0) return;

        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playSong(this.currentIndex);
    },

    seek(value) {
        const time = (value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    },

    setVolume(value) {
        this.audio.volume = value / 100;
    },

    updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        const currentTime = document.getElementById('current-time');
        const durationTime = document.getElementById('duration-time');

        if (progressBar && !isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressBar.value = progress;

            currentTime.textContent = this.formatTime(this.audio.currentTime);
            durationTime.textContent = this.formatTime(this.audio.duration);
        }
    },

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    },

    updateUI() {
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    updatePlaylistUI() {
        const playlistEl = document.getElementById('music-playlist');
        if (playlistEl) {
            playlistEl.innerHTML = this.renderPlaylist();
        }
    }
});
