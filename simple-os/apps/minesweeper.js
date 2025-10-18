// Minesweeper Game
os.registerApp({
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '💣',
    category: 'games',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.rows = 10;
        this.cols = 10;
        this.mines = 15;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;

        const content = os.getWindowContent(windowId);
        this.render(content);
        this.initBoard();
    },

    render(content) {
        content.innerHTML = `
            <div class="minesweeper">
                <div class="mine-toolbar">
                    <button onclick="os.apps['minesweeper'].reset()">🔄 New Game</button>
                    <span id="mine-status">Mines: ${this.mines}</span>
                </div>
                <div id="mine-board" class="mine-board"></div>
            </div>
        `;
    },

    initBoard() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.gameOver = false;

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            if (this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;

                // Update adjacent cells
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;

                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] !== -1) {
                            this.board[nr][nc]++;
                        }
                    }
                }
            }
        }

        this.renderBoard();
    },

    renderBoard() {
        const boardEl = document.getElementById('mine-board');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell';

                if (this.revealed[r][c]) {
                    cell.classList.add('revealed');
                    if (this.board[r][c] === -1) {
                        cell.textContent = '💣';
                    } else if (this.board[r][c] > 0) {
                        cell.textContent = this.board[r][c];
                        cell.style.color = this.getNumberColor(this.board[r][c]);
                    }
                } else if (this.flagged[r][c]) {
                    cell.textContent = '🚩';
                }

                cell.onclick = () => this.revealCell(r, c);
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                };

                boardEl.appendChild(cell);
            }
        }
    },

    getNumberColor(num) {
        const colors = ['', 'blue', 'green', 'red', 'darkblue', 'darkred', 'cyan', 'black', 'gray'];
        return colors[num] || 'black';
    },

    revealCell(row, col) {
        if (this.gameOver || this.revealed[row][col] || this.flagged[row][col]) return;

        this.revealed[row][col] = true;

        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.revealAll();
            this.renderBoard();
            setTimeout(() => alert('Game Over! You hit a mine!'), 100);
            return;
        }

        // If empty cell, reveal adjacent cells
        if (this.board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;

                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        this.revealCell(nr, nc);
                    }
                }
            }
        }

        this.renderBoard();
        this.checkWin();
    },

    toggleFlag(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;

        this.flagged[row][col] = !this.flagged[row][col];
        this.renderBoard();

        const flaggedCount = this.flagged.flat().filter(f => f).length;
        const statusEl = document.getElementById('mine-status');
        if (statusEl) {
            statusEl.textContent = `Mines: ${this.mines - flaggedCount}`;
        }
    },

    revealAll() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.revealed[r][c] = true;
            }
        }
    },

    checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.revealed[r][c] && this.board[r][c] !== -1) {
                    revealedCount++;
                }
            }
        }

        if (revealedCount === this.rows * this.cols - this.mines) {
            this.gameOver = true;
            setTimeout(() => alert('Congratulations! You won!'), 100);
        }
    },

    reset() {
        const content = os.getWindowContent(this.windowId);
        this.render(content);
        this.initBoard();
    }
});
