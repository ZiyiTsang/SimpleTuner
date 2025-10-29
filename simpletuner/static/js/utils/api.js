/**
 * Shared API helper for resolving endpoints across deployment modes.
 * Provides consistent handling for trainer/front-end split setups, including callback endpoints.
 */
(function (global) {
    const DEFAULT_OPTIONS = { forceApi: false, forceCallback: false };

    function normalizePath(path) {
        if (typeof path !== "string" || path.length === 0) {
            return "/";
        }
        return path.startsWith("/") ? path : `/${path}`;
    }

    function getBaseOrigin() {
        return global.location ? global.location.origin : "";
    }

    const ApiClient = {
        get apiBaseUrl() {
            return (global.ServerConfig && global.ServerConfig.apiBaseUrl) || getBaseOrigin();
        },

        get callbackBaseUrl() {
            if (global.ServerConfig && global.ServerConfig.callbackUrl) {
                return global.ServerConfig.callbackUrl;
            }
            return this.apiBaseUrl;
        },

        resolve(path, options = {}) {
            const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
            const normalized = normalizePath(path);
            const config = global.ServerConfig;

            if (resolvedOptions.forceCallback) {
                return `${this.callbackBaseUrl}${normalized}`;
            }

            if (resolvedOptions.forceApi) {
                return `${this.apiBaseUrl}${normalized}`;
            }

            if (config && typeof config.getEndpointUrl === "function") {
                return config.getEndpointUrl(normalized);
            }

            // Handle duplicate /api prefix when apiBaseUrl already contains /api
            let finalPath = normalized;
            const apiBase = this.apiBaseUrl;
            
            // Enhanced duplicate prefix detection logic
            // If apiBaseUrl ends with /api and path starts with /api, remove duplicate
            if (apiBase.endsWith('/api') && normalized.startsWith('/api/')) {
                finalPath = normalized.substring(4); // Remove '/api' prefix
            } else if (apiBase.endsWith('/api/') && normalized.startsWith('/api/')) {
                finalPath = normalized.substring(5); // Remove '/api/' prefix
            }
            
            return `${apiBase}${finalPath}`;
        },

        resolveWebsocket(path, options = {}) {
            const httpUrl = this.resolve(path, options);
            if (httpUrl.startsWith("https://")) {
                return `wss://${httpUrl.slice(8)}`;
            }
            if (httpUrl.startsWith("http://")) {
                return `ws://${httpUrl.slice(7)}`;
            }
            return httpUrl.replace(/^http/, "ws");
        },

        fetch(path, fetchOptions = {}, resolveOptions = {}) {
            const url = this.resolve(path, resolveOptions);
            return global.fetch(url, fetchOptions);
        },
    };

    global.ApiClient = ApiClient;
})(window);
