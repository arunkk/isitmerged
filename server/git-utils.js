import { simpleGit } from 'simple-git';

async function listBranches(repoPath) {
    const git = simpleGit(repoPath);

    // Validate it's a repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        throw new Error('Invalid git repository path');
    }

    try {
        await git.fetch(['-p']);
    } catch (e) {
        console.warn('Fetch failed', e.message);
    }

    const branchSummary = await git.branchLocal();
    const branches = branchSummary.all;
    const current = branchSummary.current;
    const result = [];
    const masterBranch = branches.includes('main') ? 'main' : 'master';

    for (const branch of branches) {
        if (branch === masterBranch) {
            result.push({
                name: branch,
                current: branch === current,
                status: 'MASTER',
                reason: 'This is the main development branch of the repository.',
                lastCommit: (await git.log([branch, '-n', '1'])).latest
            });
            continue;
        }

        const details = {
            name: branch,
            current: branch === current,
            lastCommit: (await git.log([branch, '-n', '1'])).latest
        };

        const isMerged = await git.raw(['branch', '--merged', masterBranch, branch]);
        if (isMerged.trim() === branch || isMerged.includes(branch)) {
            details.status = 'MERGED';
            details.reason = `Standard Git merge: All commits from this branch are already reachable from ${masterBranch}.`;
        } else {
            const squashResult = await detectSquash(git, branch, masterBranch);
            details.status = squashResult.isSquashed ? 'SQUASHED' : 'OPEN';
            details.reason = squashResult.reason;
        }

        result.push(details);
    }

    return result;
}

async function detectSquash(git, branch, masterBranch) {
    try {
        // Heuristic 1: Look for branch name in master log
        const logBranchName = await git.log([
            masterBranch,
            `--grep=${branch}`,
            '--since="3 months ago"'
        ]);
        if (logBranchName.total > 0) {
            return {
                isSquashed: true,
                reason: `Squashed: Found references to "${branch}" name in ${masterBranch} commit history.`
            };
        }

        const uniqueCommits = await git.log([`${masterBranch}..${branch}`]);

        if (uniqueCommits.total === 0) {
            return {
                isSquashed: true,
                reason: 'Squashed: Branch has no unique commits compared to master (history likely rewritten or already integrated).'
            };
        }

        // Heuristic 2: Look for commit subjects in master log
        for (const commit of uniqueCommits.all) {
            const subject = commit.message.split('\n')[0].trim();
            if (subject.length < 5) continue;

            const found = await git.log([
                masterBranch,
                `--grep=${subject}`,
                '--since="3 months ago"'
            ]);

            if (found.total > 0) {
                return {
                    isSquashed: true,
                    reason: `Squashed: Commit subject "${subject.substring(0, 30)}..." was found in ${masterBranch} history.`
                };
            }
        }

        return {
            isSquashed: false,
            reason: 'Open: This branch has unique commits that have not been found in the master branch history.'
        };
    } catch (error) {
        console.error(`Error detecting squash for ${branch}:`, error);
        return { isSquashed: false, reason: 'Status unknown: Error during squash detection.' };
    }
}

async function deleteBranch(repoPath, branchName) {
    const git = simpleGit(repoPath);

    // Validate it's a repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        throw new Error('Invalid git repository path');
    }

    await git.deleteLocalBranch(branchName, true);
}

export { listBranches, deleteBranch };
