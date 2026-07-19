#!/usr/bin/env node
// Regenerates every machine-readable discovery asset that has to stay in sync
// with the repo, then hands off to the sitemap generator. Wired as `prebuild`,
// so the server's `npm run build` refreshes them on every deploy.
//
// Produced here:
//   public/.well-known/agent-skills/index.json  — skills index with sha256 digests
//                                                 (Agent Skills Discovery RFC v0.2.0)
//   public/sitemap.xml                          — via generate-sitemap.mjs
//
// Hand-maintained (not generated, so they are reviewable in diffs):
//   public/robots.txt, public/auth.md,
//   public/.well-known/api-catalog, public/.well-known/oauth-protected-resource

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_ORIGIN } from './public-routes.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = resolve(projectRoot, 'public/.well-known/agent-skills');

/** Pull `name:` / `description:` out of a SKILL.md YAML front-matter block. */
function parseFrontMatter(markdown) {
    const match = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    return Object.fromEntries(
        match[1]
            .split('\n')
            .map((line) => line.match(/^([A-Za-z_-]+):\s*(.*)$/))
            .filter(Boolean)
            .map(([, key, value]) => [key, value.trim().replace(/^["']|["']$/g, '')]),
    );
}

const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
        const file = join(skillsDir, entry.name, 'SKILL.md');
        const body = readFileSync(file);
        const { name, description } = parseFrontMatter(body.toString('utf8'));
        return {
            name: name || entry.name,
            type: 'skill',
            description: description || '',
            url: `${SITE_ORIGIN}/.well-known/agent-skills/${entry.name}/SKILL.md`,
            // Digest of the exact bytes served, so a client can verify the
            // fetched skill has not been tampered with in transit.
            sha256: createHash('sha256').update(body).digest('hex'),
        };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

const index = {
    $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
    version: '0.2.0',
    name: 'testup.az',
    description:
        'Skills for interacting with testup.az, an online exam platform for teachers and students.',
    skills,
};

writeFileSync(join(skillsDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`agent-skills/index.json: ${skills.length} skills`);

execFileSync('node', [resolve(projectRoot, 'scripts/generate-sitemap.mjs')], {
    cwd: projectRoot,
    stdio: 'inherit',
});
