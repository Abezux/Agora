import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  History,
  FileText,
  BarChart3,
  Wifi,
  Settings,
  LogOut,
  User,
  Store,
  ShoppingBag,
  Pill,
  UtensilsCrossed,
  Scissors,
  MoreVertical,
  X,
} from 'lucide-react';
import { api } from '@/services/api';
import { StoreSettings } from '@/types';
import { useAuth } from '@/context/AuthContext';
import SettingsModal from '@/components/settings/SettingsModal';
import AgoraLogo from './AgoraLogo';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const BUSINESS_TYPE_BADGES: Record<string, { label: string; icon: React.ElementType }> = {
  MINI_SHOP: { label: 'Mini-Shop', icon: ShoppingBag },
  PHARMACY: { label: 'Pharmacy', icon: Pill },
  RESTAURANT: { label: 'Restaurant', icon: UtensilsCrossed },
  SALON: { label: 'Salon', icon: Scissors },
  GENERAL_RETAIL: { label: 'Retail', icon: Store },
};

export const navLinks = [
  { id: 'sell', label: 'Sell', icon: ShoppingCart },
  { id: 'inventory', label: 'Products', icon: Package },
  { id: 'sales', label: 'Sales', icon: History },
  { id: 'audit', label: 'Activity', icon: FileText },
  { id: 'analytics', label: 'Reports', icon: BarChart3 },
];

export function Sidebar({ activeTab, onNavigate }: NavbarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-agora-card border-r border-agora-border p-3 justify-between h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-agora-ink-muted px-3 block mb-2">
          Navigation
        </span>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-agora-terracotta text-agora-card font-serif font-bold shadow-sm'
                  : 'text-agora-ink-muted hover:text-agora-ink hover:bg-agora-bg'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-agora-card' : 'text-agora-ink-muted'}`}
              />
              <span>{link.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-agora-border text-center">
        <span className="text-[10px] font-bold text-agora-brass uppercase tracking-widest block">
          Agora Digital Ledger
        </span>
      </div>
    </aside>
  );
}

export default function Navbar({ activeTab, onNavigate }: NavbarProps) {
  const { user, store, signOut, refreshStore } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: store?.store_name || 'Agora Kiosk POS',
    currency_symbol: store?.currency_symbol || '$',
    currency_code: store?.currency_code || 'USD',
    low_stock_alerts_enabled: true,
    business_type: store?.business_type || 'GENERAL_RETAIL',
    expiry_alert_days: store?.expiry_alert_days || 30,
    custom_attributes: [],
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const loadSettings = () => {
    api
      .getSettings()
      .then(setSettings)
      .catch(() => {});
  };

  useEffect(() => {
    if (store) {
      setSettings({
        store_name: store.store_name,
        currency_symbol: store.currency_symbol,
        currency_code: store.currency_code,
        low_stock_alerts_enabled: true,
        business_type: store.business_type,
        expiry_alert_days: store.expiry_alert_days,
        custom_attributes: store.custom_attributes || [],
      });
    } else {
      loadSettings();
    }
  }, [store]);

  const handleSaveSettings = async (newSettings: StoreSettings) => {
    await api.updateSettings(newSettings);
    await refreshStore();
    loadSettings();
    window.location.reload();
  };

  const badge =
    BUSINESS_TYPE_BADGES[settings.business_type || 'GENERAL_RETAIL'] ||
    BUSINESS_TYPE_BADGES.GENERAL_RETAIL;
  const BadgeIcon = badge.icon;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-agora-card border-b border-agora-border text-agora-ink shadow-sm min-h-[56px] sm:min-h-[65px] flex items-center py-2">
        <div className="w-full mx-auto px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <AgoraLogo size="md" />

            <div className="hidden sm:block h-7 w-[1px] bg-agora-border mx-0.5" />

            <div className="min-w-0">
              <h1 className="font-serif font-bold text-sm sm:text-base tracking-tight leading-tight flex items-center gap-1.5 text-agora-ink">
                <span className="truncate max-w-[130px] sm:max-w-[200px] lg:max-w-none">
                  {settings.store_name}
                </span>
                <span className="text-[11px] sm:text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-agora-brass/10 text-agora-brass border border-agora-brass/30 flex items-center gap-1 shrink-0">
                  <BadgeIcon className="w-3 h-3 text-agora-brass" />{' '}
                  <span className="hidden sm:inline">{badge.label}</span>
                </span>
              </h1>

              {/* Desktop Status Sub-bar (hidden on mobile/tablet < lg) */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-agora-ink-muted mt-0.5">
                <span className="flex items-center gap-1 text-agora-sage font-medium">
                  <Wifi className="w-3 h-3 text-agora-sage" />
                  <span>Cloud Active</span>
                </span>
                {user?.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-agora-ink-muted">
                      <User className="w-3 h-3 text-agora-brass" />
                      <span className="truncate max-w-[160px]">{user.email}</span>
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  Currency:{' '}
                  <strong className="font-serif text-agora-ink">
                    {settings.currency_symbol} ({settings.currency_code})
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons (lg: and up) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-agora-brass/10 hover:bg-agora-brass/20 text-agora-brass border border-agora-brass/30 transition-all"
              title="Store settings"
            >
              <Settings className="w-4 h-4 text-agora-brass" />
            </button>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl bg-agora-brick/10 hover:bg-agora-brick/20 text-agora-brick border border-agora-brick/30 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-agora-brick" />
            </button>
          </div>

          {/* Mobile/Tablet Kebab Action Menu Toggle (< lg) */}
          <div className="flex lg:hidden items-center gap-2 relative shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-agora-bg border border-agora-border text-agora-ink hover:bg-agora-border transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-agora-terracotta" />
              ) : (
                <MoreVertical className="w-5 h-5 text-agora-ink" />
              )}
            </button>

            {/* Mobile Dropdown Card */}
            {isMobileMenuOpen && (
              <div
                className="absolute right-0 top-12 w-64 bg-agora-card border border-agora-border rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="bg-agora-bg p-2.5 rounded-xl border border-agora-border space-y-1">
                  <div className="flex items-center justify-between text-agora-sage font-semibold">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-agora-sage" /> Cloud Active
                    </span>
                    <span className="font-serif font-bold text-agora-ink">
                      {settings.currency_symbol} ({settings.currency_code})
                    </span>
                  </div>
                  {user?.email && (
                    <div className="text-[11px] text-agora-ink-muted truncate flex items-center gap-1">
                      <User className="w-3 h-3 text-agora-brass shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-agora-brass/10 text-agora-brass font-bold hover:bg-agora-brass/20 transition-all text-left"
                  >
                    <Settings className="w-4 h-4 text-agora-brass" />
                    <span>Store Settings</span>
                  </button>

                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-agora-brick/10 text-agora-brick font-bold hover:bg-agora-brick/20 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4 text-agora-brick" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-agora-card/95 backdrop-blur-md border-t border-agora-border text-agora-ink shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
                  isActive
                    ? 'text-agora-terracotta bg-agora-terracotta/15 font-bold'
                    : 'text-agora-ink-muted hover:text-agora-ink active:bg-agora-bg'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1 ${isActive ? 'text-agora-terracotta' : 'text-agora-ink-muted'}`}
                />
                <span className="text-[10px] leading-tight truncate w-full">{link.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </>
  );
}
