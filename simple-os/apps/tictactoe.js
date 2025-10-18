// Tic-Tac-Toe Game
os.registerApp({
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    icon: '⭕',
    category: 'games',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.initGame();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    initGame() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.mode = 'ai'; // 'ai' or '2player'
    },

    render(content) {
        content.innerHTML = `
            <div class="tictactoe-game">
                <div class="tictactoe-header">
                    <h2>Tic-Tac-Toe</h2>
                    <div class="tictactoe-mode">
                        <button onclick="os.apps['tictactoe'].setMode('ai')"
                                class="${this.mode === 'ai' ? 'active' : ''}">
                            vs Computer
                        </button>
                        <button onclick="os.apps['tictactoe'].setMode('2player')"
                                class="${this.mode === '2player' ? 'active' : ''}">
                            2 Players
                        </button>
                    </div>
                    <div class="tictactoe-status" id="ttt-status">Player X's turn</div>
                </div>
                <div class="tictactoe-board" id="ttt-board">
                    ${this.renderBoard()}
                </div>
                <button onclick="os.apps['tictactoe'].resetGame()" class="ttt-reset">New Game</button>
            </div>
        `;
    },

    renderBoard() {
        return this.board.map((cell, index) => `
            <div class="ttt-cell" onclick="os.apps['tictactoe'].makeMove(${index})">
                ${cell || ''}
            </div>
        `).join('');
    },

    setMode(mode) {
        this.mode = mode;
        this.resetGame();
    },

    makeMove(index) {
        if (this.board[index] || this.gameOver) return;

        this.board[index] = this.currentPlayer;
        this.updateBoard();

        if (this.checkWinner()) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.updateStatus(`Player ${this.currentPlayer} wins! 🎉`);
            return;
        }

        if (this.board.every(cell => cell !== null)) {
            this.gameOver = true;
            this.updateStatus("It's a draw!");
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateStatus(`Player ${this.currentPlayer}'s turn`);

        // AI move
        if (this.mode === 'ai' && this.currentPlayer === 'O' && !this.gameOver) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    },

    makeAIMove() {
        const bestMove = this.findBestMove();
        if (bestMove !== -1) {
            this.makeMove(bestMove);
        }
    },

    findBestMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) {
                this.board[i] = 'O';
                if (this.checkWinner()) {
                    this.board[i] = null;
                    return i;
                }
                this.board[i] = null;
            }
        }

        // Block player
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) {
                this.board[i] = 'X';
                if (this.checkWinner()) {
                    this.board[i] = null;
                    return i;
                }
                this.board[i] = null;
            }
        }

        // Take center
        if (!this.board[4]) return 4;

        // Take corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => !this.board[i]);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take any available
        const available = this.board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
        return available.length > 0 ? available[0] : -1;
    },

    checkWinner() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        return lines.some(([a, b, c]) => {
            return this.board[a] &&
                   this.board[a] === this.board[b] &&
                   this.board[a] === this.board[c];
        });
    },

    updateBoard() {
        const boardEl = document.getElementById('ttt-board');
        if (boardEl) {
            boardEl.innerHTML = this.renderBoard();
        }
    },

    updateStatus(message) {
        const statusEl = document.getElementById('ttt-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    },

    resetGame() {
        this.initGame();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    }
});
