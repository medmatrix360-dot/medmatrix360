/**
 * BrandingContext — White-Label Theme Engine
 *
 * Usage:
 *   - Wrap <App> in <BrandingProvider>
 *   - Call useBranding() to access { branding, hospitalName, loadBranding, resetBranding }
 *   - Branding is auto-applied as CSS custom properties on :root
 *   - Stored in localStorage so it persists across page refreshes
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hospitalAPI, publicAPI, baseURL } from '../utils/api';
import socket from '../utils/socket';
import { resolveHostnameSync, PORTAL_TYPES } from '../utils/hostnameResolver';

// Default MedMatrix 360 branding (platform defaults)
const DEFAULT_BRANDING = {
    appName: 'MedMatrix 360',
    tagline: 'Healthcare Suite',
    logoUrl: '/assets/logo.png',
    faviconUrl: '/favicon.png',
    primaryColor: '#D85F89',
    secondaryColor: '#0a2647',
    accentColor: '#6366f1',
    successColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    supportEmail: '',
    supportPhone: '',
    address: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    footerText: '',
};

const BrandingContext = createContext({
    branding: DEFAULT_BRANDING,
    hospitalName: 'MedMatrix 360',
    hospitalId: null,
    loadBranding: async () => {},
    resetBranding: () => {},
    isCustomBranded: false,
});

/**
 * Apply a branding config as CSS custom properties on :root
 * This drives the entire color system from index.css tokens.
 */
