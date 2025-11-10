export function validateBridgeUrl(bridgeUrl: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(bridgeUrl);
    
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Bridge URL must use HTTP or HTTPS protocol',
      };
    }

    const hostname = url.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^127\.\d+\.\d+\.\d+$/)) {
      return { valid: true };
    }

    if (hostname.match(/^10\.\d+\.\d+\.\d+$/)) {
      return { valid: true };
    }

    if (hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/)) {
      return { valid: true };
    }

    if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
      return { valid: true };
    }

    if (hostname.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.local$/)) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Bridge URL must be on local network (192.168.x.x, 10.x.x.x, etc.) or localhost',
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}
