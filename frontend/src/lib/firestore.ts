import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Role } from '@/constants/roles';

// Types for your business entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  clientId?: string; // For drivers and warehouse admins
  status: 'active' | 'inactive' | 'pending';
  needsPasswordSetup?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  status: 'active' | 'inactive';
  createdBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  managerName: string; // Responsável pelo galpão
  ownerId: string; // ID do usuário dono do galpão (warehouse_admin)
  ownerName: string; // Nome do dono para facilitar exibição
  status: 'active' | 'inactive';
  createdBy: string; // Quem criou (app_admin)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  weight: number;
  imageUrl?: string;
  warehouseId: string;
  status: 'active' | 'inactive';
  createdBy: string; // Quem criou o produto
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Driver {
  id: string;
  userId: string;
  clientId: string;
  cpf: string;
  cnh: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  commissionRate: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Note {
  id: string;
  truckId: string;
  driverId: string;
  clientId: string;
  totalAmount: number;
  status: 'loading' | 'on_route' | 'completed' | 'canceled';
  departureDate?: Timestamp;
  returnDate?: Timestamp;
  syncStatus: 'synced' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Firestore helper functions
export class FirestoreService {
  // Users
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async createUserWithId(userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return userId;
  }

  static async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  static async getAllUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Clients
  static async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getAllClients(): Promise<Client[]> {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  // Warehouses
  static async createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'warehouses'), {
      ...warehouseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getAllWarehouses(): Promise<Warehouse[]> {
    const querySnapshot = await getDocs(collection(db, 'warehouses'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
  }

  static async getWarehouse(warehouseId: string): Promise<Warehouse | null> {
    const docRef = doc(db, 'warehouses', warehouseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Warehouse;
    }
    return null;
  }

  // Products
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getAllProducts(): Promise<Product[]> {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  static async getProductsByWarehouse(warehouseId: string): Promise<Product[]> {
    const q = query(collection(db, 'products'), where('warehouseId', '==', warehouseId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  // Generic update function
  static async updateDocument(collectionName: string, docId: string, data: Record<string, unknown>) {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  // Generic delete function
  static async deleteDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  // Warehouse-specific functions
  static async updateWarehouseStatus(warehouseId: string, status: 'active' | 'inactive') {
    // Update warehouse status
    await this.updateDocument('warehouses', warehouseId, { status });

    // If deactivating warehouse, deactivate all its products
    if (status === 'inactive') {
      const products = await this.getProductsByWarehouse(warehouseId);
      const updatePromises = products.map(product =>
        this.updateDocument('products', product.id, { status: 'inactive' })
      );
      await Promise.all(updatePromises);
    }
  }

  // Get users by role (for warehouse owner selection)
  static async getUsersByRole(role: Role): Promise<User[]> {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Get warehouses by owner
  static async getWarehousesByOwner(ownerId: string): Promise<Warehouse[]> {
    const q = query(collection(db, 'warehouses'), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
  }

  // Get active products by warehouse (for public viewing)
  static async getActiveProductsByWarehouse(warehouseId: string): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('warehouseId', '==', warehouseId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }
}