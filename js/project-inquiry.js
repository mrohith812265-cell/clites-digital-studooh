/* Clites — project inquiry form
 *
 * The public site is static, so the browser talks to Supabase directly using
 * the publishable key. The database only grants anonymous INSERT on the
 * public form columns; SELECT/UPDATE/DELETE are blocked by RLS and grants.
 */

const TABLE = 'project_inquiries';
const CONFIG_PATH = 'supabase-config.json';
const VENDOR_PATH = 'vendor/supabase-js.js';
const CONTACT_EMAIL = 'contact@clites.in';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Z]{2,}$/i;

let dialog;
let form;
let status;
let submitButton;
let lastTrigger = null;
let isSubmitting = false;
let clientPromise = null;

class InquiryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InquiryError';
    this.code = code;
  }
}

function markup() {
  return `
    <dialog class="inquiry-dialog" id="project-inquiry-dialog" aria-labelledby="inquiry-title">
      <div class="inquiry-dialog__grid">
        <aside class="inquiry-dialog__aside">
          <button type="button" class="inquiry-dialog__close" data-inquiry-close aria-label="Close inquiry form">
            <span aria-hidden="true">&times;</span>
          </button>
          <div class="inquiry-dialog__intro">
            <p class="inquiry-dialog__eyebrow">Start a project</p>
            <h2 class="inquiry-dialog__title" id="inquiry-title">Tell us what you&rsquo;re <em>building.</em></h2>
            <p class="inquiry-dialog__note">Share a few details about your project. We&rsquo;ll reply within 1&ndash;2 business days.</p>
          </div>
          <div class="inquiry-dialog__contact">
            <p>Prefer email?</p>
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
            <a href="https://wa.me/917339598683" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">&rarr;</span></a>
          </div>
        </aside>

        <div class="inquiry-dialog__panel">
          <form class="inquiry-form" id="project-inquiry-form" data-inquiry-form novalidate>
            <div class="inquiry-form__grid">
              <div class="inquiry-field">
                <label for="inquiry-name">Your name <span aria-hidden="true">*</span></label>
                <input id="inquiry-name" name="name" type="text" required maxlength="120" autocomplete="name" placeholder="Jane Doe" aria-describedby="inquiry-name-error" />
                <p class="inquiry-field__error" id="inquiry-name-error" aria-live="polite"></p>
              </div>

              <div class="inquiry-field">
                <label for="inquiry-email">Email address <span aria-hidden="true">*</span></label>
                <input id="inquiry-email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email" spellcheck="false" placeholder="you@company.com" aria-describedby="inquiry-email-error" />
                <p class="inquiry-field__error" id="inquiry-email-error" aria-live="polite"></p>
              </div>

              <div class="inquiry-field">
                <label for="inquiry-business">Business name <span class="inquiry-field__optional">(optional)</span></label>
                <input id="inquiry-business" name="business_name" type="text" maxlength="160" autocomplete="organization" placeholder="Your business" aria-describedby="inquiry-business-error" />
                <p class="inquiry-field__error" id="inquiry-business-error" aria-live="polite"></p>
              </div>

              <div class="inquiry-field">
                <label for="inquiry-project-type">Project type <span class="inquiry-field__optional">(optional)</span></label>
                <select id="inquiry-project-type" name="project_type" aria-describedby="inquiry-project-type-error">
                  <option value="">Select a service</option>
                  <option value="Website design & development">Website design &amp; development</option>
                  <option value="Brand identity">Brand identity</option>
                  <option value="UI/UX design">UI/UX design</option>
                  <option value="Social media design">Social media design</option>
                  <option value="Something else">Something else</option>
                </select>
                <p class="inquiry-field__error" id="inquiry-project-type-error" aria-live="polite"></p>
              </div>

              <div class="inquiry-field inquiry-field--full">
                <label for="inquiry-budget">Budget range <span class="inquiry-field__optional">(optional)</span></label>
                <select id="inquiry-budget" name="budget" aria-describedby="inquiry-budget-error">
                  <option value="">Select a range</option>
                  <option value="Under ₹25,000">Under ₹25,000</option>
                  <option value="₹25,000–₹50,000">₹25,000–₹50,000</option>
                  <option value="₹50,000–₹1,00,000">₹50,000–₹1,00,000</option>
                  <option value="₹1,00,000+">₹1,00,000+</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
                <p class="inquiry-field__error" id="inquiry-budget-error" aria-live="polite"></p>
              </div>

              <div class="inquiry-field inquiry-field--full">
                <label for="inquiry-message">Project details <span aria-hidden="true">*</span></label>
                <textarea id="inquiry-message" name="message" required minlength="10" maxlength="5000" rows="5" placeholder="What are you building, and what would success look like?" aria-describedby="inquiry-message-error"></textarea>
                <p class="inquiry-field__error" id="inquiry-message-error" aria-live="polite"></p>
              </div>
            </div>

            <p class="inquiry-form__status" id="inquiry-status" role="status" aria-live="polite" hidden></p>

            <div class="inquiry-form__footer">
              <button type="submit" class="inquiry-form__submit">Send inquiry</button>
              <p class="inquiry-form__privacy">We only use these details to reply to your inquiry.</p>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  `;
}

