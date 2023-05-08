# 🌈 Lovely Logs

Lovely Logs is a lightweight, customizable logging library for Node.js and browser environments that enhances your console logs with beautiful colors and styles. With Lovely Logs, you can quickly and easily differentiate between different types of logs, making it easier to identify and debug issues in your application.

## 📦 Installation

To install Lovely Logs, simply run the following command:

```
npm install lovely-logs
```

or

```
yarn add lovely-logs
```

or

```
pnpm add lovely-logs
```

## 🚀 Usage

Start by importing the `Logger` class from the `lovely-logs` package:

```
import { Logger } from 'lovely-logs';
```

Now you can use the available logging methods to print messages to the console:

```
// Basic logs
Logger.info('This is an info message');
Logger.warn('This is a warning message');
Logger.error('This is an error message');
Logger.success('This is a success message');

// Custom log with large font
Logger.title('This is a title');
```

By default, timestamps are enabled for `info`, `warn`, `error`, and `success` log types. To disable timestamps, set the `timeStampEnabled` property to `false`:

```
Logger.timeStampEnabled = false;
```

To use custom log styles, you can call the `custom` method:

```
Logger.custom(modeText: string, style: string, printTime: boolean, ...msgs: any[]);
```

## ⚙️ Configuration

You can customize the appearance of your logs by modifying the `logStyle` and `modeText` properties of the `Logger` class:

```
Logger.logStyle.info = 'background: #customColor; color: #customTextColor; ...';
Logger.modeText.info = 'CUSTOM_INFO';
```

## 📄 License

Lovely Logs is open-source software licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines for more information.

## 💬 Support

If you encounter any issues or have questions, please feel free to open an issue on our GitHub repository.

Happy logging! 🌈
