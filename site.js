const languageToggle = document.querySelector('[data-language-toggle]');
const translationNodes = [...document.querySelectorAll('[data-i18n]')];

function applyLanguage(language) {
  document.documentElement.lang = language;
  translationNodes.forEach((node) => {
    node.textContent = node.dataset[language];
  });

  const isHindi = language === 'hi';
  languageToggle.textContent = isHindi ? 'English' : 'हिंदी';
  languageToggle.setAttribute('aria-pressed', String(isHindi));
  languageToggle.setAttribute('aria-label', isHindi ? 'Switch to English' : 'हिंदी में देखें');
  document.title = isHindi ? 'श्री क्षेत्र दत्ताधाम | गौगंगा संकल्प' : 'Shri Kshetra Dattadham | GauGanga Sankalp';
  document.querySelector('meta[name="description"]').content = isHindi
    ? 'श्री क्षेत्र दत्ताधाम — सेवा, संवर्धन और कल्याण की जीवन-धारा।'
    : 'Shri Kshetra Dattadham — a living current of service, care and renewal.';
  localStorage.setItem('dattadham-language', language);
}

applyLanguage(localStorage.getItem('dattadham-language') || 'en');
languageToggle.addEventListener('click', () => applyLanguage(document.documentElement.lang === 'en' ? 'hi' : 'en'));

document.querySelectorAll('[data-lead-form]').forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button');
  const language = document.documentElement.lang;
  const copy = language === 'hi'
    ? { sending: 'भेजा जा रहा है…', success: 'धन्यवाद। हम शीघ्र आपसे संपर्क करेंगे।', error: 'विवरण नहीं भेजे जा सके। कृपया हमें ईमेल करें।' }
    : { sending: 'Sending…', success: 'Thank you. We will be in touch soon.', error: 'We could not send your details. Please email us directly.' };
  const payload = Object.fromEntries(new FormData(form));
  payload.source = form.dataset.source;
  status.textContent = copy.sending;
  button.disabled = true;
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Submission failed');
    form.reset();
    status.textContent = copy.success;
  } catch {
    status.textContent = copy.error;
  } finally {
    button.disabled = false;
  }
}));
