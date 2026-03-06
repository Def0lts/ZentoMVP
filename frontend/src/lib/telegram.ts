export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export function getTelegramUser(): TgUser | null {
  const w = window as any;
  const tg = w?.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  if (!user?.id) return null;
  return user as TgUser;
}




export function getTelegramId(fallback = 1111): number {
  const u = getTelegramUser();
  return u?.id ?? fallback;
}

export function getTelegramInitData(): string {
  const w = window as any;
  const tg = w?.Telegram?.WebApp;
  return tg?.initData ?? "";
}

export function isTelegramWebApp(): boolean {
  const w = window as any;
  return !!w?.Telegram?.WebApp;
}

export function initTelegramWebApp() {
  const w = window as any;
  const tg = w?.Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
  } catch {
    // ignore
  }
}