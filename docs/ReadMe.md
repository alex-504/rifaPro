# Documentação Técnica - RifaPro

## 1. Visão Geral do Sistema

### 1.1 Descrição
Sistema integrado para gestão de rifeiros/vendedores consignados que saem de Lagoa da Prata para realizar vendas no interior do Brasil, principalmente no Nordeste. O sistema visa substituir os processos manuais atuais, reduzir erros e melhorar o controle financeiro e de estoque.

### 1.2 Estrutura Organizacional e Hierarquia de Acesso

#### 1.2.1 Administrador (Nível Superior)
- Acesso total ao sistema
- Pode cadastrar múltiplos donos
- Gerencia galpões (CRUD completo)
- Importa dados em massa via Excel
- Visualiza todas as operações
- Pode executar todas as funções dos níveis inferiores

#### 1.2.2 Gestor de Galpão (Nível Intermediário)
- Acesso ao seu galpão específico
- Gerencia produtos e estoque
- Importa/exporta dados via Excel
- Visualiza relatórios do galpão
- Atualiza preços e estoque

#### 1.2.3 Motoristas (Nível Operacional)
- Cria Viagens Individuais
- Gerencia estoque específico do caminhão
- Registra vendas, devoluções e pagamentos
- Cadastra clientes finais

#### 1.2.4 Clientes Finais (Entidade Passiva)
- Entidade criada pelo motorista
- Relacionada às vendas e transações
- Contém informações de contato e localização
- Mantém histórico de compras e pagamentos

### 1.3 Conceitos Principais do Negócio

#### 1.3.1 Viagem
- Representa uma jornada completa de vendas de um motorista
- É o container principal que engloba todas as operações
- Contém:
  - Notas de carregamento (produtos levados)
  - Vendas realizadas
  - Devoluções
  - Pagamentos recebidos
  - Ajustes de preços
  - Remarques e brindes
- Tem período definido (início e fim)
- Permite análise completa de entrada vs saída de dinheiro
- Serve como unidade de controle financeiro

#### 1.3.2 Nota
- Relação de produtos carregados no caminhão para uma viagem específica
- ID único para rastreamento
- Pode conter produtos de diferentes galpões
- Vinculada a uma viagem específica
- Serve como inventário inicial da viagem
- Base para cálculo de remarques (valor da nota vs valor recebido)
- Permite rastreamento da origem dos produtos (galpão)

#### 1.3.3 Remarques
- Sistema de bonificação
- Calculado automaticamente (valor da nota - valor pago)
- Registrado por viagem/cliente

#### 1.3.4 Brindes
- Concedidos aos clientes finais
- Registrados pelo motorista
- Vinculados a vendas específicas

### 1.4 Funcionalidades Principais

#### 1.4.1 Autenticação e Controle de Acesso
- Login via email/senha
- Diferentes níveis de acesso (Admin, Dono, Motorista)
- Hierarquia de permissões

#### 1.4.2 Gestão de Estoque
- Adição de produtos ao caminhão
- Exportação/importação via Excel
- Controle de quantidade e preço

#### 1.4.3 Gestão de Clientes Finais
- Cadastro completo (telefone, CPF, endereço)
- Histórico de transações
- Consulta de clientes anteriores

#### 1.4.4 Vendas
- Seleção/cadastro de clientes
- Registro de múltiplos itens
- Atualização automática de estoque

#### 1.4.5 Devoluções
- Registro de mercadorias devolvidas
- Atualização de estoque
- Rastreamento de motivos

#### 1.4.6 Pagamentos
- Múltiplas formas (dinheiro, PIX, depósito, cartão)
- Cálculo de valores
- Registro de parciais

#### 1.4.7 Relatórios
- Estoque atual
- Vendas (por período/local)
- Histórico por cliente
- Devoluções
- Brindes e remarques

#### 1.4.8 Gestão de Viagens
- Criação de nova viagem pelo motorista
- Carregamento de produtos (nota)
- Acompanhamento em tempo real
- Relatórios consolidados
- Análise financeira (entrada vs saída)
- Histórico completo de operações

#### 1.4.9 Gestão de Galpões
- Importação em massa via Excel
  - Template padronizado
  - Validação de dados
  - Atualização parcial
- Dashboard do galpão
  - Visualização de estoque
  - Gestão de produtos
  - Relatórios específicos
- Exportação de dados
  - Relatórios em Excel
  - Inventário atual
  - Histórico de movimentações

## 2. Stack Tecnológico

### 2.1 Frontend Web (Painel Administrativo)
- **Framework**: Next.js com TypeScript
- **UI Library**: Material UI
- **State Management**: React Query
- **Firebase SDK**: Web
- **Formulários**: React Hook Form
- **Processamento de Excel**: SheetJS

### 2.2 Aplicativo Mobile
- **Framework**: React Native com Expo
- **Navegação**: React Navigation
- **Firebase SDK**: React Native
- **Storage Local**: SQLite
- **UI Components**: React Native Paper

### 2.3 Backend (Firebase)
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Functions**: Cloud Functions
- **Hosting**: Firebase Hosting

