import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Webinars from "./pages/Webinars";
import Factories from "./pages/Factories";
import FactoryDashboard from "./pages/FactoryDashboard";
import WebinarLiveRoom from "./pages/WebinarLiveRoom";
import WebinarLive from "./pages/WebinarLive";
import PrivateMeetingRoom from "./pages/PrivateMeetingRoom";
import MeetingReelGenerator from "./pages/MeetingReelGenerator";
import Notifications from "./pages/Notifications";
import AIReelEditor from "./pages/AIReelEditor";
// ── Detail Pages ──────────────────────────────────────────────────────────────
import WebinarDetail from "./pages/WebinarDetail";
import FactoryDetail from "./pages/FactoryDetail";
import ProductDetail from "./pages/ProductDetail";
import MeetingDetail from "./pages/MeetingDetail";
// ── New Core Pages ────────────────────────────────────────────────────────────
import Inquiries from "./pages/Inquiries";
import Reports from "./pages/Reports";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import AIAssistant from "./pages/AIAssistant";

function Router() {
  return (
    <Switch>
      {/* Public routes without Layout */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Onboarding (protected, no sidebar) */}
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>

      {/* Protected routes without Layout (has its own sidebar) */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/webinars">
        <ProtectedRoute>
          <Webinars />
        </ProtectedRoute>
      </Route>
      <Route path="/factories">
        <ProtectedRoute>
          <Factories />
        </ProtectedRoute>
      </Route>
      <Route path="/factory-dashboard">
        <ProtectedRoute requiredRole="factory">
          <FactoryDashboard />
        </ProtectedRoute>
      </Route>

      {/* Webinar Live Rooms */}
      <Route path="/webinar-live/:id">
        <ProtectedRoute>
          <WebinarLive />
        </ProtectedRoute>
      </Route>
      <Route path="/webinar-live-legacy/:id">
        <ProtectedRoute>
          <WebinarLiveRoom />
        </ProtectedRoute>
      </Route>

      {/* Meeting rooms */}
      <Route path="/meeting/:id">
        <ProtectedRoute>
          <PrivateMeetingRoom />
        </ProtectedRoute>
      </Route>
      <Route path="/meeting-reel-generator/:id">
        <ProtectedRoute>
          <MeetingReelGenerator />
        </ProtectedRoute>
      </Route>

      {/* AI Reel Editor */}
      <Route path="/ai-reel-editor/:id">
        <ProtectedRoute>
          <AIReelEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-reel-editor">
        <ProtectedRoute>
          <AIReelEditor />
        </ProtectedRoute>
      </Route>

      {/* Notifications */}
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>

      {/* ── Detail Pages ── */}
      <Route path="/webinar/:id">
        <ProtectedRoute>
          <WebinarDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/factory/:id">
        <ProtectedRoute>
          <FactoryDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/product/:id">
        <ProtectedRoute>
          <ProductDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/meeting-detail/:id">
        <ProtectedRoute>
          <MeetingDetail />
        </ProtectedRoute>
      </Route>

      {/* ── New Core Pages ── */}
      <Route path="/inquiries">
        <ProtectedRoute>
          <Inquiries />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/subscription">
        <ProtectedRoute>
          <Subscription />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-assistant">
        <ProtectedRoute>
          <AIAssistant />
        </ProtectedRoute>
      </Route>

      {/* Routes with Layout */}
      <Route path="/">
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
