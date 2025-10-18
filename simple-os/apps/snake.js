// Snake Game
os.registerApp({
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    category: 'games',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.initGame();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    initGame() {
        this.gridSize = 20;
        this.cellSize = 20;
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 1, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.gameOver = false;
        this.speed = 150;
    },

    render(content) {
        content.innerHTML = `
            <div class="snake-game">
                <div class="snake-header">
                    <div class="snake-score">Score: <span id="snake-score">0</span></div>
                    <button onclick="os.apps['snake'].startGame()" id="snake-start-btn">Start Game</button>
                    <button onclick="os.apps['snake'].resetGame()">Reset</button>
                </div>
                <canvas id="snake-canvas" width="${this.gridSize * this.cellSize}" height="${this.gridSize * this.cellSize}"></canvas>
                <div class="snake-controls">
                    <p>Use Arrow Keys to control the snake</p>
                    <div class="snake-mobile-controls">
                        <button onclick="os.apps['snake'].changeDirection(0, -1)">▲</button>
                        <div>
                            <button onclick="os.apps['snake'].changeDirection(-1, 0)">◀</button>
                            <button onclick="os.apps['snake'].changeDirection(1, 0)">▶</button>
                        </div>
                        <button onclick="os.apps['snake'].changeDirection(0, 1)">▼</button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupControls();
        this.drawGame();
    },

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameLoop) return;

            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: -1};
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: 1};
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    if (this.direction.x === 0) {
                        this.direction = {x: -1, y: 0};
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (this.direction.x === 0) {
                        this.direction = {x: 1, y: 0};
                    }
                    e.preventDefault();
                    break;
            }
        });
    },

    changeDirection(x, y) {
        if (!this.gameLoop) return;

        if ((x !== 0 && this.direction.x === 0) || (y !== 0 && this.direction.y === 0)) {
            this.direction = {x, y};
        }
    },

    startGame() {
        if (this.gameLoop) return;

        this.gameOver = false;
        const startBtn = document.getElementById('snake-start-btn');
        if (startBtn) startBtn.disabled = true;

        this.gameLoop = setInterval(() => this.update(), this.speed);
    },

    update() {
        if (this.gameOver) {
            this.endGame();
            return;
        }

        // Move snake
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Check wall collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.gameOver = true;
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('snake-score').textContent = this.score;
            this.food = this.generateFood();

            // Increase speed slightly
            if (this.score % 50 === 0 && this.speed > 50) {
                clearInterval(this.gameLoop);
                this.speed -= 10;
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }

        this.drawGame();
    },

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));

        return food;
    },

    drawGame() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#16213e';
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4ecca3' : '#45a293';
            this.ctx.fillRect(
                segment.x * this.cellSize + 1,
                segment.y * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(
            this.food.x * this.cellSize + 1,
            this.food.y * this.cellSize + 1,
            this.cellSize - 2,
            this.cellSize - 2
        );
    },

    endGame() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;

        const startBtn = document.getElementById('snake-start-btn');
        if (startBtn) startBtn.disabled = false;

        alert(`Game Over! Your score: ${this.score}`);
    },

    resetGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        this.initGame();
        this.drawGame();
        document.getElementById('snake-score').textContent = '0';

        const startBtn = document.getElementById('snake-start-btn');
        if (startBtn) startBtn.disabled = false;
    }
});
