'use server';

import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { User, Order } from '@/lib/types';

/**
 * Updates a user's status in Firestore.
 * This is a secure server action for administrators.
 * @param userId The UID of the user to update.
 * @param status The new status ('Active' or 'Inactive').
 * @returns An object indicating success or failure.
 */
export async function updateUserStatus(userId: string, status: 'Active' | 'Inactive'): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: 'User ID is required.' };
    }

    try {
        await initFirebaseAdmin();
        const adminDb = getFirestore();
        const userRef = adminDb.collection('users').doc(userId);
        
        await userRef.update({ status: status });

        // Revalidate the path to ensure the UI updates
        revalidatePath('/admin/dashboard/users');

        return { success: true, message: 'User status updated successfully.' };
    } catch (error: any) {
        console.error('Error updating user status:', error);
        return { success: false, message: error.message || 'An error occurred while updating the user status.' };
    }
}


/**
 * Updates a user's subscription plan in Firestore.
 * This is a secure server action for administrators.
 * @param userId The UID of the user to update.
 * @param plan The new plan string.
 * @returns An object indicating success or failure.
 */
export async function updateUserSubscription(userId: string, plan: string): Promise<{ success: boolean; message: string }> {
     if (!userId || !plan) {
        return { success: false, message: 'User ID and plan are required.' };
    }

    try {
        await initFirebaseAdmin();
        const adminDb = getFirestore();
        const userRef = adminDb.collection('users').doc(userId);
        
        await userRef.update({ plan: plan });
        
        revalidatePath('/admin/dashboard/users');

        return { success: true, message: 'User subscription updated successfully.' };
    } catch (error: any) {
        console.error('Error updating user subscription:', error);
        return { success: false, message: 'An error occurred while updating the user subscription.' };
    }
}

/**
 * Fetches a user's profile from Firestore using Admin privileges.
 * @param userId The UID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(userId: string): Promise<User | null> {
    if (!userId) {
        return null;
    }
    try {
        await initFirebaseAdmin();
        const adminDb = getFirestore();
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData) {
                return { 
                    uid: userDoc.id, 
                    name: userData.name,
                    email: userData.email,
                    createdAt: userData.createdAt,
                    plan: userData.plan,
                    cameras: userData.cameras,
                    status: userData.status,
                    avatar: userData.avatar,
                } as User;
            }
        }
    } catch (error) {
        console.error(`Failed to fetch user ${userId} with admin privileges:`, error);
    }
    return null;
}

/**
 * Updates an order in Firestore using Admin SDK.
 * This is a secure server action for administrators.
 * @param orderId The ID of the order to update.
 * @param data The data to update.
 * @returns An object indicating success or failure.
 */
export async function updateOrder(orderId: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<{ success: boolean, message: string }> {
    if (!orderId) {
        return { success: false, message: 'Order ID is required.' };
    }

    try {
        await initFirebaseAdmin();
        const adminDb = getFirestore();
        const orderRef = adminDb.collection('orders').doc(orderId);
        
        await orderRef.update(data);

        revalidatePath('/admin/dashboard/orders');

        return { success: true, message: 'Order updated successfully.' };
    } catch (error: any) {
        console.error('Error updating order with Admin SDK:', error);
        // Re-throw the original error to be caught by the Next.js dev overlay
        // This will provide the full context needed for debugging security rules.
        throw error;
    }
}
