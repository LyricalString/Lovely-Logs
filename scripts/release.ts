#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
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

const exec = (command: string): string => {
  try {
    return execSync(command, { stdio: 'pipe' }).toString().trim();
  } catch (error) {
    console.error(`Failed to execute command: ${command}`);
    console.error(error);
    process.exit(1);
  }
};

const updateVersion = async () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  log.info(`Current version: ${currentVersion}`);

  const versionType = await question(
    'Enter version type (patch/minor/major) or specific version: ',
  );

  if (['patch', 'minor', 'major'].includes(versionType)) {
    exec(`npm version ${versionType} --no-git-tag-version`);
  } else {
    exec(`npm version ${versionType} --no-git-tag-version`);
  }

  log.step('Formatting code...');
  exec('bunx @biomejs/biome format --write .');
  exec('bunx @biomejs/biome check --apply .');

  exec('git add .');
  exec(`git commit -m "chore: release version ${packageJson.version}"`);

  log.success('Version updated and changes committed');
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

const updateChangelog = async () => {
  log.step('Updating CHANGELOG.md...');

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const version = packageJson.version;
  const date = new Date().toISOString().split('T')[0];

  const changes = await question(
    'Enter changelog entry (or press enter to skip): ',
  );

  if (changes) {
    const existingChangelog = readFileSync('CHANGELOG.md', 'utf-8') || '';
    const changelog = `# ${version} (${date})\n\n${changes}\n\n${existingChangelog}`;

    writeFileSync('CHANGELOG.md', changelog);
    exec('git add CHANGELOG.md');
    log.success('Changelog updated');
  } else {
    log.warn('Skipping changelog update');
  }
};

const publish = async () => {
  log.step('Publishing to npm...');

  const publishType = await question(
    'Enter publish tag (latest/beta/alpha) or press enter for latest: ',
  );

  if (publishType && publishType !== 'latest') {
    exec(`bun publish --tag ${publishType}`);
  } else {
    exec('bun publish');
  }

  log.success('Package published');
};

const createGitTag = () => {
  log.step('Creating git tag...');
  const version = JSON.parse(readFileSync('package.json', 'utf-8')).version;
  exec(`git tag -a v${version} -m "Release ${version}"`);
  exec('git push --tags');
  log.success('Git tag created and pushed');
};

const main = async () => {
  try {
    // Check if working directory is clean
    if (exec('git status --porcelain')) {
      log.warn(
        'Working directory is not clean. Please commit or stash changes first.',
      );
      process.exit(1);
    }

    // Pull latest changes
    log.step('Pulling latest changes...');
    exec('git pull origin main');

    await updateVersion();
    runTests();
    build();
    await updateChangelog();
    await publish();
    createGitTag();

    log.success('Release completed successfully! 🎉');
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();
