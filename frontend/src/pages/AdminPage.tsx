import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  ShoppingCart, 
  Users, 
  FileText, 
  Box,
  Percent,
  LogOut,
  Menu,
  X,
  LineChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { AdminOptions } from './admin/AdminOptions';
import { AdminPricing } from './admin/AdminPricing';
import { AdminOrders } from './admin/AdminOrders';
import { AdminInventory } from './admin/AdminInventory';
import { AdminUsers } from './admin/AdminUsers';
import { AdminLegal } from './admin/AdminLegal';
import { AdminDocuments } from './admin/AdminDocuments';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminMaterials } from './admin/AdminMaterials';

type AdminSection = 
  | 'dashboard' 
  | 'materials' 
  | 'options' 
  | 'pricing' 
  | 'orders' 
  | 'inventory' 
  | 'users' 
  | 'legal' 
  | 'documents';

interface AdminMenuItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: AdminMenuItem[] = [
  { id: 'dashboard', label: '統計', icon: LineChart },
  { id: 'materials', label: '板材管理', icon: Package },
  { id: 'options', label: 'オプション管理', icon: Settings },
  { id: 'pricing', label: '価格設定', icon: Percent },
  { id: 'orders', label: '注文管理', icon: ShoppingCart },
  { id: 'inventory', label: '在庫管理', icon: Box },
  { id: 'users', label: 'ユーザー管理', icon: Users },
  { id: 'legal', label: '利用規約管理', icon: FileText },
  { id: 'documents', label: '書類管理', icon: FileText },
];

export function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current section from URL
  const currentSection = location.pathname.split('/admin/')[1] || 'dashboard';

  // Protect route - only admins can access
  const { loading } = useProtectedRoute(() => {
    navigate('/');
  }, 'admin');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス拒否</h1>
          <p className="text-gray-600 mb-6">管理者権限が必要です。</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden fixed lg:static lg:translate-x-0 h-screen z-40`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">BOXPACK 管理</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      to={`/admin/${item.id}`}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-h-[100vh] flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link
                to="/"
                className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 text-white hover:bg-red-400'
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">ダッシュボード</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="materials" element={<AdminMaterials />} />
            <Route path="options" element={<AdminOptions />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="legal" element={<AdminLegal />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}