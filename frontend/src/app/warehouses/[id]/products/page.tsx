'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import { FirestoreService, Product, Warehouse } from '@/lib/firestore';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/providers/AuthProvider';

export default function WarehouseProductsPage() {
  const { role, user } = useAuth();
  const params = useParams();
  const warehouseId = params.id as string;
  
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId, showOnlyActive]);

  const loadData = async () => {
    try {
      const [warehouseData, productsData] = await Promise.all([
        FirestoreService.getWarehouse(warehouseId),
        showOnlyActive 
          ? FirestoreService.getActiveProductsByWarehouse(warehouseId)
          : FirestoreService.getProductsByWarehouse(warehouseId)
      ]);
      
      setWarehouse(warehouseData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can add products to this warehouse
  const canAddProducts = () => {
    if (role === ROLES.APP_ADMIN) return true;
    if (role === ROLES.WAREHOUSE_ADMIN && warehouse && user?.uid === warehouse.ownerId) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Galpão não encontrado</h3>
          <p className="text-gray-600">O galpão solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN, ROLES.DRIVER]}>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium"
                >
                  ← Voltar
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Produtos - {warehouse.name}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {warehouse.city}, {warehouse.state} • Gerente: {warehouse.managerName}
                  </p>
                </div>
              </div>

              {/* Add Product Button - Only for app admin or warehouse owner */}
              {canAddProducts() && (
                <a
                  href={`/products?warehouse=${warehouseId}`}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                  <span>📦</span>
                  <span>Adicionar Produto</span>
                </a>
              )}
            </div>

            {/* Warehouse Status */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                    warehouse.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {warehouse.status === 'active' ? '🟢 Galpão Ativo' : '🔴 Galpão Inativo'}
                  </span>
                  
                  {warehouse.ownerName && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">👑</span>
                      <span className="font-medium text-blue-600">Dono: {warehouse.ownerName}</span>
                    </div>
                  )}
                </div>

                {/* Filter Toggle */}
                {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Mostrar apenas ativos:</label>
                    <input
                      type="checkbox"
                      checked={showOnlyActive}
                      onChange={(e) => setShowOnlyActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {product.imageUrl && (
                  <div className="h-48 bg-gray-200">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                      {!showOnlyActive && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'active' ? '🟢' : '🔴'}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-700">⚖️ Peso:</span>
                      <span className="font-medium">{product.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">📦 Estoque:</span>
                      <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-700">Preço</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {product.price.toFixed(2)}
                      </p>
                      {product.stock === 0 && (
                        <p className="text-xs text-red-500 mt-1">Fora de estoque</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {showOnlyActive ? 'Nenhum produto ativo' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-gray-600 mb-6">
                {showOnlyActive 
                  ? 'Este galpão não possui produtos ativos no momento'
                  : 'Este galpão ainda não possui produtos cadastrados'
                }
              </p>
              {!showOnlyActive && (role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                <a
                  href="/products"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium inline-block"
                >
                  + Adicionar Produtos
                </a>
              )}
            </div>
          )}

          {/* Summary Card */}
          {products.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Resumo do Galpão</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                  <p className="text-sm text-gray-700">
                    {showOnlyActive ? 'Produtos Ativos' : 'Total de Produtos'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {products.reduce((sum, p) => sum + p.stock, 0)}
                  </p>
                  <p className="text-sm text-gray-700">Total em Estoque</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(products.map(p => p.category)).size}
                  </p>
                  <p className="text-sm text-gray-700">Categorias</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-700">Valor Total</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}