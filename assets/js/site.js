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

  const setStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  const clearEditedError = () => {
    if (!isSubmitting && status?.dataset.state === 'error') setStatus('');
  };
  form.addEventListener('input', clearEditedError);
  form.addEventListener('change', clearEditedError);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus('');

    if (!form.reportValidity() || !form.checkValidity()) return;

    const endpoint = form.getAttribute('action') || 'https://api.web3forms.com/submit';
    const payload = new FormData(form);
    const accessKey = String(payload.get('access_key') || '').trim();

    if (!accessKey) {
      setStatus('The enquiry form is temporarily unavailable. Please contact us directly at takumiautolabs@gmail.com.', 'error');
      return;
    }

    if (String(payload.get('website') || '').trim()) {
      setStatus('We could not process this enquiry. Please contact us directly at takumiautolabs@gmail.com.', 'error');
      return;
    }

    const visitorEmail = String(payload.get('email') || '').trim();
    payload.set('replyto', visitorEmail);
    payload.set('subject', 'New website enquiry — Takumi AutoLabs');
    payload.delete('website');

    isSubmitting = true;
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    controls.forEach((control) => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    setStatus('Sending your enquiry…', 'loading');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        const message = response.status === 429
          ? 'The enquiry service is temporarily rate-limiting requests. Please try again shortly, or email takumiautolabs@gmail.com.'
          : 'The enquiry service did not confirm your submission. Please try again, or email takumiautolabs@gmail.com directly.';
        setStatus(message, 'error');
        return;
      }

      form.reset();
      setStatus('Thank you. Your enquiry has been sent to Takumi AutoLabs. We will review your note and follow up by email.', 'success');
    } catch (_error) {
      setStatus('We could not reach the enquiry service. Please check your connection and try again, or email takumiautolabs@gmail.com directly.', 'error');
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
