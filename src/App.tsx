import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, FileSignature, 
  Receipt, CreditCard, Key, History, LogOut, Menu, X, 
  ChevronRight, Plus, Download, Search, Filter, AlertCircle,
  TrendingUp, Banknote, Briefcase, Clock, Printer, Calculator, CheckCircle2,
  ShieldCheck, UserPlus, UserCog, Trash2, Edit3, User, Mail, Phone,
  Settings as SettingsIcon
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
const Logo = ({ size = "md", light = false, transparent = false, noShadow = false, className = "" }: { size?: "sm" | "md" | "lg" | "xl" | "2xl", light?: boolean, transparent?: boolean, noShadow?: boolean, className?: string }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs rounded-lg",
    md: "w-10 h-10 text-sm rounded-xl",
    lg: "w-16 h-16 text-xl rounded-2xl",
    xl: "w-20 h-20 text-2xl rounded-2xl",
    "2xl": "w-[500px] h-[500px] text-[200px] rounded-full"
  };

  const iconSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-[150px]"
  };

  const bgClass = transparent ? 'bg-transparent' : light ? 'bg-white border border-gray-200' : 'bg-dark-800';
  const shadowClass = noShadow || transparent ? '' : 'shadow-xl shadow-orange-500/10';

  return (
    <div 
      className={`${sizes[size]} ${bgClass} ${shadowClass} flex items-center justify-center relative overflow-hidden group transition-all duration-500 ${className}`}
      style={noShadow ? { 
        backgroundColor: transparent ? 'transparent' : light ? '#ffffff' : '#151619',
        boxShadow: 'none',
        filter: 'none'
      } : {}}
    >
      <div className={`absolute inset-0 opacity-[0.03] font-mono ${size === '2xl' ? 'text-2xl' : 'text-[8px]'} leading-none select-none pointer-events-none p-2 break-all overflow-hidden`}>
        {"{ } < > / ; ( ) [ ] _ * & ^ % $ # @ ! ? ".repeat(size === '2xl' ? 100 : 20)}
      </div>
      
      <div className="relative flex items-center gap-0.5 z-10">
        <span 
          className={`text-brand-500 font-mono font-bold ${iconSizes[size]} opacity-70 group-hover:opacity-100 transition-opacity`}
          style={noShadow ? { color: '#f97316' } : {}}
        >
          {"<"}
        </span>
        <span 
          className={`${light || transparent ? 'text-dark-800' : 'text-white'} font-display font-black tracking-tighter uppercase`}
          style={noShadow ? { color: light || transparent ? '#151619' : '#ffffff' } : {}}
        >
          CL
        </span>
        <span 
          className={`text-brand-500 font-mono font-bold ${iconSizes[size]} opacity-70 group-hover:opacity-100 transition-opacity`}
          style={noShadow ? { color: '#f97316' } : {}}
        >
          {"/>"}
        </span>
      </div>
      
      {!light && !transparent && !noShadow && <div className="absolute inset-0 border border-white/5 rounded-[inherit] pointer-events-none"></div>}
    </div>
  );
};

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", permission: "dashboard" },
    { icon: Users, label: "العملاء", path: "/clients", permission: "clients" },
    { icon: Package, label: "المنتجات", path: "/products", permission: "products" },
    { icon: FileText, label: "عروض الأسعار", path: "/quotations", permission: "quotations" },
    { icon: FileSignature, label: "العقود", path: "/contracts", permission: "contracts" },
    { icon: CreditCard, label: "المدفوعات", path: "/payments", permission: "payments" },
    { icon: Key, label: "التراخيص", path: "/licenses", permission: "licenses" },
    { icon: History, label: "سجل العمليات", path: "/audit-logs", permission: "audit-logs" },
    { icon: UserCog, label: "إدارة المستخدمين", path: "/users-management", permission: "users" },
    { icon: SettingsIcon, label: "الإعدادات", path: "/settings", permission: "settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.username === "admin" || user?.permissions?.includes(item.permission)
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggle}
      />
      
      {/* Sidebar - Persistent Drawer */}
      <aside className={`fixed top-0 right-0 bottom-0 w-72 bg-dark-800 text-white z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between lg:justify-center">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">CodeLink</span>
          </div>
          <button onClick={toggle} className="lg:hidden text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        <nav className="p-6 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-arabic group relative overflow-hidden ${
                location.pathname === item.path 
                ? "bg-brand-500 text-dark-800 font-bold shadow-lg shadow-brand-500/20" 
                : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => window.innerWidth < 1024 && toggle()}
            >
              <item.icon size={22} className={`${location.pathname === item.path ? "scale-110" : "group-hover:scale-110 transition-transform"}`} />
              <span className="text-[15px]">{formatArabic(item.label)}</span>
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 pointer-events-none"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-dark-800/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3 mb-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-display font-bold text-lg border border-brand-500/20">
              {user?.fullName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate font-arabic text-white">{formatArabic(user?.fullName)}</p>
              <p className="text-[11px] text-white/40 truncate font-arabic uppercase tracking-wider">{formatArabic(user?.role)}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all font-arabic font-bold border border-transparent hover:border-red-400/20"
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
      case "/settings": return formatArabic("الإعدادات");
      default: return "CodeLink";
    }
  };

  return (
    <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-6">
        <button onClick={toggleSidebar} className="p-2 md:p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-300 border border-transparent hover:border-brand-100">
          <Menu size={20} className="md:w-[24px] md:h-[24px]" />
        </button>
        <div className="space-y-0.1 md:space-y-0.5">
          <h1 className="text-lg md:text-2xl font-display font-bold text-gray-900 tracking-tight">{getPageTitle()}</h1>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-400 font-arabic uppercase tracking-wider">
            <span>CodeLink</span>
            <ChevronRight size={10} className="rotate-180" />
            <span className="text-brand-500 font-bold">{getPageTitle()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-left hidden lg:block px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic mb-0.5">{formatArabic("اليوم")}</p>
          <p className="text-xs text-gray-600 font-bold font-sans">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();

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

  const bottomNavItems = [
    { icon: LayoutDashboard, path: "/", label: "الرئيسية" },
    { icon: Users, path: "/clients", label: "العملاء" },
    { icon: FileSignature, path: "/contracts", label: "العقود" },
    { icon: CreditCard, path: "/payments", label: "المدفوعات" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out ${isSidebarOpen ? "lg:mr-72" : "mr-0"}`}>
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 md:p-8 pb-24 md:pb-8 flex-1 max-w-[1600px] mx-auto w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around z-[100] lg:hidden safe-bottom">
        {bottomNavItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === item.path ? "text-brand-500" : "text-gray-400"
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? "scale-110" : ""} />
            <span className="text-[10px] font-bold font-arabic">{formatArabic(item.label)}</span>
          </Link>
        ))}
      </nav>
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
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
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

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[450px] bg-white rounded-3xl border border-gray-100" />
        <div className="h-[450px] bg-white rounded-3xl border border-gray-100" />
      </div>
    </div>
  );

  const cards = [
    { label: "إجمالي الإيرادات", value: `${stats.totalRevenue.toLocaleString()} ج.م`, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "العقود النشطة", value: stats.activeContracts, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "حسابات مستحقة", value: `${stats.outstandingBalance.toLocaleString()} ج.م`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "النمو الشهري", value: "+12.5%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-[2rem] border ${card.border} shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 group cursor-default`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon size={28} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic(card.label)}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">{card.value}</p>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <TrendingUp size={14} />
                <span className="text-[11px] font-bold font-sans">+4.5% vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6 md:mb-10">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("نظرة عامة على الإيرادات")}</h2>
              <p className="text-xs md:text-sm text-gray-400 font-arabic">{formatArabic("تحليل الإيرادات الشهرية للسنة الحالية")}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2 text-[10px] md:text-xs font-bold bg-gray-50 text-gray-600 rounded-full font-arabic border border-gray-100 hover:bg-gray-100 transition-colors">12 شهر</button>
            </div>
          </div>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={stats.monthlyIncome.reverse()}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    textAlign: 'right',
                    padding: '12px 16px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#fff', stroke: '#f97316', strokeWidth: 3 }} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/20 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-6 md:mb-10 tracking-tight">{formatArabic("إجراءات سريعة")}</h2>
            <div className="space-y-4">
              <Link to="/quotations" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-brand-500 hover:text-dark-800 transition-all duration-500 group border border-white/5 hover:border-brand-400">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-dark-800/10 transition-colors">
                    <Plus size={22} />
                  </div>
                  <span className="font-bold text-[15px] font-arabic">{formatArabic("عرض سعر جديد")}</span>
                </div>
                <ChevronRight size={18} className="text-white/30 group-hover:text-dark-800 rotate-180 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link to="/clients" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-brand-500 hover:text-dark-800 transition-all duration-500 group border border-white/5 hover:border-brand-400">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-dark-800/10 transition-colors">
                    <Users size={22} />
                  </div>
                  <span className="font-bold text-[15px] font-arabic">{formatArabic("إضافة عميل")}</span>
                </div>
                <ChevronRight size={18} className="text-white/30 group-hover:text-dark-800 rotate-180 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link to="/payments" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-brand-500 hover:text-dark-800 transition-all duration-500 group border border-white/5 hover:border-brand-400">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-dark-800/10 transition-colors">
                    <CreditCard size={22} />
                  </div>
                  <span className="font-bold text-[15px] font-arabic">{formatArabic("تسجيل دفعة")}</span>
                </div>
                <ChevronRight size={18} className="text-white/30 group-hover:text-dark-800 rotate-180 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
            
            <div className="mt-12 p-6 bg-brand-500/10 rounded-3xl border border-brand-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={20} className="text-brand-500" />
                <span className="text-sm font-bold font-arabic text-brand-500">{formatArabic("تنبيه النظام")}</span>
              </div>
              <p className="text-xs text-white/60 font-arabic leading-relaxed">
                {formatArabic("هناك 3 عقود تنتهي صلاحيتها خلال هذا الأسبوع. يرجى مراجعة قسم العقود لاتخاذ الإجراء اللازم.")}
              </p>
            </div>
          </div>
        </motion.div>
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="البحث عن العملاء..." 
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-arabic">{formatArabic("إضافة عميل جديد")}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("الشركة")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("المسؤول")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("معلومات التواصل")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("الحالة")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic text-left">{formatArabic("الإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-8">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2" />
                      <div className="h-3 bg-gray-50 rounded-full w-1/2" />
                    </td>
                  </tr>
                ))
              ) : clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 font-arabic text-base group-hover:text-brand-600 transition-colors">{formatArabic(client.company_name)}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[250px] font-arabic mt-1">{formatArabic(client.address)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {client.contact_person?.[0]}
                      </div>
                      <span className="text-sm font-bold text-gray-700 font-arabic">{formatArabic(client.contact_person)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-sans font-medium text-gray-900">{client.email}</div>
                    <div className="text-xs font-sans text-gray-400 mt-1">{client.phone}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-arabic ${
                      client.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      client.status === 'inactive' ? 'bg-gray-50 text-gray-500 border border-gray-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {formatArabic(client.status === 'active' ? 'نشط' : client.status === 'inactive' ? 'غير نشط' : client.status)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <button className="p-2 text-gray-300 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all duration-300">
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="p-6 animate-pulse space-y-3">
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                <div className="h-3 bg-gray-50 rounded-full w-3/4" />
              </div>
            ))
          ) : clients.map((client) => (
            <div key={client.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 font-arabic">{formatArabic(client.company_name)}</h4>
                  <p className="text-xs text-gray-400 font-arabic mt-0.5">{formatArabic(client.address)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-arabic ${
                  client.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                }`}>
                  {formatArabic(client.status === 'active' ? 'نشط' : 'غير نشط')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User size={14} className="text-gray-400" />
                  <span className="font-arabic">{formatArabic(client.contact_person)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span className="font-sans">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-sans">{client.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-gray-100 self-end md:self-center"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("إضافة عميل جديد")}</h2>
                  <p className="text-sm text-gray-400 font-arabic">{formatArabic("أدخل بيانات العميل لإضافته إلى النظام")}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("اسم الشركة")}</label>
                    <input 
                      type="text" required
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("الشخص المسؤول")}</label>
                    <input 
                      type="text" required
                      value={formData.contact_person}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("رقم الهاتف")}</label>
                    <input 
                      type="text" required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-sans"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("البريد الإلكتروني")}</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-sans"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("العنوان")}</label>
                    <textarea 
                      required
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 h-28 text-right transition-all font-arabic resize-none"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all font-arabic">{formatArabic("إلغاء")}</button>
                  <button type="submit" className="flex-1 py-4 bg-brand-500 text-dark-800 font-bold rounded-2xl hover:bg-brand-600 transition-all font-arabic shadow-lg shadow-brand-500/20">{formatArabic("حفظ العميل")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("منتجات البرمجيات")}</h2>
          <p className="text-sm text-gray-400 font-arabic">{formatArabic("إدارة وتتبع جميع الحلول البرمجية المتاحة")}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-arabic">{formatArabic("إضافة منتج جديد")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-gray-100 animate-pulse" />)
        ) : products.map((product, i) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden group cursor-default"
          >
            <div className="absolute top-0 right-0 p-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                product.type === 'web' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                product.type === 'desktop' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${product.type === 'web' ? 'bg-blue-500' : product.type === 'desktop' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                {formatArabic(product.type === 'web' ? 'ويب' : product.type === 'desktop' ? 'ديسك توب' : 'موبايل')}
              </span>
            </div>
            <div className="mb-8 mt-4">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{formatArabic(product.name)}</h3>
              <div className="flex items-center gap-2 text-gray-400">
                <Key size={14} />
                <span className="text-xs font-arabic font-medium">{formatArabic(product.license_type === 'lifetime' ? 'ترخيص مدى الحياة' : 'نظام اشتراك شهري')}</span>
              </div>
            </div>
            <div className="flex items-end justify-between pt-6 border-t border-gray-50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("السعر الأساسي")}</p>
                <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">{product.price.toLocaleString()} <span className="text-sm font-arabic text-gray-400 font-normal">ج.م</span></p>
              </div>
              <button className="p-3 bg-gray-50 rounded-2xl text-gray-300 hover:text-brand-500 hover:bg-brand-50 transition-all duration-300">
                <ChevronRight size={22} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("إضافة منتج جديد")}</h2>
                  <p className="text-sm text-gray-400 font-arabic">{formatArabic("أدخل تفاصيل المنتج البرمجي الجديد")}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("اسم المنتج")}</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("النوع")}</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic appearance-none"
                    >
                      <option value="web">ويب</option>
                      <option value="desktop">ديسك توب</option>
                      <option value="mobile">موبايل</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("نوع الترخيص")}</label>
                    <select 
                      value={formData.license_type}
                      onChange={e => setFormData({...formData, license_type: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic appearance-none"
                    >
                      <option value="subscription">اشتراك</option>
                      <option value="lifetime">مدى الحياة</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("السعر (ج.م)")}</label>
                  <input 
                    type="number" required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-sans"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all font-arabic">{formatArabic("إلغاء")}</button>
                  <button type="submit" className="flex-1 py-4 bg-brand-500 text-dark-800 font-bold rounded-2xl hover:bg-brand-600 transition-all font-arabic shadow-lg shadow-brand-500/20">{formatArabic("حفظ المنتج")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    items: [{ product_id: "", price: "", discount: "0" }],
    notes: ""
  });

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;
      return sum + (price - discount);
    }, 0);
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: "", price: "", discount: "0" }] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ product_id: "", price: "", discount: "0" }] });
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
  const [convertData, setConvertData] = useState({ duration_months: 12, payment_plan: "installments", discount: 0, notes: "" });

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
        items: formData.items.map(it => ({ 
          ...it, 
          price: parseFloat(it.price),
          discount: parseFloat(it.discount || "0")
        })),
        total_price,
        notes: formData.notes
      });
      setShowModal(false);
      setFormData({ client_id: "", items: [{ product_id: "", price: "", discount: "0" }], notes: "" });
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
        items: selectedQuotation.items,
        notes: convertData.notes
      });
      setShowConvertModal(false);
      notify("تم إنشاء العقد بنجاح!");
      fetchData();
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("عروض الأسعار")}</h2>
          <p className="text-sm text-gray-400 font-arabic">{formatArabic("إدارة عروض الأسعار المقترحة للعملاء")}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-arabic">{formatArabic("عرض سعر جديد")}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("العميل")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("المنتجات")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("إجمالي السعر")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("الحالة")}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic text-left">{formatArabic("الإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-8 bg-gray-50/10"></td></tr>)
              ) : quotations.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 font-arabic text-base group-hover:text-brand-600 transition-colors">{formatArabic(q.company_name)}</div>
                    <div className="text-[10px] text-gray-400 font-sans mt-1">ID: #{q.id}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-3">
                      {q.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            <span className="text-sm font-bold text-gray-700 font-arabic">{formatArabic(it.product_name)}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mr-3.5 font-sans">
                            {it.price.toLocaleString()} ج.م 
                            {it.discount > 0 && <span className="text-red-500 font-bold mr-2">(-{it.discount.toLocaleString()} ج.م)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-lg font-display font-bold text-gray-900">{q.total_price.toLocaleString()} <span className="text-xs font-arabic text-gray-400 font-normal">ج.م</span></div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-arabic ${
                      q.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      q.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${q.status === 'pending' ? 'bg-amber-500' : q.status === 'converted' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {formatArabic(q.status === 'pending' ? 'قيد الانتظار' : q.status === 'converted' ? 'تم التحويل' : 'ملغي')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-left">
                    {q.status === 'pending' && (
                      <button 
                        onClick={() => { setSelectedQuotation(q); setShowConvertModal(true); }}
                        className="px-4 py-2 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-brand-500 hover:text-dark-800 transition-all font-arabic"
                      >
                        {formatArabic("تحويل إلى عقد")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("عرض سعر جديد")}</h2>
                  <p className="text-sm text-gray-400 font-arabic">{formatArabic("قم بإضافة المنتجات والخصومات لكل منتج")}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("العميل")}</label>
                  <select 
                    required
                    value={formData.client_id}
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic appearance-none"
                  >
                    <option value="">{formatArabic("اختر العميل")}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("المنتجات المختارة")}</label>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest font-arabic bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={14} />
                      <span>{formatArabic("إضافة منتج")}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4 relative group">
                        {formData.items.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeItem(index)}
                            className="absolute top-4 left-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("المنتج")}</label>
                            <select 
                              required
                              value={item.product_id}
                              onChange={e => updateItem(index, 'product_id', e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right text-sm font-arabic appearance-none"
                            >
                              <option value="">{formatArabic("اختر المنتج")}</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("السعر")}</label>
                              <input 
                                type="number" required step="0.01"
                                value={item.price}
                                onChange={e => updateItem(index, 'price', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right text-sm font-sans"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("الخصم")}</label>
                              <input 
                                type="number" required step="0.01"
                                value={item.discount}
                                onChange={e => updateItem(index, 'discount', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right text-sm font-sans text-red-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-dark-800 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-dark-800/20">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-arabic">{formatArabic("إجمالي عرض السعر")}</p>
                    <p className="text-3xl font-display font-bold">{calculateTotal(formData.items).toLocaleString()} <span className="text-sm font-arabic font-normal opacity-60">ج.م</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Calculator className="text-brand-500" size={24} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("ملاحظات إضافية")}</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 h-24 text-right transition-all font-arabic resize-none"
                    placeholder={formatArabic("أضف أي ملاحظات أو شروط خاصة هنا...")}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all font-arabic">{formatArabic("إلغاء")}</button>
                  <button type="submit" className="flex-1 py-4 bg-brand-500 text-dark-800 font-bold rounded-2xl hover:bg-brand-600 transition-all font-arabic shadow-lg shadow-brand-500/20">{formatArabic("إنشاء عرض السعر")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConvertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConvertModal(false)}
              className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">{formatArabic("تحويل إلى عقد")}</h2>
                  <p className="text-sm text-gray-400 font-arabic">{formatArabic("تأكيد تحويل عرض السعر إلى عقد رسمي")}</p>
                </div>
                <button onClick={() => setShowConvertModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleConvert} className="p-8 space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("تفاصيل العميل")}</p>
                  <p className="font-bold text-gray-900 text-lg font-arabic">{formatArabic(selectedQuotation?.company_name)}</p>
                  <p className="text-sm text-brand-600 font-bold">{selectedQuotation?.total_price.toLocaleString()} ج.م</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("المدة (أشهر)")}</label>
                    <input 
                      type="number" required
                      value={convertData.duration_months}
                      onChange={e => setConvertData({...convertData, duration_months: parseInt(e.target.value)})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("نظام الدفع")}</label>
                    <select 
                      value={convertData.payment_plan}
                      onChange={e => setConvertData({...convertData, payment_plan: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-arabic appearance-none"
                    >
                      <option value="installments">{formatArabic("أقساط")}</option>
                      <option value="cash">{formatArabic("كاش")}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("خصم إضافي (ج.م)")}</label>
                  <input 
                    type="number" required step="0.01"
                    value={convertData.discount}
                    onChange={e => setConvertData({...convertData, discount: parseFloat(e.target.value)})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-right transition-all font-sans text-red-500 font-bold"
                  />
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-arabic">{formatArabic("صافي قيمة العقد")}</p>
                    <p className="text-2xl font-display font-bold text-emerald-700">
                      {(selectedQuotation?.total_price - (convertData.discount || 0)).toLocaleString()} <span className="text-xs font-arabic font-normal opacity-60">ج.م</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all font-arabic">{formatArabic("إلغاء")}</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all font-arabic shadow-lg shadow-emerald-500/20">{formatArabic("إنشاء العقد")}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");

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
        method: paymentMethod,
        notes: paymentNotes,
        payment_date: paymentDate
      });
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      fetchContracts();
      notify("تم تسجيل الدفعة بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={formatArabic("بحث في العقود...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-arabic text-right"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">العميل</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">المنتجات</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">المالية</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">الحالة</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-left font-arabic">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-12 bg-gray-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <FileSignature size={32} />
                      </div>
                      <p className="text-gray-500 font-arabic">{formatArabic("لا توجد عقود حالياً")}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                        {c.company_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 font-arabic">{formatArabic(c.company_name)}</p>
                        <p className="text-xs text-gray-400 font-sans">ID: {c.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      {c.items && c.items.length > 0 ? (
                        c.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-bold text-gray-700 font-arabic">{formatArabic(it.product_name)}</span>
                            {it.discount > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">-{it.discount.toLocaleString()}</span>}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm font-bold text-gray-700 font-arabic">{formatArabic(c.product_name)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{(c.total_price - (c.discount || 0)).toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-arabic">ج.م</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-bold">{c.paid_amount.toLocaleString()}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-500 font-bold">{(c.total_price - (c.discount || 0) - c.paid_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      c.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' : 
                      c.status === 'active' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                    }`}>
                      {c.status === 'completed' ? formatArabic("مكتمل") : formatArabic("نشط")}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-left">
                    {c.status !== 'completed' && (
                      <button 
                        onClick={() => { 
                          setSelectedContract(c); 
                          setPaymentAmount((c.total_price - (c.discount || 0) - c.paid_amount).toString()); 
                          setPaymentDate(format(new Date(), "yyyy-MM-dd"));
                          setShowPaymentModal(true); 
                        }}
                        className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-600 hover:text-white transition-all font-arabic"
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

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading ? (
            [1,2].map(i => (
              <div key={i} className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                <div className="h-3 bg-gray-50 rounded-full w-3/4" />
              </div>
            ))
          ) : filteredContracts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-arabic">{formatArabic("لا توجد عقود حالياً")}</div>
          ) : filteredContracts.map((c) => (
            <div key={c.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                    {c.company_name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 font-arabic">{formatArabic(c.company_name)}</h4>
                    <p className="text-[10px] text-gray-400 font-sans"># {c.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-arabic ${
                  c.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {c.status === 'completed' ? formatArabic("مكتمل") : formatArabic("نشط")}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-4 space-y-2">
                {c.items && c.items.length > 0 ? (
                  c.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-arabic text-gray-600">{formatArabic(it.product_name)}</span>
                      <span className="font-bold text-gray-900">{it.price.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-arabic text-gray-600">{formatArabic(c.product_name)}</span>
                    <span className="font-bold text-gray-900">{c.total_price.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-arabic uppercase">{formatArabic("المتبقي")}</p>
                  <p className="text-lg font-bold text-red-500">{(c.total_price - (c.discount || 0) - c.paid_amount).toLocaleString()}</p>
                </div>
                {c.status !== 'completed' && (
                  <button 
                    onClick={() => { 
                      setSelectedContract(c); 
                      setPaymentAmount((c.total_price - (c.discount || 0) - c.paid_amount).toString()); 
                      setShowPaymentModal(true); 
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold font-arabic shadow-lg shadow-orange-500/20"
                  >
                    تسجيل دفعة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-2xl font-bold text-gray-900 font-arabic">تسجيل دفعة</h2>
                <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handlePayment} className="p-8 space-y-6">
                <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                  <p className="text-[10px] text-orange-600 uppercase font-black tracking-widest mb-2 font-arabic">تفاصيل العقد</p>
                  <p className="font-bold text-gray-900 text-lg">{formatArabic(selectedContract?.company_name)}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100/50">
                    <span className="text-xs text-gray-500 font-arabic">المبلغ المتبقي:</span>
                    <span className="font-bold text-red-600">{(selectedContract?.total_price - (selectedContract?.discount || 0) - selectedContract?.paid_amount).toLocaleString()} ج.م</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">مبلغ الدفعة (ج.م)</label>
                  <input 
                    type="number" required step="0.01"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-bold text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">تاريخ الدفعة</label>
                  <input 
                    type="date" required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">طريقة الدفع</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-arabic"
                  >
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="كاش">كاش</option>
                    <option value="شيك">شيك</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">ملاحظات</label>
                  <textarea 
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-arabic resize-none"
                    rows={2}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all font-arabic">إلغاء</button>
                  <button type="submit" className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all font-arabic">تأكيد الدفع</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Payments = () => {
  const { user, notify } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const thermalReceiptRef = React.useRef<HTMLDivElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isThermal, setIsThermal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, settingsData] = await Promise.all([
        api.getPayments(),
        api.getSettings()
      ]);
      setPayments(paymentsData);
      setSettings(settingsData);
    } catch (err: any) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const exportReceipt = async (payment: any) => {
    if (selectedPayment) return;
    setIsThermal(false);
    setSelectedPayment(payment);
    
    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el: any) => {
              try {
                const style = window.getComputedStyle(el);
                const hasUnsupportedColor = (val: string | null) => 
                  val && (val.includes('oklch') || val.includes('oklab') || val.includes('okl('));

                const colorProps = [
                  'color', 'backgroundColor', 'borderColor', 'borderTopColor', 
                  'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                  'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'
                ];

                colorProps.forEach(prop => {
                  if (hasUnsupportedColor(style[prop as any])) {
                    if (prop === 'backgroundColor') el.style.backgroundColor = 'transparent';
                    else if (prop.includes('border')) el.style.borderColor = '#e5e7eb';
                    else el.style[prop as any] = '#151619';
                  }
                });
                
                el.style.setProperty('box-shadow', 'none', 'important');
                el.style.setProperty('text-shadow', 'none', 'important');
                el.style.setProperty('filter', 'none', 'important');
                el.style.setProperty('backdrop-filter', 'none', 'important');
                
                if (el.classList.contains('bg-[#151619]')) {
                  el.style.backgroundColor = '#151619';
                  el.style.color = '#ffffff';
                }
                if (el.classList.contains('text-orange-500')) el.style.color = '#f97316';
                if (el.classList.contains('bg-orange-500')) el.style.backgroundColor = '#f97316';
                
                if (el.classList.contains('font-arabic') || el.style.fontFamily.includes('Cairo')) {
                  el.style.direction = 'rtl';
                  el.style.textAlign = 'right';
                }
              } catch (e) {}
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

  const exportThermalReceipt = async (payment: any) => {
    if (selectedPayment) return;
    setIsThermal(true);
    setSelectedPayment(payment);
    
    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (thermalReceiptRef.current) {
        const canvas = await html2canvas(thermalReceiptRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el: any) => {
              try {
                const style = window.getComputedStyle(el);
                const hasUnsupportedColor = (val: string | null) => 
                  val && (val.includes('oklch') || val.includes('oklab') || val.includes('okl('));

                const colorProps = [
                  'color', 'backgroundColor', 'borderColor', 'borderTopColor', 
                  'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                  'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'
                ];

                colorProps.forEach(prop => {
                  if (hasUnsupportedColor(style[prop as any])) {
                    if (prop === 'backgroundColor') el.style.backgroundColor = 'transparent';
                    else if (prop.includes('border')) el.style.borderColor = '#000000';
                    else el.style[prop as any] = '#000000';
                  }
                });

                el.style.setProperty('box-shadow', 'none', 'important');
                el.style.setProperty('text-shadow', 'none', 'important');
                el.style.setProperty('filter', 'none', 'important');
                el.style.setProperty('backdrop-filter', 'none', 'important');

                if (el.classList.contains('font-arabic') || el.style.fontFamily.includes('Cairo')) {
                  el.style.direction = 'rtl';
                  el.style.textAlign = 'right';
                }
              } catch (e) {}
            });
          }
        });
        
        const link = document.createElement('a');
        link.download = `thermal-receipt-${payment.id}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate thermal receipt", err);
    } finally {
      setSelectedPayment(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || format(new Date(p.payment_date), "yyyy-MM-dd") === dateFilter;
    return matchesSearch && matchesDate;
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const thisMonthStr = format(new Date(), "yyyy-MM");
  
  const totalToday = payments
    .filter(p => format(new Date(p.payment_date), "yyyy-MM-dd") === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalThisMonth = payments
    .filter(p => format(new Date(p.payment_date), "yyyy-MM") === thisMonthStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFiltered = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const prevPaymentsTotal = selectedPayment ? payments
    .filter(p => p.contract_id === selectedPayment.contract_id && p.id !== selectedPayment.id)
    .reduce((sum, p) => sum + p.amount, 0) : 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("إجمالي تحصيل اليوم")}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-display font-black text-gray-900">{totalToday.toLocaleString()}</h3>
              <span className="text-xs font-arabic text-gray-400">ج.م</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
            <TrendingUp size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">{formatArabic("إجمالي تحصيل الشهر")}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-display font-black text-gray-900">{totalThisMonth.toLocaleString()}</h3>
              <span className="text-xs font-arabic text-gray-400">ج.م</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
            <Banknote size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-500 p-6 rounded-[2.5rem] border border-brand-400 shadow-xl shadow-brand-500/30 flex items-center justify-between group"
        >
          <div className="space-y-1 text-dark-900">
            <p className="text-xs font-bold uppercase tracking-widest font-arabic opacity-60">{formatArabic("إجمالي البحث/الفلترة")}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-display font-black">{totalFiltered.toLocaleString()}</h3>
              <span className="text-xs font-arabic opacity-60">ج.م</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-dark-900/10 rounded-2xl flex items-center justify-center text-dark-900 group-hover:bg-dark-900 group-hover:text-white transition-all duration-500">
            <Calculator size={24} />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={formatArabic("بحث في المدفوعات...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-arabic text-right shadow-sm"
            />
          </div>
          <div className="relative w-full sm:w-56 group">
            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-sans text-right shadow-sm"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Receipt Template for JPG Generation */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={receiptRef}
          className="w-[800px] bg-white p-12 receipt-container relative overflow-hidden"
          style={{ 
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif",
            letterSpacing: '0',
            fontVariantLigatures: 'common-ligatures',
            backgroundColor: '#ffffff',
            minHeight: '1100px'
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0">
            <Logo size="2xl" transparent noShadow />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold font-arabic text-gray-900">{formatArabic("إيصال استلام نقدية")}</h1>
                <p className="text-sm font-arabic text-gray-600">{formatArabic("رقم الإيصال:")} <span className="font-sans font-bold">RCP-{selectedPayment?.id?.toString().padStart(5, '0')}</span></p>
                <p className="text-sm font-arabic text-gray-600">{formatArabic("التاريخ:")} <span className="font-sans font-bold">{selectedPayment && format(new Date(selectedPayment.payment_date), "yyyy/MM/dd")}</span></p>
              </div>
              
              <div className="text-center px-4">
                <h2 className="text-4xl font-bold font-arabic text-gray-900 mb-1">{formatArabic(settings.company_name)}</h2>
                <p className="text-lg font-arabic text-gray-500">{formatArabic(settings.company_address)}</p>
              </div>

              <Logo size="xl" noShadow />
            </div>

            <div className="border-2 border-gray-200 rounded-2xl p-6 mb-8 bg-gray-50/50">
              <h3 className="text-sm font-bold font-arabic text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">{formatArabic("بيانات العميل:")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-arabic text-gray-500 mb-1">{formatArabic("الاسم:")} <span className="text-lg font-bold text-gray-900 pr-2">{formatArabic(selectedPayment?.company_name)}</span></p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-arabic text-gray-500 mb-1">{formatArabic("طريقة الدفع:")} <span className="text-lg font-bold text-gray-900 pr-2">{formatArabic(selectedPayment?.method)}</span></p>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border-2 border-gray-900 mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-2 border-gray-900 px-4 py-3 text-sm font-bold font-arabic">#</th>
                  <th className="border-2 border-gray-900 px-4 py-3 text-sm font-bold font-arabic text-right">{formatArabic("الصنف")}</th>
                  <th className="border-2 border-gray-900 px-4 py-3 text-sm font-bold font-arabic">{formatArabic("السعر")}</th>
                  <th className="border-2 border-gray-900 px-4 py-3 text-sm font-bold font-arabic">{formatArabic("الخصم")}</th>
                  <th className="border-2 border-gray-900 px-4 py-3 text-sm font-bold font-arabic">{formatArabic("الإجمالي")}</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayment?.items && selectedPayment.items.length > 0 ? (
                  selectedPayment.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans">{idx + 1}</td>
                      <td className="border-2 border-gray-900 px-4 py-3 text-right font-arabic">{formatArabic(it.product_name)}</td>
                      <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans">{it.price.toLocaleString()}</td>
                      <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans text-red-600">{it.discount ? it.discount.toLocaleString() : 0}</td>
                      <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans font-bold">{(it.price - (it.discount || 0)).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans">1</td>
                    <td className="border-2 border-gray-900 px-4 py-3 text-right font-arabic">{formatArabic(selectedPayment?.product_name)}</td>
                    <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans">{selectedPayment?.contract_total.toLocaleString()}</td>
                    <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans text-red-600">{selectedPayment?.contract_discount || 0}</td>
                    <td className="border-2 border-gray-900 px-4 py-3 text-center font-sans font-bold">{(selectedPayment?.contract_total - (selectedPayment?.contract_discount || 0)).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end mb-12">
              <div className="w-80 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-arabic text-gray-500">{formatArabic("الإجمالي الفرعي")}</span>
                  <span className="font-sans font-bold text-gray-900">{selectedPayment?.contract_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-gray-900">
                  <span className="text-lg font-bold font-arabic text-gray-900">{formatArabic("الإجمالي الكلي")}</span>
                  <span className="text-2xl font-bold font-sans text-gray-900">{selectedPayment?.contract_total.toLocaleString()} <span className="text-sm font-arabic">{formatArabic("ج.م")}</span></span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-bold font-arabic">{formatArabic("مدفوعات سابقة")}</span>
                  <span className="font-sans font-bold">-{prevPaymentsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-bold font-arabic">{formatArabic("المبلغ المدفوع حالياً")}</span>
                  <span className="font-sans font-bold">-{selectedPayment?.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-900 bg-gray-100 p-3 rounded-xl">
                  <span className="text-sm font-bold font-arabic text-gray-900">{formatArabic("المتبقي من العقد")}</span>
                  <span className="text-lg font-bold font-sans text-red-600">{(selectedPayment?.contract_total - (selectedPayment?.contract_discount || 0) - selectedPayment?.contract_paid).toLocaleString()} <span className="text-xs font-arabic">{formatArabic("ج.م")}</span></span>
                </div>
              </div>
            </div>

            {selectedPayment?.notes && (
              <div className="mb-8 p-6 bg-orange-50 rounded-2xl border-r-4 border-orange-500">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-orange-600 font-arabic">{formatArabic("ملاحظات إضافية")}</p>
                <p className="text-sm font-arabic text-gray-700 leading-relaxed">{formatArabic(selectedPayment.notes)}</p>
              </div>
            )}

            {/* Previous Payments History */}
            {payments.filter(p => p.contract_id === selectedPayment?.contract_id && p.id !== selectedPayment?.id).length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm font-bold font-arabic text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">{formatArabic("سجل الدفعات السابقة:")}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="py-2 text-right font-arabic">{formatArabic("التاريخ")}</th>
                      <th className="py-2 text-center font-arabic">{formatArabic("المبلغ")}</th>
                      <th className="py-2 text-left font-arabic">{formatArabic("الطريقة")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments
                      .filter(p => p.contract_id === selectedPayment?.contract_id && p.id !== selectedPayment?.id)
                      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map(prev => (
                        <tr key={prev.id} className="text-gray-600">
                          <td className="py-2 font-sans">{format(new Date(prev.payment_date), "yyyy/MM/dd")}</td>
                          <td className="py-2 text-center font-sans font-bold">{prev.amount.toLocaleString()}</td>
                          <td className="py-2 text-left font-arabic">{formatArabic(prev.method)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-auto pt-12 border-t border-gray-100 flex justify-between items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-xs font-arabic text-gray-500">{formatArabic("يُعتمد هذا الإيصال بختم الشركة الرسمي")}</p>
                </div>
                <div className="flex gap-6 text-[10px] font-bold text-gray-300 font-sans">
                  <span>{settings.company_website}</span>
                  <span>{settings.company_email}</span>
                </div>
              </div>
              
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-arabic mb-4">{formatArabic("توقيع المحاسب")}</p>
                <div className="w-48 h-1 bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Template */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={thermalReceiptRef}
          className="w-[320px] bg-white p-4 thermal-receipt-container"
          style={{ 
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif",
            letterSpacing: '0',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        >
          <div className="flex flex-col items-center text-center mb-4">
            <Logo size="md" className="mb-2" noShadow />
            <h2 className="text-lg font-bold font-arabic">{formatArabic(settings.company_name)}</h2>
            <p className="text-[10px] font-arabic text-gray-600">{formatArabic(settings.company_address)}</p>
            <p className="text-[10px] font-sans text-gray-600">{formatArabic(`رقم الهاتف: ${settings.company_phone}`)}</p>
            <p className="text-[10px] font-sans text-gray-600">{settings.company_website}</p>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>
          
          <div className="text-center mb-2">
            <h3 className="text-sm font-bold font-arabic">{formatArabic("فاتورة مبيعات")}</h3>
            <div className="inline-block border border-black px-4 py-2 mt-1">
              <p className="text-xs font-arabic font-bold">{formatArabic("ف-ب-")}{selectedPayment?.id}</p>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-arabic mb-4">
            <div className="flex justify-between">
              <span>{formatArabic("رقم الفاتورة:")}</span>
              <span className="font-sans">RCP-{selectedPayment?.id?.toString().padStart(5, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span>{formatArabic("التاريخ:")}</span>
              <span className="font-sans">{selectedPayment && format(new Date(selectedPayment.payment_date), "yyyy/MM/dd HH:mm")}</span>
            </div>
            <div className="flex justify-between">
              <span>{formatArabic("الكاشير:")}</span>
              <span className="font-bold">{formatArabic(user?.fullName || "---")}</span>
            </div>
            <div className="flex justify-between">
              <span>{formatArabic("العميل:")}</span>
              <span className="font-bold">{formatArabic(selectedPayment?.company_name)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          <table className="w-full text-[10px] mb-4">
            <thead>
              <tr className="border-b border-black">
                <th className="text-right py-1 font-arabic">{formatArabic("الصنف")}</th>
                <th className="text-center py-1 font-arabic">{formatArabic("سعر")}</th>
                <th className="text-center py-1 font-arabic">{formatArabic("خصم")}</th>
                <th className="text-left py-1 font-arabic">{formatArabic("صافي")}</th>
              </tr>
            </thead>
            <tbody>
              {selectedPayment?.items && selectedPayment.items.length > 0 ? (
                selectedPayment.items.map((it: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1 font-arabic">{formatArabic(it.product_name)}</td>
                    <td className="text-center py-1 font-sans">{it.price.toLocaleString()}</td>
                    <td className="text-center py-1 font-sans">{it.discount || 0}</td>
                    <td className="text-left py-1 font-sans">{(it.price - (it.discount || 0)).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-100">
                  <td className="py-1 font-arabic">{formatArabic(selectedPayment?.product_name)}</td>
                  <td className="text-center py-1 font-sans">{selectedPayment?.contract_total.toLocaleString()}</td>
                  <td className="text-center py-1 font-sans">{selectedPayment?.contract_discount || 0}</td>
                  <td className="text-left py-1 font-sans">{(selectedPayment?.contract_total - (selectedPayment?.contract_discount || 0)).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="space-y-1 text-xs font-arabic">
            <div className="flex justify-between">
              <span>{formatArabic("الإجمالي:")}</span>
              <span className="font-sans">{selectedPayment?.contract_total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
              <span>{formatArabic("الصافي:")}</span>
              <span className="font-sans">{selectedPayment?.contract_total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{formatArabic("سابقاً:")}</span>
              <span className="font-sans">-{prevPaymentsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{formatArabic("المدفوع:")}</span>
              <span className="font-sans">-{selectedPayment?.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-black pt-1">
              <span>{formatArabic("باقي الفاتورة (الآجل):")}</span>
              <span className="font-sans">{(selectedPayment?.contract_total - (selectedPayment?.contract_discount || 0) - selectedPayment?.contract_paid).toLocaleString()}</span>
            </div>
          </div>

          {/* Thermal Previous Payments History */}
          {payments.filter(p => p.contract_id === selectedPayment?.contract_id && p.id !== selectedPayment?.id).length > 0 && (
            <div className="mt-4">
              <div className="border-t border-dashed border-black mb-2 pt-2">
                <p className="text-[10px] font-bold font-arabic mb-1 text-center">{formatArabic("دفعات سابقة لهذا العقد:")}</p>
                <div className="space-y-1">
                  {payments
                    .filter(p => p.contract_id === selectedPayment?.contract_id && p.id !== selectedPayment?.id)
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map(prev => (
                      <div key={prev.id} className="flex justify-between text-[9px] font-sans">
                        <span>{format(new Date(prev.payment_date), "yyyy/MM/dd")}</span>
                        <span className="font-bold">{prev.amount.toLocaleString()}</span>
                        <span className="font-arabic">{formatArabic(prev.method)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-dashed border-black my-4"></div>

          <div className="text-center space-y-2">
            <p className="text-[9px] font-arabic text-gray-600 leading-tight">
              {formatArabic(settings.receipt_footer_note)}
            </p>
            <p className="text-[9px] font-sans text-gray-500">
              {formatArabic(`For any inquiries please Call: ${settings.company_phone}`)}
            </p>
            <div className="flex justify-center">
              <div className="w-16 h-16 opacity-10">
                <Logo size="sm" transparent noShadow />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">التاريخ</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">العميل</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">المبلغ</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">الطريقة</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-left font-arabic">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-12 bg-gray-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <CreditCard size={32} />
                      </div>
                      <p className="text-gray-500 font-arabic">{formatArabic("لا توجد مدفوعات حالياً")}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-sans">{format(new Date(p.payment_date), "yyyy-MM-dd")}</span>
                      <span className="text-[10px] text-gray-300 font-sans">{format(new Date(p.payment_date), "HH:mm")}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-900 font-arabic">{formatArabic(p.company_name)}</p>
                    <p className="text-[10px] text-gray-400 font-arabic">{formatArabic(p.product_name)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">{p.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 font-arabic">ج.م</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold font-arabic">
                      {formatArabic(p.method)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => exportReceipt(p)}
                        className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"
                        title="تحميل الإيصال (JPG)"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => exportThermalReceipt(p)}
                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                        title="طباعة إيصال حراري"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                <div className="h-3 bg-gray-50 rounded-full w-3/4" />
              </div>
            ))
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-arabic">{formatArabic("لا توجد مدفوعات حالياً")}</div>
          ) : filteredPayments.map((p) => (
            <div key={p.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-sans">{format(new Date(p.payment_date), "yyyy-MM-dd HH:mm")}</p>
                  <h4 className="font-bold text-gray-900 font-arabic mt-1">{formatArabic(p.company_name)}</h4>
                  <p className="text-[10px] text-gray-500 font-arabic">{formatArabic(p.product_name)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 leading-none">{p.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-arabic mt-1">{formatArabic(p.method)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportReceipt(p)}
                  className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 font-arabic"
                >
                  <Download size={14} />
                  إيصال عادى
                </button>
                <button 
                  onClick={() => exportThermalReceipt(p)}
                  className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 font-arabic"
                >
                  <Printer size={14} />
                  إيصال حراري
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Licenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useAuth();

  useEffect(() => {
    api.getLicenses().then(setLicenses).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] border border-gray-100 animate-pulse"></div>)
        ) : licenses.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Key size={32} />
            </div>
            <p className="text-gray-500 font-arabic">{formatArabic("لا توجد تراخيص حالياً")}</p>
          </div>
        ) : licenses.map((l) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={l.id} 
            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Key size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  l.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {l.status === 'active' ? formatArabic("نشط") : formatArabic("منتهي")}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 font-arabic mb-1">
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
                </h3>
                <p className="text-sm text-gray-500 font-arabic">{formatArabic(l.company_name)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl font-mono text-xs break-all border border-gray-100 text-gray-600">
                {l.license_key}
              </div>

              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest font-arabic">{formatArabic("تاريخ الانتهاء")}</p>
                  <p className="font-bold text-gray-700 font-sans">{l.expiry_date}</p>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(l.license_key); notify("تم نسخ المفتاح!"); }}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest font-arabic"
                >
                  نسخ المفتاح
                </button>
              </div>
            </div>
          </motion.div>
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
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">التاريخ</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">المستخدم</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">الإجراء</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest font-arabic">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6"><div className="h-12 bg-gray-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-sans">{format(new Date(l.timestamp), "yyyy-MM-dd")}</span>
                      <span className="text-[10px] text-gray-300 font-sans">{format(new Date(l.timestamp), "HH:mm")}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {l.username?.[0] || "S"}
                      </div>
                      <span className="font-bold text-gray-700">{l.username || "النظام"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-arabic ${
                      l.action === 'DELETE' ? 'bg-red-50 text-red-600' : 
                      l.action === 'CREATE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {l.action === 'CREATE' ? formatArabic("إنشاء") : l.action === 'UPDATE' ? formatArabic("تحديث") : formatArabic("حذف")}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-gray-500 font-arabic max-w-md truncate" title={l.details}>
                      {formatArabic(l.details)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="p-4 animate-pulse h-20 bg-gray-50/50" />
            ))
          ) : logs.map((l) => (
            <div key={l.id} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-sans">{format(new Date(l.timestamp), "yyyy-MM-dd HH:mm")}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-arabic ${
                  l.action === 'DELETE' ? 'bg-red-50 text-red-600' : 
                  l.action === 'CREATE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {l.action === 'CREATE' ? "إنشاء" : l.action === 'UPDATE' ? "تحديث" : "حذف"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">{l.username?.[0] || "S"}</div>
                <span className="text-xs font-bold text-gray-700">{l.username || "النظام"}</span>
              </div>
              <p className="text-[11px] text-gray-500 font-arabic">{formatArabic(l.details)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { notify } = useAuth();
  const [settings, setSettings] = useState<any>({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    receipt_footer_note: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      notify("تم حفظ الإعدادات بنجاح!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden"
      >
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 font-arabic">إعدادات الشركة</h2>
          <p className="text-sm text-gray-500 font-arabic mt-1">{formatArabic("إدارة معلومات الشركة وتفاصيل الإيصالات")}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">اسم الشركة</label>
              <input 
                type="text" required
                value={settings.company_name || ""}
                onChange={e => setSettings({...settings, company_name: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">رقم الهاتف</label>
              <input 
                type="text" required
                value={settings.company_phone || ""}
                onChange={e => setSettings({...settings, company_phone: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">البريد الإلكتروني</label>
              <input 
                type="email" required
                value={settings.company_email || ""}
                onChange={e => setSettings({...settings, company_email: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">الموقع الإلكتروني</label>
              <input 
                type="text"
                value={settings.company_website || ""}
                onChange={e => setSettings({...settings, company_website: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">عنوان الشركة</label>
              <input 
                type="text" required
                value={settings.company_address || ""}
                onChange={e => setSettings({...settings, company_address: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-arabic"
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">ملاحظة أسفل الإيصال</label>
              <textarea 
                value={settings.receipt_footer_note || ""}
                onChange={e => setSettings({...settings, receipt_footer_note: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-arabic resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex justify-end">
            <button 
              type="submit"
              className="px-10 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all font-arabic"
            >
              حفظ التغييرات
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UsersManagement = () => {
  const { notify } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role_id: 0,
    permissions: ["dashboard"]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          api.getUsers(),
          api.getRoles()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
        }
      } catch (err: any) {
        notify(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allPermissions = [
    { id: "dashboard", label: "لوحة التحكم" },
    { id: "clients", label: "العملاء" },
    { id: "products", label: "المنتجات" },
    { id: "quotations", label: "عروض الأسعار" },
    { id: "contracts", label: "العقود" },
    { id: "payments", label: "المدفوعات" },
    { id: "licenses", label: "التراخيص" },
    { id: "audit-logs", label: "سجل العمليات" },
    { id: "settings", label: "الإعدادات" },
    { id: "users", label: "إدارة المستخدمين" },
  ];

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        password: "",
        role_id: user.role_id,
        permissions: user.permissions
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        full_name: "",
        email: "",
        password: "",
        role_id: roles.length > 0 ? roles[0].id : 0,
        permissions: ["dashboard"]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        notify("تم تحديث بيانات المستخدم بنجاح");
      } else {
        await api.createUser(formData);
        notify("تم إضافة المستخدم بنجاح");
      }
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
      setIsModalOpen(false);
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await api.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        notify("تم حذف المستخدم بنجاح", "error");
      } catch (err: any) {
        notify(err.message, "error");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight font-arabic">إدارة المستخدمين</h1>
          <p className="text-gray-500 font-arabic mt-1">تحكم في وصول الموظفين وصلاحياتهم داخل النظام</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all font-arabic"
        >
          <UserPlus size={20} />
          إضافة مستخدم جديد
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {users.map(user => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <UserCog size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-arabic">{user.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400 font-sans">{user.email}</span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                    <span className="text-xs font-black px-2 py-1 bg-gray-100 text-gray-500 rounded-lg uppercase tracking-widest font-arabic">{user.role_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-w-md justify-end">
                {user.permissions.slice(0, 4).map((p: string) => (
                  <span key={p} className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-arabic">
                    {allPermissions.find(ap => ap.id === p)?.label}
                  </span>
                ))}
                {user.permissions.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-400 rounded-md font-arabic">
                    +{user.permissions.length - 4} أخرى
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenModal(user)}
                  className="p-3 bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 font-arabic">{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h2>
                    <p className="text-sm text-gray-400 font-arabic">أدخل بيانات المستخدم وحدد صلاحياته</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">اسم المستخدم</label>
                    <input 
                      type="text" required
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">الاسم الكامل</label>
                    <input 
                      type="text" required
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-arabic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">البريد الإلكتروني</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">كلمة المرور</label>
                    <input 
                      type="password" required={!editingUser}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? "اتركه فارغاً لعدم التغيير" : ""}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-sans"
                    />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">الدور الوظيفي</label>
                    <select 
                      value={formData.role_id}
                      onChange={e => setFormData({...formData, role_id: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-right font-arabic appearance-none"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-full space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-arabic">الصلاحيات والوصول</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allPermissions.map(perm => (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all font-arabic text-sm ${
                            formData.permissions.includes(perm.id)
                            ? "bg-orange-50 border-orange-200 text-orange-600 font-bold"
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          }`}
                        >
                          <span>{perm.label}</span>
                          {formData.permissions.includes(perm.id) && <ShieldCheck size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all font-arabic"
                  >
                    {editingUser ? "تحديث المستخدم" : "إضافة المستخدم"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string) => {
    return user?.username === "admin" || user?.permissions?.includes(permission);
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={hasPermission("dashboard") ? <Dashboard /> : <Navigate to="/clients" />} />
        <Route path="/clients" element={hasPermission("clients") ? <Clients /> : <Navigate to="/" />} />
        <Route path="/products" element={hasPermission("products") ? <Products /> : <Navigate to="/" />} />
        <Route path="/quotations" element={hasPermission("quotations") ? <Quotations /> : <Navigate to="/" />} />
        <Route path="/contracts" element={hasPermission("contracts") ? <Contracts /> : <Navigate to="/" />} />
        <Route path="/payments" element={hasPermission("payments") ? <Payments /> : <Navigate to="/" />} />
        <Route path="/licenses" element={hasPermission("licenses") ? <Licenses /> : <Navigate to="/" />} />
        <Route path="/audit-logs" element={hasPermission("audit-logs") ? <AuditLogs /> : <Navigate to="/" />} />
        <Route path="/settings" element={hasPermission("settings") ? <Settings /> : <Navigate to="/" />} />
        <Route path="/users-management" element={hasPermission("users") ? <UsersManagement /> : <Navigate to="/" />} />
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
