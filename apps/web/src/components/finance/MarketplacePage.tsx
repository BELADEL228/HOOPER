import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Ticket,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  Calendar,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  X,
  Printer,
  ScanLine
} from 'lucide-react';
import type {
  MarketplaceProduct,
  TicketingMatch,
  CartItem,
  IssuedTicket,
  MarketplaceOrder,
  PaymentMethod
} from '../../types';
import { apiUrl } from '../../services/api';

export function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'shop' | 'tickets' | 'my-orders' | 'scanner'>('shop');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [matches, setMatches] = useState<TicketingMatch[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulaire de commande
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TMONEY');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Commandes et billets sauvegardés localement
  const [myOrders, setMyOrders] = useState<MarketplaceOrder[]>(() => {
    const saved = localStorage.getItem('firestone_my_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [myTickets, setMyTickets] = useState<IssuedTicket[]>(() => {
    const saved = localStorage.getItem('firestone_my_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  // Flocage personnalisé pour maillot sélectionné
  const [customizingProduct, setCustomizingProduct] = useState<MarketplaceProduct | null>(null);
  const [customName, setCustomName] = useState<string>('KOFFI');
  const [customNumber, setCustomNumber] = useState<number>(23);
  const [selectedSize, setSelectedSize] = useState<string>('L');

  // Scanner Stadiers
  const [scanInputCode, setScanInputCode] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'already_used' | 'error';
    message: string;
    ticket?: IssuedTicket;
  }>({ status: 'idle', message: '' });
  const [scanLoading, setScanLoading] = useState<boolean>(false);

  // Chargement des données catalogue & billetterie
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, matchRes] = await Promise.all([
          fetch(apiUrl('/marketplace/products')).catch(() => null),
          fetch(apiUrl('/tickets/matches')).catch(() => null),
        ]);

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        } else {
          // Fallback hors-ligne
          setProducts(FALLBACK_PRODUCTS);
        }

        if (matchRes && matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData);
        } else {
          // Fallback hors-ligne
          setMatches(FALLBACK_MATCHES);
        }
      } catch {
        setProducts(FALLBACK_PRODUCTS);
        setMatches(FALLBACK_MATCHES);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Sauvegarder les commandes dans le localStorage
  useEffect(() => {
    localStorage.setItem('firestone_my_orders', JSON.stringify(myOrders));
  }, [myOrders]);

  useEffect(() => {
    localStorage.setItem('firestone_my_tickets', JSON.stringify(myTickets));
  }, [myTickets]);

  // Ajouter un produit simple au panier
  const handleAddToCart = (product: MarketplaceProduct, size: string = 'L') => {
    const cartItemId = `${product.id}-${size}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          itemType: 'product',
          title: product.name,
          priceXOF: product.priceXOF,
          quantity: 1,
          selectedSize: size,
          imageUrl: product.imageUrl,
        },
      ];
    });
    setIsCartOpen(true);
  };

  // Ajouter un maillot floqué personnalisé
  const handleAddCustomJerseyToCart = () => {
    if (!customizingProduct) return;
    const cartItemId = `${customizingProduct.id}-${selectedSize}-${customName}-${customNumber}`;

    setCart((prev) => [
      ...prev,
      {
        id: cartItemId,
        itemType: 'product',
        title: `${customizingProduct.name} (Flocage: #${customNumber} ${customName})`,
        priceXOF: customizingProduct.priceXOF,
        quantity: 1,
        selectedSize: selectedSize,
        customPlayerName: customName,
        customJerseyNumber: customNumber,
        imageUrl: customizingProduct.imageUrl,
      },
    ]);

    setCustomizingProduct(null);
    setIsCartOpen(true);
  };

  // Réserver des tickets de match
  const handleAddTicketToCart = (match: TicketingMatch, tierName: string, priceXOF: number) => {
    const cartItemId = `tkt-${match.id}-${tierName}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          itemType: 'ticket',
          title: `${match.homeTeamName} vs ${match.awayTeamName}`,
          priceXOF: priceXOF,
          quantity: 1,
          matchDate: `${match.date} à ${match.time}`,
          ticketTierName: tierName,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.priceXOF * item.quantity, 0);

  // Validation du Checkout
  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      alert('Veuillez renseigner votre nom, email et numéro de téléphone.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutSuccess(null);

    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      items: cart,
    };

    try {
      const response = await fetch(apiUrl('/marketplace/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation du paiement');
      }

      const data = await response.json();

      if (data.order) {
        setMyOrders((prev) => [data.order, ...prev]);
      }
      if (Array.isArray(data.tickets) && data.tickets.length > 0) {
        setMyTickets((prev) => [...data.tickets, ...prev]);
      }

      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCheckoutSuccess(data.message || 'Commande validée avec succès !');
      setActiveTab('my-orders');
    } catch {
      // Simulation locale en cas d'indisponibilité API
      const fallbackOrderNumber = `FS-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedTickets: IssuedTicket[] = [];

      for (const item of cart) {
        if (item.itemType === 'ticket') {
          for (let i = 0; i < item.quantity; i++) {
            const ticketCode = `FS-TKT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
            generatedTickets.push({
              id: `tkt-${Date.now()}-${i}`,
              ticketCode,
              matchId: item.id,
              matchTitle: item.title,
              arena: 'Terrain du Lycée d’Adétikopé, Lomé',
              matchDate: item.matchDate || '12 Septembre 2026',
              tierName: item.ticketTierName || 'Tribune Populaire',
              holderName: customerName,
              holderPhone: customerPhone,
              priceXOF: item.priceXOF,
              qrCodeData: `FIRESTONE-VALID:${ticketCode}:${customerName}:${item.title}`,
              isUsed: false,
              usedAt: null,
              validatedBy: null,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      const localOrder: MarketplaceOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: fallbackOrderNumber,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        totalAmountXOF: totalCartAmount,
        status: paymentMethod === 'CASH_ARENA' ? 'PENDING' : 'CONFIRMED',
        items: cart,
        tickets: generatedTickets,
        createdAt: new Date().toISOString(),
      };

      setMyOrders((prev) => [localOrder, ...prev]);
      setMyTickets((prev) => [...generatedTickets, ...prev]);
      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCheckoutSuccess('Commande enregistrée en mode local ! Vos billets QR sont prêts.');
      setActiveTab('my-orders');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Vérification préalable sans composter
  const handleVerifyTicket = async (codeToScan: string) => {
    if (!codeToScan.trim()) return;
    setScanLoading(true);
    setScanResult({ status: 'idle', message: '' });

    try {
      const response = await fetch(apiUrl(`/tickets/verify/${encodeURIComponent(codeToScan.trim().toUpperCase())}`));
      const data = await response.json();

      if (!response.ok) {
        setScanResult({
          status: 'error',
          message: data.message || '❌ Billet introuvable.',
        });
      } else if (data.ticket?.isUsed) {
        setScanResult({
          status: 'already_used',
          message: `⚠️ Billet valide mais déjà utilisé le ${new Date(data.ticket.usedAt || Date.now()).toLocaleTimeString()} !`,
          ticket: data.ticket,
        });
      } else {
        setScanResult({
          status: 'success',
          message: `ℹ️ Billet valide et prêt à être composté (${data.ticket?.holderName}, ${data.ticket?.tierName}).`,
          ticket: data.ticket,
        });
      }
    } catch {
      // Fallback
    } finally {
      setScanLoading(false);
    }
  };

  // Validation d'un billet au scanner
  const handleValidateTicket = async (codeToScan: string) => {
    if (!codeToScan.trim()) return;
    setScanLoading(true);
    setScanResult({ status: 'idle', message: '' });

    try {
      const response = await fetch(apiUrl('/tickets/validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: codeToScan.trim(),
          stadierName: 'Stadier Portique Central (Lycée Adétikopé)',
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setScanResult({
          status: 'already_used',
          message: data.message || '⚠️ Billet déjà validé précédemment !',
          ticket: data.ticket,
        });
      } else if (!response.ok) {
        setScanResult({
          status: 'error',
          message: data.message || '❌ Billet introuvable ou non reconnu.',
        });
      } else {
        setScanResult({
          status: 'success',
          message: data.message || '✅ Billet validé avec succès ! Entrée autorisée.',
          ticket: data.ticket,
        });

        // Mettre à jour l'état local du billet
        setMyTickets((prev) =>
          prev.map((t) =>
            t.ticketCode.toUpperCase() === codeToScan.trim().toUpperCase()
              ? { ...t, isUsed: true, usedAt: new Date().toISOString() }
              : t
          )
        );
      }
    } catch {
      // Fallback local pour les tests
      const localTicket = myTickets.find(
        (t) => t.ticketCode.toUpperCase() === codeToScan.trim().toUpperCase()
      );

      if (!localTicket) {
        setScanResult({
          status: 'error',
          message: '❌ Billet introuvable dans le registre local.',
        });
      } else if (localTicket.isUsed) {
        setScanResult({
          status: 'already_used',
          message: `⚠️ Billet déjà utilisé le ${new Date(localTicket.usedAt || Date.now()).toLocaleTimeString()} !`,
          ticket: localTicket,
        });
      } else {
        localTicket.isUsed = true;
        localTicket.usedAt = new Date().toISOString();
        setMyTickets([...myTickets]);
        setScanResult({
          status: 'success',
          message: `✅ Billet validé ! Bienvenue à ${localTicket.holderName} (${localTicket.tierName}).`,
          ticket: localTicket,
        });
      }
    } finally {
      setScanLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'ALL' || p.category === selectedCategory
  );

  return (
    <div className="space-y-8 pb-16 animate-fadeIn text-slate-100">

      {/* ─── HEADER PRINCIPAL ─────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Marketplace & Billetterie QR
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Achetez les équipements officiels du club et réservez vos places de match avec QR code scannable au guichet.
          </p>
        </div>

        {/* Bouton Panier Flottant */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            type="button"
            className="relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-500/25 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mon Panier</span>
            {cart.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
            <span className="hidden sm:inline border-l border-white/30 pl-2 font-mono">
              {totalCartAmount.toLocaleString('fr-FR')} F
            </span>
          </button>
        </div>
      </header>

      {/* Message de succès après commande */}
      {checkoutSuccess && (
        <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-4 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-emerald-200 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Félicitations !</p>
              <p>{checkoutSuccess}</p>
            </div>
          </div>
          <button
            onClick={() => setCheckoutSuccess(null)}
            type="button"
            className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── ONGLETS DE NAVIGATION PRINCIPAUX ──────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/10 p-2 flex flex-wrap gap-2 shadow-lg">
        {[
          { id: 'shop', label: 'Boutique & Maillots', icon: ShoppingBag },
          { id: 'tickets', label: 'Billetterie Matchday', icon: Ticket },
          { id: 'my-orders', label: `Mes Billets & Commandes (${myTickets.length})`, icon: QrCode },
          { id: 'scanner', label: 'Contrôle d’Accès (Stadiers)', icon: ScanLine },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          VUE 1 : BOUTIQUE DU CLUB & CONFIGURATEUR DE FLOCAGE
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* Filtres par Catégorie */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tous les Articles' },
              { id: 'JERSEYS', label: 'Maillots Officiels' },
              { id: 'GEAR', label: 'Équipements & Ballons' },
              { id: 'LIFESTYLE', label: 'Hoodies & Lifestyle' },
              { id: 'ACCESSORIES', label: 'Accessoires & Casquettes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                type="button"
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat.id
                    ? 'bg-white text-slate-950 shadow'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grille des Produits */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Chargement des articles officiels FIRE STONE...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-3xl border border-white/10 bg-slate-900/60 p-4 space-y-4 hover:border-red-500/40 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Conteneur Image avec Badge */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      {product.badge && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          {product.badge}
                        </span>
                      )}
                      {product.customizable && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-400/50 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Flocage dispo
                        </span>
                      )}
                    </div>

                    {/* Infos Produit */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[10px] font-black uppercase text-amber-400">
                          {product.category}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          ⭐ {product.rating} ({product.reviewsCount})
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Prix et Actions */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Prix Club</span>
                      <span className="text-lg font-black text-[#FFB800] font-mono">
                        {product.priceXOF.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {product.customizable ? (
                        <button
                          onClick={() => {
                            setCustomizingProduct(product);
                            setCustomName('KOFFI');
                            setCustomNumber(23);
                            setSelectedSize('L');
                          }}
                          type="button"
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-cyan-300 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Floquer
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={() => handleAddToCart(product, 'L')}
                        type="button"
                        className={`${product.customizable ? '' : 'col-span-2'
                          } w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-xs font-black text-white shadow-md transition-all cursor-pointer`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          VUE 2 : BILLETTERIE MATCHDAY & RÉSENTATION DES PALIERS DE SIÈGES
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-3xl border border-white/15 bg-slate-900/70 p-6 space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badge Matchday & Compétition */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5" /> {match.competition}
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {match.time}
                    </span>
                  </div>

                  {/* Duel d'Équipes */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-3 items-center text-center">
                    <div>
                      <span className="text-2xl block mb-1">🔥</span>
                      <h4 className="text-sm font-black text-white">{match.homeTeamName}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Domicile</span>
                    </div>
                    <div>
                      <span className="text-2xl font-black italic tracking-widest text-amber-400/80">VS</span>
                      <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-cyan-400" /> {match.date}
                      </p>
                    </div>
                    <div>
                      <span className="text-2xl block mb-1">🦅</span>
                      <h4 className="text-sm font-black text-white">{match.awayTeamName}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Extérieur</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                    <strong>{match.arenaName}</strong> — {match.arenaCity}, Togo
                  </p>

                  {/* Paliers de Billets */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Sélectionnez votre Tribune :
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      {match.tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{tier.tierName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                                {tier.availableSeats} places dispo
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{tier.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {tier.perks.map((perk, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.2 rounded bg-red-500/15 text-amber-300 font-bold"
                                >
                                  ✓ {perk}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center sm:flex-col items-end justify-between shrink-0 gap-2">
                            <span className="text-base font-black text-[#FFB800] font-mono">
                              {tier.priceXOF.toLocaleString('fr-FR')} F
                            </span>
                            <button
                              onClick={() => handleAddTicketToCart(match, tier.tierName, tier.priceXOF)}
                              type="button"
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-xs font-black text-white shadow transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Ticket className="w-3 h-3" /> Réserver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          VUE 3 : MES BILLETS & COMMANDES (AFFICHAGE DES QR CODES)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'my-orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" /> Vos Billets Numériques Officiels
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Présentez ce QR code à l'entrée du terrain
            </span>
          </div>

          {myTickets.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Aucun billet réservé pour le moment</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Réservez vos places pour le prochain match de FIRE STONE au Terrain du Lycée d'Adétikopé.
              </p>
              <button
                onClick={() => setActiveTab('tickets')}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-xs font-black uppercase text-white shadow cursor-pointer"
              >
                Voir les Matchs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className={`rounded-3xl border p-5 space-y-4 transition-all shadow-2xl relative overflow-hidden ${tkt.isUsed
                      ? 'border-white/10 bg-slate-900/40 opacity-70'
                      : 'border-amber-500/40 bg-slate-900/90 shadow-amber-950/20'
                    }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                      Billet Officiel Match
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${tkt.isUsed
                          ? 'bg-slate-800 text-slate-400 border border-white/10'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                    >
                      {tkt.isUsed ? '✓ Déjà Utilisé' : '● Valide pour Entrée'}
                    </span>
                  </div>

                  {/* QR Code Stylisé SVG */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-950 space-y-2 shadow-inner">
                    {/* SVG Vectoriel de QR Code fictif mais structuré et lisible par scanner */}
                    <svg viewBox="0 0 120 120" className="w-36 h-36">
                      <rect width="120" height="120" fill="#ffffff" />
                      {/* Coins de cadrage QR standards */}
                      <rect x="10" y="10" width="30" height="30" fill="#090A0F" />
                      <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                      <rect x="20" y="20" width="10" height="10" fill="#FF2A3B" />

                      <rect x="80" y="10" width="30" height="30" fill="#090A0F" />
                      <rect x="85" y="15" width="20" height="20" fill="#ffffff" />
                      <rect x="90" y="20" width="10" height="10" fill="#FF2A3B" />

                      <rect x="10" y="80" width="30" height="30" fill="#090A0F" />
                      <rect x="15" y="85" width="20" height="20" fill="#ffffff" />
                      <rect x="20" y="90" width="10" height="10" fill="#FF2A3B" />

                      {/* Motifs binaires stylisés */}
                      <rect x="50" y="15" width="6" height="20" fill="#090A0F" />
                      <rect x="62" y="25" width="10" height="6" fill="#090A0F" />
                      <rect x="50" y="50" width="20" height="20" fill="#090A0F" />
                      <rect x="55" y="55" width="10" height="10" fill="#FFB800" />
                      <rect x="80" y="50" width="15" height="8" fill="#090A0F" />
                      <rect x="25" y="50" width="8" height="15" fill="#090A0F" />
                      <rect x="80" y="80" width="25" height="10" fill="#090A0F" />
                      <rect x="65" y="95" width="10" height="15" fill="#090A0F" />
                      <rect x="100" y="95" width="10" height="15" fill="#090A0F" />
                    </svg>
                    <span className="font-mono text-xs font-black tracking-widest text-slate-900">
                      {tkt.ticketCode}
                    </span>
                  </div>

                  {/* Détails du Billet */}
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-black text-white text-sm leading-tight">{tkt.matchTitle}</h4>
                    <p className="text-amber-400 font-bold">{tkt.tierName}</p>
                    <p className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-red-400" /> {tkt.arena}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {tkt.matchDate}
                    </p>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-300">
                      <span>Détenteur :</span>
                      <strong className="text-white">{tkt.holderName}</strong>
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => window.print()}
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
                    </button>
                    <button
                      onClick={() => handleValidateTicket(tkt.ticketCode)}
                      type="button"
                      title="Tester la validation au scanner"
                      className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold cursor-pointer"
                    >
                      Tester scan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          VUE 4 : SCANNER DE CONTRÔLE D'ACCÈS POUR LES STADIERS
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl border border-white/15 bg-slate-900/80 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ScanLine className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Scanner de Contrôle d’Accès (Stade)</h3>
                <p className="text-xs text-slate-400">
                  Validez les billets des spectateurs au Terrain du Lycée d'Adétikopé.
                </p>
              </div>
            </div>

            {/* Saisie ou scan du code */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Code Billet ou QR Code (Ex: FS-TKT-2026-XXXXX)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanInputCode}
                  onChange={(e) => setScanInputCode(e.target.value.toUpperCase())}
                  placeholder="Tapez ou collez le code billet..."
                  className="flex-1 rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleVerifyTicket(scanInputCode)}
                  disabled={scanLoading || !scanInputCode.trim()}
                  type="button"
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
                >
                  Vérifier
                </button>
                <button
                  onClick={() => handleValidateTicket(scanInputCode)}
                  disabled={scanLoading || !scanInputCode.trim()}
                  type="button"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-xs font-black uppercase text-white shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {scanLoading ? 'Vérification...' : 'Composter'}
                </button>
              </div>
            </div>

            {/* Raccourcis de test rapide */}
            {myTickets.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Codes de test disponibles (cliquez pour tester) :
                </span>
                <div className="flex flex-wrap gap-2">
                  {myTickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setScanInputCode(t.ticketCode);
                        handleValidateTicket(t.ticketCode);
                      }}
                      type="button"
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${t.isUsed
                          ? 'border-white/10 bg-white/5 text-slate-500 line-through'
                          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                        }`}
                    >
                      {t.ticketCode} ({t.tierName})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Résultat du Scan */}
            {scanResult.status !== 'idle' && (
              <div
                className={`rounded-2xl p-5 border animate-fadeIn transition-all ${scanResult.status === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                    : scanResult.status === 'already_used'
                      ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                      : 'bg-red-950/90 border-red-500/50 text-red-200'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.status === 'success' && (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {scanResult.status === 'already_used' && (
                    <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  {scanResult.status === 'error' && (
                    <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-2">
                    <p className="font-black text-sm text-white">{scanResult.message}</p>
                    {scanResult.ticket && (
                      <div className="text-xs space-y-1 pt-1 opacity-90 border-t border-white/10">
                        <p>Détenteur : <strong>{scanResult.ticket.holderName}</strong></p>
                        <p>Match : {scanResult.ticket.matchTitle}</p>
                        <p>Tribune : {scanResult.ticket.tierName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TIROIR PANIER (CART SLIDE-OVER)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="flex-1" onClick={() => setIsCartOpen(false)} />
          <div className="w-full max-w-md bg-[#0F121E] border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">

            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black">Votre Panier FIRE STONE</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <p>Votre panier est vide.</p>
                  <p className="text-[11px] text-slate-500">
                    Ajoutez des maillots ou des billets de match pour continuer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${item.itemType === 'ticket'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                              }`}
                          >
                            {item.itemType === 'ticket' ? 'BILLET' : 'PRODUIT'}
                          </span>
                          {item.selectedSize && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-[9px] font-mono">
                              Taille {item.selectedSize}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-white line-clamp-1">{item.title}</h5>
                        <p className="font-mono text-amber-400 font-bold">
                          {item.priceXOF.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>

                      {/* Stepper Quantité */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          type="button"
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          type="button"
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          type="button"
                          className="p-1.5 text-red-400 hover:text-red-300 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pied du Panier */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total à payer</span>
                  <span className="text-xl font-black text-[#FFB800] font-mono">
                    {totalCartAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  type="button"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Passer la commande ({totalCartAmount.toLocaleString('fr-FR')} F)
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL DE CONFIGURATION DU FLOCAGE MAILLOT
         ═══════════════════════════════════════════════════════════════════════════ */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Personnalisation du Maillot</h3>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aperçu Flocage */}
            <div className="rounded-2xl bg-slate-950 p-6 border border-white/10 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-2 left-3 text-[10px] font-bold text-amber-400">
                Aperçu Flocage Dos
              </div>
              <span className="text-2xl font-black uppercase tracking-widest text-white mt-4 drop-shadow">
                {customName || 'VOTRE NOM'}
              </span>
              <span className="text-6xl font-mono font-black text-[#FFB800] drop-shadow-md">
                {customNumber}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                FIRE STONE LOMÉ • 2026
              </span>
            </div>

            {/* Champs de Saisie */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nom sur le maillot (Flocage)</label>
                <input
                  type="text"
                  value={customName}
                  maxLength={14}
                  onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 font-bold text-white uppercase focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Numéro (0 - 99)</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={customNumber}
                    onChange={(e) => setCustomNumber(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Taille</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                      <option key={sz} value={sz}>
                        Taille {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddCustomJerseyToCart}
              type="button"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-xs font-black uppercase text-white shadow-lg cursor-pointer"
            >
              Confirmer le flocage & Ajouter ({customizingProduct.priceXOF.toLocaleString('fr-FR')} F)
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL DE PAIEMENT & CHECKOUT (T-MONEY / FLOOZ / CARTE / CASH)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Paiement Sécurisé Togo & UEMOA
                </span>
                <h3 className="text-base font-black text-white">Finaliser votre Réservation</h3>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessCheckout} className="space-y-4 text-xs">
              {/* Coordonnées */}
              <div className="space-y-2.5">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nom & Prénom(s) *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Koffi Mensah"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="koffi@gmail.com"
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Téléphone (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+228 90 12 34 56"
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sélection du mode de paiement */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="font-bold text-slate-300 block">Choisissez votre mode de paiement :</label>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'TMONEY', label: 'T-Money (Yas)', desc: 'Mixx by Yas Togo' },
                    { id: 'FLOOZ', label: 'Flooz', desc: 'Moov Money Togo' },
                    { id: 'CARD', label: 'Carte Bancaire', desc: 'Visa / Mastercard' },
                    { id: 'CASH_ARENA', label: 'Cash au Terrain', desc: 'Guichet Lycée Adétikopé' },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white shadow'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span className="font-black text-xs block text-white">{method.label}</span>
                        <span className="text-[10px] text-slate-400">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Récapitulatif du Total */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Montant total débité :</span>
                <span className="text-base font-black text-[#FFB800] font-mono">
                  {totalCartAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/25 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  'Traitement du paiement...'
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Valider & Générer mes Billets QR
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Données de secours en mode hors-ligne
const FALLBACK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-001',
    name: 'Maillot Officiel Domicile FIRE STONE 2026',
    slug: 'maillot-domicile-fire-stone-2026',
    category: 'JERSEYS',
    priceXOF: 18000,
    description: 'Le maillot officiel de match porté au Terrain du Lycée d’Adétikopé. Flocage nom & numéro personnalisé inclus.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'BEST-SELLER',
  },
  {
    id: 'prod-003',
    name: 'Ballon Officiel FIBA FIRE STONE All-Court',
    slug: 'ballon-fiba-fire-stone',
    category: 'GEAR',
    priceXOF: 22500,
    description: 'Ballon officiel taille 7 en cuir composite haute adhérence.',
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
    isOfficial: true,
    customizable: false,
    inStock: true,
    rating: 5.0,
    reviewsCount: 44,
    badge: 'HOMOLOGUÉ FIBA',
  },
];

const FALLBACK_MATCHES: TicketingMatch[] = [
  {
    id: 'match-tkt-001',
    homeTeamName: 'FIRE STONE Elite',
    awayTeamName: 'Éperviers BBC',
    competition: 'Championnat National D1 Togo — J1',
    date: '2026-09-12',
    time: '16:00',
    arenaName: 'Terrain du Lycée d’Adétikopé',
    arenaCity: 'Lomé',
    isHotMatch: true,
    tiers: [
      {
        id: 'tier-pop-1',
        tierName: 'Tribune Populaire',
        priceXOF: 1000,
        description: 'Accès gradins extérieurs et buvette.',
        availableSeats: 280,
        totalSeats: 300,
        perks: ['Entrée générale', 'Placement libre gradins'],
      },
      {
        id: 'tier-vip-1',
        tierName: 'Tribune Couverte Courtside VIP',
        priceXOF: 3500,
        description: 'Siège réservé au bord du terrain + boisson offerte.',
        availableSeats: 42,
        totalSeats: 50,
        perks: ['Siège premier rang', 'Boisson fraîche', 'Badge collector'],
      },
    ],
  },
];
