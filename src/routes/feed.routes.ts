import { NextFunction, Router } from 'express';
import { Category, PrismaClient } from '@prisma/client';
import { AuthMiddleware, AuthRequest } from '../middleware/auth.middleware';

const feedRouter = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /feed:
 *   get:
 *     summary: Get main feed
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Events, Finances, Sports]
 *         description: Filter by post category
 *     responses:
 *       200:
 *         description: Feed with posts and polls ordered by relevance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
feedRouter.get('/feed', 
  AuthMiddleware.optionalAuth,
  async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;
    const currentUserId = req.userId;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category && category !== "General") where.category = category as Category;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          poll: {
            include: {
              options: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.post.count({ where })
    ]);

    // Fetch vote records for current user if authenticated
    let userVotes: Map<number, string> = new Map();
    if (currentUserId) {
      const votes = await prisma.postVote.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) }
        }
      });
      userVotes = new Map(votes.map(v => [v.postId, v.voteType]));
    }

    // Add vote flags to posts
    const postsWithVoteFlags = posts.map(post => ({
      ...post,
      wasUpvoted: userVotes.get(post.id) === 'upvote',
      wasDownvoted: userVotes.get(post.id) === 'downvote'
    }));

    res.json({
      posts: postsWithVoteFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search posts
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, poll]
 *         description: Filter by post type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
feedRouter.get('/search', AuthMiddleware.optionalAuth, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const currentUserId = req.userId;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (type) {
      where.type = type;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          poll: {
            include: {
              options: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ]);

    // Fetch vote records for current user if authenticated
    let userVotes: Map<number, string> = new Map();
    if (currentUserId) {
      const votes = await prisma.postVote.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) }
        }
      });
      userVotes = new Map(votes.map(v => [v.postId, v.voteType]));
    }

    // Add vote flags to posts
    const postsWithVoteFlags = posts.map(post => ({
      ...post,
      wasUpvoted: userVotes.get(post.id) === 'upvote',
      wasDownvoted: userVotes.get(post.id) === 'downvote'
    }));

    res.json({
      posts: postsWithVoteFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default feedRouter;