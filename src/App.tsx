import React, { useState, useEffect, useMemo } from 'react';
import { Scene } from './Scene';
import type { AnimState } from './Card3D';
import { Search, Loader2, ShieldAlert, RotateCcw, Layers, X, Filter, Image as ImageIcon, Package, Bookmark, BookmarkCheck, BookOpen, Link as LinkIcon, Grid, History, Play, Pause, Sparkles, Archive, Home, SkipForward, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePacks } from './PackEngine';

const RarityBanner = ({ rarity }: { rarity: string }) => {
    const r = (rarity || 'Common').toLowerCase();

    if (r.includes('ghost')) {
        return (
            <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0.4, 0.8, 0.5], scale: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl md:text-3xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-cyan-100 via-white to-cyan-200 drop-shadow-[0_0_12px_rgba(207,250,254,0.6)] mb-3 text-center filter contrast-125"
            >
                {rarity}
            </motion.h2>
        );
    }

    if (r.includes('century') || r.includes('starlight') || r.includes('secret') || r.includes('prismatic')) {
        return (
            <motion.h2
                initial={{ scale: 0, opacity: 0, rotateX: 90 }}
                animate={{ scale: [1.2, 1], opacity: 1, rotateX: 0, backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 0.5, type: 'spring', backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' } }}
                className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-[linear-gradient(90deg,#ff3366,#ff7f00,#ffff33,#33ff33,#3333ff,#4b0082,#9400d3,#ff3366)] bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] mb-3 text-center"
            >
                {rarity}
            </motion.h2>
        );
    }
    if (r.includes('ultra') || r.includes('ultimate') || r.includes('gold') || r.includes('collector')) {
        return (
            <motion.h2
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1.2, 1], opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)] mb-3 text-center"
            >
                {rarity}
            </motion.h2>
        );
    }
    if (r.includes('super') || r.includes('platinum') || r.includes('parallel') || r.includes('foil')) {
        return (
            <motion.h2
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-3 text-center"
            >
                {rarity}
            </motion.h2>
        );
    }
    if (r.includes('rare')) {
        return (
            <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-lg md:text-2xl font-bold uppercase tracking-[0.15em] text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)] mb-3 text-center"
            >
                {rarity}
            </motion.h2>
        );
    }
    
    return (
        <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg md:text-2xl font-bold uppercase tracking-[0.15em] text-slate-400 drop-shadow-md mb-3 text-center"
        >
            {rarity || 'Common'}
        </motion.h2>
    );
};

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
    const [showMobileCarousel, setShowMobileCarousel] = useState(false);
    const CARDS_PER_PAGE = 50;

    const [lastSearchResults, setLastSearchResults] = useState<any[]>([]);
    const [lastSearchTitle, setLastSearchTitle] = useState('');

    const [availableArchetypes, setAvailableArchetypes] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showArchDropdown, setShowArchDropdown] = useState(false);

    const [collectionRarityFilter, setCollectionRarityFilter] = useState('');
    const [collectionSetFilter, setCollectionSetFilter] = useState('');

    const [filters, setFilters] = useState({
        level: '', atk: '', def: '', format: '', type: '', race: '', archetype: ''
    });

    const [binder, setBinder] = useState<any[]>(() => {
        const saved = localStorage.getItem('ygo-binder');
        return saved ? JSON.parse(saved) : [];
    });

    const [collection, setCollection] = useState<any[]>(() => {
        const saved = localStorage.getItem('ygo-collection');
        return saved ? JSON.parse(saved) : [];
    });

    const [cardSets, setCardSets] = useState<any[]>([]);
    const [showSimulator, setShowSimulator] = useState(false);
    const [selectedSet, setSelectedSet] = useState('');
    const [packMode, setPackMode] = useState(false);
    const [packSealed, setPackSealed] = useState(false);
    const [showPullSummary, setShowPullSummary] = useState(false);
    const [activeSetCoverImage, setActiveSetCoverImage] = useState('');
    const [pulledCards, setPulledCards] = useState<any[]>([]);
    const [currentPullIndex, setCurrentPullIndex] = useState(0);
    const [isOpeningPack, setIsOpeningPack] = useState(false);

    useEffect(() => {
        localStorage.setItem('ygo-binder', JSON.stringify(binder));
    }, [binder]);

    useEffect(() => {
        localStorage.setItem('ygo-collection', JSON.stringify(collection));
    }, [collection]);

    const processedCollection = useMemo(() => {
        return collection.filter(card => {
            const matchesRarity = !collectionRarityFilter || card.pulled_rarity === collectionRarityFilter;
            const matchesSet = !collectionSetFilter || card.pulled_set === collectionSetFilter;
            return matchesRarity && matchesSet;
        });
    }, [collection, collectionRarityFilter, collectionSetFilter]);

    const uniqueCollectionRarities = useMemo(() => {
        const rarities = collection.map(c => c.pulled_rarity).filter(Boolean);
        return Array.from(new Set(rarities)).sort();
    }, [collection]);

    const uniqueCollectionSets = useMemo(() => {
        const sets = collection.map(c => c.pulled_set).filter(Boolean);
        return Array.from(new Set(sets)).sort();
    }, [collection]);

    const filteredSummaryCards = useMemo(() => {
        return pulledCards.filter(card => {
            const matchesRarity = !collectionRarityFilter || card.pulled_rarity === collectionRarityFilter;
            const matchesSet = !collectionSetFilter || card.pulled_set === collectionSetFilter;
            return matchesRarity && matchesSet;
        });
    }, [pulledCards, collectionRarityFilter, collectionSetFilter]);

    const currentDisplayList = useMemo(() => {
        if (carouselTitle === 'My Collection') return processedCollection;
        if (carouselTitle === 'My Binder') return binder;
        return carouselCards;
    }, [carouselTitle, processedCollection, binder, carouselCards]);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(currentDisplayList.length / CARDS_PER_PAGE) - 1);
        if (currentPage > maxPage) setCurrentPage(maxPage);
    }, [currentDisplayList.length, currentPage]);

    const displayedCards = currentDisplayList.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

    const toggleBinder = () => {
        if (!cardData) return;
        const exists = binder.find(c => c.id === cardData.id);
        if (exists) setBinder(binder.filter(c => c.id !== cardData.id));
        else setBinder([...binder, cardData]);
    };

    const loadBinder = () => {
        if (binder.length === 0) {
            setError("Your binder is empty!");
            setTimeout(() => setError(""), 3000);
            return;
        }
        setCarouselTitle('My Binder');
        setCurrentPage(0);
        setCardData(binder[0]);
        setCompareCardData(null);
        setShowMobileCarousel(true);
    };

    const loadCollection = () => {
        if (collection.length === 0) {
            setError("Your collection is empty!");
            setTimeout(() => setError(""), 3000);
            return;
        }
        setCarouselTitle('My Collection');
        setCurrentPage(0);
        setCardData(processedCollection[0] || collection[0]);
        setCompareCardData(null);
        setShowMobileCarousel(true);
    };

    const restoreLastSearch = () => {
        if (lastSearchResults.length > 0) {
            setCarouselCards(lastSearchResults);
            setCarouselTitle(lastSearchTitle);
            setCurrentPage(0);
            setShowMobileCarousel(true);
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
                    setShowMobileCarousel(true);
                } else {
                    throw new Error('');
                }
            } else {
                throw new Error('');
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

    const handleOpenPacks = async (count: number) => {
        if (!selectedSet) return;
        setPackMode(true);
        setPackSealed(true);
        setIsOpeningPack(true);
        setAnimState('default');
        setShowSimulator(false);
        setResetViewTrigger(prev => prev + 1);

        try {
            const packs = await generatePacks(selectedSet, count);
            const flatCards = packs.flatMap(p => p.cards).filter(Boolean);
            const foils = flatCards.filter(c => c.pulled_rarity && (c.pulled_rarity.toLowerCase().includes('secret') || c.pulled_rarity.toLowerCase().includes('ultra') || c.pulled_rarity.toLowerCase().includes('super') || c.pulled_rarity.toLowerCase().includes('ghost') || c.pulled_rarity.toLowerCase().includes('ultimate') || c.pulled_rarity.toLowerCase().includes('century') || c.pulled_rarity.toLowerCase().includes('collector')));
            const cover = foils.length > 0 ? foils[0].card_images[0].image_url_cropped : flatCards[0].card_images[0].image_url_cropped;
            
            setActiveSetCoverImage(cover);
            setPulledCards(flatCards);
            setCurrentPullIndex(0);
            setIsOpeningPack(false);
        } catch (err) {
            setError('Failed to open packs.');
            setIsOpeningPack(false);
            setPackMode(false);
            setPackSealed(false);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleTearPack = () => {
        setAnimState('attack');
        setTimeout(() => {
            setPackSealed(false);
            setCollection(prev => [...prev, ...pulledCards]);
            setCardData(pulledCards[0]);
            setAnimState('set');
            setTimeout(() => { setAnimState('default'); triggerShake(); }, 300);
        }, 300);
    };

    const handleSkipAll = () => {
        setPackMode(false);
        setPackSealed(false);
        setShowPullSummary(true);
    };

    const handleGoHome = () => {
        setPackMode(false);
        setPackSealed(false);
        setShowPullSummary(false);
        setPulledCards([]);
        setResetViewTrigger(prev => prev + 1);
    };

    const getRarityColor = (rarity: string) => {
        if (!rarity) return 'text-slate-300 border-slate-700';
        const r = rarity.toLowerCase();
        if (r.includes('ghost')) return 'text-cyan-100 border-cyan-200 shadow-[0_0_12px_rgba(207,250,254,0.5)] filter contrast-125';
        if (r.includes('secret') || r.includes('starlight') || r.includes('prismatic') || r.includes('century')) return 'text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]';
        if (r.includes('ultra') || r.includes('ultimate') || r.includes('gold') || r.includes('collector')) return 'text-yellow-400 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
        if (r.includes('super') || r.includes('platinum') || r.includes('parallel') || r.includes('foil')) return 'text-slate-100 border-slate-300 shadow-[0_0_10px_rgba(209,213,219,0.5)]';
        if (r.includes('rare')) return 'text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
        return 'text-slate-400 border-slate-700';
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
            if (data.error) throw new Error('');

            const allResults = data.data || [];
            setCarouselCards(allResults);
            setLastSearchResults(allResults); 
            setCurrentPage(0);
            setCarouselTitle(`Results (${allResults.length})`);
            setLastSearchTitle(`Results (${allResults.length})`);

            if (allResults.length > 0) {
                setCardData(allResults[0]);
                setCompareCardData(null);
                setShowMobileCarousel(true);
            }
        } catch (err: any) {
            setError('Failed to fetch filtered cards.');
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
            if (data.error || !data.data || data.data.length === 0) throw new Error('');

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
                setShowMobileCarousel(false);
            }
        } catch (err: any) { setError('Failed to fetch card.'); }
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
            setShowMobileCarousel(true);
        } catch (err) { setCarouselCards([]); }
        finally { setLoadingCarousel(false); }
    };

    const handleSelectFromCarousel = (card: any) => {
        if (card.id === cardData?.id) return;
        setCardData(card);
        setSearchTerm(card.name);
        if (window.innerWidth < 1024) {
            setShowMobileCarousel(false);
        }
    };

    const handleCompareFromCarousel = (e: React.MouseEvent, card: any) => {
        e.stopPropagation();
        if (card.id === compareCardData?.id || card.id === cardData?.id) return;
        setCompareCardData(card);
        if (window.innerWidth < 1024) {
            setShowMobileCarousel(false);
        }
    };

    useEffect(() => {
        fetchCard(searchTerm);
        fetch('https://db.ygoprodeck.com/api/v7/archetypes.php')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAvailableArchetypes(data.map((a: any) => a.archetype_name)); })
        .catch(() => {});

        fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setCardSets(data);
                if (data.length > 0) setSelectedSet(data[0].set_name);
            }
        })
        .catch(() => {});
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
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 font-mono text-slate-300 inline-block">ID: {card.id.toString().split('-')[0]}</span>
                    {card.pulled_rarity && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-800/50 ml-2">
                            {card.pulled_rarity}
                        </span>
                    )}
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
                <p className="text-[10px] text-slate-300 leading-relaxed overflow-y-auto pr-1 font-mono scrollbar-thin scrollbar-thumb-slate-700 whitespace-pre-wrap max-h-24 md:max-h-32">{card.desc}</p>
            </div>
        </div>
    );

    const isCardInBinder = cardData ? binder.some(c => c.id === cardData.id) : false;

    const renderActionButtons = () => (
        <React.Fragment>
            {compareCardData && (
                <button onClick={() => setCompareCardData(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500 hover:text-white transition cursor-pointer lg:mb-2 shadow-lg shadow-red-500/20 shrink-0">
                    <X className="w-4 h-4" /> <span>End VS Mode</span>
                </button>
            )}
            <button onClick={() => setShowSimulator(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500 hover:text-white transition cursor-pointer mb-1 lg:mb-0 shrink-0">
                <Sparkles className="w-4 h-4 text-blue-400" /> <span>Pack Simulator</span>
            </button>
            <button onClick={toggleBinder} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 lg:mb-0 shrink-0 border ${isCardInBinder ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 hover:bg-indigo-500 hover:text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                {isCardInBinder ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />} <span>{isCardInBinder ? 'In Binder' : 'Add to Binder'}</span>
            </button>
            <button onClick={findRelatedSupport} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer mb-1 lg:mb-0 shrink-0">
                <LinkIcon className="w-4 h-4 text-cyan-400" /> <span>Related Support</span>
            </button>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-slate-950 transition cursor-pointer mb-1 lg:mb-0 shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPlaymat(URL.createObjectURL(file)); }} />
                <Grid className="w-4 h-4 text-purple-400" /> <span>{playmat ? 'Change Mat' : 'Upload Mat'}</span>
            </label>
            {playmat && (
                <button onClick={() => setPlaymat(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:bg-red-900/50 hover:text-red-300 transition cursor-pointer mb-1 lg:mb-0 shrink-0">
                    <X className="w-4 h-4" /> <span>Remove Mat</span>
                </button>
            )}
            <button onClick={() => setArtOnly(!artOnly)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 lg:mb-0 shrink-0 ${artOnly ? 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                <ImageIcon className={`w-4 h-4 ${artOnly ? 'text-fuchsia-400' : ''}`} /> <span>{artOnly ? 'Full Card' : 'HD Art Only'}</span>
            </button>
            <button onClick={() => setIdleAnimation(!idleAnimation)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer mb-1 lg:mb-0 shrink-0 ${idleAnimation ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300 shadow-lg shadow-teal-500/10' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                {idleAnimation ? <Pause className="w-4 h-4 text-teal-400" /> : <Play className="w-4 h-4" />} <span>{idleAnimation ? 'Pause Idle' : 'Play Idle'}</span>
            </button>
            <button onClick={() => setShowObtain(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer mb-1 lg:mb-0 shrink-0">
                <Package className="w-4 h-4 text-emerald-400" /> <span>How to Obtain</span>
            </button>
            <button onClick={() => { setAnimState('default'); if (compareCardData) setCompareAnimState('default'); setResetViewTrigger(prev => prev + 1); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer lg:mt-2 shrink-0">
                <RotateCcw className="w-4 h-4" /> <span>Reset View</span>
            </button>
        </React.Fragment>
    );

    return (
        <div className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#0B101E] font-sans text-white z-0 ${shake ? 'animate-shake' : ''}`}>
            
            {cardData && !showPullSummary && (
                <Scene
                    cardImage={artOnly ? cardData.card_images[0].image_url_cropped : cardData.card_images[0].image_url}
                    compareCardImage={compareCardData ? (artOnly ? compareCardData.card_images[0].image_url_cropped : compareCardData.card_images[0].image_url) : undefined}
                    animState={animState} compareAnimState={compareAnimState} setIsZoomed={setIsZoomed} resetViewTrigger={resetViewTrigger} artOnly={artOnly} playmat={playmat}
                    idleAnimation={idleAnimation} packMode={packMode} packSealed={packSealed} activeSetCoverImage={activeSetCoverImage}
                />
            )}

            {!packMode && !showPullSummary && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95vw] md:w-full md:max-w-xl z-[100] flex flex-col gap-2 pointer-events-none">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-[100] flex gap-2 pointer-events-auto w-full">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 md:p-2 rounded-xl border border-slate-700 shadow-2xl">
                            <div className="relative flex-1 flex">
                                <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }} onFocus={() => { if (searchTerm.length >= 2) setShowSuggestions(true); }} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search name or ID..." className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-white placeholder-slate-400" />
                                <AnimatePresence>
                                    {showSuggestions && searchSuggestions.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 w-full mt-3 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[100] scrollbar-thin scrollbar-thumb-slate-600">
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
                            <button type="submit" disabled={loading} className="bg-[#D17B0F] hover:bg-amber-600 transition px-4 py-1.5 rounded-lg font-medium flex items-center gap-2 cursor-pointer shrink-0">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </button>
                        </form>
                    </motion.div>

                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-40 flex gap-2 overflow-x-auto scrollbar-none pointer-events-auto w-full pb-1">
                        <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 ${showFilters ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                            <Filter className="w-3.5 h-3.5" /> Filters
                        </button>
                        <button onClick={loadBinder} className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white">
                            <BookOpen className="w-3.5 h-3.5" /> Binder
                        </button>
                        <button onClick={loadCollection} className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-white">
                            <Archive className="w-3.5 h-3.5" /> Collection
                        </button>
                        {lastSearchResults.length > 0 && carouselTitle !== lastSearchTitle && (
                            <button onClick={restoreLastSearch} className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <History className="w-3.5 h-3.5" /> History
                            </button>
                        )}
                        {carouselCards.length > 0 && (
                            <button onClick={() => setShowMobileCarousel(true)} className="lg:hidden px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition cursor-pointer shadow-2xl backdrop-blur-md shrink-0 bg-[#D17B0F]/20 border-[#D17B0F] text-[#D17B0F] hover:bg-[#D17B0F] hover:text-white">
                                <Layers className="w-3.5 h-3.5" /> Results ({carouselCards.length})
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
            )}

            {!packMode && !showPullSummary && (
                <div className="absolute top-1/2 -translate-y-1/2 left-6 z-[90] pointer-events-auto hidden lg:block">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }} className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-2xl">
                        <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider px-1 pb-1 border-b border-slate-800">Actions</span>
                        {renderActionButtons()}
                    </motion.div>
                </div>
            )}

            {!packMode && !showPullSummary && (
                <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[90] pointer-events-auto hidden lg:block">
                    <AnimatePresence>
                        {carouselCards.length > 0 && (() => {
                            const totalPages = Math.ceil(currentDisplayList.length / CARDS_PER_PAGE);
                            
                            return (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }} className="flex flex-col w-64 max-h-[70vh] bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl">
                                    <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-slate-800 text-xs font-bold text-[#D6A033]">
                                        <Layers className="w-4 h-4 shrink-0" /><span className="truncate">{carouselTitle}</span><span className="ml-auto bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{currentDisplayList.length}</span>
                                        <button onClick={() => { setCarouselCards([]); setCarouselTitle(''); }} className="ml-1 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {carouselTitle === 'My Collection' && (
                                        <div className="flex flex-col gap-1.5 mb-2 pb-2 border-b border-slate-800">
                                            <select value={collectionRarityFilter} onChange={(e) => { setCollectionRarityFilter(e.target.value); setCurrentPage(0); }} className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 outline-none w-full cursor-pointer focus:border-[#D17B0F]">
                                                <option value="">All Rarities</option>
                                                {uniqueCollectionRarities.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <select value={collectionSetFilter} onChange={(e) => { setCollectionSetFilter(e.target.value); setCurrentPage(0); }} className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 outline-none w-full cursor-pointer focus:border-[#D17B0F]">
                                                <option value="">All Sets</option>
                                                {uniqueCollectionSets.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button onClick={() => {
                                                if (window.confirm("Are you sure you want to completely reset and delete your entire collection?")) {
                                                    setCollection([]);
                                                    setCarouselTitle('');
                                                    setShowMobileCarousel(false);
                                                }
                                            }} className="mt-1 bg-red-900/40 hover:bg-red-500 text-red-300 border border-red-500/50 rounded px-2 py-1 text-[10px] uppercase font-bold transition cursor-pointer">
                                                Reset Collection
                                            </button>
                                        </div>
                                    )}
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
                                                                <span className="text-[8px] text-slate-400 font-mono">{card.pulled_rarity || card.type.replace(' Monster', '')}</span>
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
            )}

            <AnimatePresence>
                {showMobileCarousel && !packMode && !showPullSummary && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex justify-end pointer-events-auto lg:hidden">
                        {carouselCards.length > 0 && (() => {
                            const totalPages = Math.ceil(currentDisplayList.length / CARDS_PER_PAGE);

                            return (
                                <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className="w-[85vw] sm:w-80 h-full bg-slate-900 shadow-2xl flex flex-col border-l border-slate-800">
                                    <div className="flex items-center gap-1.5 p-4 border-b border-slate-800 text-sm font-bold text-[#D6A033]">
                                        <Layers className="w-5 h-5 shrink-0" /><span className="truncate">{carouselTitle}</span><span className="ml-auto bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{currentDisplayList.length}</span>
                                        <button onClick={() => setShowMobileCarousel(false)} className="ml-2 text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition cursor-pointer">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {carouselTitle === 'My Collection' && (
                                        <div className="flex flex-col gap-2 p-4 border-b border-slate-800 bg-slate-950/20">
                                            <select value={collectionRarityFilter} onChange={(e) => { setCollectionRarityFilter(e.target.value); setCurrentPage(0); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none w-full cursor-pointer focus:border-[#D17B0F]">
                                                <option value="">All Rarities</option>
                                                {uniqueCollectionRarities.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <select value={collectionSetFilter} onChange={(e) => { setCollectionSetFilter(e.target.value); setCurrentPage(0); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none w-full cursor-pointer focus:border-[#D17B0F]">
                                                <option value="">All Sets</option>
                                                {uniqueCollectionSets.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button onClick={() => {
                                                if (window.confirm("Are you sure you want to completely reset and delete your entire collection?")) {
                                                    setCollection([]);
                                                    setCarouselTitle('');
                                                    setShowMobileCarousel(false);
                                                }
                                            }} className="mt-2 bg-red-900/40 hover:bg-red-500 text-red-300 border border-red-500/50 rounded-lg px-3 py-2 text-xs uppercase font-bold transition cursor-pointer">
                                                Reset Collection
                                            </button>
                                        </div>
                                    )}
                                    {totalPages > 1 && (
                                        <div className="flex justify-between items-center bg-slate-950/40 p-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
                                            <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} className="px-3 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 hover:bg-[#D17B0F] transition cursor-pointer font-bold">←</button>
                                            <span>Page {currentPage + 1} of {totalPages}</span>
                                            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} className="px-3 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 hover:bg-[#D17B0F] transition cursor-pointer font-bold">→</button>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 overflow-y-auto p-3 flex-1">
                                        {loadingCarousel ? (
                                            <div className="flex justify-center py-6 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                                        ) : (
                                            displayedCards.map((card, idx) => {
                                                const isSelected = card.id === cardData?.id;
                                                return (
                                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }} key={card.id} className={`flex items-center gap-2 p-2 rounded-lg border ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/40 border-transparent hover:bg-slate-800'}`}>
                                                        <button onClick={() => handleSelectFromCarousel(card)} className="flex-1 flex items-center gap-3 overflow-hidden text-left cursor-pointer">
                                                            <img src={card.card_images[0].image_url_cropped} alt={card.name} onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}card-back.jpg`; }} className="w-12 h-12 rounded object-cover shrink-0 bg-slate-950 border border-slate-700" />
                                                            <div className="overflow-hidden">
                                                                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{card.name}</p>
                                                                <span className="text-[10px] text-slate-400 font-mono">{card.pulled_rarity || card.type.replace(' Monster', '')}</span>
                                                            </div>
                                                        </button>
                                                        {!isSelected && <button onClick={(e) => handleCompareFromCarousel(e, card)} className="shrink-0 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-[#D6A033] hover:text-[#D6A033] text-slate-400 rounded-md text-[10px] font-bold transition-all cursor-pointer">VS</button>}
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {!packMode && !showPullSummary && (
                <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center z-[80] transition-all duration-300 ${isZoomed ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    <div className={`w-full overflow-x-auto px-4 pb-2 pt-2 scrollbar-none flex gap-2 lg:hidden ${isZoomed ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                        {renderActionButtons()}
                    </div>
                    
                    <div className={`w-full px-2 md:px-4 pb-2 md:pb-6 ${isZoomed ? 'pointer-events-none' : 'pointer-events-auto'} ${compareCardData ? 'max-w-5xl' : 'max-w-2xl'}`}>
                        <AnimatePresence>
                            {cardData && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[#0F1423]/95 backdrop-blur-md p-3 md:p-5 rounded-xl border border-slate-700 shadow-2xl flex flex-col md:flex-row gap-4 max-h-[35vh] md:max-h-[40vh] overflow-y-auto w-full">
                                    <div className={`flex-1 ${compareCardData ? 'border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6' : ''}`}>
                                        {renderCardDetails(cardData, compareCardData ? "CARD A" : undefined)}
                                    </div>
                                    {compareCardData && <div className="flex-1">{renderCardDetails(compareCardData, "CARD B")}</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {packMode && packSealed && !isOpeningPack && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto flex flex-col items-center gap-4">
                    <button onClick={handleTearPack} className="px-8 py-3 rounded-full font-bold bg-[#D17B0F] hover:bg-amber-500 text-white text-lg shadow-2xl transition hover:scale-105 cursor-pointer">
                        <Unlock className="w-5 h-5 inline-block mr-2" /> Tear Open Pack
                    </button>
                    <button onClick={handleSkipAll} className="px-6 py-2 rounded-full font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm shadow-xl transition cursor-pointer">
                        <SkipForward className="w-4 h-4 inline-block mr-2" /> Skip All Packs
                    </button>
                </div>
            )}

            {packMode && !packSealed && pulledCards.length > 0 && !showPullSummary && (
                <React.Fragment>
                    <div className="absolute top-12 md:top-16 left-1/2 -translate-x-1/2 z-[200] pointer-events-none text-center">
                        <AnimatePresence mode="wait">
                            <RarityBanner key={cardData?.id} rarity={cardData?.pulled_rarity} />
                        </AnimatePresence>
                    </div>
                    
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl pointer-events-auto w-max">
                        <span className="text-xs font-mono text-slate-400 font-bold px-2 whitespace-nowrap">CARD {currentPullIndex + 1} OF {pulledCards.length}</span>
                        <button onClick={() => {
                            if (currentPullIndex < pulledCards.length - 1) {
                                setCurrentPullIndex(prev => prev + 1);
                                setCardData(pulledCards[currentPullIndex + 1]);
                                setAnimState('set');
                                setTimeout(() => { 
                                    setAnimState('default'); 
                                }, 200);
                            } else {
                                setShowPullSummary(true);
                            }
                        }} className="px-6 py-2 rounded-xl font-bold bg-[#D17B0F] hover:bg-amber-500 text-white transition cursor-pointer whitespace-nowrap">
                            {currentPullIndex < pulledCards.length - 1 ? 'Next Card' : 'Finish Packs'}
                        </button>
                        <button onClick={handleSkipAll} className="px-4 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer whitespace-nowrap hidden sm:block">
                            Skip All
                        </button>
                    </div>
                </React.Fragment>
            )}

            <AnimatePresence>
                {showSimulator && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#0B101E]/80 backdrop-blur-sm pointer-events-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
                                <div>
                                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Pack Simulator</h2>
                                    <p className="text-xs text-slate-400 mt-1">Select a set to open virtual booster packs.</p>
                                </div>
                                <button onClick={() => setShowSimulator(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer border border-slate-700 hover:border-slate-500"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Set</span>
                                    <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-200 w-full cursor-pointer">
                                        {cardSets.map((set, i) => (
                                            <option key={i} value={set.set_name}>{set.set_name} ({set.num_of_cards} Cards)</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    <button onClick={() => handleOpenPacks(1)} className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 transition rounded-xl p-3 cursor-pointer group">
                                        <Package className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                                        <span className="font-bold text-sm text-slate-200">1 Pack</span>
                                    </button>
                                    <button onClick={() => handleOpenPacks(5)} className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 transition rounded-xl p-3 cursor-pointer group">
                                        <div className="flex -space-x-2"><Package className="w-6 h-6 text-slate-400 group-hover:text-blue-400" /><Package className="w-6 h-6 text-slate-400 group-hover:text-blue-400" /></div>
                                        <span className="font-bold text-sm text-slate-200">5 Packs</span>
                                    </button>
                                    <button onClick={() => handleOpenPacks(10)} className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 transition rounded-xl p-3 cursor-pointer group">
                                        <Layers className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                                        <span className="font-bold text-sm text-slate-200">10 Packs</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showObtain && cardData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#0B101E]/80 backdrop-blur-sm pointer-events-auto">
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

            <AnimatePresence>
                {showPullSummary && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[300] bg-[#0B101E]/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12 flex flex-col pointer-events-auto">
                        <div className="max-w-7xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-[#0B101E]/90 pt-4 z-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-[#D6A033] flex items-center gap-3"><Archive className="w-8 h-8" /> Pull Summary</h2>
                                    <p className="text-slate-400 mt-1 font-mono">{filteredSummaryCards.length} of {pulledCards.length} Cards Displayed</p>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                                    <select value={collectionRarityFilter} onChange={(e) => setCollectionRarityFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer focus:border-[#D17B0F]">
                                        <option value="">All Rarities</option>
                                        {uniqueCollectionRarities.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <select value={collectionSetFilter} onChange={(e) => setCollectionSetFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer focus:border-[#D17B0F]">
                                        <option value="">All Sets</option>
                                        {uniqueCollectionSets.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button onClick={handleGoHome} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg cursor-pointer text-xs">
                                        <Home className="w-4 h-4" /> Main Menu
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 pb-20">
                                {filteredSummaryCards.map((card, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 group cursor-pointer" onClick={() => { setCardData(card); handleGoHome(); }}>
                                        <div className="relative aspect-[1/1.45] rounded-lg overflow-hidden border-2 border-slate-800 group-hover:border-[#D6A033] transition shadow-xl">
                                            <img src={card.card_images[0].image_url_cropped} alt={card.name} onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}card-back.jpg`; }} className="w-full h-full object-cover" />
                                            {card.pulled_rarity && card.pulled_rarity !== 'Common' && card.pulled_rarity !== 'Short Print' && (
                                                <div className="absolute inset-0 ring-inset ring-2 ring-white/20 rounded-lg pointer-events-none mix-blend-overlay"></div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <span className={`text-[9px] font-bold uppercase tracking-wide truncate w-full ${getRarityColor(card.pulled_rarity)}`}>{card.pulled_rarity || 'Common'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}