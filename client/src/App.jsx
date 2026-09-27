import React, { useState, useMemo } from 'react';
import { Search, Edit2, Image as ImageIcon, Heart, Star, Cloud, Gift, Camera, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const GRID_SIZE = 100;
const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE;

// Quick idea presets
const PRESET_OPTIONS = [
  { type: 'emoji', value: '🎂' },
  { type: 'emoji', value: '❤️' },
  { type: 'emoji', value: '🎈' },
  { type: 'emoji', value: '🥳' },
  { type: 'svg', value: 'google_icon' },
  { type: 'image', value: 'https://www.google.com/logos/doodles/2023/googles-25th-birthday-6753651837110114-2xa.gif' },
  { type: 'image', value: 'https://www.google.com/logos/doodles/2015/googles-new-logo-5078286822539264.3-hp2x.gif' },
  { type: 'image', value: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/500px-Google_2015_logo.svg.png' }
];

const App = () => {
  // Initialize with some dummy data for the Google logo shape if desired, or just empty
  const [squares, setSquares] = useState(() => {
    return new Array(TOTAL_SQUARES).fill(null);
  });

  const [selectedSquareIndex, setSelectedSquareIndex] = useState(null);
  const [claimSize, setClaimSize] = useState(1);
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    message: '',
    presetEmoji: null,
    imageFile: null,
    searchPersonality: '',
    twoAmSearch: '',
    randomSearch: '',
    nitApSearch: '',
    relationshipStatus: '',
    birthdayWish: ''
  });

  // Fetch initial data
  React.useEffect(() => {
    const fetchWishes = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/wishes`);
        if (res.ok) {
          const data = await res.json();
          setSquares(prev => {
            const newSquares = Array(TOTAL_SQUARES).fill(null);
            data.forEach(wish => {
              const startCol = wish.index % 100;
              const startRow = Math.floor(wish.index / 100);
              const w = wish.width || 1;
              const h = wish.height || 1;

              for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                  if (startRow + r < 100 && startCol + c < 100) {
                    newSquares[(startRow + r) * 100 + (startCol + c)] = { isCovered: true, mainIndex: wish.index };
                  }
                }
              }
              // Set the main cell
              newSquares[wish.index] = {
                index: wish.index,
                width: w,
                height: h,
                name: wish.name,
                rollNumber: wish.rollNumber,
                message: wish.message,
                emoji: wish.presetEmoji,
                imageUrl: wish.imageUrl,
                searchPersonality: wish.searchPersonality,
                twoAmSearch: wish.twoAmSearch,
                randomSearch: wish.randomSearch,
                nitApSearch: wish.nitApSearch,
                relationshipStatus: wish.relationshipStatus,
                birthdayWish: wish.birthdayWish
              };
            });
            return newSquares;
          });
        }
      } catch (err) {
        console.error('Failed to fetch wishes', err);
      }
    };
    fetchWishes();
  }, []);

  const getTooltipStyle = () => {
    if (hoveredSquare === null) return {};
    const col = hoveredSquare % 100;
    const row = Math.floor(hoveredSquare / 100);

    // Position it slightly offset from the cell, flipping if near edges
    const isRightHalf = col > 50;
    const isBottomHalf = row > 50;

    return {
      top: isBottomHalf ? 'auto' : `calc(${(row / 100) * 100}% + 12px)`,
      bottom: isBottomHalf ? `calc(${((100 - row) / 100) * 100}% + 12px)` : 'auto',
      left: isRightHalf ? 'auto' : `calc(${(col / 100) * 100}% + 12px)`,
      right: isRightHalf ? `calc(${((100 - col) / 100) * 100}% + 12px)` : 'auto',
    };
  };

  const handleSquareClick = (index) => {
    const startCol = index % 100;
    const startRow = Math.floor(index / 100);

    if (startCol + claimSize > 100 || startRow + claimSize > 100) {
      toast.error('Selection out of bounds! Try picking a cell further left or up.');
      return;
    }

    for (let r = 0; r < claimSize; r++) {
      for (let c = 0; c < claimSize; c++) {
        if (squares[(startRow + r) * 100 + (startCol + c)]) {
          toast.error('Selection overlaps with existing squares!');
          return;
        }
      }
    }
    setSelectedSquareIndex(index);
  };

  const handleClaim = async () => {
    if (!formData.name || !formData.rollNumber || (!formData.presetEmoji && !formData.imageFile)) {
      toast.error('Please provide name, roll number, and an image/emoji');
      return;
    }

    setIsLoading(true);

    const form = new FormData();
    form.append('index', selectedSquareIndex);
    form.append('width', claimSize);
    form.append('height', claimSize);
    form.append('name', formData.name);
    form.append('rollNumber', formData.rollNumber);
    form.append('message', formData.message);
    if (formData.presetEmoji) form.append('presetEmoji', formData.presetEmoji);
    if (formData.imageFile) form.append('image', formData.imageFile);
    form.append('searchPersonality', formData.searchPersonality);
    form.append('twoAmSearch', formData.twoAmSearch);
    form.append('randomSearch', formData.randomSearch);
    form.append('nitApSearch', formData.nitApSearch);
    form.append('relationshipStatus', formData.relationshipStatus);
    form.append('birthdayWish', formData.birthdayWish);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/wishes`, {
        method: 'POST',
        body: form
      });

      if (res.ok) {
        const newWish = await res.json();
        setSquares(prev => {
          const updated = [...prev];
          const w = claimSize;
          const h = claimSize;
          const startCol = selectedSquareIndex % 100;
          const startRow = Math.floor(selectedSquareIndex / 100);

          for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
              updated[(startRow + r) * 100 + (startCol + c)] = { isCovered: true, mainIndex: selectedSquareIndex };
            }
          }

          updated[selectedSquareIndex] = {
            index: selectedSquareIndex,
            width: w,
            height: h,
            name: newWish.name,
            rollNumber: newWish.rollNumber,
            message: newWish.message,
            emoji: newWish.presetEmoji,
            imageUrl: newWish.imageUrl,
            searchPersonality: newWish.searchPersonality,
            twoAmSearch: newWish.twoAmSearch,
            randomSearch: newWish.randomSearch,
            nitApSearch: newWish.nitApSearch,
            relationshipStatus: newWish.relationshipStatus,
            birthdayWish: newWish.birthdayWish
          };
          return updated;
        });
        setSelectedSquareIndex(null);
        setFormData({
          name: '', rollNumber: '', message: '', presetEmoji: null, imageFile: null,
          searchPersonality: '', twoAmSearch: '', randomSearch: '', nitApSearch: '', relationshipStatus: '', birthdayWish: ''
        });
        toast.success('Square claimed successfully! 🎉');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to claim square');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-gray-800">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 fixed top-0 left-0 w-full z-50 shadow-sm transition-all">
        <div className="w-full max-w-[1600px] mx-auto flex flex-row items-center justify-between relative px-3 sm:px-6 md:px-12 xl:px-20 py-2">

          {/* Top Left Decoration Image */}
          <div className="hidden lg:flex flex-1 max-w-[200px] xl:max-w-[280px] 2xl:max-w-[350px] items-center pointer-events-none">
            <img src="/bday-balloons.png" alt="Happy Birthday Google" className="w-full h-full max-h-24 object-contain object-left scale-110 origin-left" />
          </div>

          {/* Center Content */}
          <div className="flex flex-row items-center justify-between lg:justify-center flex-1 z-10 px-1 sm:px-4 w-full gap-2 sm:gap-6 lg:gap-16">

            {/* Logo and Title */}
            <div className="flex flex-col items-start lg:items-start text-left shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                <h1 className="text-lg sm:text-2xl md:text-4xl font-bold tracking-tight">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">o</span>
                  <span className="text-yellow-500">o</span>
                  <span className="text-blue-500">g</span>
                  <span className="text-green-500">l</span>
                  <span className="text-red-500">e</span>
                  <span className="ml-1.5 sm:ml-2 text-gray-700">Birthday Wall</span>
                </h1>
                <Gift className="text-yellow-400 w-5 h-5 sm:w-7 sm:h-7 hidden sm:block" />
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-400 tracking-wider uppercase">
                GDSC • NIT Andhra Pradesh
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row gap-2 sm:gap-3 items-center justify-end shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const id = parseInt(searchId, 10);
                  if (!isNaN(id) && id >= 1 && id <= 10000) {
                    setSelectedSquareIndex(id - 1);
                    document.getElementById('claim-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    toast.error('Invalid Cell ID (1-10000)');
                  }
                }}
                className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full focus-within:ring-2 focus-within:ring-blue-500 transition-all w-32 xl:w-48"
              >
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="number"
                  placeholder="Search (1-10000)"
                  className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400 text-xs"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </form>

              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium flex items-center gap-1.5 sm:gap-2 shadow-sm transition-colors whitespace-nowrap text-xs sm:text-sm"
                onClick={() => {
                  document.getElementById('claim-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Claim</span>
                <span className="hidden sm:inline">Square</span>
              </button>
            </div>
          </div>

          {/* Top Right Decoration Image */}
          <div className="hidden lg:flex flex-1 max-w-[200px] xl:max-w-[280px] 2xl:max-w-[350px] items-center pointer-events-none">
            <img src="/bday-right.png" alt="Same Curiosity Brighter Tomorrows" className="w-full h-full max-h-24 object-contain object-right scale-110 origin-right" />
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col xl:flex-row p-3 sm:p-4 md:p-6 gap-6 max-w-[1600px] mx-auto w-full pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        {/* Grid Container */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto relative flex flex-col items-center xl:justify-start">
          <div className="p-2 sm:p-4 md:p-8 flex-shrink-0 w-full flex justify-center">
            <div
              className="grid bg-gray-100 border border-gray-200 relative overflow-hidden"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(800px, calc(100vw - 2.5rem), 80vh)',
                height: 'min(800px, calc(100vw - 2.5rem), 80vh)',
                maxWidth: '800px',
                maxHeight: '800px'
              }}
              onMouseLeave={() => setHoveredSquare(null)}
            >
              {/* Grid Content */}
              {squares.map((square, i) => {
                const isHoverPreview = hoveredSquare !== null &&
                  (i % 100 >= hoveredSquare % 100) && (i % 100 < (hoveredSquare % 100) + claimSize) &&
                  (Math.floor(i / 100) >= Math.floor(hoveredSquare / 100)) && (Math.floor(i / 100) < Math.floor(hoveredSquare / 100) + claimSize);

                const isSelectedPreview = selectedSquareIndex !== null &&
                  (i % 100 >= selectedSquareIndex % 100) && (i % 100 < (selectedSquareIndex % 100) + claimSize) &&
                  (Math.floor(i / 100) >= Math.floor(selectedSquareIndex / 100)) && (Math.floor(i / 100) < Math.floor(selectedSquareIndex / 100) + claimSize);

                return (
                  <div
                    key={i}
                    onClick={() => handleSquareClick(i)}
                    onMouseEnter={() => setHoveredSquare(i)}
                    className={`
                  border-r border-b border-gray-200/50 cursor-pointer flex items-center justify-center relative overflow-visible
                  ${(isSelectedPreview || isHoverPreview) && (!square || (!square.name && !square.isCovered)) ? 'bg-blue-100/50' : 'hover:bg-gray-200/50'}
                  ${square && (square.name || square.isCovered) ? 'bg-white cursor-not-allowed' : ''}
                `}
                  >
                    {/* Main Content Rendered Only on Top-Left Cell */}
                    {square && square.name && (
                      <div
                        className="absolute top-0 left-0 z-10 pointer-events-none overflow-hidden"
                        style={{
                          width: `calc(${square.width * 100}% + ${square.width - 1}px)`,
                          height: `calc(${square.height * 100}% + ${square.height - 1}px)`
                        }}
                      >
                        {square.emoji && (
                          <span className="flex items-center justify-center w-full h-full p-0.5 absolute inset-0">
                            {square.emoji === 'google_icon' ? (
                              <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                            ) : square.emoji.startsWith('http') ? (
                              <img src={square.emoji} alt="preset" className="w-full h-full object-cover rounded-sm" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-center" style={{ fontSize: `clamp(8px, ${square.width * 6}px, 64px)` }}>
                                {square.emoji}
                              </div>
                            )}
                          </span>
                        )}
                        {square.imageUrl && <img src={square.imageUrl} alt="wish" className="w-full h-full object-cover absolute inset-0" />}
                      </div>
                    )}

                    {/* Selection Border Overlay */}
                    {selectedSquareIndex === i && (
                      <div
                        className="absolute top-0 left-0 z-20 pointer-events-none ring-2 ring-blue-500 bg-blue-500/10"
                        style={{
                          width: `calc(${claimSize * 100}% + ${claimSize - 1}px)`,
                          height: `calc(${claimSize * 100}% + ${claimSize - 1}px)`
                        }}
                      />
                    )}
                  </div>
                )
              })}

              {/* Tinted Google Logo Mask Overlaid ABOVE the grid images */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 mix-blend-multiply z-30">
                <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] sm:w-[90%] sm:h-[90%] max-w-full max-h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tooltips */}
          {(() => {
            if (hoveredSquare === null || !squares[hoveredSquare]) return null;
            const activeWish = squares[hoveredSquare].isCovered 
              ? squares[squares[hoveredSquare].mainIndex] 
              : squares[hoveredSquare];
              
            if (!activeWish || !activeWish.name) return null;

            return (
              <>
                {/* Desktop Tooltip */}
                <div
                  className="hidden md:block absolute bg-white p-3 rounded-lg shadow-xl border border-gray-100 z-50 pointer-events-none w-64"
                  style={getTooltipStyle()}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-800 text-base">{activeWish.name}</p>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">#{activeWish.index + 1}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Roll: {activeWish.rollNumber}</p>

                  <div className="text-xs space-y-1 mt-2 border-t pt-2 border-gray-100">
                    {activeWish.searchPersonality && <p><strong>Personality:</strong> {activeWish.searchPersonality}</p>}
                    {activeWish.twoAmSearch && <p><strong>2 AM Search:</strong> {activeWish.twoAmSearch}</p>}
                    {activeWish.randomSearch && <p><strong>Random:</strong> {activeWish.randomSearch}</p>}
                    {activeWish.nitApSearch && <p><strong>NIT AP:</strong> {activeWish.nitApSearch}</p>}
                    {activeWish.relationshipStatus && <p><strong>Status:</strong> {activeWish.relationshipStatus}</p>}
                    {activeWish.birthdayWish && <p><strong>Wish:</strong> {activeWish.birthdayWish}</p>}
                  </div>
                </div>

                {/* Mobile Tooltip (Fixed at bottom) */}
                <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 z-50 pointer-events-none">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-gray-800 text-lg">{activeWish.name}</p>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">#{activeWish.index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Roll: {activeWish.rollNumber}</p>
                  <div className="text-sm space-y-1 mt-2 border-t pt-2 border-gray-100 max-h-40 overflow-y-auto">
                    {activeWish.searchPersonality && <p><strong>Personality:</strong> {activeWish.searchPersonality}</p>}
                    {activeWish.twoAmSearch && <p><strong>2 AM Search:</strong> {activeWish.twoAmSearch}</p>}
                    {activeWish.randomSearch && <p><strong>Random:</strong> {activeWish.randomSearch}</p>}
                    {activeWish.nitApSearch && <p><strong>NIT AP:</strong> {activeWish.nitApSearch}</p>}
                    {activeWish.relationshipStatus && <p><strong>Status:</strong> {activeWish.relationshipStatus}</p>}
                    {activeWish.birthdayWish && <p><strong>Wish:</strong> {activeWish.birthdayWish}</p>}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Sidebar */}
        <aside id="claim-section" className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-bold mb-4">Your Square {selectedSquareIndex !== null ? `(#${selectedSquareIndex + 1})` : ''}</h2>

            {selectedSquareIndex === null ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p>Select a square on the wall<br />to claim it</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Claim Size</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={claimSize}
                    onChange={(e) => setClaimSize(parseInt(e.target.value))}
                  >
                    <option value={1}>1x1 Cell</option>
                    <option value={2}>2x2 Block</option>
                    <option value={3}>3x3 Block</option>
                    <option value={4}>4x4 Block</option>
                    <option value={5}>5x5 Block</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Student Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Roll Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="4123xx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Upload Media <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer relative">
                  {formData.presetEmoji ? (
                    formData.presetEmoji.startsWith('http') ? (
                      <img src={formData.presetEmoji} alt="preview" className="w-full h-24 object-contain rounded-md" />
                    ) : formData.presetEmoji === 'google_icon' ? (
                      <span className="text-sm font-medium text-green-600">Google Logo Selected</span>
                    ) : (
                      <span className="text-4xl">{formData.presetEmoji}</span>
                    )
                  ) : formData.imageFile ? (
                    <span className="text-sm font-medium text-green-600">Image selected</span>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium text-center">Upload image/gif<br />(or pick an emoji)</span>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File size must be under 5MB');
                        e.target.value = ''; // Reset input
                      } else {
                        setFormData({ ...formData, imageFile: file, presetEmoji: null });
                      }
                    }
                  }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">1. Your Google Search Personality</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.65rem_auto] pr-8"
                      value={formData.searchPersonality}
                      onChange={(e) => setFormData({ ...formData, searchPersonality: e.target.value })}
                    >
                      <option value="">Select one...</option>
                      <option value="I can figure it out myself 🤓">“I can figure it out myself” 🤓</option>
                      <option value="Google, save me 💀">“Google, save me” 💀</option>
                      <option value="YouTube is Google too, right? 😭">“YouTube is Google too, right?” 😭</option>
                      <option value="Ask ChatGPT first, Google later 👀">“Ask ChatGPT first, Google later” 👀</option>
                      <option value="I search everything.">“I search everything.”</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">2. The 2 AM Search</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Most likely to Google at 2 AM" value={formData.twoAmSearch} onChange={e => setFormData({ ...formData, twoAmSearch: e.target.value })} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">3. Expose Yourself</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Most random thing you've Googled" value={formData.randomSearch} onChange={e => setFormData({ ...formData, randomSearch: e.target.value })} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">4. NIT AP Edition</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Most NIT AP thing you'd Google" value={formData.nitApSearch} onChange={e => setFormData({ ...formData, nitApSearch: e.target.value })} />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">5. Relationship Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:0.65rem_auto] pr-8"
                      value={formData.relationshipStatus}
                      onChange={(e) => setFormData({ ...formData, relationshipStatus: e.target.value })}
                    >
                      <option value="">Select one...</option>
                      <option value="Married 💙">💙 Married</option>
                      <option value="It’s complicated 💚">💚 It’s complicated</option>
                      <option value="Friends with benefits 💛">💛 Friends with benefits (academically 😭)</option>
                      <option value="Can’t live without it ❤️">❤️ Can’t live without it</option>
                      <option value="Google knows too much about me 💀">💀 Google knows too much about me</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">6. Final Question</label>
                    <textarea
                      placeholder="Your completely unserious birthday wish for Google"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 text-sm"
                      value={formData.birthdayWish}
                      onChange={(e) => setFormData({ ...formData, birthdayWish: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-colors mt-2 disabled:bg-blue-300"
                >
                  {isLoading ? 'Claiming...' : 'Claim This Square'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Ideas */}
          {selectedSquareIndex !== null && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Quick Ideas</h3>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_OPTIONS.map((preset, i) => (
                  <button
                    key={i}
                    className={`w-12 h-12 flex items-center justify-center text-2xl bg-gray-50 hover:bg-gray-100 rounded-lg border overflow-hidden p-1 ${formData.presetEmoji === preset.value ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                    onClick={() => setFormData({ ...formData, presetEmoji: preset.value, imageFile: null })}
                  >
                    {preset.type === 'svg' ? (
                      <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    ) : preset.type === 'image' ? (
                      <img src={preset.value} alt="preset" className="w-full h-full object-contain" />
                    ) : (
                      preset.value
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Wall Stats</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-green-500 shrink-0 mt-0.5"></div>
                <div>
                  <p className="font-bold text-sm">
                    {squares.filter(s => s !== null).length.toLocaleString()} / 10,000
                  </p>
                  <p className="text-xs text-gray-500">squares filled</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5 fill-red-500" />
                <div>
                  <p className="font-bold text-sm">
                    {squares.filter(s => s && s.name).length.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">birthday wishes</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>Made with ❤️ by <strong>GDSC NIT Andhra Pradesh</strong></p>
          <p className="mt-2 md:mt-0">Celebrating Google's 28th Birthday!</p>
        </div>
      </footer>
    </div>
  );
};

export default App;