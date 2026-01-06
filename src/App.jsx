import React, { useState, useEffect } from 'react';
import { Search, GitBranch, Loader2, AlertCircle, FolderGit } from 'lucide-react';
import BranchList from './components/BranchList';

const API_URL = 'http://localhost:3001/api';

function App() {
    const [path, setPath] = useState(localStorage.getItem('repoPath') || '');
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        localStorage.setItem('repoPath', path);
    }, [path]);

    const scanRepo = async (e) => {
        if (e) e.preventDefault();
        if (!path.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to scan repository');

            setBranches(data.branches);
        } catch (err) {
            setError(err.message);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (branchName) => {
        if (!window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, branch: branchName }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete branch');

            // Refresh list
            await scanRepo();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col items-center mb-12 text-center">
                <div className="p-4 rounded-full bg-purple-500/10 mb-4 ring-1 ring-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <FolderGit size={40} className="text-purple-400" />
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-2">
                    Git Branch Manager
                </h1>
                <p className="text-slate-400">Manage, clean, and organize your local branches</p>
            </div>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto mb-12">
                <form onSubmit={scanRepo} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative flex items-center bg-slate-900 rounded-xl p-2 ring-1 ring-white/10 shadow-2xl">
                        <Search className="ml-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="Enter absolute path to repository (e.g. /home/user/project)"
                            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 px-4 py-2 w-full"
                        />
                        <button
                            type="submit"
                            disabled={loading || !path}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Scan'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            <BranchList
                branches={branches}
                onDelete={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}

export default App;
