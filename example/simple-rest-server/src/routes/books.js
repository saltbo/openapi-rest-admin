const express = require('express');
const { body, validationResult, query } = require('express-validator');
const store = require('../store');

const router = express.Router();

/**
 * @swagger
 * /books:
 *   get:
 *     summary: 获取所有书籍
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: 按书籍标题过滤
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: 按作者ID过滤
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: 按类型过滤
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 返回结果数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: 分页偏移量
 *     responses:
 *       200:
 *         description: 成功返回书籍列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 total:
 *                   type: integer
 *                   description: 总数量
 *                 limit:
 *                   type: integer
 *                   description: 限制数量
 *                 offset:
 *                   type: integer
 *                   description: 偏移量
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '请求参数错误',
      details: errors.array()
    });
  }

  try {
    const { title, authorId, genre } = req.query;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    // 构建过滤条件
    const filters = {};
    if (title) filters.title = title;
    if (authorId) filters.authorId = authorId;
    if (genre) filters.genre = genre;

    // 获取所有匹配的数据
    const allBooks = store.getAll('books', filters);
    
    // 应用分页
    const total = allBooks.length;
    const paginatedBooks = allBooks.slice(offset, offset + limit);

    res.json({
      data: paginatedBooks,
      total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取书籍列表失败'
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: 根据ID获取书籍详情
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 书籍ID
 *     responses:
 *       200:
 *         description: 成功返回书籍详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res) => {
  try {
    const book = store.getById('books', req.params.id);
    
    if (!book) {
      return res.status(404).json({
        error: 'Not Found',
        message: '书籍未找到'
      });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取书籍详情失败'
    });
  }
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: 创建新书籍
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - authorId
 *             properties:
 *               title:
 *                 type: string
 *                 description: 书籍标题
 *               authorId:
 *                 type: string
 *                 description: 作者ID
 *               isbn:
 *                 type: string
 *                 description: ISBN号码
 *               genre:
 *                 type: string
 *                 description: 书籍类型
 *               publishedDate:
 *                 type: string
 *                 format: date
 *                 description: 出版日期
 *               description:
 *                 type: string
 *                 description: 书籍描述
 *               price:
 *                 type: number
 *                 format: float
 *                 description: 价格
 *     responses:
 *       201:
 *         description: 成功创建书籍
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', [
  body('title').notEmpty().withMessage('书籍标题不能为空'),
  body('authorId').notEmpty().withMessage('作者ID不能为空'),
  body('isbn').optional().isString().withMessage('ISBN必须是字符串'),
  body('genre').optional().isString().withMessage('类型必须是字符串'),
  body('publishedDate').optional().isISO8601().withMessage('请提供有效的日期格式(YYYY-MM-DD)'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('price').optional().isFloat({ min: 0 }).withMessage('价格必须是非负数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '请求参数错误',
      details: errors.array()
    });
  }

  try {
    // 验证作者是否存在
    const author = store.getById('authors', req.body.authorId);
    if (!author) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '指定的作者不存在'
      });
    }

    // 检查ISBN是否已存在
    if (req.body.isbn) {
      const existingBooks = store.getAll('books', { isbn: req.body.isbn });
      if (existingBooks.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '该ISBN已被使用'
        });
      }
    }

    const book = store.create('books', req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '创建书籍失败'
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: 更新书籍信息
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 书籍ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 书籍标题
 *               authorId:
 *                 type: string
 *                 description: 作者ID
 *               isbn:
 *                 type: string
 *                 description: ISBN号码
 *               genre:
 *                 type: string
 *                 description: 书籍类型
 *               publishedDate:
 *                 type: string
 *                 format: date
 *                 description: 出版日期
 *               description:
 *                 type: string
 *                 description: 书籍描述
 *               price:
 *                 type: number
 *                 format: float
 *                 description: 价格
 *     responses:
 *       200:
 *         description: 成功更新书籍
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('书籍标题不能为空'),
  body('authorId').optional().notEmpty().withMessage('作者ID不能为空'),
  body('isbn').optional().isString().withMessage('ISBN必须是字符串'),
  body('genre').optional().isString().withMessage('类型必须是字符串'),
  body('publishedDate').optional().isISO8601().withMessage('请提供有效的日期格式(YYYY-MM-DD)'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('price').optional().isFloat({ min: 0 }).withMessage('价格必须是非负数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '请求参数错误',
      details: errors.array()
    });
  }

  try {
    const bookId = req.params.id;
    
    // 如果要更新作者ID，验证作者是否存在
    if (req.body.authorId) {
      const author = store.getById('authors', req.body.authorId);
      if (!author) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的作者不存在'
        });
      }
    }

    // 如果要更新ISBN，检查是否已被其他书籍使用
    if (req.body.isbn) {
      const existingBooks = store.getAll('books', { isbn: req.body.isbn });
      const conflictBook = existingBooks.find(book => book.id !== bookId);
      if (conflictBook) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '该ISBN已被其他书籍使用'
        });
      }
    }

    const updatedBook = store.update('books', bookId, req.body);
    
    if (!updatedBook) {
      return res.status(404).json({
        error: 'Not Found',
        message: '书籍未找到'
      });
    }

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新书籍失败'
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: 删除书籍
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 书籍ID
 *     responses:
 *       204:
 *         description: 成功删除书籍
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.delete('books', req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '书籍未找到'
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除书籍失败'
    });
  }
});

/**
 * @swagger
 * /books/{id}/notes:
 *   get:
 *     summary: 获取书籍的所有笔记
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 书籍ID
 *     responses:
 *       200:
 *         description: 成功返回书籍的笔记列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/notes', (req, res) => {
  try {
    const book = store.getById('books', req.params.id);
    
    if (!book) {
      return res.status(404).json({
        error: 'Not Found',
        message: '书籍未找到'
      });
    }

    const notes = store.getNotesByBook(req.params.id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取书籍笔记失败'
    });
  }
});

module.exports = router;
