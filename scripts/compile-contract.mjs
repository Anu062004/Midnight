import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const local = '.tools/compact-aarch64-apple-darwin/compact';
const compiler = process.env.COMPACT_BIN || (existsSync(local) ? local : 'compact');
const args = existsSync(local) && compiler === local ? ['--directory', resolve('.tools/toolchain')] : [];
const result = spawnSync(compiler, [...args, 'compile', '+0.31.1', 'contracts/receipts.compact', 'contracts/managed/receipts'], { stdio: 'inherit' });
if (result.error) console.error('Install Compact and run compact update 0.31.1. See docs/MIDNIGHT.md.');
process.exitCode = result.status ?? 1;
