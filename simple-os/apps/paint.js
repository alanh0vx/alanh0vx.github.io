// Paint/Drawing App
os.registerApp({
    id: 'paint',
    name: 'Paint',
    icon: '🎨',
    category: 'entertainment',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentTool = 'pen';
        this.lineWidth = 3;

        const content = os.getWindowContent(windowId);
        this.render(content);
        this.initCanvas();
    },

    render(content) {
        content.innerHTML = `
            <div class="paint-app">
                <div class="paint-toolbar">
                    <div class="paint-tools">
                        <button class="paint-tool ${this.currentTool === 'pen' ? 'active' : ''}"
                                onclick="os.apps['paint'].setTool('pen')" title="Pen">✏️</button>
                        <button class="paint-tool ${this.currentTool === 'eraser' ? 'active' : ''}"
                                onclick="os.apps['paint'].setTool('eraser')" title="Eraser">🧹</button>
                        <button class="paint-tool ${this.currentTool === 'fill' ? 'active' : ''}"
                                onclick="os.apps['paint'].setTool('fill')" title="Fill">🪣</button>
                    </div>

                    <div class="paint-color-picker">
                        <input type="color" id="color-picker" value="${this.currentColor}"
                               onchange="os.apps['paint'].setColor(this.value)">
                        <div class="paint-preset-colors">
                            <div class="color-swatch" style="background: #000000" onclick="os.apps['paint'].setColor('#000000')"></div>
                            <div class="color-swatch" style="background: #ffffff" onclick="os.apps['paint'].setColor('#ffffff')"></div>
                            <div class="color-swatch" style="background: #ff0000" onclick="os.apps['paint'].setColor('#ff0000')"></div>
                            <div class="color-swatch" style="background: #00ff00" onclick="os.apps['paint'].setColor('#00ff00')"></div>
                            <div class="color-swatch" style="background: #0000ff" onclick="os.apps['paint'].setColor('#0000ff')"></div>
                            <div class="color-swatch" style="background: #ffff00" onclick="os.apps['paint'].setColor('#ffff00')"></div>
                            <div class="color-swatch" style="background: #ff00ff" onclick="os.apps['paint'].setColor('#ff00ff')"></div>
                            <div class="color-swatch" style="background: #00ffff" onclick="os.apps['paint'].setColor('#00ffff')"></div>
                        </div>
                    </div>

                    <div class="paint-size-control">
                        <label>Size:</label>
                        <input type="range" id="brush-size" min="1" max="20" value="${this.lineWidth}"
                               onchange="os.apps['paint'].setLineWidth(this.value)">
                        <span id="size-display">${this.lineWidth}</span>
                    </div>

                    <div class="paint-actions">
                        <button onclick="os.apps['paint'].clearCanvas()">🗑️ Clear</button>
                        <button onclick="os.apps['paint'].saveDrawing()">💾 Save</button>
                        <button onclick="os.apps['paint'].downloadImage()">📥 Download</button>
                    </div>
                </div>

                <div class="paint-canvas-container">
                    <canvas id="paint-canvas" width="800" height="500"></canvas>
                </div>
            </div>
        `;
    },

    initCanvas() {
        this.canvas = document.getElementById('paint-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Fill with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Mouse events
        this.canvas.onmousedown = (e) => this.startDrawing(e);
        this.canvas.onmousemove = (e) => this.draw(e);
        this.canvas.onmouseup = () => this.stopDrawing();
        this.canvas.onmouseleave = () => this.stopDrawing();

        // Touch events for mobile
        this.canvas.ontouchstart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        };

        this.canvas.ontouchmove = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        };

        this.canvas.ontouchend = (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        };
    },

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'fill') {
            this.fillArea(x, y);
            this.isDrawing = false;
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }
    },

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'pen') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = 'white';
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    },

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    },

    setTool(tool) {
        this.currentTool = tool;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
        this.initCanvas();
    },

    setColor(color) {
        this.currentColor = color;
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.value = color;
        }
    },

    setLineWidth(width) {
        this.lineWidth = parseInt(width);
        const sizeDisplay = document.getElementById('size-display');
        if (sizeDisplay) {
            sizeDisplay.textContent = width;
        }
    },

    fillArea(x, y) {
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    clearCanvas() {
        if (!confirm('Clear the entire canvas?')) return;

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    saveDrawing() {
        const dataURL = this.canvas.toDataURL();
        const filename = prompt('Save as:', 'drawing.png');

        if (!filename) return;

        // Save to file system
        os.fileSystem['/'].children[filename] = {
            type: 'file',
            content: dataURL
        };

        os.saveFileSystem();
        alert('Drawing saved to file system!');
    },

    downloadImage() {
        const dataURL = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'drawing.png';
        a.click();
    }
});
