// Google Analytics 4. Set GA_MEASUREMENT_ID (looks like G-XXXXXXXXXX) to turn it on.
(function () {
  var GA_MEASUREMENT_ID = '';
  if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return;
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
  // Count successful form submissions as a "generate_lead" event.
  document.addEventListener('dattadham:lead', function (event) {
    window.gtag('event', 'generate_lead', { form_source: (event.detail && event.detail.source) || '' });
  });
}());
