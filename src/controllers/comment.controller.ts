import { Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.createComment({
        postId: parseInt(req.params.post_id),
        userId: req.userId!,
        content: req.body.content,
        parentCommentId: req.body.parentCommentId
      });
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  };

  getPostComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comments = await this.commentService.getPostComments(
        parseInt(req.params.post_id),
        req.query.depth ? parseInt(req.query.depth.toString()) : undefined,
        req.userId
      );
      res.json(comments);
    } catch (error) {
      next(error);
    }
  };

  getCommentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.getCommentById(parseInt(req.params.id), req.userId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.updateComment(
        parseInt(req.params.id),
        req.body.content,
        req.userId!
      );
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.commentService.deleteComment(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  upvoteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const comment = await this.commentService.upvoteComment(parseInt(req.params.id), userId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  downvoteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const comment = await this.commentService.downvoteComment(parseInt(req.params.id), userId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  removeUpvote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.removeUpvote(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  removeDownvote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.removeDownvote(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(comment);
    } catch (error) {
      next(error);
    }
  };

  replyToComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await this.commentService.replyToComment(
        parseInt(req.params.id),
        req.userId!,
        req.body.content
      );
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  };
}