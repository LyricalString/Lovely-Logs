/// <reference types="node" />

// Cross-platform object inspection
const inspectObject = (obj: unknown): string => {
	if (typeof obj === "object" && obj !== null) {
		try {
			// Try simple JSON stringify first
			return JSON.stringify(obj, null, 2);
		} catch {
			// If that fails (circular refs, etc), use a safe replacer
			try {
				return JSON.stringify(
					obj,
					(_, value) => {
						// Handle functions
						if (typeof value === "function") {
							return `[Function: ${value.name || "anonymous"}]`;
						}
						// Handle undefined (JSON.stringify normally omits these)
						if (value === undefined) {
							return "[undefined]";
						}
						// Let JSON.stringify handle circular references with its built-in error
						return value;
					},
					2,
				);
			} catch {
				// If all else fails, convert to string
				return String(obj);
			}
		}
	}
	return String(obj);
};

export const LogLevels = {
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
	SUCCESS: "success",
	GROUP: "group",
	GROUP_COLLAPSED: "groupCollapsed",
} as const;

export const LogLevelPriority = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
	SUCCESS: 4,
} as const;

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];
export type Platform = "web" | "console" | "lambda" | "ecs";

export interface LoggerOptions {
	platform?: Platform;
	timestampEnabled?: boolean;
	customStyles?: Partial<typeof defaultStyles>;
	prefix?: string | Partial<Record<LogLevel, string>>;
	minLogLevel?: LogLevel;
	structured?: boolean; // Output structured JSON logs
	serviceName?: string; // Service name for identification
	correlationId?: string; // Request correlation ID
	context?: Record<string, unknown>; // Persistent context metadata
}

const defaultStyles = {
	web: {
		debug: "color: #888; font-style: italic;",
		info: "color: #0066cc; font-weight: 500;",
		success: "color: #28a745; font-weight: 500;",
		warn: "color: #ffa500; font-weight: 500;",
		error: "color: #dc3545; font-weight: bold;",
		time: "color: #6c757d;",
		title: "font-size: 1.5rem; font-weight: bold;",
		group: "color: #0066cc; font-weight: bold;",
		groupCollapsed: "color: #0066cc; font-weight: 500;",
	},
	console: {
		debug: "\x1b[90m◯\x1b[0m",
		info: "\x1b[36mℹ\x1b[0m",
		warn: "\x1b[33m⚠\x1b[0m",
		error: "\x1b[31m✖\x1b[0m",
		success: "\x1b[32m✔\x1b[0m",
		time: "\x1b[33m⏱\x1b[0m",
		title: "\x1b[1m",
		group: "\x1b[34m▼\x1b[0m",
		groupCollapsed: "\x1b[34m▶\x1b[0m",
	},
	lambda: {
		debug: "[DEBUG]",
		info: "[INFO]",
		warn: "[WARN]",
		error: "[ERROR]",
		success: "[SUCCESS]",
		time: "[TIME]",
		title: "[TITLE]",
		group: "[GROUP]",
		groupCollapsed: "[GROUP]",
	},
	ecs: {
		debug: "DEBUG",
		info: "INFO",
		warn: "WARN",
		error: "ERROR",
		success: "INFO", // ECS doesn't have SUCCESS level, map to INFO
		time: "INFO",
		title: "INFO",
		group: "INFO",
		groupCollapsed: "INFO",
	},
};

const detectPlatform = (): Platform => {
	if (typeof window !== "undefined" && window.document) {
		return "web";
	}

	// AWS ECS detection
	if (process.env.ECS_CONTAINER_METADATA_URI || 
		process.env.ECS_CONTAINER_METADATA_URI_V4 ||
		process.env.AWS_EXECUTION_ENV?.includes('ECS')) {
		return "ecs";
	}

	// AWS Lambda detection
	if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
		return "lambda";
	}

	return "console";
};

/**
 * A modern, type-safe logger with pretty colors and platform-specific formatting.
 */
class Logger {
	private static instance: Logger | null = null;
	private readonly platform: Platform;
	private readonly timeStampEnabled: boolean;
	private readonly styles: typeof defaultStyles;
	private readonly startTime: number;
	private readonly prefix: Partial<Record<LogLevel, string>>;
	private readonly structured: boolean;
	private readonly serviceName?: string;
	private groupLevel = 0;
	private minLogLevel: LogLevel;
	private correlationId?: string;
	private context: Record<string, unknown> = {};
	private timers: Map<string, number> = new Map();

	private constructor(options: LoggerOptions = {}) {
		this.platform = options.platform ?? detectPlatform();
		this.timeStampEnabled = options.timestampEnabled ?? true;
		this.structured = options.structured ?? (this.platform === "ecs");
		this.serviceName = options.serviceName;
		this.correlationId = options.correlationId;
		this.context = options.context ? { ...options.context } : {};
		
		this.styles = {
			...defaultStyles,
			...(options.customStyles || {}),
		};
		this.startTime = Date.now();

		// Check for LOG_LEVEL environment variable
		const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
		const isValidLogLevel = Object.values(LogLevels).includes(envLogLevel);
		this.minLogLevel =
			options.minLogLevel ?? (isValidLogLevel ? envLogLevel : LogLevels.DEBUG);

		if (typeof options.prefix === "string") {
			const prefixValue = options.prefix;
			this.prefix = Object.values(LogLevels).reduce(
				(acc, level) => {
					acc[level] = prefixValue;
					return acc;
				},
				{} as Record<LogLevel, string>,
			);
		} else {
			this.prefix = options.prefix || {};
		}
	}

