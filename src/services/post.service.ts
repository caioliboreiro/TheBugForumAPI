import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class PostService {
  async createPost(data: {
    userId: number;
    title: string;
    content: string;
    type?: string;
  }) {
    return prisma.post.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
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

  async getAllPosts(page: number = 1, limit: number = 20, type?: string) {
    const skip = (page - 1) * limit;
    
    const where = type ? { type } : {};

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

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPostById(id: number) {
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

    return post;
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

  async upvotePost(id: number) {
    const post = await prisma.post.update({
      where: { id },
      data: {
        upvotes: { increment: 1 }
      }
    });

    return post;
  }

  async downvotePost(id: number) {
    const post = await prisma.post.update({
      where: { id },
      data: {
        downvotes: { increment: 1 }
      }
    });

    return post;
  }

  async getPostComments(id: number) {
    return prisma.comment.findMany({
      where: { 
        postId: id,
        parentCommentId: null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}