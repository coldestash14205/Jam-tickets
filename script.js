(function() {
  // ================================================================
  // 🌗 DARK MODE TOGGLE
  // ================================================================
  const STORAGE_KEY = 'jamradio-theme';
  const toggleBtn   = document.getElementById('themeToggle');
  const themeIcon   = toggleBtn ? toggleBtn.querySelector('.theme-icon') : null;

  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (toggleBtn) {
      toggleBtn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  applyTheme(getInitialTheme());

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // ================================================================
  // 🔧 EMAILJS CONFIGURATION
  // ================================================================
  const EMAILJS_PUBLIC_KEY   = 'hVbQzJWk1E-jBKsmp';              // Account → General
  const EMAILJS_SERVICE_ID   = 'service_6bjunwh';                // Email Services
  const TEMPLATE_SUPPORT_ID  = 'template_wyvpvhh';               // Support template
  const TEMPLATE_CUSTOMER_ID = 'template_k3ii5tq';               // Customer template
  const SUPPORT_EMAIL        = 'jam.radio.support@gmail.com';

  // 👇 Paste your tawk.to Direct Chat Link here
  //    Find it at: tawk.to dashboard → Administration → Chat Widget → Direct Chat Link
  const TAWKTO_CHAT_LINK     = 'https://tawk.to/chat/6abb85dfb7a575344fce762b/1k3m85sfb?layout=modern';
  // ================================================================

  // Initialise EmailJS (with guard in case the SDK failed to load)
  if (typeof emailjs === 'undefined') {
    console.error('❌ EmailJS SDK failed to load. Check the <script> tag in index.html.');
  } else {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log('✅ EmailJS initialised');
  }

  const form          = document.getElementById('ticketForm');
  const emailInput    = document.getElementById('email');
  const subjectInput  = document.getElementById('subject');
  const messageInput  = document.getElementById('message');
  const statusMessage = document.getElementById('statusMessage');
  const statusText    = document.getElementById('statusText');
  const submitBtn     = document.getElementById('submitBtn');
  const resetBtn      = document.getElementById('resetBtn');

  // ---------- Utilities ----------
  function generateTicketId() {
    const ts  = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JR-${ts}-${rnd}`;
  }

  function showStatus(text, isError = false) {
    statusText.textContent = text;
    statusMessage.classList.add('show');
    const icon = statusMessage.querySelector('i');
    if (isError) {
      statusMessage.classList.add('error');
      if (icon) icon.textContent = '⚠️';
    } else {
      statusMessage.classList.remove('error');
      if (icon) icon.textContent = '✅';
    }
    clearTimeout(window.statusTimeout);
    window.statusTimeout = setTimeout(
      () => statusMessage.classList.remove('show'),
      8000
    );
  }

  function hideStatus() {
    statusMessage.classList.remove('show', 'error');
    clearTimeout(window.statusTimeout);
  }

  // ---------- Submit ----------
  async function handleSubmit(event) {
    event.preventDefault();

    const email   = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    if (!email || !subject || !message) {
      showStatus('Please fill in all required fields.', true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('Please enter a valid email address.', true);
      return;
    }

    // Guard: make sure EmailJS is loaded before trying to send
    if (typeof emailjs === 'undefined') {
      showStatus('Email service unavailable. Please refresh the page.', true);
      return;
    }

    submitBtn.disabled = true;
    hideStatus();

    const ticketId    = generateTicketId();
    const submittedAt = new Date().toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const templateParams = {
      ticket_id:     ticketId,
      from_email:    email,
      to_email:      email,
      reply_to:      email,
      subject:       subject,
      message:       message,
      chat_link:     TAWKTO_CHAT_LINK,
      submitted_at:  submittedAt,
      support_email: SUPPORT_EMAIL
    };

    try {
      console.log('📤 Sending ticket', ticketId);

      const results = await Promise.all([
        emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_SUPPORT_ID,  templateParams),
        emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_CUSTOMER_ID, templateParams)
      ]);

      console.log('✅ Emails sent:', results);

      showStatus(
        `Ticket ${ticketId} created. Confirmation sent to ${email} with your chat link.`,
        false
      );

      form.reset();
      emailInput.focus();

    } catch (error) {
      console.error('❌ Ticket submission error:', error);
      showStatus(
        'Could not send your ticket. Please try again in a moment.',
        true
      );
    } finally {
      submitBtn.disabled = false;
    }
  }

  function handleReset() {
    form.reset();
    hideStatus();
    emailInput.focus();
  }

  form.addEventListener('submit', handleSubmit);
  resetBtn.addEventListener('click', handleReset);

  [emailInput, subjectInput, messageInput].forEach(el => {
    el.addEventListener('input', () => {
      if (statusMessage.classList.contains('show')) hideStatus();
    });
  });
})();