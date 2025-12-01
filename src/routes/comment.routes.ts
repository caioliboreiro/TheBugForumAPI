import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const commentController = new CommentController();

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', commentController.getCommentById);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', AuthMiddleware.authenticate, commentController.updateComment);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', AuthMiddleware.authenticate, commentController.deleteComment);

/**
 * @swagger
 * /comments/{id}/upvote:
 *   post:
 *     summary: Upvote a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment upvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: User has already upvoted or has an existing downvote
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/upvote', commentController.upvoteComment);

/**
 * @swagger
 * /comments/{id}/downvote:
 *   post:
 *     summary: Downvote a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment downvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: User has already downvoted or has an existing upvote
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/downvote', commentController.downvoteComment);

/**
 * @swagger
 * /comments/{id}/remove-upvote:
 *   post:
 *     summary: Remove upvote from a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Upvote removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: User has not upvoted this comment
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/remove-upvote', AuthMiddleware.authenticate, commentController.removeUpvote);

/**
 * @swagger
 * /comments/{id}/remove-downvote:
 *   post:
 *     summary: Remove downvote from a comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Downvote removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: User has not downvoted this comment
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/remove-downvote', AuthMiddleware.authenticate, commentController.removeDownvote);

/**
 * @swagger
 * /comments/{id}/reply:
 *   post:
 *     summary: Reply to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is a reply to the comment
 *     responses:
 *       201:
 *         description: Reply created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/reply', AuthMiddleware.authenticate, commentController.replyToComment);

/**
 * @swagger
 * /posts/{post_id}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComment'
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
const postCommentRouter = Router();
postCommentRouter.post('/posts/:post_id/comments', AuthMiddleware.authenticate, commentController.createComment);

/**
 * @swagger
 * /posts/{post_id}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     description: Returns comments with nested replies up to a specified depth level. Use depth parameter to control how many levels of replies to fetch.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: query
 *         name: depth
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 3
 *         description: Maximum depth of nested replies to fetch (0 = only top-level comments, 1 = comments + direct replies, etc.)
 *         example: 2
 *     responses:
 *       200:
 *         description: List of comments in tree structure with specified depth
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Comment'
 *                   - type: object
 *                     properties:
 *                       replies:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Comment'
 *                       hasMoreReplies:
 *                         type: boolean
 *                         description: Indicates if there are more replies beyond the requested depth
 *             examples:
 *               depth0:
 *                 summary: Depth 0 - Only top-level comments
 *                 value:
 *                   - id: 1
 *                     content: "Great post!"
 *                     replies: []
 *                     hasMoreReplies: true
 *               depth1:
 *                 summary: Depth 1 - Comments with direct replies
 *                 value:
 *                   - id: 1
 *                     content: "Great post!"
 *                     replies:
 *                       - id: 2
 *                         content: "I agree!"
 *                         replies: []
 *                         hasMoreReplies: false
 *                     hasMoreReplies: false
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
postCommentRouter.get('/posts/:post_id/comments', commentController.getPostComments);

export { postCommentRouter };
export default router;