(() => {
  const header = document.querySelector('[data-site-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('#primary-navigation');

  if (header && toggle && menu) {
    const closeMenu = (returnFocus = false) => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      header.classList.toggle('menu-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    });

    menu.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 821px)').matches) closeMenu();
    }, { passive: true });
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const defaultSubmitLabel = submit ? submit.textContent : '';

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  form.addEventListener('input', () => {
    if (status?.dataset.state === 'error') setStatus('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    if (!form.reportValidity()) return;
    if (!form.checkValidity()) return;

    const submitUrl = form.getAttribute('action') || '/api/contact';
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    setStatus('Sending your message securely…', 'loading');

    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Your message could not be sent right now. Please email us instead.');
      }

      form.reset();
      setStatus('Thanks for reaching out. Your message has been submitted; Takumi AutoLabs will follow up by email.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not submit your message. Please email takumiautolabs@gmail.com.';
      setStatus(message, 'error');
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = defaultSubmitLabel;
      }
    }
  });
})();
