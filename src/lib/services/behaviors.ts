
"use client";

import { db } from "@/lib/firebase";
import { LearnedBehavior } from "@/lib/types";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";

export async function getLearnedBehaviors(userId: string, cameraId: string): Promise<LearnedBehavior[]> {
    const behaviorsCollection = collection(db, 'users', userId, 'cameras', cameraId, 'learned_behaviors');
    const q = query(behaviorsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return { id: doc.id, ...data, createdAt } as LearnedBehavior;
    });
}

export async function saveLearnedBehavior(userId: string, cameraId: string, prompt: string): Promise<LearnedBehavior> {
    if (!userId || !cameraId || !prompt) {
        throw new Error("User ID, Camera ID, and prompt are required to save a behavior.");
    }
    const behaviorsCollection = collection(db, 'users', userId, 'cameras', cameraId, 'learned_behaviors');
    
    try {
        // Use serverTimestamp() to let Firestore generate the timestamp
        const newBehaviorData = {
            userId,
            cameraId,
            prompt,
            createdAt: serverTimestamp(),
            successfulDetections: 0,
            lastDetectedAt: null,
        };

        const docRef = await addDoc(behaviorsCollection, newBehaviorData);
        
        // Fetch the document we just created to get the generated timestamp
        const newDocSnap = await getDoc(docRef);
        if (!newDocSnap.exists()) {
             throw new Error("Failed to retrieve the saved behavior immediately after creation.");
        }
        
        const savedData = newDocSnap.data();
        // The timestamp will be a Timestamp object from the server, convert it to ISO string for the client
        const createdAt = (savedData.createdAt as Timestamp).toDate().toISOString();

        return {
            id: newDocSnap.id,
            userId: savedData.userId,
            cameraId: savedData.cameraId,
            prompt: savedData.prompt,
            successfulDetections: savedData.successfulDetections,
            lastDetectedAt: savedData.lastDetectedAt,
            createdAt,
        } as LearnedBehavior;

    } catch (error) {
        console.error("Error writing new behavior to Firestore:", error);
        // Re-throw a more user-friendly error to be caught by the UI
        throw new Error("Could not save the new behavior to the database.");
    }
}


export async function deleteLearnedBehavior(userId: string, cameraId: string, behaviorId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'cameras', cameraId, 'learned_behaviors', behaviorId);
    await deleteDoc(docRef);
}
