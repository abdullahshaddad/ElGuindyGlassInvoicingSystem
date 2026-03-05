import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

export function useMyNotifications(skip = false) {
    return useQuery(api.notifications.queries.getMyNotifications, skip ? "skip" : {});
}

export function useUnreadCount(skip = false) {
    return useQuery(api.notifications.queries.getUnreadCount, skip ? "skip" : {});
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
