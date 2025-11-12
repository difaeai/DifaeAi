import crypto from "crypto";
import pino from "pino";

const logger = pino({ name: "bridge-auth" });

interface BridgeCredentials {
  bridgeId: string;
  apiKey: string;
  name: string;
  createdAt: Date;
}

class BridgeAuthStore {
  private credentials: Map<string, BridgeCredentials> = new Map();

  register(bridgeId: string, apiKey: string, name: string): void {
    this.credentials.set(bridgeId, {
      bridgeId,
      apiKey,
      name,
      createdAt: new Date(),
    });
    logger.info({ bridgeId, name }, "Bridge credentials registered");
  }

  validate(bridgeId: string, apiKey: string): boolean {
    const creds = this.credentials.get(bridgeId);
    if (!creds) {
      logger.warn({ bridgeId }, "Unknown bridge ID");
      return false;
    }
    
    const storedKeyBuffer = Buffer.from(creds.apiKey);
    const providedKeyBuffer = Buffer.from(apiKey);
    
    if (storedKeyBuffer.length !== providedKeyBuffer.length) {
      logger.warn({ bridgeId }, "Invalid API key (length mismatch)");
      return false;
    }
    
    const valid = crypto.timingSafeEqual(storedKeyBuffer, providedKeyBuffer);
    
    if (!valid) {
      logger.warn({ bridgeId }, "Invalid API key");
    }
    
    return valid;
  }

  get(bridgeId: string): BridgeCredentials | undefined {
    return this.credentials.get(bridgeId);
  }

  list(): BridgeCredentials[] {
    return Array.from(this.credentials.values());
  }

  remove(bridgeId: string): void {
    this.credentials.delete(bridgeId);
    logger.info({ bridgeId }, "Bridge credentials removed");
  }
}

export const bridgeAuthStore = new BridgeAuthStore();
export type { BridgeCredentials };
