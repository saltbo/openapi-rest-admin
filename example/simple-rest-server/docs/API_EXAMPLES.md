# API 使用示例

以下是一些常用的API操作示例，展示了如何使用这个RESTful服务。

## 1. 作者管理

### 获取所有作者
```bash
curl "http://localhost:3000/api/authors"
```

### 创建作者
```bash
curl -X POST "http://localhost:3000/api/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "金庸",
    "email": "jinyong@example.com",
    "bio": "武侠小说泰斗",
    "birthDate": "1924-03-10"
  }'
```

### 获取指定作者
```bash
curl "http://localhost:3000/api/authors/{author_id}"
```

### 更新作者信息
```bash
curl -X PUT "http://localhost:3000/api/authors/{author_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "香港著名武侠小说作家，被誉为武侠小说泰斗"
  }'
```

## 2. 书籍管理

### 获取所有书籍
```bash
curl "http://localhost:3000/api/books"
```

### 创建书籍
```bash
curl -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "射雕英雄传",
    "authorId": "{author_id}",
    "isbn": "978-7-01-000004-4",
    "genre": "武侠小说",
    "publishedDate": "1957-01-01",
    "description": "金庸武侠小说代表作之一",
    "price": 39.99
  }'
```

### 按条件搜索书籍
```bash
# 按类型搜索
curl "http://localhost:3000/api/books?genre=武侠小说"

# 按作者搜索
curl "http://localhost:3000/api/books?authorId={author_id}"

# 分页搜索
curl "http://localhost:3000/api/books?limit=5&offset=10"
```

## 3. 笔记管理

### 创建读书笔记
```bash
curl -X POST "http://localhost:3000/api/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "《射雕英雄传》读后感",
    "content": "这部小说塑造了郭靖这一经典形象，体现了侠之大者、为国为民的精神境界。",
    "tags": ["武侠", "英雄", "爱国"],
    "bookId": "{book_id}",
    "authorId": "{author_id}"
  }'
```

### 搜索笔记
```bash
# 按标签搜索
curl "http://localhost:3000/api/notes?tags=武侠,英雄"

# 按书籍搜索
curl "http://localhost:3000/api/notes?bookId={book_id}"

# 按作者搜索
curl "http://localhost:3000/api/notes?authorId={author_id}"
```

## 4. 关联查询

### 获取作者的所有书籍
```bash
curl "http://localhost:3000/api/authors/{author_id}/books"
```

### 获取书籍的所有笔记
```bash
curl "http://localhost:3000/api/books/{book_id}/notes"
```

## 5. 完整的工作流示例

```bash
# 1. 创建作者
AUTHOR=$(curl -s -X POST "http://localhost:3000/api/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "古龙",
    "email": "gulong@example.com",
    "bio": "台湾著名武侠小说家",
    "birthDate": "1938-06-07"
  }')

AUTHOR_ID=$(echo $AUTHOR | jq -r '.id')

# 2. 为该作者创建书籍
BOOK=$(curl -s -X POST "http://localhost:3000/api/books" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"多情剑客无情剑\",
    \"authorId\": \"$AUTHOR_ID\",
    \"isbn\": \"978-7-01-000005-5\",
    \"genre\": \"武侠小说\",
    \"publishedDate\": \"1969-01-01\",
    \"description\": \"古龙武侠小说经典之作\",
    \"price\": 32.50
  }")

BOOK_ID=$(echo $BOOK | jq -r '.id')

# 3. 为该书创建读书笔记
curl -X POST "http://localhost:3000/api/notes" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"古龙小说的独特魅力\",
    \"content\": \"古龙的武侠小说风格独特，文字简练而富有诗意，善于刻画人物心理。\",
    \"tags\": [\"武侠\", \"古龙\", \"文学赏析\"],
    \"bookId\": \"$BOOK_ID\",
    \"authorId\": \"$AUTHOR_ID\"
  }"

# 4. 查看该作者的所有作品
curl "http://localhost:3000/api/authors/$AUTHOR_ID/books"

# 5. 查看该书的所有笔记
curl "http://localhost:3000/api/books/$BOOK_ID/notes"
```

## 错误处理示例

### 创建时的验证错误
```bash
# 缺少必填字段
curl -X POST "http://localhost:3000/api/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
# 返回 400 Bad Request 和详细的错误信息
```

### 资源不存在的错误
```bash
# 获取不存在的资源
curl "http://localhost:3000/api/authors/non-existent-id"
# 返回 404 Not Found
```

## 分页和排序

所有列表接口都支持分页：

```bash
# 获取第二页的数据，每页5条
curl "http://localhost:3000/api/books?limit=5&offset=5"

# 获取指定作者的书籍，限制返回数量
curl "http://localhost:3000/api/authors/{author_id}/books?limit=3"
```
