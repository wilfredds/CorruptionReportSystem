let troubleshootingData = [];

async function loadTroubleshooting() {
  try {
    const res = await fetch('assets/data/troubleshooting.json');
    troubleshootingData = await res.json();
  } catch (_) { troubleshootingData = []; }
}

function findResponse(input) {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;
  for (const item of troubleshootingData) {
    if (item.keywords.some(kw => lower.includes(kw.toLowerCase()))) return item;
  }
  return null;
}

function addMessage(text, type) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing-indicator';
  div.id = 'typing-indicator';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function addBotResponse(item) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';

  const title = document.createElement('strong');
  title.textContent = item.title;
  div.appendChild(title);
  div.appendChild(document.createElement('br'));

  const resp = document.createElement('span');
  resp.textContent = item.response;
  div.appendChild(resp);
  div.appendChild(document.createElement('br'));

  const ul = document.createElement('ul');
  ul.style.cssText = 'margin:8px 0 0 12px;font-size:0.75rem;';
  (item.steps || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    ul.appendChild(li);
  });
  div.appendChild(ul);

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function handleSend() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage(text, 'user');
  showTyping();
  setTimeout(() => {
    removeTyping();
    const match = findResponse(text);
    if (match) {
      addBotResponse(match);
    } else {
      addMessage("I don't have a specific answer for that yet. Try keywords like: 'squeaky brakes', 'flat tire', 'gear slipping', 'chain fell off', 'creaking', 'tire pressure', or 'saddle pain'.", 'bot');
    }
  }, 900);
}

function toggleChat() {
  const win = document.getElementById('chatWindow');
  win.classList.toggle('active');
  if (win.classList.contains('active') && troubleshootingData.length === 0) loadTroubleshooting();
}

// Expose globals for inline handlers
window.handleSend   = handleSend;
window.toggleChat   = toggleChat;

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');
  if (input) input.addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });
});

loadTroubleshooting();
