import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class CommentService {
  async createComment(data: {
    postId: number;
    userId: number;
    content: string;
    parentCommentId?: number;
  }) {
    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: data.postId } });
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // If parent comment ID provided, verify it exists and belongs to same post
    if (data.parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentCommentId }
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404);
      }

      if (parentComment.postId !== data.postId) {
        throw new AppError('Parent comment does not belong to this post', 400);
      }
    }

    return prisma.comment.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        content: data.content,
        parentCommentId: data.parentCommentId
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

  async getPostComments(postId: number) {
    return prisma.comment.findMany({
      where: {
        postId,
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
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCommentById(id: number) {
    const comment = await prisma.comment.findUnique({
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
        post: {
          select: {
            id: true,
            title: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    return comment;
  }

  async updateComment(id: number, content: string, userId: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return prisma.comment.update({
      where: { id },
      data: { content },
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

  async deleteComment(id: number, userId: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.comment.delete({ where: { id } });
    return { message: 'Comment deleted successfully' };
  }

  async upvoteComment(id: number) {
    return prisma.comment.update({
      where: { id },
      data: {
        upvotes: { increment: 1 }
      }
    });
  }

  async downvoteComment(id: number) {
    return prisma.comment.update({
      where: { id },
      data: {
        downvotes: { increment: 1 }
      }
    });
  }

  async replyToComment(commentId: number, userId: number, content: string) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!parentComment) {
      throw new AppError('Parent comment not found', 404);
    }

    return this.createComment({
      postId: parentComment.postId,
      userId,
      content,
      parentCommentId: commentId
    });
  }
}
