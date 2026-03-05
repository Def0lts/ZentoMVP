export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

declare global {
  interface Window {
    Telegram?: any;
  }
}

export function isTelegramWebApp(): boolean {
  return !!window.Telegram?.WebApp;
}

export function getTelegramUser(): TgUser | null {
  try {
    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    return u?.id ? (u as TgUser) : null;
  } catch {
    return null;
  }
}

export function getTelegramId(fallback = 1111): number {
  return getTelegramUser()?.id ?? fallback;
}

export function setupTelegramWebAppUI() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  // tg.expand(); // можно включить позже
}