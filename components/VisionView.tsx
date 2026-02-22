import React, { useState, useRef, useEffect } from 'react';
import { LoadingState, InventoryItem, ViewState, SubscriptionTier, TIER_CONFIG } from '../types';
import { Eye, Upload, X, Camera, Image as ImageIcon, Check, ScanBarcode, ArrowRight, Receipt, LayoutGrid, Zap, ZapOff, Box as BoxIcon, Scissors, RotateCcw, Video, Sparkles, Lock } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { analyzeImageForInventory, analyzeImageForBarcode, analyzeRoomImage, analyzeInvoiceImage } from '../services/geminiService';

type VisionMode = 'MENU' | 'CAMERA' | 'CONFIRMATION' | 'ANALYZING' | 'RESULTS_ROOM' | 'RESULTS_INVOICE' | 'CROP' | 'SCAN_3D_RECORDING' | 'SCAN_3D_RESULTS';
type ScanType = 'OBJECT' | 'BARCODE' | 'ROOM' | 'INVOICE' | 'SCAN_3D';

interface VisionViewProps {
  onAddItem?: (item: InventoryItem) => void;
  onNavigate?: (view: ViewState) => void;
  items?: InventoryItem[];
  currency: string;
  subscriptionTier: SubscriptionTier;
}

