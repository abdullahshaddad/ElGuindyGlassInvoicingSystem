import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

export function useMyNotifications() {
    return useQuery(api.notifications.queries.getMyNotifications, {});
}

export function useUnreadCount() {
    return useQuery(api.notifications.queries.getUnreadCount, {});
}

// ===== MUTATION HOOKS =====

export function useMarkAsRead() {
    return useMutation(api.notifications.mutations.markAsRead);
}

export function useMarkAllAsRead() {
    return useMutation(api.notifications.mutations.markAllAsRead);
}

export function useHideNotification() {
    return useMutation(api.notifications.mutations.hideNotification);
}
