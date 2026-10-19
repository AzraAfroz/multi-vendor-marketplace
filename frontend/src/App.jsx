import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import LocationModal from './components/location/LocationModal.jsx'
import CartDrawer from './components/cart/CartDrawer.jsx'
import WishlistDrawer from './components/wishlist/WishlistDrawer.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import useAuth from './hooks/useAuth.js'
import VendorOnboardingPage from './pages/vendor/VendorOnboardingPage.jsx'
import VendorStorePage from './pages/vendor/VendorStorePage.jsx'
import VendorProductsPage from './pages/vendor/VendorProductsPage.jsx'
import VendorOrdersPage from './pages/vendor/VendorOrdersPage.jsx'
import AdminVendorReviewPage from './pages/admin/AdminVendorReviewPage.jsx'
import AdminCatalogPage from './pages/admin/AdminCatalogPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx'
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage.jsx'
import HomePage from './pages/home/HomePage.jsx'
import ProductDetailPage from './pages/shop/ProductDetailPage.jsx'
import PublicStorePage from './pages/shop/PublicStorePage.jsx'
import CheckoutPage from './pages/checkout/CheckoutPage.jsx'
import MyOrdersPage from './pages/orders/MyOrdersPage.jsx'
import OrderDetailsPage from './pages/orders/OrderDetailsPage.jsx'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '108249827402-livegoogleclientidplaceholder.apps.googleusercontent.com'

function AccountDispatcher() {
  const { user } = useAuth()
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user?.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />
  }
  return <CustomerDashboardPage />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <LocationModal />
              <CartDrawer />
              <WishlistDrawer />
              <Routes>
                {/* Customer Marketplace Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<HomePage />} />
                <Route path="/products" element={<HomePage defaultBrowseAll />} />
                <Route path="/catalog" element={<HomePage defaultBrowseAll />} />
                <Route path="/shop" element={<HomePage defaultBrowseAll />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/store/:id" element={<PublicStorePage />} />
                <Route path="/stores/:id" element={<PublicStorePage />} />

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* Customer / Orders / Account Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/account" element={<AccountDispatcher />} />
                  <Route path="/account/dashboard" element={<CustomerDashboardPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailsPage />} />
                  <Route path="/account/orders" element={<MyOrdersPage />} />
                  <Route path="/account/orders/:id" element={<OrderDetailsPage />} />
                </Route>

                {/* Vendor Onboarding & Management */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/vendor/onboarding" element={<VendorOnboardingPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['vendor']} />}>
                  <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
                  <Route path="/vendor/store" element={<VendorStorePage />} />
                  <Route path="/vendor/products" element={<VendorProductsPage />} />
                  <Route path="/vendor/orders" element={<VendorOrdersPage />} />
                </Route>

                {/* Admin Management */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/orders" element={<AdminDashboardPage />} />
                    <Route path="/admin/vendors" element={<AdminVendorReviewPage />} />
                    <Route path="/admin/categories" element={<AdminCatalogPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
