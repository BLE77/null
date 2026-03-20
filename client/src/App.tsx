import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { Navigation } from "@/components/Navigation";
import { CartSidebar } from "@/components/CartSidebar";
import { AdminGuard } from "@/components/AdminGuard";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/AdminDashboard";
import AgentDemo from "@/pages/AgentDemo";
import NotFound from "@/pages/not-found";
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi-config';

function Router() {
  return (
    <>
      <Navigation />
      <CartSidebar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/about" component={About} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/admin">
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        </Route>
        <Route path="/demo" component={AgentDemo} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
