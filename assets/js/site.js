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
  const defaultSubmitMarkup = submit ? submit.innerHTML : '';
  const controls = Array.from(form.querySelectorAll('input, select, textarea'));
  const initialDisabledStates = controls.map((control) => control.disabled);
  let isSubmitting = false;
  let retryIdempotencyKey = null;

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  const newIdempotencyKey = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `contact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  };

  const clearEditedError = () => {
    if (isSubmitting) return;
    retryIdempotencyKey = null;
    if (status?.dataset.state === 'error') setStatus('');
  };
  form.addEventListener('input', clearEditedError);
  form.addEventListener('change', clearEditedError);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus('');

    if (!form.reportValidity() || !form.checkValidity()) return;

    const submitUrl = form.getAttribute('action') || '/api/contact';
    const payload = Object.fromEntries(new FormData(form).entries());
    retryIdempotencyKey ||= newIdempotencyKey();
    isSubmitting = true;

    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    controls.forEach((control) => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    setStatus('Sending your enquiry…', 'loading');

    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': retryIdempotencyKey
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.error || 'Your enquiry could not be sent right now. Please email takumiautolabs@gmail.com directly.');
      }

      form.reset();
      retryIdempotencyKey = null;
      setStatus(result.message || 'Your enquiry has been sent successfully. Takumi AutoLabs will follow up by email.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not submit your message. Please email takumiautolabs@gmail.com directly.';
      setStatus(message, 'error');
    } finally {
      isSubmitting = false;
      form.removeAttribute('aria-busy');
      controls.forEach((control, index) => { control.disabled = initialDisabledStates[index]; });
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = defaultSubmitMarkup;
      }
    }
  });
})();
