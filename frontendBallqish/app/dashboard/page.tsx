import { DashboardOverview } from '@/components/modules/dashboard/DashboardOverview';

<<<<<<< HEAD
export default function DashboardHome() {
    const [data, setData] = useState<any>(null);

    const loadData = async () => {
        try {
            const dashRes = await api.get('/dashboard');
            setData(dashRes.data.data);
        } catch (error) {
            console.error("Gagal sinkronisasi data dashboard:", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (!data) return (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold animate-pulse">
            Menyinkronkan data dengan Server...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <StatsView stats={data} />
        </div>
    );
}
=======
export default function DashboardPage() {
  return <DashboardOverview />;
}
>>>>>>> 58f3523 (Initial commit: WMS Ballqish fullstack (backend + frontend + features))
