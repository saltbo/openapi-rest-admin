const express = require('express');
const { body, validationResult, query } = require('express-validator');
const store = require('../store');

const router = express.Router();

/**
 * @swagger
 * /authors:
 *   get:
 *     summary: 获取所有作者
 *     tags: [Authors]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 按作者姓名过滤
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: 按邮箱过滤
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
 *         description: 成功返回作者列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Author'
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
    const { name, email } = req.query;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    // 构建过滤条件
    const filters = {};
    if (name) filters.name = name;
    if (email) filters.email = email;

    // 获取所有匹配的数据
    const allAuthors = store.getAll('authors', filters);
    
    // 应用分页
    const total = allAuthors.length;
    const paginatedAuthors = allAuthors.slice(offset, offset + limit);

    res.json({
      data: paginatedAuthors,
      total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取作者列表失败'
    });
  }
});

/**
 * @swagger
 * /authors/{id}:
 *   get:
 *     summary: 根据ID获取作者详情
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 作者ID
 *     responses:
 *       200:
 *         description: 成功返回作者详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res) => {
  try {
    const author = store.getById('authors', req.params.id);
    
    if (!author) {
      return res.status(404).json({
        error: 'Not Found',
        message: '作者未找到'
      });
    }

    res.json(author);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取作者详情失败'
    });
  }
});

/**
 * @swagger
 * /authors:
 *   post:
 *     summary: 创建新作者
 *     tags: [Authors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: 作者姓名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 作者邮箱
 *               bio:
 *                 type: string
 *                 description: 作者简介
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: 出生日期
 *     responses:
 *       201:
 *         description: 成功创建作者
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', [
  body('name').notEmpty().withMessage('作者姓名不能为空'),
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('bio').optional().isString().withMessage('简介必须是字符串'),
  body('birthDate').optional().isISO8601().withMessage('请提供有效的日期格式(YYYY-MM-DD)')
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
    // 检查邮箱是否已存在
    const existingAuthors = store.getAll('authors', { email: req.body.email });
    if (existingAuthors.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '该邮箱已被使用'
      });
    }

    const author = store.create('authors', req.body);
    res.status(201).json(author);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '创建作者失败'
    });
  }
});

/**
 * @swagger
 * /authors/{id}:
 *   put:
 *     summary: 更新作者信息
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 作者ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 作者姓名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 作者邮箱
 *               bio:
 *                 type: string
 *                 description: 作者简介
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: 出生日期
 *     responses:
 *       200:
 *         description: 成功更新作者
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('作者姓名不能为空'),
  body('email').optional().isEmail().withMessage('请提供有效的邮箱地址'),
  body('bio').optional().isString().withMessage('简介必须是字符串'),
  body('birthDate').optional().isISO8601().withMessage('请提供有效的日期格式(YYYY-MM-DD)')
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
    const authorId = req.params.id;
    
    // 如果要更新邮箱，检查是否已被其他作者使用
    if (req.body.email) {
      const existingAuthors = store.getAll('authors', { email: req.body.email });
      const conflictAuthor = existingAuthors.find(author => author.id !== authorId);
      if (conflictAuthor) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '该邮箱已被其他作者使用'
        });
      }
    }

    const updatedAuthor = store.update('authors', authorId, req.body);
    
    if (!updatedAuthor) {
      return res.status(404).json({
        error: 'Not Found',
        message: '作者未找到'
      });
    }

    res.json(updatedAuthor);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新作者失败'
    });
  }
});

/**
 * @swagger
 * /authors/{id}:
 *   delete:
 *     summary: 删除作者
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 作者ID
 *     responses:
 *       204:
 *         description: 成功删除作者
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.delete('authors', req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '作者未找到'
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除作者失败'
    });
  }
});

/**
 * @swagger
 * /authors/{id}/books:
 *   get:
 *     summary: 获取作者的所有书籍
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 作者ID
 *     responses:
 *       200:
 *         description: 成功返回作者的书籍列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/books', (req, res) => {
  try {
    const author = store.getById('authors', req.params.id);
    
    if (!author) {
      return res.status(404).json({
        error: 'Not Found',
        message: '作者未找到'
      });
    }

    const books = store.getBooksByAuthor(req.params.id);
    res.json(books);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取作者书籍失败'
    });
  }
});

module.exports = router;
