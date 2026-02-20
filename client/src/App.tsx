import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Webinars from "./pages/Webinars";
import Factories from "./pages/Factories";

function Router() {
  return (
    <Switch>
      {/* Public routes without Layout */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Dashboard without Layout (has its own sidebar) */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/webinars" component={Webinars} />
      <Route path="/factories" component={Factories} />
      
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
