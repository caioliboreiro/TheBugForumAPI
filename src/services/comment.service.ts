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

  private async getCommentsWithDepth(
    postId: number,
    parentCommentId: number | null,
    currentDepth: number,
    maxDepth: number,
    currentUserId?: number,
    userVotesCache?: Map<number, string>
  ): Promise<any[]> {
    // Base case: reached max depth
    if (currentDepth >= maxDepth) {
      return [];
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId
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
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: { createdAt: currentDepth === 0 ? 'desc' : 'asc' }
    });

    // Recursively fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.getCommentsWithDepth(
          postId,
          comment.id,
          currentDepth + 1,
          maxDepth,
          currentUserId,
          userVotesCache
        );

        const voteType = userVotesCache?.get(comment.id);
        return {
          ...comment,
          replies,
          hasMoreReplies: comment._count.replies > replies.length,
          wasUpvoted: voteType === 'upvote',
          wasDownvoted: voteType === 'downvote'
        };
      })
    );

    return commentsWithReplies;
  }

  async getPostComments(postId: number, depth?: number, currentUserId?: number) {
    // Default depth is 3 levels if not specified
    const maxDepth = depth !== undefined ? depth : 3;

    // Validate depth
    if (maxDepth < 0) {
      throw new AppError('Depth must be a non-negative number', 400);
    }

    // Fetch vote records for current user if authenticated
    let userVotesCache: Map<number, string> = new Map();
    if (currentUserId) {
      const votes = await prisma.commentVote.findMany({
        where: { userId: currentUserId }
      });
      userVotesCache = new Map(votes.map(v => [v.commentId, v.voteType]));
    }

    // If depth is 0, return only top-level comments without any replies
    if (maxDepth === 0) {
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
          _count: {
            select: {
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).then(comments => 
        comments.map(comment => ({
          ...comment,
          replies: [],
          hasMoreReplies: comment._count.replies > 0,
          wasUpvoted: userVotesCache.get(comment.id) === 'upvote',
          wasDownvoted: userVotesCache.get(comment.id) === 'downvote'
        }))
      );
    }

    // Get all comments with nested structure up to specified depth
    return this.getCommentsWithDepth(postId, null, 0, maxDepth+1, currentUserId, userVotesCache);
  }

  async getCommentById(id: number, currentUserId?: number) {
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

    // Fetch vote record for current user if authenticated
    let wasUpvoted = false;
    let wasDownvoted = false;
    if (currentUserId) {
      const userVote = await prisma.commentVote.findUnique({
        where: { userId_commentId: { userId: currentUserId, commentId: id } }
      });
      if (userVote) {
        wasUpvoted = userVote.voteType === 'upvote';
        wasDownvoted = userVote.voteType === 'downvote';
      }
    }

    return {
      ...comment,
      wasUpvoted,
      wasDownvoted
    };
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

  async upvoteComment(id: number, userId?: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // If userId provided, check for existing vote
    if (userId) {
      const existingVote = await prisma.commentVote.findUnique({
        where: { userId_commentId: { userId, commentId: id } }
      });

      if (existingVote) {
        if (existingVote.voteType === 'upvote') {
          throw new AppError('User has already upvoted this comment', 400);
        } else if (existingVote.voteType === 'downvote') {
          throw new AppError('Cannot upvote a comment you have already downvoted. Remove your downvote first.', 400);
        }
      }

      // Record the upvote
      await prisma.commentVote.create({
        data: { userId, commentId: id, voteType: 'upvote' }
      });
    }

    return prisma.comment.update({
      where: { id },
      data: { upvotes: { increment: 1 } }
    });
  }

  async downvoteComment(id: number, userId?: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // If userId provided, check for existing vote
    if (userId) {
      const existingVote = await prisma.commentVote.findUnique({
        where: { userId_commentId: { userId, commentId: id } }
      });

      if (existingVote) {
        if (existingVote.voteType === 'downvote') {
          throw new AppError('User has already downvoted this comment', 400);
        } else if (existingVote.voteType === 'upvote') {
          throw new AppError('Cannot downvote a comment you have already upvoted. Remove your upvote first.', 400);
        }
      }

      // Record the downvote
      await prisma.commentVote.create({
        data: { userId, commentId: id, voteType: 'downvote' }
      });
    }

    return prisma.comment.update({
      where: { id },
      data: { downvotes: { increment: 1 } }
    });
  }

  async removeUpvote(id: number, userId: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const vote = await prisma.commentVote.findUnique({
      where: { userId_commentId: { userId, commentId: id } }
    });

    if (!vote) {
      throw new AppError('No vote found for this comment', 404);
    }

    if (vote.voteType !== 'upvote') {
      throw new AppError('User has not upvoted this comment', 400);
    }

    // Delete the vote record
    await prisma.commentVote.delete({
      where: { userId_commentId: { userId, commentId: id } }
    });

    // Decrement upvote count
    return prisma.comment.update({
      where: { id },
      data: { upvotes: { decrement: 1 } }
    });
  }

  async removeDownvote(id: number, userId: number) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const vote = await prisma.commentVote.findUnique({
      where: { userId_commentId: { userId, commentId: id } }
    });

    if (!vote) {
      throw new AppError('No vote found for this comment', 404);
    }

    if (vote.voteType !== 'downvote') {
      throw new AppError('User has not downvoted this comment', 400);
    }

    // Delete the vote record
    await prisma.commentVote.delete({
      where: { userId_commentId: { userId, commentId: id } }
    });

    // Decrement downvote count
    return prisma.comment.update({
      where: { id },
      data: { downvotes: { decrement: 1 } }
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