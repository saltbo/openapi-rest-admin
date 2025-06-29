# OpenAPI Admin

A powerful full-stack application for managing OpenAPI configurations and automatically generating admin interfaces based on OpenAPI documentation. Built with React Router v7, Prisma, and SQLite.

## 🎯 Core Features

### 🔧 API Configuration Management
- **Dynamic Configuration**: Manage OpenAPI configurations through a web interface
- **Database Storage**: Persistent storage with SQLite database
- **Real-time Updates**: Add, edit, delete API configurations on the fly
- **Batch Operations**: Enable/disable multiple configurations at once
- **Tagging System**: Organize APIs with custom tags

### 🚀 Auto-Generated Admin Interface
- **Resource Discovery**: Automatically identifies RESTful resources from OpenAPI specs
- **Dynamic Tables**: Generates data tables with appropriate column types
- **Smart Forms**: Creates add/edit forms based on resource schemas
- **Professional UI**: Built with Ant Design for consistent, modern interface

## ✨ Key Features

- 🗄️ **Database-Driven**: SQLite database with Prisma ORM for reliable data persistence
- 🔍 **Smart Analysis**: Parses OpenAPI documentation to understand resource structure
- 📊 **Statistics Dashboard**: Real-time overview of API configurations
- 📝 **Full CRUD**: Complete Create, Read, Update, Delete operations for API configs
- 🎨 **Modern UI**: Professional admin interface with responsive design
- 💾 **Data Migration**: Easy migration from static configuration files
- 🔗 **RESTful API**: Standard HTTP API for external integrations
- 📱 **Mobile Friendly**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Backend
- **React Router v7**: Full-stack framework with server-side rendering
- **Prisma ORM**: Type-safe database operations
- **SQLite**: Lightweight, embedded database
- **RESTful API**: Standard HTTP endpoints for all operations

### Frontend  
- **React 19**: Modern React with hooks and concurrent features
- **Ant Design**: Professional UI component library
- **TypeScript**: Full type safety across the application
- **Server-Side Rendering**: Fast initial page loads with SSR

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd openapi-admin

# Install dependencies
npm install

# Set up the database
npm run db:generate
npm run db:push

# Import initial data (optional)
npm run db:migrate

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Admin Panel: http://localhost:5173/admin/apis
- API Endpoints: http://localhost:5173/api/*

### Production
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run data migration from config files
- `npm run db:reset` - Reset database and import default data
- `npm run db:studio` - Open Prisma Studio for database management

## 🔧 API Configuration Management

### Web Interface
1. Visit http://localhost:5173/admin/apis
2. Click "New Configuration" to add an API
3. Fill in the required fields:
   - **ID**: Unique identifier (e.g., "my-api")
   - **Name**: Display name (e.g., "My API")  
   - **OpenAPI URL**: URL to OpenAPI/Swagger documentation
   - **Description**: Optional detailed description
   - **Tags**: Comma-separated tags for organization
   - **Version**: Optional version number
4. Save and the API will be immediately available

### REST API
```bash
# Get all configurations
curl http://localhost:5173/api/configs

# Create new configuration
curl -X POST http://localhost:5173/api/configs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-api",
    "name": "My API",
    "openapiUrl": "https://api.example.com/openapi.json",
    "enabled": true
  }'

# Update configuration
curl -X PUT http://localhost:5173/api/configs/my-api \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Delete configuration  
curl -X DELETE http://localhost:5173/api/configs/my-api
```

## 🗄️ Database Management

The application uses SQLite for data persistence with Prisma ORM:

- **Location**: `prisma/dev.db` (development)
- **Schema**: `prisma/schema.prisma`
- **Migrations**: Handled automatically with Prisma

### Database Operations
```bash
# View/edit data in browser
npm run db:studio

# Reset to default configurations
npm run db:reset

# Backup database
cp prisma/dev.db prisma/backup.db
```

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── admin/          # Admin panel pages
│   └── frontend/       # Public pages
├── routes/             # Route handlers
│   ├── admin/          # Admin routes
│   ├── api/            # API endpoints
│   └── frontend/       # Public routes
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

config/                 # Static configuration files
docs/                   # Project documentation
prisma/                 # Database schema and migrations
scripts/                # Utility scripts
```

## 🔄 Migration from Static Config

If you have existing configurations in `config/apis.ts`, migrate them to the database:

```bash
npm run db:migrate
```

This will:
1. Read configurations from `config/apis.ts`
2. Insert them into the SQLite database
3. Preserve all existing data (ID, name, description, etc.)

## 🌐 API Endpoints

### Configuration Management
- `GET /api/configs` - List all configurations
- `GET /api/configs/:id` - Get specific configuration
- `POST /api/configs` - Create new configuration
- `PUT /api/configs/:id` - Update configuration
- `DELETE /api/configs/:id` - Delete configuration
- `PATCH /api/configs` - Batch operations

### Statistics
- `GET /api/stats` - Get configuration statistics

### Search
- `GET /api/search?q=term` - Search configurations

## 🎨 Customization

### Adding Custom Fields
1. Update the Prisma schema in `prisma/schema.prisma`
2. Run `npm run db:push` to update the database
3. Update TypeScript types in `app/types/api.ts`
4. Modify the admin interface forms as needed

### Custom Styling
- Modify `app/app.css` for global styles
- Component-specific styles using Ant Design's theming system
- Tailwind CSS classes available throughout the application

## 📊 Supported OpenAPI Features

### Resource Detection
- **Standard REST Patterns**: Automatically identifies CRUD operations
- **Path Parameters**: Supports dynamic routes like `/users/{id}`
- **Query Parameters**: Handles filtering, sorting, and pagination
- **Request/Response Schemas**: Uses schema definitions for form generation

### Schema Support
- **Basic Types**: string, number, boolean, integer
- **Complex Types**: objects, arrays, nested structures
- **Validation**: Required fields, formats, enums
- **Examples**: Uses example values when available

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure SQLite file has proper permissions
2. **CORS Errors**: Ensure your OpenAPI endpoint allows cross-origin requests
3. **Schema Parsing**: Check that your OpenAPI spec is valid JSON/YAML
4. **Resource Not Found**: Verify the OpenAPI spec contains standard REST patterns

### Debug Mode
Enable debug logging in the browser console:
```javascript
localStorage.setItem('debug', 'openapi-admin:*');
```

## 🗺️ Roadmap

- [ ] Authentication system
- [ ] Multi-tenant support
- [ ] Custom field renderers
- [ ] Real-time updates with WebSockets
- [ ] Export/import functionality
- [ ] API documentation generator
- [ ] Plugin system
- [ ] Advanced filtering and search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- UI components from [Ant Design](https://ant.design/)
- Database ORM by [Prisma](https://www.prisma.io/)
- OpenAPI parsing with [swagger-parser](https://github.com/APIDevTools/swagger-parser)

---

Made with ❤️ for the API development community
