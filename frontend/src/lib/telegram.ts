export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

function parseUserFromInitData(initData: string): TgUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) return null;

    const parsed = JSON.parse(userRaw);
    if (!parsed?.id) return null;

    return parsed as TgUser;
  } catch {
    return null;
  }
}

export function getTelegramUser(): TgUser | null {
  const w = window as any;
  const tg = w?.Telegram?.WebApp;

  const unsafeUser = tg?.initDataUnsafe?.user;
  if (unsafeUser?.id) {
    return unsafeUser as TgUser;
  }

  const initData = tg?.initData ?? "";
  return parseUserFromInitData(initData);
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