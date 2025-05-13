# Documentação Técnica - RifaGo

## 1. Visão Geral do Sistema

### 1.1 Descrição
Sistema integrado para gestão de rifeiros/vendedores consignados que saem de Lagoa da Prata para realizar vendas no interior do Brasil, principalmente no Nordeste. O sistema visa substituir os processos manuais atuais, reduzir erros e melhorar o controle financeiro e de estoque.

### 1.2 Estrutura Organizacional
O sistema possui uma hierarquia de usuários com diferentes níveis de acesso:

1. **App Admin** (Nível superior)
   - Desenvolvedor do app
   - Adiciona novos clientes empresariais
   - Tem acesso a todas as funções dos clientes

2. **Clientes** (Nível intermediário - A, B, N)
   - Admin dos caminhões
   - Registra novos caminhões
   - Monitora vendas, notas e registros
   - Pode editar valores feitos pelos caminhões

3. **Caminhões/Motoristas** (Nível operacional)
   - Cadastram novos clientes finais (consumidores)
   - Criam notas (pedidos)
   - Adicionam produtos à nota.
   - Registram valores vendidos e recebidos
   - Calculam remarque e brindes

4. **Galpões** (Fornecedores de produtos)
   - Adicionam/removem produtos
   - Fornecem metadados para os caminhões
   - Participam da criação de notas (carregamento do caminhão)

### 1.3 Conceitos Principais do Negócio
- **Notas**: Relação de produtos que o caminhão carrega antes de sair para vender. Podem conter produtos de diferentes galpões (A, B, C, etc.)
- **Remarques**: Sistema de bonificação quando os motoristas conseguem vender o valor cheio da nota, sem diferença. Calculados automaticamente (valor da nota - valor pago).
- **Brindes**: Dados aos clientes finais que vendem toda a mercadoria. O valor é definido pelo motorista no momento da coleta do dinheiro e da mercadoria que eventualmente não foi vendida.

### 1.4 Componentes Principais
1. **Aplicativo Mobile** - Para uso dos vendedores em campo
2. **Painel Administrativo Web** - Para gestores (clientes e admin)
3. **Backend API** - Para comunicação entre os sistemas e gerenciamento de dados

## 2. Stack Tecnológico

### 2.1 Frontend Web (Painel Administrativo)
- **Framework**: React.js
- **UI Library**: Material UI
- **State Management**: Redux (ou Context API)
- **HTTP Client**: Axios
- **Gráficos**: Recharts
- **Formulários**: React Hook Form
- **Processamento de Excel**: SheetJS (xlsx)

### 2.2 Aplicativo Mobile
- **Framework**: React Native
- **Navegação**: React Navigation
- **State Management**: Redux
- **Storage Local**: SQLite (via expo-sqlite)
- **Armazenamento Adicional**: AsyncStorage
- **UI Components**: React Native Paper
- **Gerenciamento Offline**: Redux-Persist

### 2.3 Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Validação**: Joi
- **Middleware**: cors, helmet, morgan
- **Processamento de Excel**: exceljs, multer

### 2.4 Banco de Dados
- **Principal (Servidor)**: PostgreSQL
- **Local (Mobile)**: SQLite

### 2.5 DevOps
- **Controle de Versão**: Git (GitHub)
- **Ambiente de Desenvolvimento**: Local
- **Ambiente de Produção**: Linode
- **CI/CD**: GitHub Actions (futuro)

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Arquitetura
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  App Mobile     │       │  Backend API    │       │  Frontend Web   │
│  (React Native) │◄─────►│  (Node.js)      │◄─────►│  (React.js)     │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐      ┌─────────────────┐
│  SQLite Local   │       │  PostgreSQL     │      │ Upload/Download │
│  (Offline)      │       │  (Servidor)     │      │ Excel           │
└─────────────────┘       └─────────────────┘      └─────────────────┘
```

### 3.2 Hierarquia de Acesso
```
┌─────────────────┐
│    App Admin    │
└────────┬────────┘
         │
         ├────────────┬────────────┐
         ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Cliente A  │ │  Cliente B  │ │  Cliente N  │
