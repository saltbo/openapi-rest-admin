const express = require('express');
const { body, validationResult, query } = require('express-validator');
const store = require('../store');

const router = express.Router();

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: 获取所有笔记
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: 按笔记标题过滤
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         description: 按书籍ID过滤
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: 按作者ID过滤
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 按标签过滤(逗号分隔)
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
 *         description: 成功返回笔记列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
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
    const { title, bookId, authorId, tags } = req.query;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    // 获取所有笔记
    let allNotes = store.getAll('notes');

    // 应用过滤器
    if (title) {
      allNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    
    if (bookId) {
      allNotes = allNotes.filter(note => note.bookId === bookId);
    }
    
    if (authorId) {
      allNotes = allNotes.filter(note => note.authorId === authorId);
    }
    
    if (tags) {
      const searchTags = tags.split(',').map(tag => tag.trim().toLowerCase());
      allNotes = allNotes.filter(note => 
        note.tags && searchTags.some(searchTag => 
          note.tags.some(noteTag => noteTag.toLowerCase().includes(searchTag))
        )
      );
    }
    
    // 应用分页
    const total = allNotes.length;
    const paginatedNotes = allNotes.slice(offset, offset + limit);

    res.json({
      data: paginatedNotes,
      total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取笔记列表失败'
    });
  }
});

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: 根据ID获取笔记详情
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 笔记ID
 *     responses:
 *       200:
 *         description: 成功返回笔记详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res) => {
  try {
    const note = store.getById('notes', req.params.id);
    
    if (!note) {
      return res.status(404).json({
        error: 'Not Found',
        message: '笔记未找到'
      });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取笔记详情失败'
    });
  }
});

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: 创建新笔记
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 笔记标题
 *               content:
 *                 type: string
 *                 description: 笔记内容
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签
 *               bookId:
 *                 type: string
 *                 description: 关联的书籍ID
 *               authorId:
 *                 type: string
 *                 description: 笔记作者ID
 *     responses:
 *       201:
 *         description: 成功创建笔记
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', [
  body('title').notEmpty().withMessage('笔记标题不能为空'),
  body('content').notEmpty().withMessage('笔记内容不能为空'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('tags.*').optional().isString().withMessage('标签项必须是字符串'),
  body('bookId').optional().isString().withMessage('书籍ID必须是字符串'),
  body('authorId').optional().isString().withMessage('作者ID必须是字符串')
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
    // 验证关联的书籍是否存在
    if (req.body.bookId) {
      const book = store.getById('books', req.body.bookId);
      if (!book) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的书籍不存在'
        });
      }
    }

    // 验证关联的作者是否存在
    if (req.body.authorId) {
      const author = store.getById('authors', req.body.authorId);
      if (!author) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的作者不存在'
        });
      }
    }

    const note = store.create('notes', req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '创建笔记失败'
    });
  }
});

/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     summary: 更新笔记信息
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 笔记ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 笔记标题
 *               content:
 *                 type: string
 *                 description: 笔记内容
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签
 *               bookId:
 *                 type: string
 *                 description: 关联的书籍ID
 *               authorId:
 *                 type: string
 *                 description: 笔记作者ID
 *     responses:
 *       200:
 *         description: 成功更新笔记
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('笔记标题不能为空'),
  body('content').optional().notEmpty().withMessage('笔记内容不能为空'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('tags.*').optional().isString().withMessage('标签项必须是字符串'),
  body('bookId').optional().isString().withMessage('书籍ID必须是字符串'),
  body('authorId').optional().isString().withMessage('作者ID必须是字符串')
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
    // 验证关联的书籍是否存在
    if (req.body.bookId) {
      const book = store.getById('books', req.body.bookId);
      if (!book) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的书籍不存在'
        });
      }
    }

    // 验证关联的作者是否存在
    if (req.body.authorId) {
      const author = store.getById('authors', req.body.authorId);
      if (!author) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的作者不存在'
        });
      }
    }

    const updatedNote = store.update('notes', req.params.id, req.body);
    
    if (!updatedNote) {
      return res.status(404).json({
        error: 'Not Found',
        message: '笔记未找到'
      });
    }

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新笔记失败'
    });
  }
});

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: 删除笔记
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 笔记ID
 *     responses:
 *       204:
 *         description: 成功删除笔记
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.delete('notes', req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '笔记未找到'
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除笔记失败'
    });
  }
});

module.exports = router;
