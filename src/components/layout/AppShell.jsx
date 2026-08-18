import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
