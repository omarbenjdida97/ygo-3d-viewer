export interface SimulatedPack {
    packId: string;
    cards: any[];
}

const groupCardsByRarity = (cards: any[]) => {
    const pools: Record<string, any[]> = {
        Secret: [], Ultra: [], Super: [], Rare: [], Common: [], Other: []
    };

    cards.forEach(card => {
        const rarity = (card.pulled_rarity || '').toLowerCase();

        if (
            rarity.includes('secret') || 
            rarity.includes('starlight') || 
            rarity.includes('ghost') || 
            rarity.includes('collector') || 
            rarity.includes('century') ||
            rarity.includes('prismatic') ||
            rarity.includes('platinum')
        ) {
            pools.Secret.push(card);
        } else if (
            rarity.includes('ultra') || 
            rarity.includes('ultimate') || 
            rarity.includes('gold')
        ) {
            pools.Ultra.push(card);
        } else if (
            rarity.includes('super') || 
            rarity.includes('parallel') || 
            rarity.includes('foil')
        ) {
            pools.Super.push(card);
        } else if (rarity.includes('rare')) {
            pools.Rare.push(card);
        } else if (rarity.includes('common') || rarity.includes('normal') || rarity.includes('short')) {
            pools.Common.push(card);
        } else {
            pools.Other.push(card);
        }
    });

    return pools;
};

const pullFromPool = (pool: any[]) => {
    if (!pool || pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
};

export const generatePacks = async (setName: string, numPacks: number = 1): Promise<SimulatedPack[]> => {
    try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(setName)}`);
        const data = await res.json();
        if (!data.data) throw new Error("");

        const processedData: any[] = [];
        data.data.forEach((card: any) => {
            const setEntries = card.card_sets?.filter((s: any) => s.set_name.toLowerCase() === setName.toLowerCase());
            if (setEntries && setEntries.length > 0) {
                setEntries.forEach((setInfo: any) => {
                    processedData.push({
                        ...card,
                        pulled_rarity: setInfo.set_rarity,
                        pulled_set: setName,
                        pulled_code: setInfo.set_code
                    });
                });
            } else {
                processedData.push({
                    ...card,
                    pulled_rarity: 'Common',
                    pulled_set: setName,
                    pulled_code: ''
                });
            }
        });

        const pools = groupCardsByRarity(processedData);
        const packs: SimulatedPack[] = [];
        const hasCommons = pools.Common.length > 0;

        for (let i = 0; i < numPacks; i++) {
            const packCards = [];
            
            if (hasCommons) {
                for (let c = 0; c < 8; c++) {
                    const commonCard = pullFromPool(pools.Common) || pullFromPool(processedData);
                    if (commonCard) packCards.push({...commonCard, id: `${commonCard.id}-${i}-${c}-${Date.now()}`});
                }

                const roll = Math.random();
                let foilCard = null;

                if (roll < 0.05 && pools.Secret.length > 0) foilCard = pullFromPool(pools.Secret);
                else if (roll < 0.20 && pools.Ultra.length > 0) foilCard = pullFromPool(pools.Ultra);
                else if (roll < 0.50 && pools.Super.length > 0) foilCard = pullFromPool(pools.Super);
                else foilCard = pullFromPool(pools.Rare) || pullFromPool(pools.Super) || pullFromPool(processedData);

                if (foilCard) packCards.push({...foilCard, id: `${foilCard.id}-${i}-foil-${Date.now()}`});
            } else {
                for (let c = 0; c < 5; c++) {
                    const foilCard = pullFromPool(pools.Secret) || pullFromPool(pools.Ultra) || pullFromPool(pools.Super) || pullFromPool(processedData);
                    if (foilCard) packCards.push({...foilCard, id: `${foilCard.id}-${i}-${c}-${Date.now()}`});
                }
            }

            packs.push({
                packId: `pack-${Date.now()}-${i}`,
                cards: packCards
            });
        }

        return packs;
    } catch (error) {
        return [];
    }
};