function init() {
  if (document.getElementById('project-inquiry-dialog')) return;

  document.body.insertAdjacentHTML('beforeend', markup());
  dialog = document.getElementById('project-inquiry-dialog');
  form = document.getElementById('project-inquiry-form');
  status = document.getElementById('inquiry-status');
  submitButton = form.querySelector('button[type="submit"]');

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('inquiry-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  });

  dialog.querySelector('[data-inquiry-close]').addEventListener('click', closeDialog);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-inquiry-open]') : null;
    if (!target) return;
    event.preventDefault();
    lastTrigger = target;
    openDialog();
  });

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (field && field.name) clearFieldError(field.name);
    if (status.dataset.state === 'error' || status.dataset.state === 'success') clearStatus();
  });

  form.addEventListener('change', (event) => {
    const field = event.target;
    if (field && field.name) clearFieldError(field.name);
  });

  form.addEventListener('submit', handleSubmit);
}

function openDialog() {
  if (!dialog) return;

  document.body.classList.add('inquiry-open');
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }

  // Start loading the public client/config in the background. If it is not
  // configured, the form stays usable and shows an honest error on submit.
  ensureClient().catch(() => {});

  window.setTimeout(() => {
    const nameInput = document.getElementById('inquiry-name');
    if (nameInput) nameInput.focus();
  }, 60);
}

function closeDialog() {
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
    document.body.classList.remove('inquiry-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }
}

function setFieldError(name, message) {
  const field = form.elements.namedItem(name);
  if (!field) return;
  const error = field.closest('.inquiry-field')?.querySelector('.inquiry-field__error');
  if (error) error.textContent = message;
  if (message) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }
}

function clearFieldError(name) {
  setFieldError(name, '');
}

function clearAllErrors() {
  ['name', 'email', 'business_name', 'project_type', 'budget', 'message'].forEach(clearFieldError);
}

function showStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
  status.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
}

function clearStatus() {
  status.textContent = '';
  status.dataset.state = '';
  status.hidden = true;
  status.setAttribute('aria-live', 'polite');
}

function validate() {
  clearAllErrors();

  const values = {
    name: form.elements.namedItem('name').value.trim(),
    email: form.elements.namedItem('email').value.trim(),
    business_name: form.elements.namedItem('business_name').value.trim(),
    project_type: form.elements.namedItem('project_type').value,
    budget: form.elements.namedItem('budget').value,
    message: form.elements.namedItem('message').value.trim(),
  };

  const errors = {};

  if (!values.name) {
    errors.name = 'Please enter your name.';
  } else if (values.name.length > 120) {
    errors.name = 'Please keep your name under 120 characters.';
  }

  if (!values.email) {
    errors.email = 'Please enter your email address.';
  } else if (values.email.length > 254 || !EMAIL_RE.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (values.business_name.length > 160) {
    errors.business_name = 'Please keep the business name under 160 characters.';
  }

  if (values.project_type.length > 80) {
    errors.project_type = 'Please choose a shorter project type.';
  }

  if (values.budget.length > 80) {
    errors.budget = 'Please choose a shorter budget range.';
  }

  if (!values.message) {
    errors.message = 'Please tell us a little about your project.';
  } else if (values.message.length < 10) {
    errors.message = 'Please add at least 10 characters.';
  } else if (values.message.length > 5000) {
    errors.message = 'Please keep your message under 5,000 characters.';
  }

  const firstInvalid = Object.keys(errors)[0] || null;
  Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));

  if (firstInvalid) {
    const field = form.elements.namedItem(firstInvalid);
    if (field && typeof field.focus === 'function') field.focus();
    return { valid: false };
  }

  return {
    valid: true,
    payload: {
      name: values.name,
      email: values.email.toLowerCase(),
      business_name: values.business_name || null,
      project_type: values.project_type || null,
      budget: values.budget || null,
      message: values.message,
    },
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const result = validate();
  if (!result.valid) {
    showStatus('Please check the highlighted fields and try again.', 'error');
    return;
  }

  isSubmitting = true;
  setLoading(true);
  showStatus('Sending your inquiry…', 'loading');

  try {
    const client = await ensureClient();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    let response;

    try {
      response = await client.from(TABLE).insert(result.payload).abortSignal(controller.signal);
    } finally {
      window.clearTimeout(timer);
    }

    if (response.error) throw response.error;

    form.reset();
    clearAllErrors();
    showStatus('Thanks — your inquiry has been received. We will be in touch shortly.', 'success');
  } catch (error) {
    showStatus(getErrorMessage(error), 'error');
    if (isUnexpected(error)) {
      console.error('Project inquiry submission failed:', error?.code || error?.name || 'unknown');
    }
  } finally {
    isSubmitting = false;
    setLoading(false);
  }
}

