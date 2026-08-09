  var chatBox = document.getElementById('chat-box');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('send-btn');
  var emojiBtn = document.getElementById('emoji-btn');
  var clearBtn = document.getElementById('clear-btn');
  var panel = document.getElementById('panel');
  var tabsEl = document.getElementById('tabs');
  var gridEl = document.getElementById('grid');

  var EM = {};

  EM['常用'] = [
    '😊', '😄', '🥰', '😍', '🤗',
    '😌', '😳🥺', '😢', '😭',
    '🙈', '😴', '🤔', '😅', '😆',
    '🙃', '😘', '😚', '🤭😶',
    '🥱', '😪', '🫶', '🤝', '👋',
    '👍', '🙏', '💪', '✨', '🎀'
  ];

  EM['心情'] = [
    '❤️ ', '🧡', '💛', '💚', '💙',
    '💜', '🤍', '🖤', '💔', '💕',
    '💞', '💗', '💓', '💖', '💘',
    '💝', '⭐', '🌟', '💫', '🔥',
    '🌈', '☀️ ', '⛅', '🌙', '❄️ ',
    '🌸', '🌼', '🌷', '🍀', '🌿'
  ];

  EM['生活'] = [
    '🍚', '🍜', '🍲', '🍱', '🍙',
    '🍞', '🥐', '🍰', '🧁', '🍮',
    '🍓', '🍑', '🍇', '🍉', '🍊',
    '🍌', '☕', '🍵', '🧋', '🥛',
    '🍺', '🍷', '🎂', '🍫', '🍬',
    '🍭', '🥟', '🍤', '🍗', '🥗'
  ];

  EM['日常'] = [
    '🏠', '🛏️ ', '🚿', '🧸', '📚',
    '✏️ ', '💻', '📱', '🎧', '🎵',
    '🎬', '📷', '🚗', '✈️ ', '🌏',
    '🏖️ ', '⛰️ ', '🎈', '🎁', '🎉',
    '🕐', '💤', '🚶', '🏃', '💊',
    '🩹', '🧹', '🛒', '💰', '📝'
  ];

  EM['动物'] = [
    '🐶', '🐱', '🐰', '🐹', '🐻',
    '🐼', '🐨', '🐯', '🦊', '🐷',
    '🐮', '🐸', '🐔', '🐧', '🐦',
    '🦆', '🦉', '🐝', '🦋', '🐌',
    '🐳', '🐬', '🐟', '🐙', '🦖',
    '🦔', '🐿️ ', '🐾', '🌵', '🍂'
  ];

  var PACK_NAMES = ['常用', '心情', '生活', '日常', '动物'];
  var packIndex = 0;

  var history = [];
  try {
    history = JSON.parse(localStorage.getItem('chat_history') || '[]');
    if (!Array.isArray(history)) history = [];
  } catch (e) {
    history = [];
  }

  var accessPassword = localStorage.getItem('access_password') || '';
  var sending = false;

  function buildTabs() {
    tabsEl.innerHTML = '';
    PACK_NAMES.forEach(function (name, i) {
      var b = document.createElement('button');
      b.className = 'tab' + (i === packIndex ? ' on' : '');
      b.textContent = name;
      b.addEventListener('click', function () {
        packIndex = i;
        buildTabs();
        buildGrid();
      });
      tabsEl.appendChild(b);
    });
  }

  function buildGrid() {
    gridEl.innerHTML = '';
    EM[PACK_NAMES[packIndex].forEach(function (e) {
      var b = document.createElement('button');
      b.className = 'em';
      b.textContent = e;
      b.addEventListener('click', function () {
        insertText(e);
      });
      gridEl.appendChild(b);
    });
  }

  function insertText(t) {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    if (start === null) start = input.value.length;
    if (end === null) end = input.value.length;
    input.value = input.value.slice(0, start) + t + input.value.slice(end);
    var pos = start + t.length;
    input.setSelectionRange(pos, pos);
    input.focus();
    autoGrow();
    refreshSendBtn();
  }

  function isEmojiOnly(s) {
    var stripped = s.replace(/\s/g, ');
    if (!striped) return false;
    if (Array.from(stripped).length > 4) return false;
    return !/[0-9A-Za-z\u4e00-\u9fa5]/.test(striped);
  }

  function timeLabel() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var h = h < 10 ? '0' + h : ' + h;
    var m = m < 10 ? '0' + m : ' + m;
    return h + ':' + mm;
  }

  function bubble(role, text, note) {
    var row = document.createElement('div');
    var cls = 'row ';
    if (note) {
      cls += 'note';
    } else if (role === 'user') {
      cls += 'user';
    } else {
      cls += 'ai';
    }
    row.className = cls;

    var msg = document.createElement('div');
    msg.className = 'msg';
    if (!note && isEmojiOnly(text) {
      msg.className = 'msg emoji-only';
    }
    msg.textContent = text;
    row.appendChild(msg);

    if (!note) {
      var t = document.createElement('div');
      t.className = 'time';
      t.textContent = timeLabel();
      row.appendChild(t);
    }

    chatBox.appendChild(row);
    return row;
  }

  function scrollDown() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function render() {
    chatBox.innerHTML = '';
    if (history.length === 0) {
      var e = document.createElement('div');
      e.id = 'empty';
      e.innerHTML = '<span class="big">🏠</span>这里只有我们两个<br>说点什么吧';
      chatBox.appendChild(e);
      return;
    }
    history.forEach(function (m) {
      buble(m.role, m.content, false);
    });
    scrollDown();
  }

  function showNote(text) {
    bubble('assistant', text, true);
    scrollDown();
  }

  function addTyping() {
    var row = document.createElement('div');
    row.className = 'row ai';
    row.id = 'typing-row';
    var box = document.createElement('div');
    box.className = 'typing';
    box.innerHTML = '<i></i><i></i>';
    row.appendChild(box);
    chatBox.appendChild(row);
    scrollDown();
  }

  function removeTyping() {
    var r = document.getElementById('typing-row');
    if (r) r.remove();
  }

  function ensurePassword() {
    if (!accessPassword) {
      var entered = prompt('请输入口令');
      accessPassword = entered ? entered.trim() : '';
      if (accessPassword) {
        localStorage.setItem('access_password', accessPassword);
      }
    }
    return accessPassword;
  }

  function save() {
    try {
      localStorage.setItem('chat_history', JSON.stringify(history));
    } catch (e) {
      // 存储满了就跳过,不影响聊天
    }
  }

  function autoGrow() {
    input.style.height = 'auto';
    var h = input.scrollHeight;
    if (h > 120) h = 120;
    input.style.height = h + 'px';
  }

  function refreshSendBtn() {
    sendBtn.disabled = sending || input.value.trim() === '';
  }

  function send() {
    if (sending) return;

    var text = input.value.trim();
    if (!text) return;

    var pwd = ensurePassword();
    if (!pwd) return;

    sending = true;
    history.push({ role: 'user', content: text });
    input.value = '';
    autoGrow();
    refreshSendBtn();
    panel.classList.remove('open');
    emojiBtn.classList.remove('on');
    render();
    addTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-password': pwd
      },
      body: JSON.stringify({ messages: history })
    }).then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, data: data };
      });
    }).then(function (r) {
      removeTyping();

      if (r.status === 401) {
        localStorage.removeItem('access_password');
        accessPassword = '';
        history.pop();
        render();
        showNote('口令不对,刷新页面重新输入');
        return;
      }

      var data = r.data;
      if (data && data.content && data.content[0] && data.content[0].text) {
        history.push({ role: 'assistant', content: data.content[0].text });
        save();
        render();
        return;
      }

      var reason;
      if (data && data.error) {
        if (typeof data.error === 'string') {
          reason = data.error;
        } else {
          reason = JSON.stringify(data.error);
        }
      } else {
        reason = JSON.stringify(data).slice(0, 300);
      }
      history.pop();
      save();
      render();
      showNote('出错了: ' + reason);
    }).catch(function () {
      removeTyping();
      history.pop();
      save();
      render();
      showNote('网络出错了,检查连接后重试');
    }).then(function () {
      sending = false;
      refreshSendBtn();
    });
  }

  sendBtn.addEventListener('click', send);

  emojiBtn.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    if (open) {
      emojiBtn.classList.add('on');
      setTimeout(scrollDown, 280);
    } else {
      emojiBtn.classList.remove('on');
    }
  });

  clearBtn.addEventListener('click', function () {
    if (history.length === 0) return;
    if (!confirm('清空所有聊天记录? 清空后无法恢复。')) return;
    history = [];
    save();
    render();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  input.addEventListener('input', function () {
    autoGrow();
    refreshSendBtn();
  });

  input.addEventListener('focus', function () {
    setTimeout(scrollDown, 300);
  });

  buildTabs();
  buildGrid();
  render();
  refreshSendBtn();
