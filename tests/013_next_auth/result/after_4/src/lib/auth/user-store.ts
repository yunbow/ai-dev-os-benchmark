/**
 * 開発用インメモリユーザーストア。
 *
 * WARNING: サーバー再起動でデータが消える。本番では Prisma + DB に差し替えること。
 * globalThis パターンで Next.js HMR 時のインスタンス重複を防ぐ。
 */

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

const globalForStore = globalThis as typeof globalThis & {
  __userStore?: Map<string, StoredUser>;
};

const store: Map<string, StoredUser> =
  globalForStore.__userStore ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__userStore = store;
}

export const userStore = {
  findByEmail(email: string): StoredUser | undefined {
    for (const user of store.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return undefined;
  },

  findById(id: string): StoredUser | undefined {
    return store.get(id);
  },

  create(user: Omit<StoredUser, "createdAt">): StoredUser {
    const stored: StoredUser = { ...user, createdAt: new Date() };
    store.set(user.id, stored);
    return stored;
  },
};
