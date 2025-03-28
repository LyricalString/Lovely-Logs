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
logger.debug("Debug information for development");
logger.info("Hello World!");
logger.warn("This is a warning");
logger.error("This is an error");
logger.success("Operation completed!");

// Log objects with automatic formatting
logger.info({ user: "john", action: "login", timestamp: new Date() });

// Multiple arguments work too
logger.info("User", { id: 123 }, "logged in", true);

// Group related logs
logger.group("User Authentication");
logger.debug("Attempting login...");
logger.success("Login successful");
logger.groupEnd();
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
      debug: "color: #787878;",
      info: "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;",
      // Customize other levels: warn, error, success
    }
  },
  
  // Optional: Add prefixes to your logs
  prefix: {
    debug: "[DEBUG]",
    info: "[INFO]",
    warn: "[WARN]",
    error: "[ERROR]",
    success: "[SUCCESS]"
  }
});
```

## 🎯 Platform-Specific Features

### 🌐 Browser
- Beautiful CSS-styled logs
- Collapsible object formatting
- Chrome DevTools friendly
- Debug level with gray styling for development logs

### 💻 Console (Node.js)
- Colorful terminal output with Unicode symbols
- Clean timestamp formatting
- Perfect for CLI applications
- Debug level with dimmed output

### ☁️ AWS Lambda
- Lambda-optimized output format
- Automatic detection in Lambda environment
- Structured logging friendly
- Standard log levels (DEBUG, INFO, WARN, ERROR)
- Timestamp prefixing for better log aggregation
- JSON-formatted object logging for CloudWatch integration
- Proper log level prefixing ([DEBUG], [INFO], etc.)

## 🔍 Advanced Usage

### Log Levels

The library supports the following log levels:
- `debug`: For development and debugging information
- `info`: For general information
- `warn`: For warnings
- `error`: For errors
- `success`: For successful operations
- `group`: For grouping related logs
- `groupCollapsed`: For collapsible groups (in supported platforms)

You can set the minimum log level in three ways:

1. Using environment variable:
```bash
# Set minimum log level via environment variable
export LOG_LEVEL=INFO  # Will show INFO and above (INFO, WARN, ERROR, SUCCESS)
export LOG_LEVEL=ERROR # Will show ERROR and SUCCESS only
```

2. Using options when creating the logger:
```typescript
const logger = createLogger({
  minLogLevel: "info" // Will show INFO and above
});
```

3. Dynamically at runtime:
```typescript
logger.setMinLogLevel("warn"); // Will show WARN and above
```

Note: If both environment variable and options are provided, the options take precedence.

### Custom Styling

```typescript
const logger = createLogger({
  customStyles: {
    web: {
      debug: "color: #787878;",
      info: "background: #your-color; color: #text-color;",
      warn: "background: #warn-color; color: #text-color;",
      error: "background: #error-color; color: #text-color;",
      success: "background: #success-color; color: #text-color;",
    },
    console: {
      // Custom terminal colors and symbols
      debug: "\x1b[90m◯\x1b[0m",
      info: "\x1b[36m●\x1b[0m",
      // ... customize other levels
    },
    lambda: {
      // Custom Lambda log prefixes
      debug: "[DEBUG]",
      info: "[INFO]",
      // ... customize other levels
    }
  }
});
```

### AWS Lambda Integration

When running in an AWS Lambda environment, the logger automatically:
1. Detects the Lambda environment
2. Formats logs appropriately for CloudWatch
3. Adds proper log level prefixes
4. Maintains timestamp information
5. Formats objects as JSON strings

Example Lambda usage:
```typescript
import { createLogger } from "lovely-logs";

export const handler = async (event: any) => {
  const logger = createLogger(); // Will auto-detect Lambda environment
  
  logger.debug("Event received:", event);
  logger.info("Processing started");
  
  try {
    // Your Lambda logic here
    logger.success("Processing completed");
  } catch (error) {
    logger.error("Processing failed:", error);
    throw error;
  }
};
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

### Publishing to NPM

To publish a new version to NPM:

1. Make sure you're logged in to npm:
   ```bash
   npm login
   ```

2. Ensure all your changes are committed:
   ```bash
   git add .
   git commit -m "feat: your changes description"
   ```

3. Run npm publish:
   ```bash
   npm publish
   ```
   This will automatically:
   - Run the prepare script
   - Build the package
   - Publish to NPM
   - You might be asked for a one-time password (OTP) if you have 2FA enabled

## 💬 Support

If you encounter any issues or have questions, please open an issue on our GitHub repository.

Happy logging! 🌈
```