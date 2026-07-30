export const isProduction = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'wilddox.com' || window.location.hostname === 'www.wilddox.com';
};

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;
  if (isProduction()) {
    // Inject gtag.js
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-N7SPTBH1C4';
    document.head.appendChild(gtagScript);

    // Inject GTM
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-KG9BL6JQ');
  } else {
    // Debug setup for non-production environments
    console.debug('Analytics initialized in debug mode (Not Production).');
  }

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
  }

  // Preserve UTM params and configure GA without automatically sending a pageview
  const urlParams = new URLSearchParams(window.location.search);
  const configParams = {
    send_page_view: false, // We'll manually send pageviews
  };
  
  if (urlParams.has('utm_source')) configParams.campaign_source = urlParams.get('utm_source');
  if (urlParams.has('utm_medium')) configParams.campaign_medium = urlParams.get('utm_medium');
  if (urlParams.has('utm_campaign')) configParams.campaign_name = urlParams.get('utm_campaign');
  if (urlParams.has('utm_content')) configParams.campaign_content = urlParams.get('utm_content');

  // Only configure production GA if on correct hostname
  if (isProduction()) {
    window.gtag('config', 'G-N7SPTBH1C4', configParams);
  }
};

export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window === 'undefined') return;

  const safeParams = { ...eventParams };
  // Remove any obvious PII if it accidentally got passed (like emails or raw text input)
  delete safeParams.email;
  delete safeParams.name; 
  delete safeParams.error_message; // For errors, use error_code instead

  // Add build version or generic params
  safeParams.build_version = '1.0.0'; 

  if (isProduction()) {
    if (window.gtag) {
      window.gtag('event', eventName, safeParams);
    }
  } else {
    // Local/Preview logging
    console.debug(`[Analytics Event] ${eventName}:`, safeParams);
  }
};

export const trackPageView = (pagePath) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_location: window.location.href,
  });
};
