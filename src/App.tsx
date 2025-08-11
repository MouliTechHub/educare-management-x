import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import Index from "@/pages/Index";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AcademicYearProvider>
            <Routes>
              <Route path="/*" element={<Index />} />
            </Routes>
            <Toaster />
          </AcademicYearProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
