import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Forum API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for the Forum Backend application',
      contact: {
        name: 'Caio Liboreiro',
        email: 'liborioestudo@gmail.com'
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UserRegister: {
          type: 'object',
          required: ['firstName', 'lastName', 'username', 'email', 'password'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'johndoe' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'My First Post' },
            content: { type: 'string', example: 'This is the content of my post' },
            category: {type: 'string', example: 'Sports'},
            type: { type: 'string', enum: ['text', 'poll'], example: 'text' },
            upvotes: { type: 'integer', example: 10 },
            downvotes: { type: 'integer', example: 2 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        CreatePost: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', example: 'My First Post' },
            category: { type: 'string', example: 'General'},
            content: { type: 'string', example: 'This is the content of my post' },
            type: { type: 'string', enum: ['text', 'poll'], example: 'text' }
          }
        },
        Poll: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            postId: { type: 'integer', example: 1 },
            multipleChoice: { type: 'boolean', example: false },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            options: {
              type: 'array',
              items: { $ref: '#/components/schemas/PollOption' }
            }
          }
        },
        CreatePoll: {
          type: 'object',
          required: ['title', 'options'],
          properties: {
            title: { type: 'string', example: 'What is your favorite language?' },
            content: { type: 'string', example: 'Vote for your favorite programming language' },
            category: { type: 'string', example: 'General'},
            multipleChoice: { type: 'boolean', example: false },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            options: {
              type: 'array',
              items: { type: 'string' },
              example: ['JavaScript', 'Python', 'Java', 'Go']
            }
          }
        },
        PollOption: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            pollId: { type: 'integer', example: 1 },
            optionText: { type: 'string', example: 'JavaScript' },
            voteCount: { type: 'integer', example: 15 }
          }
        },
        PollVote: {
          type: 'object',
          required: ['optionIds'],
          properties: {
            optionIds: {
              type: 'array',
              items: { type: 'integer' },
              example: [1]
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            postId: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            content: { type: 'string', example: 'Great post!' },
            upvotes: { type: 'integer', example: 5 },
            downvotes: { type: 'integer', example: 0 },
            parentCommentId: { type: 'integer', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        CreateComment: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Great post!' },
            parentCommentId: { type: 'integer', nullable: true, example: null }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 }
          }
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        BadRequestError: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User management and authentication'
      },
      {
        name: 'Posts',
        description: 'Post operations'
      },
      {
        name: 'Polls',
        description: 'Poll creation and voting'
      },
      {
        name: 'Comments',
        description: 'Comment operations'
      },
      {
        name: 'Feed',
        description: 'Feed, search'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/swagger/paths/*.yaml']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Forum API Documentation'
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api-docs');
};

export default swaggerSpec;