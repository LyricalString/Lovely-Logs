# 🌈 Lovely Logs

Lovely Logs is a lightweight, customizable logging library for Node.js and browser environments that enhances your console logs with beautiful colors and styles. With Lovely Logs, you can quickly and easily differentiate between different types of logs, making it easier to identify and debug issues in your application.

&nbsp;

<img src="./assets/console_example.png?raw=true" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="./assets/web_example.png?" width="150" />

&nbsp;

## 📦 Installation

To install Lovely Logs, simply run the following command:

```bash
npm install lovely-logs
```

or

```bash
yarn add lovely-logs
```

or

```bash
pnpm add lovely-logs
```

&nbsp;

## 🚀 Simple Usage

Import the `logger` class from the `lovely-logs` package:

> ⚠️ **By default, the 'web' platform is used.** If you want to use it on a Terminal, please use 'console' platform. See [Advanced Usage](#-advanced-usage) for more information.

```typescript
import { logger } from "lovely-logs"

// Now you can use the available logging methods to print messages to the console:

Logger.info("This is an info message")
Logger.warn("This is a warning message")
Logger.error("This is an error message")
Logger.success("This is a success message")
```

&nbsp;

## 🔍 Advanced Usage

Start by importing the `createLogger` class from the `lovely-logs` package:

```typescript
import { createLogger } from "lovely-logs"
```

Call createLogger function with your desired configuration:

```typescript
createLogger({
  platform: "console",
  timestampEnabled: true,
  // more options coming soon
})
```

You can choose between the 'web' and 'console' platforms by setting the platform option to the desired value. By default, the 'web' platform is used.

Now you can use all around your code the available logging methods to print messages to the console:

```typescript
import { Logger } from "lovely-logs"

// These are configured from the previous createLogger function
Logger.info("This is an info message")
Logger.warn("This is a warning message")
Logger.error("This is an error message")
Logger.success("This is a success message")
```

&nbsp;

## 🖌️ Configuration

To use custom log styles, you can call the `custom` method:

```typescript
Logger.custom(modeText: string, style: string, printTime: boolean, ...msgs: any[]);
```

You can customize permanently the appearance of your logs by modifying the `logStyle` and `modeText` properties of the `Logger` class:

```typescript
// Only used on website
Logger.logStyle.info = "background: #customColor; color: #customTextColor; ..."

Logger.modeText["web"].info = "CUSTOM_INFO"
// This will change the styled output text from "INFO" to "CUSTOM_INFO"
Logger.modeText["console"].info = "CUSTOM_INFO"
// This will change the output text from "ℹ" to "CUSTOM_INFO"
```

&nbsp;

## 📄 License

Lovely Logs is open-source software licensed under the MIT License.

&nbsp;

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines for more information.

&nbsp;

## 💬 Support

If you encounter any issues or have questions, please feel free to open an issue on our GitHub repository.

Happy logging! 🌈
