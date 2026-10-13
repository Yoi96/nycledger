import React, { useState, useEffect, useMemo } from 'react';
import { OMNYState, PaymentMethod } from '../../types';
import { LocalDB, MTA_FARE } from '../../services/storage';
import {
  X,
  Radio,
  PlusCircle,
  Bus,
  Train,
  CheckCircle2,
  Sparkles,
  Edit2,
  Check,
  Plus,
  Minus,
  Coins,
  MapPin,
  RefreshCw,
  Search,
  Navigation,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OMNYModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export interface NYCStation {
  name: string;
  fullAddress: string;
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  lines: string;
}

export const POPULAR_NYC_STATIONS: NYCStation[] = [
  {
    name: 'Times Sq - 42 St',
    fullAddress: 'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036',
    borough: 'Manhattan',
    lines: '1, 2, 3, 7, N, Q, R, W, S',
  },
  {
    name: 'Grand Central - 42 St',
    fullAddress: 'Grand Central - 42 St, 89 E 42nd St, New York, NY 10017',
    borough: 'Manhattan',
    lines: '4, 5, 6, 7, S',
  },
  {
    name: '34 St - Herald Sq',
    fullAddress: '34 St - Herald Sq, Broadway & W 34th St, New York, NY 10001',
    borough: 'Manhattan',
    lines: 'B, D, F, M, N, Q, R, W',
  },
  {
    name: '34 St - Penn Station',
    fullAddress: '34 St - Penn Station, 2 Pennsylvania Plaza, New York, NY 10001',
    borough: 'Manhattan',
    lines: '1, 2, 3, A, C, E',
  },
  {
    name: '14 St - Union Sq',
    fullAddress: '14 St - Union Sq, Broadway & E 14th St, New York, NY 10003',
    borough: 'Manhattan',
    lines: '4, 5, 6, L, N, Q, R, W',
  },
  {
    name: 'Lexington Ave - 59 St',
    fullAddress: 'Lexington Ave - 59 St, 750 Lexington Ave, New York, NY 10022',
    borough: 'Manhattan',
    lines: '4, 5, 6, N, R, W',
  },
  {
    name: 'Fulton St',
    fullAddress: 'Fulton St, 200 Broadway, New York, NY 10038',
    borough: 'Manhattan',
    lines: '2, 3, 4, 5, A, C, J, Z',
  },
  {
    name: 'W 4 St - Wash Sq',
    fullAddress: 'W 4 St - Wash Sq, W 4th St & 6th Ave, New York, NY 10014',
    borough: 'Manhattan',
    lines: 'A, B, C, D, E, F, M',
  },
  {
    name: 'Columbus Circle - 59 St',
    fullAddress: 'Columbus Circle - 59 St, 10 Columbus Circle, New York, NY 10019',
    borough: 'Manhattan',
    lines: '1, A, B, C, D',
  },
  {
    name: 'Canal St',
    fullAddress: 'Canal St, Canal St & Broadway, New York, NY 10013',
    borough: 'Manhattan',
    lines: '6, J, N, Q, R, W, Z',
  },
  {
    name: 'Wall St',
    fullAddress: 'Wall St, Wall St & Broadway, New York, NY 10005',
    borough: 'Manhattan',
    lines: '2, 3, 4, 5',
  },
  {
    name: 'Atlantic Av - Barclays Ctr',
    fullAddress: 'Atlantic Av - Barclays Ctr, 625 Atlantic Ave, Brooklyn, NY 11217',
    borough: 'Brooklyn',
    lines: '2, 3, 4, 5, B, D, N, Q, R',
  },
  {
    name: 'Jay St - MetroTech',
    fullAddress: 'Jay St - MetroTech, 370 Jay St, Brooklyn, NY 11201',
    borough: 'Brooklyn',
    lines: 'A, C, F, R',
  },
  {
    name: 'Bedford Ave',
    fullAddress: 'Bedford Ave, N 7th St & Bedford Ave, Brooklyn, NY 11211',
    borough: 'Brooklyn',
    lines: 'L',
  },
  {
    name: 'Jackson Heights - Roosevelt Ave',
    fullAddress: 'Jackson Heights - Roosevelt Ave, 74-01 Roosevelt Ave, Jackson Heights, NY 11372',
    borough: 'Queens',
    lines: '7, E, F, M, R',
  },
  {
    name: 'Flushing - Main St',
    fullAddress: 'Flushing - Main St, Roosevelt Ave & Main St, Flushing, NY 11354',
    borough: 'Queens',
    lines: '7',
  },
  {
    name: 'Court Sq',
    fullAddress: 'Court Sq, 45-40 23rd St, Long Island City, NY 11101',
    borough: 'Queens',
    lines: '7, E, G, M',
  },
  {
    name: 'Astoria - Ditmars Blvd',
    fullAddress: 'Astoria - Ditmars Blvd, 31-01 Ditmars Blvd, Astoria, NY 11105',
    borough: 'Queens',
    lines: 'N, W',
  },
  {
    name: '125 St - Harlem',
    fullAddress: '125 St - Harlem, W 125th St & Lenox Ave, New York, NY 10027',
    borough: 'Manhattan',
    lines: '2, 3, 4, 5, 6',
  },
  {
    name: '161 St - Yankee Stadium',
    fullAddress: '161 St - Yankee Stadium, 161st St & River Ave, Bronx, NY 10451',
    borough: 'Bronx',
    lines: '4, B, D',
  },
  {
    name: 'St. George Terminal',
    fullAddress: 'St. George Ferry Terminal, 1 Ferry Terminal Dr, Staten Island, NY 10301',
    borough: 'Staten Island',
    lines: 'SIR',
  },
];

// Helper to determine if an address is bare borough/city (e.g. just "Brooklyn", "Manhattan", "Brooklyn, NY")
export const isBareBoroughOrIncomplete = (addr: string): boolean => {
  if (!addr || !addr.trim()) return true;
  const clean = addr.trim().replace(/, USA$/i, '').trim();
  if (/^(brooklyn|manhattan|queens|the bronx|bronx|staten island|new york|nyc)(,\s*(ny|new york))?(\s*\d{5})?$/i.test(clean)) {
    return true;
  }
  const hasStreetIndicator = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|way|plaza|pkwy|parkway|dr|drive|ct|court|broadway|lane|ln|terminal|station|pier|concourse|center|ctr)\b/i.test(clean);
  const hasHouseOrIntersection = /\d+\s+[a-z]|&|\b(corner|at)\b/i.test(clean);
  return !hasStreetIndicator && !hasHouseOrIntersection;
};

