(function () {
  // Pega a configuração global. Note que usamos API_BASE_URL para combinar com o api-config.js sugerido.
  const cfg = window.ZAITPAY_CONFIG || {};

  function normalizeUrl(path) {
    // Prioriza API_BASE_URL, mas aceita BASE_URL como fallback
    const base = (cfg.API_BASE_URL || cfg.BASE_URL || '').replace(/\/$/, '');
    const prefix = (cfg.PREFIX || '').replace(/^\//, '').replace(/\/$/, '');
    const cleanPath = String(path || '').replace(/^\//, '');
    
    // Se o path já for uma URL completa, retorna ela mesma
    if (cleanPath.startsWith('http')) return cleanPath;
    
    return [base, prefix, cleanPath].filter(Boolean).join('/');
  }

  function getToken() {
    return localStorage.getItem('zait_token') || localStorage.getItem('token') || '';
  }

  function saveAuth(payload) {
    if (!payload || typeof payload !== 'object') return;
    
    // Normaliza a resposta da API (suporta {data: {user, token}} ou {user, token})
    const data = payload.data || payload;
    
    // Busca o token em diferentes padrões comuns
    const token = data.token || data.accessToken || data.access_token || data.jwt;
    if (token) {
      localStorage.setItem('zait_token', token);
      localStorage.setItem('token', token);
    }
    
    // Busca o usuário em diferentes padrões comuns
    const user = data.user || data.usuario || data.data?.user;
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('activeUser', JSON.stringify(user));
      console.log('Sessão iniciada para:', user.email, 'Usuário:', user.role);
    }
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.TIMEOUT || 20000);
    const token = getToken();

    try {
      const fullUrl = normalizeUrl(path);
      console.log('Chamando API:', fullUrl);

      const isFormData = options.body instanceof FormData;
      const baseHeaders = {
        'Accept': 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...baseHeaders,
          ...(options.headers || {})
        }
      });

      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      if (!res.ok) {
        const msg = (data && (data.message || data.error || data.erro)) || `Erro HTTP ${res.status}`;
        const error = new Error(msg);
        error.status = res.status;
        error.data = data;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function tryEndpoints(group, options) {
    const endpoints = cfg.ENDPOINTS?.[group] || [];
    // Se for apenas uma string (não array), transforma em array
    const endpointList = Array.isArray(endpoints) ? endpoints : [endpoints];
    
    let lastError;
    for (const endpoint of endpointList) {
      try {
        return await request(endpoint, options);
      } catch (err) {
        lastError = err;
        // Se o erro for 404 (não encontrado) ou 405 (método não permitido), tenta o próximo endpoint da lista
        if (![404, 405].includes(err.status)) throw err;
      }
    }
    throw lastError || new Error(`Nenhum endpoint funcional encontrado para: ${group}`);
  }

  window.ZaitPayApi = {
    request,
    saveAuth,
    async login(email, password) {
      const data = await tryEndpoints('login', { method: 'POST', body: JSON.stringify({ email, password }) });
      saveAuth(data);
      return data;
    },
    async register(payload) {
      const isFormData = payload instanceof FormData;
      const data = await tryEndpoints('register', { method: 'POST', body: isFormData ? payload : JSON.stringify(payload) });
      return data;
    },
    async verifyOtp(email, code) {
      return await request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code, otpCode: code }) });
    },
    async resendOtp(email) {
      return await request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });
    },
    async getMe() {
      return await request('/auth/me', { method: 'GET' });
    },
    async updateProfile(payload) {
      return await request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
    },
    async setTransactionPin(pin, confirmPin, password) {
      return await request('/auth/me/transaction-pin', { method: 'POST', body: JSON.stringify({ pin, confirmPin, password }) });
    },
    async getKycPending() {
      return await request('/kyc/pending', { method: 'GET' });
    },
    async approveKyc(accountId, notes = '') {
      return await request(`/kyc/${accountId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) });
    },
    async rejectKyc(accountId, reason = '') {
      return await request(`/kyc/${accountId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    },
    getKycDocumentViewUrl(accountId, kind) {
      return normalizeUrl(`/kyc/documents/${accountId}/${encodeURIComponent(kind)}/view`);
    },
    async downloadKycDocument(accountId, kind, originalName = 'documento') {
      const token = getToken();
      const res = await fetch(normalizeUrl(`/kyc/documents/${accountId}/${encodeURIComponent(kind)}/download`), {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error('Falha ao baixar documento');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'documento';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async createPix(payload) {
      const resp = await tryEndpoints('pix', { method: 'POST', body: JSON.stringify(payload) });
      return resp.data || resp;
    },
    async createBoleto(payload) {
      const resp = await tryEndpoints('boleto', { method: 'POST', body: JSON.stringify(payload) });
      return resp.data || resp;
    },
    async createPaymentLink(payload) {
      return await tryEndpoints('paymentLink', { method: 'POST', body: JSON.stringify(payload) });
    },
    async setClientOperatingMode(userId, mode) { return await request(`/accounts/admin/users/${userId}/operating-mode`, { method: 'POST', body: JSON.stringify({ mode, allowedMode: mode }) }); },
    async setUserStatus(userId, active) { return await request(`/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ active }) }); },
    async deleteUser(userId) { return await request(`/users/${userId}`, { method: 'DELETE' }); },
    async getVoltzPools() { return await request('/voltz-pools', { method: 'GET' }); },
    async getMyVoltzPoolBalances() { return await request('/voltz-pools/me', { method: 'GET' }); },
    async getVoltzPoolsSummary() { return await request('/voltz-pools/admin/summary', { method: 'GET' }); },
    async createVoltzPool(payload = {}) { return await request('/voltz-pools', { method: 'POST', body: JSON.stringify(payload) }); },
    async updateVoltzPoolConfig(poolId, payload = {}) { return await request(`/voltz-pools/${poolId}/config`, { method: 'PUT', body: JSON.stringify(payload) }); },
    async addVoltzPoolClient(poolId, userId) { return await request(`/voltz-pools/${poolId}/clients`, { method: 'POST', body: JSON.stringify({ userId }) }); },
    async updateVoltzPoolClientStatus(poolId, userId, status) { return await request(`/voltz-pools/${poolId}/clients/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); },
    async removeVoltzPoolClient(poolId, userId) { return await request(`/voltz-pools/${poolId}/clients/${userId}`, { method: 'DELETE' }); },
    async addVoltzPoolLedger(poolId, payload = {}) { return await request(`/voltz-pools/${poolId}/ledger`, { method: 'POST', body: JSON.stringify(payload) }); },
    async chargeVoltzPoolMonthly(poolId, payload = {}) { return await request(`/voltz-pools/${poolId}/charge-monthly`, { method: 'POST', body: JSON.stringify(payload) }); },
    async applyVoltzPoolTransactionFee(poolId, payload = {}) { return await request(`/voltz-pools/${poolId}/apply-transaction-fee`, { method: 'POST', body: JSON.stringify(payload) }); },
    async getClientes() { return await tryEndpoints('clientes', { method: 'GET' }); },
    async getExtrato() { return await tryEndpoints('extrato', { method: 'GET' }); }
  };
})();