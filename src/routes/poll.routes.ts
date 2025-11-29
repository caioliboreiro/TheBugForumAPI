import { Router } from 'express';
import { PollController } from '../controllers/poll.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const pollController = new PollController();

/**
 * @swagger
 * /polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePoll'
 *     responses:
 *       201:
 *         description: Poll created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Poll'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/', AuthMiddleware.authenticate, pollController.createPoll);

/**
 * @swagger
 * /polls/{id}:
 *   get:
 *     summary: Get poll by ID
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll details with options and votes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Poll'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', pollController.getPollById);

/**
 * @swagger
 * /polls/{id}:
 *   put:
 *     summary: Update poll configuration
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               multipleChoice:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Poll updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Poll'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', AuthMiddleware.authenticate, pollController.updatePoll);

/**
 * @swagger
 * /polls/{id}:
 *   delete:
 *     summary: Delete a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', AuthMiddleware.authenticate, pollController.deletePoll);

/**
 * @swagger
 * /polls/{id}/vote:
 *   post:
 *     summary: Vote in a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PollVote'
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pollId:
 *                   type: integer
 *                 totalVotes:
 *                   type: integer
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       votes:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/vote', AuthMiddleware.authenticate, pollController.votePoll);

/**
 * @swagger
 * /polls/{id}/results:
 *   get:
 *     summary: Get poll results
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll results with vote counts and percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pollId:
 *                   type: integer
 *                 totalVotes:
 *                   type: integer
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       votes:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/results', pollController.getPollResults);

/**
 * @swagger
 * /polls/{poll_id}/options:
 *   get:
 *     summary: Get poll options
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: poll_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: List of poll options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PollOption'
 */
router.get('/:poll_id/options', pollController.getPollOptions);

/**
 * @swagger
 * /polls/{poll_id}/options/{option_id}:
 *   put:
 *     summary: Update poll option text
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poll_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *       - in: path
 *         name: option_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Option ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [optionText]
 *             properties:
 *               optionText:
 *                 type: string
 *                 example: Updated option text
 *     responses:
 *       200:
 *         description: Option updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PollOption'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:poll_id/options/:option_id', AuthMiddleware.authenticate, pollController.updatePollOption);

/**
 * @swagger
 * /polls/{poll_id}/options/{option_id}:
 *   delete:
 *     summary: Delete poll option
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poll_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *       - in: path
 *         name: option_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Option ID
 *     responses:
 *       200:
 *         description: Option deleted
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:poll_id/options/:option_id', AuthMiddleware.authenticate, pollController.deletePollOption);

export default router;