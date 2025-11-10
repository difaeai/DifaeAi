
export interface Product {
    id: string;
    name: string;
    price: number;
    priceDescription: string;
    subscription?: string;
    images?: string[];
    hints: string[];
    title: string;
    description: string;
    longDescription: string;
    features: string[];
    idealFor: string;
    primaryActionText: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
    linkableFeatures?: { text: string; link: string }[];
}

export interface User {
    uid: string;
    name: string;
    email: string;
    createdAt: string;
    plan: string;
    cameras: number;
    status: 'Active' | 'Inactive';
    avatar: string;
}

export interface Order {
    id: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    items: string;
    total: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string; // Stored as ISO string in client state
    uniqueId?: string;
    paymentProofUrl?: string;
    activationDate?: string;
    type?: 'Order' | 'Pre-Booking';
}

export interface Camera {
  id: string;
  userId: string;
  name: string;
  location: string;
  type: string;
  uniqueId: string; // The activation ID or RTSP URL
  status: 'Online' | 'Offline';
  facialRecognition: boolean;
  createdAt: string;
  prohibitedObjects?: string[];
}

export interface LearnedBehavior {
    id: string;
    userId: string;
    cameraId: string;
    prompt: string;
    createdAt: string;
    successfulDetections: number;
    lastDetectedAt: string | null;
}
