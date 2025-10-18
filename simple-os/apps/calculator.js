// Scientific Calculator App
os.registerApp({
    id: 'calculator',
    name: 'Calculator',
    icon: '🔢',
    category: 'utilities',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
        this.memory = 0;
        this.scientificMode = false;

        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    render(content) {
        content.innerHTML = `
            <div class="calculator">
                <div class="calc-mode-toggle">
                    <button onclick="os.apps['calculator'].toggleMode()" class="mode-toggle-btn">
                        ${this.scientificMode ? 'Basic' : 'Scientific'}
                    </button>
                </div>
                <div class="calc-display" id="calc-display">${this.display}</div>
                ${this.scientificMode ? this.renderScientificButtons() : this.renderBasicButtons()}
            </div>
        `;
    },

    renderBasicButtons() {
        return `
            <div class="calc-buttons">
                <button onclick="os.apps['calculator'].clear()">C</button>
                <button onclick="os.apps['calculator'].clearEntry()">CE</button>
                <button onclick="os.apps['calculator'].percent()">%</button>
                <button onclick="os.apps['calculator'].setOperation('/')" class="operator">÷</button>

                <button onclick="os.apps['calculator'].appendNumber('7')">7</button>
                <button onclick="os.apps['calculator'].appendNumber('8')">8</button>
                <button onclick="os.apps['calculator'].appendNumber('9')">9</button>
                <button onclick="os.apps['calculator'].setOperation('*')" class="operator">×</button>

                <button onclick="os.apps['calculator'].appendNumber('4')">4</button>
                <button onclick="os.apps['calculator'].appendNumber('5')">5</button>
                <button onclick="os.apps['calculator'].appendNumber('6')">6</button>
                <button onclick="os.apps['calculator'].setOperation('-')" class="operator">−</button>

                <button onclick="os.apps['calculator'].appendNumber('1')">1</button>
                <button onclick="os.apps['calculator'].appendNumber('2')">2</button>
                <button onclick="os.apps['calculator'].appendNumber('3')">3</button>
                <button onclick="os.apps['calculator'].setOperation('+')" class="operator">+</button>

                <button onclick="os.apps['calculator'].appendNumber('0')" style="grid-column: span 2;">0</button>
                <button onclick="os.apps['calculator'].appendNumber('.')">.</button>
                <button onclick="os.apps['calculator'].equals()" class="operator">=</button>
            </div>
        `;
    },

    renderScientificButtons() {
        return `
            <div class="calc-buttons-sci">
                <button onclick="os.apps['calculator'].clear()">C</button>
                <button onclick="os.apps['calculator'].clearEntry()">CE</button>
                <button onclick="os.apps['calculator'].toggleSign()">±</button>
                <button onclick="os.apps['calculator'].percent()">%</button>
                <button onclick="os.apps['calculator'].setOperation('/')" class="operator">÷</button>

                <button onclick="os.apps['calculator'].scientific('sin')">sin</button>
                <button onclick="os.apps['calculator'].scientific('cos')">cos</button>
                <button onclick="os.apps['calculator'].scientific('tan')">tan</button>
                <button onclick="os.apps['calculator'].appendNumber('7')">7</button>
                <button onclick="os.apps['calculator'].appendNumber('8')">8</button>
                <button onclick="os.apps['calculator'].appendNumber('9')">9</button>
                <button onclick="os.apps['calculator'].setOperation('*')" class="operator">×</button>

                <button onclick="os.apps['calculator'].scientific('asin')">asin</button>
                <button onclick="os.apps['calculator'].scientific('acos')">acos</button>
                <button onclick="os.apps['calculator'].scientific('atan')">atan</button>
                <button onclick="os.apps['calculator'].appendNumber('4')">4</button>
                <button onclick="os.apps['calculator'].appendNumber('5')">5</button>
                <button onclick="os.apps['calculator'].appendNumber('6')">6</button>
                <button onclick="os.apps['calculator'].setOperation('-')" class="operator">−</button>

                <button onclick="os.apps['calculator'].scientific('sqrt')">√</button>
                <button onclick="os.apps['calculator'].setOperation('^')">x²</button>
                <button onclick="os.apps['calculator'].setOperation('pow')">xʸ</button>
                <button onclick="os.apps['calculator'].appendNumber('1')">1</button>
                <button onclick="os.apps['calculator'].appendNumber('2')">2</button>
                <button onclick="os.apps['calculator'].appendNumber('3')">3</button>
                <button onclick="os.apps['calculator'].setOperation('+')" class="operator">+</button>

                <button onclick="os.apps['calculator'].scientific('ln')">ln</button>
                <button onclick="os.apps['calculator'].scientific('log')">log</button>
                <button onclick="os.apps['calculator'].scientific('exp')">eˣ</button>
                <button onclick="os.apps['calculator'].appendNumber('0')" style="grid-column: span 2;">0</button>
                <button onclick="os.apps['calculator'].appendNumber('.')">.</button>
                <button onclick="os.apps['calculator'].equals()" class="operator">=</button>

                <button onclick="os.apps['calculator'].constant('pi')">π</button>
                <button onclick="os.apps['calculator'].constant('e')">e</button>
                <button onclick="os.apps['calculator'].scientific('factorial')">n!</button>
                <button onclick="os.apps['calculator'].appendNumber('(')">(</button>
                <button onclick="os.apps['calculator'].appendNumber(')')">)</button>
                <button onclick="os.apps['calculator'].scientific('1/x')">1/x</button>
                <button onclick="os.apps['calculator'].setOperation('mod')">mod</button>
            </div>
        `;
    },

    toggleMode() {
        this.scientificMode = !this.scientificMode;
        const content = os.getWindowContent(this.windowId);
        this.render(content);

        // Update window size
        const windowEl = document.getElementById(this.windowId);
        if (windowEl && this.scientificMode) {
            windowEl.style.width = '500px';
            windowEl.style.height = '650px';
        } else if (windowEl) {
            windowEl.style.width = '400px';
            windowEl.style.height = '550px';
        }
    },

    updateDisplay() {
        const displayEl = document.getElementById('calc-display');
        if (displayEl) {
            displayEl.textContent = this.display;
        }
    },

    appendNumber(num) {
        if (num === '.' && this.display.includes('.')) return;

        if (this.newNumber) {
            this.display = num === '.' ? '0.' : num;
            this.newNumber = false;
        } else {
            this.display = this.display === '0' && num !== '.' ? num : this.display + num;
        }

        this.updateDisplay();
    },

    clear() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
        this.updateDisplay();
    },

    clearEntry() {
        this.display = '0';
        this.newNumber = true;
        this.updateDisplay();
    },

    toggleSign() {
        const num = parseFloat(this.display);
        this.display = String(-num);
        this.updateDisplay();
    },

    percent() {
        this.display = String(parseFloat(this.display) / 100);
        this.updateDisplay();
    },

    constant(name) {
        if (name === 'pi') {
            this.display = String(Math.PI);
        } else if (name === 'e') {
            this.display = String(Math.E);
        }
        this.newNumber = true;
        this.updateDisplay();
    },

    scientific(func) {
        const num = parseFloat(this.display);
        let result;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(num);
                    break;
                case 'cos':
                    result = Math.cos(num);
                    break;
                case 'tan':
                    result = Math.tan(num);
                    break;
                case 'asin':
                    result = Math.asin(num);
                    break;
                case 'acos':
                    result = Math.acos(num);
                    break;
                case 'atan':
                    result = Math.atan(num);
                    break;
                case 'sqrt':
                    result = Math.sqrt(num);
                    break;
                case 'ln':
                    result = Math.log(num);
                    break;
                case 'log':
                    result = Math.log10(num);
                    break;
                case 'exp':
                    result = Math.exp(num);
                    break;
                case 'factorial':
                    result = this.factorial(Math.floor(num));
                    break;
                case '1/x':
                    result = 1 / num;
                    break;
                default:
                    return;
            }

            this.display = String(result);
            this.newNumber = true;
            this.updateDisplay();
        } catch (e) {
            this.display = 'Error';
            this.newNumber = true;
            this.updateDisplay();
        }
    },

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    },

    setOperation(op) {
        if (this.operation && !this.newNumber) {
            this.equals();
        }

        this.previousValue = parseFloat(this.display);
        this.operation = op;
        this.newNumber = true;
    },

    equals() {
        if (!this.operation || this.previousValue === null) return;

        const current = parseFloat(this.display);
        let result;

        try {
            switch (this.operation) {
                case '+':
                    result = this.previousValue + current;
                    break;
                case '-':
                    result = this.previousValue - current;
                    break;
                case '*':
                    result = this.previousValue * current;
                    break;
                case '/':
                    result = this.previousValue / current;
                    break;
                case '^':
                    result = Math.pow(this.previousValue, 2);
                    break;
                case 'pow':
                    result = Math.pow(this.previousValue, current);
                    break;
                case 'mod':
                    result = this.previousValue % current;
                    break;
                default:
                    return;
            }

            this.display = String(result);
            this.operation = null;
            this.previousValue = null;
            this.newNumber = true;
            this.updateDisplay();
        } catch (e) {
            this.display = 'Error';
            this.operation = null;
            this.previousValue = null;
            this.newNumber = true;
            this.updateDisplay();
        }
    }
});
