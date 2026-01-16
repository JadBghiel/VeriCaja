import { useState } from 'react';
import { Header } from '@/app/components/Header';
import { DashboardView } from '@/app/components/DashboardView';
import { POSView } from '@/app/components/POSView';
import { SurvivalClockView } from '@/app/components/SurvivalClockView';
import { InventarioView } from '@/app/components/InventarioView';
import { AuditDefenseView } from '@/app/components/AuditDefenseView';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'survival':
        return <SurvivalClockView />;
      case 'inventario':
        return <InventarioView />;
      case 'audit':
        return <AuditDefenseView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {renderView()}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 VeriCaja. Gestión financiera para autónomos.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Ayuda
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Términos
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
