import React from 'react';
import { GitBranch, GitMerge, CheckCircle, Trash2, Shield, Clock, User } from 'lucide-react';

const StatusBadge = ({ status, reason }) => {
    const styles = {
        MASTER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        MERGED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        SQUASHED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };

    const icons = {
        MASTER: <Shield size={14} className="mr-1" />,
        MERGED: <CheckCircle size={14} className="mr-1" />,
        SQUASHED: <GitMerge size={14} className="mr-1" />,
        OPEN: <GitBranch size={14} className="mr-1" />
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.OPEN}`}
            title={reason}
        >
            {icons[status]}
            {status}
        </span>
    );
};

const BranchList = ({ branches, onDelete, isDeleting }) => {
    if (!branches.length) return null;

    return (
        <div className="glass rounded-xl overflow-hidden mt-8 animation-fade-in-up">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                            <th className="p-4 font-semibold">Branch</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Last Commit</th>
                            <th className="p-4 font-semibold text-right min-w-[200px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {branches.map((branch) => (
                            <tr
                                key={branch.name}
                                className={`group transition-colors hover:bg-white/5 ${branch.current ? 'bg-purple-900/10' : ''}`}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono font-medium ${branch.current ? 'text-purple-400' : 'text-slate-200'}`}>
                                            {branch.name}
                                        </span>
                                        {branch.current && (
                                            <span className="text-[10px] bg-purple-500 text-white px-1.5 rounded">CURRENT</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={branch.status} reason={branch.reason} />
                                </td>
                                <td className="p-4 max-w-[300px]">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-slate-300 truncate" title={branch.lastCommit?.message}>
                                            {branch.lastCommit?.message}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User size={10} /> {branch.lastCommit?.author_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} /> {new Date(branch.lastCommit?.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    {(branch.status === 'MERGED' || branch.status === 'SQUASHED') && branch.status !== 'MASTER' && (
                                        <button
                                            onClick={() => onDelete(branch.name)}
                                            disabled={isDeleting}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                                            title="Delete Branch"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BranchList;
