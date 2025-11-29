import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const result = await this.userService.login(username, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(parseInt(req.params.id));
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.updateUser(
        parseInt(req.params.id),
        req.body,
        req.userId!
      );
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.deleteUser(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const posts = await this.userService.getUserPosts(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      next(error);
    }
  };

  getUserComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const comments = await this.userService.getUserComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      next(error);
    }
  };
}