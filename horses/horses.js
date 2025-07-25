class HorseRacingGame {
  constructor() {
    // Initialize all arrays FIRST before using them
    this.horseNames = ['Thunder Bolt', 'Lightning Strike', 'Storm Chaser', 'Wind Runner', 'Fire Dancer', 'Shadow Walker', 'Golden Arrow', 'Silver Bullet', 'Midnight Express', 'Dawn Breaker', 'Royal Crown', 'Diamond Dust', 'Crimson Flash', 'Emerald Dream', 'Sapphire Star'];
    
    this.horseEmojis = ['🐎', '🐴', '🦄', '🐎', '🐴', '🦄', '🐎', '🐴', '🦄', '🐎', '🐴', '🦄', '🐎', '🐴', '🦄'];
    
    this.horseColors = ['Bay', 'Black', 'Brown', 'Chestnut', 'Gray', 'Palomino', 'Pinto', 'Roan', 'White', 'Dun'];
    
    this.horseBreeds = ['Thoroughbred', 'Arabian', 'Quarter Horse', 'Standardbred', 'Appaloosa', 'Paint Horse', 'Mustang', 'Friesian', 'Clydesdale', 'Percheron'];
    
    this.jockeyNames = ['J. Smith', 'M. Rodriguez', 'K. Johnson', 'A. Williams', 'C. Brown', 'D. Jones', 'R. Garcia', 'L. Miller', 'S. Davis', 'T. Wilson', 'B. Anderson', 'N. Taylor', 'F. Thomas', 'G. Jackson', 'H. White'];

    // Weather conditions that affect racing
    this.weatherTypes = [
      { name: 'Sunny', icon: '☀️', speedModifier: 1.0, staminaModifier: 0.95 },
      { name: 'Cloudy', icon: '☁️', speedModifier: 1.02, staminaModifier: 1.0 },
      { name: 'Rainy', icon: '🌧️', speedModifier: 0.85, staminaModifier: 1.1 },
      { name: 'Windy', icon: '💨', speedModifier: 0.92, staminaModifier: 0.88 },
      { name: 'Overcast', icon: '🌫️', speedModifier: 0.98, staminaModifier: 1.05 }
    ];

    this.trackConditions = [
      { name: 'Fast', speedModifier: 1.0 },
      { name: 'Good', speedModifier: 0.95 },
      { name: 'Yielding', speedModifier: 0.90 },
      { name: 'Soft', speedModifier: 0.85 },
      { name: 'Heavy', speedModifier: 0.80 }
    ];

    // Game state - initialize AFTER the arrays
    this.horses = [];
    this.selectedBets = [];
    this.raceResults = [];
    this.raceInProgress = false;
    this.playerBalance = this.loadBalance();
    this.totalWinnings = this.loadTotalWinnings();
    this.oddsInterval = null;
    this.weatherConditions = this.generateWeatherConditions();
    
    // Initialize game when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeGame());
    } else {
      this.initializeGame();
    }
  }

  initializeGame() {
    try {
      console.log('Initializing game...');
      this.generateNewRace();
      this.updateUI();
      this.setupEventListeners();
      console.log('Game initialized successfully!');
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }

  setupEventListeners() {
    const startBtn = document.getElementById('startRaceBtn');
    const newBtn = document.getElementById('newRaceBtn');
    const resetBtn = document.getElementById('resetGameBtn');
    
    if (startBtn) startBtn.addEventListener('click', () => this.startRace());
    if (newBtn) newBtn.addEventListener('click', () => this.generateNewRace());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());
    
    // Add click outside modal to close
    window.addEventListener('click', (event) => {
      const horseModal = document.getElementById('horseDetailsModal');
      const resultsModal = document.getElementById('resultsModal');
      
      if (event.target === horseModal) {
        this.closeHorseDetails();
      }
      if (event.target === resultsModal) {
        this.closeResultsModal();
      }
    });
  }

  generateWeatherConditions() {
    const weather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
    const trackCondition = this.trackConditions[Math.floor(Math.random() * this.trackConditions.length)];
    const temperature = Math.floor(Math.random() * 15) + 18; // 18-32°C
    const windSpeed = Math.floor(Math.random() * 20) + 5; // 5-25 km/h
    
    return {
      weather,
      trackCondition,
      temperature,
      windSpeed
    };
  }

  generateNewRace() {
    if (this.raceInProgress) return;
    
    console.log('Generating new race...');
    
    // Clear odds interval if running
    if (this.oddsInterval) {
      clearInterval(this.oddsInterval);
    }
    
    this.horses = [];
    this.selectedBets = [];
    this.raceResults = [];
    this.weatherConditions = this.generateWeatherConditions();
    
    // Generate 6 horses for the race
    for (let i = 0; i < 6; i++) {
      const horse = this.generateHorse(i);
      horse.previousOdds = horse.odds;
      horse.oddsHistory = [horse.odds];
      this.horses.push(horse);
    }
    
    console.log('Generated horses:', this.horses);
    
    this.renderHorseThumbnails();
    this.renderHorsesOnTrack();
    this.updateTrackLegend();
    this.renderOddsTable();
    this.startOddsUpdates();
    this.updateWeatherDisplay();
    this.updateCommentary("New race generated! Study the horses and weather conditions, then place your bets. Good luck!");
    this.updateBettingControls();
  }
  
  generateHorse(index) {
    const usedNames = this.horses.map(h => h.name);
    const availableNames = this.horseNames.filter(name => !usedNames.includes(name));
    const name = availableNames[Math.floor(Math.random() * availableNames.length)] || this.horseNames[index];
    
    const usedEmojis = this.horses.map(h => h.emoji);
    const availableEmojis = this.horseEmojis.filter(emoji => !usedEmojis.includes(emoji));
    const emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)] || this.horseEmojis[index % this.horseEmojis.length];
    
    const horse = {
      id: index,
      number: index + 1,
      name: name,
      emoji: emoji,
      color: this.horseColors[Math.floor(Math.random() * this.horseColors.length)],
      breed: this.horseBreeds[Math.floor(Math.random() * this.horseBreeds.length)],
      age: Math.floor(Math.random() * 8) + 3, // 3-10 years
      speed: Math.floor(Math.random() * 20) + 45, // 45-65 km/h
      stamina: Math.floor(Math.random() * 30) + 70, // 70-100%
      experience: Math.floor(Math.random() * 50) + 10, // 10-60 races
      jockey: this.jockeyNames[Math.floor(Math.random() * this.jockeyNames.length)],
      odds: parseFloat((1.5 + Math.random() * 12).toFixed(1)), // 1.5 to 13.5
      form: this.generateForm(),
      weatherPreference: this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)].name,
      trackPreference: this.trackConditions[Math.floor(Math.random() * this.trackConditions.length)].name,
      distanceCompleted: 0,
      raceTime: 0,
      position: 0,
      currentAngle: 270,
      previousOdds: 0,
      oddsHistory: []
    };
    
    console.log('Generated horse:', horse);
    return horse;
  }

  generateForm() {
    const results = ['W', 'P', 'S', 'L']; // Win, Place, Show, Loss
    const form = [];
    const weights = [0.15, 0.20, 0.25, 0.40]; // Probability weights
    
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      let cumulative = 0;
      for (let j = 0; j < weights.length; j++) {
        cumulative += weights[j];
        if (rand <= cumulative) {
          form.push(results[j]);
          break;
        }
      }
    }
    return form;
  }

  renderHorseThumbnails() {
    const thumbnailsContainer = document.getElementById('horseThumbnails');
    if (!thumbnailsContainer) {
      console.warn('horseThumbnails container not found');
      return;
    }
    
    thumbnailsContainer.innerHTML = '';
    
    this.horses.forEach((horse, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'horse-thumbnail';
      thumbnail.setAttribute('data-horse-id', horse.id);
      thumbnail.onclick = () => this.showHorseDetails(horse.id);
      
      thumbnail.innerHTML = `
        <div class="horse-number">${horse.number}</div>
        <div class="horse-emoji">${horse.emoji}</div>
        <div class="horse-name">${horse.name}</div>
        <div class="horse-odds">${horse.odds}:1</div>
      `;
      
      thumbnailsContainer.appendChild(thumbnail);
    });
    
    console.log('Rendered horse thumbnails');
  }

  renderHorsesOnTrack() {
    const horsesContainer = document.getElementById('horsesContainer');
    if (!horsesContainer) {
      console.warn('horsesContainer not found');
      return;
    }
    
    horsesContainer.innerHTML = '';
    
    this.horses.forEach((horse, index) => {
      const horseElement = document.createElement('div');
      horseElement.className = 'horse';
      horseElement.id = `horse-${horse.id}`;
      horseElement.innerHTML = `
        <div class="horse-number-track">${horse.number}</div>
        <div class="horse-emoji-track">${horse.emoji}</div>
      `;
      
      // Position at starting line (bottom of athletics track)
      const startAngle = 270 + (index * 12) - 30; // Spread horses at start
      const radiusX = 330; // Adjusted for larger green track area
      const radiusY = 150; // Adjusted for larger green track area  
      const x = 400 + radiusX * Math.cos((startAngle * Math.PI) / 180);
      const y = 200 + radiusY * Math.sin((startAngle * Math.PI) / 180);
      
      horseElement.style.left = `${x - 16}px`;
      horseElement.style.top = `${y - 16}px`;
      
      horse.currentAngle = startAngle;
      
      horsesContainer.appendChild(horseElement);
    });
    
    console.log('Rendered horses on track');
  }

  updateTrackLegend() {
    const trackLegend = document.getElementById('trackLegend');
    if (!trackLegend) return;
    
    trackLegend.innerHTML = this.horses.map(horse => `
      <div class="legend-item">
        <div class="legend-color" style="background: hsl(${horse.id * 60}, 70%, 50%);"></div>
        <span>${horse.number}. ${horse.name}</span>
      </div>
    `).join('');
  }

  renderOddsTable() {
    const oddsList = document.getElementById('oddsList');
    if (!oddsList) {
      console.warn('oddsList not found');
      return;
    }
    
    oddsList.innerHTML = this.horses.map(horse => `
      <div class="odds-item">
        <div class="odds-horse">
          <span class="odds-horse-number">${horse.number}</span>
          <span class="odds-horse-emoji">${horse.emoji}</span>
          <span class="odds-horse-name">${horse.name}</span>
        </div>
        <div class="odds-value" id="odds-${horse.id}">${horse.odds}:1</div>
        <div class="odds-change neutral" id="change-${horse.id}">
          <span>−</span>
        </div>
      </div>
    `).join('');
    
    console.log('Rendered odds table');
  }

  startOddsUpdates() {
    // Clear any existing interval
    if (this.oddsInterval) {
      clearInterval(this.oddsInterval);
    }
    
    // Start new interval for real-time odds updates
    this.oddsInterval = setInterval(() => {
      this.updateOddsRealTime();
    }, 2000 + Math.random() * 3000); // Update every 2-5 seconds
  }

  updateOddsRealTime() {
    if (this.raceInProgress) return;
    
    this.horses.forEach(horse => {
      // Store previous odds
      horse.previousOdds = horse.odds;
      
      // Calculate random odds fluctuation
      const baseChange = (Math.random() - 0.5) * 0.8; // ±0.4 change
      const volatility = Math.random() * 0.3; // Additional volatility
      const change = baseChange + (Math.random() - 0.5) * volatility;
      
      // Apply change
      horse.odds = Math.max(1.5, Math.min(15.0, horse.odds + change));
      horse.odds = parseFloat(horse.odds.toFixed(1));
      
      // Update odds history
      horse.oddsHistory.push(horse.odds);
      if (horse.oddsHistory.length > 10) {
        horse.oddsHistory.shift();
      }
      
      // Update UI
      const oddsElement = document.getElementById(`odds-${horse.id}`);
      const changeElement = document.getElementById(`change-${horse.id}`);
      
      if (oddsElement && changeElement) {
        const oddsChange = horse.odds - horse.previousOdds;
        const changeClass = oddsChange > 0 ? 'up' : oddsChange < 0 ? 'down' : 'neutral';
        const changeIcon = oddsChange > 0 ? '↗' : oddsChange < 0 ? '↘' : '−';
        
        // Update odds with animation
        oddsElement.style.background = oddsChange > 0 ? 'rgba(255, 68, 68, 0.3)' : 
                                      oddsChange < 0 ? 'rgba(76, 175, 80, 0.3)' : 
                                      'rgba(255, 255, 255, 0.05)';
        oddsElement.textContent = `${horse.odds}:1`;
        
        // Update change indicator
        changeElement.className = `odds-change ${changeClass}`;
        changeElement.innerHTML = `<span>${changeIcon}</span>`;
        
        // Reset background after animation
        setTimeout(() => {
          oddsElement.style.background = 'rgba(255, 255, 255, 0.05)';
        }, 1000);
      }
    });
    
    // Update thumbnails with new odds
    this.updateThumbnailOdds();
  }

  updateThumbnailOdds() {
    this.horses.forEach(horse => {
      const thumbnail = document.querySelector(`[data-horse-id="${horse.id}"] .horse-odds`);
      if (thumbnail) {
        thumbnail.textContent = `${horse.odds}:1`;
      }
    });
  }

  updateWeatherDisplay() {
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherCondition = document.getElementById('weatherCondition');
    const temperature = document.getElementById('temperature');
    const trackCondition = document.getElementById('trackCondition');
    const windSpeed = document.getElementById('windSpeed');
    
    if (weatherIcon) weatherIcon.textContent = this.weatherConditions.weather.icon;
    if (weatherCondition) weatherCondition.textContent = this.weatherConditions.weather.name;
    if (temperature) temperature.textContent = `${this.weatherConditions.temperature}°C`;
    if (trackCondition) trackCondition.textContent = this.weatherConditions.trackCondition.name;
    if (windSpeed) windSpeed.textContent = `${this.weatherConditions.windSpeed} km/h`;
    
    // Update track display
    const trackWeatherDisplay = document.getElementById('trackWeatherDisplay');
    if (trackWeatherDisplay) {
      trackWeatherDisplay.innerHTML = `
        <i class="fas fa-${this.weatherConditions.weather.name.toLowerCase() === 'sunny' ? 'sun' : 
                          this.weatherConditions.weather.name.toLowerCase() === 'rainy' ? 'cloud-rain' : 
                          this.weatherConditions.weather.name.toLowerCase() === 'windy' ? 'wind' : 'cloud'}"></i>
        <span>${this.weatherConditions.weather.name} - ${this.weatherConditions.temperature}°C</span>
      `;
    }
  }

  updateCommentary(message) {
    const commentaryElement = document.getElementById('commentaryText');
    if (commentaryElement) {
      commentaryElement.textContent = message;
    }
  }

  updateUI() {
    const balanceElement = document.getElementById('playerBalance');
    const winningsElement = document.getElementById('totalWinnings');
    
    if (balanceElement) balanceElement.textContent = this.playerBalance;
    if (winningsElement) winningsElement.textContent = this.totalWinnings;
  }

  updateBettingControls() {
    const selectedBetsContainer = document.getElementById('selectedBets');
    const startRaceBtn = document.getElementById('startRaceBtn');
    
    if (!selectedBetsContainer || !startRaceBtn) return;
    
    if (this.selectedBets.length === 0) {
      selectedBetsContainer.innerHTML = `
        <div class="no-bets">
          <i class="fas fa-info-circle"></i>
          Click on horses above to place bets
        </div>
      `;
      startRaceBtn.disabled = true;
    } else {
      const totalBetAmount = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalPotentialPayout = this.selectedBets.reduce((sum, bet) => sum + bet.potentialPayout, 0);
      
      selectedBetsContainer.innerHTML = `
        ${this.selectedBets.map(bet => `
          <div class="bet-item">
            <div class="bet-details">
              <div class="bet-horse">${bet.horseEmoji} #${bet.horseNumber} ${bet.horseName}</div>
              <div class="bet-amount">$${bet.amount} @ ${bet.odds}:1</div>
            </div>
            <div class="potential-payout">
              Win: $${bet.potentialPayout}
              <button class="remove-bet" onclick="game.removeBet(${bet.horseId})">×</button>
            </div>
          </div>
        `).join('')}
        <div style="margin-top: 15px; padding: 15px; background: rgba(255, 107, 53, 0.1); border-radius: 10px; text-align: center; border: 1px solid #ff6b35;">
          <div style="font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px;">Total Investment</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #ff6b35;">$${totalBetAmount}</div>
          <div style="font-size: 0.8rem; color: #4CAF50; margin-top: 5px;">Max Payout: $${totalPotentialPayout}</div>
        </div>
      `;
      startRaceBtn.disabled = false;
    }
  }

  showHorseDetails(horseId) {
    const horse = this.horses.find(h => h.id === horseId);
    const modal = document.getElementById('horseDetailsModal');
    const content = document.getElementById('horseDetailsContent');
    
    if (!horse || !modal || !content) return;
    
    const formHTML = horse.form.map(result => {
      const className = result === 'W' ? 'form-win' : 
                      result === 'P' ? 'form-place' : 
                      result === 'S' ? 'form-show' : 'form-loss';
      return `<div class="form-indicator ${className}">${result}</div>`;
    }).join('');

    const weatherMatch = horse.weatherPreference === this.weatherConditions.weather.name;
    const trackMatch = horse.trackPreference === this.weatherConditions.trackCondition.name;
    
    content.innerHTML = `
      <div class="horse-header">
        <div class="horse-emoji" style="font-size: 2.2rem;">${horse.emoji}</div>
        <div>
          <h2 style="color: #ff6b35; margin-bottom: 8px; font-size: 1.3rem;">#${horse.number} ${horse.name}</h2>
          <div style="color: #b0b0b0; font-size: 0.8rem;">${horse.breed} • ${horse.color} • ${horse.age} years old</div>
        </div>
      </div>
      
      <div style="margin: 15px 0;">
        <h3 style="color: #ff6b35; margin-bottom: 10px; font-size: 1rem;">Performance Stats</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div class="stat-box">
            <div class="stat-label">Speed</div>
            <div class="stat-value">${horse.speed} km/h</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Stamina</div>
            <div class="stat-value">${horse.stamina}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Experience</div>
            <div class="stat-value">${horse.experience} races</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Jockey</div>
            <div class="stat-value">${horse.jockey}</div>
          </div>
        </div>
      </div>
      
      <div style="margin: 15px 0;">
        <h3 style="color: #ff6b35; margin-bottom: 10px; font-size: 1rem;">Recent Form</h3>
        <div style="display: flex; gap: 4px; justify-content: center;">
          ${formHTML}
        </div>
        <div style="text-align: center; margin-top: 8px; font-size: 0.75rem; color: #b0b0b0;">
          Most recent race on the left
        </div>
      </div>
      
      <div style="margin: 15px 0;">
        <h3 style="color: #ff6b35; margin-bottom: 10px; font-size: 1rem;">Weather & Track Preferences</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div style="padding: 8px; background: ${weatherMatch ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 6px; border: 1px solid ${weatherMatch ? '#4CAF50' : '#333'};">
            <div style="font-size: 0.75rem; color: #b0b0b0;">Preferred Weather</div>
            <div style="font-weight: bold; color: ${weatherMatch ? '#4CAF50' : 'white'}; font-size: 0.85rem;">${horse.weatherPreference} ${weatherMatch ? '✓' : ''}</div>
          </div>
          <div style="padding: 8px; background: ${trackMatch ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 6px; border: 1px solid ${trackMatch ? '#4CAF50' : '#333'};">
            <div style="font-size: 0.75rem; color: #b0b0b0;">Preferred Track</div>
            <div style="font-weight: bold; color: ${trackMatch ? '#4CAF50' : 'white'}; font-size: 0.85rem;">${horse.trackPreference} ${trackMatch ? '✓' : ''}</div>
          </div>
        </div>
      </div>
      
      <div style="margin: 15px 0;">
        <div style="text-align: center; padding: 12px; background: rgba(255, 107, 53, 0.1); border-radius: 8px; border: 1px solid #ff6b35;">
          <div style="font-size: 0.9rem; margin-bottom: 8px;">Current Odds</div>
          <div style="font-size: 1.6rem; font-weight: bold; color: #ff6b35;">${horse.odds}:1</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <div style="margin-bottom: 12px;">
          <label for="betAmount" style="display: block; margin-bottom: 4px; color: #b0b0b0; font-size: 0.8rem;">Bet Amount ($)</label>
          <input type="number" id="betAmount" min="10" max="${this.playerBalance}" value="50" 
                 style="padding: 8px; border-radius: 4px; border: 2px solid #ff6b35; background: #2a2a2a; color: white; text-align: center; width: 120px; font-size: 0.9rem;">
        </div>
        <button onclick="game.placeBetFromModal(${horse.id})" 
                style="background: linear-gradient(135deg, #ff6b35, #ff8c42); border: none; color: white; padding: 10px 24px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">
          <i class="fas fa-money-bill-wave"></i> Place Bet
        </button>
      </div>
    `;
    
    modal.classList.add('show');
  }

  placeBetFromModal(horseId) {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    this.placeBet(horseId, betAmount);
    this.closeHorseDetails();
  }

  placeBet(horseId, betAmount = null) {
    const horse = this.horses.find(h => h.id === horseId);
    if (!horse) return;
    
    // Remove existing bet for this horse
    this.selectedBets = this.selectedBets.filter(bet => bet.horseId !== horseId);
    
    const amount = betAmount || 50;
    if (amount > this.playerBalance) {
      alert('Insufficient balance for this bet!');
      return;
    }
    
    if (amount < 10) {
      alert('Minimum bet is $10!');
      return;
    }
    
    const bet = {
      horseId: horse.id,
      horseName: horse.name,
      horseEmoji: horse.emoji,
      horseNumber: horse.number,
      amount: amount,
      odds: horse.odds,
      potentialPayout: Math.round(amount * horse.odds)
    };
    
    this.selectedBets.push(bet);
    this.updateBettingControls();
    
    // Add visual feedback
    const thumbnail = document.querySelector(`[data-horse-id="${horseId}"]`);
    if (thumbnail) {
      thumbnail.classList.add('selected');
    }
  }

  removeBet(horseId) {
    this.selectedBets = this.selectedBets.filter(bet => bet.horseId !== horseId);
    this.updateBettingControls();
    
    // Remove visual feedback
    const thumbnail = document.querySelector(`[data-horse-id="${horseId}"]`);
    if (thumbnail) {
      thumbnail.classList.remove('selected');
    }
  }

  closeHorseDetails() {
    const modal = document.getElementById('horseDetailsModal');
    if (modal) modal.classList.remove('show');
  }

  closeResultsModal() {
    const modal = document.getElementById('resultsModal');
    if (modal) modal.classList.remove('show');
  }

  startRace() {
    if (this.raceInProgress || this.selectedBets.length === 0) return;
    
    // Stop odds updates during race
    if (this.oddsInterval) {
      clearInterval(this.oddsInterval);
    }
    
    // Deduct bet amounts from balance
    const totalBetAmount = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
    this.playerBalance -= totalBetAmount;
    this.updateUI();
    
    this.raceInProgress = true;
    const startBtn = document.getElementById('startRaceBtn');
    if (startBtn) startBtn.disabled = true;
    
    // Add focus class to main container
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) mainContainer.classList.add('race-in-progress');
    
    // Add racing animation class to horses
    this.horses.forEach(horse => {
      const horseElement = document.getElementById(`horse-${horse.id}`);
      if (horseElement) {
        horseElement.classList.add('racing');
      }
    });
    
    this.updateCommentary("And they're off! The race has begun!");
    
    // Focus/scroll to the track
    const trackElement = document.getElementById('track');
    if (trackElement) {
      trackElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
    
    // Reset race positions
    this.horses.forEach(horse => {
      horse.distanceCompleted = 0;
      horse.raceTime = 0;
      horse.position = 0;
    });
    
    this.runRace();
  }

  runRace() {
    const raceInterval = setInterval(() => {
      let raceFinished = false;
      
      this.horses.forEach((horse, index) => {
        if (horse.distanceCompleted >= 360) return; // Already finished
        
        // Calculate movement based on horse stats, weather, and random factors
        const speedFactor = horse.speed / 60; // Normalize speed
        const staminaFactor = Math.max(0.3, horse.stamina / 100 - (horse.raceTime / 1000) * 0.1); // Stamina decreases over time
        const formFactor = 0.8 + (this.calculateFormScore(horse.form) / 500); // Form influence
        
        // Weather effects
        let weatherModifier = this.weatherConditions.weather.speedModifier;
        let staminaModifier = this.weatherConditions.weather.staminaModifier;
        
        // Track condition effects
        weatherModifier *= this.weatherConditions.trackCondition.speedModifier;
        
        // Horse preferences bonus
        if (horse.weatherPreference === this.weatherConditions.weather.name) {
          weatherModifier *= 1.05; // 5% bonus
        }
        if (horse.trackPreference === this.weatherConditions.trackCondition.name) {
          weatherModifier *= 1.03; // 3% bonus
        }
        
        const randomFactor = 0.7 + Math.random() * 0.6; // Random racing dynamics
        
        const moveAmount = speedFactor * staminaFactor * formFactor * weatherModifier * randomFactor * 2;
        horse.distanceCompleted += moveAmount;
        horse.raceTime += 50;
        
        // Update horse position on athletics track
        const angle = 270 + horse.distanceCompleted; // Start from bottom, go clockwise
        const radiusX = 330; // Adjusted for larger green track area
        const radiusY = 150; // Adjusted for larger green track area
        const x = 400 + radiusX * Math.cos((angle * Math.PI) / 180);
        const y = 200 + radiusY * Math.sin((angle * Math.PI) / 180);
        
        const horseElement = document.getElementById(`horse-${horse.id}`);
        if (horseElement) {
          horseElement.style.left = `${x - 16}px`;
          horseElement.style.top = `${y - 16}px`;
          horseElement.style.transform = `rotate(${angle + 90}deg)`; // Face forward
          
          // Add color coding for position tracking
          horseElement.style.filter = `hue-rotate(${horse.id * 60}deg)`;
        }
        
        // Check if race is finished
        if (horse.distanceCompleted >= 360 && horse.position === 0) {
          horse.position = this.raceResults.length + 1;
          this.raceResults.push(horse);
          
          if (this.raceResults.length === 1) {
            this.updateCommentary(`#${horse.number} ${horse.name} wins the race! What a performance!`);
          } else if (this.raceResults.length === 2) {
            this.updateCommentary(`#${horse.number} ${horse.name} finishes second!`);
          } else if (this.raceResults.length === 3) {
            this.updateCommentary(`#${horse.number} ${horse.name} takes third place!`);
          }
          
          // Remove racing animation
          if (horseElement) {
            horseElement.classList.remove('racing');
          }
          
          if (this.raceResults.length >= 3) {
            raceFinished = true;
          }
        }
      });
      
      // Update commentary with race progress
      if (this.raceResults.length === 0 && Math.random() < 0.1) {
        const leadingHorse = this.horses.reduce((leader, horse) => 
          horse.distanceCompleted > leader.distanceCompleted ? horse : leader
        );
        this.updateCommentary(`#${leadingHorse.number} ${leadingHorse.name} is taking the lead!`);
      }
      
      if (raceFinished) {
        clearInterval(raceInterval);
        this.finishRace();
      }
    }, 50);
  }

  calculateFormScore(form) {
    const scores = { 'W': 100, 'P': 75, 'S': 50, 'L': 25 };
    return form.reduce((total, result) => total + scores[result], 0);
  }

  finishRace() {
    // Ensure all horses finish
    this.horses.forEach(horse => {
      if (horse.position === 0) {
        horse.position = this.raceResults.length + 1;
        this.raceResults.push(horse);
      }
      const horseElement = document.getElementById(`horse-${horse.id}`);
      if (horseElement) {
        horseElement.classList.remove('racing');
      }
    });
    
    this.raceInProgress = false;
    
    // Remove focus class from main container
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) mainContainer.classList.remove('race-in-progress');
    
    // Calculate winnings
    let totalWinnings = 0;
    const bettingResults = [];
    
    this.selectedBets.forEach(bet => {
      const horse = this.horses.find(h => h.id === bet.horseId);
      const position = horse.position;
      
      let payout = 0;
      let resultText = '';
      
      if (position === 1) {
        payout = bet.potentialPayout;
        resultText = 'WIN!';
        totalWinnings += payout;
      } else if (position === 2) {
        payout = Math.round(bet.amount * 1.5); // Place payout
        resultText = 'PLACE';
        totalWinnings += payout;
      } else if (position === 3) {
        payout = bet.amount; // Show payout (break even)
        resultText = 'SHOW';
        totalWinnings += payout;
      } else {
        resultText = 'LOSS';
      }
      
      bettingResults.push({
        horseName: bet.horseName,
        horseEmoji: bet.horseEmoji,
        horseNumber: bet.horseNumber,
        position: position,
        betAmount: bet.amount,
        payout: payout,
        result: resultText
      });
    });
    
    this.playerBalance += totalWinnings;
    this.totalWinnings += Math.max(0, totalWinnings - this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0));
    
    this.saveProgress();
    this.updateUI();
    
    // Show results modal
    this.showResultsModal(bettingResults);
    
    // Restart odds updates after race
    setTimeout(() => {
      this.startOddsUpdates();
      const startBtn = document.getElementById('startRaceBtn');
      if (startBtn) startBtn.disabled = false;
    }, 1000);
  }

  showResultsModal(bettingResults) {
    const modal = document.getElementById('resultsModal');
    const podium = document.getElementById('podium');
    const bettingResultsContainer = document.getElementById('bettingResults');
    
    if (!modal || !podium || !bettingResultsContainer) return;
    
    // Show top 3 finishers
    podium.innerHTML = this.raceResults.slice(0, 3).map((horse, index) => {
      const positions = ['first', 'second', 'third'];
      const positionNumbers = ['1st', '2nd', '3rd'];
      return `
        <div class="podium-place podium-${positions[index]}">
          <div class="horse-emoji">${horse.emoji}</div>
          <div class="position">${positionNumbers[index]}</div>
          <div class="horse-name">${horse.name}</div>
          <div class="finish-time">${(horse.raceTime / 1000).toFixed(1)}s</div>
        </div>
      `;
    }).join('');
    
    // Show betting results
    const totalBetAmount = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalPayout = bettingResults.reduce((sum, result) => sum + result.payout, 0);
    const netResult = totalPayout - totalBetAmount;
    
    bettingResultsContainer.innerHTML = `
      <h3><i class="fas fa-calculator"></i> Your Betting Results</h3>
      ${bettingResults.map(result => `
        <div class="result-item">
          <div>
            <strong>#${result.horseNumber} ${result.horseEmoji} ${result.horseName}</strong><br>
            <small>Finished ${result.position}${result.position === 1 ? 'st' : result.position === 2 ? 'nd' : result.position === 3 ? 'rd' : 'th'} • Bet: $${result.betAmount}</small>
          </div>
          <div class="${result.payout > 0 ? 'result-win' : 'result-loss'}">
            ${result.result}<br>
            <strong>$${result.payout}</strong>
          </div>
        </div>
      `).join('')}
      <div style="margin-top: 20px; padding: 15px; background: ${netResult >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 68, 68, 0.2)'}; border-radius: 10px; text-align: center;">
        <strong style="font-size: 1.2rem; color: ${netResult >= 0 ? '#4CAF50' : '#ff4444'};">
          Net Result: ${netResult >= 0 ? '+' : ''}$${netResult}
        </strong>
      </div>
    `;
    
    modal.classList.add('show');
  }

  resetGame() {
    if (confirm('Are you sure you want to reset your progress? This will restore your balance to $1000 and clear all statistics.')) {
      this.playerBalance = 1000;
      this.totalWinnings = 0;
      this.saveProgress();
      this.updateUI();
      this.generateNewRace();
      this.updateCommentary('Game reset! Your balance has been restored to $1000. Good luck!');
    }
  }

  saveProgress() {
    localStorage.setItem('horseRacing_balance', this.playerBalance.toString());
    localStorage.setItem('horseRacing_totalWinnings', this.totalWinnings.toString());
  }

  loadBalance() {
    const saved = localStorage.getItem('horseRacing_balance');
    return saved ? parseInt(saved) : 1000;
  }

  loadTotalWinnings() {
    const saved = localStorage.getItem('horseRacing_totalWinnings');
    return saved ? parseInt(saved) : 0;
  }
}

// Global functions for UI interactions
function toggleInstructions() {
  const content = document.getElementById('instructionsContent');
  const toggle = document.getElementById('instructionsToggle');
  
  if (content && toggle) {
    if (content.classList.contains('show')) {
      content.classList.remove('show');
      toggle.style.transform = 'rotate(0deg)';
    } else {
      content.classList.add('show');
      toggle.style.transform = 'rotate(180deg)';
    }
  }
}

function closeHorseDetails() {
  const modal = document.getElementById('horseDetailsModal');
  if (modal) modal.classList.remove('show');
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
  try {
    game = new HorseRacingGame();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
