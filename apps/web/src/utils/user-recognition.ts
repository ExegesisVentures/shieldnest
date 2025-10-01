/**
 * Enhanced user recognition utilities
 * Helps create a seamless experience for returning users
 */

interface UserFingerprint {
  browserInfo: string;
  screenResolution: string;
  timezone: string;
  language: string;
  userAgent: string;
}

interface UserSession {
  fingerprint: UserFingerprint;
  lastWalletAddress?: string;
  lastEmail?: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
}

/**
 * Generate a browser fingerprint for user recognition
 */
export function generateBrowserFingerprint(): UserFingerprint {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      browserInfo: 'server',
      screenResolution: 'unknown',
      timezone: 'UTC',
      language: 'en',
      userAgent: 'server'
    };
  }

  return {
    browserInfo: `${navigator.platform}_${navigator.hardwareConcurrency || 0}`,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
  };
}

/**
 * Get or create user session data
 */
export function getUserSession(): UserSession {
  if (typeof window === 'undefined') {
    return createNewSession();
  }

  try {
    const stored = localStorage.getItem('user_session');
    if (stored) {
      const session = JSON.parse(stored);
      // Update visit info
      session.visitCount = (session.visitCount || 0) + 1;
      session.lastVisit = new Date().toISOString();
      saveUserSession(session);
      return session;
    }
  } catch (error) {
    console.warn('Failed to parse stored user session:', error);
  }

  return createNewSession();
}

/**
 * Create a new user session
 */
function createNewSession(): UserSession {
  const session: UserSession = {
    fingerprint: generateBrowserFingerprint(),
    visitCount: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString()
  };
  
  saveUserSession(session);
  return session;
}

/**
 * Save user session to localStorage
 */
export function saveUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user_session', JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to save user session:', error);
  }
}

/**
 * Update session with user identification data
 */
export function updateUserSession(updates: Partial<Pick<UserSession, 'lastWalletAddress' | 'lastEmail'>>): void {
  const session = getUserSession();
  
  if (updates.lastWalletAddress) {
    session.lastWalletAddress = updates.lastWalletAddress;
  }
  
  if (updates.lastEmail) {
    session.lastEmail = updates.lastEmail;
  }
  
  saveUserSession(session);
}

/**
 * Check if this appears to be a returning user
 */
export function isLikelyReturningUser(): {
  isReturning: boolean;
  indicators: string[];
  confidence: 'low' | 'medium' | 'high';
} {
  const session = getUserSession();
  const indicators: string[] = [];
  
  // Check visit history
  if (session.visitCount > 1) {
    indicators.push('Multiple visits recorded');
  }
  
  // Check if we have wallet/email history
  if (session.lastWalletAddress) {
    indicators.push('Previous wallet connection found');
  }
  
  if (session.lastEmail) {
    indicators.push('Previous email authentication found');
  }
  
  // Check auth token persistence
  if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
    indicators.push('Authentication token found');
  }
  
  // Check Supabase session
  if (typeof window !== 'undefined' && localStorage.getItem('sb-auth-token')) {
    indicators.push('Supabase session found');
  }
  
  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (indicators.length >= 3) {
    confidence = 'high';
  } else if (indicators.length >= 2) {
    confidence = 'medium';
  }
  
  return {
    isReturning: indicators.length > 0,
    indicators,
    confidence
  };
}

/**
 * Get user preferences for personalization
 */
export function getUserPreferences(): {
  theme?: 'light' | 'dark';
  language?: string;
  lastConnectedWallet?: string;
  preferredWalletType?: string;
} {
  if (typeof window === 'undefined') return {};
  
  const prefs: any = {};
  
  try {
    // Theme preference
    const theme = localStorage.getItem('theme');
    if (theme) prefs.theme = theme;
    
    // Last connected wallet
    const lastWallet = localStorage.getItem('connected_wallet');
    if (lastWallet) {
      const walletData = JSON.parse(lastWallet);
      prefs.lastConnectedWallet = walletData.address;
      prefs.preferredWalletType = walletData.source;
    }
    
    // Language preference
    prefs.language = navigator.language;
    
  } catch (error) {
    console.warn('Failed to get user preferences:', error);
  }
  
  return prefs;
}

/**
 * Welcome message for returning users
 */
export function getWelcomeMessage(): {
  message: string;
  type: 'new' | 'returning' | 'familiar';
} {
  const recognition = isLikelyReturningUser();
  const session = getUserSession();
  const preferences = getUserPreferences();
  
  if (!recognition.isReturning) {
    return {
      message: "Welcome to ShieldNest! Let's get you started.",
      type: 'new'
    };
  }
  
  if (recognition.confidence === 'high') {
    const lastWallet = session.lastWalletAddress || preferences.lastConnectedWallet;
    const walletSuffix = lastWallet ? ` (${lastWallet.substring(0, 6)}...)` : '';
    
    return {
      message: `Welcome back${walletSuffix}! Ready to continue where you left off?`,
      type: 'familiar'
    };
  }
  
  return {
    message: "Welcome back! We've kept your settings safe.",
    type: 'returning'
  };
}

/**
 * Clear user session data (for logout/reset)
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('user_session');
  } catch (error) {
    console.warn('Failed to clear user session:', error);
  }
}
