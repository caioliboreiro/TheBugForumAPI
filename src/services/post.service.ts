import { Category, PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class PostService {
  async createPost(data: {
    userId: number;
    title: string;
    content: string;
    category: Category;
    type?: string;
  }) {
    return prisma.post.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        category: data.category,
        type: data.type || 'text'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getAllPosts(page: number = 1, limit: number = 20, type?: string, category?: Category | string, currentUserId?: number) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category as Category;

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

    return {
      posts: postsWithVoteFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPostById(id: number, currentUserId?: number) {
    const post = await prisma.post.findUnique({
      where: { id },
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
            options: {
              include: {
                votes: {
                  select: {
                    userId: true,
                    votedAt: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Fetch vote record for current user if authenticated
    let wasUpvoted = false;
    let wasDownvoted = false;
    if (currentUserId) {
      const userVote = await prisma.postVote.findUnique({
        where: { userId_postId: { userId: currentUserId, postId: id } }
      });
      if (userVote) {
        wasUpvoted = userVote.voteType === 'upvote';
        wasDownvoted = userVote.voteType === 'downvote';
      }
    }

    return {
      ...post,
      wasUpvoted,
      wasDownvoted
    };
  }

  async updatePost(id: number, data: any, userId: number) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.category) updateData.category = data.category;

    return prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
  }

  async deletePost(id: number, userId: number) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.post.delete({ where: { id } });
    return { message: 'Post deleted successfully' };
  }

  async upvotePost(id: number, userId?: number) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // If userId provided, check for existing vote
    if (userId) {
      const existingVote = await prisma.postVote.findUnique({
        where: { userId_postId: { userId, postId: id } }
      });

      if (existingVote) {
        if (existingVote.voteType === 'upvote') {
          throw new AppError('User has already upvoted this post', 400);
        } else if (existingVote.voteType === 'downvote') {
          throw new AppError('Cannot upvote a post you have already downvoted. Remove your downvote first.', 400);
        }
      }

      // Record the upvote
      await prisma.postVote.create({
        data: { userId, postId: id, voteType: 'upvote' }
      });
    }

    return prisma.post.update({
      where: { id },
      data: { upvotes: { increment: 1 } }
    });
  }

  async downvotePost(id: number, userId?: number) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // If userId provided, check for existing vote
    if (userId) {
      const existingVote = await prisma.postVote.findUnique({
        where: { userId_postId: { userId, postId: id } }
      });

      if (existingVote) {
        if (existingVote.voteType === 'downvote') {
          throw new AppError('User has already downvoted this post', 400);
        } else if (existingVote.voteType === 'upvote') {
          throw new AppError('Cannot downvote a post you have already upvoted. Remove your upvote first.', 400);
        }
      }

      // Record the downvote
      await prisma.postVote.create({
        data: { userId, postId: id, voteType: 'downvote' }
      });
    }

    return prisma.post.update({
      where: { id },
      data: { downvotes: { increment: 1 } }
    });
  }

  async removeUpvote(id: number, userId: number) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const vote = await prisma.postVote.findUnique({
      where: { userId_postId: { userId, postId: id } }
    });

    if (!vote) {
      throw new AppError('No vote found for this post', 404);
    }

    if (vote.voteType !== 'upvote') {
      throw new AppError('User has not upvoted this post', 400);
    }

    // Delete the vote record
    await prisma.postVote.delete({
      where: { userId_postId: { userId, postId: id } }
    });

    // Decrement upvote count
    return prisma.post.update({
      where: { id },
      data: { upvotes: { decrement: 1 } }
    });
  }

  async removeDownvote(id: number, userId: number) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const vote = await prisma.postVote.findUnique({
      where: { userId_postId: { userId, postId: id } }
    });

    if (!vote) {
      throw new AppError('No vote found for this post', 404);
    }

    if (vote.voteType !== 'downvote') {
      throw new AppError('User has not downvoted this post', 400);
    }

    // Delete the vote record
    await prisma.postVote.delete({
      where: { userId_postId: { userId, postId: id } }
    });

    // Decrement downvote count
    return prisma.post.update({
      where: { id },
      data: { downvotes: { decrement: 1 } }
    });
  }
}