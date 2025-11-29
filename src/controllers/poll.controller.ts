import { Response, NextFunction } from 'express';
import { PollService } from '../services/poll.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PollController {
  private pollService: PollService;

  constructor() {
    this.pollService = new PollService();
  }

  createPoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const poll = await this.pollService.createPoll({
        userId: req.userId!,
        ...req.body
      });
      res.status(201).json(poll);
    } catch (error) {
      next(error);
    }
  };

  getPollById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const poll = await this.pollService.getPollById(parseInt(req.params.id));
      res.json(poll);
    } catch (error) {
      next(error);
    }
  };

  updatePoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const poll = await this.pollService.updatePoll(
        parseInt(req.params.id),
        req.body,
        req.userId!
      );
      res.json(poll);
    } catch (error) {
      next(error);
    }
  };

  deletePoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.pollService.deletePoll(
        parseInt(req.params.id),
        req.userId!
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  votePoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { optionIds } = req.body;
      const result = await this.pollService.votePoll(
        parseInt(req.params.id),
        req.userId!,
        optionIds
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getPollResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const results = await this.pollService.getPollResults(parseInt(req.params.id));
      res.json(results);
    } catch (error) {
      next(error);
    }
  };

  getPollOptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const options = await this.pollService.getPollOptions(parseInt(req.params.poll_id));
      res.json(options);
    } catch (error) {
      next(error);
    }
  };

  updatePollOption = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { optionText } = req.body;
      const option = await this.pollService.updatePollOption(
        parseInt(req.params.poll_id),
        parseInt(req.params.option_id),
        optionText,
        req.userId!
      );
      res.json(option);
    } catch (error) {
      next(error);
    }
  };

  deletePollOption = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.pollService.deletePollOption(
        parseInt(req.params.poll_id),
        parseInt(req.params.option_id),
        req.userId!
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}