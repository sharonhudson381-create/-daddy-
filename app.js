const express = require('express');
const app = express();

// 关键配置，放大JSON接收上限至10MB
app.use(express.json({ limit: '10mb' }));

// 下面你原本的静态托管、接口路由保持原样
app.use(express.static(__dirname));
app.post('/api/chat', require('./api/chat'));
// ...其余代码不动
function localBackup() {
  try {
    var raw = localStorage.getItem('chat_history');
    if (!raw) return [];
    var a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch (e) {
    return [];
  }
}

function saveLocal() {
  try {
    localStorage.setItem('chat_history', JSON.stringify(msgs));
  } catch (e) {
    return;
  }
}

function saveRemote() {
  if (!accessPassword) return;
  fetch('/api/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-password': accessPassword
    },
    body: JSON.stringify({ messages: msgs })
  }).catch(function () {
    return;
  });
}

function save() {
  saveLocal();
  saveRemote();
}

function loadRemote() {
  var pwd = ensurePassword();
  if (!pwd) {
    msgs = localBackup();
    loaded = true;
    render();
    refreshSendBtn();
    return;
  }

  showLoading();

  fetch('/api/history', {
    method: 'GET',
    headers: { 'x-access-password': pwd }
  }).then(function (res) {
    return res.json().then(function (d) {
      return { status: res.status, data: d };
    });
  }).then(function (r) {
    loaded = true;
    if (r.status === 401) {
      localStorage.removeItem('access_password');
      accessPassword = '';
      msgs = [];
      render();
      showNote('口令不对，刷新页面重新输入');
      refreshSendBtn();
      return;
    }
    var remote = (r.data && r.data.messages) || [];
    var local = localBackup();
    if (remote.length >= local.length) {
      msgs = remote;
    } else {
      msgs = local;
      saveRemote();
    }
    saveLocal();
    render();
    refreshSendBtn();
  }).catch(function () {
    loaded = true;
    msgs = localBackup();
    render();
    showNote('云端读取失败，暂时用本地记录');
    refreshSendBtn();
  });
}

function send() {
  if (sending || !loaded) return;

  var text = input.value.trim();
  // 无文字但有图片也允许发送
  if (!text && !selectedImageBase64) return;

  var pwd = ensurePassword();
  if (!pwd) return;

  sending = true;
  // 存入消息对象，附带图片base64
  msgs.push({
    role: 'user',
    content: text,
    image: selectedImageBase64
  });

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
    body: JSON.stringify({ messages: msgs })
  }).then(function (res) {
    return res.json().then(function (d) {
      return { status: res.status, data: d };
    });
  }).then(function (r) {
    removeTyping();

    if (r.status === 401) {
      localStorage.removeItem('access_password');
      accessPassword = '';
      msgs.pop();
      render();
      showNote('口令不对，刷新页面重新输入');
      return;
    }

    var d = r.data;
    if (d && d.content && d.content[0] && d.content[0].text) {
      msgs.push({ role: 'assistant', content: d.content[0].text });
      save();
      render();
      return;
    }

    var why;
    if (d && d.error) {
      why = typeof d.error === 'string' ? d.error : JSON.stringify(d.error);
    } else {
      why = JSON.stringify(d).slice(0, 300);
    }
    msgs.pop();
    save();
    render();
    showNote('出错了：' + why);
  }).catch(function () {
    removeTyping();
    msgs.pop();
    save();
    render();
    showNote('网络出错了，检查连接后重试');
  }).then(function () {
    sending = false;
    // 发送结束清空已选图片与预览
    selectedImageBase64 = null;
    imgPreviewWrap.style.display = 'none';
    imgFileInput.value = '';
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
  if (msgs.length === 0) return;
  if (!confirm('清空所有聊天记录？云端和本地都会删除，无法恢复。')) return;
  msgs = [];
  saveLocal();
  if (accessPassword) {
    fetch('/api/history', {
      method: 'DELETE',
      headers: { 'x-access-password': accessPassword }
    }).catch(function () {
      return;
    });
  }
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
loadRemote();