### 2.4 DevOps
- **Controle de Versão**: Git (GitHub)
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel (Web) / EAS (Mobile)

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Arquitetura
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  App Mobile     │       │    Firebase     │       │  Frontend Web   │
│  (React Native) │◄─────►│    Services     │◄─────►│  (Next.js)      │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐      ┌─────────────────┐
│  SQLite Local   │       │  Firestore      │      │  Vercel Hosting │
│  (Offline)      │       │  Database       │      │                 │
└─────────────────┘       └─────────────────┘      └─────────────────┘

┌─────────────────┐
│  Gestão Web     │
│  (Next.js)      │◄─────►┌─────────────────┐
└─────────────────┘       │    Galpões      │
                          │  (Fornecedores) │
                          └─────────────────┘
```

### 3.2 Hierarquia de Acesso
```
┌─────────────────┐
│   Administrador │
└────────┬────────┘
         │
         ├────────────┬────────────┬────────────┬────────────┐
         ▼            ▼            ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Dono A    │ │   Dono B    │ │   Dono N    │ │  Galpão A   │ │  Galpão N   │
└──────┬──────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
       │
       ├────────┬────────┬────────┐
       ▼        ▼        ▼        ▼
┌───────────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Motorista 1│ │Viagem │ │Nota   │ │Cliente│
└───────────┘ └───────┘ └───────┘ └───────┘

Nota: Galpões são entidades independentes que fornecem produtos
      para os donos/motoristas através do sistema web.
      Uma nota pode conter produtos de diferentes galpões.
```

## 4. Modelagem de Dados

### 4.1 Entidades Principais

#### Users (Usuários)
```
- id: string
- name: string
- email: string
- role: enum [admin, owner, driver]
- status: enum [active, inactive]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Owners (Donos)
```
- id: string
- userId: string (ref: Users)
- name: string
- address: string
- city: string
- state: string
- phone: string
- status: enum [active, inactive]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Drivers (Motoristas)
```
- id: string
- userId: string (ref: Users)
- ownerId: string (ref: Owners)
- name: string
- cpf: string
- phone: string
- address: string
- city: string
- state: string
- status: enum [active, inactive]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Trips (Viagens)
```
- id: string
- driverId: string (ref: Drivers)
- ownerId: string (ref: Owners)
- startDate: timestamp
- endDate: timestamp
- status: enum [active, completed, cancelled]
- notes: string
- initialValue: number (valor total das notas)
- finalValue: number (valor total recebido)
- profit: number (finalValue - initialValue)
- createdAt: timestamp
- updatedAt: timestamp
```

#### Notes (Notas)
```
- id: string
- tripId: string (ref: Trips)
- driverId: string (ref: Drivers)
- ownerId: string (ref: Owners)
- products: array of {
    id: string
    name: string
    quantity: number
    price: number
    warehouseId: string (ref: Warehouses)
    warehouseName: string
  }
- totalValue: number
- status: enum [active, completed, cancelled]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Warehouses (Galpões)
```
- id: string
- name: string
- address: string
- city: string
- state: string
- phone: string
- manager: string
- managerEmail: string
- status: enum [active, inactive]
- lastInventoryUpdate: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

#### WarehouseManagers (Gestores de Galpão)
```
- id: string
- userId: string (ref: Users)
- warehouseId: string (ref: Warehouses)
- name: string
- email: string
- phone: string
- status: enum [active, inactive]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Products (Produtos)
```
- id: string
- name: string
- description: string
- price: number
- costPrice: number
- stock: number
- warehouseId: string (ref: Warehouses)
- noteId: string (ref: Notes)
- createdAt: timestamp
- updatedAt: timestamp
```

#### EndClients (Clientes Finais)
```
- id: string
- name: string
- cpf: string
- phone: string
- address: string
- city: string
- state: string
- notes: string
- driverId: string (ref: Drivers)
- createdAt: timestamp
- updatedAt: timestamp
```

#### Sales (Vendas)
```
- id: string
- tripId: string (ref: Trips)
- noteId: string (ref: Notes)
- endClientId: string (ref: EndClients)
- date: timestamp
- totalValue: number
- receivedValue: number
- remarque: number
- status: enum [pending, paid, cancelled]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Payments (Pagamentos)
```
- id: string
- saleId: string (ref: Sales)
- value: number
- type: enum [cash, pix, deposit, card]
- date: timestamp
- status: enum [pending, completed, cancelled]
- createdAt: timestamp
- updatedAt: timestamp
```

#### Returns (Devoluções)
```
- id: string
- saleId: string (ref: Sales)
- productId: string (ref: Products)
- quantity: number
- reason: string
- date: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

#### Gifts (Brindes)
```
- id: string
- saleId: string (ref: Sales)
- description: string
- value: number
- date: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

## 5. Configuração dos Emuladores Firebase

Para desenvolvimento local, utilize as seguintes portas padrão para os emuladores:

| Emulador           | Porta |
|--------------------|-------|
| Auth               | 9099  |
| Functions          | 5001  |
| Firestore          | 8080  |
| Database           | 9000  |
| Hosting            | 5000  |
| PubSub             | 8085  |
| Storage            | 9199  |
| Eventarc           | 9299  |
| DataConnect        | 9399  |
| App Hosting        | 5002  |

Essas portas podem ser alteradas conforme necessidade, mas são os valores padrão sugeridos durante a inicialização do projeto.