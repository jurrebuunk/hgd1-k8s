/* Progressive enhancement only. Keycloak owns every authentication decision. */
(() => {
  document.querySelectorAll('[data-auth-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? button.dataset.labelHide : button.dataset.labelShow);
    });
  });

  document.querySelector('[data-locale-select]')?.addEventListener('change', event => {
    // Option URLs come exclusively from Keycloak's supported locales.
    window.location.assign(event.target.value);
  });

  const original = document.querySelector('[data-otp-input]');
  if (original) {
    const form = original.form;
    const submit = form.querySelector('[type="submit"]');
    const group = document.createElement('div');
    group.className = 'otp';
    group.dir = 'ltr';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', 'otp-label');
    const digits = Array.from({ length: 6 }, (_, i) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'fw-input';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.pattern = '[0-9]';
      input.autocomplete = i === 0 ? 'one-time-code' : 'off';
      input.id = `otp-digit-${i + 1}`;
      input.setAttribute('aria-label', `${original.dataset.digitLabel} ${i + 1}`);
      input.setAttribute('aria-describedby', original.getAttribute('aria-describedby'));
      input.setAttribute('aria-invalid', original.getAttribute('aria-invalid'));
      group.append(input);
      return input;
    });
    function sync() {
      original.value = digits.map(input => input.value).join('');
      submit.disabled = digits.some(input => !/^[0-9]$/.test(input.value));
    }
    function distribute(text, start) {
      const code = text.replace(/[^0-9]/g, '').slice(0, 6);
      if (!code) return;
      // A full pasted/autofilled code always replaces the whole code.
      const offset = code.length === 6 ? 0 : start;
      [...code].slice(0, 6 - offset).forEach((char, i) => { digits[offset + i].value = char; });
      digits[Math.min(offset + code.length, 5)].focus();
      sync();
    }
    digits.forEach((input, i) => {
      input.addEventListener('focus', () => input.select());
      input.addEventListener('beforeinput', event => {
        if (event.data?.length > 1) { event.preventDefault(); distribute(event.data, i); }
      });
      input.addEventListener('input', () => {
        if (input.value.length > 1) return distribute(input.value, i);
        input.value = input.value.replace(/[^0-9]/g, '');
        if (input.value && i < 5) digits[i + 1].focus();
        sync();
      });
      input.addEventListener('paste', event => {
        event.preventDefault();
        distribute(event.clipboardData.getData('text'), i);
      });
      input.addEventListener('keydown', event => {
        if (event.key === 'Backspace' && !input.value && i > 0) {
          event.preventDefault(); digits[i - 1].value = ''; digits[i - 1].focus(); sync();
        } else if (event.key === 'ArrowLeft' && i > 0) {
          event.preventDefault(); digits[i - 1].focus();
        } else if (event.key === 'ArrowRight' && i < 5) {
          event.preventDefault(); digits[i + 1].focus();
        }
      });
    });
    original.after(group);
    original.type = 'hidden';
    document.querySelector('label[for="otp"]').htmlFor = digits[0].id;
    original.addEventListener('input', () => distribute(original.value, 0));
    form.addEventListener('submit', event => { sync(); if (submit.disabled) event.preventDefault(); });
    form.addEventListener('reset', () => { digits.forEach(input => { input.value = ''; }); sync(); });
    sync();
    digits[0].focus();
  }

  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', event => {
      if (event.defaultPrevented) return;
      if (form.dataset.submitting) { event.preventDefault(); return; }
      form.dataset.submitting = 'true';
      form.querySelector('[type="submit"]')?.setAttribute('aria-busy', 'true');
    });
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-once-link]');
    if (!link) return;
    if (link.getAttribute('aria-disabled') === 'true') event.preventDefault();
    else link.setAttribute('aria-disabled', 'true');
  });
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('[data-submitting]').forEach(form => {
      delete form.dataset.submitting;
      form.querySelector('[type="submit"]')?.removeAttribute('aria-busy');
    });
    document.querySelectorAll('a[data-once-link]').forEach(link => link.removeAttribute('aria-disabled'));
  });
})();
