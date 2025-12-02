import { Router } from 'express';
import { Category, PrismaClient } from '@prisma/client';

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
feedRouter.get('/feed', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category as Category;

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
      prisma.post.count()
    ]);

    res.json({
      posts,
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
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
feedRouter.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string;

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

    const posts = await prisma.post.findMany({
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(posts);
  } catch (error) {
    next(error);
  }
});

export default feedRouter;