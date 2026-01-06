import express from 'express';
import cors from 'cors';
import { listBranches, deleteBranch } from './git-utils.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/scan', async (req, res) => {
    const { path: repoPath } = req.body;

    if (!repoPath) {
        return res.status(400).json({ error: 'Repository path is required' });
    }

    try {
        console.log(`Scanning repository: ${repoPath}`);
        const branches = await listBranches(repoPath);
        res.json({ branches });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/delete', async (req, res) => {
    const { path: repoPath, branch } = req.body;

    if (!repoPath || !branch) {
        return res.status(400).json({ error: 'Repository path and branch name are required' });
    }

    try {
        console.log(`Deleting branch ${branch} in ${repoPath}`);
        await deleteBranch(repoPath, branch);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
