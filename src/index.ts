import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import pollRoutes from './routes/poll.routes';
import commentRoutes, { postCommentRouter } from './routes/comment.routes';
import feedRoutes from './routes/feed.routes'
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './swagger/swagger.config';

dotenv.config();

export const prisma = new PrismaClient();

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupSwagger(): void {
    setupSwagger(this.app);
  }

  private setupRoutes(): void {
    this.app.get('/', (req, res) => {
      res.json({ 
        message: 'Forum API is running',
        documentation: '/api-docs'
      });
    });

    this.app.use('/users', userRoutes);
    this.app.use('/posts', postRoutes);
    this.app.use('/polls', pollRoutes);
    this.app.use('/comments', commentRoutes);
    this.app.use('/', postCommentRouter);
    this.app.use('/', feedRoutes);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');

      this.app.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
        console.log(`API Documentation: http://localhost:${this.port}/api-docs`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await prisma.$disconnect();
  }
}

const server = new Server();
server.start();

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});