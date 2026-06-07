/* chatbot.js — gắn sau api.js */
document.addEventListener('DOMContentLoaded', () => {
  const toggle  = document.getElementById('chatbotToggle');
  const win     = document.getElementById('chatbotWindow');
  const closeBtn= document.getElementById('chatbotClose');
  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const msgs    = document.getElementById('chatMessages');
  if (!toggle) return;

  toggle.addEventListener('click', () => win.classList.toggle('open'));
  closeBtn.addEventListener('click', () => win.classList.remove('open'));

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    appendMsg(text, 'user');
    input.value = '';

    const typing = appendMsg('...', 'bot');
    try {
      const data = await api.post('/chatbot/message', { message: text });
      typing.textContent = data.reply;
    } catch {
      typing.textContent = 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!';
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function appendMsg(text, role) {
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
});