function applyBrandingToCSS(branding) {
    const root = document.documentElement;

    const hex2rgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    const safehex = (v, fallback) => (v && v.startsWith('#') ? v : fallback);

    const primary = safehex(branding.primaryColor, DEFAULT_BRANDING.primaryColor);
    const secondary = safehex(branding.secondaryColor, DEFAULT_BRANDING.secondaryColor);
    const accent = safehex(branding.accentColor, DEFAULT_BRANDING.accentColor);
    const success = safehex(branding.successColor, DEFAULT_BRANDING.successColor);
    const bg = safehex(branding.backgroundColor, DEFAULT_BRANDING.backgroundColor);
    const text = safehex(branding.textColor, DEFAULT_BRANDING.textColor);

    // Override brand color scale using the primary color
    root.style.setProperty('--brand-500', primary);
    root.style.setProperty('--brand-600', primary);
    root.style.setProperty('--brand-700', secondary);
    root.style.setProperty('--brand-50',  `rgba(${hex2rgb(primary)}, 0.08)`);
    root.style.setProperty('--brand-100', `rgba(${hex2rgb(primary)}, 0.14)`);

    // Add CSS properties as requested by White-Label Phase 4
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--bg-color', bg);

    // Navy overrides (use secondaryColor as the deep dark)
    root.style.setProperty('--navy-900', secondary);
    root.style.setProperty('--navy-800', secondary);
    root.style.setProperty('--navy-700', secondary);

    // Gradients (overriding CSS vars that the gradients reference)
    root.style.setProperty('--gradient-brand', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
    root.style.setProperty('--gradient-navy',  `linear-gradient(135deg, ${secondary} 0%, ${secondary}cc 100%)`);
    root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${success} 0%, ${success}dd 100%)`);

    // Shadows using brand color
    root.style.setProperty('--shadow-brand', `0 8px 24px rgba(${hex2rgb(primary)}, 0.28)`);

    // Surface / Background
    root.style.setProperty('--surface-1', bg);

    // Text color
    root.style.setProperty('--gray-900', text);
    root.style.setProperty('--gray-800', text);

    // Favicon (dynamic with fallback)
    const faviconHref = branding.faviconUrl || branding.logoUrl || branding.logo || '/assets/medical365fav.jpg';
    let fav = document.querySelector("link[rel*='icon']");
    if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
    }
    fav.href = faviconHref;

    // Page title / app name
    if (branding.appName) {
        document.title = branding.appName;
    }
}

/**
 * Remove all branding overrides — back to defaults
 */
function resetBrandingFromCSS() {
    const root = document.documentElement;
    const overrides = [
        '--brand-500', '--brand-600', '--brand-700', '--brand-50', '--brand-100',
        '--navy-900', '--navy-800', '--navy-700',
        '--gradient-brand', '--gradient-navy', '--gradient-success',
        '--shadow-brand', '--surface-1', '--gray-900', '--gray-800',
    ];
    overrides.forEach(v => root.style.removeProperty(v));
    document.title = 'MedMatrix 360';

    // Reset favicon to default
    const fav = document.querySelector("link[rel*='icon']");
    if (fav) {
        fav.href = '/favicon.png';
    }
}

export const BrandingProvider = ({ children }) => {
    const [branding, setBranding] = useState(() => {
        try {
            const saved = localStorage.getItem('hospitalBranding');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.appName === 'Medical 365' || parsed.appName === 'Medical365') {
                    parsed.appName = 'MedMatrix 360';
                }
                if (parsed.faviconUrl === '/assets/medical365fav.jpg' || parsed.faviconUrl === '/assets/logo.png') {
                    parsed.faviconUrl = '/favicon.png';
                }
                return parsed;
            }
            return DEFAULT_BRANDING;
        } catch { return DEFAULT_BRANDING; }
    });

    const [hospitalName, setHospitalName] = useState(() => {
        const saved = localStorage.getItem('hospitalBrandingName');
        if (!saved || saved === 'Medical 365' || saved === 'Medical365') return 'MedMatrix 360';
        return saved;
    });
    const [hospitalId, setHospitalId] = useState(() => localStorage.getItem('hospitalBrandingId') || null);
    const [isCustomBranded, setIsCustomBranded] = useState(false);

    /**
     * Fetch and apply branding for a specific hospital
     * Can be called from login page, hospital slug resolution, or admin preview
     */
    const loadBranding = useCallback(async (hId) => {
        if (!hId) return;
        try {
            const res = await hospitalAPI.getBranding(hId);
            if (res.success) {
                const merged = { ...DEFAULT_BRANDING, ...res.branding };
                setBranding(merged);
                setHospitalName(res.hospitalName || 'MedMatrix 360');
                setHospitalId(hId);
                setIsCustomBranded(true);
                applyBrandingToCSS(merged);
                // Persist so page refresh retains branding
                localStorage.setItem('hospitalBranding', JSON.stringify(merged));
                localStorage.setItem('hospitalBrandingName', res.hospitalName || '');
                localStorage.setItem('hospitalBrandingId', hId);
            }
        } catch (err) {
            console.warn('[Branding] Could not load hospital branding:', err?.message);
        }
    }, []);

    /**
     * Reset to default Medical 365 branding
     */
    const resetBranding = useCallback(() => {
        setBranding(DEFAULT_BRANDING);
        setHospitalName('MedMatrix 360');
        setHospitalId(null);
        setIsCustomBranded(false);
        resetBrandingFromCSS();
        localStorage.removeItem('hospitalBranding');
        localStorage.removeItem('hospitalBrandingName');
        localStorage.removeItem('hospitalBrandingId');
    }, []);

    // Auto-detect white-label domain on mount
    useEffect(() => {
        const initBranding = async () => {
            const injectedTenantId = import.meta.env.VITE_APP_TENANT_ID;
            let fetchedFromDomain = false;

            // ── Hostname-aware branding: skip for ADMIN and INVALID portals ──
            const syncResult = resolveHostnameSync(window.location.hostname);
            const portalType = syncResult?.type;
            
            // ADMIN portals use default Medical365 branding — no hospital branding
            if (portalType === PORTAL_TYPES.ADMIN) {
                applyBrandingToCSS(DEFAULT_BRANDING);
                return;
            }
            
            // INVALID hostnames should NOT load any branding
            if (portalType === PORTAL_TYPES.INVALID) {
                return;
            }

            try {
                let response = null;
                const domain = window.location.hostname;

                if (injectedTenantId) {
                    // Mobile build specific injection overrides hostname
                    response = await fetch(`${baseURL}/api/public/branding?tenantId=${injectedTenantId}`);
                } else {
                    // Web browser normal flow
                    const isBaseDomain = domain === 'medical365.in' || domain === 'www.medical365.in' || domain === 'localhost';
                    if (!isBaseDomain) {
                        response = await fetch(`${baseURL}/api/public/branding?domain=${domain}`);
                    }
                }

                if (response) {
                    if (response.ok) {
                        const res = await response.json();
                        if (res && res.branding) {
                            // Extract Phase 1 themeColors
                            const customTheme = res.branding.themeColors || {};
                            const merged = { 
                                ...DEFAULT_BRANDING, 
                                ...res.branding,
                                primaryColor: customTheme.primary || DEFAULT_BRANDING.primaryColor,
                                secondaryColor: customTheme.secondary || DEFAULT_BRANDING.secondaryColor,
                                backgroundColor: customTheme.background || DEFAULT_BRANDING.backgroundColor
                            };
                            setBranding(merged);
                            setHospitalName(res.branding.appName || 'Medical 365');
                            setIsCustomBranded(true);
                            applyBrandingToCSS(merged);
                            fetchedFromDomain = true;
                        }
                    } else if (response.status === 404) {
                        console.info(`[Branding] White-label config not found. Using defaults.`);
                    } else if (response.status === 429) {
                        // Rate-limited — silently ignore, will retry on next load
                    } else {
                        console.error('[Branding] Failed to fetch custom branding', response.status);
                    }
                }
            } catch (error) {
                console.error('[Branding] Network error fetching branding:', error);
            }

            // Fallback to localStorage if no custom domain branding was fetched
            // IMPORTANT: Only use cached branding if the hostname is a valid portal
            if (!fetchedFromDomain) {
                const saved = localStorage.getItem('hospitalBranding');
                if (saved && portalType !== PORTAL_TYPES.INVALID && portalType !== PORTAL_TYPES.NETWORK_ERROR) {
                    try {
                        const b = JSON.parse(saved);
                        applyBrandingToCSS(b);
                        setIsCustomBranded(true);
                    } catch { /* ignore */ }
                }
            }
        };

        initBranding();
    }, []);

    // Listen for live branding updates from server (Central Admin)
    useEffect(() => {
        const handleUpdate = (data) => {
            // Only update if it's the current hospital or if we're a hospital user
            if (hospitalId && String(data.hospitalId) === String(hospitalId)) {
                console.log('[Branding] Live update received from server for hospital:', data.hospitalId);
                loadBranding(data.hospitalId);
            }
        };

        socket.on('branding_update', handleUpdate);
        return () => socket.off('branding_update', handleUpdate);
    }, [hospitalId, loadBranding]);


    return (
        <BrandingContext.Provider value={{ branding, hospitalName, hospitalId, loadBranding, resetBranding, isCustomBranded }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => useContext(BrandingContext);
export default BrandingContext;
