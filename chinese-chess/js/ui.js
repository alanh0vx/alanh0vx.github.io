// ============================================================
// ui.js — UI components, dialogs, and screen interactions
// ============================================================
(function () {
  'use strict';

  // --- Modal / Dialog ---

  function showModal(options) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'modal';

    var html = '';
    if (options.title) {
      html += '<h3 class="modal-title">' + options.title + '</h3>';
    }
    if (options.content) {
      html += '<div class="modal-body">' + options.content + '</div>';
    }

    html += '<div class="modal-actions">';
    if (options.buttons) {
      options.buttons.forEach(function (btn, i) {
        html += '<button class="btn ' + (btn.class || '') + '" data-btn-index="' + i + '">' + btn.text + '</button>';
      });
    }
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function () {
      overlay.classList.add('active');
    });

    // Button handlers
    var btns = modal.querySelectorAll('[data-btn-index]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-btn-index'), 10);
        var btn = options.buttons[idx];
        closeModal(overlay);
        if (btn.onClick) btn.onClick();
      });
    }

    // Close on overlay click (if dismissible)
    if (options.dismissible !== false) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          closeModal(overlay);
          if (options.onDismiss) options.onDismiss();
        }
      });
    }

    return overlay;
  }

  function closeModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  // --- Toast notifications ---

  function showToast(message, duration) {
    duration = duration || 2000;

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  // --- Confirm dialog ---

  function confirm(title, message, onConfirm, onCancel) {
    showModal({
      title: title,
      content: '<p>' + message + '</p>',
      dismissible: false,
      buttons: [
        { text: '取消', class: 'btn-secondary', onClick: onCancel || function () {} },
        { text: '確定', class: 'btn-danger', onClick: onConfirm }
      ]
    });
  }

  // --- Save dialog ---

  function showSaveDialog(onSave) {
    var Storage = window.ChineseChess.Storage;
    var saves = Storage.listSaves();

    var content = '<div class="save-slots">';
    for (var i = 0; i < Storage.MAX_SLOTS; i++) {
      var save = null;
      for (var j = 0; j < saves.length; j++) {
        if (saves[j].slot === i) { save = saves[j].data; break; }
      }

      content += '<div class="save-slot" data-slot="' + i + '">';
      if (save) {
        var date = new Date(save.timestamp).toLocaleString('zh-HK');
        content += '<div class="save-info">';
        content += '<strong>' + (save.name || '存檔 ' + (i + 1)) + '</strong>';
        content += '<span class="save-date">' + date + '</span>';
        content += '<span class="save-moves">' + (save.moveIndex || 0) + ' 步</span>';
        content += '</div>';
        content += '<div class="save-slot-actions">';
        content += '<span class="save-overwrite">覆蓋</span>';
        content += '<button class="btn-icon delete-save-btn" data-del-slot="' + i + '" title="刪除">✕</button>';
        content += '</div>';
      } else {
        content += '<div class="save-info"><span class="save-empty">空白存檔位</span></div>';
        content += '<span class="save-new">儲存</span>';
      }
      content += '</div>';
    }
    content += '</div>';

    var overlay = showModal({
      title: '儲存棋局',
      content: content,
      dismissible: true,
      buttons: [{ text: '取消', class: 'btn-secondary' }]
    });

    var slots = overlay.querySelectorAll('.save-slot');
    for (var k = 0; k < slots.length; k++) {
      slots[k].addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-save-btn')) return;
        var slot = parseInt(this.getAttribute('data-slot'), 10);
        closeModal(overlay);
        if (onSave) onSave(slot);
      });
    }

    // Delete handlers in save dialog
    var delBtns = overlay.querySelectorAll('.delete-save-btn');
    for (var d = 0; d < delBtns.length; d++) {
      delBtns[d].addEventListener('click', function (e) {
        e.stopPropagation();
        var s = parseInt(this.getAttribute('data-del-slot'), 10);
        confirm('刪除存檔', '確定要刪除此存檔嗎？', function () {
          Storage.deleteGame(s);
          closeModal(overlay);
          showSaveDialog(onSave); // re-open refreshed
        });
      });
    }
  }

  // --- Load dialog ---

  function showLoadDialog(onLoad) {
    var Storage = window.ChineseChess.Storage;
    var saves = Storage.listSaves();
    var autoSave = Storage.loadAutoSave();

    var content = '<div class="save-slots">';

    // Auto-save
    if (autoSave) {
      var aDate = new Date(autoSave.timestamp).toLocaleString('zh-HK');
      content += '<div class="save-slot" data-slot="auto">';
      content += '<div class="save-info">';
      content += '<strong>⟳ 自動存檔</strong>';
      content += '<span class="save-date">' + aDate + '</span>';
      content += '<span class="save-moves">' + (autoSave.moveIndex || 0) + ' 步</span>';
      content += '</div>';
      content += '</div>';
    }

    if (saves.length === 0 && !autoSave) {
      content += '<div class="save-empty-msg">沒有存檔記錄</div>';
    }

    for (var i = 0; i < saves.length; i++) {
      var save = saves[i].data;
      var slot = saves[i].slot;
      var date = new Date(save.timestamp).toLocaleString('zh-HK');
      content += '<div class="save-slot" data-slot="' + slot + '">';
      content += '<div class="save-info">';
      content += '<strong>' + (save.name || '存檔 ' + (slot + 1)) + '</strong>';
      content += '<span class="save-date">' + date + '</span>';
      content += '<span class="save-moves">' + (save.moveIndex || 0) + ' 步</span>';
      content += '</div>';
      content += '<button class="btn-icon delete-save" data-del-slot="' + slot + '" title="刪除">✕</button>';
      content += '</div>';
    }

    content += '</div>';

    var overlay = showModal({
      title: '讀取棋局',
      content: content,
      dismissible: true,
      buttons: [{ text: '返回', class: 'btn-secondary' }]
    });

    // Load handlers
    var slots = overlay.querySelectorAll('.save-slot');
    for (var j = 0; j < slots.length; j++) {
      slots[j].addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-save')) return;
        var s = this.getAttribute('data-slot');
        closeModal(overlay);
        if (onLoad) onLoad(s);
      });
    }

    // Delete handlers
    var delBtns = overlay.querySelectorAll('.delete-save');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener('click', function (e) {
        e.stopPropagation();
        var s = parseInt(this.getAttribute('data-del-slot'), 10);
        confirm('刪除存檔', '確定要刪除此存檔嗎？', function () {
          Storage.deleteGame(s);
          closeModal(overlay);
          showLoadDialog(onLoad); // re-open
        });
      });
    }
  }

  // --- Profile edit dialog ---

  function showProfileDialog(onSave) {
    var Profile = window.ChineseChess.Profile;
    var current = Profile.load();

    var content = '<div class="profile-form">';
    content += '<div class="avatar-section">';
    content += '<div class="avatar-preview" id="avatarPreview">';
    if (current && current.avatar) {
      content += '<img src="' + current.avatar + '" alt="頭像">';
    } else {
      content += '<span class="avatar-placeholder">棋</span>';
    }
    content += '</div>';
    content += '<label class="btn btn-secondary avatar-upload-btn">';
    content += '上傳頭像 <input type="file" id="avatarInput" accept="image/*" hidden>';
    content += '</label>';
    content += '</div>';
    content += '<div class="form-group">';
    content += '<label>暱稱</label>';
    content += '<input type="text" id="nicknameInput" maxlength="12" placeholder="輸入暱稱" value="' + ((current && current.nickname) || '') + '">';
    content += '</div>';
    content += '</div>';

    var overlay = showModal({
      title: current ? '編輯檔案' : '建立玩家檔案',
      content: content,
      dismissible: false,
      buttons: [
        { text: '跳過', class: 'btn-secondary', onClick: function () {
          if (!current) Profile.create();
          if (onSave) onSave();
        }},
        { text: '確定', class: 'btn-primary', onClick: function () {
          var nickname = document.getElementById('nicknameInput').value.trim() || '棋友';
          var avatarData = overlay._avatarData || (current && current.avatar) || null;
          if (current) {
            Profile.update({ nickname: nickname, avatar: avatarData });
          } else {
            Profile.create(nickname, avatarData);
          }
          if (onSave) onSave();
        }}
      ]
    });

    overlay._avatarData = null;

    // Avatar upload handler
    var avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
      avatarInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        Profile.processAvatar(file, function (dataUrl) {
          overlay._avatarData = dataUrl;
          var preview = document.getElementById('avatarPreview');
          if (preview) {
            preview.innerHTML = '<img src="' + dataUrl + '" alt="頭像">';
          }
        });
      });
    }
  }

  // --- Export ---
  window.ChineseChess.UI = {
    showModal: showModal,
    closeModal: closeModal,
    showToast: showToast,
    confirm: confirm,
    showSaveDialog: showSaveDialog,
    showLoadDialog: showLoadDialog,
    showProfileDialog: showProfileDialog
  };
})();
