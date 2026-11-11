const languageToggle = document.querySelector('[data-language-toggle]');
const translationNodes = [...document.querySelectorAll('[data-i18n]')];

function applyLanguage(language) {
  document.documentElement.lang = language;
  translationNodes.forEach((node) => {
    node.textContent = node.dataset[language];
  });

  const isHindi = language === 'hi';
  languageToggle.textContent = isHindi ? 'English' : 'हिंदी';
  languageToggle.lang = isHindi ? 'en' : 'hi';
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

const siteHeader = document.querySelector('.site-header');
const navToggle = document.querySelector('[data-nav-toggle]');
function setNav(open) {
  siteHeader.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}
navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
document.querySelectorAll('#site-nav a').forEach((link) => link.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteHeader.classList.contains('nav-open')) {
    setNav(false);
    navToggle.focus();
  }
});

const mediaDialog = document.querySelector('[data-media-dialog]');
const mediaFrame = mediaDialog.querySelector('[data-media-frame]');
const embedUrl = {
  youtube: (id) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
  instagram: (id) => `https://www.instagram.com/reel/${id}/embed/`,
};
document.querySelectorAll('[data-embed]').forEach((link) => link.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || !mediaDialog.showModal) return;
  event.preventDefault();
  const { embed, id } = link.dataset;
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl[embed](id);
  const title = link.querySelector('h3, h4')?.textContent.trim() || 'Video';
  iframe.title = title;
  mediaDialog.setAttribute('aria-label', title);
  const isHindi = document.documentElement.lang === 'hi';
  const sourceName = embed === 'youtube' ? (isHindi ? 'यूट्यूब' : 'YouTube') : (isHindi ? 'इंस्टाग्राम' : 'Instagram');
  mediaDialog.querySelector('[data-media-open]').textContent = isHindi ? `${sourceName} पर खोलें` : `Open on ${sourceName}`;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  mediaDialog.dataset.kind = embed;
  mediaFrame.replaceChildren(iframe);
  mediaDialog.querySelector('[data-media-open]').href = link.href;
  mediaDialog.showModal();
}));
mediaDialog.querySelector('[data-media-close]').addEventListener('click', () => mediaDialog.close());
mediaDialog.addEventListener('click', (event) => { if (event.target === mediaDialog) mediaDialog.close(); });
mediaDialog.addEventListener('close', () => mediaFrame.replaceChildren());

document.querySelectorAll('[data-lead-form]').forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button');
  const language = document.documentElement.lang;
  const copy = language === 'hi'
    ? {
      sending: 'भेजा जा रहा है…',
      success: 'धन्यवाद। आपका विवरण सफलतापूर्वक प्राप्त हुआ है। हम शीघ्र आपसे संपर्क करेंगे।',
      emailPending: 'धन्यवाद। आपका विवरण प्राप्त हुआ है। ईमेल की पुष्टि फिलहाल नहीं भेजी जा सकी।',
      error: 'आपका विवरण अभी सुरक्षित नहीं हो सका। कृपया कुछ देर बाद पुनः प्रयास करें।',
    }
    : {
      sending: 'Sending…',
      success: 'Thank you. Your details have been received. We will be in touch soon.',
      emailPending: 'Thank you. Your details have been received. We could not send the email confirmation just now.',
      error: 'We could not save your details. Please try again in a little while.',
    };
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
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.saved) {
      throw new Error(result.error || 'Submission failed');
    }

    form.reset();
    status.textContent = result.emailSent ? copy.success : copy.emailPending;
  } catch {
    status.textContent = copy.error;
  } finally {
    button.disabled = false;
  }
}));
