/// <reference types="bun-types" />

import {
	describe,
	test,
	expect,
	beforeEach,
	jest,
	afterEach,
	mock,
} from "bun:test";
import { createLogger, LogLevels, type Logger, logger } from "./index";

describe("Logger", () => {
	let testLogger: Logger;
	let consoleLogSpy: ReturnType<typeof mock>;
	let originalWindow: unknown;
	let originalAWSLambda: string | undefined;

	// Helper function to create ANSI color regex patterns
	const ansiPattern = (icon: string, message: string) => {
		const ESC = String.fromCharCode(0x1b);
		return new RegExp(` ${ESC}\\[36m${icon}${ESC}\\[0m ${message}`);
	};

	beforeEach(() => {
		// Store original values
		originalWindow = (global as { window?: unknown }).window;
		originalAWSLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;

		// Reset the logger instance before each test
		testLogger = createLogger();
		// Reset the logger instance to ensure clean state
		(testLogger.constructor as typeof Logger).resetInstance();
		// Spy on console.log
		consoleLogSpy = mock(() => {});
		console.log = consoleLogSpy;
	});

	afterEach(() => {
		// Clear all mocks after each test
		mock.restore();
		// Restore original values
		(global as { window?: unknown }).window = originalWindow;
		process.env.AWS_LAMBDA_FUNCTION_NAME = originalAWSLambda;
	});

	describe("Log Level Filtering", () => {
		test("should log all levels when minLogLevel is DEBUG", () => {
			testLogger = createLogger({ minLogLevel: "debug" });

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(5);
		});

		test("should not log DEBUG when minLogLevel is INFO", () => {
			testLogger = createLogger({ minLogLevel: "info" });

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(4);
		});

		test("should only log ERROR and SUCCESS when minLogLevel is ERROR", () => {
			testLogger = createLogger({ minLogLevel: "error" });

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("Prefix Functionality", () => {
		test("should add string prefix to all log levels", () => {
			const logger = createLogger({
				prefix: "[TEST]",
				timestampEnabled: false,
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[36mℹ${String.fromCharCode(0x1b)}\\[0m \\[TEST\\] test message`,
				),
			);
		});

		test("should add specific prefixes per log level", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.info("test message");
			logger.error("error message");

			const calls = consoleLogSpy.mock.calls;
			expect(calls[0][0]).toMatch(ansiPattern("ℹ", "test message"));

			const ESC = String.fromCharCode(0x1b);
			expect(calls[1][0]).toMatch(
				new RegExp(` ${ESC}\\[31m✖${ESC}\\[0m error message`),
			);
		});
	});

	describe("Group Functionality", () => {
		test("should increase indentation for grouped messages", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.info("message outside group");
			logger.group("Group 1");
			logger.info("message in group");
			logger.groupEnd();

			const calls = consoleLogSpy.mock.calls;
			expect(calls[2][0]).toMatch(ansiPattern("ℹ", "  message in group"));
		});

		test("should handle nested groups", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.group("Group 1");
			logger.info("message in group 1");
			logger.group("Group 2");
			logger.info("message in group 2");
			logger.groupEnd();
			logger.groupEnd();

			const calls = consoleLogSpy.mock.calls;
			expect(calls[1][0]).toMatch(ansiPattern("ℹ", "  message in group 1"));
			expect(calls[3][0]).toMatch(ansiPattern("ℹ", "    message in group 2"));
		});
	});

	describe("Timestamp Functionality", () => {
		test("should include timestamp when enabled", () => {
			testLogger = createLogger({ timestampEnabled: true });

			testLogger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(/\[\d+\.\d+s\]/);
		});

		test("should not include timestamp when disabled", () => {
			testLogger = createLogger({ timestampEnabled: false });

			testLogger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).not.toMatch(/\[\d+\.\d+s\]/);
		});
	});

	describe("Platform Detection", () => {
		test("should default to console platform in Node environment", () => {
			const logger = createLogger();
			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			const ESC = String.fromCharCode(0x1b);
			expect(lastCall[0]).toMatch(new RegExp(`${ESC}\\[`)); // ANSI color codes
		});
	});

	describe("Dynamic Log Level Changes", () => {
		test("should respect log level changes at runtime", () => {
			testLogger = createLogger({ minLogLevel: "debug" });

			testLogger.debug("should show");
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);

			testLogger.setMinLogLevel("error");

			testLogger.debug("should not show");
			testLogger.info("should not show");
			testLogger.warn("should not show");
			testLogger.error("should show");
			testLogger.success("should show");

			expect(consoleLogSpy).toHaveBeenCalledTimes(3);
		});
	});

	describe("Prefix Management", () => {
		test("should update prefix with string", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.setPrefix("[NEW]");
			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[36mℹ${String.fromCharCode(0x1b)}\\[0m \\[NEW\\] test message`,
				),
			);
		});

		test("should update prefix with level-specific object", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.setPrefix({
				info: "[INFO_NEW]",
				error: "[ERROR_NEW]",
			});

			logger.info("test message");
			logger.error("error message");

			const calls = consoleLogSpy.mock.calls;
			expect(calls[0][0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[36mℹ${String.fromCharCode(0x1b)}\\[0m \\[INFO_NEW\\] test message`,
				),
			);
			expect(calls[1][0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[31m✖${String.fromCharCode(0x1b)}\\[0m \\[ERROR_NEW\\] error message`,
				),
			);
		});

		test("should update prefix for all log levels when using string prefix", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.setPrefix("[ALL]");

			// Test all log levels
			logger.debug("debug message");
			logger.info("info message");
			logger.warn("warn message");
			logger.error("error message");
			logger.success("success message");
			logger.group("group message");
			logger.groupCollapsed("collapsed message");

			const calls = consoleLogSpy.mock.calls;
			expect(calls[0][0]).toMatch(/\[ALL\] debug message/);
			expect(calls[1][0]).toMatch(/\[ALL\] info message/);
			expect(calls[2][0]).toMatch(/\[ALL\] warn message/);
			expect(calls[3][0]).toMatch(/\[ALL\] error message/);
			expect(calls[4][0]).toMatch(/\[ALL\] success message/);
			expect(calls[5][0]).toMatch(/\[ALL\] group message/);
			expect(calls[6][0]).toMatch(/\[ALL\] collapsed message/);
		});
	});

	describe("Platform-specific Formatting", () => {
		test("should format correctly for web platform", () => {
			// Mock window object
			(global as { window: { document: unknown } }).window = {
				document: {},
			};

			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe(
				"%cbackground: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;%c",
			);
			expect(lastCall[1]).toBe(
				"background: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;",
			);
			expect(lastCall[2]).toBe("color: #ffce00");
			expect(lastCall[3]).toBe("test message");
		});

		test("should format correctly for lambda platform", () => {
			// Mock AWS Lambda environment
			process.env.AWS_LAMBDA_FUNCTION_NAME = "test-function";

			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe(" [INFO] test message");
		});
	});

	describe("Proxy Logger", () => {
		test("should maintain singleton instance via proxy", () => {
			// Reset instance to ensure clean state
			(logger.constructor as typeof Logger).resetInstance();

			const directLogger = createLogger({
				timestampEnabled: false,
				prefix: "[TEST]",
			});

			// The proxy logger should use the same instance
			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[36mℹ${String.fromCharCode(0x1b)}\\[0m \\[TEST\\] test message`,
				),
			);
		});
	});

	describe("Message Formatting", () => {
		test("should format object messages", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testObject = { name: "test", value: 42 };
			logger.info(testObject);

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				/\{\s+"name":\s+"test",\s+"value":\s+42\s+\}/,
			);
		});

		test("should handle multiple arguments of different types", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testObject = { id: 1 };
			const testNumber = 42;
			logger.info("test message", testObject, testNumber);

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(/test\s+message\s+\{\s+"id":\s+1\s+\}\s+42/);
		});

		test("should handle array arguments", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testArray = [1, "two", { three: 3 }];
			logger.info(testArray);

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				/\[\s+1,\s+"two",\s+\{\s+"three":\s+3\s+\}\s+\]/,
			);
		});
	});

	describe("Style Customization", () => {
		test("should apply custom styles for web platform", () => {
			// Mock window object
			(global as { window: { document: unknown } }).window = {
				document: {},
			};

			const logger = createLogger({
				timestampEnabled: false,
				customStyles: {
					web: {
						debug: "color: gray;",
						info: "color: purple; font-weight: bold;",
						warn: "color: orange;",
						error: "color: red;",
						success: "color: green;",
						time: "color: blue;",
						title: "font-size: 2em;",
						group: "color: blue; font-weight: bold;",
						groupCollapsed: "color: blue;",
					},
				},
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe("%ccolor: purple; font-weight: bold;%c");
			expect(lastCall[1]).toBe("color: purple; font-weight: bold;");
		});

		test("should apply custom styles for console platform", () => {
			const logger = createLogger({
				timestampEnabled: false,
				customStyles: {
					console: {
						debug: "\x1b[90m◆\x1b[0m",
						info: "\x1b[35m●\x1b[0m",
						warn: "\x1b[33m◆\x1b[0m",
						error: "\x1b[31m◆\x1b[0m",
						success: "\x1b[32m◆\x1b[0m",
						time: "\x1b[34m◆\x1b[0m",
						title: "\x1b[1m◆\x1b[0m",
						group: "\x1b[34m◆\x1b[0m",
						groupCollapsed: "\x1b[34m◆\x1b[0m",
					},
				},
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toMatch(
				new RegExp(
					` ${String.fromCharCode(0x1b)}\\[35m●${String.fromCharCode(0x1b)}\\[0m test message`,
				),
			);
		});

		test("should apply custom styles for lambda platform", () => {
			// Mock AWS Lambda environment
			process.env.AWS_LAMBDA_FUNCTION_NAME = "test-function";

			const logger = createLogger({
				timestampEnabled: false,
				customStyles: {
					lambda: {
						debug: "[CUSTOM_DEBUG]",
						info: "[CUSTOM_INFO]",
						warn: "[CUSTOM_WARN]",
						error: "[CUSTOM_ERROR]",
						success: "[CUSTOM_SUCCESS]",
						time: "[CUSTOM_TIME]",
						title: "[CUSTOM_TITLE]",
						group: "[CUSTOM_GROUP]",
						groupCollapsed: "[CUSTOM_GROUP_COLLAPSED]",
					},
				},
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe(" [CUSTOM_INFO] test message");
		});
	});
});
