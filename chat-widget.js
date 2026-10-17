(function () {
  const EDGE_URL = 'https://nusuluxjeckjcdgxzgyf.supabase.co/functions/v1/ficti-chat';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c3VsdXhqZWNramNkZ3h6Z3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzI2NDcsImV4cCI6MjA3NDE0ODY0N30.sb_publishable_i8jwxXfkwQKCApZOCFu8SA_JrwICvqK';

  // --- Inject styles ---
  const style = document.createElement('style');
  style.textContent = `
    #ficti-chat-panel {
      position: fixed; bottom: 104px; right: 24px; width: 360px; max-height: 520px;
      background: #141414; border: 1px solid rgba(139,24,24,0.35);
      border-radius: 4px; display: flex; flex-direction: column;
      z-index: 2147483646; font-family: 'Montserrat', sans-serif;
      box-shadow: 0 12px 48px rgba(0,0,0,0.6);
      transform: translateY(12px) scale(0.97); opacity: 0;
      pointer-events: none; transition: opacity .22s ease, transform .22s ease;
    }
    #ficti-chat-panel.open {
      opacity: 1; transform: translateY(0) scale(1); pointer-events: all;
    }
    #ficti-chat-header {
      padding: 16px 18px; border-bottom: 1px solid rgba(245,234,208,0.08);
      display: flex; align-items: center; justify-content: space-between;
    }
    #ficti-chat-header .brand {
      font-family: 'Cormorant SC', serif; font-size: 13px; letter-spacing: 0.28em;
      color: #F5EAD0; font-weight: 500;
    }
    #ficti-chat-header .sub {
      font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(245,234,208,0.38); margin-top: 2px;
    }
    #ficti-chat-close {
      background: none; border: none; color: rgba(245,234,208,0.35);
      cursor: pointer; font-size: 20px; line-height: 1; padding: 0;
      transition: color .15s;
    }
    #ficti-chat-close:hover { color: #F5EAD0; }
    #ficti-chat-messages {
      flex: 1; overflow-y: auto; padding: 18px; display: flex;
      flex-direction: column; gap: 12px; min-height: 240px; max-height: 340px;
    }
    #ficti-chat-messages::-webkit-scrollbar { width: 3px; }
    #ficti-chat-messages::-webkit-scrollbar-track { background: transparent; }
    #ficti-chat-messages::-webkit-scrollbar-thumb { background: rgba(139,24,24,0.4); border-radius: 2px; }
    .ficti-msg {
      max-width: 85%; line-height: 1.6; font-size: 12px; font-weight: 300;
      padding: 10px 13px; border-radius: 3px; animation: msgIn .18s ease;
    }
    @keyframes msgIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
    .ficti-msg.bot {
      background: rgba(245,234,208,0.06); color: rgba(245,234,208,0.85);
      border-left: 2px solid rgba(139,24,24,0.5); align-self: flex-start;
    }
    .ficti-msg.user {
      background: rgba(139,24,24,0.22); color: #F5EAD0;
      align-self: flex-end; border-right: 2px solid rgba(139,24,24,0.6);
    }
    .ficti-msg.typing span {
      display: inline-block; width: 5px; height: 5px; border-radius: 50%;
      background: rgba(245,234,208,0.4); margin: 0 2px;
      animation: dot .9s infinite;
    }
    .ficti-msg.typing span:nth-child(2) { animation-delay: .18s; }
    .ficti-msg.typing span:nth-child(3) { animation-delay: .36s; }
    @keyframes dot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
    #ficti-chat-footer {
      padding: 12px 14px; border-top: 1px solid rgba(245,234,208,0.08);
      display: flex; gap: 8px; align-items: center;
    }
    #ficti-chat-input {
      flex: 1; background: rgba(245,234,208,0.05); border: 1px solid rgba(245,234,208,0.12);
      border-radius: 2px; padding: 9px 12px; color: #F5EAD0; font-size: 12px;
      font-family: 'Montserrat', sans-serif; font-weight: 300; outline: none;
      transition: border-color .15s; resize: none; height: 38px; line-height: 1.4;
    }
    #ficti-chat-input::placeholder { color: rgba(245,234,208,0.25); }
    #ficti-chat-input:focus { border-color: rgba(139,24,24,0.5); }
    #ficti-chat-send {
      background: #8B1818; border: none; color: #F5EAD0; width: 38px; height: 38px;
      border-radius: 2px; cursor: pointer; display: flex; align-items: center;
      justify-content: center; transition: background .15s; flex-shrink: 0;
    }
    #ficti-chat-send:hover { background: #6B1212; }
    #ficti-chat-send svg { width: 14px; height: 14px; fill: #F5EAD0; }
    #ficti-stamp {
      position: fixed; bottom: 24px; right: 24px; width: 70px; height: 70px;
      background: none; border: none; padding: 0; cursor: pointer;
      z-index: 2147483647; transition: transform .18s ease, filter .18s ease;
      filter: drop-shadow(0 3px 10px rgba(0,0,0,.35));
    }
    #ficti-stamp:hover { transform: scale(1.1); filter: drop-shadow(0 5px 16px rgba(139,24,24,.5)); }
    #ficti-stamp:active { transform: scale(0.93); }
    #ficti-stamp img { width: 70px; height: 70px; object-fit: contain; display: block; pointer-events: none; }
    @media (max-width: 440px) {
      #ficti-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 100px; }
    }
  `;
  document.head.appendChild(style);

  // --- Build HTML ---
  const sealSrc = (function () {
    const existing = document.querySelector('img[src*="stamp-seal"]');
    return existing ? existing.src : 'stamp-seal.png';
  })();

  const panel = document.createElement('div');
  panel.id = 'ficti-chat-panel';
  panel.innerHTML = `
    <div id="ficti-chat-header">
      <div>
        <div class="brand">Ficti Garments</div>
        <div class="sub">Ask us anything</div>
      </div>
      <button id="ficti-chat-close" aria-label="Close chat">×</button>
    </div>
    <div id="ficti-chat-messages"></div>
    <div id="ficti-chat-footer">
      <input id="ficti-chat-input" type="text" placeholder="Your question…" autocomplete="off" maxlength="500">
      <button id="ficti-chat-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  const stamp = document.createElement('button');
  stamp.id = 'ficti-stamp';
  stamp.setAttribute('aria-label', 'Chat with Ficti');
  stamp.innerHTML = `<img src="${sealSrc}" alt="Ficti">`;
  document.body.appendChild(stamp);

  // --- State ---
  const messages = [];
  let isOpen = false;
  let isLoading = false;

  const msgContainer = document.getElementById('ficti-chat-messages');

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `ficti-msg ${role === 'assistant' ? 'bot' : 'user'}`;
    el.textContent = text;
    msgContainer.appendChild(el);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'ficti-msg bot typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgContainer.appendChild(el);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return el;
  }

  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen && messages.length === 0) {
      // Greeting
      setTimeout(() => {
        addMessage('assistant', 'Welcome to Ficti Garments. I can tell you about our collections, membership, or the brand. What would you like to know?');
      }, 180);
    }
    if (isOpen) document.getElementById('ficti-chat-input').focus();
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('ficti-chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    messages.push({ role: 'user', content: text });

    isLoading = true;
    const typing = showTyping();

    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ messages })
      });

      typing.remove();

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const reply = data.reply || 'I apologize — something went wrong. Please try again.';
      messages.push({ role: 'assistant', content: reply });
      addMessage('assistant', reply);
    } catch (e) {
      typing.remove();
      addMessage('assistant', 'Something went wrong on our end. Please try again in a moment.');
    }

    isLoading = false;
  }

  // --- Events ---
  stamp.addEventListener('click', togglePanel);
  document.getElementById('ficti-chat-close').addEventListener('click', togglePanel);
  document.getElementById('ficti-chat-send').addEventListener('click', sendMessage);
  document.getElementById('ficti-chat-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();