// Expand a bare borough or incomplete query into a full Google Maps NYC address
export const expandToFullGoogleAddress = (addr: string): string => {
  if (!isBareBoroughOrIncomplete(addr)) return addr;
  const lower = addr.toLowerCase();
  if (lower.includes('brooklyn')) {
    return 'Atlantic Av - Barclays Ctr, 625 Atlantic Ave, Brooklyn, NY 11217';
  }
  if (lower.includes('queens')) {
    return 'Flushing - Main St, Roosevelt Ave & Main St, Flushing, NY 11354';
  }
  if (lower.includes('bronx')) {
    return '161 St - Yankee Stadium, 161st St & River Ave, Bronx, NY 10451';
  }
  if (lower.includes('staten')) {
    return 'St. George Ferry Terminal, 1 Ferry Terminal Dr, Staten Island, NY 10301';
  }
  // Default Manhattan hub
  return 'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036';
};

export const OMNYModal: React.FC<OMNYModalProps> = ({
  isOpen,
  onClose,
  onTransactionAdded,
}) => {
  const [omnyState, setOmnyState] = useState<OMNYState>(LocalDB.getOMNY());
  const [tapMessage, setTapMessage] = useState<string | null>(null);
  const [isTapping, setIsTapping] = useState(false);

  // User Location (Auto Real-Time Device Detection + Manual Override)
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('omny_user_custom_location');
      if (custom) return expandToFullGoogleAddress(custom);
      const saved = sessionStorage.getItem('omny_real_location');
      if (saved) return expandToFullGoogleAddress(saved);
    }
    return 'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036';
  });

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Manual location editing / search state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedBoroughFilter, setSelectedBoroughFilter] = useState<'All' | 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx'>('All');

  // Balance editing
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [customBalanceInput, setCustomBalanceInput] = useState('');

  // Customizable Ticket Fee
  const [isEditingFare, setIsEditingFare] = useState(false);
  const [customFareInput, setCustomFareInput] = useState('');

  // Reload payment selection
  const [reloadPaymentMethod, setReloadPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [customReloadAmount, setCustomReloadAmount] = useState('');

  const refreshState = () => {
    const s = LocalDB.getOMNY();
    setOmnyState(s);
  };

  // Current active ticket fee (defaults to 3.00, allows user custom ticket fee)
  const currentFare = typeof omnyState.farePrice === 'number' && omnyState.farePrice > 0
    ? omnyState.farePrice
    : LocalDB.getOMNYFare();

  const handleSaveCustomLocation = (location: string) => {
    const trimmed = location.trim();
    if (!trimmed) return;
    const full = expandToFullGoogleAddress(trimmed);
    setCurrentLocation(full);
    localStorage.setItem('omny_user_custom_location', full);
    sessionStorage.setItem('omny_real_location', full);
    setIsEditingLocation(false);
    setLocationSearchInput('');
    setTapMessage(`📍 Full Address verified: ${full}`);
    setTimeout(() => setTapMessage(null), 3500);
  };

  const handleCopyAddress = () => {
    if (!currentLocation) return;
    navigator.clipboard.writeText(currentLocation);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = locationSearchInput.trim();
    if (!query) return;
    setIsSearchingLocation(true);
    try {
      // Check if user queried an exact station name locally first
      const qLower = query.toLowerCase();
      const localMatch = POPULAR_NYC_STATIONS.find(
        (st) =>
          st.name.toLowerCase().includes(qLower) ||
          qLower.includes(st.name.toLowerCase()) ||
          st.fullAddress.toLowerCase().includes(qLower)
      );

      if (localMatch) {
        handleSaveCustomLocation(localMatch.fullAddress);
        setIsSearchingLocation(false);
        return;
      }

      const res = await fetch(`/api/maps/geocode/forward?address=${encodeURIComponent(query + ', New York')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.formatted_address) {
          handleSaveCustomLocation(data.formatted_address);
          return;
        } else if (data.results && data.results.length > 0) {
          const addr = data.results[0].formatted_address || query;
          handleSaveCustomLocation(addr.replace(/, USA$/i, '').trim());
          return;
        }
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err);
    } finally {
      setIsSearchingLocation(false);
    }
    // Fallback: expand query directly to full address
    handleSaveCustomLocation(query);
  };

  // Automatically acquire real-time device location and geocode to full Google Maps address
  const handleAutoLocateGPS = async () => {
    setIsLocatingGPS(true);

    const resolveCoords = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/maps/geocode/reverse?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          const place = data.formatted_address || data.nearest_station;
          if (place && place !== 'Local Area' && place !== 'Current Location') {
            const clean = expandToFullGoogleAddress(place.replace(/, USA$/i, '').trim());
            setCurrentLocation(clean);
            sessionStorage.setItem('omny_real_location', clean);
            localStorage.setItem('omny_user_custom_location', clean);
            setTapMessage(`📍 Live address detected: ${clean}`);
            setTimeout(() => setTapMessage(null), 3500);
            return true;
          }
        }
      } catch (e) {
        console.warn('Geocoding error:', e);
      }
      return false;
    };

    const fallbackToNetworkIP = async () => {
      try {
        const res = await fetch('/api/maps/ip-location');
        if (res.ok) {
          const data = await res.json();
          const place = data.formatted_address || data.nearest_station;
          if (place) {
            const clean = expandToFullGoogleAddress(place);
            setCurrentLocation(clean);
            sessionStorage.setItem('omny_real_location', clean);
            setTapMessage(`📍 Address: ${clean}`);
            setTimeout(() => setTapMessage(null), 3000);
            return;
          }
        }
      } catch {
        // ignore
      }
      if (!currentLocation || isBareBoroughOrIncomplete(currentLocation)) {
        setCurrentLocation('Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036');
      }
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      await fallbackToNetworkIP();
      setIsLocatingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (quickPos) => {
        const qLat = quickPos.coords.latitude;
        const qLng = quickPos.coords.longitude;
        await resolveCoords(qLat, qLng);
        setIsLocatingGPS(false);
      },
      async (err) => {
        console.warn('Quick geolocation unavailable, falling back:', err);
        await fallbackToNetworkIP();
        setIsLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
      setIsEditingBalance(false);
      setIsEditingFare(false);
      setTapMessage(null);
      // Ensure cached location is upgraded to full address if it was bare
      const saved = localStorage.getItem('omny_user_custom_location') || sessionStorage.getItem('omny_real_location');
      if (saved && isBareBoroughOrIncomplete(saved)) {
        const expanded = expandToFullGoogleAddress(saved);
        setCurrentLocation(expanded);
        localStorage.setItem('omny_user_custom_location', expanded);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Tap action using current customized ticket fare
  const handleTap = () => {
    setIsTapping(true);
    const locationToRecord = currentLocation.trim() || 'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036';

    setTimeout(() => {
      const res = LocalDB.tapOMNY(locationToRecord, currentFare);
      setIsTapping(false);
      if (res.success) {
        refreshState();
        onTransactionAdded();
        if (res.isFreeFareCap) {
          setTapMessage('🎉 Weekly 12-ride Fare Cap reached! This ride is $0.00 completely FREE!');
          confetti({ particleCount: 50, spread: 60 });
        } else {
          setTapMessage(`✅ Tapped at ${locationToRecord} (-$${res.cost.toFixed(2)})! Logged to ledger.`);
        }
        setTimeout(() => setTapMessage(null), 4000);
      } else {
        setTapMessage('⚠️ Insufficient OMNY balance. Please reload below!');
        setTimeout(() => setTapMessage(null), 3500);
      }
    }, 200);
  };

  const handleReload = (amount: number) => {
    LocalDB.reloadOMNY(amount, true, reloadPaymentMethod);
    refreshState();
    onTransactionAdded();
    confetti({ particleCount: 30, spread: 50 });
    setTapMessage(`🎉 Reloaded +$${amount.toFixed(2)}! Card balance updated and logged to ledger.`);
    setTimeout(() => setTapMessage(null), 3000);
  };

  const handleSaveCustomBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customBalanceInput.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val >= 0) {
      const rounded = Math.round(val * 100) / 100;
      LocalDB.setOMNYBalance(rounded);
      refreshState();
      setIsEditingBalance(false);
      setTapMessage(`🎉 Balance updated to $${rounded.toFixed(2)}`);
      setTimeout(() => setTapMessage(null), 3000);
    } else if (customBalanceInput.trim() === '') {
      LocalDB.setOMNYBalance(0);
      refreshState();
      setIsEditingBalance(false);
      setTapMessage('Balance reset to $0.00');
      setTimeout(() => setTapMessage(null), 3000);
    }
  };

  // Save customized ticket fee
  const handleSaveCustomFare = (fareVal: number) => {
    if (isNaN(fareVal) || fareVal <= 0) return;
    const rounded = Math.round(fareVal * 100) / 100;
    LocalDB.setOMNYFare(rounded);
    refreshState();
    setIsEditingFare(false);
    setTapMessage(`🎉 Custom ticket fee saved! Fare set to $${rounded.toFixed(2)} / ride`);
    setTimeout(() => setTapMessage(null), 3500);
  };

  const handleAdjustWeeklyRides = (delta: number) => {
    const newCount = Math.max(0, Math.min(30, omnyState.weeklyRides + delta));
    LocalDB.setOMNYWeeklyRides(newCount);
    refreshState();
  };

  const isFree = omnyState.weeklyRides >= 12;
  const ridesLeft = Math.max(0, 12 - omnyState.weeklyRides);
  const weeklyCapValue = +(12 * currentFare).toFixed(2);

  const filteredStations = selectedBoroughFilter === 'All'
    ? POPULAR_NYC_STATIONS
    : POPULAR_NYC_STATIONS.filter(s => s.borough === selectedBoroughFilter);

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFBF5] flex flex-col w-full max-w-md mx-auto h-screen h-[100dvh] max-h-screen max-h-[100dvh] overflow-hidden shadow-2xl animate-in fade-in duration-200">
      {/* Header - permanently fixed at top */}
      <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-cyan-50/50 flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2
              className="text-lg font-black text-[#1E293B]"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              OMNY Tool
            </h2>
            <p className="text-[10px] text-stone-500 font-semibold">
              MTA NYC Transit • Full Google Maps Address & Fare Cap
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
          aria-label="Close OMNY tool"
        >
          <X className="w-4 h-4 text-[#1E293B]" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar overscroll-contain">
        {/* OMNY Virtual Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0284C7] p-4 text-white shadow-lg border-2 border-[#1E293B] space-y-3.5">
          {/* Top Row: OMNY Brand + Ticket Fee Badge + Contactless Icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-2xl font-black tracking-widest text-cyan-300"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                OMNY
              </span>
              {/* Customizable Ticket Fee Badge with One-Tap Edit */}
              <button
                type="button"
                onClick={() => {
                  setCustomFareInput(currentFare.toFixed(2));
                  setIsEditingFare(true);
                  setIsEditingBalance(false);
                }}
                title="Tap to customize ticket fee"
                className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/25 hover:bg-cyan-400 hover:text-stone-900 text-cyan-100 border border-cyan-400/40 font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs group"
              >
                <span>${currentFare.toFixed(2)}/Ride</span>
                <span className="text-[9px] text-cyan-300 group-hover:text-stone-900 font-normal">Edit</span>
                <Edit2 className="w-2.5 h-2.5 text-cyan-300 group-hover:text-stone-900" />
              </button>
            </div>
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>

          {/* Middle Row: Card Balance & Edit Controls */}
          <div className="flex items-end justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                Card Balance
              </span>
              <div
                className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                ${omnyState.balance.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCustomFareInput(currentFare.toFixed(2));
                  setIsEditingFare(!isEditingFare);
                  setIsEditingBalance(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/35 text-cyan-100 font-bold text-xs flex items-center gap-1 transition-all border border-cyan-400/30 active:scale-95 cursor-pointer shadow-xs"
                title="Customize Ticket Fee"
              >
                <Coins className="w-3 h-3 text-cyan-300" />
                <span>Custom Fare</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomBalanceInput(omnyState.balance === 0 ? '' : omnyState.balance.toFixed(2));
                  setIsEditingBalance(!isEditingBalance);
                  setIsEditingFare(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 active:scale-95 cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3 h-3 text-cyan-300" />
                <span>Edit Balance</span>
              </button>
            </div>
          </div>

          {/* Real-Time Google Maps Full Address Display & Selection */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 flex flex-col gap-2.5">
            <div className="flex items-start justify-between text-xs gap-2">
              <div
                className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer group"
                onClick={() => setIsEditingLocation(!isEditingLocation)}
                title="Click to search or pick full Google Maps address"
              >
                <MapPin className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-cyan-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Google Maps Full Address</span>
                    {isLocatingGPS && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400/30 text-cyan-100 font-bold animate-pulse">
                        Detecting live...
                      </span>
                    )}
                  </div>
                  <div
                    className="font-extrabold text-white text-xs leading-snug mt-1 break-words select-text group-hover:text-cyan-200 transition-colors"
                    title={currentLocation}
                  >
                    {currentLocation ? (
                      currentLocation
                    ) : isLocatingGPS ? (
                      <span className="text-cyan-200 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Acquiring full street address...
                      </span>
                    ) : (
                      'Times Sq - 42 St, Broadway & W 42nd St, New York, NY 10036'
                    )}
                  </div>

                  {/* Actions for full address: Google Maps link & Copy button */}
                  {currentLocation && (
                    <div className="mt-1.5 flex items-center gap-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-cyan-300 hover:text-cyan-100 flex items-center gap-1 underline transition-colors font-medium"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Google Map</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress();
                        }}
                        className="text-[10px] text-cyan-300 hover:text-cyan-100 flex items-center gap-1 transition-colors font-medium cursor-pointer"
                      >
                        {copyFeedback ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-300" />
                            <span className="text-emerald-300 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy Full Address</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit and Locate */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingLocation(!isEditingLocation)}
                  title="Search or choose full address"
                  className="px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoLocateGPS}
                  disabled={isLocatingGPS}
                  title="Refresh real-time device location"
                  className="px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>Locate</span>
                </button>
              </div>
            </div>

            {/* Inline Location Search & Station Picker */}
            {isEditingLocation && (
              <div className="pt-2.5 border-t border-white/15 space-y-2.5 animate-in fade-in">
                <form onSubmit={handleSearchLocation} className="flex items-center gap-1.5">
                  <div className="flex-1 flex items-center bg-stone-900/70 rounded-xl px-2.5 py-2 border border-white/20 focus-within:border-cyan-400">
                    <Search className="w-3.5 h-3.5 text-stone-400 mr-1.5 flex-shrink-0" />
                    <input
                      type="text"
                      value={locationSearchInput}
                      onChange={(e) => setLocationSearchInput(e.target.value)}
                      placeholder="Type street, station, or address (e.g. 350 5th Ave, Bedford Ave)..."
                      className="w-full bg-transparent text-white text-xs outline-none placeholder:text-stone-400"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingLocation || !locationSearchInput.trim()}
                    className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-900 font-black text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    {isSearchingLocation ? '...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingLocation(false);
                      setLocationSearchInput('');
                    }}
                    className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </form>

                {/* Borough Selector Filter */}
                <div className="flex items-center gap-1 text-[10px] font-bold overflow-x-auto no-scrollbar pb-0.5">
                  {(['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBoroughFilter(b)}
                      className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                        selectedBoroughFilter === b
                          ? 'bg-cyan-400 text-stone-900 font-black'
                          : 'bg-white/10 text-stone-200 hover:bg-white/20'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                {/* NYC Transit Stations with Full Google Maps Addresses */}
                <div className="space-y-1">
                  <div className="text-[10px] text-cyan-200 font-extrabold uppercase tracking-wider">
                    Select Full Transit Address:
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar pr-1">
                    {filteredStations.map((station) => (
                      <button
                        key={station.fullAddress}
                        type="button"
                        onClick={() => handleSaveCustomLocation(station.fullAddress)}
                        className="w-full text-left p-2 rounded-xl bg-white/10 hover:bg-cyan-400/25 hover:border-cyan-400 transition-all border border-white/15 flex flex-col gap-0.5 cursor-pointer active:scale-98 group"
                      >
                        <div className="flex items-center justify-between text-xs font-black text-white group-hover:text-cyan-200">
                          <span>{station.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/15 text-stone-200">
                            {station.borough}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-300 leading-tight truncate">
                          {station.fullAddress}
                        </div>
                        <div className="text-[9px] text-cyan-300 font-semibold">
                          Lines: {station.lines}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Tap to Ride Button with Current Customized Ticket Fee */}
          <div>
            <button
              type="button"
              disabled={isTapping}
              onClick={handleTap}
              className="w-full py-3 rounded-xl bg-[#FCCE4C] hover:bg-[#ebd05a] text-[#1E293B] font-black text-xs sm:text-sm shadow-md border-2 border-stone-900 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              <Radio className="w-4 h-4" />
              <span>
                {isTapping
                  ? 'Tapping OMNY...'
                  : isFree
                  ? 'Free Ride ($0.00)'
                  : `Tap to Ride (-$${currentFare.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>

        {/* Dedicated Customizable Ticket Fee Editor */}
        {isEditingFare && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cleaned = customFareInput.replace(/[^0-9.]/g, '');
              const val = parseFloat(cleaned);
              if (!isNaN(val) && val > 0) {
                handleSaveCustomFare(val);
              }
            }}
            className="p-4 rounded-2xl bg-white text-stone-900 border-3 border-cyan-500 shadow-xl space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-black text-xs text-stone-800 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-cyan-600" />
                <span>Custom OMNY Ticket Fee</span>
              </span>
              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                Current: ${currentFare.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">
                Type Custom Single Ride Fare ($):
              </label>
              <div className="flex items-center bg-stone-50 rounded-2xl border-2 border-stone-300 focus-within:border-cyan-600 px-3.5 py-2 shadow-inner">
                <span className="text-2xl font-black text-stone-900 mr-2 select-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={customFareInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setCustomFareInput(val);
                  }}
                  placeholder="3.00"
                  className="w-full bg-transparent text-stone-950 font-black text-2xl outline-none placeholder:text-stone-300"
                  style={{ color: '#090D16', WebkitTextFillColor: '#090D16' }}
                />
                {customFareInput && (
                  <button
                    type="button"
                    onClick={() => setCustomFareInput('')}
                    className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Common Fare Presets */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Popular Fare Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { label: '$3.00 Standard MTA', val: 3.00, hint: 'Subway & Local Bus' },
                  { label: '$1.50 Half Fare', val: 1.50, hint: 'Senior / Student / Fair Fares' },
                  { label: '$2.90 Classic Rate', val: 2.90, hint: 'Previous MTA Fare' },
                  { label: '$7.00 Express Bus', val: 7.00, hint: 'NYC Express Coach' },
                  { label: '$8.50 JFK AirTrain', val: 8.50, hint: 'Airport Monorail' },
                  { label: '$2.75 Historical', val: 2.75, hint: 'Pre-2023 Rate' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setCustomFareInput(item.val.toFixed(2));
                      handleSaveCustomFare(item.val);
                    }}
                    className="text-left p-1.5 rounded-xl bg-stone-50 hover:bg-cyan-50 border border-stone-200 hover:border-cyan-300 transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-stone-800">{item.label}</div>
                    <div className="text-[9px] text-stone-400 truncate">{item.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Save Custom Fare (${customFareInput || currentFare.toFixed(2)})</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveCustomFare(3.00)}
                className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="Reset to MTA standard $3.00"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>Reset $3.00</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingFare(false)}
                className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Dedicated High-Contrast Full-Width Balance Editor */}
        {isEditingBalance && (
          <form
            onSubmit={handleSaveCustomBalance}
            className="p-4 rounded-2xl bg-white text-stone-900 border-3 border-[#FCCE4C] shadow-xl space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-black text-xs text-stone-800 uppercase tracking-wider">
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                Edit Card Balance
              </span>
              <span className="text-[11px] font-bold text-stone-500">
                Current: ${omnyState.balance.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">
                Type New Balance:
              </label>
              <div className="flex items-center bg-stone-50 rounded-2xl border-2 border-stone-300 focus-within:border-[#1E293B] px-3.5 py-2 shadow-inner">
                <span className="text-2xl font-black text-stone-900 mr-2 select-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={customBalanceInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setCustomBalanceInput(val);
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent text-stone-950 font-black text-2xl outline-none placeholder:text-stone-300"
                  style={{ color: '#090D16', WebkitTextFillColor: '#090D16' }}
                />
                {customBalanceInput && (
                  <button
                    type="button"
                    onClick={() => setCustomBalanceInput('')}
                    className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-stone-400">Presets:</span>
              {[
                { label: '$0.00', val: '0.00' },
                { label: '$10.00', val: '10.00' },
                { label: '$20.00', val: '20.00' },
                { label: `$${weeklyCapValue.toFixed(2)} (Cap)`, val: weeklyCapValue.toFixed(2) },
                { label: '$50.00', val: '50.00' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCustomBalanceInput(item.val)}
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 border border-stone-200 active:scale-95 transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1E293B] hover:bg-stone-800 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 text-[#FCCE4C]" />
                <span>Save Balance</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBalance(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tap Feedback Message */}
        {tapMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="leading-snug">{tapMessage}</span>
          </div>
        )}

        {/* Weekly 12-Ride Fare Cap Progress Bar */}
        <div className="p-3.5 rounded-2xl bg-white border-2 border-stone-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="font-extrabold text-[#1E293B] flex items-center gap-1.5 min-w-0 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">Weekly Fare Cap (12 = Free)</span>
            </span>
            <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleAdjustWeeklyRides(-1)}
                className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold border border-stone-300 active:scale-95"
                title="Decrease rides"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span
                className="font-black text-cyan-800 px-1.5 text-xs whitespace-nowrap select-none inline-block text-center"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {omnyState.weeklyRides} / 12
              </span>
              <button
                type="button"
                onClick={() => handleAdjustWeeklyRides(1)}
                className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold border border-stone-300 active:scale-95"
                title="Increase rides"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-stone-100 border border-stone-300 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFree
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400'
              }`}
              style={{
                width: `${Math.min(100, (omnyState.weeklyRides / 12) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-600 font-bold">
            {isFree ? (
              <span className="font-black text-emerald-700">
                🎉 12 rides reached! Free subway rides this week!
              </span>
            ) : (
              <span>
                {ridesLeft} {ridesLeft === 1 ? 'ride' : 'rides'} left (${(ridesLeft * currentFare).toFixed(2)}) until free rides
              </span>
            )}
            <span className="text-stone-400 font-medium">Cap: ${weeklyCapValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Quick Reload Options */}
        <div className="p-3.5 rounded-2xl bg-white border-2 border-stone-200 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Quick Reload Card Balance
            </span>
            <select
              value={reloadPaymentMethod}
              onChange={(e) => setReloadPaymentMethod(e.target.value as PaymentMethod)}
              className="text-[10px] font-bold bg-stone-100 border border-stone-300 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Apple Pay">Apple Pay</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Checking Account">Checking Account</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { amt: 10, label: 'Add $10' },
              { amt: 20, label: 'Add $20' },
              { amt: weeklyCapValue, label: `Add $${weeklyCapValue.toFixed(0)} (Cap)` },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleReload(item.amt)}
                className="py-2 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-[#1E293B] text-xs font-black text-[#1E293B] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3 text-amber-600" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = parseFloat(customReloadAmount.replace(/[^0-9.]/g, ''));
              if (!isNaN(amt) && amt > 0) {
                handleReload(amt);
                setCustomReloadAmount('');
              }
            }}
            className="flex items-center gap-2 pt-1 border-t border-stone-100"
          >
            <div className="flex items-center flex-1 rounded-xl border-2 border-stone-300 bg-white px-3 py-2 focus-within:border-[#1E293B] shadow-inner">
              <span className="text-base font-black text-stone-900 mr-1 select-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Type custom reload amount..."
                value={customReloadAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setCustomReloadAmount(val);
                }}
                className="w-full bg-white text-stone-950 font-black text-sm outline-none placeholder:text-stone-400 placeholder:font-normal"
                style={{ color: '#090D16', WebkitTextFillColor: '#090D16' }}
              />
            </div>
            <button
              type="submit"
              disabled={!customReloadAmount || parseFloat(customReloadAmount) <= 0}
              className="px-3.5 py-1.5 rounded-xl bg-[#FCCE4C] hover:bg-[#ebd05a] disabled:opacity-40 text-[#1E293B] font-black text-xs border border-[#1E293B] active:scale-95 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Reload</span>
            </button>
          </form>
        </div>

        {/* Recent Activity List */}
        <div className="space-y-1.5">
          <h3
            className="text-xs font-black text-[#1E293B] uppercase tracking-wider px-1"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Recent Transit Activity
          </h3>
          <div className="space-y-1.5">
            {omnyState.recentRides.length === 0 ? (
              <div className="p-3 rounded-xl bg-white border border-stone-200 text-center text-xs text-stone-400">
                No recent rides. Tap the card above to ride!
              </div>
            ) : (
              omnyState.recentRides.slice(0, 6).map((ride) => (
                <div
                  key={ride.id}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 flex-shrink-0">
                      {ride.type === 'Bus' ? <Bus className="w-3.5 h-3.5" /> : <Train className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1E293B] truncate" title={ride.station}>
                        {ride.station}
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium">
                        {ride.date} {ride.time}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-black flex-shrink-0 pl-2 ${ride.amount === 0 ? 'text-emerald-600' : 'text-rose-500'}`}
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    {ride.amount === 0 ? 'FREE' : `-$${ride.amount.toFixed(2)}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};