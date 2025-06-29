#!/bin/bash

# API使用示例脚本
# 展示如何使用Simple REST Server的各种API

API_BASE="http://localhost:3000/api"

echo "🚀 Simple REST Server API 使用示例"
echo "======================================="

echo ""
echo "1. 📚 获取所有作者"
curl -X GET "$API_BASE/authors" | json_pp

echo ""
echo "2. ✏️ 创建新作者"
AUTHOR_RESPONSE=$(curl -s -X POST "$API_BASE/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "老舍",
    "email": "laoshe@example.com",
    "bio": "人民艺术家，著名小说家、戏剧家",
    "birthDate": "1899-02-03"
  }')

echo $AUTHOR_RESPONSE | json_pp
AUTHOR_ID=$(echo $AUTHOR_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo ""
echo "3. 📖 创建新书籍"
BOOK_RESPONSE=$(curl -s -X POST "$API_BASE/books" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"骆驼祥子\",
    \"authorId\": \"$AUTHOR_ID\",
    \"isbn\": \"978-7-01-000003-3\",
    \"genre\": \"现代文学\",
    \"publishedDate\": \"1939-01-01\",
    \"description\": \"描写旧中国北平城里一个人力车夫祥子的悲惨遭遇\",
    \"price\": 25.80
  }")

echo $BOOK_RESPONSE | json_pp
BOOK_ID=$(echo $BOOK_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo ""
echo "4. 📝 创建读书笔记"
NOTE_RESPONSE=$(curl -s -X POST "$API_BASE/notes" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"《骆驼祥子》读后感\",
    \"content\": \"这部小说深刻地反映了旧中国劳动人民的悲惨命运，祥子从一个老实、健壮、坚忍的车夫，最终沦为自甘堕落的行尸走肉。作品揭示了个人奋斗的局限性和旧社会对劳动人民的摧残。\",
    \"tags\": [\"现代文学\", \"社会批判\", \"人物悲剧\"],
    \"bookId\": \"$BOOK_ID\",
    \"authorId\": \"$AUTHOR_ID\"
  }")

echo $NOTE_RESPONSE | json_pp
NOTE_ID=$(echo $NOTE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo ""
echo "5. 🔍 获取作者的所有书籍"
curl -X GET "$API_BASE/authors/$AUTHOR_ID/books" | json_pp

echo ""
echo "6. 📚 获取书籍的所有笔记"
curl -X GET "$API_BASE/books/$BOOK_ID/notes" | json_pp

echo ""
echo "7. 🔄 更新作者信息"
curl -X PUT "$API_BASE/authors/$AUTHOR_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "人民艺术家，著名小说家、戏剧家，代表作《骆驼祥子》、《茶馆》等"
  }' | json_pp

echo ""
echo "8. 🔍 按条件搜索"
echo "按类型搜索书籍："
curl -X GET "$API_BASE/books?genre=现代文学" | json_pp

echo ""
echo "按标签搜索笔记："
curl -X GET "$API_BASE/notes?tags=现代文学" | json_pp

echo ""
echo "9. 🗑️ 清理测试数据"
echo "删除笔记..."
curl -X DELETE "$API_BASE/notes/$NOTE_ID"

echo ""
echo "删除书籍..."
curl -X DELETE "$API_BASE/books/$BOOK_ID"

echo ""
echo "删除作者..."
curl -X DELETE "$API_BASE/authors/$AUTHOR_ID"

echo ""
echo "✅ API示例演示完成！"
