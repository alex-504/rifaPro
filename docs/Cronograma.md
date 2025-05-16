# Cronograma de Desenvolvimento - RifaGo

## Introdução

Este documento apresenta um cronograma detalhado para o desenvolvimento do sistema RifaGo, seguindo os princípios SOLID e a metodologia Agile. O desenvolvimento será organizado em sprints de 2 semanas, com revisões e ajustes ao final de cada sprint.

## Princípios SOLID Aplicados

- **S (Single Responsibility)**: Cada classe e componente terá uma única responsabilidade
- **O (Open/Closed)**: Entidades serão abertas para extensão, fechadas para modificação
- **L (Liskov Substitution)**: Subclasses poderão substituir suas classes base
- **I (Interface Segregation)**: Interfaces específicas são melhores que uma única interface geral
- **D (Dependency Inversion)**: Depender de abstrações, não de implementações concretas

## Metodologia Agile

- Sprints de 2 semanas
- Daily standups (15 minutos)
- Revisão de sprint ao final de cada ciclo
- Backlog priorizado com histórias de usuário
- Desenvolvimento iterativo e incremental
- Testes contínuos e integração contínua
- Feedback constante dos stakeholders

## Atualização de Estratégia de Desenvolvimento

- O backend (Firebase) já está instalado e configurado, permitindo o início imediato do desenvolvimento tanto do frontend web quanto do app mobile.
- O app mobile (Expo/React Native) será focado nos motoristas, com funcionalidades de login, visualização de viagens/notas, registro de vendas e upload de comprovantes.
- O frontend web (Next.js) será voltado para administradores, gestores de galpão e clientes, com dashboards, relatórios e gestão de entidades.
- As sprints podem ser organizadas para desenvolvimento paralelo das duas plataformas, aproveitando o backend unificado.

## Fase 1: Preparação e Configuração Inicial

### Sprint 0 (2 semanas)
- **Objetivo**: Preparar ambiente e definir arquitetura

#### Semana 1
1. Configurar repositório Git
   - Criar estrutura de pastas (backend, frontend, mobile)
   - Configurar .gitignore e README
   - Definir estratégia de branches (Git Flow)

2. Configurar ambiente de desenvolvimento
   - Instalar Node.js, PostgreSQL, React e ferramentas necessárias
   - Configurar ESLint e Prettier
   - Configurar ambiente Docker para desenvolvimento (opcional)

3. Definir arquitetura detalhada
   - Finalizar diagrama de arquitetura
   - Definir padrões de codificação
   - Documentar padrões de API REST

#### Semana 2
4. Configurar projetos base
   - Inicializar projeto Node.js (backend)
   - Configurar Express.js e middleware básicos
   - Configurar conexão com PostgreSQL
   - Inicializar projeto React (frontend)
   - Inicializar projeto React Native com Expo (mobile)

5. Configurar CI/CD básico
   - Configurar testes automatizados
   - Configurar pipeline básico no GitHub Actions

6. Implementar autenticação básica
   - Configurar JWT e estratégia de tokens
   - Implementar rotas de login/logout
   - Criar middleware de autenticação

## Fase 2: Core do Sistema

### Sprint 1: Autenticação e Estrutura Inicial
**Web:**
- Implementar tela de login integrada ao Firebase Auth
- Estruturar navegação e layout base (dashboard)
- Criar tela de cadastro/listagem de usuários (admin)
- Configurar proteção de rotas

**Mobile:**
- Inicializar projeto Expo
- Implementar tela de login integrada ao Firebase Auth
- Estruturar navegação básica (React Navigation)
- Testar login/logout no app

### Sprint 2: Usuários, Permissões e Galpões
**Web:**
- CRUD de usuários (admin, gestor, motorista, cliente)
- Gestão de permissões e perfis
- CRUD de galpões (warehouses)
- Visualização de usuários e galpões

**Mobile:**
- Tela de perfil do motorista
- Visualização de viagens/notas atribuídas ao motorista
- Visualização de estoque próprio

### Sprint 3: Produtos, Notas e Viagens
**Web:**
- CRUD de produtos
- Importação de produtos via Excel
- Cadastro e visualização de notas/carregamentos
- Associação de produtos a notas e galpões

**Mobile:**
- Visualização de notas e produtos disponíveis para venda
- Tela de registro de vendas (seleção de produtos, quantidades)
- Upload de comprovantes (fotos, planilhas)

