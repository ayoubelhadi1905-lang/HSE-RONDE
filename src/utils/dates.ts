export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateFr(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const parts = isoString.slice(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoString;
  } catch {
    return isoString;
  }
}

export function formatDateTimeFr(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function calculateDaysRemaining(targetDateIso?: string): number | null {
  if (!targetDateIso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateIso);
  target.setHours(0, 0, 0, 0);
  if (isNaN(target.getTime())) return null;

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type ExpirationCheckResult = {
  status: 'VALIDE' | 'EXPIRATION_PROCHE' | 'EXPIRE' | 'MANQUANT';
  daysRemaining: number | null;
  badgeLevel: 'rouge' | 'orange' | 'jaune' | 'vert' | 'neutre';
  label: string;
};

export function checkDateExpiration(expirationDateIso?: string): ExpirationCheckResult {
  if (!expirationDateIso) {
    return {
      status: 'MANQUANT',
      daysRemaining: null,
      badgeLevel: 'neutre',
      label: 'Date non renseignée',
    };
  }

  const days = calculateDaysRemaining(expirationDateIso);
  if (days === null) {
    return {
      status: 'MANQUANT',
      daysRemaining: null,
      badgeLevel: 'neutre',
      label: 'Date invalide',
    };
  }

  if (days < 0) {
    return {
      status: 'EXPIRE',
      daysRemaining: days,
      badgeLevel: 'rouge',
      label: `Expiré depuis ${Math.abs(days)} j`,
    };
  } else if (days <= 30) {
    return {
      status: 'EXPIRATION_PROCHE',
      daysRemaining: days,
      badgeLevel: 'orange',
      label: `Expire dans ${days} j (<30j)`,
    };
  } else if (days <= 60) {
    return {
      status: 'EXPIRATION_PROCHE',
      daysRemaining: days,
      badgeLevel: 'jaune',
      label: `Expire dans ${days} j (<60j)`,
    };
  } else {
    return {
      status: 'VALIDE',
      daysRemaining: days,
      badgeLevel: 'vert',
      label: `Valide (${days} j restants)`,
    };
  }
}

export function addYears(dateIso: string, years: number): string {
  const d = new Date(dateIso);
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
