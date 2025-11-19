import { useState } from 'react';
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
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

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
  { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { id: 'materials', label: '板材管理', icon: Package },
  { id: 'options', label: 'オプション管理', icon: Settings },
  { id: 'pricing', label: '価格設定', icon: Percent },
  { id: 'orders', label: '注文管理', icon: ShoppingCart },
  { id: 'inventory', label: '在庫管理', icon: Box },
  { id: 'users', label: 'ユーザー管理', icon: Users },
  { id: 'legal', label: '利用規約管理', icon: FileText },
  { id: 'documents', label: '書類管理', icon: FileText },
];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, profile } = useAuth();

  // Protect route - only admins can access
  const { loading } = useProtectedRoute(() => {
    onNavigate('home');
  }, 'admin');

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
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
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'materials':
        return <AdminMaterials />;
      case 'options':
        return <AdminOptions />;
      case 'pricing':
        return <AdminPricing />;
      case 'orders':
        return <AdminOrders />;
      case 'inventory':
        return <AdminInventory />;
      case 'users':
        return <AdminUsers />;
      case 'legal':
        return <AdminLegal />;
      case 'documents':
        return <AdminDocuments />;
      default:
        return <AdminDashboard />;
    }
  };

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
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        currentSection === item.id
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

// Placeholder components for each section - will be implemented in next steps
function AdminDashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">ダッシュボード</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">今日の注文</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">今月の売上</h3>
          <p className="text-2xl font-bold text-gray-900">¥0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">未承認注文</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">在庫アラート</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  );
}

function AdminMaterials() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">板材管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminOptions() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">オプション管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminPricing() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">価格設定</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminOrders() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">注文管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminInventory() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">在庫管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminUsers() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">ユーザー管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminLegal() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">利用規約管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

function AdminDocuments() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">書類管理</h2>
      <p className="text-gray-600">実装予定</p>
    </div>
  );
}

