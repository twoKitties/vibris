const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Set canvas size
canvas.width = BLOCK_SIZE * BOARD_WIDTH;
canvas.height = BLOCK_SIZE * BOARD_HEIGHT;

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// Colors for tetrominos
const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

class Tetris {
    constructor() {
        this.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = null;
        this.currentPieceColor = '';
        this.isPaused = false;
        this.gameLoop = null;
        this.init();
    }

    init() {
        this.spawnPiece();
        this.updateScore();
        this.startGameLoop();
        this.setupControls();
        this.setupPauseButton();
        this.setupTouchControls();
    }

    setupTouchControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const rotateBtn = document.getElementById('rotateBtn');

        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(-1, 0);
            this.draw();
        });

        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(1, 0);
            this.draw();
        });

        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.movePiece(0, 1);
            this.draw();
        });

        rotateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rotatePiece();
            this.draw();
        });
    }

    setupPauseButton() {
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.addEventListener('click', () => this.togglePause());
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            this.drawPauseScreen();
        } else {
            this.startGameLoop();
        }
    }

    drawPauseScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    startGameLoop() {
        if (this.gameLoop) {
            clearTimeout(this.gameLoop);
        }
        if (!this.gameOver && !this.isPaused) {
            this.movePiece(0, 1);
            this.draw();
            this.gameLoop = setTimeout(() => this.startGameLoop(), 1000 / this.level);
        }
    }

    spawnPiece() {
        const randomIndex = Math.floor(Math.random() * SHAPES.length);
        this.currentPiece = SHAPES[randomIndex];
        this.currentPieceColor = COLORS[randomIndex];
        this.currentPieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(this.currentPiece[0].length / 2);
        this.currentPieceY = 0;

        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const boardX = this.currentPieceX + x;
                    const boardY = this.currentPieceY + y;

                    if (boardX < 0 || boardX >= BOARD_WIDTH || 
                        boardY >= BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    rotatePiece() {
        if (this.isPaused) return;
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        const previousPiece = this.currentPiece;
        this.currentPiece = rotated;
        if (this.checkCollision()) {
            this.currentPiece = previousPiece;
        }
    }

    movePiece(dx, dy) {
        if (this.isPaused) return;
        this.currentPieceX += dx;
        this.currentPieceY += dy;

        if (this.checkCollision()) {
            this.currentPieceX -= dx;
            this.currentPieceY -= dy;
            if (dy > 0) {
                this.lockPiece();
            }
        }
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const boardY = this.currentPieceY + y;
                    if (boardY >= 0) {
                        this.board[boardY][this.currentPieceX + x] = this.currentPieceColor;
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            this.updateScore();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    ctx.fillStyle = this.board[y][x];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            ctx.fillStyle = this.currentPieceColor;
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        ctx.fillRect(
                            (this.currentPieceX + x) * BLOCK_SIZE,
                            (this.currentPieceY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
            }
            this.draw();
        });
    }
}

// Start the game
new Tetris(); 