└──────┬──────┘ └─────────────┘ └─────────────┘
       │
       ├────────┬────────┬────────┐
       ▼        ▼        ▼        ▼
┌───────────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Caminhão 1│ │Galpão A│ │Galpão B│ │Galpão N│
└───────────┘ └───────┘ └───────┘ └───────┘
```

### 3.3 Fluxo de Negócio
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Galpão    │──────►  │  Caminhão   │──────►  │   Cliente   │
│ (Produtos)  │         │   (Nota)    │         │   Final     │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │    Venda    │
                        │(Remarque/   │
                        │  Brinde)    │
                        └─────────────┘
```

### 3.4 Fluxo de Sincronização
1. **Offline**: App armazena dados localmente em SQLite
2. **Online**: Ao detectar conexão, sincroniza com o servidor
3. **Conflitos**: Resolução baseada em timestamps e regras de negócio

### 3.5 Processamento de Planilhas Excel
1. **Upload**: Usuário faz upload da planilha através do painel web
2. **Validação**: Sistema valida estrutura e dados da planilha
3. **Processamento**: Dados são processados e inseridos no banco
4. **Relatório**: Sistema gera relatório de sucesso/falhas na importação
5. **Download**: Dados do inventário do caminhão podem ser baixados em formato Excel Planilhas Excel
1. **Upload**: Usuário faz upload da planilha através do painel web
2. **Validação**: Sistema valida estrutura e dados da planilha
3. **Processamento**: Dados são processados e inseridos no banco
4. **Relatório**: Sistema gera relatório de sucesso/falhas na importação
5. **Download**: Dados do inventário do caminhão podem ser baixados em formato Excel

## 4. Modelagem de Dados

### 4.1 Entidades Principais

