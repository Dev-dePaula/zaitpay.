(function () {
  // Dentro do app nativo (Capacitor/Android/iOS) o WebView costuma reportar
  // hostname "localhost", o que faria o app tentar falar com um backend local
  // que não existe no celular do cliente. Por isso, checamos primeiro se
  // estamos rodando dentro do app nativo e, nesse caso, forçamos a API de
  // produção, ignorando o hostname.
  const isNativeApp = Boolean(
    window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()
  );

  const PRODUCTION_API = 'https://api.zaitpay.com.br'; // troque pela URL real da sua API em produção

  const apiBaseUrl = isNativeApp
    ? PRODUCTION_API
    : (window.location.hostname === 'localhost' ? 'http://localhost:3333' : PRODUCTION_API);

  window.ZAITPAY_CONFIG = {
    API_BASE_URL: apiBaseUrl,
    ENDPOINTS: {
      login: '/auth/login',
      register: '/auth/register',
      clientes: '/users',
      extrato: '/accounts/statement',
      pix: '/pix/charges',
      boleto: '/boletos',
      paymentLink: '/payment-links',
      transfer: '/transfers/ted'
    }
  };
})();