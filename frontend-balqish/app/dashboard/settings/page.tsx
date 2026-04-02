'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { KeyRound, ShieldCheck, User } from 'lucide-react';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.new_password !== formData.new_password_confirmation) {
            alert("Password baru dan konfirmasi tidak cocok!");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/update-password', formData);
            alert(res.data.message || "Password berhasil diubah!");
            setFormData({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal mengubah password. Pastikan password lama benar.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="animate-pulse text-slate-400">Memuat profil...</div>;

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
            {/* Header Profile */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-6">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-4 border-white shadow-lg text-4xl font-black">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">{user.name}</h2>
                    <p className="text-slate-500 font-medium mb-2">{user.email}</p>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        {user.role.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Form Ubah Password */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Keamanan Akun</h3>
                        <p className="text-xs text-slate-500">Ubah password secara berkala untuk menjaga keamanan data gudang.</p>
                    </div>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password Saat Ini</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full md:w-1/2 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                            value={formData.current_password}
                            onChange={e => setFormData({...formData, current_password: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password Baru (Min. 8 Karakter)</label>
                        <input 
                            type="password" 
                            required 
                            minLength={8}
                            className="w-full md:w-1/2 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                            value={formData.new_password}
                            onChange={e => setFormData({...formData, new_password: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                        <input 
                            type="password" 
                            required 
                            minLength={8}
                            className="w-full md:w-1/2 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                            value={formData.new_password_confirmation}
                            onChange={e => setFormData({...formData, new_password_confirmation: e.target.value})}
                        />
                    </div>
                    
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                        >
                            <KeyRound size={18} />
                            <span>{loading ? 'Memproses...' : 'Perbarui Password'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}