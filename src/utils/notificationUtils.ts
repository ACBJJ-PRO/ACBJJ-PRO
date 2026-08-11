import { Notification, User } from '../types';

export function getUserKey(user: User | null): string {
  if (!user) return 'guest';
  return String(user.id || user.email || user.nome || 'guest');
}

/**
 * Legacy soft-delete helper maintained for backwards compatibility,
 * but no longer relied upon as the primary deletion mechanism.
 */
export function getUserDeletedNotifIds(userKey: string): string[] {
  try {
    const saved = localStorage.getItem(`arena_deleted_notifs_${userKey}`);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Legacy compatibility stub. Returns updated array of deleted IDs for local cache.
 */
export function deleteUserNotification(userKey: string, notifId: string): string[] {
  const current = getUserDeletedNotifIds(userKey);
  if (!current.includes(notifId)) {
    const updated = [...current, notifId];
    try {
      localStorage.setItem(`arena_deleted_notifs_${userKey}`, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  }
  return current;
}

/**
 * Legacy compatibility stub.
 */
export function deleteAllUserNotifications(userKey: string, notifIds: string[]): string[] {
  const current = getUserDeletedNotifIds(userKey);
  const updated = Array.from(new Set([...current, ...notifIds]));
  try {
    localStorage.setItem(`arena_deleted_notifs_${userKey}`, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

export function getUserReadNotifIds(userKey: string): string[] {
  try {
    const saved = localStorage.getItem(`arena_read_notifs_${userKey}`);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function markUserNotifsAsRead(userKey: string, notifIds: string[]): string[] {
  const current = getUserReadNotifIds(userKey);
  const updated = Array.from(new Set([...current, ...notifIds]));
  try {
    localStorage.setItem(`arena_read_notifs_${userKey}`, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

/**
 * Filters active, non-deleted notifications intended for a specific user.
 */
export function getUserScopedNotifications(
  notificacoes: Notification[],
  user: User | null,
  includeArchived: boolean = false
): Notification[] {
  if (!user || !notificacoes || notificacoes.length === 0) return [];

  const userKey = getUserKey(user);
  const deletedIds = getUserDeletedNotifIds(userKey);

  const uName = (user.nome || '').toLowerCase().trim();
  const uEmail = (user.email || '').toLowerCase().trim();
  const uType = (user.tipo || '').toLowerCase().trim();

  return notificacoes.filter((n) => {
    if (!n.id) return false;
    
    // Ignore soft-deleted IDs if any lingering in legacy storage
    if (deletedIds.includes(n.id)) return false;

    // Filter out archived unless explicitly requested
    if (!includeArchived && n.arquivada) return false;

    const target = (n.para || '').toLowerCase().trim();

    // Broadcasts
    if (
      target === 'enviar para todos' ||
      target === 'todos' ||
      target === 'todos os usuários' ||
      target === 'todos os usuarios' ||
      target === 'todos os alunos'
    ) {
      return true;
    }

    // Direct recipient match
    if (target === uName || target === uEmail) {
      return true;
    }

    // Role specific
    if (uType === 'aluno') {
      return (
        target === 'todos os alunos' ||
        target === 'aluno' ||
        target === 'alunos' ||
        (n.faixaTarget && user.faixa && n.faixaTarget.toLowerCase() === user.faixa.toLowerCase())
      );
    } else if (uType === 'professor' || uType === 'instrutor') {
      return (
        target === 'professores' ||
        target === 'todos os professores' ||
        target === 'professor' ||
        target === 'instrutores' ||
        target === 'instrutor'
      );
    } else if (uType === 'arbitro') {
      return target === 'árbitros' || target === 'arbitros' || target === 'árbitro' || target === 'arbitro';
    } else if (uType === 'secretaria') {
      return target === 'secretaria';
    } else if (uType === 'financeiro') {
      return target === 'financeiro';
    } else if (uType === 'admin') {
      return true; // Admin sees all system notifications
    }

    return false;
  });
}

export function getUserUnreadCount(notificacoes: Notification[], user: User | null): number {
  if (!user) return 0;
  const userKey = getUserKey(user);
  const scopedNotifs = getUserScopedNotifications(notificacoes, user);
  const readIds = getUserReadNotifIds(userKey);
  return scopedNotifs.filter((n) => !readIds.includes(n.id) && n.status !== 'Lida').length;
}

// --- DEFINITIVE PERMANENT DELETION & MAINTENANCE HELPERS ---

/**
 * Permanently removes a notification by ID from the central notification array.
 */
export function permanentlyDeleteNotification(notificacoes: Notification[], notifId: string): Notification[] {
  return notificacoes.filter((n) => n.id !== notifId);
}

/**
 * Permanently removes multiple notifications by ID list.
 */
export function permanentlyDeleteMultipleNotifications(notificacoes: Notification[], notifIds: string[]): Notification[] {
  const set = new Set(notifIds);
  return notificacoes.filter((n) => !set.has(n.id));
}

/**
 * Permanently removes notifications of a specific category.
 */
export function permanentlyDeleteByCategory(notificacoes: Notification[], categoria: string): Notification[] {
  if (categoria === 'Todas') return [];
  const catLower = categoria.toLowerCase().trim();
  return notificacoes.filter((n) => (n.categoria || 'Aviso').toLowerCase().trim() !== catLower);
}

/**
 * Permanently removes notifications older than a given number of days.
 */
export function permanentlyDeleteByAge(notificacoes: Notification[], days: number): Notification[] {
  const now = Date.now();
  const maxAgeMs = days * 24 * 60 * 60 * 1000;

  return notificacoes.filter((n) => {
    let itemDate = now;
    if (n.data) {
      const parsed = Date.parse(n.data);
      if (!isNaN(parsed)) {
        itemDate = parsed;
      }
    }
    return now - itemDate < maxAgeMs;
  });
}

/**
 * Permanently removes notifications matching a specific read status.
 */
export function permanentlyDeleteByReadStatus(
  notificacoes: Notification[],
  isRead: boolean,
  userKey: string
): Notification[] {
  const readIds = new Set(getUserReadNotifIds(userKey));

  return notificacoes.filter((n) => {
    const itemIsRead = n.status === 'Lida' || readIds.has(n.id) || (n.lidaPor && n.lidaPor.includes(userKey));
    return isRead ? !itemIsRead : itemIsRead;
  });
}

/**
 * Toggles the archived state of a notification.
 */
export function toggleArchiveNotification(notificacoes: Notification[], notifId: string): Notification[] {
  return notificacoes.map((n) => {
    if (n.id === notifId) {
      const isArchived = !n.arquivada;
      return {
        ...n,
        arquivada: isArchived,
        status: isArchived ? 'Arquivada' : 'Enviada',
      };
    }
    return n;
  });
}

/**
 * Records a user view/read on a notification.
 */
export function markNotificationViewed(
  notificacoes: Notification[],
  notifId: string,
  userKey: string
): Notification[] {
  return notificacoes.map((n) => {
    if (n.id === notifId) {
      const readers = n.lidaPor || [];
      if (!readers.includes(userKey)) {
        return {
          ...n,
          visualizacoes: (n.visualizacoes || 0) + 1,
          lidaPor: [...readers, userKey],
          status: 'Lida',
        };
      }
    }
    return n;
  });
}
