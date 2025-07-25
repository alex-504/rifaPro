// Script para corrigir ownership de galpões para warehouse_admins
// Execute no console do navegador como admin

async function fixWarehouseOwners() {
  try {
    console.log('🔧 Corrigindo ownership de galpões...\n');
    
    // Importar Firebase
    const { FirestoreService } = await import('./frontend/src/lib/firestore.js');
    
    // 1. Buscar todos os warehouse_admins
    console.log('👥 Buscando warehouse admins...');
    const warehouseAdmins = await FirestoreService.getUsersByRole('warehouse_admin');
    console.log(`✅ Encontrados ${warehouseAdmins.length} warehouse admins:`);
    warehouseAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - UID: ${admin.id}`);
    });
    
    // 2. Buscar todos os galpões
    console.log('\n🏭 Buscando galpões...');
    const warehouses = await FirestoreService.getAllWarehouses();
    console.log(`✅ Encontrados ${warehouses.length} galpões:`);
    warehouses.forEach(warehouse => {
      console.log(`   - ${warehouse.name} (Owner: ${warehouse.ownerId || 'SEM DONO'})`);
    });
    
    // 3. Identificar galpões sem dono ou com dono incorreto
    console.log('\n🔍 Analisando problemas...');
    const problemWarehouses = [];
    
    for (const warehouse of warehouses) {
      // Verificar se o ownerId existe e é um warehouse_admin válido
      const owner = warehouseAdmins.find(admin => admin.id === warehouse.ownerId);
      
      if (!warehouse.ownerId || !owner) {
        // Tentar encontrar um admin baseado no nome do galpão
        let suggestedOwner = null;
        
        // Lógica para sugerir dono baseado no nome
        if (warehouse.name.toLowerCase().includes('bebeto')) {
          suggestedOwner = warehouseAdmins.find(admin => 
            admin.name.toLowerCase().includes('bebeto') || 
            admin.email.toLowerCase().includes('bebeto')
          );
        }
        
        // Se não encontrou por nome, pegar o primeiro admin disponível
        if (!suggestedOwner && warehouseAdmins.length > 0) {
          suggestedOwner = warehouseAdmins[0];
        }
        
        problemWarehouses.push({
          warehouse,
          currentOwner: owner,
          suggestedOwner
        });
      }
    }
    
    if (problemWarehouses.length === 0) {
      console.log('✅ Todos os galpões têm donos válidos!');
      return;
    }
    
    console.log(`\n❌ Encontrados ${problemWarehouses.length} galpões com problemas:`);
    problemWarehouses.forEach(({ warehouse, currentOwner, suggestedOwner }) => {
      console.log(`\n📦 Galpão: ${warehouse.name}`);
      console.log(`   Dono atual: ${warehouse.ownerId || 'NENHUM'} ${currentOwner ? `(${currentOwner.name})` : '(INVÁLIDO)'}`);
      console.log(`   Dono sugerido: ${suggestedOwner?.id} (${suggestedOwner?.name})`);
    });
    
    // 4. Perguntar se deve corrigir
    const shouldFix = confirm(`\n🤔 Deseja corrigir ${problemWarehouses.length} galpão(ns) automaticamente?`);
    
    if (!shouldFix) {
      console.log('❌ Correção cancelada pelo usuário.');
      return;
    }
    
    // 5. Aplicar correções
    console.log('\n🔧 Aplicando correções...');
    let fixedCount = 0;
    
    for (const { warehouse, suggestedOwner } of problemWarehouses) {
      if (!suggestedOwner) {
        console.log(`⚠️ Pulando ${warehouse.name} - nenhum dono sugerido`);
        continue;
      }
      
      try {
        await FirestoreService.updateDocument('warehouses', warehouse.id, {
          ownerId: suggestedOwner.id,
          ownerName: suggestedOwner.name,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${warehouse.name} → Dono: ${suggestedOwner.name}`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Erro ao corrigir ${warehouse.name}:`, error);
      }
    }
    
    console.log(`\n🎉 Correção finalizada! ${fixedCount} galpão(ns) corrigido(s).`);
    console.log('🔄 Recarregue a página para ver as mudanças!');
    
    // 6. Verificação final
    console.log('\n🔍 Verificação final...');
    const updatedWarehouses = await FirestoreService.getAllWarehouses();
    const stillProblematic = updatedWarehouses.filter(w => {
      const owner = warehouseAdmins.find(admin => admin.id === w.ownerId);
      return !w.ownerId || !owner;
    });
    
    if (stillProblematic.length === 0) {
      console.log('✅ Todos os galpões agora têm donos válidos!');
    } else {
      console.log(`⚠️ Ainda restam ${stillProblematic.length} galpão(ns) com problemas.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar automaticamente
fixWarehouseOwners();