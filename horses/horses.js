$(document).ready(function() {
    let currentPlayer = null;
    let horses = [];
    const horseEmojis = ["🐎", "🐴", "🏇", "🦄"];
    const trackLength = 40;
    const cellWidth = 30;  // Width of each cell in pixels
  
    $("#menuToggle").click(function() {
      $("#sideMenu").toggleClass("active");
      updateMenuInfo();
    });
  
    function updateMenuInfo() {
      if (currentPlayer) {
        $("#menu-player-name").text(currentPlayer.username);
        $("#menu-player-balance").text(currentPlayer.balance.toFixed(2));
        $("#user-menu-info").show();
        $("#auth-forms").hide();
      } else {
        $("#user-menu-info").hide();
        $("#auth-forms").show();
      }
    }
  
    function generateHorseName() {
      const adjectives = ["Speedy", "Fiery", "Swift", "Wild", "Graceful", "Furious", "Brave"];
      const nouns = ["Thunder", "Whirlwind", "Lightning", "Blaze", "Comet", "Storm", "Wind"];
      return adjectives[Math.floor(Math.random() * adjectives.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];
    }
  
    function generateRandomOdds(speed) {
      let baseOdds = 7 - (speed - 30) / 4;
      baseOdds += (Math.random() - 0.5) * 2;
      return Math.max(1.5, baseOdds.toFixed(2));
    }
  
    function generateHorse(index) {
      const breeds = ["Thoroughbred", "Arabian", "Quarter Horse", "Mustang"];
      const speed = Math.floor(Math.random() * 20) + 30;  // Speed between 30-49 km/h
      return {
        name: generateHorseName(),
        emoji: horseEmojis[index],
        breed: breeds[Math.floor(Math.random() * breeds.length)],
        age: Math.floor(Math.random() * 4) + 1,
        speed: speed,
        odds: generateRandomOdds(speed)
      };
    }
  
    function generateTrack() {
      let track = "";
      let options = "";
      horses = [];
      for (let i = 0; i < horseEmojis.length; i++) {
        const horse = generateHorse(i);
        horses.push(horse);
        track += `<div class="track-row">
                    <div class="horse" data-horse-index="${i}" title="${horse.name}">${horse.emoji}</div>
                    <div class="finish-line">🏁</div>
                  </div>`;
        options += `<option value="${i}">${horse.emoji} ${horse.name} (${horse.odds})</option>`;
      }
      updateHorseInfo();
      return { track: track, options: options };
    }
  
    function updateHorseInfo() {
      let horseInfoHtml = "";
      horses.forEach((horse, index) => {
        horseInfoHtml += `
          <div class="horse-card">
            <h4 class="horse-name" data-index="${index}">${horse.emoji} ${horse.name}</h4>
            <div class="horse-details" id="horse-details-${index}">
              <p>Breed: ${horse.breed}</p>
              <p>Age: ${horse.age} years</p>
              <p>Speed: ${horse.speed} km/h</p>
              <p>Odds: ${horse.odds}</p>
            </div>
          </div>
        `;
      });
      $("#horse-info").html(`<h3>Horse Information</h3>${horseInfoHtml}`);
      
      $(".horse-name").click(function() {
        const index = $(this).data("index");
        $(`#horse-details-${index}`).slideToggle();
      });
    }
  
    function moveHorse(horseIndex, distance) {
      let horse = $('.track-row').eq(horseIndex).find('.horse');
      let maxWidth = $('.track').width() - horse.width() - $('.finish-line').width();
      let position = Math.min(distance * cellWidth, maxWidth);
      horse.css('left', `${position}px`);
      return distance;
    }
  
    function addCommentary(message) {
      $("#commentary-box").text(message);
    }
  
    function startRace() {
      if (!currentPlayer) {
        alert("Please login to start the race.");
        return;
      }
      let betAmount = parseInt($("#bet-amount").val());
      if (betAmount > currentPlayer.balance) {
        alert("You don't have enough money for this bet. Please lower your bet amount.");
        return;
      }
      $("#commentary-box").empty();
      addCommentary("And they're off!");
      let positions = new Array(horses.length).fill(0);
      let winner = -1;
      let commentaryInterval;
      let raceInterval = setInterval(() => {
        horses.forEach((horse, index) => {
          if (positions[index] < trackLength) {
            let speedFactor = horse.speed / 40;
            let randomFactor = 0.8 + Math.random() * 0.4;
            let move = (Math.random() * 0.5) * speedFactor * randomFactor;
            positions[index] += move;
            moveHorse(index, positions[index]);
            
            if (positions[index] >= trackLength && winner === -1) {
              winner = index;
              clearInterval(raceInterval);
              clearInterval(commentaryInterval);
              addCommentary(`${horse.name} has won the race!`);
              setTimeout(() => {
                alert(`${horse.name} has won the race!`);
                let betHorseIndex = parseInt($("#bet-horse").val());
                if (winner === betHorseIndex) {
                  let payout = betAmount * parseFloat(horse.odds);
                  currentPlayer.balance += payout;
                  alert(`Congratulations! You won $${payout.toFixed(2)} from your bet.`);
                } else {
                  currentPlayer.balance -= betAmount;
                  alert("Sorry, you lost your bet.");
                }
                updatePlayerInfo();
                checkGameStatus();
              }, 500);
            }
          }
        });
      }, 50);
  
      commentaryInterval = setInterval(() => {
        let leadingHorse = positions.indexOf(Math.max(...positions));
        addCommentary(`${horses[leadingHorse].name} is in the lead!`);
      }, 1000);
    }
  
    function restartGame() {
      let { track, options } = generateTrack();
      $('.track').html(track);
      $('#bet-horse').html(options);
      $("#commentary-box").empty();
    }
  
    function updatePlayerInfo() {
      if (currentPlayer) {
        $("#player-name-display").text(currentPlayer.username);
        $("#player-balance").text(currentPlayer.balance.toFixed(2));
        localStorage.setItem(currentPlayer.username, JSON.stringify(currentPlayer));
        if (currentPlayer.balance <= 1) {
          $("#add-money").show();
          $("#betting-area").hide();
        } else {
          $("#add-money").hide();
          $("#betting-area").show();
        }
        $("#bet-amount").attr("max", currentPlayer.balance);
        saveLoginState();
      }
    }
  
    function checkGameStatus() {
      if (currentPlayer.balance >= 100) {
        alert("Congratulations! You've won the game by reaching $100!");
        resetGame();
      } else if (currentPlayer.balance <= 1) {
        alert("Game over! Your balance is $1 or less. You can add $5 to continue playing.");
        updatePlayerInfo();
      }
    }
  
    function resetGame() {
      currentPlayer.balance = 10;
      updatePlayerInfo();
      restartGame();
    }
  
    function addMoney() {
      currentPlayer.balance += 5;
      updatePlayerInfo();
      alert("$5 has been added to your balance. Good luck!");
    }
  
    function registerUser() {
      const username = $("#register-username").val().trim();
      const password = $("#register-password").val();
      if (username && password) {
        if (localStorage.getItem(username)) {
          alert("Username already exists. Please choose another.");
        } else {
          const newPlayer = {
            username: username,
            password: btoa(password),  // Base64 encode the password
            balance: 10
          };
          localStorage.setItem(username, JSON.stringify(newPlayer));
          alert("Registration successful. Please login.");
          toggleAuthForm();
        }
      } else {
        alert("Please enter both username and password.");
      }
    }
  
    function loginUser() {
      const username = $("#login-username").val().trim();
      const password = $("#login-password").val();
      const storedPlayer = localStorage.getItem(username);
      if (storedPlayer) {
        const player = JSON.parse(storedPlayer);
        if (btoa(password) === player.password) {
          currentPlayer = player;
          $("#sideMenu").removeClass("active");
          $("#user-info").show();
          $("#login-prompt").hide();
          updatePlayerInfo();
          updateMenuInfo();
          restartGame();
        } else {
          alert("Incorrect password.");
        }
      } else {
        alert("User not found.");
      }
    }
  
    function logoutUser() {
      currentPlayer = null;
      $("#user-info").hide();
      $("#betting-area").hide();
      $("#add-money").hide();
      $("#login-prompt").show();
      $("#sideMenu").addClass("active");
      $("#login-username").val("");
      $("#login-password").val("");
      updateMenuInfo();
      clearLoginState();
    }
  
    function toggleAuthForm() {
      $("#login-form, #register-form").toggle();
      const buttonText = $("#toggle-auth").text() === "Switch to Register" ? "Switch to Login" : "Switch to Register";
      $("#toggle-auth").text(buttonText);
    }
  
    function resetAllData() {
      if (confirm("Are you sure you want to reset all game data? This will delete all player accounts and cannot be undone.")) {
        localStorage.clear();
        location.reload();
      }
    }
  
    function saveLoginState() {
      if (currentPlayer) {
        localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
      }
    }
  
    function loadLoginState() {
      const savedPlayer = localStorage.getItem('currentPlayer');
      if (savedPlayer) {
        currentPlayer = JSON.parse(savedPlayer);
        $("#user-info").show();
        $("#betting-area").show();
        $("#login-prompt").hide();
        updatePlayerInfo();
        updateMenuInfo();
        restartGame();
      }
    }
  
    function clearLoginState() {
      localStorage.removeItem('currentPlayer');
    }
  
    $("#register-button").click(registerUser);
    $("#login-button").click(loginUser);
    $("#logout").click(logoutUser);
    $("#start").click(startRace);
    $("#restart").click(restartGame);
    $("#toggle-auth").click(toggleAuthForm);
    $("#reset-all").click(resetAllData);
    $("#add-money").click(addMoney);
    $("#menu-logout").click(logoutUser);
  
    $("#bet-amount").on('input', function() {
      let value = parseInt($(this).val());
      let max = currentPlayer ? currentPlayer.balance : 10;
      if (value < 1) $(this).val(1);
      if (value > max) $(this).val(max);
    });
  
    // Initialize the game
    loadLoginState();
    if (!currentPlayer) {
      restartGame();
      $("#login-prompt").show();
    }
  });