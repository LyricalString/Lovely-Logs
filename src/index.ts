/// <reference types="node" />

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
export type Platform = "web" | "console" | "lambda";

export interface LoggerOptions {
	platform?: Platform;
	timestampEnabled?: boolean;
	customStyles?: Partial<typeof defaultStyles>;
	prefix?: string | Partial<Record<LogLevel, string>>;
	minLogLevel?: LogLevel;
}

const defaultStyles = {
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
};

const detectPlatform = (): Platform => {
	if (typeof window !== "undefined" && window.document) {
		return "web";
	}

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
	private groupLevel = 0;
	private minLogLevel: LogLevel;

	private constructor(options: LoggerOptions = {}) {
		this.platform = options.platform ?? detectPlatform();
		this.timeStampEnabled = options.timestampEnabled ?? true;
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

	private formatMessages(...messages: unknown[]): string {
		return messages
			.map((msg) =>
				typeof msg === "object" ? JSON.stringify(msg, null, 2) : String(msg),
			)
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

		const timestamp = this.timeStampEnabled ? `[${this.getTimestamp()}s]` : "";
		const formattedMessages = this.formatMessages(...messages);
		const prefix = this.getPrefix(level);
		const indent = "  ".repeat(this.groupLevel);

		switch (this.platform) {
			case "web":
				console.log(
					`%c${this.styles.web[level]}%c${timestamp}`,
					this.styles.web[level],
					this.styles.web.time,
					`${indent}${prefix}${formattedMessages}`,
				);
				break;

			case "console":
				console.log(
					`${timestamp ? `\x1b[34m${timestamp}\x1b[0m` : ""} ${this.styles.console[level]} ${indent}${prefix}${formattedMessages}`,
				);
				break;

			case "lambda":
				console.log(
					`${timestamp} ${this.styles.lambda[level]} ${indent}${prefix}${formattedMessages}`,
				);
				break;
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

export type { Logger };
