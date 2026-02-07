// DApp Proxy - Fetches DApp content and injects our EIP-1193 provider
// This allows AI Guard to intercept transactions from any DApp

import type { RequestHandler } from '@sveltejs/kit';

// EIP-1193 Provider injection script
const PROVIDER_INJECTION_SCRIPT = `
<script>
(function() {
  // Create our injected provider
  const coinfiProvider = {
    isCoinFi: true,
    isMetaMask: true, // Compatibility
    _events: {},
    _state: {
      accounts: [],
      chainId: null,
      isConnected: false
    },
    
    // EIP-1193 request method
    request: async function(args) {
      return new Promise((resolve, reject) => {
        const id = Date.now() + Math.random();
        
        // Post message to parent (our wallet)
        window.parent.postMessage({
          type: 'WEB3_REQUEST',
          payload: { id, method: args.method, params: args.params || [] }
        }, '*');
        
        // Listen for response
        const handler = (event) => {
          if (event.data?.type === 'WEB3_RESPONSE' && event.data?.id === id) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        
        // Timeout after 30s
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Request timeout'));
        }, 30000);
      });
    },
    
    // Legacy send methods
    send: function(method, params) {
      if (typeof method === 'string') {
        return this.request({ method, params });
      }
      return this.request(method);
    },
    
    sendAsync: function(payload, callback) {
      this.request(payload)
        .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
        .catch(error => callback(error, null));
    },
    
    // Event handling
    on: function(event, handler) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(handler);
      return this;
    },
    
    removeListener: function(event, handler) {
      if (this._events[event]) {
        this._events[event] = this._events[event].filter(h => h !== handler);
      }
      return this;
    },
    
    emit: function(event, ...args) {
      if (this._events[event]) {
        this._events[event].forEach(handler => handler(...args));
      }
    },
    
    // EIP-1193 properties
    isConnected: function() { return this._state.isConnected; },
    
    // Enable (deprecated but used by some DApps)
    enable: function() {
      return this.request({ method: 'eth_requestAccounts' });
    }
  };
  
  // Listen for state updates from parent
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'WALLET_STATE') {
      coinfiProvider._state.accounts = event.data.accounts || [];
      coinfiProvider._state.chainId = event.data.chainId;
      coinfiProvider._state.isConnected = event.data.accounts?.length > 0;
      
      // Emit events
      if (event.data.accounts) {
        coinfiProvider.emit('accountsChanged', event.data.accounts);
      }
      if (event.data.chainId) {
        coinfiProvider.emit('chainChanged', event.data.chainId);
      }
      if (coinfiProvider._state.isConnected) {
        coinfiProvider.emit('connect', { chainId: event.data.chainId });
      }
    }
  });
  
  // Request initial state
  window.parent.postMessage({ type: 'WALLET_STATE_REQUEST' }, '*');
  
  // Inject as window.ethereum BEFORE any other scripts run
  Object.defineProperty(window, 'ethereum', {
    value: coinfiProvider,
    writable: false,
    configurable: false
  });
  
  // Also set window.web3 for legacy DApps
  window.web3 = { currentProvider: coinfiProvider };
  
  // Announce provider (EIP-6963)
  window.dispatchEvent(new Event('ethereum#initialized'));
  
  console.log('[CoinFi] AI Guard provider injected');
})();
</script>
`;

export const GET: RequestHandler = async ({ url, fetch }) => {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch the target page
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CoinFi/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    // Only inject into HTML
    if (!contentType.includes('text/html')) {
      // Pass through non-HTML content
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    let html = await response.text();

    // Inject our provider script at the very beginning of <head>
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + PROVIDER_INJECTION_SCRIPT);
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', '<HEAD>' + PROVIDER_INJECTION_SCRIPT);
    } else {
      // If no head tag, add to start
      html = PROVIDER_INJECTION_SCRIPT + html;
    }

    // Rewrite relative URLs to absolute
    const baseUrl = new URL(targetUrl);

    // Rewrite src and href attributes
    html = html.replace(/(src|href)=["'](?!https?:\/\/|\/\/|data:|#)([^"']+)["']/g, (match, attr, path) => {
      const absoluteUrl = new URL(path, baseUrl).href;
      return `${attr}="${absoluteUrl}"`;
    });

    // Remove X-Frame-Options and CSP that would block embedding
    // (We're proxying, so these don't apply to our context)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[DApp Proxy] Error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
};
