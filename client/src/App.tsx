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
import Dashboard from "./pages/Dashboard";
import Webinars from "./pages/Webinars";
import Factories from "./pages/Factories";
import FactoryDashboard from "./pages/FactoryDashboard";
import WebinarLiveRoom from "./pages/WebinarLiveRoom";
import PrivateMeetingRoom from "./pages/PrivateMeetingRoom";
import MeetingReelGenerator from "./pages/MeetingReelGenerator";
import Notifications from "./pages/Notifications";

function Router() {
  return (
    <Switch>
      {/* Public routes without Layout */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
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
      <Route path="/webinar-live/:id">
        <ProtectedRoute>
          <WebinarLiveRoom />
        </ProtectedRoute>
      </Route>
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
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
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
