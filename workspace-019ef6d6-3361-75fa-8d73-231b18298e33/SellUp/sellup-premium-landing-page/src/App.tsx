import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';
import { CartProvider } from './lib/cart';
import { CartDrawer } from './components/CartDrawer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ShopBlog from './pages/ShopBlog';
import ShopPage from './pages/ShopPage';
import Demo from './pages/Demo';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen selection:bg-brand-purple/30">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/s/:slug" element={<Shop />} />
                <Route path="/s/:slug/blog" element={<ShopBlog />} />
                <Route path="/s/:slug/blog/:postSlug" element={<ShopBlog />} />
                <Route path="/s/:slug/p/:pageSlug" element={<ShopPage />} />
                <Route path="/cart/:slug" element={<Cart />} />
                <Route path="/p/:id" element={<Product />} />
                <Route path="/checkout/:orderId" element={<Checkout />} />
                <Route path="/order/:orderId" element={<OrderSuccess />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CartDrawer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
