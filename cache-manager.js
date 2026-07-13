/**
 * Cache Manager - Zait Pay
 * Gerencia limpeza de cache do navegador
 * Data: 16 de Junho de 2026
 */

class CacheManager {
  /**
   * Limpa todo o localStorage
   */
  static clearLocalStorage() {
    try {
      localStorage.clear();
      console.log('✅ LocalStorage limpo');
      return true;
    } catch (e) {
      console.error('❌ Erro ao limpar localStorage:', e);
      return false;
    }
  }

  /**
   * Limpa todo o sessionStorage
   */
  static clearSessionStorage() {
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpo');
      return true;
    } catch (e) {
      console.error('❌ Erro ao limpar sessionStorage:', e);
      return false;
    }
  }

  /**
   * Limpa todos os cookies
   */
  static clearCookies() {
    try {
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        }
      });
      console.log('✅ Cookies limpos');
      return true;
    } catch (e) {
      console.error('❌ Erro ao limpar cookies:', e);
      return false;
    }
  }

  /**
   * Limpa o IndexedDB
   */
  static async clearIndexedDB() {
    try {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        window.indexedDB.deleteDatabase(db.name);
      }
      console.log('✅ IndexedDB limpo');
      return true;
    } catch (e) {
      console.error('❌ Erro ao limpar IndexedDB:', e);
      return false;
    }
  }

  /**
   * Limpa o Service Worker cache
   */
  static async clearServiceWorkerCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
        console.log('✅ Service Worker cache limpo');
        return true;
      }
      return false;
    } catch (e) {
      console.error('❌ Erro ao limpar Service Worker cache:', e);
      return false;
    }
  }

  /**
   * Limpa um item específico do localStorage
   * @param {string} key - Chave do item
   */
  static clearLocalStorageItem(key) {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Item '${key}' removido do localStorage`);
      return true;
    } catch (e) {
      console.error(`❌ Erro ao remover '${key}':`, e);
      return false;
    }
  }

  /**
   * Limpa itens do localStorage que começam com um prefixo
   * @param {string} prefix - Prefixo dos itens
   */
  static clearLocalStorageByPrefix(prefix) {
    try {
      const keys = Object.keys(localStorage);
      let count = 0;
      keys.forEach((key) => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
          count++;
        }
      });
      console.log(`✅ ${count} item(ns) com prefixo '${prefix}' removido(s)`);
      return count;
    } catch (e) {
      console.error(`❌ Erro ao limpar itens com prefixo '${prefix}':`, e);
      return 0;
    }
  }

  /**
   * Limpa dados específicos do Zait Pay
   */
  static clearZaitPayData() {
    try {
      const keysToRemove = [
        'user',
        'token',
        'auth',
        'accounts',
        'users',
        'clients',
        'managers',
        'transactions',
        'pix',
        'boletos',
        'cards',
        'kyc',
        'dashboard',
        'cache',
      ];

      let count = 0;
      keysToRemove.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          count++;
        }
      });

      // Limpar itens com prefixo
      count += this.clearLocalStorageByPrefix('zait_');
      count += this.clearLocalStorageByPrefix('app_');
      count += this.clearLocalStorageByPrefix('cache_');

      console.log(`✅ ${count} item(ns) do Zait Pay removido(s)`);
      return count;
    } catch (e) {
      console.error('❌ Erro ao limpar dados do Zait Pay:', e);
      return 0;
    }
  }

  /**
   * Limpa TUDO (cache completo)
   */
  static async clearAll() {
    console.log('🔄 Iniciando limpeza completa de cache...');
    console.log('');

    const results = {
      localStorage: this.clearLocalStorage(),
      sessionStorage: this.clearSessionStorage(),
      cookies: this.clearCookies(),
      indexedDB: await this.clearIndexedDB(),
      serviceWorkerCache: await this.clearServiceWorkerCache(),
    };

    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ LIMPEZA DE CACHE CONCLUÍDA                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Resumo:');
    Object.entries(results).forEach(([key, value]) => {
      const status = value ? '✅' : '⚠️';
      console.log(`  ${status} ${key}: ${value ? 'Limpo' : 'Não aplicável'}`);
    });
    console.log('');
    console.log('A página será recarregada em 2 segundos...');
    console.log('');

    // Recarregar página após 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return results;
  }

  /**
   * Mostra informações do cache atual
   */
  static showCacheInfo() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              📊 INFORMAÇÕES DE CACHE                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    // LocalStorage
    console.log('📦 LocalStorage:');
    console.log(`   Itens: ${localStorage.length}`);
    console.log(`   Tamanho aproximado: ${this._estimateStorageSize(localStorage)} KB`);
    console.log('');

    // SessionStorage
    console.log('📦 SessionStorage:');
    console.log(`   Itens: ${sessionStorage.length}`);
    console.log(`   Tamanho aproximado: ${this._estimateStorageSize(sessionStorage)} KB`);
    console.log('');

    // Cookies
    const cookieCount = document.cookie.split(';').length;
    console.log('🍪 Cookies:');
    console.log(`   Total: ${cookieCount}`);
    console.log('');

    // Listar chaves do localStorage
    console.log('🔑 Chaves no localStorage:');
    if (localStorage.length === 0) {
      console.log('   (vazio)');
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        console.log(`   • ${key}: ${size} bytes`);
      }
    }
    console.log('');
  }

  /**
   * Estima o tamanho do storage em KB
   * @private
   */
  static _estimateStorageSize(storage) {
    let size = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        size += storage[key].length + key.length;
      }
    }
    return (size / 1024).toFixed(2);
  }

  /**
   * Cria um botão de limpeza de cache na página
   */
  static createClearCacheButton() {
    const button = document.createElement('button');
    button.id = 'clear-cache-btn';
    button.textContent = '🗑️ Limpar Cache';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #ff6b6b;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    `;

    button.onmouseover = () => {
      button.style.backgroundColor = '#ff5252';
      button.style.transform = 'scale(1.05)';
    };

    button.onmouseout = () => {
      button.style.backgroundColor = '#ff6b6b';
      button.style.transform = 'scale(1)';
    };

    button.onclick = () => {
      if (confirm('Tem certeza que deseja limpar todo o cache? A página será recarregada.')) {
        this.clearAll();
      }
    };

    document.body.appendChild(button);
    console.log('✅ Botão de limpeza de cache adicionado');
  }

  /**
   * Limpa cache automaticamente a cada X minutos
   * @param {number} minutes - Intervalo em minutos
   */
  static startAutoCleanup(minutes = 60) {
    const interval = minutes * 60 * 1000;
    console.log(`⏰ Limpeza automática de cache configurada para cada ${minutes} minuto(s)`);

    setInterval(() => {
      console.log('🔄 Executando limpeza automática de cache...');
      this.clearZaitPayData();
    }, interval);
  }
}

// Exportar para uso global
window.CacheManager = CacheManager;

// Atalhos de console para fácil acesso
window.clearCache = () => CacheManager.clearAll();
window.clearZaitCache = () => CacheManager.clearZaitPayData();
window.showCache = () => CacheManager.showCacheInfo();
window.clearCacheBtn = () => CacheManager.createClearCacheButton();

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║           🗑️  CACHE MANAGER CARREGADO                 ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log('Comandos disponíveis no console:');
console.log('  • clearCache()       - Limpa todo o cache e recarrega');
console.log('  • clearZaitCache()   - Limpa apenas dados do Zait Pay');
console.log('  • showCache()        - Mostra informações de cache');
console.log('  • clearCacheBtn()    - Adiciona botão de limpeza');
console.log('');
console.log('Ou use diretamente:');
console.log('  • CacheManager.clearAll()');
console.log('  • CacheManager.clearZaitPayData()');
console.log('  • CacheManager.showCacheInfo()');
console.log('  • CacheManager.createClearCacheButton()');
console.log('');
