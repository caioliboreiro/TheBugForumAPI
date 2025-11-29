import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class PollService {
  async createPoll(data: {
    userId: number;
    title: string;
    content?: string;
    multipleChoice?: boolean;
    expiresAt?: Date;
    options: string[];
  }) {
    // Create post first
    const post = await prisma.post.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content || '',
        type: 'poll'
      }
    });

    // Create poll
    const poll = await prisma.poll.create({
      data: {
        postId: post.id,
        multipleChoice: data.multipleChoice || false,
        expiresAt: data.expiresAt,
        options: {
          create: data.options.map(option => ({
            optionText: option
          }))
        }
      },
      include: {
        options: true,
        post: {
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
      }
    });

    return poll;
  }

  async getPollById(id: number) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        post: {
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
        },
        options: {
          include: {
            votes: {
              select: {
                userId: true,
                votedAt: true,
                user: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    return poll;
  }

  async updatePoll(id: number, data: any, userId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { post: true }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (poll.post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new AppError('Cannot edit an expired poll', 400);
    }

    const updateData: any = {};
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.multipleChoice !== undefined) updateData.multipleChoice = data.multipleChoice;

    return prisma.poll.update({
      where: { id },
      data: updateData,
      include: {
        options: true,
        post: true
      }
    });
  }

  async deletePoll(id: number, userId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { post: true }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (poll.post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Deleting poll will cascade delete options and votes
    await prisma.poll.delete({ where: { id } });
    
    // Also delete the associated post
    await prisma.post.delete({ where: { id: poll.postId } });

    return { message: 'Poll deleted successfully' };
  }

  async votePoll(pollId: number, userId: number, optionIds: number[]) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    // Check if poll is expired
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new AppError('Poll has expired', 400);
    }

    // Check if trying to vote for multiple options when not allowed
    if (!poll.multipleChoice && optionIds.length > 1) {
      throw new AppError('Multiple choice not allowed for this poll', 400);
    }

    // Verify all option IDs belong to this poll
    const validOptionIds = poll.options.map(o => o.id);
    const allValid = optionIds.every(id => validOptionIds.includes(id));
    if (!allValid) {
      throw new AppError('Invalid option IDs', 400);
    }

    // Remove previous votes if not multiple choice
    if (!poll.multipleChoice) {
      await prisma.pollVote.deleteMany({
        where: {
          userId,
          option: {
            pollId
          }
        }
      });

      // Decrement vote counts for previously voted options
      await prisma.pollOption.updateMany({
        where: {
          pollId,
          votes: {
            some: {
              userId
            }
          }
        },
        data: {
          voteCount: { decrement: 1 }
        }
      });
    }

    // Add new votes
    await prisma.$transaction(
      optionIds.map(optionId =>
        prisma.pollVote.upsert({
          where: {
            userId_optionId: {
              userId,
              optionId
            }
          },
          create: {
            userId,
            optionId
          },
          update: {}
        })
      )
    );

    // Increment vote counts
    await prisma.$transaction(
      optionIds.map(optionId =>
        prisma.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } }
        })
      )
    );

    return this.getPollResults(pollId);
  }

  async getPollResults(pollId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return {
      pollId: poll.id,
      totalVotes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.optionText,
        votes: opt.voteCount,
        percentage: totalVotes > 0 ? (opt.voteCount / totalVotes) * 100 : 0
      }))
    };
  }

  async getPollOptions(pollId: number) {
    return prisma.pollOption.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });
  }

  async updatePollOption(pollId: number, optionId: number, optionText: string, userId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { post: true }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (poll.post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return prisma.pollOption.update({
      where: { id: optionId },
      data: { optionText }
    });
  }

  async deletePollOption(pollId: number, optionId: number, userId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { post: true, options: true }
    });

    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (poll.post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (poll.options.length <= 2) {
      throw new AppError('Cannot delete option. Poll must have at least 2 options', 400);
    }

    await prisma.pollOption.delete({ where: { id: optionId } });
    return { message: 'Option deleted successfully' };
  }
}

