import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import DashboardPage from "./pages/Dashboard";
import UploadLogsPage from "./pages/UploadLogs";
import AnalysisPage from "./pages/Analysis";
import SummariesPage from "./pages/Summaries";
import AlertsPage from "./pages/Alerts";
import SecurityPage from "./pages/Security";
import SettingsPage from "./pages/Settings";
import NotFoundPage from "./pages/NotFound";
import { getStoredTheme, setStoredTheme } from "./lib/storage";

function usePageTitle() {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/upload")) return "Upload Logs";
    if (pathname.startsWith("/analysis")) return "Log Analysis";
    if (pathname.startsWith("/summaries")) return "Summaries";
    if (pathname.startsWith("/alerts")) return "System Alerts";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Cloud Log Summarization";
  }, [pathname]);
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme());
  const title = usePageTitle();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    setStoredTheme(theme);
  }, [theme]);

  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-72">
          <Navbar
            title={title}
            onOpenSidebar={() => setSidebarOpen(true)}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          />

          <main className="mx-auto max-w-[1280px] px-4 py-4">
            <Routes>
              <Route path="/" element={<DashboardPage analysis={analysis} />} />
              <Route path="/upload" element={<UploadLogsPage onAnalyzed={setAnalysis} />} />
              <Route path="/analysis" element={<AnalysisPage analysis={analysis} />} />
              <Route path="/security" element={<SecurityPage analysis={analysis} />} />
              <Route path="/summaries" element={<SummariesPage latestAnalysis={analysis} />} />
              <Route path="/alerts" element={<AlertsPage analysis={analysis} />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
