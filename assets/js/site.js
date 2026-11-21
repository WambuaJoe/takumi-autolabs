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

// Phase 2: Knot-inspired interactive demo tab switcher
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.demo-tab-btn');
  const metricOrders = document.querySelector('.metrics-row .metric:nth-child(1) .metric-value');
  const metricShipments = document.querySelector('.metrics-row .metric:nth-child(2) .metric-value');
  const metricAlerts = document.querySelector('.metrics-row .metric:nth-child(3) .metric-value');
  const statusBadge = document.querySelector('.demo-run-badge');

  if (!tabs.length || !metricOrders) return;

  const presets = {
    order: { orders: '248', shipments: '96.4%', alerts: '12', status: '● Ready · 1,420 runs' },
    stock: { orders: '412', shipments: '98.1%', alerts: '3', status: '● Synced · 3,890 runs' },
    crm:   { orders: '189', shipments: '99.5%', alerts: '0', status: '● Active · 850 runs' }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.getAttribute('data-workflow');
      const data = presets[key];
      if (data) {
        if (metricOrders) metricOrders.textContent = data.orders;
        if (metricShipments) metricShipments.textContent = data.shipments;
        if (metricAlerts) metricAlerts.textContent = data.alerts;
        if (statusBadge) {
          statusBadge.textContent = '⚡ Simulating...';
          statusBadge.style.backgroundColor = '#fef08a';
          setTimeout(() => {
            statusBadge.textContent = data.status;
            statusBadge.style.backgroundColor = 'var(--mint-light)';
          }, 350);
        }
      }
    });
  });
});

// Phase 3: Knot-style flip card interactions
document.addEventListener('DOMContentLoaded', () => {
  const flipCards = document.querySelectorAll('[data-flip-card]');
  flipCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger flip if clicking direct links
      if (e.target.closest('a')) return;
      card.classList.toggle('flipped');
    });
  });
});

// Scroll to top button interaction
document.addEventListener('DOMContentLoaded', () => {
  // Inject scroll-to-top button if not present
  if (!document.querySelector('.scroll-top-btn')) {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>`;
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      if (window.scrollY > 320) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
