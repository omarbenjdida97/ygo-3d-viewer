# Yu-Gi-Oh! 3D Card Viewer

I created this mainly to be able to view Yu-Gi-Oh cards art. This can be for artists looking for references through cards or to just look up your favorite card.

This is still in progress (kind of). Mobile View optimized, let me know if there are any issues.

# ⭐ Features

- Search and view any card in a 3D space
- You can use filters to look through specific archtypes, Atk/Def, Monster type and more
- Toggle between full card view and HD art view only
- You can compare cards side by side
- Favorite cards you like and add them to your binder
- Look up support cards related to the current selected card
- Look up how to obtain any specific card (TCG only)
- (WIP) A pack opening simualtor. This is still rough around the edges, I still need to work on the opening sequence itself and its animations, rarity colors, adding holo/foil effects and whatever other improvements. However, it is technically fully functional and any cards you roll will be added to your collections binder (seperate from your favorite cards binder). The chance to get specific cards should also be accurate.

# 🛠️ Local Setup

Prerequisites

Make sure you have the following installed:

Node.js (v18.x or higher)

1. Clone the Repository

Clone the project to your local PC:

```
git clone https://github.com/omarbenjdida97/ygo-3d-viewer
cd ygo-3d-viewer
```

2. Install Dependencies

```
npm install
```
3. Proxies

if for whatever reason cards don't load for you, you might need to use a local proxy.

just create a .env file in the root dir and include this line:

```
VITE_API_URL=https://db.ygoprodeck.com/api/v7
```

4. Start the server

```
npm run dev
```
