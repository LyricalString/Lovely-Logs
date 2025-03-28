#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import prompts from 'prompts';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
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
      'Working directory is not clean. Please commit your changes first:\n' +
        'git add .\n' +
        'git commit -m "your changes"\n' +
        'Then run this script again.',
    );
    process.exit(1);
  }
  log.success('Working directory is clean');
};

const checkNpmLogin = () => {
  log.step('Checking npm login status...');
  try {
    const whoami = exec('npm whoami');
    log.success(`Logged in as ${whoami}`);
  } catch (error) {
    log.warn('You are not logged in to npm. Please run:');
    log.info('npm login');
    process.exit(1);
  }
};

const buildPackage = () => {
  log.step('Building package...');
  exec('npm run build');
  log.success('Package built successfully');
};

const updateVersion = async () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  log.info(`Current version: ${currentVersion}`);

  const { versionType } = await prompts({
    type: 'select',
    name: 'versionType',
    message: 'Select version type:',
    choices: [
      {
        title: 'patch - Bug fixes and minor changes (0.0.X)',
        value: 'patch',
        description: 'For bug fixes and minor changes',
      },
      {
        title: 'minor - New features, backward compatible (0.X.0)',
        value: 'minor',
        description: 'For new features that are backward compatible',
      },
      {
        title: 'major - Breaking changes (X.0.0)',
        value: 'major',
        description: 'For breaking changes',
      },
    ],
    initial: 0,
  });

  if (!versionType) {
    log.warn('Version selection cancelled');
    process.exit(0);
  }

  // Run npm version which will:
  // 1. Update version in package.json
  // 2. Create a git tag
  // 3. Create a version commit
  exec(`npm version ${versionType}`);

  const newVersion = JSON.parse(readFileSync('package.json', 'utf-8')).version;
  log.success(`Version updated to ${newVersion}`);
  return newVersion;
};

const publishPackage = () => {
  log.step('Publishing package to npm...');
  exec('npm publish');
  log.success('Package published successfully');
};

const pushChanges = (version: string) => {
  log.step('Pushing all changes and tags...');

  // Push all unpushed commits and tags
  exec('git push --follow-tags');

  log.success(`Changes and tag v${version} pushed to remote`);
};

const main = async () => {
  try {
    // Check if working directory is clean
    checkWorkingDirectory();

    // Check if logged in to npm
    checkNpmLogin();

    // Pull latest changes to ensure we're up to date
    log.step('Pulling latest changes...');
    exec('git pull origin main');

    // Build the package
    buildPackage();

    // Update version and get the new version number
    const newVersion = await updateVersion();

    // Publish to npm
    publishPackage();

    // Push all changes and tags
    pushChanges(newVersion);

    log.success('Release completed successfully! 🎉');
    log.info(`Package published as lovely-logs@${newVersion}`);
    log.info('You can view it at: https://www.npmjs.com/package/lovely-logs');
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  }
};

main();
