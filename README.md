# API de Backend para Fórum

Um backend completo para fórum construído com **TypeScript**, **Express**, **Prisma**, **PostgreSQL**, e documentado com **Swagger/OpenAPI**.

## Funcionalidades

- ✅ **Autenticação de usuário** com JWT
- ✅ **Posts** com upvotes/downvotes
- ✅ **Enquetes** (Polls) com suporte a múltiplas escolhas
- ✅ **Comentários aninhados** com profundidade ilimitada
- ✅ Funcionalidades de **Feed** e **Busca**
- ✅ Operações **CRUD** (Criar, Ler, Atualizar, Deletar) completas
- ✅ **Documentação interativa da API** com Swagger UI
- ✅ **Especificação OpenAPI 3.0**

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configuração de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Atualize o arquivo `.env` com sua configuração:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/forum_db"
JWT_SECRET="sua-chave-super-secreta-jwt-mude-em-producao"
PORT=3000
```

### 3. Configuração do Banco de Dados

Gere o cliente Prisma:

```bash
npm run prisma:generate
```

Execute as migrações do banco de dados:

```bash
npm run prisma:migrate
```

### 4. Iniciar o Servidor

Modo de desenvolvimento (com recarregamento automático):

```bash
npm run dev
```

Modo de produção:

```bash
npm run build
npm start
```

O servidor será executado em `http://localhost:3000`

## Documentação da API

### Swagger UI

Assim que o servidor estiver em execução, acesse a documentação interativa da API em:

**http://localhost:3000/api-docs**

O Swagger UI oferece:
- Documentação completa dos endpoints da API
- Schemas de requisição/resposta
- Funcionalidade "Try-it-out" para testar os endpoints diretamente
- Suporte a autenticação para rotas protegidas

### Especificação OpenAPI

Obtenha a especificação JSON bruta do OpenAPI em:

**http://localhost:3000/api-docs.json**

## Visão Geral da API

### Autenticação

A maioria dos endpoints requer autenticação JWT. Após fazer login ou registrar-se, inclua o token no cabeçalho `Authorization`:

```
Authorization: Bearer <seu_token_jwt>
```

No Swagger UI, clique no botão "Authorize" e insira seu token.

### Resumo dos Endpoints

#### Usuários (`/users`)
- `POST /users/register` - Registrar novo usuário
- `POST /users/login` - Fazer login do usuário (retorna JWT)
- `GET /users` - Listar todos os usuários (protegido)
- `GET /users/:id` - Obter detalhes do usuário
- `PUT /users/:id` - Atualizar usuário (protegido)
- `DELETE /users/:id` - Excluir usuário (protegido)
- `GET /users/:id/posts` - Obter posts do usuário
- `GET /users/:id/comments` - Obter comentários do usuário

#### Posts (`/posts`)
- `POST /posts` - Criar post (protegido)
- `GET /posts` - Listar posts (com paginação)
- `GET /posts/:id` - Obter detalhes do post
- `PUT /posts/:id` - Atualizar post (protegido)
- `DELETE /posts/:id` - Excluir post (protegido)
- `POST /posts/:id/upvote` - Dar upvote no post
- `POST /posts/:id/downvote` - Dar downvote no post
- `GET /posts/:id/comments` - Obter comentários do post

#### Enquetes (`/polls`)
- `POST /polls` - Criar enquete (protegido)
- `GET /polls/:id` - Obter detalhes da enquete
- `PUT /polls/:id` - Atualizar configuração da enquete (protegido)
- `DELETE /polls/:id` - Excluir enquete (protegido)
- `POST /polls/:id/vote` - Votar na enquete (protegido)
- `GET /polls/:id/results` - Obter resultados da enquete
- `GET /polls/:poll_id/options` - Listar opções da enquete
- `PUT /polls/:poll_id/options/:option_id` - Atualizar opção (protegido)
- `DELETE /polls/:poll_id/options/:option_id` - Excluir opção (protegido)

#### Comentários (`/comments`)
- `POST /posts/:post_id/comments` - Criar comentário (protegido)
- `GET /posts/:post_id/comments` - Listar comentários do post
- `GET /comments/:id` - Obter detalhes do comentário
- `PUT /comments/:id` - Atualizar comentário (protegido)
- `DELETE /comments/:id` - Excluir comentário (protegido)
- `POST /comments/:id/upvote` - Dar upvote no comentário
- `POST /comments/:id/downvote` - Dar downvote no comentário
- `POST /comments/:id/reply` - Responder a comentário (protegido)

#### Feed e Busca
- `GET /feed` - Feed principal (paginado)
- `GET /search?q=query&type=post` - Buscar posts
- `GET /stats` - Estatísticas da plataforma

## Exemplos de Requisições

### Registrar Usuário

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "username": "joaosilva",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joaosilva",
    "password": "senha123"
  }'
```

### Criar Enquete

```bash
curl -X POST http://localhost:3000/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "title": "Linguagem de Programação Favorita?",
    "content": "Vote na sua favorita",
    "multipleChoice": false,
    "options": ["JavaScript", "Python", "Java", "Go"]
  }'
```

### Votar na Enquete

```bash
curl -X POST http://localhost:3000/polls/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "optionIds": [1]
  }'
```

### Buscar Posts

```bash
curl -X GET "http://localhost:3000/search?q=programação&type=text"
```

## Esquema do Banco de Dados

### Tabelas

- **users** - Contas de usuário e autenticação
- **posts** - Posts do fórum (texto e enquetes)
- **polls** - Configuração da enquete
- **poll_options** - Opções individuais da enquete
- **poll_votes** - Votos dos usuários nas enquetes
- **comments** - Comentários dos posts (suporta aninhamento)

Para o esquema completo, veja `prisma/schema.prisma`

## Estrutura do Projeto

```
forum-backend/
├── src/
│   ├── controllers/         # Manipuladores de requisição
│   ├── services/           # Lógica de negócio
│   ├── routes/             # Definições de rota (com anotações Swagger)
│   ├── middleware/         # Middlewares customizados (auth, errors)
│   ├── swagger/            # Configuração do Swagger
│   │   └── swagger.config.ts
│   └── index.ts            # Ponto de entrada da aplicação
├── prisma/
│   └── schema.prisma       # Esquema do Banco de Dados
├── package.json
├── tsconfig.json
└── .env                    # Variáveis de ambiente
```

## Ferramentas de Desenvolvimento

### Prisma Studio

Abra um navegador visual do banco de dados:

```bash
npm run prisma:studio
```

### Scripts

- `npm run dev` - Iniciar servidor de desenvolvimento com hot reload
- `npm run build` - Construir para produção
- `npm start` - Iniciar servidor de produção
- `npm run prisma:generate` - Gerar Cliente Prisma
- `npm run prisma:migrate` - Executar migrações do banco de dados
- `npm run prisma:studio` - Abrir Prisma Studio

## Testando com Swagger UI

1. Inicie o servidor: `npm run dev`
2. Abra http://localhost:3000/api-docs
3. Clique em "Authorize" e insira um token JWT (obtenha um registrando-se/fazendo login)
4. Teste qualquer endpoint diretamente do navegador
5. Visualize exemplos e schemas de requisição/resposta

## Tecnologias Utilizadas

- **TypeScript** - JavaScript com segurança de tipos
- **Express** - Framework web
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Swagger/OpenAPI** - Documentação da API
- **Bcrypt** - Hash de senha

## Suporte

Para problemas ou perguntas, por favor, abra uma *issue* no repositório.