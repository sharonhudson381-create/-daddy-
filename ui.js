var chatBox = document.getElementById('chat-box');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('send-btn');
  var emojiBtn = document.getElementById('emoji-btn');
  var clearBtn = document.getElementById('clear-btn');
  var panel = document.getElementById('panel');
  var tabsEl = document.getElementById('tabs');
  var gridEl = document.getElementById('grid');

  var msgs = [];
  var accessPassword = localStorage.getItem('access_password') || '';
  var sending = false;
  var loaded = false;
  var packIndex = 0;

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
    EM[PACK_NAMES[packIndex]].forEach(function (e) {
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
    var s = input.selectionStart;
    var e = input.selectionEnd;
    if (s === null || s === undefined) s = input.value.length;
    if (e === null || e === undefined) e = input.value.length;
    input.value = input.value.slice(0, s) + t + input.value.slice(e);
    input.setSelectionRange(s + t.length, s + t.length);
    input.focus();
    autoGrow();
    refreshSendBtn();
  }

  function isEmojiOnly(s) {
    var t = s.replace(/\s/g, '');
    if (!t) return false;
    if (Array.from(t).length > 4) return false;
    return !/[0-9A-Za-z一-龥]/.test(t);
  }

  function timeLabel() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function bubble(role, text, note) {
    var row = document.createElement('div');
    if (note) {
      row.className = 'row note';
    } else if (role === 'user') {
      row.className = 'row user';
    } else {
      row.className = 'row ai';
    }
  
    var msg = document.createElement('div');
    if (!note && isEmojiOnly(text)) {
      msg.className = 'msg emoji-only';
    } else {
      msg.className = 'msg';
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
  }

  function scrollDown() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function render() {
    chatBox.innerHTML = '';
    if (msgs.length === 0) {
      var e = document.createElement('div');
      e.id = 'empty';
      e.innerHTML = '<span class="big">\u{1F3E0}</span>这里只有我们两个<br>说点什么吧';
      chatBox.appendChild(e);
      return;
    }
    msgs.forEach(function (m) {
      bubble(m.role, m.content, false);
    });
    scrollDown();
  }

  function showNote(text) {
    bubble('assistant', text, true);
    scrollDown();
  }

  function showLoading() {
    chatBox.innerHTML = '';
    var d = document.createElement('div');
    d.id = 'empty';
    d.textContent = '正在取回我们的记录...';
    chatBox.appendChild(d);
  }

  function addTyping() {
    var row = document.createElement('div');
    row.className = 'row ai';
    row.id = 'typing-row';
    var box = document.createElement('div');
    box.className = 'typing';
    box.innerHTML = '<i></i><i></i><i></i>';
    row.appendChild(box);
    chatBox.appendChild(row);
    scrollDown();
  }

  function removeTyping() {
    var r = document.getElementById('typing-row');
    if (r) r.remove();
  }

  function autoGrow() {
    input.style.height = 'auto';
    var h = input.scrollHeight;
    if (h > 120) h = 120;
    input.style.height = h + 'px';
  }

  function refreshSendBtn() {
    sendBtn.disabled = sending || !loaded || input.value.trim() === '';
  }

  function ensurePassword() {
    if (!accessPassword) {
      var v = prompt('请输入口令');
      accessPassword = v ? v.trim() : '';
      if (accessPassword) {
        localStorage.setItem('access_password', accessPassword);
      }
    }
    return accessPassword;
  }
