import { expect, test, mock } from "bun:test";
import { createLogger } from "../src";

test("error logging - basic error", () => {
	// Mock console.log
	const originalConsoleLog = console.log;
	const mockConsoleLog = mock((...args: Parameters<typeof console.log>) => {});
	console.log = mockConsoleLog;

	const logger = createLogger({
		platform: "console",
		timestampEnabled: false,
	});

	const error = new Error("Test error");
	logger.error("Error occurred:", error);

	// Verify the error was logged with proper properties
	expect(mockConsoleLog).toHaveBeenCalled();
	const loggedMessage = mockConsoleLog.mock.calls[0]?.[0] as string;
	expect(loggedMessage).toContain("Test error"); // Error message
	expect(loggedMessage).toContain("Error"); // Error name
	expect(loggedMessage).toContain("stack"); // Stack trace

	// Restore console.log
	console.log = originalConsoleLog;
});

test("error logging - custom error properties", () => {
	const originalConsoleLog = console.log;
	const mockConsoleLog = mock((...args: Parameters<typeof console.log>) => {});
	console.log = mockConsoleLog;

	const logger = createLogger({
		platform: "console",
		timestampEnabled: false,
	});

	const error = new Error("Test error") as Error & { customProp: string };
	error.customProp = "custom value";
	logger.error("Error with custom props:", error);

	// Verify custom properties are included
	expect(mockConsoleLog).toHaveBeenCalled();
	const loggedMessage = mockConsoleLog.mock.calls[0]?.[0] as string;
	expect(loggedMessage).toContain("Test error"); // Error message
	expect(loggedMessage).toContain("customProp"); // Custom property
	expect(loggedMessage).toContain("custom value"); // Custom property value

	console.log = originalConsoleLog;
});

test("error logging - multiple arguments with error", () => {
	const originalConsoleLog = console.log;
	const mockConsoleLog = mock((...args: Parameters<typeof console.log>) => {});
	console.log = mockConsoleLog;

	const logger = createLogger({
		platform: "console",
		timestampEnabled: false,
	});

	const error = new Error("Test error");
	const context = { userId: 123 };
	logger.error("Error in user context:", context, error);

	// Verify all arguments are properly formatted
	expect(mockConsoleLog).toHaveBeenCalled();
	const loggedMessage = mockConsoleLog.mock.calls[0]?.[0] as string;
	expect(loggedMessage).toContain("Test error"); // Error message
	expect(loggedMessage).toContain("userId"); // Context object
	expect(loggedMessage).toContain("123"); // Context value

	console.log = originalConsoleLog;
});
