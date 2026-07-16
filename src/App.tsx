import React, { useState, useEffect } from 'react';
import { Scene } from './Scene';
import type { AnimState } from './Card3D';
import { Search, Loader2, ShieldAlert, Zap, Shield, Swords, RotateCcw, Layers, X, Filter, Image as ImageIcon, Package, Bookmark, BookmarkCheck, BookOpen, Link as LinkIcon, Grid, History, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
    const [searchTerm, setSearchTerm] = useState('Neo Galaxy-Eyes Photon Dragon');
    const [cardData, setCardData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isZoomed, setIsZoomed] = useState(false);

    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [playmat, setPlaymat] = useState<string | null>(null);
    const [animState, setAnimState] = useState<AnimState>('default');
    const [compareCardData, setCompareCardData] = useState<any>(null);
    const [compareAnimState, setCompareAnimState] = useState<AnimState>('default');
    const [shake, setShake] = useState(false);
    const [resetViewTrigger, setResetViewTrigger] = useState(0);
    const [artOnly, setArtOnly] = useState(false);
    const [idleAnimation, setIdleAnimation] = useState(true); 

    const [showObtain, setShowObtain] = useState(false);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);

    const [carouselCards, setCarouselCards] = useState<any[]>([]);
    const [carouselTitle, setCarouselTitle] = useState('');
    const [loadingCarousel, setLoadingCarousel] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const CARDS_PER_PAGE = 50;

    const [lastSearchResults, setLastSearchResults] = useState<any[]>([]);
    const [lastSearchTitle, setLastSearchTitle] = useState('');

    const [availableArchetypes, setAvailableArchetypes] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showArchDropdown, setShowArchDropdown] = useState(false);

    const [filters, setFilters] = useState({
        level: '', atk: '', def: '', format: '', type: '', race: '', archetype: ''
    });

    const [binder, setBinder] = useState<any[]>(() => {
        const saved = localStorage.getItem('ygo-binder');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ygo-binder', JSON.stringify(binder));
    }, [binder]);

    useEffect(() => {
        if (carouselTitle === 'My Binder') {
            setCarouselCards(binder);
            if (binder.length === 0) {
                setCarouselCards([]); 
            } else {
                const maxPage = Math.max(0, Math.ceil(binder.length / CARDS_PER_PAGE) - 1);
                if (currentPage > maxPage) setCurrentPage(maxPage);
            }
        }
    }, [binder, carouselTitle, currentPage]);

    const toggleBinder = () => {
        if (!cardData) return;
        const exists = binder.find(c => c.id === cardData.id);
        if (exists) setBinder(binder.filter(c => c.id !== cardData.id));
        else setBinder([...binder, cardData]);
    };

    const loadBinder = () => {
        if (binder.length > 0) {
            setCarouselCards(binder);
            setCarouselTitle(`My Binder`);
            setCurrentPage(0);
            setCardData(binder[0]);
            setCompareCardData(null);
        } else {
            setCarouselCards([]);
            setCarouselTitle(`My Binder`);
            setError("Your binder is empty!");
            setTimeout(() => setError(""), 3000);
        }
    };

    const restoreLastSearch = () => {
        if (lastSearchResults.length > 0) {
            setCarouselCards(lastSearchResults);
            setCarouselTitle(lastSearchTitle);
            setCurrentPage(0);
        }
    };

    const findRelatedSupport = async () => {
        if (!cardData) return;
        setLoadingCarousel(true);
        try {
            const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?desc=${encodeURIComponent(cardData.name)}`);
            const data = await res.json();
            if (data.data) {
                const related = data.data.filter((c: any) => c.id !== cardData.id).slice(0, 100);
                if (related.length > 0) {
                    setCarouselCards(related);
                    setLastSearchResults(related); 
                    setCarouselTitle(`Support: ${cardData.name}`);
                    setLastSearchTitle(`Support: ${cardData.name}`); 
                    setCurrentPage(0);
                } else {
                    throw new Error('No support found.');
                }
            } else {
                throw new Error('No support found.');
            }
        } catch (err) {
            setError('No related support cards found.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoadingCarousel(false);
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
    };

    const handleSummonSlam = () => {
        setAnimState('summon');
        setTimeout(() => { setAnimState('default'); triggerShake(); }, 150);
    };

    const handleAttackLunge = () => {
        setAnimState('attack');
        if (compareCardData) setCompareAnimState('attack');
        triggerShake();
        setTimeout(() => {
            setAnimState('default');
            if (compareCardData) setCompareAnimState('default');
        }, 400);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm && searchTerm.length >= 2 && showSuggestions) {
                try {
                    const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}`);
                    if (!res.ok) { setSearchSuggestions([]); return; }
                    const data = await res.json();
                    if (data.data) {
                        const term = searchTerm.toLowerCase();
                        const sortedResults = data.data.sort((a: any, b: any) => {
                            const aName = a.name.toLowerCase();
                            const bName = b.name.toLowerCase();
                            const aStarts = aName.startsWith(term);
                            const bStarts = bName.startsWith(term);
                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;
                            return aName.length - bName.length;
                        });
                        setSearchSuggestions(sortedResults.slice(0, 8));
                    } else {
                        setSearchSuggestions([]);
                    }
                } catch (err) { setSearchSuggestions([]); }
            } else { setSearchSuggestions([]); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, showSuggestions]);

    useEffect(() => {
        if (cardData) {
            const formats = cardData.misc_info?.[0]?.formats || [];
            if (formats.length === 0 && cardData.card_sets?.length > 0) formats.push('TCG');
            setSelectedGames(formats);
        }
    }, [cardData]);

    const fetchFilteredCards = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!filters.level && !filters.atk && !filters.def && !filters.format && !filters.type && !filters.race && !filters.archetype) {
            setError('Please select at least one filter.');
            return;
        }
        setLoadingCarousel(true); setError(''); setShowFilters(false);

        try {
            const queryParams = new URLSearchParams();
            if (filters.level) queryParams.append('level', filters.level);
            if (filters.atk) queryParams.append('atk', filters.atk);
            if (filters.def) queryParams.append('def', filters.def);
            if (filters.format) queryParams.append('format', filters.format);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.race) queryParams.append('race', filters.race);
            if (filters.archetype) queryParams.append('archetype', filters.archetype);

            const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryParams.toString()}`);
            const data = await res.json();
            if (data.error) throw new Error('No cards found matching these filters.');

            const allResults = data.data || [];
            setCarouselCards(allResults);
            setLastSearchResults(allResults); 
            setCurrentPage(0);
            setCarouselTitle(`Results (${allResults.length})`);
            setLastSearchTitle(`Results (${allResults.length})`);

            if (allResults.length > 0) {
                setCardData(allResults[0]);
                setCompareCardData(null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch filtered cards.');
            setCarouselCards([]);
        } finally { setLoadingCarousel(false); }
    };

    const fetchCard = async (query: string) => {
        if (!query) return;
        setLoading(true); setError(''); setShowSuggestions(false);
        try {
            const isNumericId = /^\d+$/.test(query.trim());
            const endpoint = isNumericId
            ? `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(query.trim())}`
            : `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query.trim())}`;
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.error || !data.data || data.data.length === 0) throw new Error('Card not found.');

            const fetchedCard = data.data.find((c: any) => c.name.toLowerCase() === query.toLowerCase()) || data.data[0];
            setCardData(fetchedCard);
            setSearchTerm(fetchedCard.name);
            setCompareCardData(null);

            if (fetchedCard.archetype) {
                const title = `Archetype: ${fetchedCard.archetype}`;
                setCarouselTitle(title);
                setLastSearchTitle(title); 
                fetchArchetype(fetchedCard.archetype);
            } else {
                setCarouselCards([]);
                setLastSearchResults([]);
            }
        } catch (err: any) { setError(err.message || 'Failed to fetch card.'); }
        finally { setLoading(false); }
    };

    const fetchArchetype = async (archetypeName: string) => {
        setLoadingCarousel(true);
        try {
            const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`);
            const data = await res.json();
            const results = data.data || [];
            setCarouselCards(results);
            setLastSearchResults(results); 
            setCurrentPage(0);
        } catch (err) { setCarouselCards([]); }
        finally { setLoadingCarousel(false); }
    };

    const handleSelectFromCarousel = (card: any) => {
        if (card.id === cardData?.id) return;
        setCardData(card);
        setSearchTerm(card.name);
    };

    const handleCompareFromCarousel = (e: React.MouseEvent, card: any) => {
        e.stopPropagation();
        if (card.id === compareCardData?.id || card.id === cardData?.id) return;
        setCompareCardData(card);
    };

    useEffect(() => {
        fetchCard(searchTerm);
        fetch('https://db.ygoprodeck.com/api/v7/archetypes.php')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAvailableArchetypes(data.map((a: any) => a.archetype_name)); })
        .catch(err => console.error('Failed to load archetypes:', err));
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCard(searchTerm);
    };

    const clearFilters = () => setFilters({ level: '', atk: '', def: '', format: '', type: '', race: '', archetype: '' });

    const renderBanlistBadge = (card: any) => {
        if (!card.banlist_info) return null;

        let status = 'Unlimited';
        if (filters.format === 'goat' && card.banlist_info.ban_goat) status = card.banlist_info.ban_goat;
        else if (filters.format === 'ocg' && card.banlist_info.ban_ocg) status = card.banlist_info.ban_ocg;
        else if (card.banlist_info.ban_tcg) status = card.banlist_info.ban_tcg;

        if (status === 'Unlimited') return null;

        const colors: any = {
            'Banned': 'bg-red-500/20 text-red-400 border-red-500/50',
            'Forbidden': 'bg-red-500/20 text-red-400 border-red-500/50',
            'Limited': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            'Semi-Limited': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
        };

        return (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ml-2 align-middle ${colors[status] || 'bg-slate-700 text-slate-300'}`}>
            {status}
            </span>
        );
    };

    const renderCardDetails = (card: any, label?: string) => (
        <div className="w-full flex flex-col md:flex-row gap-4 items-start relative">
            {label && <span className="absolute -top-3 right-0 bg-[#D6A033] text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded shadow">{label}</span>}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 pb-3 md:pb-0 md:pr-3">
                <h1 className="text-sm font-bold text-[#D6A033] leading-tight mb-1 truncate">{card.name}</h1>
                <div className="mb-1 flex items-center">
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 font-mono text-slate-300 inline-block">ID: {card.id}</span>
                    {renderBanlistBadge(card)}
                </div>
                <p className="text-[10px] text-slate-300 font-semibold mb-1">[{card.type}]</p>
                <p className="text-[10px] text-slate-400">{card.race} / {card.attribute}</p>
                {card.atk !== undefined && (
                    <div className="mt-2 pt-1 border-t border-slate-800 flex justify-between font-bold text-xs font-mono">
                        <span className="text-[#D6A033]">ATK / {card.atk}</span>
                        {card.def !== undefined && <span className="text-[#5B9BD5]">DEF / {card.def}</span>}
                    </div>
                )}
            </div>
            <div className="w-full md:w-2/3">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Effect</span>
                <p className="text-[10px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1 font-mono scrollbar-thin scrollbar-thumb-slate-700 whitespace-pre-wrap">{card.desc}</p>
            </div>
        </div>
    );

    const isCardInBinder = cardData ? binder.some(c => c.id === cardData.id) : false;

    return (
        <div className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#0B101E] font-sans text-white z-0 ${shake ? 'animate-shake' : ''}`}>
            
            <style>{`
                body, a, button, input, select, label, .cursor-pointer {
                    cursor: url('${import.meta.env.BASE_URL}millennium-eye.png') 16 16, auto !important;
                }
            `}</style>

            {cardData && (
                <Scene
                    cardImage={artOnly ? cardData.card_images[0].image_url_cropped : cardData.card_images[0].image_url}
                    compareCardImage={compareCardData ? (artOnly ? compareCardData.card_images[0].image_url_cropped : compareCardData.card_images[0].image_url) : undefined}
                    animState={animState} compareAnimState={compareAnimState} setIsZoomed={setIsZoomed} resetViewTrigger={resetViewTrigger} artOnly={artOnly} playmat={playmat}
                    idleAnimation={idleAnimation} 
                />
            )}

            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10 flex flex-col items-center pointer-events-none gap-3">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex gap-2 pointer-events-auto relative">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-2xl">
                        <div className="relative flex-1 flex">
                            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }} onFocus={() => { if (searchTerm.length >= 2) setShowSuggestions(true); }} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search name or ID..." className="flex-1 bg-transparent px-4 py-2 outline-none text-white placeholder-slate-400" />
                            <AnimatePresence>
                                {showSuggestions && searchSuggestions.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 w-full mt-3 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 scrollbar-thin scrollbar-thumb-slate-600">
                                        {searchSuggestions.map((card) => (
                                            <div key={card.id} onClick={() => { setSearchTerm(card.name); setShowSuggestions(false); fetchCard(card.name); }} className="flex items-center gap-3 px-3 py-2 hover:bg-[#D17B0F] cursor-pointer transition-colors border-b border-slate-700/50 last:border-0">
                                                <img src={card.card_images[0].image_url_cropped} alt={card.name} onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}card-back.jpg`; }} className="w-8 h-8 rounded object-cover bg-slate-900 shrink-0" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold text-slate-200 truncate">{card.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate">{card.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button type="submit" disabled={loading} className="bg-[#D17B0F] hover:bg-amber-600 transition px-5 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer shrink-0">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </form>

                    <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 ${showFilters ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                        <Filter className="w-4 h-4" /> Filters
                    </button>

                    <button onClick={loadBinder} className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white">
                        <BookOpen className="w-4 h-4" /> Binder
                    </button>

                    {lastSearchResults.length > 0 && carouselTitle !== lastSearchTitle && (
                        <button onClick={restoreLastSearch} className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                            <History className="w-4 h-4" /> History
                        </button>
                    )}
                </motion.div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="w-full bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl border border-slate-700 shadow-2xl pointer-events-auto flex flex-col gap-3 overflow-hidden">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative">
                                <input type="number" placeholder="Level/Rank (e.g. 4)" value={filters.level} onChange={(e) => setFilters({...filters, level: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F]" />
                                <input type="number" placeholder="ATK" value={filters.atk} onChange={(e) => setFilters({...filters, atk: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F]" />
                                <input type="number" placeholder="DEF" value={filters.def} onChange={(e) => setFilters({...filters, def: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F]" />

                                <select value={filters.format} onChange={(e) => setFilters({...filters, format: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F] text-slate-300">
                                    <option value="">Format (Any)</option>
                                    <option value="tcg">TCG Advanced</option>
                                    <option value="ocg">OCG</option>
                                    <option value="goat">Goat Format</option>
                                    <option value="edison">Edison Format</option>
                                    <option value="speed duel">Speed Duel</option>
                                </select>

                                <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F] text-slate-300">
                                    <option value="">Card Type (Any)</option>
                                    <option value="Effect Monster">Effect Monster</option>
                                    <option value="Normal Monster">Normal Monster</option>
                                    <option value="Fusion Monster">Fusion Monster</option>
                                    <option value="Synchro Monster">Synchro Monster</option>
                                    <option value="XYZ Monster">XYZ Monster</option>
                                    <option value="Link Monster">Link Monster</option>
                                    <option value="Ritual Monster">Ritual Monster</option>
                                    <option value="Spell Card">Spell Card</option>
                                    <option value="Trap Card">Trap Card</option>
                                </select>

                                <select value={filters.race} onChange={(e) => setFilters({...filters, race: e.target.value})} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F] text-slate-300">
                                    <option value="">Race/Property (Any)</option>
                                    <optgroup label="Monster Types">
                                        <option value="Dragon">Dragon</option>
                                        <option value="Spellcaster">Spellcaster</option>
                                        <option value="Zombie">Zombie</option>
                                        <option value="Warrior">Warrior</option>
                                        <option value="Machine">Machine</option>
                                        <option value="Fiend">Fiend</option>
                                        <option value="Fairy">Fairy</option>
                                        <option value="Cyberse">Cyberse</option>
                                    </optgroup>
                                    <optgroup label="Spell/Trap Types">
                                        <option value="Equip">Equip</option>
                                        <option value="Continuous">Continuous</option>
                                        <option value="Quick-Play">Quick-Play</option>
                                        <option value="Field">Field</option>
                                        <option value="Counter">Counter</option>
                                    </optgroup>
                                </select>

                                <div className="relative col-span-2 sm:col-span-3">
                                    <input type="text" placeholder="Search Archetype (e.g. Dragonmaid)..." value={filters.archetype} onChange={(e) => { setFilters({...filters, archetype: e.target.value}); setShowArchDropdown(true); }} onFocus={() => setShowArchDropdown(true)} onBlur={() => setTimeout(() => setShowArchDropdown(false), 200)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#D17B0F] text-slate-300 placeholder-slate-500" />
                                    {showArchDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                                            {availableArchetypes.filter(arch => arch.toLowerCase().includes(filters.archetype.toLowerCase())).map(arch => (
                                                <div key={arch} onClick={() => { setFilters({...filters, archetype: arch}); setShowArchDropdown(false); }} className="px-3 py-2 text-sm text-slate-300 hover:bg-[#D17B0F] hover:text-white cursor-pointer transition-colors">{arch}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end mt-2 border-t border-slate-800 pt-3">
                                <button onClick={clearFilters} className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition cursor-pointer">Clear</button>
                                <button onClick={fetchFilteredCards} className="px-6 py-1.5 rounded bg-[#D17B0F] hover:bg-amber-600 text-white text-sm font-semibold flex items-center gap-2 transition shadow-lg cursor-pointer">
                                    {loadingCarousel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Filters'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-900/90 border border-red-500 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md pointer-events-auto shadow-xl mt-1">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" /><span className="text-sm">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 left-6 z-10 pointer-events-auto hidden sm:block">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }} className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-2xl">
                    <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider px-1 pb-1 border-b border-slate-800">Actions</span>

                    {compareCardData && (
                        <button onClick={() => setCompareCardData(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500 hover:text-white transition cursor-pointer mb-2 shadow-lg shadow-red-500/20">
                            <X className="w-4 h-4" /> <span>End VS Mode</span>
                        </button>
                    )}

                    <button onClick={toggleBinder} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 border ${isCardInBinder ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 hover:bg-indigo-500 hover:text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                        {isCardInBinder ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />} <span>{isCardInBinder ? 'In Binder' : 'Add to Binder'}</span>
                    </button>

                    <button onClick={findRelatedSupport} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer mb-1">
                        <LinkIcon className="w-4 h-4 text-cyan-400" /> <span>Related Support</span>
                    </button>

                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-slate-950 transition cursor-pointer mb-1">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPlaymat(URL.createObjectURL(file)); }} />
                        <Grid className="w-4 h-4 text-purple-400" /> <span>{playmat ? 'Change Mat' : 'Upload Mat'}</span>
                    </label>

                    {playmat && (
                        <button onClick={() => setPlaymat(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:bg-red-900/50 hover:text-red-300 transition cursor-pointer mb-1">
                            <X className="w-4 h-4" /> <span>Remove Mat</span>
                        </button>
                    )}

                    <button onClick={() => setArtOnly(!artOnly)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 ${artOnly ? 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                        <ImageIcon className={`w-4 h-4 ${artOnly ? 'text-fuchsia-400' : ''}`} /> <span>{artOnly ? 'Full Card' : 'HD Art Only'}</span>
                    </button>

                    <button onClick={() => setIdleAnimation(!idleAnimation)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 ${idleAnimation ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300 shadow-lg shadow-teal-500/10' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                        {idleAnimation ? <Pause className="w-4 h-4 text-teal-400" /> : <Play className="w-4 h-4" />} <span>{idleAnimation ? 'Pause Idle' : 'Play Idle'}</span>
                    </button>

                    <button onClick={() => setShowObtain(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer mb-1">
                        <Package className="w-4 h-4 text-emerald-400" /> <span>How to Obtain</span>
                    </button>

                    <button onClick={handleSummonSlam} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer">
                        <Zap className="w-4 h-4 text-amber-400" /> <span>Summon</span>
                    </button>

                    <button onClick={() => { setAnimState(animState === 'set' ? 'default' : 'set'); if (compareCardData) setCompareAnimState(compareAnimState === 'set' ? 'default' : 'set'); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500 hover:text-slate-950 transition cursor-pointer">
                        <Shield className="w-4 h-4 text-blue-400" /> <span>{animState === 'set' ? 'Flip Up' : 'Set Card'}</span>
                    </button>

                    <button onClick={handleAttackLunge} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-slate-950 transition cursor-pointer">
                        <Swords className="w-4 h-4 text-red-400" /> <span>Attack</span>
                    </button>

                    <button onClick={() => { setAnimState('default'); if (compareCardData) setCompareAnimState('default'); setResetViewTrigger(prev => prev + 1); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer mt-2">
                        <RotateCcw className="w-4 h-4" /> <span>Reset View</span>
                    </button>
                </motion.div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-6 z-10 pointer-events-auto hidden lg:block">
                <AnimatePresence>
                    {carouselCards.length > 0 && (() => {
                        const totalPages = Math.ceil(carouselCards.length / CARDS_PER_PAGE);
                        const startIndex = currentPage * CARDS_PER_PAGE;
                        const displayedCards = carouselCards.slice(startIndex, startIndex + CARDS_PER_PAGE);

                        return (
                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }} className="flex flex-col w-64 max-h-[70vh] bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl">
                                <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-slate-800 text-xs font-bold text-[#D6A033]">
                                    <Layers className="w-4 h-4 shrink-0" /><span className="truncate">{carouselTitle}</span><span className="ml-auto bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{carouselCards.length}</span>
                                    <button onClick={() => { setCarouselCards([]); setCarouselTitle(''); }} className="ml-1 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-lg mb-2 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                        <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 hover:bg-[#D17B0F] transition cursor-pointer font-bold">←</button>
                                        <span>Page {currentPage + 1} of {totalPages}</span>
                                        <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 hover:bg-[#D17B0F] transition cursor-pointer font-bold">→</button>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 flex-1">
                                    {loadingCarousel ? (
                                        <div className="flex justify-center py-6 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                                    ) : (
                                        displayedCards.map((card, idx) => {
                                            const isSelected = card.id === cardData?.id;
                                            return (
                                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }} key={card.id} className={`flex items-center gap-1 p-1 rounded-lg border ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/40 border-transparent hover:bg-slate-800'}`}>
                                                    <button onClick={() => handleSelectFromCarousel(card)} className="flex-1 flex items-center gap-2 overflow-hidden text-left cursor-pointer">
                                                        <img src={card.card_images[0].image_url_cropped} alt={card.name} onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}card-back.jpg`; }} className="w-8 h-8 rounded object-cover shrink-0 bg-slate-950 border border-slate-700" />
                                                        <div className="overflow-hidden">
                                                            <p className={`text-[10px] font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{card.name}</p>
                                                            <span className="text-[8px] text-slate-400 font-mono">{card.type.replace(' Monster', '')}</span>
                                                        </div>
                                                    </button>
                                                    {!isSelected && <button onClick={(e) => handleCompareFromCarousel(e, card)} className="shrink-0 px-2 py-1.5 bg-slate-900 border border-slate-700 hover:border-[#D6A033] hover:text-[#D6A033] text-slate-400 rounded-md text-[9px] font-bold transition-all cursor-pointer">VS</button>}
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>

            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-4 z-10 transition-all duration-500 ease-in-out ${isZoomed ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'} ${compareCardData ? 'max-w-5xl' : 'max-w-2xl'}`}>
                <AnimatePresence>
                    {cardData && !isZoomed && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[#0F1423] p-5 rounded-xl border border-slate-700 shadow-2xl flex flex-col md:flex-row gap-6">
                            <div className={`flex-1 ${compareCardData ? 'border-b md:border-b-0 md:border-r border-slate-800 md:pr-6' : ''}`}>
                                {renderCardDetails(cardData, compareCardData ? "CARD A" : undefined)}
                            </div>
                            {compareCardData && <div className="flex-1">{renderCardDetails(compareCardData, "CARD B")}</div>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showObtain && cardData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B101E]/80 backdrop-blur-sm pointer-events-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#D6A033]">How to Obtain</h2>
                                    <p className="text-xs text-slate-400">Availability for <span className="text-white font-semibold">{cardData.name}</span></p>
                                </div>
                                <button onClick={() => setShowObtain(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer border border-slate-700 hover:border-slate-500"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="mb-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Filter by Game / Format</span>
                                <div className="flex flex-wrap gap-2">
                                    {(cardData.misc_info?.[0]?.formats || (cardData.card_sets ? ['TCG'] : [])).map((format: string) => (
                                        <label key={format} className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${selectedGames.includes(format) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                            <input type="checkbox" checked={selectedGames.includes(format)} onChange={(e) => { if (e.target.checked) setSelectedGames([...selectedGames, format]); else setSelectedGames(selectedGames.filter(g => g !== format)); }} className="hidden" />
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${selectedGames.includes(format) ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`}>{selectedGames.includes(format) && <div className="w-1.5 h-1.5 bg-slate-900 rounded-sm" />}</div>
                                            {format}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2 space-y-4 flex-1">
                                {selectedGames.includes('TCG') && cardData.card_sets && cardData.card_sets.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-[#D17B0F]" /><h3 className="text-[#D17B0F] font-bold text-sm uppercase tracking-wider">Physical Prints (TCG)</h3></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {cardData.card_sets.map((set: any, i: number) => (
                                                <div key={i} className="bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-lg flex flex-col justify-between hover:bg-slate-800 transition-colors">
                                                    <span className="text-xs font-semibold text-slate-200 leading-tight">{set.set_name}</span>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">{set.set_code} - {set.set_rarity}</span>
                                                        {set.set_price && set.set_price !== "0.00" && set.set_price !== "0" && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-800/50">${set.set_price}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedGames.includes('Master Duel') && (
                                    <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-lg">
                                        <h3 className="text-blue-400 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Yu-Gi-Oh! Master Duel</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">This card is legally available in the game. It can be obtained through Master Packs, relevant Secret Packs, or crafted directly in the Deck Builder using Crafting Points (CP).<br /><span className="text-[10px] text-slate-500 italic mt-1 block">*Note: The public API database does not track specific digital Secret Pack distributions.</span></p>
                                    </div>
                                )}
                                {selectedGames.includes('Duel Links') && (
                                    <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-lg">
                                        <h3 className="text-red-400 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Yu-Gi-Oh! Duel Links</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">This card is available in Duel Links. You can find its specific Box, Event, or Trader availability natively inside the game's internal Card Catalog.</p>
                                    </div>
                                )}
                                {selectedGames.filter(g => g !== 'TCG' && g !== 'Master Duel' && g !== 'Duel Links').length > 0 && (
                                    <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-lg">
                                        <h3 className="text-purple-400 font-bold text-sm mb-1 uppercase tracking-wider">Other Formats</h3>
                                        <p className="text-xs text-slate-300">Also legally available in: <span className="font-semibold text-white">{selectedGames.filter(g => g !== 'TCG' && g !== 'Master Duel' && g !== 'Duel Links').join(', ')}</span></p>
                                    </div>
                                )}
                                {selectedGames.length === 0 && <div className="text-center py-8 text-slate-500 text-sm italic">Select a game or format above to view availability.</div>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}