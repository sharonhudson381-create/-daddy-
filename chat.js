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
    '\u{1F60A}', '\u{1F604}', '\u{1F970}', '\u{1F60D}', '\u{1F917}',
    '\u{1F60C}', '\u{1F633}', '\u{1F97A}', '\u{1F622}', '\u{1F62D}',
    '\u{1F648}', '\u{1F634}', '\u{1F914}', '\u{1F605}', '\u{1F606}',
    '\u{1F643}', '\u{1F618}', '\u{1F61A}', '\u{1F92D}', '\u{1F636}',
    '\u{1F971}', '\u{1F62A}', '\u{1FAF6}', '\u{1F91D}', '\u{1F44B}',
    '\u{1F44D}', '\u{1F64F}', '\u{1F4AA}', '\u{2728}', '\u{1F380}'
  ];

  EM['心情'] = [
    '\u{2764}\u{FE0F}', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}', '\u{1F499}',
    '\u{1F49C}', '\u{1F90D}', '\u{1F5A4}', '\u{1F494}', '\u{1F495}',
    '\u{1F49E}', '\u{1F497}', '\u{1F493}', '\u{1F496}', '\u{1F498}',
    '\u{1F49D}', '\u{2B50}', '\u{1F31F}', '\u{1F4AB}', '\u{1F525}',
    '\u{1F308}', '\u{2600}\u{FE0F}', '\u{26C5}', '\u{1F319}', '\u{2744}\u{FE0F}',
    '\u{1F338}', '\u{1F33C}', '\u{1F337}', '\u{1F340}', '\u{1F33F}'
  ];

  EM['生活'] = [
    '\u{1F35A}', '\u{1F35C}', '\u{1F372}', '\u{1F371}', '\u{1F359}',
    '\u{1F35E}', '\u{1F950}', '\u{1F370}', '\u{1F9C1}', '\u{1F36E}',
    '\u{1F353}', '\u{1F351}', '\u{1F347}', '\u{1F349}', '\u{1F34A}',
    '\u{1F34C}', '\u{2615}', '\u{1F375}', '\u{1F9CB}', '\u{1F95B}',
    '\u{1F37A}', '\u{1F377}', '\u{1F382}', '\u{1F36B}', '\u{1F36C}',
    '\u{1F36D}', '\u{1F95F}', '\u{1F364}', '\u{1F357}', '\u{1F957}'
  ];

  EM['日常'] = [
    '\u{1F3E0}', '\u{1F6CF}\u{FE0F}', '\u{1F6BF}', '\u{1F9F8}', '\u{1F4DA}',
    '\u{270F}\u{FE0F}', '\u{1F4BB}', '\u{1F4F1}', '\u{1F3A7}', '\u{1F3B5}',
    '\u{1F3AC}', '\u{1F4F7}', '\u{1F697}', '\u{2708}\u{FE0F}', '\u{1F30F}',
    '\u{1F3D6}\u{FE0F}', '\u{26F0}\u{FE0F}', '\u{1F388}', '\u{1F381}', '\u{1F389}',
    '\u{1F550}', '\u{1F4A4}', '\u{1F6B6}', '\u{1F3C3}', '\u{1F48A}',
    '\u{1FA79}', '\u{1F9F9}', '\u{1F6D2}', '\u{1F4B0}', '\u{1F4DD}'
  ];

  EM['动物'] = [
    '\u{1F436}', '\u{1F431}', '\u{1F430}', '\u{1F439}', '\u{1F43B}',
    '\u{1F43C}', '\u{1F428}', '\u{1F42F}', '\u{1F98A}', '\u{1F437}',
    '\u{1F42E}', '\u{1F438}', '\u{1F414}', '\u{1F427}', '\u{1F426}',
    '\u{1F986}', '\u{1F989}', '\u{1F41D}', '\u{1F98B}', '\u{1F40C}',
    '\u{1F433}', '\u{1F42C}', '\u{1F41F}', '\u{1F419}', '\u{1F996}',
    '\u{1F994}', '\u{1F43F}\u{FE0F}', '\u{1F43E}', '\u{1F335}', '\u{1F342}'
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
    var list = EM[PACK_NAMES[packIndex]];
    list.forEach(function (e) {
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
    if (start === null || start === undefined) start = input.value.length;
    if (end === null || end === undefined) end = input.value.length;
    input.value = input.value.slice(0, start) + t + input.value.slice(end);
    var pos = start + t.length;
    input.setSelectionRange(pos, pos);
    input.focus();
    autoGrow();
    refreshSendBtn();
  }

  function isEmojiOnly(s) {
    var stripped = s.replace(/\s/g, '');
    if (!stripped) return false;
    if (Array.from(stripped).length > 4) return false;
    return !/[0-9A-Za-z一-龥]/.test(stripped);
  }

  function timeLabel() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var hh = h < 10 ? '0' + h : '' + h;
    var mm = m < 10 ? '0' + m : '' + m;
    return hh + ':' + mm;
  }function bubble(role, text, note) {
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
      e.innerHTML = '<span class="big">\u{1F3E0}</span>这里只有我们两个<br>说点什么吧';
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
    box.innerHTML = '<i></i><i></i><i></i>';
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
      // 存储满了就跳过，不影响聊天
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
        showNote('口令不对，刷新页面重新输入');
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
      showNote('出错了：' + reason);
    }).catch(function () {
      removeTyping();
      history.pop();
      save();
      render();
      showNote('网络出错了，检查连接后重试');
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
    if (!confirm('清空所有聊天记录？清空后无法恢复。')) return;
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


