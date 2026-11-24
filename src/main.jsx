import { ADMIN } from './admin/path'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TrackRedirect } from './pages/Track.jsx'
import ShopPage from './pages/ShopPage.jsx'
import { CartProvider } from './cart.jsx'
import { SiteProvider } from './site.jsx'
import { AuthProvider } from './auth.jsx'
import { WishlistProvider } from './wishlist.jsx'
import { LoginPage, RegisterPage } from './pages/Auth.jsx'
import Product from './pages/Product.jsx'
import Invoice from './pages/Invoice.jsx'
import { initTranslation } from './translate.jsx'
import { installPlatform } from './platform.js'

installPlatform() // app mode only: API calls go to the remote server with a token

initTranslation()
import Account, { AccountVerify, AccountOrder } from './pages/Account.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import Login, { ForgotPassword, ResetPassword } from './admin/Login.jsx'
import Dashboard from './admin/Dashboard.jsx'
import Orders from './admin/Orders.jsx'
import OrderDetail from './admin/OrderDetail.jsx'
import Products from './admin/Products.jsx'
import Messages from './admin/Messages.jsx'
import Customers from './admin/Customers.jsx'
import FaqAdmin from './admin/FaqAdmin.jsx'
import Location from './admin/Location.jsx'
import Content from './admin/Content.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SiteProvider>
      <AuthProvider>
      <WishlistProvider>
      <CartProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<Product />} />
        {/* wholesale only: no cart or checkout, buyers request a quote instead */}
        <Route path="/cart" element={<Navigate to="/?quote=wholesale#contact" replace />} />
        <Route path="/checkout" element={<Navigate to="/?quote=wholesale#contact" replace />} />
        <Route path="/order-success/:reference" element={<Navigate to="/account" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track" element={<TrackRedirect />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/verify" element={<AccountVerify />} />
        <Route path="/account/orders/:reference" element={<AccountOrder />} />
        <Route path="/account/orders/:reference/invoice" element={<Invoice />} />
        <Route path={`${ADMIN}/login`} element={<Login />} />
        <Route path={`${ADMIN}/forgot-password`} element={<ForgotPassword />} />
        <Route path={`${ADMIN}/reset-password`} element={<ResetPassword />} />
        <Route path={`${ADMIN}`} element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:reference" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="messages" element={<Messages />} />
          <Route path="customers" element={<Customers />} />
          <Route path="faq" element={<FaqAdmin />} />
          <Route path="location" element={<Location />} />
          <Route path="content" element={<Content />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </CartProvider>
      </WishlistProvider>
      </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>,
)
