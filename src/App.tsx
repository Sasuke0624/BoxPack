import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { QuotePage } from './pages/QuotePage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyPage } from './pages/MyPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

type Page = 'home' | 'quote' | 'cart' | 'login' | 'checkout' | 'mypage' | 'terms' | 'privacy';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'quote':
        return <QuotePage onNavigate={setCurrentPage} />;
      case 'cart':
        return <CartPage onNavigate={setCurrentPage} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'checkout':
        return <CheckoutPage onNavigate={setCurrentPage} />;
      case 'mypage':
        return <MyPage onNavigate={setCurrentPage} />;
      case 'terms':
        return <TermsPage onNavigate={setCurrentPage} />;
      case 'privacy':
        return <PrivacyPage onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-white flex flex-col">
          <Header onNavigate={setCurrentPage} currentPage={currentPage} />
          <main className="flex-grow">
            {renderPage()}
          </main>
          <Footer onNavigate={setCurrentPage} />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
