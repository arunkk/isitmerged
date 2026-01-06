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
        } else {
            const isSquashed = await detectSquash(git, branch, masterBranch);
            details.status = isSquashed ? 'SQUASHED' : 'OPEN';
        }

        result.push(details);
    }

    return result;
}

async function detectSquash(git, branch, masterBranch) {
    try {
        const logBranchName = await git.log([
            masterBranch,
            `--grep=${branch}`,
            '--since="3 months ago"'
        ]);
        if (logBranchName.total > 0) return true;

        const uniqueCommits = await git.log([`${masterBranch}..${branch}`]);

        if (uniqueCommits.total === 0) return true;

        for (const commit of uniqueCommits.all) {
            const subject = commit.message.split('\n')[0].trim();
            if (subject.length < 5) continue;

            const found = await git.log([
                masterBranch,
                `--grep=${subject}`,
                '--since="3 months ago"'
            ]);

            if (found.total > 0) return true;
        }

        return false;
    } catch (error) {
        console.error(`Error detecting squash for ${branch}:`, error);
        return false;
    }
}

async function deleteBranch(repoPath, branchName) {
    const git = simpleGit(repoPath);
    await git.deleteLocalBranch(branchName, true);
}

export { listBranches, deleteBranch };
