// Analytics for the public pages.
// - Google Analytics 4 (G-FJSVC9N663) is loaded directly, so visits are recorded
//   without any extra setup.
// - Google Tag Manager (GTM-NRGWFD3L) is loaded for any other tags. Do not also add a
//   GA4 tag for G-FJSVC9N663 inside GTM, or every visit will be counted twice.
(function () {
  var GA_MEASUREMENT_ID = 'G-FJSVC9N663';
  var GTM_ID = 'GTM-NRGWFD3L';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function load(src) {
    var script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  if (/^GTM-[A-Z0-9]+$/.test(GTM_ID)) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    load('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID);
  }
  if (/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) {
    load('https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID);
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  // A saved form submission is reported to GA4 and to GTM as "generate_lead".
  document.addEventListener('dattadham:lead', function (event) {
    var source = (event.detail && event.detail.source) || '';
    if (/^G-/.test(GA_MEASUREMENT_ID)) window.gtag('event', 'generate_lead', { form_source: source });
    window.dataLayer.push({ event: 'dattadham_lead', form_source: source });
  });
}());
