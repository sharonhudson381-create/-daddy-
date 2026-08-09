var chatBox = document.getElementById('chat-box');
var input = document.getElementById('input');
var sendBtn = document.getElementById('send-btn');
var emojiBtn = document.getElementById('emoji-btn');
var clearBtn = document.getElementById('clear-btn');
var panel = document.getElementById('panel');
var tabsEl = document.getElementById('tabs');
var gridEl = document.getElementById('grid');

// 图片上传相关DOM
var imgUploadBtn = document.getElementById('img-upload-btn');
var imgFileInput = document.getElementById('img-file-input');
var imgPreviewWrap = document.getElementById('img-preview-wrap');
var previewImg = document.getElementById('preview-img');
var cancelImgBtn = document.getElementById('cancel-img');

var msgs = [];
var accessPassword = localStorage.getItem('access_password') || '';
var sending = false;
var loaded = false;
var packIndex = 0;

// 全局缓存选中图片base64
let selectedImageBase64 = null;

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

function bubble(role, text, note, imgSrc = null) {
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

  // 用户发送的图片在气泡内展示
  if (imgSrc) {
    var imgDom = document.createElement('img');
    imgDom.src = imgSrc;
    imgDom.style.maxWidth = '220px';
    imgDom.style.borderRadius = '6px';
    imgDom.style.marginTop = '6px';
    row.appendChild(imgDom);
  }

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
    bubble(m.role, m.content, false, m.image);
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
  if (h > 160) h = 160;
  input.style.height = h + 'px';
}

function refreshSendBtn() {
  // 有图片也允许空文字发送
  sendBtn.disabled = sending || !loaded || (input.value.trim() === '' && !selectedImageBase64);
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

// ====================== 图片上传核心绑定逻辑 ======================
// 点击上传按钮唤起文件选择
if (imgUploadBtn) {
  imgUploadBtn.addEventListener('click', () => {
    imgFileInput.click();
  });

  // 选中图片，转base64并预览
  imgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    // 限制图片最大8MB
    if (file.size > 8 * 1024 * 1024) {
      alert('图片不能超过8MB');
      imgFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
      selectedImageBase64 = ev.target.result;
      previewImg.src = selectedImageBase64;
      imgPreviewWrap.style.display = 'block';
      refreshSendBtn();
    };
    reader.readAsDataURL(file);
  });

  // 取消选中图片
  cancelImgBtn.addEventListener('click', () => {
    selectedImageBase64 = null;
    imgPreviewWrap.style.display = 'none';
    imgFileInput.value = '';
    refreshSendBtn();
  });
}

// 绑定输入框实时刷新发送按钮状态
input.addEventListener('input', refreshSendBtn);

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
  // 无文字也可以发图片
  if (!text && !selectedImageBase64) return;

  var pwd = ensurePassword();
  if (!pwd) return;

  sending = true;
  // 存入消息，带上图片
  msgs.push({
    role: 'user',
    content: text,
    image: selectedImageBase64
  });

  // 清空输入框、预览图片
  input.value = '';
  autoGrow();
  refreshSendBtn();
  panel.classList.remove('open');
  emojiBtn.classList.remove('on');
  render();
  addTyping();

  // 请求后端携带完整消息列表
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
    // 发送完毕清空已选图片
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

input.addEventListener('focus', function () {
  setTimeout(scrollDown, 300);
});

buildTabs();
buildGrid();
loadRemote();
