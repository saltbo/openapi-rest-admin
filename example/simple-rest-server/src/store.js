const { v4: uuidv4 } = require('uuid');

// 内存数据存储
class MemoryStore {
  constructor() {
    this.authors = new Map();
    this.books = new Map();
    this.notes = new Map();
    
    // 初始化示例数据
    this.initSampleData();
  }

  initSampleData() {
    // 示例作者
    const author1 = {
      id: uuidv4(),
      name: '吴承恩',
      email: 'wuchengn@example.com',
      bio: '明代小说家，《西游记》作者',
      birthDate: '1500-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const author2 = {
      id: uuidv4(),
      name: '曹雪芹',
      email: 'caoxueqin@example.com',
      bio: '清代小说家，《红楼梦》作者',
      birthDate: '1715-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.authors.set(author1.id, author1);
    this.authors.set(author2.id, author2);

    // 示例书籍
    const book1 = {
      id: uuidv4(),
      title: '西游记',
      authorId: author1.id,
      isbn: '978-7-01-000001-1',
      genre: '古典文学',
      publishedDate: '1592-01-01',
      description: '中国古典四大名著之一，讲述孙悟空等人西天取经的故事',
      price: 29.99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const book2 = {
      id: uuidv4(),
      title: '红楼梦',
      authorId: author2.id,
      isbn: '978-7-01-000002-2',
      genre: '古典文学',
      publishedDate: '1791-01-01',
      description: '中国古典四大名著之一，描写贾、史、王、薛四大家族的兴衰',
      price: 35.99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.books.set(book1.id, book1);
    this.books.set(book2.id, book2);

    // 示例笔记
    const note1 = {
      id: uuidv4(),
      title: '西游记读后感',
      content: '这部小说通过孙悟空等人的取经历程，展现了坚持不懈、团结合作的重要性。书中的神话色彩丰富，想象力天马行空，是一部难得的文学佳作。',
      tags: ['古典文学', '读后感', '神话'],
      bookId: book1.id,
      authorId: author1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const note2 = {
      id: uuidv4(),
      title: '红楼梦人物分析',
      content: '林黛玉和薛宝钗作为书中的两个重要女性角色，代表了不同的性格特点和价值观念。她们的对比突出了封建社会女性的悲剧命运。',
      tags: ['人物分析', '古典文学', '女性角色'],
      bookId: book2.id,
      authorId: author2.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.set(note1.id, note1);
    this.notes.set(note2.id, note2);
  }

  // 通用CRUD操作
  create(collection, data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const item = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this[collection].set(id, item);
    return item;
  }

  getAll(collection, filters = {}) {
    const items = Array.from(this[collection].values());
    
    // 应用过滤器
    if (Object.keys(filters).length > 0) {
      return items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (typeof value === 'string') {
            return item[key] && item[key].toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      });
    }
    
    return items;
  }

  getById(collection, id) {
    return this[collection].get(id) || null;
  }

  update(collection, id, data) {
    const existing = this[collection].get(id);
    if (!existing) {
      return null;
    }
    
    const updated = {
      ...existing,
      ...data,
      id, // 确保ID不被覆盖
      createdAt: existing.createdAt, // 确保创建时间不被覆盖
      updatedAt: new Date().toISOString()
    };
    
    this[collection].set(id, updated);
    return updated;
  }

  delete(collection, id) {
    const existing = this[collection].get(id);
    if (!existing) {
      return false;
    }
    
    return this[collection].delete(id);
  }

  // 特定业务逻辑
  getBooksByAuthor(authorId) {
    return this.getAll('books', { authorId });
  }

  getNotesByBook(bookId) {
    return this.getAll('notes', { bookId });
  }

  getNotesByAuthor(authorId) {
    return this.getAll('notes', { authorId });
  }
}

// 导出单例实例
module.exports = new MemoryStore();
