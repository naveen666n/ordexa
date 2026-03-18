import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from '../context/ConfigContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Guards
import AuthGuard from './guards/AuthGuard';
import GuestGuard from './guards/GuestGuard';
import RoleGuard from './guards/RoleGuard';

// Layouts
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import OperationsLayout from '../layouts/OperationsLayout';
import AuthLayout from '../layouts/AuthLayout';

// Customer pages
import HomePage from '../pages/customer/HomePage';
import CatalogPage from '../pages/customer/CatalogPage';
import ProductDetailPage from '../pages/customer/ProductDetailPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage';
import OrdersPage from '../pages/customer/OrdersPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import ProfilePage from '../pages/customer/ProfilePage';
import WishlistPage from '../pages/customer/WishlistPage';
import LoginPage from '../pages/customer/auth/LoginPage';
import RegisterPage from '../pages/customer/auth/RegisterPage';
import ForgotPasswordPage from '../pages/customer/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/customer/auth/ResetPasswordPage';
import CompleteRegistrationPage from '../pages/customer/auth/CompleteRegistrationPage';
import GoogleOAuthSuccessPage from '../pages/customer/auth/GoogleOAuthSuccessPage';

// Admin pages
import DashboardPage from '../pages/admin/DashboardPage';
import ProductsListPage from '../pages/admin/products/ProductsListPage';
import ProductCreatePage from '../pages/admin/products/ProductCreatePage';
import ProductEditPage from '../pages/admin/products/ProductEditPage';
import CategoriesPage from '../pages/admin/catalog/CategoriesPage';
import AttributesPage from '../pages/admin/catalog/AttributesPage';
import AdminOrdersListPage from '../pages/admin/orders/OrdersListPage';
import AdminOrderDetailPage from '../pages/admin/orders/OrderDetailPage';
import UsersListPage from '../pages/admin/users/UsersListPage';
import CouponsPage from '../pages/admin/discounts/CouponsPage';
import GlobalOffersPage from '../pages/admin/discounts/GlobalOffersPage';
import GeneralConfigPage from '../pages/admin/config/GeneralConfigPage';
import ThemeConfigPage from '../pages/admin/config/ThemeConfigPage';
import PaymentConfigPage from '../pages/admin/config/PaymentConfigPage';
import ShippingConfigPage from '../pages/admin/config/ShippingConfigPage';
import TaxConfigPage from '../pages/admin/config/TaxConfigPage';
import NotificationConfigPage from '../pages/admin/config/NotificationConfigPage';
import FeatureFlagsPage from '../pages/admin/config/FeatureFlagsPage';
import CmsHomePage from '../pages/admin/cms/CmsHomePage';
import CmsContentPage from '../pages/admin/cms/CmsContentPage';
import ReviewsModerationPage from '../pages/admin/ReviewsModerationPage';

// Operations pages
import OrdersDashboardPage from '../pages/operations/OrdersDashboardPage';
import OrderProcessingPage from '../pages/operations/OrderProcessingPage';

// Error pages
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';

import { ROLES } from '../lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
    },
  },
});

const AppRouter = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider>
          <ErrorBoundary>
            <Routes>

              {/* ── Auth Routes ─────────────────────────────────────── */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
                <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
                <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/complete" element={<AuthGuard><CompleteRegistrationPage /></AuthGuard>} />
              </Route>

              {/* Google OAuth callback handler — no layout wrapper */}
              <Route path="/auth/google/success" element={<GoogleOAuthSuccessPage />} />

              {/* ── Customer Routes ──────────────────────────────────── */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<AuthGuard><WishlistPage /></AuthGuard>} />
                <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />
                <Route path="/order-confirmation/:orderNumber" element={<AuthGuard><OrderConfirmationPage /></AuthGuard>} />
                <Route path="/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
                <Route path="/orders/:orderNumber" element={<AuthGuard><OrderDetailPage /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
              </Route>

              {/* ── Admin Routes ──────────────────────────────────────── */}
              <Route
                path="/admin"
                element={
                  <AuthGuard>
                    <RoleGuard roles={[ROLES.ADMIN]}>
                      <AdminLayout />
                    </RoleGuard>
                  </AuthGuard>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<ProductsListPage />} />
                <Route path="products/new" element={<ProductCreatePage />} />
                <Route path="products/:id/edit" element={<ProductEditPage />} />
                <Route path="catalog/categories" element={<CategoriesPage />} />
                <Route path="catalog/attributes" element={<AttributesPage />} />
                <Route path="orders" element={<AdminOrdersListPage />} />
                <Route path="orders/:orderNumber" element={<AdminOrderDetailPage />} />
                <Route path="users" element={<UsersListPage />} />
                <Route path="discounts/coupons" element={<CouponsPage />} />
                <Route path="discounts/offers" element={<GlobalOffersPage />} />
                <Route path="config/general" element={<GeneralConfigPage />} />
                <Route path="config/theme" element={<ThemeConfigPage />} />
                <Route path="config/payment" element={<PaymentConfigPage />} />
                <Route path="config/shipping" element={<ShippingConfigPage />} />
                <Route path="config/tax" element={<TaxConfigPage />} />
                <Route path="config/notifications" element={<NotificationConfigPage />} />
                <Route path="config/features" element={<FeatureFlagsPage />} />
                <Route path="cms" element={<CmsHomePage />} />
                <Route path="cms/content" element={<CmsContentPage />} />
                <Route path="reviews" element={<ReviewsModerationPage />} />
              </Route>

              {/* ── Operations Routes ─────────────────────────────────── */}
              <Route
                path="/operations"
                element={
                  <AuthGuard>
                    <RoleGuard roles={[ROLES.OPERATIONS]}>
                      <OperationsLayout />
                    </RoleGuard>
                  </AuthGuard>
                }
              >
                <Route index element={<OrdersDashboardPage />} />
                <Route path="orders/:orderNumber" element={<OrderProcessingPage />} />
              </Route>

              {/* ── Error Routes ──────────────────────────────────────── */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />

            </Routes>
          </ErrorBoundary>
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default AppRouter;
