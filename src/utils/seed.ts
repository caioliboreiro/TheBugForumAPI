import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database (this will remove existing data)...');

  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.postVote.deleteMany();
  await prisma.commentVote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('123@Senha', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        firstName: 'Alice',
        lastName: 'Anderson',
        username: 'alice',
        email: 'alice@example.com',
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Caio',
        lastName: 'Liboreiro',
        username: 'caioliboreiro',
        email: 'caioliboreiro@gmail.com',
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Bob',
        lastName: 'Brown',
        username: 'bob',
        email: 'bob@example.com',
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Carol',
        lastName: 'Clark',
        username: 'carol',
        email: 'carol@example.com',
        passwordHash
      }
    })
  ]);

  const [alice, bob, carol] = users;

  console.log('Seeding posts...');

  const post1 = await prisma.post.create({
    data: {
      userId: alice.id,
      title: 'Welcome to TheBug',
      content: 'This is the first post in the seeded forum. Say hi!',
      category: 'General',
      type: 'text'
    }
  });

  const post2 = await prisma.post.create({
    data: {
      userId: bob.id,
      title: 'Sports discussion',
      content: 'Who is your favorite player this season?',
      category: 'Sports',
      type: 'text'
    }
  });

  const post3 = await prisma.post.create({
    data: {
      userId: carol.id,
      title: 'Favorite programming language',
      content: 'Vote for your favorite language',
      category: 'General',
      type: 'poll',
      poll: {
        create: {
          multipleChoice: false,
          options: {
            create: [
              { optionText: 'JavaScript' },
              { optionText: 'Python' },
              { optionText: 'TypeScript' }
            ]
          }
        }
      }
    },
    include: {
      poll: { include: { options: true } }
    }
  });

  console.log('Seeding comments...');

  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: bob.id,
      content: 'Nice to meet you all!'
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: carol.id,
      content: "Welcome Alice! Looking forward to great discussions.",
      parentCommentId: comment1.id
    }
  });

  const comment3 = await prisma.comment.create({
    data: {
      postId: post2.id,
      userId: alice.id,
      content: 'I like watching matches on weekends.'
    }
  });

  console.log('Seeding votes...');

  await prisma.postVote.create({ data: { userId: bob.id, postId: post1.id, voteType: 'upvote' } });
  await prisma.postVote.create({ data: { userId: carol.id, postId: post1.id, voteType: 'upvote' } });
  await prisma.post.update({ where: { id: post1.id }, data: { upvotes: { increment: 2 } } });

  await prisma.postVote.create({ data: { userId: alice.id, postId: post2.id, voteType: 'upvote' } });
  await prisma.post.update({ where: { id: post2.id }, data: { upvotes: { increment: 1 } } });

  await prisma.commentVote.create({ data: { userId: alice.id, commentId: comment1.id, voteType: 'upvote' } });
  await prisma.comment.update({ where: { id: comment1.id }, data: { upvotes: { increment: 1 } } });

  const optionToVote = post3.poll?.options?.[0];
  if (optionToVote) {
    await prisma.pollVote.create({ data: { userId: alice.id, optionId: optionToVote.id } });
    await prisma.pollOption.update({ where: { id: optionToVote.id }, data: { voteCount: { increment: 1 } } });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
