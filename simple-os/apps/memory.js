// Memory Card Game
os.registerApp({
    id: 'memory',
    name: 'Memory Cards',
    icon: '🃏',
    category: 'games',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.initGame();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    initGame() {
        this.emojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🥝', '🍒'];
        this.cards = [...this.emojis, ...this.emojis].sort(() => Math.random() - 0.5);
        this.flipped = [];
        this.matched = [];
        this.moves = 0;
        this.canFlip = true;
    },

    render(content) {
        content.innerHTML = `
            <div class="memory-game">
                <div class="memory-header">
                    <h2>Memory Cards</h2>
                    <div class="memory-stats">
                        <div>Moves: <span id="memory-moves">0</span></div>
                        <div>Matched: <span id="memory-matched">0</span>/8</div>
                    </div>
                    <button onclick="os.apps['memory'].resetGame()">New Game</button>
                </div>
                <div class="memory-board" id="memory-board">
                    ${this.renderCards()}
                </div>
            </div>
        `;
    },

    renderCards() {
        return this.cards.map((emoji, index) => {
            const isFlipped = this.flipped.includes(index);
            const isMatched = this.matched.includes(index);

            return `
                <div class="memory-card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}"
                     onclick="os.apps['memory'].flipCard(${index})">
                    <div class="memory-card-inner">
                        <div class="memory-card-front">?</div>
                        <div class="memory-card-back">${emoji}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    flipCard(index) {
        if (!this.canFlip) return;
        if (this.flipped.includes(index)) return;
        if (this.matched.includes(index)) return;
        if (this.flipped.length >= 2) return;

        this.flipped.push(index);
        this.updateBoard();

        if (this.flipped.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    },

    checkMatch() {
        this.canFlip = false;
        const [first, second] = this.flipped;

        setTimeout(() => {
            if (this.cards[first] === this.cards[second]) {
                this.matched.push(first, second);
                this.flipped = [];

                if (this.matched.length === this.cards.length) {
                    setTimeout(() => {
                        alert(`🎉 Congratulations! You won in ${this.moves} moves!`);
                    }, 300);
                }
            } else {
                this.flipped = [];
            }

            this.canFlip = true;
            this.updateBoard();
        }, 1000);
    },

    updateBoard() {
        const boardEl = document.getElementById('memory-board');
        if (boardEl) {
            boardEl.innerHTML = this.renderCards();
        }
    },

    updateStats() {
        const movesEl = document.getElementById('memory-moves');
        const matchedEl = document.getElementById('memory-matched');

        if (movesEl) {
            movesEl.textContent = this.moves;
        }

        if (matchedEl) {
            matchedEl.textContent = this.matched.length / 2;
        }
    },

    resetGame() {
        this.initGame();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    }
});