	/**
	 * Get the singleton instance of the logger
	 */
	public static getInstance(options?: LoggerOptions): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(options);
		}
		return Logger.instance;
	}

	/**
	 * Reset the logger instance (useful for testing)
	 */
	public static resetInstance(): void {
		Logger.instance = null;
	}

	private getTimestamp(): string {
		const seconds = (Date.now() - this.startTime) / 1000;
		return seconds.toFixed(3);
	}

	private getISOTimestamp(): string {
		return new Date().toISOString();
	}

	private serializeError(error: Error): Record<string, unknown> {
		const serialized: Record<string, unknown> = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};

		// Include any custom properties
		for (const key of Object.getOwnPropertyNames(error)) {
			if (!['name', 'message', 'stack'].includes(key)) {
				serialized[key] = (error as unknown as Record<string, unknown>)[key];
			}
		}

		return serialized;
	}

	private createStructuredLog(level: LogLevel, messages: unknown[]): Record<string, unknown> {
		const timestamp = this.getISOTimestamp();
		const errors: Error[] = [];
		const nonErrorMessages: unknown[] = [];

		// Separate errors from other messages
		for (const msg of messages) {
			if (msg instanceof Error) {
				errors.push(msg);
			} else {
				nonErrorMessages.push(msg);
			}
		}

		const logEntry: Record<string, unknown> = {
			timestamp,
			level: level.toUpperCase(),
			message: nonErrorMessages.length > 0 ? this.formatMessages(...nonErrorMessages) : "",
			...(this.serviceName && { service: this.serviceName }),
			...(this.correlationId && { correlationId: this.correlationId }),
			...this.context,
		};

		// Add errors as structured data
		if (errors.length > 0) {
			logEntry.errors = errors.map(error => this.serializeError(error));
		}

		// Add grouping information
		if (this.groupLevel > 0) {
			logEntry.group = this.groupLevel;
		}

		return logEntry;
	}

	private formatMessages(...messages: unknown[]): string {
		return messages
			.map((msg) => {
				if (msg instanceof Error) {
					return ""; // Skip error objects as they'll be handled separately
				}
				if (typeof msg === "object") {
					return inspectObject(msg);
				}
				return String(msg);
			})
			.filter(Boolean) // Remove empty strings from skipped errors
			.join(" ");
	}

	private getPrefix(level: LogLevel): string {
		return this.prefix[level] ? `${this.prefix[level]} ` : "";
	}

	private shouldLog(level: LogLevel): boolean {
		// Group and GroupCollapsed are special cases that should always be logged
		if (level === LogLevels.GROUP || level === LogLevels.GROUP_COLLAPSED) {
			return true;
		}

		const currentLevelPriority =
			LogLevelPriority[level.toUpperCase() as keyof typeof LogLevelPriority] ??
			-1;
		const minLevelPriority =
			LogLevelPriority[
				this.minLogLevel.toUpperCase() as keyof typeof LogLevelPriority
			] ?? -1;

		return currentLevelPriority >= minLevelPriority;
	}

	private log(level: LogLevel, ...messages: unknown[]): void {
		if (!this.shouldLog(level)) {
			return;
		}

		// Handle structured logging
		if (this.structured || this.platform === "ecs") {
			const structuredLog = this.createStructuredLog(level, messages);
			console.log(JSON.stringify(structuredLog));
			return;
		}

		const timestamp = this.timeStampEnabled ? `[${this.getTimestamp()}s]` : "";
		const prefix = this.getPrefix(level);
		const indent = "  ".repeat(this.groupLevel);

		switch (this.platform) {
			case "web": {
				// Web platform uses CSS styling
				if (level === "error" && messages.some((msg) => msg instanceof Error)) {
					const nonErrorMessages = messages.filter(
						(msg) => !(msg instanceof Error),
					);
					const errors = messages.filter((msg) => msg instanceof Error);

					// Log non-error messages with styling
					if (nonErrorMessages.length > 0) {
						console.log(
							`%c${indent}${prefix}${this.formatMessages(...nonErrorMessages)}`,
							this.styles.web[level],
						);
					}

					// Log errors with native formatting
					for (const error of errors) {
						console.error(error);
					}
				} else {
					console.log(
						`%c${indent}${prefix}${this.formatMessages(...messages)}`,
						this.styles.web[level],
					);
				}
				break;
			}

			case "console": {
				// Console platform uses ANSI colors
				if (level === "error" && messages.some((msg) => msg instanceof Error)) {
					const nonErrorMessages = messages.filter(
						(msg) => !(msg instanceof Error),
					);
					const errors = messages.filter((msg) => msg instanceof Error);

					// Log non-error messages with ANSI colors
					if (nonErrorMessages.length > 0) {
						console.log(
							`${timestamp ? `\x1b[34m${timestamp}\x1b[0m ` : ""}${this.styles.console[level]} ${indent}${prefix}${this.formatMessages(...nonErrorMessages)}`,
						);
					}

					// Log errors with native formatting but keep our prefix
					for (const error of errors) {
						const errorPrefix = `${timestamp ? `\x1b[34m${timestamp}\x1b[0m ` : ""}${this.styles.console[level]} ${indent}${prefix}`;
						console.error(errorPrefix, error);
					}
				} else {
					// Add a space after the level symbol for better readability
					console.log(
						`${timestamp ? `\x1b[34m${timestamp}\x1b[0m ` : ""}${this.styles.console[level]} ${indent}${prefix}${this.formatMessages(...messages)}`,
					);
				}
				break;
			}

			case "lambda": {
				// Lambda platform uses simple text prefixes
				if (level === "error" && messages.some((msg) => msg instanceof Error)) {
					const nonErrorMessages = messages.filter(
						(msg) => !(msg instanceof Error),
					);
					const errors = messages.filter((msg) => msg instanceof Error);

					// Log non-error messages
					if (nonErrorMessages.length > 0) {
						console.log(
							`${timestamp} ${this.styles.lambda[level]} ${indent}${prefix}${this.formatMessages(...nonErrorMessages)}`,
						);
					}

					// Log errors with native formatting but keep our prefix
					for (const error of errors) {
						const errorPrefix = `${timestamp} ${this.styles.lambda[level]} ${indent}${prefix}`;
						console.error(errorPrefix);
						console.error(error);
					}
				} else {
					console.log(
						`${timestamp} ${this.styles.lambda[level]} ${indent}${prefix}${this.formatMessages(...messages)}`,
					);
				}
				break;
			}
		}
	}

	public debug(...messages: unknown[]): void {
		this.log("debug", ...messages);
	}

	public info(...messages: unknown[]): void {
		this.log("info", ...messages);
	}

	public warn(...messages: unknown[]): void {
		this.log("warn", ...messages);
	}

	public error(...messages: unknown[]): void {
		this.log("error", ...messages);
	}

	public success(...messages: unknown[]): void {
		this.log("success", ...messages);
	}

	public group(...messages: unknown[]): void {
		this.log("group", ...messages);
		this.groupLevel++;
	}

	public groupCollapsed(...messages: unknown[]): void {
		this.log("groupCollapsed", ...messages);
		this.groupLevel++;
	}

	public groupEnd(): void {
		if (this.groupLevel > 0) {
			this.groupLevel--;
		}
	}

	public setPrefix(
		newPrefix: string | Partial<Record<LogLevel, string>>,
	): void {
		if (typeof newPrefix === "string") {
			const prefixValue = newPrefix;
			const newPrefixObj = Object.values(LogLevels).reduce(
				(acc, level) => {
					acc[level] = prefixValue;
					return acc;
				},
				{} as Record<LogLevel, string>,
			);
			Object.assign(this.prefix, newPrefixObj);
		} else {
			Object.assign(this.prefix, newPrefix);
		}
	}

	public setMinLogLevel(level: LogLevel): void {
		this.minLogLevel = level;
	}

	public getMinLogLevel(): LogLevel {
		return this.minLogLevel;
	}

	public setCorrelationId(correlationId: string): void {
		this.correlationId = correlationId;
	}

	public getCorrelationId(): string | undefined {
		return this.correlationId;
	}

	public setContext(context: Record<string, unknown>): void {
		this.context = { ...context };
	}

	public addContext(key: string, value: unknown): void {
		this.context[key] = value;
	}

	public removeContext(key: string): void {
		delete this.context[key];
	}

	public getContext(): Record<string, unknown> {
		return { ...this.context };
	}

	public clearContext(): void {
		this.context = {};
	}

	public time(label: string): void {
		this.timers.set(label, Date.now());
	}

	public timeEnd(label: string): void {
		const startTime = this.timers.get(label);
		if (startTime) {
			const duration = Date.now() - startTime;
			this.timers.delete(label);
			this.info(`${label}: ${duration}ms`);
		} else {
			this.warn(`Timer '${label}' does not exist`);
		}
	}

	public timeLog(label: string, ...messages: unknown[]): void {
		const startTime = this.timers.get(label);
		if (startTime) {
			const duration = Date.now() - startTime;
			this.info(`${label}: ${duration}ms`, ...messages);
		} else {
			this.warn(`Timer '${label}' does not exist`);
		}
	}
}

export const createLogger = (options?: LoggerOptions): Logger => {
	return Logger.getInstance(options);
};

export const logger = new Proxy({} as Logger, {
	get(target, prop) {
		const instance = Logger.getInstance();
		return instance[prop as keyof Logger];
	},
});

export { Logger };
