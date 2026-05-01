import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Tools from "./pages/Tools";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Disclosures from "./pages/Disclosures";
import Contact from "./pages/Contact";
import Assessments from "./pages/Assessments";
import AssessmentDetail from "./pages/AssessmentDetail";
import Herbs from "./pages/Herbs";
import HerbDetail from "./pages/HerbDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/articles/:slug" component={ArticleDetail} />
      <Route path="/tools-we-recommend" component={Tools} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclosures" component={Disclosures} />
      <Route path="/contact" component={Contact} />
      <Route path="/assessments" component={Assessments} />
      <Route path="/assessments/:slug" component={AssessmentDetail} />
      <Route path="/herbs" component={Herbs} />
      <Route path="/herbs/:slug" component={HerbDetail} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
