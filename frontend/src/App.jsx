import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="glass">
      <Link to={user?.role === 'admin' ? '/admin' : '/'} className="brand" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none', fontFamily: 'Outfit' }}>
        OrderHub
      </Link>
      
      {/* Mobile Toggle */}
      <button className="btn btn-ghost md-hidden" onClick={() => setIsOpen(!isOpen)} style={{ border: 'none', padding: '0.5rem' }}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-links ${isOpen ? 'active' : ''}`}>
        {!user && <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Products</Link>}
        {user ? (
          <>
            <span className="badge badge-pending hide-on-mobile">{user.role}</span>
            {user.role !== 'admin' && (
              <>
                <Link to="/orders" className="nav-link" onClick={() => setIsOpen(false)}>My Orders</Link>
                <Link to="/cart" className="nav-link cart-icon" onClick={() => setIsOpen(false)}>
                  <ShoppingCart size={20} />
                  {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className="nav-link admin-link" onClick={() => setIsOpen(false)}>Dashboard</Link>
            )}
            <button onClick={logout} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" onClick={() => setIsOpen(false)}>Login</Link>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link { color: var(--text); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .nav-link:hover { color: var(--primary); }
        .admin-link { color: var(--primary) !important; font-weight: 600; }
        
        @media (max-width: 768px) {
          .md-hidden { display: block !important; }
          .nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: var(--bg);
            padding: 1.5rem;
            flex-direction: column;
            gap: 1.5rem;
            border-bottom: 1px solid var(--border);
            box-shadow: var(--shadow-lg);
          }
          .nav-links.active { display: flex; }
        }
        @media (min-width: 769px) {
          .md-hidden { display: none !important; }
        }
      `}} />
    </nav>
  );
};

const ProtectedRoute = ({ children, admin }) => {
  const { user, loading, logout } = useAuth();

  React.useEffect(() => {
    if (!loading && user && admin && user.role !== 'admin') {
      logout();
    }
  }, [loading, user, admin, logout]);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
};

const HomeWithRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Home />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<HomeWithRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
