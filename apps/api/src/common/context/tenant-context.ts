import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId?: string;
  userId?: string;
  role?: string;
  bypassRls?: boolean;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContextStore>();

export class TenantContext {
  static getTenantId(): string | undefined {
    return tenantLocalStorage.getStore()?.tenantId;
  }

  static getUserId(): string | undefined {
    return tenantLocalStorage.getStore()?.userId;
  }

  static getRole(): string | undefined {
    return tenantLocalStorage.getStore()?.role;
  }

  static isBypassRls(): boolean {
    return !!tenantLocalStorage.getStore()?.bypassRls;
  }

  static run<T>(store: TenantContextStore, callback: () => T): T {
    return tenantLocalStorage.run(store, callback);
  }
}