const VisionView: React.FC<VisionViewProps> = ({ onAddItem, onNavigate, items = [], currency, subscriptionTier }) => {
  const [mode, setMode] = useState<VisionMode>('MENU');
  const [scanType, setScanType] = useState<ScanType>('OBJECT');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [flashOn, setFlashOn] = useState(false);
  
  // Cropping state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // 3D Scan state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [scanned3DModel, setScanned3DModel] = useState<any>(null);
  
  // Results for specific modes
  const [foundItems, setFoundItems] = useState<any[]>([]); // Room Scan
  const [foundInvoice, setFoundInvoice] = useState<any>(null); // Invoice Scan

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrencySymbol = (code: string) => {
      switch (code) {
          case 'EUR': return '€';
          case 'USD': return '$';
          case 'CAD': return 'C$';
          case 'GBP': return '£';
          case 'CHF': return 'CHF';
          default: return code;
      }
  };

  const currencySymbol = getCurrencySymbol(currency);

  const triggerUpload = (type: ScanType = 'OBJECT') => {
    setScanType(type);
    if (mode === 'CAMERA') stopCamera();
    fileInputRef.current?.click();
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    
    const image = new Image();
    image.src = selectedImage;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg');
    setSelectedImage(croppedDataUrl);
    setMode('CONFIRMATION');
  };

  // 3D Scan Recording
  const start3DScan = async () => {
    if (!TIER_CONFIG[subscriptionTier].has3DScan) {
      onNavigate && onNavigate('SUBSCRIPTION');
      return;
    }
    setScanType('SCAN_3D');
    setMode('SCAN_3D_RECORDING');
    setIsRecording(false);
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { 
      console.error(err); 
      setMode('MENU'); 
      alert("Impossible d'accéder à la caméra pour le scan 3D.");
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      setMode('ANALYZING');
      // Simulate 3D processing
      setTimeout(() => {
        setScanned3DModel({ name: "Objet 3D", type: "box" }); // Placeholder
        setMode('SCAN_3D_RESULTS');
      }, 3000);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const stop3DScan = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
    }
  };

  // Camera Handling
  const startCamera = async (type: ScanType) => {
    setScanType(type);
    setMode('CAMERA');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error(err); setMode('MENU'); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setSelectedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setMode('CROP');
    }
  };

  const stopCamera = () => {
    if (flashOn && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      track.applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setFlashOn(false);
  };

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        // @ts-ignore
        const capabilities = track.getCapabilities?.() || {};
        if ((capabilities as any).torch) {
          await track.applyConstraints({
            advanced: [{ torch: !flashOn }]
          } as any);
          setFlashOn(!flashOn);
        } else {
          // Fallback check if capabilities is empty but we want to try anyway
          await track.applyConstraints({
            advanced: [{ torch: !flashOn }]
          } as any);
          setFlashOn(!flashOn);
        }
      } catch (err) {
        console.error("Flash toggle failed", err);
        alert("Le flash n'est pas supporté ou accessible sur cet appareil.");
      }
    }
  };

  const processImage = async () => {
      setMode('ANALYZING');
      setLoadingState(LoadingState.LOADING);
      try {
          if (!selectedImage) return;

          if (scanType === 'ROOM') {
              const results = await analyzeRoomImage(selectedImage, currency);
              setFoundItems(results);
              setMode('RESULTS_ROOM');
          } else if (scanType === 'INVOICE') {
              const result = await analyzeInvoiceImage(selectedImage);
              setFoundInvoice(result);
              setMode('RESULTS_INVOICE');
          } else if (scanType === 'OBJECT') {
              const result = await analyzeImageForInventory(selectedImage, currency);
              // Direct add logic (simplified for brevity, normally goes to review)
              if(onAddItem) {
                  onAddItem({
                      id: Date.now().toString(),
                      name: result.name || 'Objet',
                      brand: result.brand,
                      category: result.category,
                      condition: result.condition,
                      quantity: 1,
                      purchasePrice: result.purchasePrice,
                      resaleValue: result.resaleValue,
                      image: selectedImage,
                      acquisitionDate: new Date().toISOString().split('T')[0],
                      location: 'Non trié'
                  });
                  onNavigate && onNavigate('INVENTORY');
              }
          } else if (scanType === 'BARCODE') {
              const result = await analyzeImageForBarcode(selectedImage);
              if(onAddItem) {
                 onAddItem({
                      id: Date.now().toString(),
                      name: result.name || 'Scan Code',
                      brand: result.brand,
                      category: result.category,
                      condition: 'Bon',
                      quantity: 1,
                      barcode: result.barcode,
                      purchasePrice: 0,
                      resaleValue: 0,
                      image: selectedImage,
                      acquisitionDate: new Date().toISOString().split('T')[0],
                      location: 'Stock'
                  });
                  onNavigate && onNavigate('INVENTORY');
              }
          }
      } catch (e) {
          console.error(e);
          setLoadingState(LoadingState.ERROR);
      }
  };

  const addAllRoomItems = () => {
      if (onAddItem) {
          foundItems.forEach((item, idx) => {
              onAddItem({
                  id: Date.now().toString() + idx,
                  name: item.name,
                  category: item.category,
                  brand: item.brand,
                  condition: item.condition,
                  purchasePrice: item.purchasePrice,
                  resaleValue: item.resaleValue,
                  quantity: 1,
                  image: selectedImage, // Shared image
                  acquisitionDate: new Date().toISOString().split('T')[0],
                  location: 'Room Scan'
              });
          });
      }
      onNavigate && onNavigate('INVENTORY');
  };

  // Render Menu
  if (mode === 'MENU') {
      return (
          <div className="w-full max-w-4xl mx-auto p-4 pb-12">
              <h2 className="text-2xl font-bold text-white mb-8">Scanner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => startCamera('OBJECT')} className="glass-panel p-8 rounded-xl hover:bg-white/5 flex flex-col items-center gap-4">
                      <Camera size={40} className="text-blue-400" />
                      <div className="text-center"><h3 className="font-bold text-white">Objet Unique</h3><p className="text-xs text-slate-400">Analyse détaillée d'un item</p></div>
                  </button>
                  <button onClick={() => startCamera('ROOM')} className="glass-panel p-8 rounded-xl hover:bg-white/5 flex flex-col items-center gap-4">
                      <LayoutGrid size={40} className="text-purple-400" />
                      <div className="text-center"><h3 className="font-bold text-white">Scanner de Pièce</h3><p className="text-xs text-slate-400">Ajout en masse (Batch)</p></div>
                  </button>
                  <button onClick={() => startCamera('INVOICE')} className="glass-panel p-8 rounded-xl hover:bg-white/5 flex flex-col items-center gap-4">
                      <Receipt size={40} className="text-emerald-400" />
                      <div className="text-center"><h3 className="font-bold text-white">Scanner Facture</h3><p className="text-xs text-slate-400">OCR & Liaison Garantie</p></div>
                  </button>
                  <button onClick={() => startCamera('BARCODE')} className="glass-panel p-8 rounded-xl hover:bg-white/5 flex flex-col items-center gap-4">
                      <ScanBarcode size={40} className="text-orange-400" />
                      <div className="text-center"><h3 className="font-bold text-white">Code-barres</h3><p className="text-xs text-slate-400">Recherche rapide</p></div>
                  </button>
                  <button onClick={start3DScan} className="glass-panel p-8 rounded-xl hover:bg-white/5 flex flex-col items-center gap-4 border-2 border-blue-500/30 relative overflow-hidden">
                      {!TIER_CONFIG[subscriptionTier].has3DScan && (
                        <div className="absolute top-2 right-2 p-1 bg-yellow-500 rounded-md text-black">
                          <Lock size={12} />
                        </div>
                      )}
                      <BoxIcon size={40} className="text-blue-400 animate-pulse" />
                      <div className="text-center"><h3 className="font-bold text-white">Scan 3D (Vidéo)</h3><p className="text-xs text-slate-400">Modélisation spatiale IA</p></div>
                  </button>
              </div>
              <button onClick={() => triggerUpload('OBJECT')} className="w-full mt-4 py-4 bg-slate-800 text-slate-400 rounded-xl border border-dashed border-slate-600 hover:text-white hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                  <Upload size={20} /> Importer depuis la galerie
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { 
                      const r = new FileReader(); 
                      r.onload = () => { 
                          setSelectedImage(r.result as string); 
                          setMode('CROP'); 
                      }; 
                      r.readAsDataURL(f); 
                    }
              }} />
          </div>
      );
  }

  // Render Cropper
  if (mode === 'CROP') {
      return (
          <div className="fixed inset-0 bg-black z-[60] flex flex-col">
              <div className="relative flex-1">
                  <Cropper
                      image={selectedImage || ''}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                  />
              </div>
              <div className="p-6 bg-slate-900 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">Zoom</span>
                      <input
                          type="range"
                          value={zoom}
                          min={1}
                          max={3}
                          step={0.1}
                          aria-labelledby="Zoom"
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="flex-1 accent-blue-500"
                      />
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setMode('MENU')} className="flex-1 py-3 bg-slate-800 rounded-xl text-white">Annuler</button>
                      <button onClick={getCroppedImg} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                          <Scissors size={18} /> Valider le cadrage
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Render Confirmation
  if (mode === 'CONFIRMATION') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-4">
              <img src={selectedImage || ''} className="max-h-[60vh] rounded-xl border border-slate-700 mb-6" />
              <div className="flex gap-4 w-full max-w-md">
                  <button onClick={() => setMode('MENU')} className="flex-1 py-3 bg-slate-800 rounded-xl text-white">Annuler</button>
                  <button onClick={processImage} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold">Analyser</button>
              </div>
          </div>
      );
  }

  // Render Camera
  if (mode === 'CAMERA') {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
              <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover opacity-80" />
              <canvas ref={canvasRef} hidden />
              <div className="absolute bottom-0 w-full p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black to-transparent">
                  <button onClick={() => { stopCamera(); setMode('MENU'); }} className="p-4 bg-slate-800/80 rounded-full text-white" title="Fermer"><X /></button>
                  <button onClick={() => triggerUpload(scanType)} className="p-4 bg-slate-800/80 rounded-full text-white" title="Galerie"><ImageIcon size={24} /></button>
                  <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 hover:scale-95 transition-transform" title="Capturer"></button>
                  <button onClick={toggleFlash} className={`p-4 rounded-full text-white transition-colors ${flashOn ? 'bg-yellow-500' : 'bg-slate-800/80'}`} title="Flash">
                      {flashOn ? <Zap size={24} /> : <ZapOff size={24} />}
                  </button>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-2xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
              <div className="absolute top-8 left-0 w-full text-center">
                  <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">Mode: {scanType}</span>
              </div>
          </div>
      );
  }

  // Render 3D Scan Recording
  if (mode === 'SCAN_3D_RECORDING') {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
              <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
              <div className="absolute top-12 left-0 w-full flex flex-col items-center gap-2">
                  {isRecording ? (
                    <div className="px-4 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div> ENREGISTREMENT 3D
                    </div>
                  ) : (
                    <div className="px-4 py-1 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center gap-2">
                        <Camera size={14} /> PRÊT POUR LE SCAN 3D
                    </div>
                  )}
                  <p className="text-white text-sm font-medium drop-shadow-lg">
                    {isRecording ? "Tournez lentement autour de l'objet" : "Cadrez l'objet et lancez l'enregistrement"}
                  </p>
                  <div className="text-white font-mono text-2xl">{recordingTime}s</div>
              </div>
              
              {/* 3D Scanning Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-72 h-72 border border-blue-400/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                   <div className="absolute w-64 h-64 border border-blue-400/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                   <div className="absolute w-80 h-80 border border-blue-400/20 rounded-full"></div>
              </div>

              <div className="absolute bottom-12 w-full flex justify-center items-center gap-8">
                  <button 
                    onClick={() => { stopCamera(); setMode('MENU'); }}
                    className="p-4 bg-slate-800/80 rounded-full text-white"
                  >
                    <X size={24} />
                  </button>

                  {isRecording ? (
                    <button 
                      onClick={stop3DScan}
                      className="w-20 h-20 bg-white rounded-full border-8 border-red-600 flex items-center justify-center hover:scale-95 transition-transform"
                    >
                        <div className="w-6 h-6 bg-red-600 rounded-sm"></div>
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartRecording}
                      className="w-20 h-20 bg-white rounded-full border-8 border-slate-300 flex items-center justify-center hover:scale-95 transition-transform"
                    >
                        <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                    </button>
                  )}
                  
                  <div className="w-12"></div>
              </div>
          </div>
      );
  }

  // Render 3D Scan Results
  if (mode === 'SCAN_3D_RESULTS') {
      return (
          <div className="w-full max-w-4xl mx-auto p-4 pb-12 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Modèle 3D Généré</h2>
                  <button onClick={() => setMode('MENU')} className="p-2 bg-slate-800 rounded-full text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 glass-panel rounded-3xl overflow-hidden relative min-h-[400px] mb-6">
                  <Canvas shadows>
                      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                      <OrbitControls autoRotate />
                      <Stage environment="city" intensity={0.6}>
                          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                              <mesh castShadow receiveShadow>
                                  <boxGeometry args={[2, 2, 2]} />
                                  <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.2} />
                              </mesh>
                          </Float>
                      </Stage>
                      <Environment preset="city" />
                      <gridHelper args={[10, 10, 0xffffff, 0x444444]} position={[0, -1, 0]} />
                  </Canvas>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                          <p className="text-xs text-blue-400 font-bold uppercase mb-1">Analyse Spatiale</p>
                          <p className="text-white text-sm">Volume estimé: 0.45m³</p>
                          <p className="text-white text-sm">Complexité: Haute</p>
                      </div>
                      <div className="flex flex-col gap-2">
                          <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"><RotateCcw size={20} /></button>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                      <h3 className="text-blue-400 font-bold mb-1 flex items-center gap-2"><Sparkles size={16} /> Recommandation IA</h3>
                      <p className="text-slate-300 text-sm">Le scan 3D suggère qu'il s'agit d'un objet de collection. Une expertise manuelle est recommandée pour affiner la valeur.</p>
                  </div>
                  <button 
                    onClick={() => {
                        if(onAddItem) {
                            onAddItem({
                                id: Date.now().toString(),
                                name: "Objet Scan 3D",
                                category: "Collection",
                                brand: "Inconnu",
                                condition: "Excellent",
                                quantity: 1,
                                purchasePrice: 0,
                                resaleValue: 0,
                                image: null,
                                acquisitionDate: new Date().toISOString().split('T')[0],
                                location: 'Scan 3D'
                            });
                        }
                        onNavigate && onNavigate('INVENTORY');
                    }}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                  >
                      Ajouter à l'inventaire
                  </button>
              </div>
          </div>
      );
  }

  // Render Room Results
  if (mode === 'RESULTS_ROOM') {
      return (
          <div className="w-full max-w-4xl mx-auto p-4 pb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Objets Détectés ({foundItems.length})</h2>
              <div className="space-y-4 mb-6">
                  {foundItems.map((item, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-xl flex items-center gap-4 border border-slate-700">
                          <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">{i+1}</div>
                          <div className="flex-1">
                              <h3 className="font-bold text-white">{item.name}</h3>
                              <p className="text-xs text-slate-400">{item.category} • {item.condition}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-emerald-400 font-bold">{item.resaleValue}{currencySymbol}</p>
                          </div>
                      </div>
                  ))}
              </div>
              <button onClick={addAllRoomItems} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500">Tout Ajouter à l'Inventaire</button>
          </div>
      );
  }
  
  // Render Invoice Results
  if (mode === 'RESULTS_INVOICE') {
      return (
          <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="text-purple-400" size={40} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Facture Analysée</h2>
              <div className="bg-slate-800 p-6 rounded-xl w-full text-left space-y-3 mb-6">
                   <p className="text-slate-400 text-sm">Magasin: <span className="text-white font-bold float-right">{foundInvoice?.storeName || 'Inconnu'}</span></p>
                   <p className="text-slate-400 text-sm">Date: <span className="text-white font-bold float-right">{foundInvoice?.purchaseDate || 'Inconnue'}</span></p>
                   <p className="text-slate-400 text-sm">Total: <span className="text-emerald-400 font-bold float-right">{foundInvoice?.totalAmount} {currencySymbol}</span></p>
                   <div className="border-t border-slate-700 pt-2 mt-2">
                       <p className="text-xs text-slate-500 mb-1">Items détectés:</p>
                       <ul className="list-disc pl-4 text-sm text-white">
                           {foundInvoice?.items?.map((it:string, k:number) => <li key={k}>{it}</li>)}
                       </ul>
                   </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">Note: Dans une version complète, ceci serait attaché automatiquement à l'objet correspondant.</p>
              <button onClick={() => onNavigate && onNavigate('INVENTORY')} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">Retour Inventaire</button>
          </div>
      );
  }
  
  // Loading
  if (mode === 'ANALYZING') {
      return (
          <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-300 animate-pulse">Analyse Gemini Vision en cours...</p>
          </div>
      );
  }

  return null;
};

export default VisionView;