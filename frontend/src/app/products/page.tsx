'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import { FirestoreService, Product, Warehouse } from '@/lib/firestore';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/providers/AuthProvider';

export default function ProductsPage() {
  const { role, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    weight: 0,
    imageUrl: '',
    warehouseId: '',
    status: 'active' as 'active' | 'inactive',
  });

  const loadData = useCallback(async () => {
    try {
      if (role === ROLES.WAREHOUSE_ADMIN) {
        // Warehouse admin only sees their own warehouses and products
        const [productsData, userWarehouses] = await Promise.all([
          FirestoreService.getAllProducts(),
          FirestoreService.getWarehousesByOwner(user?.uid || '')
        ]);
        
        const activeUserWarehouses = userWarehouses.filter(w => w.status === 'active');
        const userWarehouseIds = activeUserWarehouses.map(w => w.id);
        const filteredProducts = productsData.filter(p => userWarehouseIds.includes(p.warehouseId));
        
        setProducts(filteredProducts);
        setWarehouses(activeUserWarehouses);
        
        // Auto-select the first warehouse if only one
        if (activeUserWarehouses.length === 1) {
          setSelectedWarehouse(activeUserWarehouses[0].id);
        }
      } else {
        // App admin sees all warehouses and products
        const [productsData, warehousesData] = await Promise.all([
          FirestoreService.getAllProducts(),
          FirestoreService.getAllWarehouses()
        ]);
        setProducts(productsData);
        setWarehouses(warehousesData.filter(w => w.status === 'active'));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    if (role && user) {
      loadData();
    }
  }, [loadData, role, user]);

  useEffect(() => {
    // Check if there's a warehouse parameter in the URL (client-side only)
    if (typeof window !== 'undefined' && warehouses.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const warehouseParam = urlParams.get('warehouse');
      
      if (warehouseParam) {
        setSelectedWarehouse(warehouseParam);
        // Auto-open form for adding product to specific warehouse
        setShowForm(true);
        // Pre-select warehouse in form for app admin
        if (role === ROLES.APP_ADMIN) {
          setFormData(prev => ({ ...prev, warehouseId: warehouseParam }));
        }
      }
    }
  }, [role, warehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);



    try {
      if (editingProduct) {
        // Update existing product
        await FirestoreService.updateDocument('products', editingProduct.id, formData);
        alert('Produto atualizado com sucesso!');
      } else {
        // Create new product
        const warehouseId = formData.warehouseId || (role === ROLES.WAREHOUSE_ADMIN && warehouses.length > 0 ? warehouses[0].id : '');
        
        const productData = {
          ...formData,
          warehouseId,
          createdBy: user?.uid || ''
        };
        

        
        await FirestoreService.createProduct(productData);
        alert('Produto criado com sucesso!');
      }

      // Reset form and reload products
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    const warehouseId = role === ROLES.WAREHOUSE_ADMIN && warehouses.length > 0 ? warehouses[0].id : '';
    

    
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      weight: 0,
      imageUrl: '',
      warehouseId,
      status: 'active',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      weight: product.weight,
      imageUrl: product.imageUrl || '',
      warehouseId: product.warehouseId,
      status: product.status || 'active',
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleStatusToggle = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await FirestoreService.updateDocument('products', product.id, { status: newStatus });
      loadData();
      alert(`Produto ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Erro ao atualizar status do produto.');
    }
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita!`)) {
      try {
        await FirestoreService.deleteDocument('products', product.id);
        loadData();
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir produto.');
      }
    }
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Galpão não encontrado';
  };

  const filteredProducts = selectedWarehouse === 'all' 
    ? products 
    : products.filter(p => p.warehouseId === selectedWarehouse);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.APP_ADMIN, ROLES.CLIENT_ADMIN, ROLES.WAREHOUSE_ADMIN]}>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {role === ROLES.WAREHOUSE_ADMIN ? 'Meus Produtos' : 'Produtos'}
              </h1>
              <p className="text-gray-600 mt-2">
                {role === ROLES.WAREHOUSE_ADMIN 
                  ? 'Gerencie os produtos do seu galpão'
                  : 'Gerencie o catálogo de produtos dos galpões'
                }
              </p>
              

            </div>
            <div className="flex gap-4 items-center">
              {/* Warehouse Filter - Only show if app admin or multiple warehouses */}
              {(role !== ROLES.WAREHOUSE_ADMIN || warehouses.length > 1) && (
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  {role !== ROLES.WAREHOUSE_ADMIN && <option value="all">Todos os Galpões</option>}
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              )}


              {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {showForm ? 'Cancelar' : '+ Novo Produto'}
                </button>
              )}
            </div>
          </header>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingProduct ? 'Editar Produto' : 'Criar Novo Produto'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Soja Premium"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grãos, Fertilizantes, Sementes"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                {role === ROLES.WAREHOUSE_ADMIN ? (
                  // Warehouse admin - show their warehouse (read-only)
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Seu Galpão
                    </label>
                    <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {warehouses.length > 0 ? (
                        `${warehouses[0].name} - ${warehouses[0].city}, ${warehouses[0].state}`
                      ) : (
                        'Carregando...'
                      )}
                    </div>
                  </div>
                ) : (
                  // App admin - can choose any warehouse
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Galpão *
                    </label>
                    <select
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={formData.warehouseId}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      required
                    >
                      <option value="">Selecione um galpão</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.city}, {warehouse.state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estoque Inicial *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">🟢 Ativo</option>
                    <option value="inactive">🔴 Inativo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    placeholder="Descrição detalhada do produto, especificações, etc."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {editingProduct ? 'Atualizando...' : 'Criando produto...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {product.imageUrl && (
                  <div className="h-48 bg-gray-200 relative">
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      unoptimized
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-700">🏭 Galpão:</span>
                      <span className="font-medium">{getWarehouseName(product.warehouseId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">⚖️ Peso:</span>
                      <span>{product.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">📦 Estoque:</span>
                      <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700">Preço de Venda</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700">Custo</p>
                        <p className="text-lg font-semibold text-gray-700">
                          R$ {product.costPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">Margem de Lucro</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {product.price > 0 ? (((product.price - product.costPrice) / product.price) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>

                  {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleStatusToggle(product)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                          product.status === 'active'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {product.status === 'active' ? '⏸️ Desativar' : '▶️ Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedWarehouse === 'all' ? 'Nenhum produto cadastrado' : 'Nenhum produto neste galpão'}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedWarehouse === 'all' 
                  ? 'Comece criando seu primeiro produto no sistema'
                  : 'Este galpão ainda não possui produtos cadastrados'
                }
              </p>
              {(role === ROLES.APP_ADMIN || role === ROLES.WAREHOUSE_ADMIN) && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  + Criar Primeiro Produto
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}