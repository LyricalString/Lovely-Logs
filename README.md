# 🌈 Lovely Logs

A modern, type-safe logging library that automatically adapts to your environment - whether you're in Node.js, the browser, or AWS Lambda. With beautiful colors, timestamps, and smart platform detection.

## ✨ Features

- 🎨 Beautiful, colorful logs with customizable styles
- 🔄 Automatic platform detection (Browser, Node.js, AWS Lambda)
- ⚡ Zero dependencies
- 📝 Full TypeScript support
- ⏱️ Built-in timestamps
- 🎯 Smart object formatting
- 🔒 Type-safe API

## 📦 Installation

```bash
# Using npm
npm install lovely-logs

# Using yarn
yarn add lovely-logs

# Using pnpm
pnpm add lovely-logs

# Using bun
bun add lovely-logs
```

## 🚀 Quick Start

```typescript
import { logger } from "lovely-logs";

// Start logging right away - platform is auto-detected!
logger.info("Hello World!");
logger.warn("This is a warning");
logger.error("This is an error");
logger.success("Operation completed!");

// Log objects with automatic formatting
logger.info({ user: "john", action: "login", timestamp: new Date() });

// Multiple arguments work too
logger.info("User", { id: 123 }, "logged in", true);
```

## 🎨 Custom Configuration

```typescript
import { createLogger } from "lovely-logs";

// Create a custom logger instance
const logger = createLogger({
  // Optional: Override platform auto-detection
  platform: "web", // "web" | "console" | "lambda"
  
  // Optional: Enable/disable timestamps (enabled by default)
  timestampEnabled: true,
  
  // Optional: Custom styles
  customStyles: {
    web: {
      info: "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;",
      // Customize other levels: warn, error, success
    }
  }
});
```

## 🎯 Platform-Specific Features

### 🌐 Browser
- Beautiful CSS-styled logs
- Collapsible object formatting
- Chrome DevTools friendly

### 💻 Console (Node.js)
- Colorful terminal output with Unicode symbols
- Clean timestamp formatting
- Perfect for CLI applications

### ☁️ AWS Lambda
- Lambda-optimized output format
- Automatic detection in Lambda environment
- Structured logging friendly

## 🔍 Advanced Usage

### Custom Styling

```typescript
const logger = createLogger({
  customStyles: {
    web: {
      info: "background: #your-color; color: #text-color;",
      warn: "background: #warn-color; color: #text-color;",
      error: "background: #error-color; color: #text-color;",
      success: "background: #success-color; color: #text-color;",
    },
    console: {
      // Custom terminal colors and symbols
      info: "\x1b[36m●\x1b[0m",
      // ... customize other levels
    }
  }
});
```

### Singleton Pattern

The logger uses a singleton pattern, ensuring consistent logging across your application:

```typescript
// These both reference the same logger instance
import { logger } from "lovely-logs";
import { createLogger } from "lovely-logs";

const customLogger = createLogger(); // Returns existing instance if already created
```

### Reset for Testing

```typescript
import { Logger } from "lovely-logs";

// Reset the logger (useful in tests)
Logger.resetInstance();
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

If you encounter any issues or have questions, please open an issue on our GitHub repository.

Happy logging! 🌈
