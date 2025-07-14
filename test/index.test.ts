/// <reference types="bun-types" />

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	test,
} from "bun:test";
import { inspect } from "node:util";
import { LogLevels, type Logger, createLogger, logger } from "../src/index";

describe("Logger", () => {
	let testLogger: Logger;
	let consoleLogSpy: ReturnType<typeof mock>;
	let originalWindow: unknown;
	let originalAWSLambda: string | undefined;

	// A simpler ANSI stripping function
	const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");

	// Helpers for matching outputs (after stripping ANSI codes)
	const simplePattern = (icon: string, message: string): RegExp => {
		// Expect the icon followed by one or more whitespace then the message
		const escapedIcon = icon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return new RegExp(`${escapedIcon}\\s+${message}`);
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
		let originalLogLevel: string | undefined;

		beforeEach(() => {
			originalLogLevel = process.env.LOG_LEVEL;
		});

		afterEach(() => {
			process.env.LOG_LEVEL = originalLogLevel;
		});

		test("should log all levels when minLogLevel is DEBUG", () => {
			testLogger = createLogger({ minLogLevel: "debug" });

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(5);
		});

		test("should respect LOG_LEVEL environment variable", () => {
			process.env.LOG_LEVEL = "ERROR";

			testLogger = createLogger();

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Only error and success should be logged
		});

		test("should ignore invalid LOG_LEVEL environment variable", () => {
			process.env.LOG_LEVEL = "INVALID_LEVEL";

			testLogger = createLogger();

			testLogger.debug("debug message");
			testLogger.info("info message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Should default to DEBUG level
		});

		test("should prioritize options.minLogLevel over LOG_LEVEL environment variable", () => {
			process.env.LOG_LEVEL = "ERROR";

			testLogger = createLogger({ minLogLevel: "info" });

			testLogger.debug("debug message");
			testLogger.info("info message");
			testLogger.warn("warn message");
			testLogger.error("error message");
			testLogger.success("success message");

			expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Should use INFO level from options
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
		it("should add string prefix to all log levels", () => {
			const logger = createLogger({
				prefix: "[TEST]",
				timestampEnabled: false,
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			// This test checks the full string with ANSI codes
			expect(lastCall[0]).toBe("\u001b[36mℹ\u001b[0m [TEST] test message");
		});

		test("should add specific prefixes per log level", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.info("test message");
			logger.error("error message");

			const calls = consoleLogSpy.mock.calls;
			// Compare outputs after stripping ANSI codes to ignore formatting differences
			expect(stripAnsi(calls[0][0])).toMatch(
				simplePattern("ℹ", "test message"),
			);
			expect(stripAnsi(calls[1][0])).toMatch(
				simplePattern("✖", "error message"),
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
			// After stripping ANSI codes, the info log inside a group should have extra indentation
			// (icon, a space, then two spaces indent, then the message).
			expect(stripAnsi(calls[2][0])).toMatch(/ℹ\s+message in group/);
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
			// Check that after stripping ANSI codes, the messages show the expected hierarchy.
			expect(stripAnsi(calls[1][0])).toMatch(/ℹ\s+message in group 1/);
			expect(stripAnsi(calls[3][0])).toMatch(/ℹ\s+message in group 2/);
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
		it("should update prefix with string", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			logger.setPrefix("[NEW]");
			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe("\u001b[36mℹ\u001b[0m [NEW] test message");
		});

		it("should update prefix with level-specific object", () => {
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
			expect(calls[0][0]).toBe("\u001b[36mℹ\u001b[0m [INFO_NEW] test message");
			expect(calls[1][0]).toBe(
				"\u001b[31m✖\u001b[0m [ERROR_NEW] error message",
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
		it("should format correctly for web platform", () => {
			const consoleLogSpy = mock(() => {});
			console.log = consoleLogSpy;

			const logger = createLogger({
				platform: "web",
				timestampEnabled: false,
				customStyles: {
					web: {
						debug: "color: #787878;",
						info: "background: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;",
						success:
							"background: #10dc60; color: #ffffff; border-radius: 3px; padding: 0 5px",
						warn: "background: #ffce00; color: #ffffff; border-radius: 3px; padding: 0 5px",
						error:
							"background: #f04141; color: #ffffff; border-radius: 3px; padding: 0 5px",
						time: "color: #ffce00",
						title: "font-size: 1.5rem",
						group: "color: #3880ff; font-weight: bold;",
						groupCollapsed: "color: #3880ff;",
					},
				},
			});

			logger.info("test message");

			expect(consoleLogSpy).toHaveBeenCalledWith(
				"%ctest message",
				"background: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;",
			);
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
		it("should maintain singleton instance via proxy", () => {
			const logger = createLogger({
				prefix: "[TEST]",
				timestampEnabled: false,
			});

			// The proxy logger should use the same instance
			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe("\u001b[36mℹ\u001b[0m [TEST] test message");
		});
	});

	describe("Message Formatting", () => {
		it("should format object messages", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testObject = { name: "test", value: 42 };
			logger.info(testObject);

			const lastCall = consoleLogSpy.mock.calls[0];
			const output = stripAnsi(lastCall[0]);
			expect(output).toContain('"name": "test"');
			expect(output).toContain('"value": 42');
		});

		it("should handle multiple arguments of different types", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testObject = { id: 1 };
			const testNumber = 42;
			logger.info("test message", testObject, testNumber);

			const lastCall = consoleLogSpy.mock.calls[0];
			const output = stripAnsi(lastCall[0]);
			expect(output).toContain("test message");
			expect(output).toContain('"id": 1');
			expect(output).toContain("42");
		});

		test("should handle array arguments", () => {
			const logger = createLogger({
				timestampEnabled: false,
			});

			const testArray = [1, "two", { three: 3 }];
			logger.info(testArray);

			const lastCall = consoleLogSpy.mock.calls[0];
			const output = stripAnsi(lastCall[0]);
			expect(output).toContain("1");
			expect(output).toContain('"two"');
			expect(output).toContain('"three": 3');
		});
	});

	describe("Style Customization", () => {
		it("should apply custom styles for console platform", () => {
			const logger = createLogger({
				platform: "console",
				timestampEnabled: false,
				customStyles: {
					console: {
						debug: "\u001b[90m◯\u001b[0m",
						info: "\u001b[35m●\u001b[0m",
						warn: "\u001b[33m⚠\u001b[0m",
						error: "\u001b[31m✖\u001b[0m",
						success: "\u001b[32m✔\u001b[0m",
						time: "\u001b[33m⏱\u001b[0m",
						title: "\u001b[1m\u001b[0m",
						group: "\u001b[34m▼\u001b[0m",
						groupCollapsed: "\u001b[34m▶\u001b[0m",
					},
				},
			});

			logger.info("test message");

			const lastCall = consoleLogSpy.mock.calls[0];
			expect(lastCall[0]).toBe("\u001b[35m●\u001b[0m test message");
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
