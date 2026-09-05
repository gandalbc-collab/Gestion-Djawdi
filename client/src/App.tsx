import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Revenues from "./pages/Revenues";
import BudgetPage from "./pages/Budget";
import ExpensesPage from "./pages/Expenses";
import Caisse from "./pages/Caisse";
import Synthesis from "./pages/Synthesis";
import Programmation from "./pages/Programmation";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Learn from "./pages/Learn";
import CourseDetail from "./pages/CourseDetail";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminComments from "./pages/admin/AdminComments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAds from "./pages/admin/AdminAds";
import AdminContact from "./pages/admin/AdminContact";
import AdminSettings from "./pages/admin/AdminSettings";
import AccountSuspended from "./pages/AccountSuspended";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/update-password" component={UpdatePassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/revenues" component={Revenues} />
      <Route path="/budget" component={BudgetPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/caisse" component={Caisse} />
      <Route path="/synthesis" component={Synthesis} />
      <Route path="/programmation" component={Programmation} />
      <Route path="/profile" component={Profile} />
      <Route path="/learn" component={Learn} />
      <Route path="/learn/:slug" component={CourseDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/suspended" component={AccountSuspended} />
      {/* Admin panel — secret URL, role=admin guard inside each page */}
      <Route path="/djawdi-cimbailo-admin-7944" component={AdminDashboard} />
      <Route path="/djawdi-cimbailo-admin-7944/courses" component={AdminCourses} />
      <Route path="/djawdi-cimbailo-admin-7944/categories" component={AdminCategories} />
      <Route path="/djawdi-cimbailo-admin-7944/comments" component={AdminComments} />
      <Route path="/djawdi-cimbailo-admin-7944/users" component={AdminUsers} />
      <Route path="/djawdi-cimbailo-admin-7944/notifications" component={AdminNotifications} />
      <Route path="/djawdi-cimbailo-admin-7944/ads" component={AdminAds} />
      <Route path="/djawdi-cimbailo-admin-7944/contact" component={AdminContact} />
      <Route path="/djawdi-cimbailo-admin-7944/settings" component={AdminSettings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
