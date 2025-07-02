# Contributing to OpenAPI Admin

We welcome contributions to OpenAPI Admin! This guide will help you get started with contributing to the project.

## 🛠️ Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/openapi-rest-admin.git
   cd openapi-rest-admin
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Development Workflow

### Making Changes

1. **Make your changes** following the existing code style
2. **Test your changes**
   ```bash
   npm run test
   npm run typecheck
   ```
3. **Build the project** to ensure everything works
   ```bash
   npm run build
   ```

### Code Style

- **TypeScript**: Use strict typing throughout
- **React**: Follow React 19 best practices
- **Prettier**: Code formatting is handled automatically
- **ESLint**: Follow the existing linting rules
- **Conventional Commits**: Use conventional commit messages

### Testing

- Write tests for new features using Vitest
- Run tests with `npm run test` or `npm run test:ui` for interactive testing
- Ensure all existing tests still pass

## 📝 Pull Request Guidelines

1. **Provide a clear description** of what your PR does
2. **Include screenshots** for UI changes
3. **Reference any related issues** using GitHub keywords (fixes #123)
4. **Keep changes focused** - one feature or fix per PR
5. **Update documentation** if needed

## 🐛 Bug Reports

When reporting bugs, please include:

- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Browser and version**
- **OpenAPI specification** you're using (if relevant)
- **Screenshots or error logs**
- **Configuration details** (config.json or environment variables)

## 💡 Feature Requests

Before requesting a feature:

1. **Check existing issues** to avoid duplicates
2. **Provide clear use cases** explaining why the feature is needed
3. **Consider implementation complexity** and discuss alternatives
4. **Be open to discussion** and feedback from maintainers

## 🏗️ Project Structure

Understanding the codebase:

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
├── routes/              # Route definitions
└── types/               # TypeScript type definitions

config/                  # Configuration types and defaults
public/                  # Static assets and runtime config
scripts/                 # Build and utility scripts
```

## 🚀 Release Process

Releases are handled by maintainers:

1. Features are merged into `main` branch
2. Version is bumped following semantic versioning
3. Release notes are generated from commit messages
4. GitHub release is created with build artifacts

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: PRs are reviewed by maintainers and community members

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments section

Thank you for contributing to OpenAPI Admin! 🎉
