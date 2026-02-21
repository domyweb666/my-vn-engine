import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Play, Maximize, Minimize, Users, Clapperboard, Settings, RefreshCw, Upload, Edit3, AlertCircle, Download, UploadCloud, Zap } from 'lucide-react';

// --- 預設資料 ---
const DEFAULT_COLORS = [
  { id: 'blue', label: '藍色', tw: 'from-blue-600 to-indigo-600' },
  { id: 'red', label: '紅色', tw: 'from-red-600 to-rose-600' },
  { id: 'green', label: '綠色', tw: 'from-green-600 to-emerald-600' },
  { id: 'yellow', label: '黃色', tw: 'from-yellow-500 to-orange-500' },
  { id: 'purple', label: '紫色', tw: 'from-purple-600 to-fuchsia-600' },
  { id: 'gray', label: '灰色', tw: 'from-slate-600 to-slate-700' },
];

export default function App() {
  // ==========================================
  // 1. 核心狀態：角色、場景與劇本
  // ==========================================
  const [characters, setCharacters] = useState([
    { id: 'sys', name: '系統', color: 'gray' },
    { id: 'player', name: '神秘主角', color: 'blue' }
  ]);

  const [scenes, setScenes] = useState([
    { id: 'scene-1', name: '寧靜村莊', imageSrc: null },
    { id: 'scene-2', name: '幽暗森林', imageSrc: null },
    { id: 'scene-3', name: '王城大殿', imageSrc: null }
  ]);

  const [acts, setActs] = useState([
    {
      id: 'act-1', title: '第一幕：旅程的起點',
      dialogues: [
        { id: 'd-1', characterId: 'sys', sceneId: 'scene-1', effect: 'none', text: '歡迎來到精簡特化版的視覺小說引擎！\n我們移除了多餘的介面，讓體驗更純粹。' },
        { id: 'd-2', characterId: 'sys', sceneId: '', effect: 'flash', text: '(✨ 閃白特效) 當然，畫面的視覺表現變得更豐富了！' },
        { id: 'd-3', characterId: 'player', sceneId: '', effect: 'shake', text: '哇！(⚡ 畫面震動) 感覺身歷其境！' },
        { id: 'd-4', characterId: 'player', sceneId: '', effect: 'flash-red', text: '嗚啊！(🩸 受擊閃紅) 突然受到了攻擊！？' },
        { id: 'd-5', characterId: 'player', sceneId: '', effect: 'blur', text: '(🌀 暈眩模糊) 視線...變得有些模糊了...' },
        { id: 'd-6', characterId: 'sys', sceneId: '', effect: 'zoom', text: '(🔍 突進放大) 這些豐富的特效，能讓你的劇本更有張力！' },
        { id: 'd-7', characterId: 'sys', sceneId: '', effect: 'none', text: '準備好了嗎？接下來我們來測試「選項分支」功能。你要前往哪裡？', 
          choices: [
            { id: 'c-1', text: '進入幽暗森林', targetActId: 'act-2' },
            { id: 'c-2', text: '前往王城大殿', targetActId: 'act-3' }
          ] 
        }
      ]
    },
    {
      id: 'act-2', title: '第二幕：森林的考驗',
      dialogues: [
        { id: 'd-8', characterId: 'sys', sceneId: 'scene-2', effect: 'none', text: '你選擇了進入森林。' },
        { id: 'd-9', characterId: 'player', sceneId: '', effect: 'none', text: '這裡好暗...感覺隨時會有魔物衝出來。' },
        { id: 'd-10', characterId: 'sys', sceneId: '', effect: 'none', text: '【森林路線結束 - 體驗版到此為止】' }
      ]
    },
    {
      id: 'act-3', title: '第三幕：王城的召喚',
      dialogues: [
        { id: 'd-11', characterId: 'sys', sceneId: 'scene-3', effect: 'flash', text: '你來到了金碧輝煌的王城。' },
        { id: 'd-12', characterId: 'player', sceneId: '', effect: 'none', text: '哇，好壯觀的景象！' },
        { id: 'd-13', characterId: 'sys', sceneId: '', effect: 'none', text: '你可以隨時把這個劇本匯出成 JSON 備份喔！\n【王城路線結束】' }
      ]
    }
  ]);

  // ==========================================
  // 2. 播放器狀態與功能
  // ==========================================
  const [hasStarted, setHasStarted] = useState(false);
  const [playActIdx, setPlayActIdx] = useState(0);
  const [playDlgIdx, setPlayDlgIdx] = useState(0);
  const [textSpeed, setTextSpeed] = useState(40); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // 打字與顯示
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 特效與場景過渡
  const [activeEffect, setActiveEffect] = useState(null);
  const [bgImg, setBgImg] = useState(null);
  const [prevBgImg, setPrevBgImg] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // 編輯器狀態
  const [activeTab, setActiveTab] = useState('acts');
  const [editActId, setEditActId] = useState(acts[0].id);
  const [newDlgCharId, setNewDlgCharId] = useState(characters[0].id);
  const [newDlgSceneId, setNewDlgSceneId] = useState('');
  const [newDlgText, setNewDlgText] = useState('');
  
  const gameContainerRef = useRef(null);
  const fileImportRef = useRef(null);

  // 取得當前播放資料
  const currentAct = acts[playActIdx] || acts[0];
  const currentDlg = currentAct?.dialogues[playDlgIdx] || null;
  const currentChar = characters.find(c => c.id === currentDlg?.characterId) || { name: '???', color: 'gray' };
  const currentColorClass = DEFAULT_COLORS.find(c => c.id === currentChar.color)?.tw || DEFAULT_COLORS[5].tw;

  const editingAct = acts.find(a => a.id === editActId) || acts[0];

  // 輔助功能：推算當前場景，並處理平滑過渡
  useEffect(() => {
    let targetScene = scenes[0];
    let found = false;
    let tAct = hasStarted ? playActIdx : 0;
    let tDlg = hasStarted ? playDlgIdx : 0;

    for (let a = tAct; a >= 0 && !found; a--) {
      const act = acts[a];
      if (!act) continue;
      const startD = (a === tAct) ? tDlg : act.dialogues.length - 1;
      for (let d = startD; d >= 0; d--) {
        if (act.dialogues[d]?.sceneId) {
          targetScene = scenes.find(s => s.id === act.dialogues[d].sceneId);
          found = true;
          break;
        }
      }
    }
    
    const newSrc = targetScene?.imageSrc || null;
    if (newSrc !== bgImg) {
      setPrevBgImg(bgImg); // 將當前圖設為底層
      setBgImg(newSrc);    // 漸變顯示新圖
    }
  }, [hasStarted, playActIdx, playDlgIdx, acts, scenes, bgImg]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // ==========================================
  // 3. 遊戲核心邏輯 (特效、打字、前進)
  // ==========================================

  // 觸發畫面特效
  useEffect(() => {
    if (hasStarted && currentDlg && currentDlg.effect && currentDlg.effect !== 'none') {
      setActiveEffect(currentDlg.effect);
      const timer = setTimeout(() => setActiveEffect(null), 1000); // 延長到 1 秒以容納新特效
      return () => clearTimeout(timer);
    }
  }, [hasStarted, playActIdx, playDlgIdx, currentDlg]);

  // 打字機特效
  useEffect(() => {
    let intervalId;
    if (!hasStarted || !currentDlg) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }
    
    if (textSpeed === 0 || isEditingMode) {
      setDisplayedText(currentDlg.text);
      setIsTyping(false);
      return;
    }

    let currentChars = '';
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');
    
    intervalId = setInterval(() => {
      if (charIndex < currentDlg.text.length) {
        currentChars += currentDlg.text[charIndex];
        setDisplayedText(currentChars);
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, textSpeed);

    return () => clearInterval(intervalId);
  }, [hasStarted, playActIdx, playDlgIdx, currentDlg, textSpeed, isEditingMode]);

  // 播放控制 (下一句)
  const handleNext = () => {
    if (!hasStarted) { setHasStarted(true); return; }
    if (isTyping) {
      setDisplayedText(currentDlg.text);
      setIsTyping(false);
      return;
    }
    
    // 如果有選項，阻擋正常推進，等待玩家點擊按鈕
    if (currentDlg?.choices?.length > 0) {
      return;
    }

    if (playDlgIdx < currentAct.dialogues.length - 1) {
      setPlayDlgIdx(prev => prev + 1);
    } else if (playActIdx < acts.length - 1) {
      setPlayActIdx(prev => prev + 1);
      setPlayDlgIdx(0);
    }
  };

  const handlePrev = () => {
    if (!hasStarted) return;
    if (playDlgIdx > 0) {
      setPlayDlgIdx(prev => prev - 1);
    } else if (playActIdx > 0) {
      const prevAct = acts[playActIdx - 1];
      setPlayActIdx(prev => prev - 1);
      setPlayDlgIdx(prevAct.dialogues.length > 0 ? prevAct.dialogues.length - 1 : 0);
    }
  };

  const jumpTo = (actIdx, dlgIdx) => {
    if (!acts[actIdx]) return;
    if (dlgIdx < 0) dlgIdx = 0;
    setHasStarted(true);
    setPlayActIdx(actIdx);
    setPlayDlgIdx(dlgIdx);
  };

  const resetGame = () => {
    setHasStarted(false);
    setPlayActIdx(0); setPlayDlgIdx(0);
  };

  // 處理玩家點擊畫面
  const handleScreenClick = (e) => {
    handleNext();
  };

  // 全螢幕控制
  const toggleFullscreen = async () => {
    const el = gameContainerRef.current;
    if (!el) return;
    try {
      if (!isFullscreen) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else throw new Error("No FS API");
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      setIsFullscreen(!isFullscreen);
      if (!isFullscreen) showToast('已啟用「網頁滿版模式」。如需真實全螢幕請在獨立環境執行。');
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      // 新增：按 Esc 退出全螢幕 (包含支援網頁滿版模式的降級備案)
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleScreenClick();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isTyping, playActIdx, playDlgIdx, acts, isFullscreen]);

  // ==========================================
  // 4. JSON 匯出與匯入功能
  // ==========================================
  const exportData = () => {
    const data = { characters, scenes, acts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-novel-project.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ 專案匯出成功！');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.characters && data.scenes && data.acts) {
          setCharacters(data.characters);
          setScenes(data.scenes);
          setActs(data.acts);
          setEditActId(data.acts[0].id);
          resetGame();
          showToast('✅ 專案匯入成功！');
        } else {
          showToast('❌ 匯入失敗：缺少核心資料欄位');
        }
      } catch (err) {
        showToast('❌ 匯入失敗：JSON 格式錯誤');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  // ==========================================
  // 5. 編輯器核心邏輯
  // ==========================================
  const handleSwitchAct = (actId) => {
    setEditActId(actId);
    jumpTo(acts.findIndex(a => a.id === actId), 0); 
  };

  const addAct = () => {
    const newAct = { id: `act-${Date.now()}`, title: `第 ${acts.length + 1} 幕`, dialogues: [] };
    setActs([...acts, newAct]);
    setEditActId(newAct.id);
    jumpTo(acts.length, 0);
  };

  const handleAddDialogue = (e) => {
    e.preventDefault();
    if (!newDlgText.trim()) return;
    const newDlg = { id: `d-${Date.now()}`, characterId: newDlgCharId, sceneId: newDlgSceneId, effect: 'none', text: newDlgText };
    setActs(acts.map(act => act.id === editActId ? { ...act, dialogues: [...act.dialogues, newDlg] } : act));
    setNewDlgText('');
  };

  const updateDialogue = (actId, dlgId, field, value) => {
    setActs(acts.map(act => act.id === actId ? { ...act, dialogues: act.dialogues.map(d => d.id === dlgId ? { ...d, [field]: value } : d) } : act));
  };

  const moveDialogue = (idx, direction) => {
    setActs(acts.map(act => {
      if (act.id === editActId) {
        const newDlgs = [...act.dialogues];
        if (idx + direction >= 0 && idx + direction < newDlgs.length) {
          const temp = newDlgs[idx];
          newDlgs[idx] = newDlgs[idx + direction];
          newDlgs[idx + direction] = temp;
        }
        return { ...act, dialogues: newDlgs };
      }
      return act;
    }));
  };

  const deleteDialogue = (idx) => {
    setActs(acts.map(act => act.id === editActId ? { ...act, dialogues: act.dialogues.filter((_, i) => i !== idx) } : act));
  };

  // 選項編輯邏輯
  const addChoice = (actId, dlgId) => {
    setActs(acts.map(act => {
      if (act.id === actId) {
        return { ...act, dialogues: act.dialogues.map(d => {
          if (d.id === dlgId) {
            const choices = d.choices || [];
            return { ...d, choices: [...choices, { id: `c-${Date.now()}`, text: '新選項', targetActId: acts[0].id }] };
          }
          return d;
        })};
      }
      return act;
    }));
  };
  const updateChoice = (actId, dlgId, choiceId, field, value) => {
    setActs(acts.map(act => act.id === actId ? { ...act, dialogues: act.dialogues.map(d => d.id === dlgId ? { ...d, choices: d.choices.map(c => c.id === choiceId ? { ...c, [field]: value } : c) } : d) } : act));
  };
  const removeChoice = (actId, dlgId, choiceId) => {
    setActs(acts.map(act => act.id === actId ? { ...act, dialogues: act.dialogues.map(d => d.id === dlgId ? { ...d, choices: d.choices.filter(c => c.id !== choiceId) } : d) } : act));
  };


  const addScene = () => setScenes([...scenes, { id: `scene-${Date.now()}`, name: '新場景', imageSrc: null }]);
  const updateScene = (id, field, value) => setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));
  const deleteScene = (id) => { if (scenes.length > 1) { setScenes(scenes.filter(s => s.id !== id)); if (newDlgSceneId === id) setNewDlgSceneId(''); } };

  const addCharacter = () => setCharacters([...characters, { id: `char-${Date.now()}`, name: '新角色', color: 'blue' }]);
  const updateCharacter = (id, field, value) => setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  const deleteCharacter = (id) => { if (characters.length > 1) { setCharacters(characters.filter(c => c.id !== id)); if (newDlgCharId === id) setNewDlgCharId(characters[0].id); } };


  return (
    <div className={`min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col ${isFullscreen ? 'overflow-hidden' : ''}`}>
      
      {/* 定義多樣化的特效 CSS 動畫 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-8px, -5px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translate(8px, 5px) rotate(1deg); }
        }
        @keyframes flash {
          0% { background-color: rgba(255,255,255,1); }
          100% { background-color: rgba(255,255,255,0); }
        }
        @keyframes flash-red {
          0% { background-color: rgba(220, 38, 38, 0.8); }
          100% { background-color: rgba(220, 38, 38, 0); }
        }
        @keyframes blur-anim {
          0% { filter: blur(10px); transform: scale(1.05); }
          100% { filter: blur(0px); transform: scale(1); }
        }
        @keyframes zoom-anim {
          0% { transform: scale(1); }
          20% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .effect-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .effect-flash::after { content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none; animation: flash 0.8s ease-out both; }
        .effect-flash-red::after { content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none; animation: flash-red 0.8s ease-out both; }
        .effect-blur { animation: blur-anim 1s ease-out both; }
        .effect-zoom { animation: zoom-anim 1s ease-out both; }
      `}</style>

      {/* ================= 遊戲畫面預覽區 ================= */}
      <div className={isFullscreen ? "fixed inset-0 z-[100] bg-black flex flex-col" : "w-full max-w-5xl mx-auto p-4"}>
        
        {!isFullscreen && (
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">視覺小說遊戲引擎</h1>
            </div>
            {/* 上方工具列 (語速 / 匯出 / 匯入 / 重置) */}
            <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Settings size={14} />
                <select value={textSpeed} onChange={(e) => setTextSpeed(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 outline-none">
                  <option value={100}>慢速</option><option value={40}>正常</option><option value={15}>快速</option><option value={0}>瞬間</option>
                </select>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              
              {/* 匯入 / 匯出 */}
              <input type="file" accept=".json" className="hidden" ref={fileImportRef} onChange={importData} />
              <button onClick={() => fileImportRef.current.click()} className="flex items-center gap-1 text-sm text-slate-300 hover:text-blue-400 transition-colors" title="匯入專案">
                <UploadCloud size={16} /> 匯入
              </button>
              <button onClick={exportData} className="flex items-center gap-1 text-sm text-slate-300 hover:text-green-400 transition-colors" title="匯出專案 (JSON)">
                <Download size={16} /> 匯出
              </button>
              
              <div className="w-px h-4 bg-slate-600"></div>
              <button onClick={resetGame} className="flex items-center gap-1 text-sm text-slate-300 hover:text-red-400 transition-colors" title="重新開始">
                <RefreshCw size={14} /> 重置
              </button>
            </div>
          </div>
        )}

        {/* 遊戲螢幕本身 */}
        <div 
          ref={gameContainerRef}
          className="bg-black flex items-center justify-center relative w-full aspect-video rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
          style={isFullscreen ? { width: '100vw', height: '100vh', borderRadius: 0, border: 'none' } : {}}
        >
          {toastMessage && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[200] bg-black/85 text-white px-5 py-3 rounded-full border border-white/20 shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm animate-pulse pointer-events-none">
              <AlertCircle size={18} className="text-blue-400" /><span>{toastMessage}</span>
            </div>
          )}

          <div 
            className={`relative w-full h-full aspect-video max-w-full max-h-full group cursor-pointer select-none overflow-hidden ${
              activeEffect === 'shake' ? 'effect-shake' : ''
            } ${
              activeEffect === 'flash' ? 'effect-flash' : ''
            } ${
              activeEffect === 'flash-red' ? 'effect-flash-red' : ''
            } ${
              activeEffect === 'blur' ? 'effect-blur' : ''
            } ${
              activeEffect === 'zoom' ? 'effect-zoom' : ''
            }`}
            style={{ containerType: 'inline-size' }}
            onClick={handleScreenClick}
          >
            {/* 畫面控制列 (全螢幕時隱藏縮小按鈕) */}
            {!isFullscreen && (
              <div className="absolute top-0 right-0 left-0 z-50 p-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="pointer-events-auto">
                  <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 border border-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Maximize style={{ width: 'max(16px, 1.6cqi)', height: 'max(16px, 1.6cqi)' }} />
                  </button>
                </div>
              </div>
            )}

            {/* 背景圖片 (雙層 Crossfade 處理) */}
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-600">
              <ImageIcon style={{ width: 'max(64px, 8cqi)', height: 'max(64px, 8cqi)', marginBottom: 'max(1rem, 2cqi)' }} className="opacity-30" />
              <p style={{ fontSize: 'max(1.125rem, 2.5cqi)' }}>尚未設定圖片</p>
            </div>
            {prevBgImg && <img src={prevBgImg} className="absolute inset-0 w-full h-full object-cover" alt="prev" />}
            <img 
              src={bgImg || ''} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${bgImg ? 'opacity-100' : 'opacity-0'}`} 
              alt="bg" 
            />

            {/* 開始前提示 */}
            {!hasStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20">
                <div className="bg-black/60 text-white rounded-full flex items-center animate-pulse border border-white/20" style={{ padding: 'max(0.5rem, 1.2cqi) max(1.2rem, 3cqi)', gap: 'max(0.5rem, 1cqi)' }}>
                  <Play style={{ width: 'max(18px, 2.2cqi)', height: 'max(18px, 2.2cqi)' }} />
                  <span className="font-medium" style={{ fontSize: 'max(1rem, 2cqi)' }}>點擊畫面或按 Enter 開始</span>
                </div>
              </div>
            )}

            {/* 選項分支面板 (如果有選項且打字結束) */}
            {hasStarted && currentDlg?.choices?.length > 0 && !isTyping && (
              <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                {currentDlg.choices.map((choice) => (
                  <button 
                    key={choice.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetIdx = acts.findIndex(a => a.id === choice.targetActId);
                      if (targetIdx !== -1) jumpTo(targetIdx, 0);
                    }}
                    className="w-2/3 md:w-1/2 bg-slate-900/90 hover:bg-blue-800 text-white border-2 border-slate-500 hover:border-blue-400 rounded-lg transition-all shadow-xl hover:scale-105"
                    style={{ fontSize: 'max(1.1rem, 2.5cqi)', padding: 'max(0.8rem, 2cqi) max(2rem, 4cqi)' }}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            )}

            {/* 對話框覆蓋層 */}
            {hasStarted && currentDlg && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" style={{ padding: 'max(1rem, 3cqi)', paddingTop: 'max(4rem, 12cqi)' }}>
                <div className="relative bg-black/70 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl pointer-events-auto" style={{ padding: 'max(1.2rem, 3.5cqi)', minHeight: 'max(6rem, 14cqi)' }}>
                  
                  {/* 角色名稱標籤 */}
                  <div className={`absolute bg-gradient-to-r ${currentColorClass} text-white rounded-md font-bold shadow-lg border border-white/20 tracking-wider whitespace-nowrap`} style={{ fontSize: 'max(0.95rem, 2.2cqi)', padding: 'max(0.35rem, 0.8cqi) max(1.2rem, 2.8cqi)', top: 'calc(-1 * max(1rem, 2.4cqi))', left: 'max(1.2rem, 4cqi)' }}>
                    {currentChar.name}
                  </div>

                  {/* 對話內文 */}
                  <div className="text-white leading-relaxed whitespace-pre-wrap font-medium" style={{ fontSize: 'max(1.125rem, 3cqi)', marginTop: 'max(0.2rem, 0.8cqi)' }}>
                    {displayedText}
                    {isTyping && <span className="inline-block bg-white ml-1 align-middle animate-pulse" style={{ width: 'max(4px, 0.8cqi)', height: 'max(1.2rem, 3.2cqi)' }}></span>}
                  </div>

                  {/* 繼續/狀態提示圖示 */}
                  <div className="absolute" style={{ bottom: 'max(1rem, 2.5cqi)', right: 'max(1.2rem, 3.5cqi)' }}>
                    {/* 等待點擊提示 */}
                    {!isTyping && !isEditingMode && !(currentDlg.choices?.length > 0) && (playDlgIdx < currentAct.dialogues.length - 1 || playActIdx < acts.length - 1) && (
                      <div className="text-white/80 animate-bounce">
                        <ChevronDown style={{ width: 'max(24px, 4cqi)', height: 'max(24px, 4cqi)' }} />
                      </div>
                    )}
                    {!isTyping && !isEditingMode && playDlgIdx === currentAct.dialogues.length - 1 && playActIdx === acts.length - 1 && !(currentDlg.choices?.length > 0) && (
                      <div className="text-white/40 tracking-widest font-bold" style={{ fontSize: 'max(0.8rem, 1.8cqi)' }}>END</div>
                    )}
                    {isEditingMode && (
                      <div className="text-blue-400/80 flex items-center gap-1" style={{ fontSize: 'max(0.8rem, 1.6cqi)' }}>
                        <Edit3 style={{ width: 'max(14px, 1.6cqi)', height: 'max(14px, 1.6cqi)' }} /> 編輯中
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 編輯器區塊 ================= */}
      {!isFullscreen && (
        <div className="w-full max-w-5xl mx-auto p-4 flex-1 flex flex-col pb-12">
          
          <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2 overflow-x-auto">
            <button onClick={() => setActiveTab('acts')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'acts' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              <Clapperboard size={18} /> 劇本與台詞編輯
            </button>
            <button onClick={() => setActiveTab('characters')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'characters' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              <Users size={18} /> 角色設定
            </button>
            <button onClick={() => setActiveTab('scenes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'scenes' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              <ImageIcon size={18} /> 場景設定
            </button>
          </div>

          {/* ---- 分頁 1：劇本與台詞編輯 ---- */}
          {activeTab === 'acts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-xl">
              
              {/* 左側：幕選擇 */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">切換幕/章節</label>
                  <div className="flex flex-col gap-2">
                    {acts.map((act) => (
                      <button
                        key={act.id} onClick={() => handleSwitchAct(act.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all text-left ${editActId === act.id ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-500'}`}
                      >
                        {act.title} <span className="text-xs opacity-50 float-right mt-0.5">{act.dialogues.length} 句</span>
                      </button>
                    ))}
                    <button onClick={addAct} className="px-3 py-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center gap-1 text-sm mt-2">
                      <Plus size={16} /> 新增一幕
                    </button>
                  </div>
                </div>
              </div>

              {/* 右側：對話清單與新增 */}
              <div className="lg:col-span-9 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6">
                
                {/* 新增對話表單 */}
                <form onSubmit={handleAddDialogue} className="flex flex-col gap-3 mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700 focus-within:border-blue-500 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-slate-400 ml-1">說話角色</label>
                      <select value={newDlgCharId} onChange={(e) => setNewDlgCharId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 outline-none focus:border-blue-500">
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-slate-400 ml-1">切換背景場景</label>
                      <select value={newDlgSceneId} onChange={(e) => setNewDlgSceneId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 outline-none focus:border-blue-500">
                        <option value="">(沿用上一場景)</option>
                        {scenes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" value={newDlgText} onChange={(e) => setNewDlgText(e.target.value)}
                      onFocus={() => {
                        const actIdx = acts.findIndex(a => a.id === editActId);
                        if (editingAct?.dialogues.length > 0) jumpTo(actIdx, editingAct.dialogues.length - 1);
                        else jumpTo(actIdx, 0);
                      }}
                      placeholder="在結尾新增台詞..."
                      className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 outline-none focus:border-blue-500"
                    />
                    <button type="submit" disabled={!newDlgText.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-5 py-2 rounded-md text-white font-medium transition-colors flex items-center gap-1">
                      <Send size={16} /> 新增
                    </button>
                  </div>
                </form>

                {/* 對話清單 (可直接編輯) */}
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2">
                  {editingAct.dialogues.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-lg">此幕尚無對話，請在上方新增</div>
                  ) : (
                    editingAct.dialogues.map((dlg, idx) => {
                      const cChar = characters.find(c => c.id === dlg.characterId) || { name: '未知', color: 'gray' };
                      const isPlayingThis = hasStarted && acts.findIndex(a => a.id === editingAct.id) === playActIdx && playDlgIdx === idx;
                      
                      return (
                        <div key={dlg.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isPlayingThis ? 'bg-blue-900/40 border-blue-500 shadow-inner' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                          
                          {/* 排序按鈕 */}
                          <div className="flex flex-col items-center text-slate-500 gap-1 pt-1">
                            <button onClick={() => moveDialogue(idx, -1)} disabled={idx === 0} className="hover:text-blue-400 disabled:opacity-30"><ChevronUp size={16} /></button>
                            <span className="text-xs font-mono">{idx + 1}</span>
                            <button onClick={() => moveDialogue(idx, 1)} disabled={idx === editingAct.dialogues.length - 1} className="hover:text-blue-400 disabled:opacity-30"><ChevronDown size={16} /></button>
                          </div>
                          
                          {/* 內容編輯區塊 */}
                          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* 編輯角色 */}
                              <select 
                                value={dlg.characterId} onChange={(e) => updateDialogue(editingAct.id, dlg.id, 'characterId', e.target.value)}
                                onFocus={() => { jumpTo(acts.findIndex(a => a.id === editingAct.id), idx); setIsEditingMode(true); }}
                                onBlur={() => setIsEditingMode(false)}
                                className="bg-slate-800 text-xs font-bold outline-none border border-slate-600 rounded px-1.5 py-0.5 cursor-pointer"
                                style={{ color: cChar.color === 'gray' ? '#94a3b8' : cChar.color }}
                              >
                                {characters.map(c => <option key={c.id} value={c.id} style={{color: '#f8fafc'}}>{c.name}</option>)}
                              </select>

                              {/* 編輯場景 */}
                              <select 
                                value={dlg.sceneId || ''} onChange={(e) => updateDialogue(editingAct.id, dlg.id, 'sceneId', e.target.value)}
                                onFocus={() => { jumpTo(acts.findIndex(a => a.id === editingAct.id), idx); setIsEditingMode(true); }}
                                onBlur={() => setIsEditingMode(false)}
                                className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-600 outline-none cursor-pointer max-w-[120px]"
                              >
                                <option value="" className="text-slate-300">(不切換場景)</option>
                                {scenes.map(s => <option key={s.id} value={s.id} className="text-emerald-400">{s.name}</option>)}
                              </select>

                              {/* 編輯特效 */}
                              <select 
                                value={dlg.effect || 'none'} onChange={(e) => updateDialogue(editingAct.id, dlg.id, 'effect', e.target.value)}
                                onFocus={() => { jumpTo(acts.findIndex(a => a.id === editingAct.id), idx); setIsEditingMode(true); }}
                                onBlur={() => setIsEditingMode(false)}
                                className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 outline-none cursor-pointer flex items-center gap-1 text-slate-200"
                              >
                                <option value="none">無特效</option>
                                <option value="shake" className="text-yellow-400">⚡ 畫面震動</option>
                                <option value="flash" className="text-yellow-400">✨ 螢幕閃白</option>
                                <option value="flash-red" className="text-red-400">🩸 受擊閃紅</option>
                                <option value="blur" className="text-purple-400">🌀 暈眩模糊</option>
                                <option value="zoom" className="text-blue-400">🔍 突進放大</option>
                              </select>
                            </div>
                            
                            {/* 編輯文字 */}
                            <textarea 
                              value={dlg.text} onChange={(e) => updateDialogue(editingAct.id, dlg.id, 'text', e.target.value)}
                              onFocus={() => { jumpTo(acts.findIndex(a => a.id === editingAct.id), idx); setIsEditingMode(true); }}
                              onBlur={() => setIsEditingMode(false)}
                              placeholder="輸入對話內容..."
                              className="w-full bg-slate-900/50 text-sm text-slate-200 focus:text-white outline-none resize-none border border-transparent focus:border-blue-500/50 rounded p-1.5 transition-colors"
                              rows={2}
                            />

                            {/* 選項分支區塊 */}
                            <div className="mt-2 bg-slate-950/40 border border-slate-700/50 rounded p-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Zap size={12} /> 選項分支 (Options)</span>
                                <button onClick={() => addChoice(editingAct.id, dlg.id)} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded border border-slate-600">+ 加入選項按鈕</button>
                              </div>
                              {dlg.choices?.length > 0 ? (
                                <div className="space-y-2">
                                  {dlg.choices.map((choice) => (
                                    <div key={choice.id} className="flex flex-col sm:flex-row gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                                      <input 
                                        type="text" value={choice.text} onChange={(e) => updateChoice(editingAct.id, dlg.id, choice.id, 'text', e.target.value)}
                                        placeholder="選項文字..." className="flex-1 bg-slate-900 text-xs text-white px-2 py-1 rounded outline-none border border-slate-600 focus:border-blue-500"
                                      />
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">跳至:</span>
                                        <select 
                                          value={choice.targetActId} onChange={(e) => updateChoice(editingAct.id, dlg.id, choice.id, 'targetActId', e.target.value)}
                                          className="bg-slate-900 text-xs text-blue-300 px-2 py-1 rounded outline-none border border-slate-600 w-32"
                                        >
                                          {acts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                        </select>
                                        <button onClick={() => removeChoice(editingAct.id, dlg.id, choice.id)} className="text-slate-500 hover:text-red-400 ml-1"><Trash2 size={14} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 text-center py-1">無選項。玩家點擊螢幕後將直接播放下一句。</div>
                              )}
                            </div>

                          </div>
                          
                          {/* 刪除對話按鈕 */}
                          <button onClick={() => deleteDialogue(idx)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- 分頁 2：角色設定 ---- */}
          {activeTab === 'characters' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">管理登場角色</h3>
                <button onClick={addCharacter} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"><Plus size={16} /> 新增角色</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((char) => (
                  <div key={char.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className={`px-3 py-1 rounded text-xs font-bold text-white bg-gradient-to-r ${DEFAULT_COLORS.find(c => c.id === char.color)?.tw || DEFAULT_COLORS[5].tw}`}>預覽標籤</div>
                      {characters.length > 1 && <button onClick={() => deleteCharacter(char.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">角色名稱</label>
                      <input type="text" value={char.name} onChange={(e) => updateCharacter(char.id, 'name', e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">標籤顏色</label>
                      <select value={char.color} onChange={(e) => updateCharacter(char.id, 'color', e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-blue-500">
                        {DEFAULT_COLORS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- 分頁 3：場景設定 ---- */}
          {activeTab === 'scenes' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">管理背景場景</h3>
                <button onClick={addScene} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"><Plus size={16} /> 新增場景</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {scenes.map((scene) => (
                  <div key={scene.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-300">場景設定</span>
                      {scenes.length > 1 && <button onClick={() => deleteScene(scene.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>}
                    </div>
                    <div>
                      <input type="text" value={scene.name} onChange={(e) => updateScene(scene.id, 'name', e.target.value)} placeholder="輸入場景名稱..." className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="relative w-full aspect-video bg-black rounded-md border border-slate-600 overflow-hidden group">
                      {scene.imageSrc ? (
                        <img src={scene.imageSrc} alt={scene.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <ImageIcon size={24} className="mb-2" /><span className="text-xs">尚未設定圖片</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
                          <Upload size={14} /> 更換圖片
                          <input 
                            type="file" accept="image/*" className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => updateScene(scene.id, 'imageSrc', event.target.result);
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}