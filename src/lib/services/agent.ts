
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getProhibitedObjects(userId: string, cameraId: string): Promise<string[]> {
    const docRef = doc(db, 'users', userId, 'cameras', cameraId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().prohibitedObjects || [];
    }
    return [];
}

export async function saveProhibitedObjects(objects: string[], userId: string, cameraId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'cameras', cameraId);
    await setDoc(docRef, { prohibitedObjects: objects }, { merge: true });
}
