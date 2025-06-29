const request = require('supertest');
const app = require('../src/index');

describe('Authors API', () => {
  let createdAuthorId;

  describe('GET /api/authors', () => {
    it('应该返回作者列表', async () => {
      const response = await request(app)
        .get('/api/authors')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/authors?limit=1&offset=0')
        .expect(200);

      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(0);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/authors', () => {
    it('应该创建新作者', async () => {
      const newAuthor = {
        name: '鲁迅',
        email: 'luxun@example.com',
        bio: '现代文学家',
        birthDate: '1881-09-25'
      };

      const response = await request(app)
        .post('/api/authors')
        .send(newAuthor)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newAuthor.name);
      expect(response.body.email).toBe(newAuthor.email);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdAuthorId = response.body.id;
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/authors')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('应该验证邮箱格式', async () => {
      const response = await request(app)
        .post('/api/authors')
        .send({
          name: '测试作者',
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/authors/:id', () => {
    it('应该返回指定作者详情', async () => {
      if (!createdAuthorId) {
        // 如果没有创建的作者ID，先获取一个存在的作者
        const authorsResponse = await request(app).get('/api/authors');
        createdAuthorId = authorsResponse.body.data[0].id;
      }

      const response = await request(app)
        .get(`/api/authors/${createdAuthorId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdAuthorId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('应该返回404当作者不存在', async () => {
      const response = await request(app)
        .get('/api/authors/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/authors/:id', () => {
    it('应该更新作者信息', async () => {
      if (!createdAuthorId) {
        const authorsResponse = await request(app).get('/api/authors');
        createdAuthorId = authorsResponse.body.data[0].id;
      }

      const updateData = {
        bio: '更新后的简介'
      };

      const response = await request(app)
        .put(`/api/authors/${createdAuthorId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.bio).toBe(updateData.bio);
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('DELETE /api/authors/:id', () => {
    it('应该删除作者', async () => {
      if (createdAuthorId) {
        await request(app)
          .delete(`/api/authors/${createdAuthorId}`)
          .expect(204);

        // 验证作者已被删除
        await request(app)
          .get(`/api/authors/${createdAuthorId}`)
          .expect(404);
      }
    });
  });
});
