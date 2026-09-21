import React, { useState, useEffect } from 'react';

interface AndroidPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPermissionGranted: boolean;
  onPermissionChanged: (granted: boolean) => void;
  onSimulateDanaTransaction: (sampleText: string) => void;
}

export const AndroidPermissionModal: React.FC<AndroidPermissionModalProps> = ({
  isOpen,
  onClose,
  isPermissionGranted,
  onPermissionChanged,
  onSimulateDanaTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'permission' | 'live-test'>('permission');
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [clipboardMonitoringActive, setClipboardMonitoringActive] = useState(() => {
    return localStorage.getItem('reimu_clipboard_monitor') === 'true';
  });
  const [customDanaAmount, setCustomDanaAmount] = useState('28.000');
  const [customDanaMerchant, setCustomDanaMerchant] = useState('Kopi Kenangan');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('reimu_clipboard_monitor', String(clipboardMonitoringActive));
  }, [clipboardMonitoringActive]);

  if (!isOpen) return null;

  const handleOpenAndroidSettings = () => {
    setRedirectAttempted(true);
    setStatusNotice('Membuka menu Pengaturan Akses Notifikasi Android...');

    // Attempt 1: Deep-link to Android Notification Listener Settings
    try {
      // Android intent URI scheme for Special App Access -> Notification Listener
      window.location.href =
        'intent:#Intent;action=android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS;end';
    } catch (e) {
      console.warn('Intent redirect not supported directly:', e);
    }

    // Attempt 2: Request Web Notifications API if running in browser/PWA
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          setStatusNotice('Izin notifikasi browser berhasil diaktifkan!');
        }
      });
    }

    setTimeout(() => {
      setStatusNotice(
        'Jika layar Pengaturan belum terbuka secara otomatis, silakan ikuti 4 langkah panduan manual di bawah ini.'
      );
    }, 1500);
  };

  const handleTogglePermissionGranted = () => {
    const next = !isPermissionGranted;
    onPermissionChanged(next);
    setStatusNotice(
      next
        ? 'Status izin deteksi otomatis telah ditandai: AKTIF (DI-ALLOW).'
        : 'Status izin deteksi otomatis ditandai: NONAKTIF.'
    );
  };

  const handleSimulateDanaQuick = (amount: string, merchant: string) => {
    const text = `DANA: Pembayaran sebesar Rp ${amount} ke ${merchant} telah berhasil.`;
    onSimulateDanaTransaction(text);
    onClose();
  };

  const handleReadClipboardNow = async () => {
    try {
      if (!navigator.clipboard) {
        setStatusNotice('Fitur clipboard tidak didukung di browser ini.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setStatusNotice('Papan klip (clipboard) masih kosong. Salin pesan notifikasi DANA terlebih dahulu.');
        return;
      }
      onSimulateDanaTransaction(text);
      onClose();
    } catch (err) {
      setStatusNotice('Gagal membaca clipboard. Pastikan izin clipboard diizinkan di browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#151921] border border-[#28303F] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col font-sans max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#28303F] bg-[#1C222D]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2A1711] border border-[#FF5E36]/40 flex items-center justify-center text-[#FF5E36]">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[13px] font-bold text-white uppercase tracking-wider">
                Izin Deteksi Transaksi Otomatis
              </span>
              <span className="font-mono text-[10px] text-[#94A3B8]">
                Akses Notifikasi Android &amp; Uji Live
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#28303F] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#28303F] bg-[#12151C]">
          <button
            type="button"
            onClick={() => setActiveTab('permission')}
            className={`flex-1 py-2.5 font-mono text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'permission'
                ? 'border-[#FF5E36] text-[#FF5E36] bg-[#1C222D]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">settings_suggest</span>
            <span>Izin &amp; Pengaturan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live-test')}
            className={`flex-1 py-2.5 font-mono text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'live-test'
                ? 'border-[#FF5E36] text-[#FF5E36] bg-[#1C222D]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span>Uji Live DANA</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3.5 text-[#F1F5F9]">
          {statusNotice && (
            <div className="p-3 rounded-xl bg-[#2A1711] border border-[#FF5E36]/40 text-[#FF5E36] font-mono text-[11px] flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
              <span className="leading-relaxed">{statusNotice}</span>
            </div>
          )}

          {activeTab === 'permission' ? (
            <>
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isPermissionGranted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isPermissionGranted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPermissionGranted ? 'verified_user' : 'warning'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-[12px] font-bold uppercase">
                      Status: {isPermissionGranted ? 'Diizinkan (Allow)' : 'Belum Diizinkan'}
                    </span>
                    <span className="font-body-sm text-[11px] text-[#94A3B8]">
                      {isPermissionGranted
                        ? 'Sistem siap membaca mutasi dari DANA, GoPay & Bank'
                        : 'Android mewajibkan izin "Akses Notifikasi" agar transaksi otomatis terdeteksi'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePermissionGranted}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    isPermissionGranted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  {isPermissionGranted ? 'Aktif' : 'Tandai Izin'}
                </button>
              </div>

              {/* Primary Action Button: Open Android Settings */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenAndroidSettings}
                  className="w-full h-12 rounded-xl bg-[#FF5E36] hover:bg-[#E04822] text-white font-mono text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,94,54,0.3)] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">settings_applications</span>
                  <span>Buka Pengaturan Android (Allow Detection)</span>
                </button>
                <span className="text-center font-mono text-[10px] text-[#94A3B8]">
                  Menuju ke menu <i>Akses Notifikasi Khusus (Special App Access)</i>
                </span>
              </div>

              {/* Step by Step Guide for Android Users */}
              <div className="p-3.5 rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col gap-2.5">
                <span className="font-mono text-[11px] font-bold uppercase text-[#FF5E36] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">touch_app</span>
                  <span>Panduan Langkah di HP Android:</span>
                </span>
                <ol className="flex flex-col gap-2 font-mono text-[11px] text-[#CBD5E1]">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#151921] border border-[#28303F] flex items-center justify-center text-[10px] font-bold text-[#FF5E36] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Buka menu <b>Pengaturan HP (Settings)</b> di Android Anda.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#151921] border border-[#28303F] flex items-center justify-center text-[10px] font-bold text-[#FF5E36] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Pilih menu <b>Aplikasi &amp; Notifikasi</b> &rarr; <b>Akses Aplikasi Khusus (Special App Access)</b>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#151921] border border-[#28303F] flex items-center justify-center text-[10px] font-bold text-[#FF5E36] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Pilih <b>Akses Notifikasi (Device &amp; app notifications)</b>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#151921] border border-[#28303F] flex items-center justify-center text-[10px] font-bold text-[#FF5E36] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Cari <b>ReimuWallet</b> dan aktifkan sakelar ke posisi <b>Izinkan (Allow)</b>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Privacy Guarantee Note */}
              <div className="p-3 rounded-xl bg-[#12151C] border border-[#28303F] flex items-center gap-2.5 text-[#94A3B8]">
                <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">lock</span>
                <span className="font-body-sm text-[11px] leading-relaxed">
                  <b>Privasi 100% Offline:</b> Notifikasi diproses langsung di dalam perangkat Anda. Tidak ada data yang dikirim ke server luar.
                </span>
              </div>
            </>
          ) : (
            <>
              {/* LIVE TEST TAB */}
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col gap-1.5">
                  <span className="font-mono text-[12px] font-bold text-[#FF5E36] uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">sensors</span>
                    <span>Cara Menguji Transaksi DANA Secara Langsung (Live)</span>
                  </span>
                  <p className="font-body-sm text-[12px] text-[#94A3B8] leading-relaxed">
                    Karena browser web membatasi pembacaan push notification dari aplikasi lain secara diam-diam, Anda dapat menguji dengan 2 cara mudah di bawah:
                  </p>
                </div>

                {/* Method 1: Live Simulation Button */}
                <div className="p-3.5 rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#FF5E36]">bolt</span>
                      <span>1. Tembak Notifikasi DANA Live</span>
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#FF5E36]/20 text-[#FF5E36] font-bold">
                      Instan
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateDanaQuick('28.000', 'Kopi Kenangan')}
                      className="p-2.5 rounded-xl bg-[#151921] hover:bg-[#28303F] border border-[#28303F] hover:border-[#FF5E36] flex flex-col items-center gap-1 transition-all active:scale-95"
                    >
                      <span className="font-mono text-[11px] font-bold text-white">Rp 28.000</span>
                      <span className="font-mono text-[9px] text-[#94A3B8]">Kopi Kenangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateDanaQuick('50.000', 'HokBen')}
                      className="p-2.5 rounded-xl bg-[#151921] hover:bg-[#28303F] border border-[#28303F] hover:border-[#FF5E36] flex flex-col items-center gap-1 transition-all active:scale-95"
                    >
                      <span className="font-mono text-[11px] font-bold text-white">Rp 50.000</span>
                      <span className="font-mono text-[9px] text-[#94A3B8]">HokBen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateDanaQuick('150.000', 'Transfer DANA')}
                      className="p-2.5 rounded-xl bg-[#151921] hover:bg-[#28303F] border border-[#28303F] hover:border-[#FF5E36] flex flex-col items-center gap-1 transition-all active:scale-95"
                    >
                      <span className="font-mono text-[11px] font-bold text-white">Rp 150.000</span>
                      <span className="font-mono text-[9px] text-[#94A3B8]">Transfer DANA</span>
                    </button>
                  </div>

                  {/* Custom Amount Form */}
                  <div className="pt-2 border-t border-[#28303F] flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">
                      Atau Masukkan Nominal Sendiri:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDanaAmount}
                        onChange={(e) => setCustomDanaAmount(e.target.value)}
                        placeholder="Contoh: 75.000"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#151921] border border-[#28303F] text-white font-mono text-[12px] focus:outline-none focus:border-[#FF5E36]"
                      />
                      <input
                        type="text"
                        value={customDanaMerchant}
                        onChange={(e) => setCustomDanaMerchant(e.target.value)}
                        placeholder="Merchant"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#151921] border border-[#28303F] text-white font-mono text-[12px] focus:outline-none focus:border-[#FF5E36]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSimulateDanaQuick(customDanaAmount, customDanaMerchant)}
                        className="px-3.5 py-2 rounded-xl bg-[#FF5E36] text-white font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#E04822] active:scale-95 transition-all"
                      >
                        Kirim
                      </button>
                    </div>
                  </div>
                </div>

                {/* Method 2: Live Clipboard Monitor */}
                <div className="p-3.5 rounded-xl bg-[#1C222D] border border-[#28303F] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">content_paste</span>
                      <span>2. Salin Notifikasi / SMS Asli dari DANA</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setClipboardMonitoringActive(!clipboardMonitoringActive)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase border transition-all ${
                        clipboardMonitoringActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#151921] text-[#94A3B8] border-[#28303F]'
                      }`}
                    >
                      {clipboardMonitoringActive ? 'Auto-Paste Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  <p className="font-body-sm text-[11px] text-[#94A3B8] leading-relaxed">
                    Salin (Copy) teks SMS atau pesan riwayat transaksi dari aplikasi DANA asli di HP Anda, lalu tekan tombol di bawah ini:
                  </p>

                  <button
                    type="button"
                    onClick={handleReadClipboardNow}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    <span>Deteksi dari Salinan Papan Klip (Clipboard)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#28303F] bg-[#1C222D] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#94A3B8]">
            {isPermissionGranted ? 'Status: Izin Aktif' : 'Status: Belum Diizinkan'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#28303F] hover:bg-[#333C4D] text-white font-mono text-[11px] font-bold uppercase transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
