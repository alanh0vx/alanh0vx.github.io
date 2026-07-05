// SimpleOS UI Kit — themed, promise-based replacements for the native
// alert/confirm/prompt dialogs, plus toasts and context menus.
// Attached as `os.ui` (and `window.OSUI` for standalone pages).
(function () {
    const ui = {};

    ui.escapeHtml = function (str) {
        return String(str ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    };

    function overlayZ() {
        return (typeof os !== 'undefined' && os.zIndexCounter ? os.zIndexCounter : 100) + 20000;
    }

    function getFocusable(container) {
        return Array.from(container.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled);
    }

    // Low-level dialog. `body` may be a string (rendered as text) or an element.
    // Buttons: [{ label, value, primary, danger, role: 'cancel', validate }]
    // A button with `validate` keeps the dialog open when validate() returns false.
    ui.dialog = function ({ title = '', body = '', buttons = [{ label: 'OK', value: true, primary: true }] } = {}) {
        return new Promise(resolve => {
            const previousFocus = document.activeElement;

            const overlay = document.createElement('div');
            overlay.className = 'os-dialog-overlay';
            overlay.style.zIndex = overlayZ();

            const dialog = document.createElement('div');
            dialog.className = 'os-dialog';
            dialog.setAttribute('role', 'alertdialog');
            dialog.setAttribute('aria-modal', 'true');

            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'os-dialog-title';
                titleEl.textContent = title;
                titleEl.id = 'os-dialog-title-' + Date.now();
                dialog.setAttribute('aria-labelledby', titleEl.id);
                dialog.appendChild(titleEl);
            }

            const bodyEl = document.createElement('div');
            bodyEl.className = 'os-dialog-body';
            if (typeof body === 'string') {
                bodyEl.textContent = body;
            } else if (body) {
                bodyEl.appendChild(body);
            }
            dialog.appendChild(bodyEl);

            const footer = document.createElement('div');
            footer.className = 'os-dialog-footer';

            const close = (value) => {
                overlay.remove();
                document.removeEventListener('keydown', onKeydown, true);
                if (previousFocus && previousFocus.focus) previousFocus.focus();
                resolve(value);
            };

            const cancelButton = buttons.find(b => b.role === 'cancel');
            const primaryButton = buttons.find(b => b.primary);

            buttons.forEach(btn => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'os-dialog-btn'
                    + (btn.primary ? ' primary' : '')
                    + (btn.danger ? ' danger' : '');
                el.textContent = btn.label;
                el.onclick = () => {
                    if (btn.validate && !btn.validate()) return;
                    close(typeof btn.value === 'function' ? btn.value() : btn.value);
                };
                footer.appendChild(el);
            });
            dialog.appendChild(footer);

            const onKeydown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    close(cancelButton ? cancelButton.value : undefined);
                } else if (e.key === 'Enter' && primaryButton && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
                    e.preventDefault();
                    const primaryEl = footer.querySelector('.os-dialog-btn.primary');
                    if (primaryEl) primaryEl.click();
                } else if (e.key === 'Tab') {
                    // Trap focus inside the dialog
                    const focusables = getFocusable(dialog);
                    if (focusables.length === 0) return;
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            };
            document.addEventListener('keydown', onKeydown, true);

            overlay.addEventListener('mousedown', (e) => {
                if (e.target === overlay && cancelButton) close(cancelButton.value);
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const firstInput = dialog.querySelector('input, select, textarea');
            const primaryEl = footer.querySelector('.os-dialog-btn.primary');
            (firstInput || primaryEl || footer.firstElementChild).focus();
            if (firstInput && firstInput.select) firstInput.select();
        });
    };

    ui.alert = function (message, { title = 'Notice' } = {}) {
        return ui.dialog({
            title,
            body: message,
            buttons: [{ label: 'OK', value: undefined, primary: true, role: 'cancel' }]
        });
    };

    ui.confirm = function (message, { title = 'Confirm', danger = false, confirmLabel, cancelLabel = 'Cancel' } = {}) {
        return ui.dialog({
            title,
            body: message,
            buttons: [
                { label: cancelLabel, value: false, role: 'cancel' },
                { label: confirmLabel || (danger ? 'Delete' : 'OK'), value: true, primary: true, danger }
            ]
        }).then(v => !!v);
    };

    ui.prompt = function (message, { title = 'Input', value = '', placeholder = '', type = 'text' } = {}) {
        const wrap = document.createElement('div');
        if (message) {
            const label = document.createElement('label');
            label.className = 'os-dialog-label';
            label.textContent = message;
            wrap.appendChild(label);
        }
        const input = document.createElement('input');
        input.className = 'os-dialog-input';
        input.type = type;
        input.value = value;
        input.placeholder = placeholder;
        wrap.appendChild(input);

        return ui.dialog({
            title,
            body: wrap,
            buttons: [
                { label: 'Cancel', value: null, role: 'cancel' },
                { label: 'OK', value: () => input.value, primary: true }
            ]
        });
    };

    // fields: [{ name, label, type: 'text'|'number'|'url'|'select'|'textarea',
    //            value, placeholder, options: [{value,label}], required }]
    // Resolves { name: value, ... } or null when cancelled.
    ui.form = function (fields, { title = 'Form', submitLabel = 'Save', message = '' } = {}) {
        const wrap = document.createElement('div');
        if (message) {
            const note = document.createElement('div');
            note.className = 'os-dialog-note';
            note.textContent = message;
            wrap.appendChild(note);
        }
        const inputs = {};
        fields.forEach(field => {
            const label = document.createElement('label');
            label.className = 'os-dialog-label';
            label.textContent = field.label + (field.required ? ' *' : '');
            wrap.appendChild(label);

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                (field.options || []).forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value !== undefined ? opt.value : opt;
                    o.textContent = opt.label !== undefined ? opt.label : opt;
                    input.appendChild(o);
                });
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = field.rows || 4;
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            input.className = 'os-dialog-input';
            if (field.value !== undefined) input.value = field.value;
            if (field.placeholder) input.placeholder = field.placeholder;
            inputs[field.name] = { input, field };
            wrap.appendChild(input);
        });

        const validate = () => {
            let ok = true;
            Object.values(inputs).forEach(({ input, field }) => {
                const missing = field.required && !String(input.value).trim();
                input.classList.toggle('invalid', missing);
                if (missing && ok) {
                    input.focus();
                    ok = false;
                }
            });
            return ok;
        };

        return ui.dialog({
            title,
            body: wrap,
            buttons: [
                { label: 'Cancel', value: null, role: 'cancel' },
                {
                    label: submitLabel,
                    primary: true,
                    validate,
                    value: () => {
                        const result = {};
                        Object.entries(inputs).forEach(([name, { input }]) => {
                            result[name] = input.value.trim();
                        });
                        return result;
                    }
                }
            ]
        });
    };

    ui.toast = function (message, { type = 'info', duration = 2500 } = {}) {
        let container = document.getElementById('os-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'os-toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        container.style.zIndex = overlayZ() + 1;

        const toast = document.createElement('div');
        toast.className = `os-toast os-toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('os-toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // items: [{ label, value, danger }] — resolves selected value or null.
    ui.menu = function (items, { x = 0, y = 0 } = {}) {
        return new Promise(resolve => {
            const menu = document.createElement('div');
            menu.className = 'os-ui-menu';
            menu.style.zIndex = overlayZ() + 2;
            menu.setAttribute('role', 'menu');

            const close = (value) => {
                menu.remove();
                document.removeEventListener('mousedown', onOutside, true);
                document.removeEventListener('keydown', onKeydown, true);
                resolve(value);
            };

            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'os-ui-menu-item' + (item.danger ? ' danger' : '');
                el.setAttribute('role', 'menuitem');
                el.tabIndex = 0;
                el.textContent = item.label;
                el.onclick = () => close(item.value);
                el.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        close(item.value);
                    }
                };
                menu.appendChild(el);
            });

            const onOutside = (e) => {
                if (!menu.contains(e.target)) close(null);
            };
            const onKeydown = (e) => {
                if (e.key === 'Escape') close(null);
            };
            document.addEventListener('mousedown', onOutside, true);
            document.addEventListener('keydown', onKeydown, true);

            document.body.appendChild(menu);

            // Keep the menu on screen
            const rect = menu.getBoundingClientRect();
            menu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px';
            menu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px';
        });
    };

    window.OSUI = ui;
    if (typeof os !== 'undefined') os.ui = ui;
})();
