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
  orderBy,
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
  clientId?: string; // For warehouse admins only
  status: 'active' | 'inactive' | 'pending';
  needsPasswordSetup?: boolean;
  isTemporary?: boolean; // For client_admin onboarding process
  // Driver personal data (when role is 'driver')
  cpf?: string;
  cnh?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
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

// NEW ARCHITECTURE: Driver Assignment (replaces Driver)
export interface DriverAssignment {
  id: string;
  userId: string; // Referência ao User (motorista)
  clientId: string; // Referência ao Client (empresa)
  commissionRate: number; // % de comissão definida pelo client_admin
  status: 'active' | 'inactive'; // Status da relação (não do motorista)
  assignedAt: Timestamp; // Quando foi contratado
  assignedBy: string; // Quem fez a contratação (client_admin)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper interface for driver availability checking
export interface DriverAvailability {
  userId: string;
  user: User;
  isAvailable: boolean; // true se não tem nenhuma atribuição ativa
  activeAssignments: number; // Quantos clientes ativos
  currentClients: string[]; // Nomes dos clientes atuais
  canBeHired: boolean; // Sempre true (pode trabalhar para múltiplos)
}

// DEPRECATED: Keep for migration purposes only
export interface Driver {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  cpf: string;
  cnh: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  commissionRate: number;
  status: 'active' | 'inactive' | 'on_leave';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Truck {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  capacity: number; // Capacidade em kg
  clientId: string;
  currentDriverId?: string; // Motorista atual (pode estar vazio)
  status: 'active' | 'maintenance' | 'inactive';
  createdBy: string;
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

  // Drivers
  static async createDriver(driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'drivers'), {
      ...driverData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getAllDrivers(): Promise<Driver[]> {
    const querySnapshot = await getDocs(collection(db, 'drivers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
  }

  static async getDriversByClient(clientId: string): Promise<Driver[]> {
    console.log('🔍 getDriversByClient called with clientId:', clientId);
    const q = query(collection(db, 'drivers'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    const drivers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
    console.log('🔍 getDriversByClient found drivers:', drivers.length);
    console.log('🔍 getDriversByClient drivers data:', drivers);
    return drivers;
  }

  static async getDriver(driverId: string): Promise<Driver | null> {
    const docRef = doc(db, 'drivers', driverId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Driver;
    }
    return null;
  }

  static async updateDriver(driverId: string, data: Partial<Driver>) {
    await this.updateDocument('drivers', driverId, data);
  }

  static async deleteDriver(driverId: string) {
    await this.deleteDocument('drivers', driverId);
  }

  // Trucks
  static async createTruck(truckData: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'trucks'), {
      ...truckData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getAllTrucks(): Promise<Truck[]> {
    const querySnapshot = await getDocs(collection(db, 'trucks'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Truck));
  }

  static async getTrucksByClient(clientId: string): Promise<Truck[]> {
    const q = query(collection(db, 'trucks'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Truck));
  }

  static async getTruck(truckId: string): Promise<Truck | null> {
    const docRef = doc(db, 'trucks', truckId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Truck;
    }
    return null;
  }

  static async updateTruck(truckId: string, data: Partial<Truck>) {
    await this.updateDocument('trucks', truckId, data);
  }

  static async deleteTruck(truckId: string) {
    await this.deleteDocument('trucks', truckId);
  }

  static async assignDriverToTruck(truckId: string, driverId: string) {
    await this.updateDocument('trucks', truckId, { currentDriverId: driverId });
  }

  // Additional helper methods for dependency checking
  static async getTrucksByDriver(driverId: string): Promise<Truck[]> {
    const q = query(collection(db, 'trucks'), where('currentDriverId', '==', driverId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Truck));
  }

  static async getActiveNotesByDriver(driverId: string): Promise<Note[]> {
    const q = query(
      collection(db, 'notes'), 
      where('driverId', '==', driverId),
      where('status', 'in', ['loading', 'on_route'])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  }

  static async getActiveNotesByTruck(truckId: string): Promise<Note[]> {
    const q = query(
      collection(db, 'notes'), 
      where('truckId', '==', truckId),
      where('status', 'in', ['loading', 'on_route'])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  }

  // NEW ARCHITECTURE: Driver Assignment functions
  static async createDriverAssignment(assignmentData: Omit<DriverAssignment, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'driverAssignments'), {
      ...assignmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  static async getDriverAssignmentsByClient(clientId: string): Promise<DriverAssignment[]> {
    const q = query(
      collection(db, 'driverAssignments'), 
      where('clientId', '==', clientId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DriverAssignment));
  }

  static async getDriverAssignmentsByUser(userId: string): Promise<DriverAssignment[]> {
    const q = query(
      collection(db, 'driverAssignments'), 
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DriverAssignment));
  }

  static async getDriverAvailability(userId: string): Promise<DriverAvailability> {
    // Get user data
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all active assignments for this driver
    const assignments = await this.getDriverAssignmentsByUser(userId);
    
    // Get client names for current assignments
    const clientPromises = assignments.map(assignment => 
      this.getClient(assignment.clientId)
    );
    const clients = await Promise.all(clientPromises);
    const currentClients = clients.filter(Boolean).map(client => client!.name);

    return {
      userId,
      user,
      isAvailable: assignments.length === 0,
      activeAssignments: assignments.length,
      currentClients,
      canBeHired: true // Always true - drivers can work for multiple clients
    };
  }

  static async getAvailableDrivers(): Promise<User[]> {
    // Get all users with role 'driver' and status 'active'
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'driver'),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  static async updateDriverAssignment(assignmentId: string, data: Partial<DriverAssignment>) {
    await this.updateDocument('driverAssignments', assignmentId, data);
  }

  static async deleteDriverAssignment(assignmentId: string) {
    await this.deleteDocument('driverAssignments', assignmentId);
  }

  static async getAllDriverAssignments(): Promise<DriverAssignment[]> {
    console.log('📋 Getting all driver assignments');
    const q = query(
      collection(db, 'driverAssignments'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const assignments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DriverAssignment[];
    
    console.log('📊 Found assignments:', assignments.length);
    return assignments;
  }

  static async getClient(clientId: string): Promise<Client | null> {
    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Client;
    }
    return null;
  }
}