<div align="center">
  <h1>🚀 OpenAPI Admin</h1>
  <p>A powerful SPA application for automatically generating admin interfaces from OpenAPI specifications</p>
  
  [![React Router](https://img.shields.io/badge/React%20Router-v7-blue.svg)](https://reactrouter.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
  [![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26-red.svg)](https://ant.design/)
  [![Vite](https://img.shields.io/badge/Vite-6.3-purple.svg)](https://vitejs.dev/)
  [![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5.81-orange.svg)](https://tanstack.com/query)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  
  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-configuration">Configuration</a> •
    <a href="#-api-compatibility">API Compatibility</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## 📖 Overview

OpenAPI Admin is a modern Single Page Application (SPA) that automatically generates professional admin interfaces from OpenAPI/Swagger specifications. Simply provide your OpenAPI document URL, and get a fully functional admin panel with CRUD operations, forms, tables, and more - all without writing a single line of code.

### 🎯 Why OpenAPI Admin?

- **Zero Configuration**: Point to your OpenAPI spec and get a working admin interface instantly
- **Pure Frontend**: No backend required - works entirely in the browser
- **Smart Parsing**: Automatically detects RESTful resources and generates appropriate UI components
- **Modern Stack**: Built with React 19, TypeScript, and Ant Design for optimal performance
- **Production Ready**: Optimized build with Vite for fast loading and deployment

## ✨ Features

### 🎨 Auto-Generated Admin Interface
- **Resource Discovery**: Automatically identifies RESTful resources from OpenAPI specs
- **Dynamic Tables**: Generates data tables with appropriate column types
- **Smart Forms**: Creates add/edit forms based on resource schemas
- **Professional UI**: Built with Ant Design for consistent, modern interface

### 🔧 Configuration Management
- **Environment Variables**: Configure via `.env` files or runtime config
- **Multiple Formats**: Support for JSON configuration files
- **Hot Reload**: Development mode with automatic config updates

### 🏗️ Technical Highlights
- 🌐 **Pure SPA**: No backend required - runs entirely in the browser
- 🔍 **Smart Analysis**: Parses OpenAPI documentation to understand resource structure
- 📊 **RESTful Support**: Automatically detects and handles standard REST patterns
- 🎨 **Modern UI**: Professional admin interface with responsive design
- 💾 **Client-Side Routing**: Fast navigation with React Router v7
- 📱 **Mobile Friendly**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

OpenAPI Admin is a **Single Page Application (SPA)** built with modern web technologies:

### Frontend  
- **React 19**: Modern React with hooks and concurrent features
- **React Router v7**: Client-side routing and navigation
- **Ant Design**: Professional UI component library
- **TypeScript**: Full type safety across the application
- **Vite**: Fast build tool and development server
- **TanStack Query**: Efficient data fetching and caching

### Core Services
- **OpenAPI Parser**: Analyzes OpenAPI/Swagger specifications
- **Schema Renderer**: Generates forms and tables from JSON schemas
- **REST Client**: Handles API requests to your backend services
- **Configuration System**: Runtime configuration via JSON files

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager

### ⚡ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/openapi-admin.git
   cd openapi-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure your OpenAPI document URL**
   
   Choose one of the following methods:

   **Method 1: Environment Variables (Recommended)**
   ```bash
   cp .env.example .env
   # Edit .env file and set your OpenAPI document URL
   echo "VITE_OPENAPI_DOC_URL=https://your-api.example.com/openapi.json" > .env
   ```

   **Method 2: Runtime Configuration**
   ```bash
   # Edit public/config.json directly
   {
     "openapiDocUrl": "https://your-api.example.com/openapi.json",
     "appTitle": "My API Admin"
   }
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Visit http://localhost:5173 to access the admin interface

### 🏭 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the static files**
   ```bash
   # Using any static file server
   npx serve build/client
   
   # Or copy build/client/* to your web server
   cp -r build/client/* /var/www/html/
   ```

3. **Configure for production**
   ```bash
   # Update config.json in your web server
   {
     "openapiDocUrl": "https://your-production-api.com/openapi.json",
     "appTitle": "Production API Admin"
   }
   ```

### 🐳 Docker Deployment

```bash
# Build and run with Docker
docker build -t openapi-admin .
docker run -p 5173:5173 openapi-admin
```

## � Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🔥 Start development server with hot reload |
| `npm run build` | 📦 Build optimized production bundle |
| `npm run start` | 🚀 Start production server |
| `npm run test` | 🧪 Run test suite with Vitest |
| `npm run test:ui` | 🎯 Run tests with interactive UI |
| `npm run typecheck` | 🔍 Run TypeScript type checking |
| `npm run config:generate` | ⚙️ Generate configuration files |

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | 🔧 Generate Prisma client |
| `npm run db:push` | 📤 Push database schema changes |
| `npm run db:migrate` | 🔄 Run data migration from config files |
| `npm run db:reset` | 🔄 Reset database and import default data |
| `npm run db:studio` | 🎨 Open Prisma Studio for database management |

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
## 🔧 Configuration

OpenAPI Admin supports flexible configuration through environment variables or runtime configuration files.

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Your OpenAPI document URL
VITE_OPENAPI_DOC_URL=https://your-api.example.com/openapi.json

# Optional: Custom application title
VITE_APP_TITLE=My API Admin
```

### Runtime Configuration

You can also configure the application at runtime by editing `public/config.json`:

```json
{
  "openapiDocUrl": "https://your-api.example.com/openapi.json",
  "appTitle": "My API Admin"
}
```

### Configuration Priority

The application loads configuration in the following order:
1. Environment variables (highest priority)
2. Runtime configuration file (`public/config.json`)
3. Default values

### Supported OpenAPI Sources

- **Local files**: `/path/to/openapi.json` or `/path/to/openapi.yaml`
- **Remote URLs**: `https://api.example.com/openapi.json`
- **Relative paths**: `./docs/api.json` (relative to public directory)

### Example Configurations

#### Development with local API
```bash
VITE_OPENAPI_DOC_URL=http://localhost:3000/api/docs/json
```

#### Production with remote API
```bash
VITE_OPENAPI_DOC_URL=https://api.production.com/openapi.json
VITE_APP_TITLE=Production API Admin
```

#### Using static OpenAPI file
```bash
VITE_OPENAPI_DOC_URL=/static/my-api-spec.json
```

## 💡 Usage Examples

### Setting up with Different API Types

#### 1. Local Development API
If you're developing a REST API locally:

```bash
# .env file
VITE_OPENAPI_DOC_URL=http://localhost:3000/api-docs/openapi.json
VITE_APP_TITLE=Local API Admin
```

#### 2. Swagger Petstore Demo
Try with the official Swagger Petstore:

```bash
# .env file
VITE_OPENAPI_DOC_URL=https://petstore.swagger.io/v2/swagger.json
VITE_APP_TITLE=Petstore Admin
```

#### 3. Static OpenAPI File
If you have a static OpenAPI specification:

```bash
# Place your openapi.json in public/ folder
# .env file
VITE_OPENAPI_DOC_URL=/my-api-spec.json
VITE_APP_TITLE=My API Admin
```

### Runtime Configuration Updates

You can update the configuration without rebuilding:

1. **Edit `public/config.json`**:
   ```json
   {
     "openapiDocUrl": "https://new-api.example.com/openapi.json",
     "appTitle": "Updated API Admin"
   }
   ```

2. **Refresh the browser** - changes will be applied immediately

### Demo APIs Included

The project includes demo OpenAPI specifications for testing:

- **Multi Resources Demo**: `/multi-resources-api.json`
- **Single Resource Demo**: `/single-resource-api.json`
- **Simple REST Server**: `/example/simple-rest-server/scripts/openapi.json`

To use these demos:
```bash
VITE_OPENAPI_DOC_URL=http://localhost:5173/multi-resources-api.json
```

### How It Works

1. **Configuration Loading**: The app loads config from environment variables or `public/config.json`
2. **OpenAPI Parsing**: Fetches and parses the OpenAPI specification
3. **Resource Discovery**: Automatically identifies RESTful resources and operations
4. **UI Generation**: Creates forms, tables, and navigation based on the API schema
5. **API Calls**: Makes direct HTTP requests to your API endpoints

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── json-schema-ui/  # JSON schema form components
│   ├── layout/          # Layout components
│   ├── shared/          # Shared UI components
│   └── ui/              # Base UI components
├── hooks/               # React hooks
├── lib/                 # Core libraries
│   └── core/            # OpenAPI parsing and rendering
├── pages/               # Page components
│   └── resource-explorer/ # Resource management pages
├── routes/              # Route definitions
├── types/               # TypeScript type definitions
└── utils/               # Utility functions

config/                  # Static configuration files
public/                  # Static assets and runtime config
scripts/                 # Build and utility scripts
```

##  Supported OpenAPI Features

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

1. **CORS Errors**: Ensure your OpenAPI endpoint allows cross-origin requests
2. **Schema Parsing**: Check that your OpenAPI spec is valid JSON/YAML
3. **Resource Not Found**: Verify the OpenAPI spec contains standard REST patterns
4. **Configuration Loading**: Check browser console for config loading errors

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

We welcome contributions to OpenAPI Admin! Please follow these guidelines:

### 🛠️ Development Setup

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/openapi-admin.git
   cd openapi-admin
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

6. **Test your changes**
   ```bash
   npm run test
   npm run typecheck
   ```

7. **Submit a pull request**
   - Provide a clear description of changes
   - Include screenshots for UI changes
   - Reference any related issues

### 📝 Code Style

- **TypeScript**: Use strict typing throughout
- **Prettier**: Code formatting is enforced
- **ESLint**: Follow the existing linting rules
- **Conventional Commits**: Use conventional commit messages

### 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and version
- OpenAPI specification (if relevant)
- Screenshots or error logs

### 💡 Feature Requests

- Check existing issues first
- Provide clear use cases
- Consider implementation complexity
- Be open to discussion and alternatives

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- UI components from [Ant Design](https://ant.design/)
- OpenAPI parsing with [swagger-parser](https://github.com/APIDevTools/swagger-parser)
- Type definitions from [openapi-types](https://github.com/kogosoftwarellc/open-api)

---

Made with ❤️ for the API development community
