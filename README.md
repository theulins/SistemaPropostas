# Sistema de Propostas

Aplicação completa (frontend estático + backend Node/Express + MySQL) para gestão de empresas, propostas e aprovações.

## Estrutura

```
/public
  css/, js/, *.html
/server
  app.js, routes.js, controllers/, db/, middleware/, utils/
.env.example
```

## Pré-requisitos

- Node.js 18+
- MySQL 8 (ou compatível)

## Configuração do banco

1. Crie um banco de dados (ex.: `sistema_propostas`).
2. Execute o script [`server/db/schema.sql`](server/db/schema.sql) para criar tabelas e sementes:
   - Usuário admin: `admin@empresa.com` / `admin123`
   - Configurações iniciais de tema e taxa
   - Empresas pendentes/ativas para testes

## Backend

```bash
cd server
cp ../.env.example .env
# edite credenciais do banco, JWT_SECRET etc.

# instalar dependências
npm install

# iniciar o servidor
npm start
```

O servidor sobe em `http://localhost:3001` por padrão e expõe os endpoints REST em `/api/*`.

## Frontend

Sirva a pasta `public` por HTTP (ex.: `npx serve public`, nginx, Apache ou o servidor estático do próprio framework).

Página inicial de login: `http://localhost:3000/login.html` (ajuste conforme host utilizado).

### Login seed

```
E-mail: admin@empresa.com
Senha: admin123
```

## Endpoints principais

- `POST /api/login` / `GET /api/profile`
- Dashboard: `GET /api/dashboard/summary`, `GET /api/dashboard/commissions?month=YYYY-MM`
- Empresas: `GET /api/empresas/list`, `GET /api/empresas/search`, `POST /api/empresas`
- Pendências: `GET /api/empresas/pending`, `POST /api/empresas/pending/approve`, `POST /api/empresas/pending/reject`
- Configurações: `GET/PUT /api/settings`
- Usuários (admin): `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`

## Notas

- JWT com expiração de 8h e RBAC (viewer/editor/admin)
- Upload de assinaturas em PNG (pasta `server/uploads`)
- Layout mobile-first com tema claro/escuro e seletor de cor primária
- Seletores (select/option) com contraste adequado para ambos os temas

## Testes manuais sugeridos

- Login → redireciona para dashboard com token válido
- Dashboard → KPIs, últimas edições e card de comissões por mês (com taxa padrão ou manual)
- Empresas → pesquisa/lista, alternância lista/formulário e envio com assinatura desenhada
- Pendências → edição inline de valor/taxa, aprovação/reprovação removendo linhas
- Configurações → ajuste de tema/cor + CRUD de usuários (apenas admin)
