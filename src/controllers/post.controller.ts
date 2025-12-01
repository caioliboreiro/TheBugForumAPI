import { Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const post = await this.postService.createPost({
        userId: req.userId!,
        ...req.body
      });
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  };

  getAllPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await this.postService.getAllPosts(page, limit, type, category, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getPostById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const post = await this.postService.getPostById(parseInt(req.params.id), req.userId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const post = await this.postService.updatePost(
        parseInt(req.params.id),
        req.body,
        req.userId!
      );
      res.json(post);
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.postService.deletePost(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  upvotePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const post = await this.postService.upvotePost(parseInt(req.params.id), userId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  };

  downvotePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const post = await this.postService.downvotePost(parseInt(req.params.id), userId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  };

  removeUpvote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const post = await this.postService.removeUpvote(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(post);
    } catch (error) {
      next(error);
    }
  };

  removeDownvote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const post = await this.postService.removeDownvote(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(post);
    } catch (error) {
      next(error);
    }
  };
}