import { useState, useEffect } from 'react';
import { Search, Download, Building2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BankWorkspace = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBankData = async () => {
            try {
                const res = await fetch('http://localhost:8000/transactions');
                const data = await res.json();
                // In a real app, we'd filter by the bank's branch code from the token
                // For the hackathon prototype, we display the bank's telemetry stream
                setTransactions(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch bank data:", error);
                setLoading(false);
            }
        };
        fetchBankData();
    }, []);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Bank Node Transaction Report", 14, 15);
        autoTable(doc, {
            head: [['Txn ID', 'Account', 'Amount', 'Type', 'Status']],
            body: transactions.map(t => [t.id, t.account_id, `$${t.amount}`, t.type, t.is_flagged ? 'FLAGGED' : 'CLEARED']),
        });
        doc.save('bank-audit-report.pdf');
    };

    const filteredTxns = transactions.filter(t => 
        t.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toString().includes(searchTerm)
    );

    return (
        <div className="pt-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#121212] flex items-center gap-3">
                        <Building2 className="w-10 h-10 text-[#006C67]" />
                        Bank Workspace
                    </h1>
                    <p className="text-[#121212]/60 font-medium mt-1">Institutional Node: <span className="text-[#006C67] font-bold">NODE-772-HDFC</span></p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={exportPDF}
                        className="flex items-center gap-2 px-6 py-3 bg-[#121212] text-white rounded-xl font-bold hover:bg-[#2a2a2a] transition shadow-lg active:scale-95"
                    >
                        <Download className="w-5 h-5" /> Export Audit
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-panel p-6 border-l-4 border-l-[#006C67]">
                    <p className="text-xs font-black text-[#121212]/40 uppercase tracking-widest mb-1">Total Telemetry</p>
                    <h3 className="text-3xl font-black text-[#121212]">{transactions.length}</h3>
                </div>
                <div className="glass-panel p-6 border-l-4 border-l-[#E27C37]">
                    <p className="text-xs font-black text-[#121212]/40 uppercase tracking-widest mb-1">Anomalies Detected</p>
                    <h3 className="text-3xl font-black text-[#E27C37]">{transactions.filter(t => t.is_flagged).length}</h3>
                </div>
                <div className="glass-panel p-6 border-l-4 border-l-[#121212]">
                    <p className="text-xs font-black text-[#121212]/40 uppercase tracking-widest mb-1">Network Stability</p>
                    <h3 className="text-3xl font-black text-[#121212]">99.8%</h3>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-[#121212]/5 flex justify-between items-center bg-white/30">
                    <h2 className="text-xl font-black text-[#121212]">Activity Stream</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#121212]/40" />
                        <input 
                            type="text" 
                            placeholder="Search accounts..."
                            className="w-full pl-10 pr-4 py-2 bg-white/50 border border-[#121212]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006C67]/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#121212]/5 text-[#121212]/60 text-xs font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Account Reference</th>
                                <th className="px-6 py-4">Volume</th>
                                <th className="px-6 py-4">Vector</th>
                                <th className="px-6 py-4 text-right">Security Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#121212]/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#121212]/40 font-bold animate-pulse">Syncing with Node...</td>
                                </tr>
                            ) : filteredTxns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#121212]/40">No telemetry matches found.</td>
                                </tr>
                            ) : (
                                filteredTxns.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-white/40 transition">
                                        <td className="px-6 py-4 font-mono text-xs">{txn.id}</td>
                                        <td className="px-6 py-4 font-bold text-[#121212]">{txn.account_id}</td>
                                        <td className="px-6 py-4 font-black">${txn.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 uppercase text-xs font-bold">{txn.type}</td>
                                        <td className="px-6 py-4 text-right">
                                            {txn.is_flagged ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E27C37]/10 text-[#E27C37] rounded-full text-xs font-black border border-[#E27C37]/30">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> ANOMALY
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#006C67]/10 text-[#006C67] rounded-full text-xs font-black border border-[#006C67]/30">
                                                    SECURE
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BankWorkspace;