function setLoading(loading) {
  submitButton.disabled = loading;
  submitButton.textContent = loading ? 'Sending…' : 'Send inquiry';
  form.setAttribute('aria-busy', loading ? 'true' : 'false');
}

function getErrorMessage(error) {
  if (error instanceof InquiryError) {
    if (error.code === 'config') {
      return `Online inquiries are not configured yet. Please email ${CONTACT_EMAIL}.`;
    }
    return 'The inquiry form could not load. Please refresh the page and try again.';
  }

  if (error?.name === 'AbortError') {
    return 'The request timed out. Please check your connection and try again.';
  }

  if (['PGRST205', '42P01', '42501'].includes(error?.code)) {
    return `The inquiry form is not available right now. Please email ${CONTACT_EMAIL}.`;
  }

  if (['23514', '23502'].includes(error?.code)) {
    return 'Some details were not accepted. Please check the form and try again.';
  }

  return `We couldn't send your inquiry. Please try again, or email ${CONTACT_EMAIL}.`;
}

function isUnexpected(error) {
  if (error instanceof InquiryError) return false;
  if (error?.name === 'AbortError') return false;
  return !['PGRST205', '42P01', '42501', '23514', '23502'].includes(error?.code);
}

async function ensureClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = await loadConfig();
      await loadVendor();
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new InquiryError('client', 'Supabase client failed to load.');
      }

      const client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      form.dataset.backend = 'supabase';
      return client;
    })().catch((error) => {
      form.dataset.backend = 'unavailable';
      throw error;
    });
  }

  return clientPromise;
}

async function loadConfig() {
  if (window.CLITES_SUPABASE_CONFIG) {
    return validateConfig(window.CLITES_SUPABASE_CONFIG);
  }

  let response;
  try {
    response = await fetch(CONFIG_PATH, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new InquiryError('config', 'Supabase configuration could not be loaded.');
  }

  if (!response.ok) {
    throw new InquiryError('config', 'Supabase configuration is missing.');
  }

  let config;
  try {
    config = await response.json();
  } catch {
    throw new InquiryError('config', 'Supabase configuration is invalid.');
  }

  return validateConfig(config);
}

function isPrivilegedJwt(key) {
  const parts = key.split('.');
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return payload.role === 'service_role' || payload.role === 'supabase_admin';
  } catch {
    return false;
  }
}

function validateConfig(config) {
  if (
    !config ||
    typeof config.url !== 'string' ||
    typeof config.publishableKey !== 'string' ||
    !config.url.startsWith('https://') ||
    !config.publishableKey
  ) {
    throw new InquiryError('config', 'Supabase configuration is incomplete.');
  }

  if (
    config.publishableKey.startsWith('sb_secret_') ||
    config.publishableKey.startsWith('service_role') ||
    isPrivilegedJwt(config.publishableKey)
  ) {
    throw new InquiryError('config', 'A secret key must not be used in the browser.');
  }

  return {
    url: config.url.replace(/\/+$/, ''),
    publishableKey: config.publishableKey,
  };
}

function loadVendor() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-supabase-js]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new InquiryError('client', 'Supabase client failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = VENDOR_PATH;
    script.async = true;
    script.dataset.supabaseJs = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new InquiryError('client', 'Supabase client failed to load.'));
    document.head.appendChild(script);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
