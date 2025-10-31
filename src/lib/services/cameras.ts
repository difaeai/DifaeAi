"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import type { Camera } from "@/lib/types";

export async function getCamerasForUser(userId: string): Promise<Camera[]> {
    const camerasCollection = collection(db, 'users', userId, 'cameras');
    const q = query(camerasCollection);
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camera));
}

export async function updateCameraForUser(userId: string, cameraId: string, data: Partial<Pick<Camera, 'name' | 'location'>>): Promise<void> {
    const cameraDocRef = doc(db, 'users', userId, 'cameras', cameraId);
    await updateDoc(cameraDocRef, data);
}

export async function deleteCameraForUser(userId: string, cameraId: string): Promise<void> {
    const cameraDocRef = doc(db, 'users', userId, 'cameras', cameraId);
    await deleteDoc(cameraDocRef);
}
