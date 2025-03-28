#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

interface Option {
  value: string;
  label: string;
  description: string;
}

const selectOption = async (
  message: string,
  options: Option[],
): Promise<string> => {
  return new Promise((resolve) => {
    let selectedIndex = 0;

    // Hide the cursor
    process.stdout.write('\x1B[?25l');

    const renderOptions = () => {
      // Clear previous render
      if (selectedIndex < options.length) {
        process.stdout.write(`\x1B[${options.length}A`);
      }

      // Show message
      console.log(`${COLORS.blue}?${COLORS.reset} ${message}\n`);

      // Render options
      options.forEach((opt, i) => {
        const isSelected = i === selectedIndex;
        const prefix = isSelected ? '❯' : ' ';
        const label = isSelected
          ? `${COLORS.cyan}${opt.label}${COLORS.reset}`
          : opt.label;
        const description = isSelected
          ? `${COLORS.gray}${opt.description}${COLORS.reset}`
          : `${COLORS.gray}${opt.description}${COLORS.reset}`;
        console.log(`  ${prefix} ${label} - ${description}`);
      });
    };

    renderOptions();

    // Handle keypress
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (key) => {
      const keyStr = String(key);

      if (keyStr === '\u001B[A' && selectedIndex > 0) {
        // Up arrow
        selectedIndex--;
        renderOptions();
      } else if (keyStr === '\u001B[B' && selectedIndex < options.length - 1) {
        // Down arrow
        selectedIndex++;
        renderOptions();
      } else if (keyStr === '\r') {
        // Enter key
        process.stdin.setRawMode(false);
        process.stdin.pause();
        // Show cursor again
        process.stdout.write('\x1B[?25h');
        // Move cursor to end
        process.stdout.write('\n');
        resolve(options[selectedIndex].value);
      } else if (keyStr === '\u0003') {
        // Ctrl+C
        process.stdout.write('\x1B[?25h');
        process.exit(0);
      }
    });
  });
};

const updateVersion = async () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  log.info(`Current version: ${currentVersion}`);

  const versionOptions: Option[] = [
    {
      value: 'patch',
      label: 'patch',
      description: 'Bug fixes and minor changes (0.0.X)',
    },
    {
      value: 'minor',
      label: 'minor',
      description: 'New features, backward compatible (0.X.0)',
    },
    {
      value: 'major',
      label: 'major',
      description: 'Breaking changes (X.0.0)',
    },
  ];

  const versionType = await selectOption(
    'Select version type:',
    versionOptions,
  );

  // Run npm version which will:
  // 1. Update version in package.json
  // 2. Create a git tag
  // 3. Create a version commit
  exec(`npm version ${versionType}`);

  const newVersion = JSON.parse(readFileSync('package.json', 'utf-8')).version;
  log.success(`Version updated to ${newVersion}`);
  return newVersion;
};

const pushChanges = (version: string) => {
  log.step('Pushing all changes and tags...');

  // Push all unpushed commits and tags
  exec('git push --follow-tags');

  log.success(`Changes and tag v${version} pushed to remote`);
  log.info('GitHub Actions will now:');
  log.info('1. Run tests');
  log.info('2. Build the package');
  log.info('3. Publish to npm if all checks pass');
  log.info('\nYou can check the progress at:');
  const repoUrl = exec('git config --get remote.origin.url')
    .replace('git@github.com:', 'https://github.com/')
    .replace('.git', '');
  log.info(`${repoUrl}/actions`);
};

const main = async () => {
  try {
    // Check if working directory is clean
    checkWorkingDirectory();

    // Pull latest changes to ensure we're up to date
    log.step('Pulling latest changes...');
    exec('git pull origin main');

    // Update version and get the new version number
    const newVersion = await updateVersion();

    // Push all changes and tags
    pushChanges(newVersion);

    log.success('Release preparation completed successfully! 🎉');
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();
