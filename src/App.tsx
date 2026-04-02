import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, FileSignature, 
  Receipt, CreditCard, Key, History, LogOut, Menu, X, 
  ChevronRight, Plus, Download, Search, Filter, AlertCircle,
  TrendingUp, Banknote, Briefcase, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import arabicReshaper from "arabic-reshaper";
import Bidi from "bidi-js";
import { api } from "./lib/api";

const bidi = new Bidi();

const formatArabic = (text: string | undefined) => {
  if (!text) return "";
  try {
    const reshaped = arabicReshaper.reshape(text);
    // bidi-js getDisplay(text, direction) - "rtl" for Arabic
    return bidi.getDisplay(reshaped, "rtl");
  } catch (e) {
    return text;
  }
};

// --- Context ---
const AuthContext = createContext<any>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const login = (userData: any, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, notification, notify }}>
      {children}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <FileSignature size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold tracking-tight font-arabic">{formatArabic(notification.message)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- Components ---
const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
    { icon: Users, label: "العملاء", path: "/clients" },
    { icon: Package, label: "المنتجات", path: "/products" },
    { icon: FileText, label: "عروض الأسعار", path: "/quotations" },
    { icon: FileSignature, label: "العقود", path: "/contracts" },
    { icon: CreditCard, label: "المدفوعات", path: "/payments" },
    { icon: Key, label: "التراخيص", path: "/licenses" },
    ...(user?.role === "مدير" ? [{ icon: History, label: "سجل العمليات", path: "/audit-logs" }] : []),
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggle}
      />
      
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 bottom-0 w-64 bg-[#151619] text-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-black">CL</div>
            <span className="text-xl font-bold tracking-tight">CodeLink</span>
          </div>
          <button onClick={toggle} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-arabic ${location.pathname === item.path ? "bg-orange-500 text-black font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              onClick={() => window.innerWidth < 1024 && toggle()}
            >
              <item.icon size={20} />
              <span>{formatArabic(item.label)}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#151619]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-orange-500 font-bold">
              {user?.fullName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate font-arabic">{formatArabic(user?.fullName)}</p>
              <p className="text-xs text-white/40 truncate font-arabic">{formatArabic(user?.role)}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors font-arabic"
          >
            <LogOut size={20} />
            <span>{formatArabic("تسجيل الخروج")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const location = useLocation();
  const getPageTitle = () => {
    switch(location.pathname) {
      case "/": return formatArabic("لوحة التحكم");
      case "/clients": return formatArabic("العملاء");
      case "/products": return formatArabic("المنتجات");
      case "/quotations": return formatArabic("عروض الأسعار");
      case "/contracts": return formatArabic("العقود");
      case "/payments": return formatArabic("المدفوعات");
      case "/licenses": return formatArabic("التراخيص");
      case "/audit-logs": return formatArabic("سجل العمليات");
      default: return "CodeLink";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 font-arabic">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic mb-0.5">{formatArabic("اليوم")}</p>
          <p className="text-xs text-gray-500 font-arabic">{format(new Date(), "EEEE, d MMMM")}</p>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:mr-64" : "mr-0"}`}>
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// --- Pages ---

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      login(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151619] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center font-bold text-3xl text-black mx-auto mb-4 shadow-lg shadow-orange-500/20">CL</div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-sans">CodeLink</h1>
          <p className="text-white/40 mt-2 italic font-arabic">نظام إدارة مبيعات البرمجيات</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-arabic">اسم المستخدم</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-right font-arabic"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-arabic">كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-right font-arabic"
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-arabic">
                <AlertCircle size={16} />
                <span>{formatArabic(error)}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#151619] text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 font-arabic"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-arabic">© 2026 CodeLink Software. {formatArabic("جميع الحقوق محفوظة.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200" />)}
    </div>
    <div className="h-96 bg-white rounded-2xl border border-gray-200" />
  </div>;

  const cards = [
    { label: "إجمالي الإيرادات", value: `${stats.totalRevenue.toLocaleString()} ج.م`, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
    { label: "العقود النشطة", value: stats.activeContracts, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "حسابات مستحقة", value: `${stats.outstandingBalance.toLocaleString()} ج.م`, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "النمو الشهري", value: "+12.5%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900 font-arabic">نظرة عامة على الإيرادات</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold bg-gray-100 rounded-full font-arabic">12 شهر</button>
            </div>
          </div>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={stats.monthlyIncome.reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 font-arabic mb-8">إجراءات سريعة</h2>
          <div className="space-y-4">
            <Link to="/quotations" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-orange-500">
                  <Plus size={20} />
                </div>
                <span className="font-bold text-gray-700 font-arabic">عرض سعر جديد</span>
              </div>
              <ChevronRight size={16} className="text-gray-400 rotate-180" />
            </Link>
            <Link to="/clients" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-orange-500">
                  <Users size={20} />
                </div>
                <span className="font-bold text-gray-700 font-arabic">إضافة عميل</span>
              </div>
              <ChevronRight size={16} className="text-gray-400 rotate-180" />
            </Link>
            <Link to="/payments" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-orange-500">
                  <CreditCard size={20} />
                </div>
                <span className="font-bold text-gray-700 font-arabic">تسجيل دفعة</span>
              </div>
              <ChevronRight size={16} className="text-gray-400 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Clients = () => {
  const { notify } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ company_name: "", contact_person: "", phone: "", email: "", address: "", status: "active" });

  const fetchClients = () => {
    setLoading(true);
    api.getClients().then(setClients).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClient(formData);
      setShowModal(false);
      setFormData({ company_name: "", contact_person: "", phone: "", email: "", address: "", status: "active" });
      fetchClients();
      notify("تم إضافة العميل بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="البحث عن العملاء..." 
            className="w-full pr-10 pl-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-right"
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#151619] text-white rounded-xl hover:bg-black transition-all font-medium"
        >
          <Plus size={20} />
          <span className="font-arabic">إضافة عميل</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الشركة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المسؤول</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">معلومات التواصل</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الحالة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-gray-50/50"></td></tr>)
            ) : clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 font-arabic">{formatArabic(client.company_name)}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[200px] font-arabic">{formatArabic(client.address)}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-arabic">{formatArabic(client.contact_person)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{client.email}</div>
                  <div className="text-xs text-gray-500">{client.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-arabic ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 
                    client.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                  }`}>
                    {client.status === 'active' ? 'نشط' : client.status === 'inactive' ? 'غير نشط' : client.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <button className="text-gray-400 hover:text-orange-500 transition-colors">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-arabic">إضافة عميل جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">اسم الشركة</label>
                  <input 
                    type="text" required
                    value={formData.company_name}
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">الشخص المسؤول</label>
                  <input 
                    type="text" required
                    value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">الهاتف</label>
                  <input 
                    type="text" required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">البريد الإلكتروني</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">العنوان</label>
                  <textarea 
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 text-right"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-all font-arabic">حفظ العميل</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/*" element={<ProtectedRoute><AppRoutes /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const LoginWrapper = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : <LoginPage />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const Products = () => {
  const { notify } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "web", price: "", license_type: "subscription" });

  const fetchProducts = () => {
    setLoading(true);
    api.getProducts().then(setProducts).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({ ...formData, price: parseFloat(formData.price) });
      setShowModal(false);
      setFormData({ name: "", type: "web", price: "", license_type: "subscription" });
      fetchProducts();
      notify("تم إضافة المنتج بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">منتجات البرمجيات</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#151619] text-white rounded-xl hover:bg-black transition-all font-bold"
        >
          <Plus size={20} />
          <span>إضافة منتج</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />)
        ) : products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                product.type === 'web' ? 'bg-blue-100 text-blue-700' : 
                product.type === 'desktop' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {product.type === 'web' ? 'ويب' : product.type === 'desktop' ? 'ديسك توب' : 'موبايل'}
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1 font-arabic">{formatArabic(product.name)}</h3>
              <p className="text-sm text-gray-500 font-arabic">{product.license_type === 'lifetime' ? 'ترخيص مدى الحياة' : 'نظام اشتراك'}</p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1 font-arabic">السعر</p>
                <p className="text-2xl font-bold text-gray-900">{product.price.toLocaleString()} ج.م</p>
              </div>
              <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-orange-500 transition-colors">
                <ChevronRight size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-arabic">إضافة منتج جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">اسم المنتج</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">النوع</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="web">ويب</option>
                    <option value="desktop">ديسك توب</option>
                    <option value="mobile">موبايل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">نوع الترخيص</label>
                  <select 
                    value={formData.license_type}
                    onChange={e => setFormData({...formData, license_type: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="subscription">اشتراك</option>
                    <option value="lifetime">مدى الحياة</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">السعر الأساسي (ج.م)</label>
                <input 
                  type="number" required step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-all font-arabic">حفظ المنتج</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Quotations = () => {
  const { notify } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    client_id: "", 
    items: [{ product_id: "", price: "" }] 
  });

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: "", price: "" }] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ product_id: "", price: "" }] });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price if product changes
    if (field === 'product_id') {
      const p = products.find(p => p.id === parseInt(value));
      if (p) newItems[index].price = p.price.toString();
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [convertData, setConvertData] = useState({ duration_months: 12, payment_plan: "installments", discount: 0 });

  const fetchData = async () => {
    setLoading(true);
    const [q, c, p] = await Promise.all([api.getQuotations(), api.getClients(), api.getProducts()]);
    setQuotations(q);
    setClients(c);
    setProducts(p);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total_price = calculateTotal(formData.items);
      await api.createQuotation({ 
        client_id: formData.client_id,
        items: formData.items.map(it => ({ ...it, price: parseFloat(it.price) })),
        total_price 
      });
      setShowModal(false);
      setFormData({ client_id: "", items: [{ product_id: "", price: "" }] });
      fetchData();
      notify("تم إنشاء عرض السعر بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContract({
        quotation_id: selectedQuotation.id,
        client_id: selectedQuotation.client_id,
        total_price: selectedQuotation.total_price,
        discount: convertData.discount,
        duration_months: convertData.duration_months,
        payment_plan: convertData.payment_plan,
        items: selectedQuotation.items
      });
      setShowConvertModal(false);
      notify("تم إنشاء العقد بنجاح!");
      fetchData();
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">عروض الأسعار</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#151619] text-white rounded-xl hover:bg-black transition-all font-bold"
        >
          <Plus size={20} />
          <span>عرض سعر جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">العميل</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المنتج</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">إجمالي السعر</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الحالة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left font-arabic">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-gray-50/50"></td></tr>)
            ) : quotations.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900 font-arabic">{formatArabic(q.company_name)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-arabic">
                  {q.items && q.items.length > 0 ? (
                    <div className="space-y-1">
                      {q.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                          <span>{formatArabic(it.product_name)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    formatArabic(q.product_name)
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{q.total_price.toLocaleString()} ج.م</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    q.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                    q.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {q.status === 'pending' ? 'قيد الانتظار' : q.status === 'converted' ? 'تم التحويل' : 'ملغي'}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  {q.status === 'pending' && (
                    <button 
                      onClick={() => { setSelectedQuotation(q); setShowConvertModal(true); }}
                      className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest font-arabic"
                    >
                      تحويل إلى عقد
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-arabic">تحويل إلى عقد</h2>
              <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleConvert} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1 font-arabic">تفاصيل عرض السعر</p>
                <p className="font-bold text-gray-900">{selectedQuotation?.company_name} - {selectedQuotation?.product_name}</p>
                <p className="text-sm text-gray-500 mt-1 font-arabic">السعر الأساسي: {selectedQuotation?.total_price.toLocaleString()} ج.م</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">المدة (أشهر)</label>
                  <input 
                    type="number" required
                    value={convertData.duration_months}
                    onChange={e => setConvertData({...convertData, duration_months: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">نظام الدفع</label>
                  <select 
                    value={convertData.payment_plan}
                    onChange={e => setConvertData({...convertData, payment_plan: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="installments">أقساط</option>
                    <option value="cash">كاش</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">مبلغ الخصم (ج.م)</label>
                <input 
                  type="number" required step="0.01"
                  value={convertData.discount}
                  onChange={e => setConvertData({...convertData, discount: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                />
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-orange-800 font-arabic">قيمة العقد الصافية:</span>
                  <span className="text-lg font-bold text-orange-900">
                    {(selectedQuotation?.total_price - (convertData.discount || 0)).toLocaleString()} ج.م
                  </span>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-all font-arabic">إنشاء العقد</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-arabic">عرض سعر جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">العميل</label>
                <select 
                  required
                  value={formData.client_id}
                  onChange={e => setFormData({...formData, client_id: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">اختر العميل</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase font-arabic">المنتجات</label>
                  <button 
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 font-arabic"
                  >
                    <Plus size={14} />
                    <span>إضافة منتج</span>
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative">
                    {formData.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 left-2 text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 font-arabic">المنتج</label>
                        <select 
                          required
                          value={item.product_id}
                          onChange={e => updateItem(index, 'product_id', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                        >
                          <option value="">اختر المنتج</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 font-arabic">السعر (ج.م)</label>
                        <input 
                          type="number" required step="0.01"
                          value={item.price}
                          onChange={e => updateItem(index, 'price', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-orange-800 font-arabic">إجمالي السعر:</span>
                  <span className="text-lg font-bold text-orange-900">
                    {calculateTotal(formData.items).toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-all font-arabic">إنشاء عرض السعر</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Contracts = () => {
  const { notify } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("تحويل بنكي");

  const fetchContracts = () => {
    setLoading(true);
    api.getContracts().then(setContracts).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPayment({
        contract_id: selectedContract.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod
      });
      setShowPaymentModal(false);
      setPaymentAmount("");
      fetchContracts();
      notify("تم تسجيل الدفعة بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">العقود النشطة</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">العميل</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المنتج</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الإجمالي</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الخصم</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الصافي</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المدفوع</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المتبقي</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الحالة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left font-arabic">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={9} className="px-6 py-8 bg-gray-50/50"></td></tr>)
            ) : contracts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900 font-arabic">{formatArabic(c.company_name)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-arabic">
                  {c.items && c.items.length > 0 ? (
                    <div className="space-y-1">
                      {c.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                          <span>{formatArabic(it.product_name)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    formatArabic(c.product_name)
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{c.total_price.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-sm text-orange-500">{c.discount?.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 font-bold text-gray-900">{(c.total_price - (c.discount || 0)).toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-sm text-green-600">{c.paid_amount.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-sm text-red-500 font-bold">{(c.total_price - (c.discount || 0) - c.paid_amount).toLocaleString()} ج.م</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {c.status === 'completed' ? 'مكتمل' : 'نشط'}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  {c.status !== 'completed' && (
                    <button 
                      onClick={() => { setSelectedContract(c); setPaymentAmount((c.total_price - (c.discount || 0) - c.paid_amount).toString()); setShowPaymentModal(true); }}
                      className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest font-arabic"
                    >
                      تسجيل دفعة
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-arabic">تسجيل دفعة</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1 font-arabic">العقد</p>
                <p className="font-bold text-gray-900">{selectedContract?.company_name} - {selectedContract?.product_name}</p>
                <p className="text-sm text-gray-500 mt-1 font-arabic">المتبقي: {(selectedContract?.total_price - (selectedContract?.discount || 0) - selectedContract?.paid_amount).toLocaleString()} ج.م</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">مبلغ الدفعة (ج.م)</label>
                <input 
                  type="number" required step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 font-arabic">طريقة الدفع</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="كاش">كاش</option>
                  <option value="شيك">شيك</option>
                  <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all font-arabic">تأكيد الدفع</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    api.getPayments().then(setPayments).finally(() => setLoading(false));
  }, []);

  const exportReceipt = async (payment: any) => {
    if (selectedPayment) return; // Prevent multiple simultaneous exports
    
    setSelectedPayment(payment);
    
    try {
      // Wait for fonts to be ready
      await document.fonts.ready;
      
      // Small delay to ensure the hidden component is rendered with the correct data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2, // Higher quality
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            // Force all elements in the cloned document to use standard colors
            // and ensure Arabic text rendering properties are applied.
            // Aggressively strip oklch/oklab and shadows which cause html2canvas to fail.
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el: any) => {
              const style = window.getComputedStyle(el);
              
              // Helper to check for unsupported colors
              const hasUnsupportedColor = (val: string) => val.includes('oklch') || val.includes('oklab') || val.includes('okl');

              // Replace unsupported colors in common properties
              if (hasUnsupportedColor(style.color)) el.style.color = '#151619';
              if (hasUnsupportedColor(style.backgroundColor)) el.style.backgroundColor = 'transparent';
              if (hasUnsupportedColor(style.borderColor)) el.style.borderColor = '#e5e7eb';
              if (hasUnsupportedColor(style.outlineColor)) el.style.outlineColor = '#e5e7eb';
              
              // Force remove all shadows as they are a common source of oklch/oklab in TW4
              // and often cause html2canvas to crash or throw parsing errors.
              el.style.boxShadow = 'none';
              el.style.textShadow = 'none';
              el.style.filter = 'none';
              
              // Special case for the dark amount section
              if (el.classList.contains('bg-[#151619]')) {
                el.style.backgroundColor = '#151619';
                el.style.color = '#ffffff';
              }
              
              // Special case for orange text/bg
              if (el.classList.contains('text-orange-500') || el.classList.contains('text-orange-600')) {
                el.style.color = '#f97316';
              }
              if (el.classList.contains('bg-orange-500')) {
                el.style.backgroundColor = '#f97316';
              }

              // Ensure RTL and text rendering
              if (el.classList.contains('font-arabic') || el.style.fontFamily.includes('Cairo')) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.letterSpacing = '0';
                el.style.wordSpacing = '0';
              }
            });
          }
        });
        
        const link = document.createElement('a');
        link.download = `invoice-${payment.id}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate JPG receipt", err);
    } finally {
      setSelectedPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">سجل المدفوعات</h2>
      </div>

      {/* Hidden Receipt Template for JPG Generation */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={receiptRef}
          className="w-[800px] bg-white p-16 receipt-container"
          style={{ 
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif",
            letterSpacing: '0',
            fontVariantLigatures: 'common-ligatures',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500"></div>

          {/* Header Section */}
          <div className="flex justify-between items-start mb-16 pt-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#151619] rounded-2xl flex items-center justify-center font-bold text-3xl text-orange-500">CL</div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight font-sans leading-none mb-1" style={{ color: '#151619' }}>CodeLink Software</h1>
                  <p className="text-xs font-bold tracking-[0.3em] text-orange-600 uppercase">Premium Tech Solutions</p>
                </div>
              </div>
              <p className="text-sm font-arabic text-gray-500">{formatArabic("حلول برمجية متكاملة لإدارة الأعمال والشركات")}</p>
            </div>
            <div className="text-left">
              <div className="inline-block px-6 py-2 bg-[#151619] rounded-xl mb-3">
                <h2 className="text-xl font-bold font-arabic text-white">{formatArabic("إيصال استلام نقدية")}</h2>
              </div>
              <p className="font-mono text-sm font-bold text-gray-400">REF: RCP-{selectedPayment?.id?.toString().padStart(5, '0')}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-16 mb-16">
            <div className="space-y-6">
              <div className="border-r-4 border-orange-500 pr-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400 font-arabic">{formatArabic("العميل / السيد")}</p>
                <p className="text-2xl font-bold font-arabic leading-tight text-[#151619]">{formatArabic(selectedPayment?.company_name)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400 font-arabic">{formatArabic("البيان")}</p>
                <p className="text-lg font-arabic text-gray-700 leading-relaxed">{formatArabic(`سداد قسط ترخيص: ${selectedPayment?.product_name}`)}</p>
              </div>
            </div>
            <div className="text-left space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400 font-arabic">{formatArabic("تاريخ الإصدار")}</p>
                <p className="text-xl font-bold font-sans text-[#151619]">{selectedPayment && format(new Date(selectedPayment.payment_date), "dd MMMM yyyy")}</p>
                <p className="text-sm font-bold text-orange-600 font-sans">{selectedPayment && format(new Date(selectedPayment.payment_date), "HH:mm:ss")}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400 font-arabic">{formatArabic("طريقة الدفع")}</p>
                <p className="text-lg font-bold font-arabic text-[#151619]">{formatArabic(selectedPayment?.method)}</p>
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-[#151619] rounded-[40px] p-12 mb-16 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/10 rounded-full"></div>
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-orange-500 font-arabic">{formatArabic("المبلغ المدفوع")}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold font-sans text-white">{selectedPayment?.amount.toLocaleString()}</span>
                  <span className="text-2xl font-bold font-arabic text-white/60">{formatArabic("جنيه مصري")}</span>
                </div>
              </div>
              <div className="text-left">
                <div className="w-36 h-36 rounded-full border-8 border-orange-500/20 flex items-center justify-center transform -rotate-12 bg-white/5 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-orange-500 font-bold text-2xl font-arabic leading-none mb-1">{formatArabic("مدفوع")}</p>
                    <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">VERIFIED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-6 text-gray-400 font-arabic">{formatArabic("ملخص الحساب المالي")}</p>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-arabic text-gray-500">{formatArabic("إجمالي قيمة العقد:")}</span>
                    <span className="font-bold text-[#151619]">{selectedPayment?.contract_total.toLocaleString()} ج.م</span>
                  </div>
                  {selectedPayment?.contract_discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-arabic text-gray-500">{formatArabic("إجمالي الخصومات:")}</span>
                      <span className="font-bold text-red-500">-{selectedPayment?.contract_discount.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-4 border-t border-gray-200">
                    <span className="font-arabic font-bold text-[#151619]">{formatArabic("الرصيد المتبقي:")}</span>
                    <span className="font-bold text-2xl text-orange-600">{(selectedPayment?.contract_total - selectedPayment?.contract_discount - selectedPayment?.contract_paid).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end text-left">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-arabic">{formatArabic("توقيع المحاسب المعتمد")}</p>
                <div className="h-20 w-56 border-b-2 border-[#151619]/10 mb-3 relative">
                   {/* Placeholder for signature */}
                   <div className="absolute bottom-2 left-4 font-serif italic text-gray-300 text-2xl opacity-50">CodeLink Accountant</div>
                </div>
                <p className="text-[10px] font-arabic text-gray-400 italic">{formatArabic("يُعتمد هذا الإيصال بختم الشركة الرسمي")}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-24 pt-10 border-t border-gray-100 text-center">
            <p className="text-sm font-arabic text-gray-500 mb-4">
              {formatArabic("شكراً لثقتكم في")} <span className="font-sans font-bold text-[#151619]">CodeLink Software</span>. {formatArabic("نتطلع لخدمتكم دائماً.")}
            </p>
            <div className="flex justify-center gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
              <span className="hover:text-orange-500 transition-colors">WWW.CODELINK.SOFTWARE</span>
              <span className="hover:text-orange-500 transition-colors">SUPPORT@CODELINK.SOFTWARE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">التاريخ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">العميل</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المبلغ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الطريقة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left font-arabic">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-gray-50/50"></td></tr>)
            ) : payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(p.payment_date), "yyyy-MM-dd HH:mm")}</td>
                <td className="px-6 py-4 font-bold text-gray-900 font-arabic" dir="auto">{formatArabic(p.company_name)}</td>
                <td className="px-6 py-4 font-bold text-green-600">{p.amount.toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-arabic" dir="auto">{formatArabic(p.method)}</td>
                <td className="px-6 py-4 text-left">
                  <button 
                    onClick={() => exportReceipt(p)}
                    className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                    title="طباعة الإيصال"
                  >
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Licenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLicenses().then(setLicenses).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">تراخيص البرمجيات</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />)
        ) : licenses.map((l) => (
          <div key={l.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {l.status === 'active' ? 'نشط' : 'منتهي'}
              </span>
            </div>
            <div className="mb-6">
              <div className="text-lg font-bold text-gray-900 mb-1 font-arabic">
                {l.items && l.items.length > 0 ? (
                  <div className="space-y-1">
                    {l.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        <span>{formatArabic(it.product_name)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  formatArabic(l.product_name)
                )}
              </div>
              <p className="text-sm text-gray-500 font-arabic">العميل: {formatArabic(l.company_name)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl mb-4 font-mono text-sm break-all border border-gray-100">
              {l.license_key}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest font-arabic">
              <span>تنتهي في: {l.expiry_date}</span>
              <button className="text-orange-500 hover:text-orange-600">نسخ المفتاح</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-arabic">سجلات تدقيق النظام</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الطابع الزمني</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">المستخدم</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الإجراء</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">الكيان</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest font-arabic">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-gray-50/50"></td></tr>)
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-xs text-gray-400">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.username || "النظام"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    log.action === 'CREATE' ? 'bg-green-100 text-green-700' : 
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.action === 'CREATE' ? 'إنشاء' : log.action === 'UPDATE' ? 'تحديث' : 'حذف'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize font-arabic">
                  {log.entity === 'clients' ? 'العملاء' : 
                   log.entity === 'products' ? 'المنتجات' : 
                   log.entity === 'quotations' ? 'عروض الأسعار' : 
                   log.entity === 'contracts' ? 'العقود' : 
                   log.entity === 'payments' ? 'المدفوعات' : log.entity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 italic">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/products" element={<Products />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
      </Routes>
    </Layout>
  );
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
      <AlertCircle size={40} />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-arabic">{title}</h2>
    <p className="text-gray-500 font-arabic">هذا القسم قيد التطوير حالياً.</p>
  </div>
);
