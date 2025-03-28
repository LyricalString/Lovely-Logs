#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const log = {
  step: (msg: string) => console.log(`${COLORS.blue}➤${COLORS.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${COLORS.green}✔${COLORS.reset} ${msg}`),
  info: (msg: string) =>
    console.log(`${COLORS.magenta}ℹ${COLORS.reset} ${msg}`),
  warn: (msg: string) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
};

const exec = (
  command: string,
  options: { env?: NodeJS.ProcessEnv } = {},
): string => {
  try {
    return execSync(command, {
      stdio: 'pipe',
      ...options,
    })
      .toString()
      .trim();
  } catch (error) {
    console.error(`Failed to execute command: ${command}`);
    console.error(error);
    process.exit(1);
  }
};

const checkWorkingDirectory = () => {
  log.step('Checking working directory...');
  if (exec('git status --porcelain')) {
    log.warn(
      'Working directory is not clean. Please commit or stash changes first.',
    );
    process.exit(1);
  }
  log.success('Working directory is clean');
};

const updateVersion = async () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  log.info(`Current version: ${currentVersion}`);

  const versionType = await question(
    'Enter version type (patch/minor/major): ',
  );

  if (!['patch', 'minor', 'major'].includes(versionType)) {
    log.warn('Invalid version type. Must be patch, minor, or major.');
    process.exit(1);
  }

  // Run npm version which will:
  // 1. Update version in package.json
  // 2. Create a git tag
  // 3. Create a version commit
  exec(`npm version ${versionType}`);

  const newVersion = JSON.parse(readFileSync('package.json', 'utf-8')).version;
  log.success(`Version updated to ${newVersion}`);
};

const runTests = () => {
  log.step('Running tests...');
  exec('bun test');
  log.success('Tests passed');
};

const build = () => {
  log.step('Building package...');
  exec('bun run build');
  log.success('Build completed');
};

const publish = async () => {
  log.step('Publishing to npm...');

  // Check for npm token in environment
  const npmToken = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN;
  if (!npmToken) {
    log.warn(
      'NPM_TOKEN environment variable is not set. Please set it with your npm token.',
    );
    process.exit(1);
  }

  try {
    // Create temporary .npmrc file for publishing
    const npmrcContent = `//registry.npmjs.org/:_authToken=${npmToken}`;
    writeFileSync('.npmrc', npmrcContent);

    try {
      exec('npm publish --access public');
      log.success('Package published to npm');
    } finally {
      // Always clean up the .npmrc file
      if (existsSync('.npmrc')) {
        exec('rm .npmrc');
      }
    }
  } catch (error) {
    log.warn(
      'Failed to publish package. Please check your npm token and permissions.',
    );
    throw error;
  }
};

const pushChanges = () => {
  log.step('Pushing changes and tags...');
  exec('git push --follow-tags');
  log.success('Changes and tags pushed');
};

const main = async () => {
  try {
    // Check if working directory is clean
    checkWorkingDirectory();

    // Pull latest changes
    log.step('Pulling latest changes...');
    exec('git pull origin main');

    // Run the release process
    await updateVersion();
    runTests();
    build();
    await publish();
    pushChanges();

    log.success('Release completed successfully! 🎉');
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();
