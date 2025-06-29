const request = require('supertest');
const app = require('../src/index');

describe('Performance Tests', () => {
  const testData = {
    authors: [],
    books: [],
    notes: []
  };

  beforeAll(async () => {
    // 创建测试数据
    for (let i = 0; i < 50; i++) {
      const author = await request(app)
        .post('/api/authors')
        .send({
          name: `测试作者${i}`,
          email: `author${i}@test.com`,
          bio: `测试作者${i}的简介`
        });
      testData.authors.push(author.body);

      const book = await request(app)
        .post('/api/books')
        .send({
          title: `测试书籍${i}`,
          authorId: author.body.id,
          genre: i % 2 === 0 ? '科幻' : '文学',
          price: Math.random() * 100
        });
      testData.books.push(book.body);

      await request(app)
        .post('/api/notes')
        .send({
          title: `测试笔记${i}`,
          content: `这是第${i}个测试笔记的内容`,
          tags: [`tag${i % 5}`, `category${i % 3}`],
          bookId: book.body.id,
          authorId: author.body.id
        });
    }
  });

  afterAll(async () => {
    // 清理测试数据
    for (const author of testData.authors) {
      await request(app).delete(`/api/authors/${author.id}`);
    }
    for (const book of testData.books) {
      await request(app).delete(`/api/books/${book.id}`);
    }
  });

  describe('Large Dataset Performance', () => {
    it('应该在合理时间内获取大量作者', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/authors?limit=50')
        .timeout(5000);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(50);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该在合理时间内搜索和过滤数据', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/books?genre=科幻&limit=25')
        .timeout(5000);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500); // 应该在500ms内完成
    });

    it('应该在合理时间内处理复杂的标签搜索', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/notes?tags=tag1,tag2&limit=20')
        .timeout(5000);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(800); // 应该在800ms内完成
    });
  });

  describe('Concurrent Requests', () => {
    it('应该能够处理并发读取请求', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/authors?limit=10')
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(2000); // 10个并发请求应该在2秒内完成
    });

    it('应该能够处理并发写入请求', async () => {
      const promises = Array(5).fill().map((_, i) => 
        request(app)
          .post('/api/authors')
          .send({
            name: `并发作者${i}`,
            email: `concurrent${i}@test.com`
          })
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      expect(duration).toBeLessThan(1500); // 5个并发写入应该在1.5秒内完成

      // 清理数据
      const cleanupPromises = responses.map(response =>
        request(app).delete(`/api/authors/${response.body.id}`)
      );
      await Promise.all(cleanupPromises);
    });
  });
});