#### Users (Usuários)
```
- id: INT PRIMARY KEY
- name: VARCHAR
- email: VARCHAR UNIQUE
- password: VARCHAR
- role: ENUM [app_admin, client_admin, driver, warehouse_admin]
- status: ENUM [active, inactive]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Clients (Clientes Empresariais)
```
- id: INT PRIMARY KEY
- name: VARCHAR
- address: VARCHAR
- city: VARCHAR
- state: VARCHAR
- phone: VARCHAR
- status: ENUM [active, inactive]
- created_by: INT FOREIGN KEY (Users.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### EndClients (Clientes Finais)
```
- id: INT PRIMARY KEY
- name: VARCHAR
- address: VARCHAR
- city: VARCHAR
- state: VARCHAR
- phone: VARCHAR
- notes: TEXT
- created_by: INT FOREIGN KEY (Users.id - driver)
- client_id: INT FOREIGN KEY (Clients.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Drivers (Motoristas/Vendedores)
```
- id: INT PRIMARY KEY
- user_id: INT FOREIGN KEY (Users.id)
- client_id: INT FOREIGN KEY (Clients.id)
- cpf: VARCHAR UNIQUE
- cnh: VARCHAR
- phone: VARCHAR
- address: VARCHAR
- city: VARCHAR
- state: VARCHAR
- commission_rate: DECIMAL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Warehouses (Galpões)
```
- id: INT PRIMARY KEY
- name: VARCHAR
- address: VARCHAR
- city: VARCHAR
- state: VARCHAR
- client_id: INT FOREIGN KEY (Clients.id)
- status: ENUM [active, inactive]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Products (Produtos)
```
- id: INT PRIMARY KEY
- name: VARCHAR
- description: TEXT
- category: VARCHAR
- price: DECIMAL
- cost_price: DECIMAL
- stock: INT
- weight: DECIMAL
- image_url: VARCHAR
- warehouse_id: INT FOREIGN KEY (Warehouses.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Trucks (Caminhões)
```
- id: INT PRIMARY KEY
- plate: VARCHAR
- model: VARCHAR
- capacity: DECIMAL
- client_id: INT FOREIGN KEY (Clients.id)
- status: ENUM [available, on_route, maintenance]
- driver_id: INT FOREIGN KEY (Drivers.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Notes (Notas - Carregamento do Caminhão)
```
- id: INT PRIMARY KEY
- truck_id: INT FOREIGN KEY (Trucks.id)
- driver_id: INT FOREIGN KEY (Drivers.id)
- client_id: INT FOREIGN KEY (Clients.id)
- total_amount: DECIMAL
- status: ENUM [loading, on_route, completed, canceled]
- departure_date: TIMESTAMP
- return_date: TIMESTAMP
- sync_status: ENUM [synced, pending]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### NoteItems (Itens da Nota)
```
- id: INT PRIMARY KEY
- note_id: INT FOREIGN KEY (Notes.id)
- product_id: INT FOREIGN KEY (Products.id)
- warehouse_id: INT FOREIGN KEY (Warehouses.id)
- quantity: INT
- price: DECIMAL
- total: DECIMAL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Sales (Vendas aos Clientes Finais)
```
- id: INT PRIMARY KEY
- note_id: INT FOREIGN KEY (Notes.id)
- driver_id: INT FOREIGN KEY (Drivers.id)
- end_client_id: INT FOREIGN KEY (EndClients.id)
- date: TIMESTAMP
- total_amount: DECIMAL
- remarque_amount: DECIMAL
- gift_amount: DECIMAL
- status: ENUM [pending, completed, canceled]
- payment_status: ENUM [paid, partial, pending]
- sync_status: ENUM [synced, pending]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### SaleItems (Itens de Venda)
```
- id: INT PRIMARY KEY
- sale_id: INT FOREIGN KEY (Sales.id)
- note_item_id: INT FOREIGN KEY (NoteItems.id)
- quantity: INT
- price: DECIMAL
- total: DECIMAL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Payments (Pagamentos)
```
- id: INT PRIMARY KEY
- sale_id: INT FOREIGN KEY (Sales.id)
- amount: DECIMAL
- method: ENUM [cash, pix, card, check]
- date: TIMESTAMP
- notes: TEXT
- driver_id: INT FOREIGN KEY (Drivers.id)
- sync_status: ENUM [synced, pending]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### ImportLog (Registro de Importações)
```
- id: INT PRIMARY KEY
- file_name: VARCHAR
- user_id: INT FOREIGN KEY (Users.id)
- entity_type: VARCHAR
- status: ENUM [success, failed, partial]
- items_processed: INT
- items_success: INT
- items_failed: INT
- error_details: TEXT
- created_at: TIMESTAMP
```

#### SyncLog (Registro de Sincronização)
```
- id: INT PRIMARY KEY
- driver_id: INT FOREIGN KEY (Drivers.id)
- type: ENUM [upload, download]
- status: ENUM [success, failed]
- details: TEXT
- created_at: TIMESTAMP
```

## 5. API Endpoints

### 5.1 Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/refresh` - Renovar token

### 5.2 Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Remover usuário

### 5.3 Clientes Empresariais
- `GET /api/clients` - Listar clientes empresariais
- `GET /api/clients/:id` - Obter cliente empresarial
- `POST /api/clients` - Criar cliente empresarial
- `PUT /api/clients/:id` - Atualizar cliente empresarial
- `DELETE /api/clients/:id` - Remover cliente empresarial

### 5.4 Clientes Finais
- `GET /api/end-clients` - Listar clientes finais
- `GET /api/end-clients/:id` - Obter cliente final
- `POST /api/end-clients` - Criar cliente final
- `PUT /api/end-clients/:id` - Atualizar cliente final
- `DELETE /api/end-clients/:id` - Remover cliente final

### 5.5 Motoristas
- `GET /api/drivers` - Listar motoristas
- `GET /api/drivers/:id` - Obter motorista
- `POST /api/drivers` - Criar motorista
- `PUT /api/drivers/:id` - Atualizar motorista
- `DELETE /api/drivers/:id` - Remover motorista

### 5.6 Galpões
- `GET /api/warehouses` - Listar galpões
- `GET /api/warehouses/:id` - Obter galpão
- `POST /api/warehouses` - Criar galpão
- `PUT /api/warehouses/:id` - Atualizar galpão
- `DELETE /api/warehouses/:id` - Remover galpão

### 5.7 Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Remover produto
- `POST /api/products/import` - Importar produtos de planilha Excel
- `GET /api/products/by-warehouse/:warehouseId` - Obter produtos por galpão

### 5.8 Caminhões
- `GET /api/trucks` - Listar caminhões
- `GET /api/trucks/:id` - Obter caminhão
- `POST /api/trucks` - Criar caminhão
- `PUT /api/trucks/:id` - Atualizar caminhão
- `DELETE /api/trucks/:id` - Remover caminhão
- `GET /api/trucks/:id/notes` - Listar notas do caminhão

### 5.9 Notas (Carregamento)
- `GET /api/notes` - Listar notas
- `GET /api/notes/:id` - Obter nota
- `POST /api/notes` - Criar nota
- `PUT /api/notes/:id` - Atualizar nota
- `DELETE /api/notes/:id` - Remover nota
- `GET /api/notes/:id/items` - Listar itens da nota
- `POST /api/notes/import` - Importar notas de planilha Excel
- `GET /api/notes/template` - Baixar template Excel para importação

### 5.10 Vendas
- `GET /api/sales` - Listar vendas
- `GET /api/sales/:id` - Obter venda
- `POST /api/sales` - Criar venda
- `PUT /api/sales/:id` - Atualizar venda
- `DELETE /api/sales/:id` - Remover venda
- `GET /api/sales/:id/items` - Listar itens da venda
- `GET /api/sales/by-note/:noteId` - Obter vendas por nota
- `GET /api/sales/by-client/:clientId` - Obter vendas por cliente final

### 5.11 Pagamentos
- `GET /api/payments` - Listar pagamentos
- `GET /api/payments/:id` - Obter pagamento
- `POST /api/payments` - Criar pagamento
- `PUT /api/payments/:id` - Atualizar pagamento
- `DELETE /api/payments/:id` - Remover pagamento
- `GET /api/payments/by-sale/:saleId` - Obter pagamentos por venda

### 5.12 Remarques e Brindes
- `GET /api/remarques` - Listar remarques
- `GET /api/remarques/:id` - Obter remarque
- `POST /api/remarques` - Criar remarque
- `PUT /api/remarques/:id` - Atualizar remarque
- `GET /api/gifts` - Listar brindes
- `GET /api/gifts/:id` - Obter brinde
- `POST /api/gifts` - Criar brinde
- `PUT /api/gifts/:id` - Atualizar brinde

### 5.13 Sincronização
- `POST /api/sync/upload` - Enviar dados locais para o servidor
- `GET /api/sync/download` - Baixar dados atualizados
- `POST /api/sync/log` - Registrar log de sincronização

## 6. Arquitetura de Sincronização Offline/Online

### 6.1 Estratégia de Sincronização
1. **Download inicial**: Ao primeiro login, o app baixa dados essenciais (produtos, clientes)
2. **Operações offline**: Todas as operações são salvas localmente primeiro
3. **Marcação de status**: Cada operação é marcada como "pending_sync"
4. **Verificação de conectividade**: App verifica periodicamente conectividade
5. **Upload**: Quando online, envia dados pendentes para o servidor
6. **Download**: Após upload, baixa atualizações do servidor
7. **Resolução de conflitos**: Utiliza timestamps e regras de negócio

### 6.2 Resolução de Conflitos
- Prioridade para dados do servidor (em geral)
- Exceção para vendas/pagamentos: dados locais têm prioridade
- Registros duplicados identificados por UUID
- Log detalhado de sincronização para auditoria

### 6.3 Fluxo de Dados Offline
1. **Caminhão carrega produtos**: Gera nota localmente
2. **Vendas para clientes finais**: Registradas offline
3. **Pagamentos**: Registrados offline
4. **Remarques e brindes**: Calculados automaticamente
5. **Sincronização**: Ao retornar a área com conectividade

## 7. Fluxos de Trabalho Principais

### 7.1 Fluxo de Carregamento do Caminhão
1. Administrador do galpão cadastra produtos disponíveis
2. Cliente (empresa) cria uma nota de carregamento
3. Adiciona produtos de diferentes galpões à nota
4. Associa a nota a um caminhão/motorista específico
5. Motorista confirma recebimento dos produtos
6. Sistema registra saída do caminhão com inventário inicial

### 7.2 Fluxo de Venda
1. Motorista acessa o app em campo (modo offline)
2. Cadastra novo cliente final ou seleciona cliente existente
3. Cria nova venda associada à nota de carregamento
4. Adiciona produtos à venda
5. Registra valor vendido (preço)
6. Registra valor recebido (pagamento)
7. Sistema calcula automaticamente valores de remarque
8. Se valor pago >= valor de nota, motorista registra brinde

### 7.3 Fluxo de Retorno
1. Motorista retorna à base
2. Sincroniza dados do app com o servidor central
3. Sistema atualiza estoque com produtos devolvidos
4. Cliente (empresa) recebe relatório completo de vendas
5. Sistema calcula comissões e métricas de desempenho

### 7.4 Fluxo de Importação Excel
1. Usuário acessa o painel web
2. Baixa template Excel para importação
3. Preenche dados conforme necessário
4. Faz upload do arquivo Excel
5. Sistema valida e processa os dados
6. Exibe relatório de sucesso/falhas
7. Dados são incorporados ao sistema

## 8. Segurança

### 8.1 Autenticação e Autorização
- JWT para autenticação stateless
- Refresh tokens para sessões longas
- Níveis de acesso por perfil (admin, cliente, motorista, galpão)
- Senha com hash bcrypt

### 8.2 Segurança de Dados
- HTTPS para todas as comunicações
- Dados sensíveis criptografados
- Validação de entrada em todos os endpoints
- Rate limiting para prevenir abuso

## 9. Plano de Implementação

### 9.1 Fase 1: MVP (2-3 meses)
1. **Sprint 1**: Setup do projeto e infraestrutura básica
   - Configuração de repositórios
   - Configuração do ambiente de desenvolvimento
   - Estruturação inicial de banco de dados
   - **Implementação do cadastro de notas (carregamento)**
   - **Implementação da importação via Excel**

2. **Sprint 2**: Implementação do backend (APIs core)
   - Autenticação e usuários
   - APIs de produtos e clientes
   - APIs de notas e vendas
   - APIs de remarques e brindes

3. **Sprint 3**: Desenvolvimento do app mobile (catálogo, vendas)
   - Tela de login e autenticação
   - Catálogo de produtos
   - Registro de vendas
   - **Visualização de notas e inventário**

4. **Sprint 4**: Desenvolvimento do painel web básico
   - Dashboard principal
   - Gerenciamento de produtos
   - Gerenciamento de vendedores
   - **Upload e processamento de planilhas Excel**

5. **Sprint 5**: Sincronização offline/online básica
   - Armazenamento local SQLite
   - Sincronização de dados básica
   - Resolução de conflitos

6. **Sprint 6**: Testes e ajustes, preparação para piloto
   - Testes de integração
   - Testes de usabilidade
   - Ajustes finais

### 9.2 Fase 2: Expansão (2-3 meses)
1. Rotas e planejamento de visitas
2. Relatórios avançados
3. Dashboard com métricas de performance
4. Sistema de comissões completo
5. Integração com métodos de pagamento
6. **Gestão avançada de galpões e inventário**
7. **Templates personalizados para importação de Excel**

### 9.3 Fase 3: Refinamento (1-2 meses)
1. Otimização de performance
2. UX/UI refinado
3. Notificações e alertas
4. Backup e recuperação de dados
5. Documentação completa
6. **Exportação de dados para planilhas**

## 🚀 Workflow de Atualização do App

Siga este fluxo para garantir que suas mudanças sejam aplicadas corretamente do desenvolvimento local até a produção no Firebase Hosting:

### 1. Desenvolvimento Local
- Crie uma branch para sua feature/correção:
  ```bash
  git checkout -b feat/nome-da-feature
  ```
- Faça as alterações no código.
- Teste localmente:
  ```bash
  cd frontend
  npm run dev
  ```
- Verifique se tudo funciona em `http://localhost:3000`.

### 2. Versionamento e Pull Request (PR)
- Adicione e faça commit das mudanças:
  ```bash
  git add .
  git commit -m "feat: descrição da feature/correção"
  ```
- Envie para o GitHub:
  ```bash
  git push origin feat/nome-da-feature
  ```
- Abra um Pull Request (PR) no GitHub para a branch `main`.
- Aguarde revisão e aprovação.
- Faça o merge do PR na `main`.

### 3. Deploy Automático com GitHub Actions
A partir de agora, o deploy para o Firebase Hosting é feito automaticamente após o merge na branch `main`!

#### Como funciona o workflow:
- O arquivo `.github/workflows/firebase-hosting.yml` define o processo automatizado.
- Sempre que houver um push na branch `main`, o GitHub Actions:
  1. Faz checkout do código
  2. Instala as dependências do frontend
  3. Executa o build do Next.js
  4. Faz o deploy para o Firebase Hosting usando as credenciais seguras

#### Como configurar o segredo do Firebase:
1. No [Firebase Console](https://console.firebase.google.com/), acesse seu projeto.
2. Vá em **Configurações do projeto > Contas de serviço**.
3. Clique em **Gerar nova chave privada** e baixe o arquivo JSON.
4. No GitHub, acesse seu repositório > **Settings > Secrets and variables > Actions**.
5. Clique em **New repository secret**.
6. No campo "Name", coloque:
   ```
   FIREBASE_SERVICE_ACCOUNT
   ```
7. No campo "Value", cole todo o conteúdo do arquivo JSON baixado.
8. Clique em **Add secret**.

> **Atenção:** O segredo deve se chamar exatamente `FIREBASE_SERVICE_ACCOUNT` (apenas letras maiúsculas e underscores, sem espaços ou traços).

#### O que acontece agora?
- Após o merge na `main`, o deploy é feito automaticamente.
- Você pode acompanhar o status do deploy na aba **Actions** do GitHub.
- Não é mais necessário rodar `firebase deploy` manualmente, a não ser que queira forçar um deploy fora do fluxo padrão.

### 4. Verifique em Produção
- Acesse seu app em `https://rifapro-23e19.web.app/` para garantir que as mudanças estão online.

---

**Dica:** Se precisar rodar o deploy manualmente, ainda pode usar:
```bash
firebase deploy --only hosting
```

## 🔒 Autenticação Centralizada
A autenticação de usuários (web e mobile) é feita via Firebase Authentication, garantindo segurança e integração entre plataformas.

## 🚀 CI/CD Automatizado
O projeto utiliza GitHub Actions para build e deploy automáticos do frontend (Next.js) no Firebase Hosting. O deploy é disparado sempre que há merge na branch `main`, garantindo agilidade e segurança.

## 📱 App Mobile
O projeto conta com um app mobile desenvolvido em React Native com Expo, utilizando o mesmo backend Firebase para autenticação e dados. O repositório segue o padrão monorepo, com as pastas `frontend` (web) e `mobile` (mobile).