import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import DashboardLayout from "./components/DashboardLayout";

// Pages - Eager loading for critical pages
import HomePage from "./pages/Home"; // Nova Home Page
import VisaoGeralPage from "./pages/VisaoGeral";
import NotFound from "./pages/NotFound";

// Pages - Lazy loading for better performance
const LeadsPage = lazy(() => import("./pages/Leads"));
const RespostasPage = lazy(() => import("./pages/Respostas"));
const FuncionalidadesPage = lazy(() => import("./pages/Funcionalidades"));
const InsightsPage = lazy(() => import("./pages/Insights"));
const FeedbacksPage = lazy(() => import("./pages/Feedbacks"));
const ConfigPage = lazy(() => import("./pages/Config"));
const DocumentoTecnicoPage = lazy(() => import("./pages/DocumentoTecnico"));
const VoiceInteractionPage = lazy(() => import("./pages/VoiceInteraction"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Rota da Nova Home Page Imersiva */}
              <Route path="/" element={<HomePage />} />

              {/* Rota de Voice Interaction (standalone) */}
              <Route path="/voice" element={<VoiceInteractionPage />} />

              {/* Rotas do Dashboard Aninhadas */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<VisaoGeralPage />} /> {/* /dashboard */}
                <Route path="leads" element={<LeadsPage />} />
                <Route path="respostas" element={<RespostasPage />} />
                <Route path="funcionalidades" element={<FuncionalidadesPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="feedbacks" element={<FeedbacksPage />} />
                <Route path="documento-tecnico" element={<DocumentoTecnicoPage />} />
                <Route path="config" element={<ConfigPage />} />
              </Route>

              {/* Rota de Catch-All (404) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;