### Sprint 4: Vendas, Clientes Finais e Relatórios
**Web:**
- CRUD de clientes finais
- Relatórios de vendas por motorista, galpão, cliente
- Dashboard de indicadores

**Mobile:**
- Cadastro de clientes finais (motorista)
- Registro de vendas para clientes finais
- Visualização de histórico de vendas

### Sprint 5: Pagamentos, Remarques e Brindes
**Web:**
- Gestão de pagamentos e recebimentos
- Cálculo e visualização de remarques
- Gestão de brindes e promoções

**Mobile:**
- Registro de pagamentos recebidos pelo motorista
- Visualização de remarques e brindes disponíveis
- Histórico de pagamentos e brindes

### Sprint 6: Sincronização Offline/Online (Mobile)
**Mobile:**
- Implementar armazenamento local (SQLite/AsyncStorage)
- Sincronização de dados offline/online
- Interface de status de sincronização
- Testes em diferentes cenários de conectividade

### Sprint 7: Dashboards e Refinamento
**Web:**
- Dashboards avançados para admins e clientes
- Exportação de relatórios (Excel)
- Filtros e visualizações customizadas

**Mobile:**
- Relatórios e resumos para motoristas
- Otimização de performance e UX

### Sprint 8: Testes Integrados e Ajustes Finais
- Testes end-to-end (web e mobile)
- Correção de bugs e ajustes de UX
- Testes com usuários reais (piloto)
- Documentação final

### Sprint 9: Lançamento e Monitoramento
- Deploy final em produção (web e mobile)
- Publicação do app mobile (Google Play/App Store)
- Monitoramento e suporte inicial
- Coleta de feedback e planejamento de melhorias

## Revisão do Cronograma

Este cronograma é uma estimativa inicial e deve ser revisado regularmente durante o processo de desenvolvimento. Os sprints podem ser ajustados conforme necessário, seguindo o princípio Agile de adaptação a mudanças.

## Princípios de Codificação

### Backend
- Seguir arquitetura de camadas (Models, Controllers, Services, Routes)
- Cada classe com responsabilidade única (S do SOLID)
- Injeção de dependências para facilitar testes
- Validação robusta de dados de entrada
- Tratamento consistente de erros

### Frontend Web
- Componentização clara (React)
- Gerenciamento de estado centralizado (Redux)
- Componentes reutilizáveis
- Testes de componentes

### Mobile
- Arquitetura offline-first
- Componentes reutilizáveis
- Tratamento de estados de conectividade
- Otimização de performance

## Definição de Pronto (DoD)

Para considerar uma tarefa como concluída, ela deve atender aos seguintes critérios:

1. Código implementado seguindo os padrões definidos
2. Testes unitários implementados e passando
3. Testes de integração implementados e passando
4. Documentação atualizada
5. Código revisado por pelo menos um outro desenvolvedor
6. Funcionalidade validada pelo Product Owner
7. Sem bugs conhecidos ou pendências técnicas

## Gestão de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Complexidade da sincronização offline | Alta | Alto | Prototipação inicial, testes abrangentes |
| Mudanças nos requisitos | Média | Médio | Desenvolvimento iterativo, comunicação frequente |
| Desempenho em dispositivos móveis | Média | Alto | Testes em diversos dispositivos, otimização constante |
| Integração com Excel | Baixa | Médio | Validação rigorosa, tratamento de erros |
| Segurança de dados | Média | Alto | Revisões de segurança, testes de penetração |

## Conclusão

Este cronograma fornece um roteiro para o desenvolvimento do sistema RifaGo seguindo os princípios SOLID e a metodologia Agile. O desenvolvimento iterativo permitirá ajustes conforme necessário e a entrega contínua de valor aos usuários finais.

## Backlog de Melhorias Futuras (CI/CD e Workflow)

- Adicionar testes automatizados (lint, unitários) no workflow do GitHub Actions
- Implementar deploy de preview/staging para Pull Requests
- Adicionar notificações de deploy (Slack, Discord, email)
- Ativar proteção de branch main (branch protection rules)
- Documentar exemplos de comandos de teste/lint no README
- Revisar e limpar secrets periodicamente

## Atualizações Recentes
- Autenticação centralizada via Firebase Authentication (web e mobile)
- CI/CD automatizado com GitHub Actions para build e deploy do frontend
- Início do app mobile com Expo, integrado ao mesmo backend Firebase