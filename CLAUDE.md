# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `bun test` - Run all tests using Bun test runner
- `bun test --watch` - Run tests in watch mode for development

### Building & Development
- `npm run build` - Build the package (TypeScript compilation + Bun bundling)
- `npm run build:watch` - Build in watch mode for development
- `bun scripts/pre-publish.ts` - Complete pre-publish workflow (tests, build, version bump, git tags)

### Code Quality
- `npm run format` - Format code using Biome
- `npm run lint` - Lint code using Biome
- `npm run check` - Run Biome check and apply fixes

### Publishing
- `npm run pre-publish` - Interactive script for version management and publishing preparation
- `npm publish` - Publish to NPM (runs build automatically via prepare script)

## Architecture Overview

This is a modern TypeScript logging library with zero dependencies that automatically adapts to different runtime environments.

### Core Design Patterns

**Singleton Pattern**: The Logger class uses a singleton pattern to ensure consistent logging configuration across the application. Access via `createLogger()` or the proxy-based `logger` export.

**Platform Detection**: Automatically detects the runtime environment:
- `web` - Browser environment (uses CSS styling in console.log)
- `console` - Node.js environment (uses ANSI color codes)
- `lambda` - AWS Lambda environment (uses simple text prefixes)

**Proxy-based API**: The main `logger` export is a Proxy that delegates to the singleton instance, providing a clean API without requiring explicit initialization.

### Key Components

**Platform-specific Styling**: Three distinct styling systems for different environments:
- Web: CSS-in-JS styling for browser DevTools
- Console: ANSI escape codes for terminal colors and symbols
- Lambda: Simple text prefixes optimized for CloudWatch logs

**Log Level Filtering**: Configurable minimum log levels with environment variable support (`LOG_LEVEL`). Priority order: DEBUG(0) < INFO(1) < WARN(2) < ERROR(3) < SUCCESS(4).

**Message Formatting**: Uses Node.js `util.inspect` for object serialization with color support, handles Error objects separately for better native formatting.

**Group Management**: Supports nested log groups with automatic indentation tracking.

### Configuration System

The logger accepts a comprehensive options object:
- `platform`: Override automatic platform detection
- `timestampEnabled`: Toggle timestamp display
- `customStyles`: Platform-specific style overrides
- `prefix`: Global or level-specific message prefixes
- `minLogLevel`: Minimum log level to display

## Development Notes

### Testing Framework
Uses Bun's built-in test runner with comprehensive mocking for console output verification. Tests cover platform detection, log level filtering, message formatting, and style customization.

### Build Process
- TypeScript compilation for type definitions and CommonJS compatibility
- Bun bundling for optimized ESM output
- Both target Node.js runtime with ES2020 features

### Error Handling Strategy
Error objects receive special treatment - they're logged using native `console.error()` for proper stack trace formatting while maintaining consistent prefixes and styling for other log levels.

### Publishing Workflow
The `pre-publish.ts` script provides an interactive CLI for version management, ensuring tests pass, building the package, creating git tags, and pushing changes before NPM publication.