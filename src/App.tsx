/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider, storage } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, setDoc, doc, getDoc, onSnapshot, updateDoc, increment, deleteDoc, orderBy, limit, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageUploader } from './components/ImageUploader';
import { ScreenshotUploader } from './components/ScreenshotUploader';
import { 
  LayoutGrid, 
  Gamepad2, 
  Search, 
  User, 
  Moon, 
  Sun, 
  ChevronRight, 
  Star, 
  Download,
  Settings,
  CreditCard,
  Gift,
  Bell,
  ShieldCheck,
  HelpCircle,
  Cloud,
  ArrowLeft,
  Camera,
  Save,
  Edit2,
  ChevronLeft,
  Lock,
  Smartphone,
  Globe,
  FileText,
  Trash2,
  Check,
  Fingerprint,
  Delete,
  Loader2,
  ArrowDownToLine,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Users,
  Activity,
  History,
  BarChart3,
  Upload,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { Toaster, toast } from 'sonner';

// --- Types ---

type Tab = 'Today' | 'Apps' | 'Games' | 'Search';

interface AppItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  ratingCount?: number;
  iconUrl: string;
  mainThumbnail?: string;
  isGame: boolean;
  developer: string;
  description: string;
  size: string;
  version: string;
  screenshots?: string[];
  downloadUrl?: string;
  downloads?: number;
  status: 'draft' | 'published' | 'archived';
  publisherId?: string;
  publisherName?: string;
  createdAt?: number;
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  comment: string;
  createdAt: number;
}

interface Review {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  rating: number;
  comment: string;
  createdAt: number;
  replies: Reply[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photoURL?: string;
}

// --- Mock Data ---

const TRANSLATIONS: Record<string, any> = {
  English: {
    welcome: "Welcome back",
    purchased: "Purchased",
    subscriptions: "Subscriptions",
    settings: "Settings",
    privacy: "Privacy",
    support: "Support",
    signOut: "Sign Out",
    language: "Language",
    done: "Done",
    account: "Account",
    personalInfo: "Personal Info",
    appearance: "Appearance",
    security: "Security",
    other: "Other",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    editProfile: "Edit Profile",
    appIcon: "App Icon",
    faceId: "Face ID & Passcode",
    privacyReport: "Privacy Report"
  },
  Spanish: {
    welcome: "Bienvenido de nuevo",
    purchased: "Comprado",
    subscriptions: "Suscripciones",
    settings: "Ajustes",
    privacy: "Privacidad",
    support: "Soporte",
    signOut: "Cerrar sesión",
    language: "Idioma",
    done: "Hecho",
    account: "Cuenta",
    personalInfo: "Información Personal",
    appearance: "Apariencia",
    security: "Seguridad",
    other: "Otros",
    darkMode: "Modo Oscuro",
    notifications: "Notificaciones",
    editProfile: "Editar Perfil",
    appIcon: "Icono de App",
    faceId: "Face ID y Código",
    privacyReport: "Informe de Privacidad"
  },
  French: {
    welcome: "Bon retour",
    purchased: "Acheté",
    subscriptions: "Abonnements",
    settings: "Réglages",
    privacy: "Confidentialité",
    support: "Assistance",
    signOut: "Déconnexion",
    language: "Langue",
    done: "Terminé",
    account: "Compte",
    personalInfo: "Infos Personnelles",
    appearance: "Apparence",
    security: "Sécurité",
    other: "Autre",
    darkMode: "Mode Sombre",
    notifications: "Notifications",
    editProfile: "Modifier le Profil",
    appIcon: "Icône de l'App",
    faceId: "Face ID et Code",
    privacyReport: "Rapport de Confidentialité"
  },
  German: {
    welcome: "Willkommen zurück",
    purchased: "Gekauft",
    subscriptions: "Abonnements",
    settings: "Einstellungen",
    privacy: "Datenschutz",
    support: "Support",
    signOut: "Abmelden",
    language: "Sprache",
    done: "Fertig",
    account: "Konto",
    personalInfo: "Persönliche Info",
    appearance: "Erscheinungsbild",
    security: "Sicherheit",
    other: "Sonstiges",
    darkMode: "Dunkelmodus",
    notifications: "Benachrichtigungen",
    editProfile: "Profil bearbeiten",
    appIcon: "App-Symbol",
    faceId: "Face ID & Code",
    privacyReport: "Datenschutzbericht"
  },
  Japanese: {
    welcome: "おかえりなさい",
    purchased: "購入済み",
    subscriptions: "サブスクリプション",
    settings: "設定",
    privacy: "プライバシー",
    support: "サポート",
    signOut: "サインアウト",
    language: "言語",
    done: "完了",
    account: "アカウント",
    personalInfo: "個人情報",
    appearance: "外観",
    security: "セキュリティ",
    other: "その他",
    darkMode: "ダークモード",
    notifications: "通知",
    editProfile: "プロフィールを編集",
    appIcon: "Appアイコン",
    faceId: "Face IDとパスコード",
    privacyReport: "プライバシーレポート"
  }
};


// --- Components ---

const Switch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${checked ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
  >
    <motion.div 
      animate={{ x: checked ? 22 : 2 }}
      className="absolute top-1 left-0 w-5 h-5 rounded-full bg-white shadow-sm"
    />
  </button>
);

const SkeletonAppCard = () => (
  <div className="flex items-center gap-4 p-4 ios-card bg-white dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5">
    <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 animate-pulse" />
    </div>
    <div className="w-16 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse flex-shrink-0" />
  </div>
);

const SkeletonFeaturedCard = () => (
  <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
    <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-3 bg-white/40 rounded w-1/4" />
        <div className="h-8 bg-white/40 rounded w-3/4" />
        <div className="h-4 bg-white/40 rounded w-full" />
        <div className="h-4 bg-white/40 rounded w-5/6" />
      </div>
      <div className="w-20 h-10 bg-white/40 rounded-full flex-shrink-0" />
    </div>
  </div>
);

const AppCard: React.FC<{ app: AppItem; isPurchased: boolean; downloadProgress?: number; onGet: (app: AppItem) => void; onPreview: (app: AppItem) => void }> = ({ app, isPurchased, downloadProgress, onGet, onPreview }) => {
  if (!app) return null;
  
  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      onClick={() => onPreview(app)}
      className="flex items-center gap-4 p-4 ios-card bg-white dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5 cursor-pointer"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
        {app.iconUrl ? (
          <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="text-3xl">📱</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{app.name}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{app.category}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-medium text-zinc-500">{app.rating}</span>
        </div>
      </div>
      {downloadProgress !== undefined ? (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-500 transition-all duration-300 ease-out"
              strokeDasharray={`${downloadProgress}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
          </div>
        </div>
      ) : (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (isPurchased) {
              if (app.downloadUrl && app.downloadUrl !== '#') {
                window.open(app.downloadUrl, '_blank');
              } else {
                toast.info('Opening application...');
              }
            } else {
              onPreview(app);
            }
          }}
          className={`px-5 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-colors ${isPurchased ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-500' : 'bg-zinc-100 dark:bg-zinc-800 text-blue-500 active:bg-zinc-200 dark:active:bg-zinc-700'}`}
        >
          {isPurchased ? 'Open' : 'Get'}
        </button>
      )}
    </motion.div>
  );
};

const FeaturedCard: React.FC<{ app: AppItem; isPurchased: boolean; downloadProgress?: number; onGet: (app: AppItem) => void; onPreview: (app: AppItem) => void }> = ({ app, isPurchased, downloadProgress, onGet, onPreview }) => {
  if (!app) return null;

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => onPreview(app)}
      className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 z-10" />
      <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        {app.mainThumbnail || app.iconUrl ? (
          <img src={app.mainThumbnail || app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="text-8xl">📱</div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{app.category}</p>
            <h2 className="text-3xl font-bold leading-tight mb-2">{app.name}</h2>
            <p className="text-sm opacity-90 line-clamp-2">{app.description}</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            {app.iconUrl && (
              <img src={app.iconUrl} alt={`${app.name} icon`} className="w-12 h-12 rounded-xl shadow-md object-cover" referrerPolicy="no-referrer" />
            )}
            {downloadProgress !== undefined ? (
              <div className="relative w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white transition-all duration-300 ease-out"
                    strokeDasharray={`${downloadProgress}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                </div>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPurchased) {
                    if (app.downloadUrl && app.downloadUrl !== '#') {
                      window.open(app.downloadUrl, '_blank');
                    } else {
                      toast.info('Opening application...');
                    }
                  } else {
                    onPreview(app);
                  }
                }}
                className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider backdrop-blur-md transition-all ${isPurchased ? 'bg-white text-zinc-900' : 'bg-white text-zinc-900 hover:scale-105 active:scale-95'}`}
              >
                {isPurchased ? 'Open' : 'Get'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RatingStars: React.FC<{ rating: number; onRate?: (rating: number) => void }> = ({ rating, onRate }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`w-6 h-6 cursor-pointer ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
          onClick={() => onRate?.(star)}
        />
      ))}
    </div>
  );
};

const PreviewPage: React.FC<{
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  isPurchased: boolean;
  downloadProgress?: number;
  onGet: (app: AppItem) => void;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  setActiveTab: (tab: Tab) => void;
  setIsProfileOpen: (isOpen: boolean) => void;
  isAdmin: boolean;
  setView: (view: 'main' | 'settings' | 'purchased' | 'subscriptions' | 'privacy' | 'support' | 'edit-profile' | 'language' | 'faceid-passcode' | 'set-passcode' | 'auth' | 'admin' | 'publisher-profile') => void;
  onOpenPublisherProfile: (publisherId: string) => void;
}> = ({ app, isOpen, onClose, isPurchased, downloadProgress, onGet, firebaseUser, userProfile, setActiveTab, setIsProfileOpen, isAdmin, setView, onOpenPublisherProfile }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && app) {
      const q = query(collection(db, 'reviews'), where('appId', '==', app.id), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      });

      // Calculate average rating from 'ratings' collection
      const ratingsQ = query(collection(db, 'ratings'), where('appId', '==', app.id));
      const unsubscribeRatings = onSnapshot(ratingsQ, (snapshot) => {
        const ratings = snapshot.docs.map(doc => doc.data().rating as number);
        const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(r => {
          const star = Math.round(r);
          if (star >= 1 && star <= 5) breakdown[star]++;
        });
        setRatingBreakdown(breakdown);

        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAverageRating(Number(avg.toFixed(1)));
          setRatingCount(ratings.length);
        } else {
          setAverageRating(app.rating || 0);
          setRatingCount(0);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeRatings();
      };
    }
  }, [isOpen, app]);

  const handleRate = (rating: number) => {
    if (!firebaseUser) {
      onClose();
      setActiveTab('Today');
      setView('auth');
      setIsProfileOpen(true);
      return;
    }
    setUserRating(rating);
    setShowUndo(true);
    const timeout = setTimeout(async () => {
      setShowUndo(false);
      // Permanently register rating
      if (firebaseUser && app) {
        const ratingId = `${firebaseUser.uid}_${app.id}`;
        await setDoc(doc(db, 'ratings', ratingId), {
          appId: app.id,
          userId: firebaseUser.uid,
          rating,
          createdAt: Date.now()
        });
      }
    }, 3000);
    setUndoTimeout(timeout);
  };

  const undoRating = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    setUserRating(0);
    setShowUndo(false);
  };

  const addReview = async (rating: number, comment: string) => {
    if (!firebaseUser || !userProfile) return;
    if (!comment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    // Add review
    await addDoc(collection(db, 'reviews'), {
      appId: app!.id,
      userId: firebaseUser.uid,
      userName: `${userProfile.firstName} ${userProfile.lastName}`,
      userPhotoUrl: userProfile.photoURL || '',
      rating,
      comment,
      createdAt: Date.now(),
      replies: []
    });

    // Also update/add rating to source of truth
    const ratingId = `${firebaseUser.uid}_${app!.id}`;
    await setDoc(doc(db, 'ratings', ratingId), {
      appId: app!.id,
      userId: firebaseUser.uid,
      rating,
      createdAt: Date.now()
    });

    setNewComment('');
  };

  const addReply = async (reviewId: string, comment: string) => {
    if (!firebaseUser || !userProfile) return;
    if (!comment.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    const newReply: Reply = {
      id: Date.now().toString(),
      userId: firebaseUser.uid,
      userName: `${userProfile.firstName} ${userProfile.lastName}`,
      userPhotoUrl: userProfile.photoURL || '',
      comment,
      createdAt: Date.now()
    };
    
    await updateDoc(doc(db, 'reviews', reviewId), {
      replies: [...review.replies, newReply]
    });
    setReplyingTo(null);
    setReplyText('');
  };

  const deleteReview = async (reviewId: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const deleteReply = async (reviewId: string, replyId: string) => {
    if (!firebaseUser) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        replies: review.replies.filter(r => r.id !== replyId)
      });
      toast.success('Reply deleted');
    } catch (error) {
      toast.error('Failed to delete reply');
    }
  };

  const handleLongPress = (id: string, userId: string) => {
    if (firebaseUser?.uid === userId || isAdmin) {
      setDeletingId(id);
    }
  };

  if (!app) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
            <button onClick={onClose} className="p-2 -ml-2 text-blue-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">App Preview</p>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
              {/* App Identity */}
              <div className="flex gap-6 items-center">
                <div className="w-32 h-32 rounded-[32px] bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/5 dark:border-white/5">
                  {app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📱</div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-1 tracking-tight">{app.name}</h1>
                  <p 
                    onClick={() => {
                      if (app.publisherId) {
                        onOpenPublisherProfile(app.publisherId);
                      } else if (isAdmin) {
                        toast.info('This app is missing publisher data. Use "Fix Publisher Data" in the Admin Dashboard to assign it to your profile.', {
                          duration: 5000
                        });
                      } else {
                        toast.error('Publisher profile not available for this app');
                      }
                    }}
                    className="text-lg text-blue-500 font-semibold mb-4 cursor-pointer hover:underline"
                  >
                    {app.publisherName || app.developer}
                  </p>
                  {downloadProgress !== undefined ? (
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-200 dark:text-zinc-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500 transition-all duration-300 ease-out"
                          strokeDasharray={`${downloadProgress}, 100`}
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        if (isPurchased) {
                          if (app.downloadUrl && app.downloadUrl !== '#') {
                            window.open(app.downloadUrl, '_blank');
                          } else {
                            toast.info('Opening application...');
                          }
                        } else {
                          onGet(app);
                        }
                      }}
                      className={`px-8 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${isPurchased ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                    >
                      {isPurchased ? 'Open' : 'Get'}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Section */}
              <div className="flex items-center justify-between border-y border-zinc-100 dark:border-zinc-900 py-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-zinc-900 dark:text-white font-bold text-lg">
                    {averageRating} <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Rating</p>
                </div>
                <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
                <div className="text-center">
                  <div className="text-zinc-900 dark:text-white font-bold text-lg">
                    {app.version || '1.0.0'}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Version</p>
                </div>
                <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
                <div className="text-center">
                  <div className="text-zinc-900 dark:text-white font-bold text-lg">
                    {app.size || '45 MB'}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Size</p>
                </div>
              </div>

              {/* Screenshots */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Preview</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                  {app.screenshots && app.screenshots.length > 0 ? (
                    app.screenshots.map((url, i) => (
                      <div key={i} className="flex-shrink-0 w-64 aspect-[9/16] rounded-3xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-black/5 dark:border-white/5 shadow-lg">
                        <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex-shrink-0 w-64 aspect-[9/16] rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                        <p className="text-zinc-400 text-sm">Screenshot {i}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Description</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
                  {app.description}
                </p>
              </div>

              {/* Ratings & Reviews */}
              <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Ratings & Reviews</h3>
                  <button className="text-blue-500 font-medium">See All</button>
                </div>
                
                <div className="space-y-4">
                  <p className="font-bold text-zinc-900 dark:text-white">Rate this app</p>
                  <RatingStars rating={userRating} onRate={handleRate} />
                  {showUndo && (
                    <div className="bg-zinc-900 text-white px-4 py-2 rounded-full flex items-center justify-between">
                      <span>Rating saved</span>
                      <button onClick={undoRating} className="text-blue-400 font-bold">Undo</button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-zinc-900 dark:text-white tracking-tighter">{averageRating}</div>
                    <p className="text-sm font-bold text-zinc-400 mt-1">out of 5</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">{ratingCount} Ratings</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = ratingBreakdown[stars] || 0;
                      const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <div className="flex items-center justify-end w-12 gap-1 text-zinc-400">
                            <span className="text-xs font-bold">{stars}</span>
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-900 dark:bg-zinc-300 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-zinc-500">Developer</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{app.developer}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-zinc-500">Category</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{app.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-zinc-500">Language</span>
                    <span className="font-medium text-zinc-900 dark:text-white">English</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-zinc-500">Age Rating</span>
                    <span className="font-medium text-zinc-900 dark:text-white">4+</span>
                  </div>
                </div>
              </div>

                {/* Comments Section */}
                <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Comments</h3>
                  
                  {firebaseUser ? (
                    <div className="space-y-3">
                      <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button 
                        onClick={() => addReview(5, newComment)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold text-sm hover:bg-blue-600 transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  ) : (
                    <p className="text-zinc-500 cursor-pointer hover:text-blue-500" onClick={() => { onClose(); setActiveTab('Today'); setView('auth'); setIsProfileOpen(true); }}>Please sign in to comment.</p>
                  )}

                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div 
                        key={review.id} 
                        className="flex gap-3 relative"
                        onContextMenu={(e) => { e.preventDefault(); handleLongPress(review.id, review.userId); }}
                        onTouchStart={() => {
                          const timer = setTimeout(() => handleLongPress(review.id, review.userId), 500);
                          setLongPressTimer(timer);
                        }}
                        onTouchEnd={() => { if (longPressTimer) clearTimeout(longPressTimer); }}
                      >
                        {deletingId === review.id && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 z-20 flex items-center justify-center gap-4 rounded-3xl"
                          >
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-sm">Cancel</button>
                            <button onClick={() => { deleteReview(review.id); setDeletingId(null); }} className="px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm">Delete</button>
                          </motion.div>
                        )}
                        <img src={review.userPhotoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.userId} alt={review.userName} className="w-10 h-10 rounded-full bg-zinc-200" referrerPolicy="no-referrer" />
                        <div className="flex-1 space-y-1">
                          <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl">
                            <p className="font-bold text-sm text-zinc-900 dark:text-white">{review.userName}</p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{review.comment}</p>
                          </div>
                          <div className="flex items-center gap-3 px-2">
                            <button onClick={() => { if (!firebaseUser) { onClose(); setActiveTab('Today'); setView('auth'); setIsProfileOpen(true); } else { setReplyingTo(review.id); } }} className="text-xs font-bold text-zinc-500 hover:text-blue-500">Reply</button>
                            {(firebaseUser?.uid === review.userId || isAdmin) && (
                              <button onClick={() => setDeletingId(review.id)} className="text-xs font-bold text-red-400 hover:text-red-500">Delete</button>
                            )}
                            <span className="text-xs text-zinc-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Replies */}
                          {review.replies.map(reply => (
                            <div 
                              key={reply.id} 
                              className="flex gap-3 mt-2 pl-6 relative"
                              onContextMenu={(e) => { e.preventDefault(); handleLongPress(reply.id, reply.userId); }}
                              onTouchStart={() => {
                                const timer = setTimeout(() => handleLongPress(reply.id, reply.userId), 500);
                                setLongPressTimer(timer);
                              }}
                              onTouchEnd={() => { if (longPressTimer) clearTimeout(longPressTimer); }}
                            >
                              {deletingId === reply.id && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 z-20 flex items-center justify-center gap-4 rounded-2xl"
                                >
                                  <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-sm">Cancel</button>
                                  <button onClick={() => { deleteReply(review.id, reply.id); setDeletingId(null); }} className="px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm">Delete</button>
                                </motion.div>
                              )}
                              <img src={reply.userPhotoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + reply.userId} alt={reply.userName} className="w-8 h-8 rounded-full bg-zinc-200" referrerPolicy="no-referrer" />
                              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-bold text-xs text-zinc-900 dark:text-white">{reply.userName}</p>
                                  {(firebaseUser?.uid === reply.userId || isAdmin) && (
                                    <button onClick={() => setDeletingId(reply.id)} className="text-[10px] font-bold text-red-400 hover:text-red-500">Delete</button>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300">{reply.comment}</p>
                              </div>
                            </div>
                          ))}

                          {replyingTo === review.id && (
                            <div className="flex gap-3 mt-2 pl-6">
                              <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Reply..."
                                className="flex-1 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                              />
                              <button 
                                onClick={() => addReply(review.id, replyText)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-xs"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {app.mainThumbnail && (
                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900">
                    <img src={app.mainThumbnail} alt={app.name} className="w-full rounded-3xl shadow-lg" referrerPolicy="no-referrer" />
                  </div>
                )}
            </div>
          </div>
          {/* Sticky Get Button */}
          <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
            {downloadProgress !== undefined ? (
              <div className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center gap-3">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-200 dark:text-zinc-700"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500 transition-all duration-300 ease-out"
                      strokeDasharray={`${downloadProgress}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />
                  </div>
                </div>
                <span className="font-bold text-lg text-blue-500 uppercase tracking-wider">Downloading...</span>
              </div>
            ) : (
              <button 
                onClick={() => !isPurchased && onGet(app)}
                className={`w-full py-4 rounded-2xl font-bold text-lg uppercase tracking-wider transition-all ${isPurchased ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
              >
                {isPurchased ? 'Open' : 'Get'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AuthModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  passcode: string | null;
  isFaceIdEnabled: boolean;
  isTouchIdEnabled: boolean;
  app: AppItem | null;
}> = ({ isOpen, onClose, onSuccess, passcode, isFaceIdEnabled, isTouchIdEnabled, app }) => {
  const [input, setInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authType, setAuthType] = useState<'passcode' | 'faceid' | 'touchid'>(
    isFaceIdEnabled ? 'faceid' : isTouchIdEnabled ? 'touchid' : 'passcode'
  );

  useEffect(() => {
    if (isOpen && (authType === 'faceid' || authType === 'touchid')) {
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        onSuccess();
      }, 2000);
    }
  }, [isOpen, authType]);

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl shadow-inner">
            {app.icon}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Confirm Purchase</h3>
            <p className="text-sm text-zinc-500">Double-click the side button to install {app.name}</p>
          </div>

          <div className="w-full py-4 px-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <Cloud className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">App Store</p>
                <p className="text-[10px] text-zinc-500">VISION CLOUD ACCOUNT</p>
              </div>
            </div>
            <p className="font-bold text-zinc-900 dark:text-white">Free</p>
          </div>

          {authType === 'passcode' ? (
            <div className="w-full space-y-6">
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full border-2 border-zinc-300 dark:border-zinc-700 ${input.length > i ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white' : ''}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'delete') setInput(prev => prev.slice(0, -1));
                      else if (typeof num === 'number' && input.length < 4) {
                        const next = input + num;
                        setInput(next);
                        if (next === passcode) {
                          setTimeout(onSuccess, 300);
                        } else if (next.length === 4) {
                          setTimeout(() => {
                            alert('Incorrect passcode');
                            setInput('');
                          }, 300);
                        }
                      }
                    }}
                    className={`h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-colors ${num === '' ? 'pointer-events-none' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                  >
                    {num === 'delete' ? <Delete className="w-5 h-5" /> : num}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full border-4 border-blue-500/20 flex items-center justify-center ${isAuthenticating ? 'animate-pulse' : ''}`}>
                  {authType === 'faceid' ? <Smartphone className="w-8 h-8 text-blue-500" /> : <Fingerprint className="w-8 h-8 text-blue-500" />}
                </div>
                {isAuthenticating && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {isAuthenticating ? `Authenticating with ${authType === 'faceid' ? 'Face ID' : 'Touch ID'}...` : 'Ready to authenticate'}
              </p>
            </div>
          )}

          <button 
            onClick={onClose}
            className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSheet: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  isDarkMode: boolean; 
  setIsDarkMode: (val: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  passcode: string | null;
  setPasscode: (val: string | null) => void;
  isFaceIdEnabled: boolean;
  setIsFaceIdEnabled: (val: boolean) => void;
  isTouchIdEnabled: boolean;
  setIsTouchIdEnabled: (val: boolean) => void;
  purchasedAppIds: Set<string>;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  apps: AppItem[];
  isAdmin: boolean;
  isMaintenanceMode: boolean;
  storeName: string;
  setStoreName: (val: string) => void;
  setIsMaintenanceMode: (val: boolean) => void;
  isTodayEnabled: boolean;
  setIsTodayEnabled: (val: boolean) => void;
  todayApps: string[];
  setTodayApps: (apps: string[]) => void;
  view: 'main' | 'settings' | 'purchased' | 'subscriptions' | 'privacy' | 'support' | 'edit-profile' | 'language' | 'faceid-passcode' | 'set-passcode' | 'auth' | 'admin' | 'publisher-profile';
  setView: (view: 'main' | 'settings' | 'purchased' | 'subscriptions' | 'privacy' | 'support' | 'edit-profile' | 'language' | 'faceid-passcode' | 'set-passcode' | 'auth' | 'admin' | 'publisher-profile') => void;
  initialView?: 'main' | 'settings' | 'purchased' | 'subscriptions' | 'privacy' | 'support' | 'edit-profile' | 'language' | 'faceid-passcode' | 'set-passcode' | 'auth' | 'admin' | 'publisher-profile';
  selectedPublisherId: string | null;
  setSelectedPublisherId: (id: string | null) => void;
  setSelectedApp: (app: AppItem | null) => void;
  setIsPreviewOpen: (isOpen: boolean) => void;
  setApps: (apps: AppItem[]) => void;
}> = ({ 
  isOpen, onClose, isDarkMode, setIsDarkMode, language, setLanguage,
  passcode, setPasscode, isFaceIdEnabled, setIsFaceIdEnabled, isTouchIdEnabled, setIsTouchIdEnabled,
  purchasedAppIds, userProfile, setUserProfile, apps, isAdmin, isMaintenanceMode, storeName,
  setStoreName, setIsMaintenanceMode, isTodayEnabled, setIsTodayEnabled, todayApps, setTodayApps,
  view, setView, initialView, selectedPublisherId, setSelectedPublisherId, setSelectedApp, setIsPreviewOpen, setApps
}) => {
  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView, setView]);
  const [activities, setActivities] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    let unsubscribeActivities: (() => void) | undefined;
    if (view === 'admin') {
      setIsLoadingUsers(true);
      getDocs(collection(db, 'users')).then(snapshot => {
        setTotalUsers(snapshot.size);
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoadingUsers(false);
      }).catch(err => {
        console.error(err);
        setIsLoadingUsers(false);
      });

      const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10));
      unsubscribeActivities = onSnapshot(q, (snapshot) => {
        setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    if (view === 'publisher-profile' && selectedPublisherId) {
      setIsLoadingUsers(true);
      getDoc(doc(db, 'users', selectedPublisherId)).then(snapshot => {
        if (snapshot.exists()) {
          const userData = { id: snapshot.id, ...snapshot.data() };
          setAllUsers(prev => {
            if (prev.find(u => u.id === userData.id)) return prev;
            return [...prev, userData];
          });
        }
        setIsLoadingUsers(false);
      }).catch(err => {
        console.error(err);
        setIsLoadingUsers(false);
      });
    }

    return () => {
      if (unsubscribeActivities) unsubscribeActivities();
    };
  }, [view, selectedPublisherId]);

  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!username) {
        setUsernameError(null);
        setIsUsernameAvailable(null);
        return;
      }
      if (username.length < 3) {
        setUsernameError('Username too short');
        setIsUsernameAvailable(null);
        return;
      }
      if (/[^a-zA-Z0-9_]/.test(username)) {
        setUsernameError('Username cannot contain symbols');
        setIsUsernameAvailable(null);
        return;
      }
      
      // Live check against Firestore
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setUsernameError('Username taken');
        setIsUsernameAvailable(false);
      } else {
        setUsernameError(null);
        setIsUsernameAvailable(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);
  const scrollPositions = useRef<Record<string, number>>({});
  
  const getScrollProps = (viewName: string) => ({
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      scrollPositions.current[viewName] = e.currentTarget.scrollTop;
    },
    ref: (el: HTMLDivElement | null) => {
      if (el) {
        el.scrollTop = scrollPositions.current[viewName] || 0;
      }
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return unsubscribe;
  }, []);

  const logActivity = async (type: string, message: string) => {
    try {
      await addDoc(collection(db, 'activities'), {
        type,
        message,
        timestamp: new Date().toISOString(),
        userId: firebaseUser?.uid || 'system',
        userName: userProfile?.username || 'System'
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const fixPublisherData = async () => {
    if (!firebaseUser || !userProfile) return;
    const appsRef = collection(db, 'apps');
    const snapshot = await getDocs(appsRef);
    let fixedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data.publisherId) {
        await updateDoc(doc(db, 'apps', docSnap.id), {
          publisherId: firebaseUser.uid,
          publisherName: `${userProfile.firstName} ${userProfile.lastName}`
        });
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      toast.success(`Fixed publisher data for ${fixedCount} apps`);
      // Refresh apps list
      const updatedApps = await getDocs(appsRef);
      setApps(updatedApps.docs.map(d => ({ id: d.id, ...d.data() } as AppItem)));
    } else {
      toast.info('No apps missing publisher data found');
    }
  };

  const clearActivities = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'activities'));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      toast.success('Activity logs cleared');
      logActivity('system_cleanup', 'Cleared all activity logs');
    } catch (error) {
      toast.error('Failed to clear activity logs');
    }
  };

  const resetDatabase = async () => {
    if (!window.confirm('Are you absolutely sure? This will wipe ALL applications and activity logs.')) return;
    
    setIsResettingDatabase(true);
    try {
      // Clear Apps
      const appsSnapshot = await getDocs(collection(db, 'apps'));
      const appDeletes = appsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Clear Activities
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activityDeletes = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all([...appDeletes, ...activityDeletes]);
      
      toast.success('System database reset complete');
      logActivity('system_reset', 'System database reset performed (All apps and logs cleared)');
      
      setTimeout(() => {
        setIsResettingDatabase(false);
      }, 1000);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset database');
      setIsResettingDatabase(false);
    }
  };

  const seedSampleData = async () => {
    setIsLoading(true);
    try {
      const sampleApps = [
        {
          name: "Lumina Pro",
          category: "Photo & Video",
          rating: 4.8,
          iconUrl: "https://picsum.photos/seed/lumina/512/512",
          isGame: false,
          developer: "Aura Labs",
          description: "Professional-grade photo editing with AI-powered enhancements and real-time filters.",
          size: "124 MB",
          version: "2.4.1",
          downloads: 12500,
          screenshots: ["https://picsum.photos/seed/l1/1920/1080", "https://picsum.photos/seed/l2/1920/1080"],
          downloadUrl: "#"
        },
        {
          name: "Void Runner",
          category: "Games",
          rating: 4.9,
          iconUrl: "https://picsum.photos/seed/void/512/512",
          isGame: true,
          developer: "Nebula Games",
          description: "An endless runner set in a neon-drenched cyberpunk future. Fast-paced action and synthwave beats.",
          size: "450 MB",
          version: "1.0.5",
          downloads: 85000,
          screenshots: ["https://picsum.photos/seed/v1/1920/1080", "https://picsum.photos/seed/v2/1920/1080"],
          downloadUrl: "#"
        },
        {
          name: "Zenith Notes",
          category: "Productivity",
          rating: 4.7,
          iconUrl: "https://picsum.photos/seed/zenith/512/512",
          isGame: false,
          developer: "Focus Flow",
          description: "Minimalist note-taking app with markdown support, cloud sync, and focus mode.",
          size: "45 MB",
          version: "3.2.0",
          downloads: 50000,
          screenshots: ["https://picsum.photos/seed/z1/1920/1080", "https://picsum.photos/seed/z2/1920/1080"],
          downloadUrl: "#"
        }
      ];

      for (const app of sampleApps) {
        await addDoc(collection(db, 'apps'), {
          ...app,
          publisherId: firebaseUser?.uid || 'system',
          publisherName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'System Publisher',
          createdAt: Date.now(),
          status: 'published'
        });
      }

      toast.success('Sample data seeded successfully');
      logActivity('system_seed', 'Seeded sample application data');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed sample data');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadApp = async (appData: any) => {
    if (!isAdmin || !firebaseUser || !userProfile) return;
    await addDoc(collection(db, 'apps'), {
      ...appData,
      publisherId: firebaseUser.uid,
      publisherName: `${userProfile.firstName} ${userProfile.lastName}`,
      createdAt: Date.now()
    });
  };
  const [editFirstName, setEditFirstName] = useState(userProfile?.firstName || '');
  const [editLastName, setEditLastName] = useState(userProfile?.lastName || '');
  const [editPic, setEditPic] = useState(userProfile?.photoURL || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadIsGame, setUploadIsGame] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadIconUrl, setUploadIconUrl] = useState('');
  const [uploadMainThumbnail, setUploadMainThumbnail] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadSize, setUploadSize] = useState('');
  const [uploadVersion, setUploadVersion] = useState('');
  const [uploadDownloadUrl, setUploadDownloadUrl] = useState('');
  const [uploadScreenshots, setUploadScreenshots] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'draft' | 'published'>('published');
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'publish' | 'manage' | 'users' | 'settings' | 'today'>('dashboard');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminFilterStatus, setAdminFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);
  const [isResettingDatabase, setIsResettingDatabase] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [tempPasscode, setTempPasscode] = useState('');
  const [passcodeStep, setPasscodeStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPasscode, setFirstPasscode] = useState('');
  
  // Cropping State
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    if (view === 'edit-profile') {
      console.log('Initializing edit profile form', { userProfile, firebaseUser });
      setEditFirstName(userProfile?.firstName || firebaseUser?.displayName?.split(' ')[0] || '');
      setEditLastName(userProfile?.lastName || firebaseUser?.displayName?.split(' ').slice(1).join(' ') || '');
      setEditPic(userProfile?.photoURL || firebaseUser?.photoURL || '');
    }
  }, [view, userProfile?.firstName, userProfile?.lastName, userProfile?.photoURL, firebaseUser]);

  useEffect(() => {
    if (!isOpen || view !== 'edit-profile') return;
  }, [isOpen, view]);

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const saveCroppedImage = async () => {
    try {
      if (image && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        if (croppedImage) {
          setEditPic(croppedImage);
          setShowCropper(false);
          setImage(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setView('main'), 300); // Reset view after animation
  };

  const renderHeader = (title: string, showBack = true) => (
    <div className="flex items-center justify-between px-6 mb-8">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => {
              if (['edit-profile', 'language', 'faceid-passcode', 'purchased', 'subscriptions', 'privacy', 'support', 'admin'].includes(view)) {
                setView('settings');
              } else {
                setView('main');
              }
            }} 
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-blue-500" />
          </button>
        )}
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <button onClick={handleClose} className="text-blue-500 font-semibold text-lg">Done</button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[500px] h-[92vh] bg-zinc-50 dark:bg-zinc-950 rounded-t-[3rem] z-50 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-6" />
            
            <AnimatePresence mode="wait">
              {view === 'main' && (
                <motion.div 
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader((TRANSLATIONS[language] || TRANSLATIONS.English).account, false)}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 no-scrollbar" {...getScrollProps('main')}>
                    {/* Profile Section */}
                    {firebaseUser ? (
                      <button 
                        onClick={() => setView('edit-profile')}
                        className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                          {userProfile?.photoURL || firebaseUser.photoURL ? (
                            <img src={userProfile?.photoURL || firebaseUser.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-zinc-900 dark:text-white">
                            {userProfile?.firstName || userProfile?.lastName 
                              ? `${userProfile.firstName} ${userProfile.lastName}`.trim() 
                              : firebaseUser.displayName || 'User'}
                          </h3>
                          <p className="text-sm text-zinc-500">
                            @{userProfile?.username || firebaseUser.email?.split('@')[0] || 'username'}
                          </p>
                        </div>
                        <Edit2 className="w-5 h-5 text-zinc-300" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setView('auth')}
                        className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <User className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Sign In</h3>
                          <p className="text-sm text-zinc-500">Sign in to sync your apps</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                      </button>
                    )}

                    {/* Admin Section */}
                    {isAdmin && (
                      <button 
                        onClick={() => setView('admin')}
                        className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h3 className="font-bold text-lg">Admin Panel</h3>
                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                      </button>
                    )}

                    {/* Menu Sections */}
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        {[
                          { icon: <Download className="w-5 h-5 text-blue-500" />, label: (TRANSLATIONS[language] || TRANSLATIONS.English).purchased, view: 'purchased' as const },
                          { icon: <Bell className="w-5 h-5 text-red-500" />, label: (TRANSLATIONS[language] || TRANSLATIONS.English).subscriptions, view: 'subscriptions' as const },
                        ].map((item, i) => (
                          <button 
                            key={i} 
                            onClick={() => setView(item.view)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                          >
                            {item.icon}
                            <span className="flex-1 text-left font-medium text-zinc-900 dark:text-white">{item.label}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                          </button>
                        ))}
                      </div>

                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        {[
                          { icon: <Settings className="w-5 h-5 text-zinc-500" />, label: (TRANSLATIONS[language] || TRANSLATIONS.English).settings, view: 'settings' as const },
                          { icon: <ShieldCheck className="w-5 h-5 text-blue-400" />, label: (TRANSLATIONS[language] || TRANSLATIONS.English).privacy, view: 'privacy' as const },
                          { icon: <HelpCircle className="w-5 h-5 text-zinc-400" />, label: (TRANSLATIONS[language] || TRANSLATIONS.English).support, view: 'support' as const },
                        ].map((item, i) => (
                          <button 
                            key={i} 
                            onClick={() => setView(item.view)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                          >
                            {item.icon}
                            <span className="flex-1 text-left font-medium text-zinc-900 dark:text-white">{item.label}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                          </button>
                        ))}
                      </div>

                      {firebaseUser && (
                        <button 
                          onClick={async () => {
                            try {
                              await signOut(auth);
                              toast.success('Signed out successfully');
                              setView('main');
                            } catch (error: any) {
                              toast.error('Error signing out');
                            }
                          }}
                          className="w-full py-4 text-red-500 font-semibold text-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {(TRANSLATIONS[language] || TRANSLATIONS.English).signOut}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'admin' && (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-black"
                >
                  <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                    <button onClick={() => setView('main')} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold text-zinc-900 dark:text-white tracking-tight">System Portal</h2>
                    </div>
                    <div className="w-10" />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-x-auto no-scrollbar">
                        <button onClick={() => setAdminTab('dashboard')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'dashboard' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Dashboard</button>
                        <button onClick={() => setAdminTab('publish')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'publish' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Publish New</button>
                        <button onClick={() => setAdminTab('manage')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'manage' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Manage Apps</button>
                        <button onClick={() => setAdminTab('users')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'users' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Users</button>
                        <button onClick={() => setAdminTab('today')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'today' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Today Page</button>
                        <button onClick={() => setAdminTab('settings')} className={`flex-1 min-w-[100px] py-2 rounded-lg font-medium text-sm transition-all ${adminTab === 'settings' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Settings</button>
                      </div>

                      {adminTab === 'dashboard' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Dashboard Overview</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Key metrics and system status.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                                  <LayoutGrid className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-sm text-zinc-500 font-medium">Total Apps</p>
                                  <h4 className="text-2xl font-bold">{apps.length}</h4>
                                </div>
                              </div>
                              {apps.length === 0 && (
                                <button 
                                  onClick={seedSampleData}
                                  className="w-full py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors mb-2"
                                >
                                  Seed Sample Data
                                </button>
                              )}
                              <button 
                                onClick={fixPublisherData}
                                className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Wrench className="w-3 h-3" />
                                Fix Publisher Data
                              </button>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                                  <ArrowDownToLine className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-sm text-zinc-500 font-medium">Total Downloads</p>
                                  <h4 className="text-2xl font-bold">{apps.reduce((acc, app) => acc + (app.downloads || 0), 0).toLocaleString()}</h4>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                                  <Users className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-sm text-zinc-500 font-medium">Total Users</p>
                                  <h4 className="text-2xl font-bold">{totalUsers}</h4>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                  <History className="w-5 h-5 text-purple-500" />
                                  Recent Activity
                                </h4>
                                <button 
                                  onClick={clearActivities}
                                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                                >
                                  Clear Logs
                                </button>
                              </div>
                              <div className="space-y-4">
                                {activities.length > 0 ? activities.map(activity => (
                                  <div key={activity.id} className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'app_published' ? 'bg-green-100 text-green-500 dark:bg-green-900/30' : 'bg-red-100 text-red-500 dark:bg-red-900/30'}`}>
                                      {activity.type === 'app_published' ? <PlusCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-zinc-900 dark:text-white font-medium">{activity.message}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-zinc-500">@{activity.userName}</span>
                                        <span className="text-[10px] text-zinc-400">•</span>
                                        <span className="text-[10px] text-zinc-400">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-sm text-zinc-500 text-center py-4">No recent activity.</p>
                                )}
                              </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                              <h4 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-500" />
                                System Health
                              </h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-500">Database Connection</span>
                                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-500">Storage Service</span>
                                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-500">Auth Service</span>
                                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <h4 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                              <PlusCircle className="w-5 h-5 text-blue-500" />
                              Recent Applications
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {apps.slice(0, 6).map(app => (
                                <div key={app.id} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                  <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{app.name}</p>
                                    <p className="text-[10px] text-zinc-500 truncate">{app.category}</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${app.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {app.status || 'Published'}
                                  </span>
                                </div>
                              ))}
                              {apps.length === 0 && <p className="text-sm text-zinc-500 text-center py-4 col-span-full">No apps yet.</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {adminTab === 'publish' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Publish New Application</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter the application details below to publish it to the store.</p>
                          </div>
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 space-y-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Basic Information</label>
                                <div className="space-y-3">
                                  <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Application Name" className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                  
                                  <div className="flex gap-3">
                                    <button onClick={() => setUploadIsGame(false)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${!uploadIsGame ? 'bg-blue-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>App</button>
                                    <button onClick={() => setUploadIsGame(true)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${uploadIsGame ? 'bg-blue-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>Game</button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <select 
                                      value={uploadCategory} 
                                      onChange={(e) => setUploadCategory(e.target.value)} 
                                      className={`w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${!uploadCategory ? 'text-zinc-400' : ''}`}
                                    >
                                      <option value="" disabled>Select Category</option>
                                      {['Action', 'Productivity', 'RPG', 'Photo & Video', 'Health & Fitness', 'Simulation', 'Social', 'Education', 'Entertainment'].map((cat) => (
                                        <option key={cat} value={cat} className="text-zinc-900 dark:text-white">{cat}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Icon & Media</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">App Icon</label>
                                    <ImageUploader onUpload={setUploadIconUrl} currentIconUrl={uploadIconUrl} />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Main Thumbnail (Optional)</label>
                                    <ImageUploader onUpload={setUploadMainThumbnail} currentIconUrl={uploadMainThumbnail} />
                                  </div>
                                  <div className="space-y-4 md:col-span-2">
                                    <div>
                                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Download URL</label>
                                      <input type="text" value={uploadDownloadUrl} onChange={(e) => setUploadDownloadUrl(e.target.value)} placeholder="https://..." className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Technical Details</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <input type="text" value={uploadSize} onChange={(e) => setUploadSize(e.target.value)} placeholder="Size (e.g. 45 MB)" className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                  <input type="text" value={uploadVersion} onChange={(e) => setUploadVersion(e.target.value)} placeholder="Version (e.g. 1.0.0)" className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                </div>
                              </div>

                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Publishing Status</label>
                                <select value={uploadStatus} onChange={(e) => setUploadStatus(e.target.value as any)} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                                  <option value="published">Published (Visible to users)</option>
                                  <option value="draft">Draft (Hidden from users)</option>
                                </select>
                              </div>

                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Detailed application description..." rows={4} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" />
                              </div>
                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <ScreenshotUploader onUpload={setUploadScreenshots} />
                              </div>
                            </div>

                            <button 
                              onClick={async () => {
                                if (!uploadName || !uploadCategory || !uploadIconUrl || !uploadDownloadUrl) {
                                  toast.error('Please fill in all required fields');
                                  return;
                                }
                                try {
                                  await uploadApp({ 
                                    name: uploadName, 
                                    category: uploadCategory, 
                                    rating: 0, 
                                    iconUrl: uploadIconUrl, 
                                    mainThumbnail: uploadMainThumbnail,
                                    isGame: uploadIsGame, 
                                    developer: `${userProfile.firstName} ${userProfile.lastName}`, 
                                    description: uploadDescription,
                                    size: uploadSize || 'Unknown',
                                    version: uploadVersion || '1.0.0',
                                    downloadUrl: uploadDownloadUrl,
                                    screenshots: uploadScreenshots,
                                    status: uploadStatus
                                  });
                                  toast.success('Application published successfully');
                                  logActivity('app_published', `Published application: ${uploadName}`);
                                  setUploadName('');
                                  setUploadCategory('');
                                  setUploadIconUrl('');
                                  setUploadMainThumbnail('');
                                  setUploadDescription('');
                                  setUploadSize('');
                                  setUploadVersion('');
                                  setUploadDownloadUrl('');
                                  setUploadScreenshots([]);
                                  setUploadStatus('published');
                                  setView('main');
                                } catch (error) {
                                  toast.error('Failed to publish application');
                                }
                              }} 
                              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Upload className="w-5 h-5" />
                              Upload App
                            </button>
                          </div>
                        </div>
                      )}

                      {adminTab === 'manage' && (
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Manage Applications</h3>
                          {editingApp ? (
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
                              <h4 className="text-xl font-bold">Edit {editingApp.name}</h4>
                              <div className="flex gap-4 items-center">
                                <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                  {editingApp.iconUrl ? <img src={editingApp.iconUrl} alt="Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <LayoutGrid className="w-8 h-8 text-zinc-400" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input type="text" value={editingApp.name} onChange={(e) => setEditingApp({...editingApp, name: e.target.value})} className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Name" />
                                  <input type="text" value={editingApp.iconUrl} onChange={(e) => setEditingApp({...editingApp, iconUrl: e.target.value})} className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Icon URL" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Main Thumbnail</label>
                                <div className="aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                  {editingApp.mainThumbnail ? <img src={editingApp.mainThumbnail} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400">No Thumbnail</div>}
                                </div>
                                <input type="text" value={editingApp.mainThumbnail || ''} onChange={(e) => setEditingApp({...editingApp, mainThumbnail: e.target.value})} className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Main Thumbnail URL" />
                              </div>
                              <input type="text" value={editingApp.category} onChange={(e) => setEditingApp({...editingApp, category: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Category" />
                              <input type="text" value={editingApp.version} onChange={(e) => setEditingApp({...editingApp, version: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Version" />
                              <input type="text" value={editingApp.size} onChange={(e) => setEditingApp({...editingApp, size: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Size" />
                              <input type="text" value={editingApp.downloadUrl || ''} onChange={(e) => setEditingApp({...editingApp, downloadUrl: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" placeholder="Download URL" />
                              <textarea value={editingApp.description} onChange={(e) => setEditingApp({...editingApp, description: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" rows={4} placeholder="Description" />
                              
                              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <ScreenshotUploader 
                                  initialScreenshots={editingApp.screenshots || []}
                                  onUpload={(urls) => setEditingApp({...editingApp, screenshots: urls})} 
                                />
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="text-sm font-bold">Status:</label>
                                <select value={editingApp.status} onChange={(e) => setEditingApp({...editingApp, status: e.target.value as any})} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                  <option value="draft">Draft</option>
                                  <option value="published">Published</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>

                              <div className="flex gap-2">
                                <button onClick={() => setEditingApp(null)} className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold">Cancel</button>
                                <button onClick={async () => {
                                  await updateDoc(doc(db, 'apps', editingApp.id), { ...editingApp });
                                  toast.success('App updated successfully');
                                  setEditingApp(null);
                                }} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold">Save Changes</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Search apps..." 
                                  value={adminSearchQuery}
                                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                                  className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <select 
                                  value={adminFilterStatus}
                                  onChange={(e) => setAdminFilterStatus(e.target.value as any)}
                                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                  <option value="all">All Status</option>
                                  <option value="published">Published</option>
                                  <option value="draft">Draft</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                              
                              {appToDelete && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <h4 className="font-bold text-red-800 dark:text-red-400">Delete {appToDelete.name}?</h4>
                                    <p className="text-sm text-red-600 dark:text-red-300">This action cannot be undone.</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => setAppToDelete(null)} className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium text-sm">Cancel</button>
                                    <button onClick={async () => {
                                      try {
                                        await deleteDoc(doc(db, 'apps', appToDelete.id));
                                        toast.success('App deleted successfully');
                                        logActivity('app_deleted', `Deleted application: ${appToDelete.name}`);
                                        setAppToDelete(null);
                                      } catch (error) {
                                        toast.error('Failed to delete app');
                                      }
                                    }} className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm">Delete</button>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-3">
                                {apps.filter(app => {
                                  const matchesSearch = app.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) || app.category.toLowerCase().includes(adminSearchQuery.toLowerCase());
                                  const matchesStatus = adminFilterStatus === 'all' || app.status === adminFilterStatus;
                                  return matchesSearch && matchesStatus;
                                }).map(app => (
                                  <div key={app.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    <div 
                                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                      onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                                    >
                                      <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-xl object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-zinc-900 dark:text-white truncate">{app.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{app.category}</span>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${app.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : app.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Published'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingApp(app); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setAppToDelete(app); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${expandedAppId === app.id ? 'rotate-90' : ''}`} />
                                      </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                      {expandedAppId === app.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20"
                                        >
                                          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Version</p>
                                              <p className="text-sm font-medium">{app.version || '1.0.0'}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Size</p>
                                              <p className="text-sm font-medium">{app.size || 'Unknown'}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Downloads</p>
                                              <p className="text-sm font-medium">{app.downloads || 0}</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Rating</p>
                                              <p className="text-sm font-medium">⭐ {app.rating || 0}</p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-4">
                                              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Description</p>
                                              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{app.description}</p>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                                {apps.filter(app => {
                                  const matchesSearch = app.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) || app.category.toLowerCase().includes(adminSearchQuery.toLowerCase());
                                  const matchesStatus = adminFilterStatus === 'all' || app.status === adminFilterStatus;
                                  return matchesSearch && matchesStatus;
                                }).length === 0 && (
                                  <div className="text-center py-12 text-zinc-500">
                                    No applications found matching your criteria.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {adminTab === 'users' && (
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">User Management</h3>
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                  <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                  {allUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                            {user.photoURL ? (
                                              <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                              <Users className="w-4 h-4 text-zinc-400" />
                                            )}
                                          </div>
                                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                            {user.firstName} {user.lastName}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-zinc-500">@{user.username}</td>
                                      <td className="px-6 py-4 text-sm text-zinc-500">{user.email}</td>
                                      <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                          {user.role || 'User'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {allUsers.length === 0 && !isLoadingUsers && (
                              <div className="text-center py-12 text-zinc-500">No users found.</div>
                            )}
                            {isLoadingUsers && (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {adminTab === 'today' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Today Page Customization</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Enable Today Page</span>
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only" 
                                  checked={isTodayEnabled}
                                  onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    setIsTodayEnabled(newValue);
                                    await setDoc(doc(db, 'settings', 'system'), { isTodayEnabled: newValue }, { merge: true });
                                    toast.success(`Today page ${newValue ? 'enabled' : 'disabled'}`);
                                  }}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${isTodayEnabled ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isTodayEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </div>
                            </label>
                          </div>

                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
                            <div>
                              <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Select Apps for Today (Max 5)</label>
                              <p className="text-xs text-zinc-500 mb-4">Choose which apps should appear on the Today page. The first app will be the Premiere, the second will be App of the Day.</p>
                              
                              <div className="space-y-2">
                                {apps.filter(a => a.status === 'published').map(app => {
                                  const isSelected = todayApps.includes(app.id);
                                  return (
                                    <label key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
                                      <div className="flex items-center gap-4">
                                        <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-xl object-cover" />
                                        <div>
                                          <p className="font-bold text-zinc-900 dark:text-white">{app.name}</p>
                                          <p className="text-xs text-zinc-500">{app.category}</p>
                                        </div>
                                      </div>
                                      <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={async (e) => {
                                          let newTodayApps = [...todayApps];
                                          if (e.target.checked) {
                                            if (newTodayApps.length >= 5) {
                                              toast.error('Maximum 5 apps allowed on Today page');
                                              return;
                                            }
                                            newTodayApps.push(app.id);
                                          } else {
                                            newTodayApps = newTodayApps.filter(id => id !== app.id);
                                          }
                                          setTodayApps(newTodayApps);
                                          await setDoc(doc(db, 'settings', 'system'), { todayApps: newTodayApps }, { merge: true });
                                        }}
                                        className="w-5 h-5 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {adminTab === 'settings' && (
                        <div className="space-y-6">
                          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">System Settings</h3>
                          
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
                            <div>
                              <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">Store Name</label>
                              <input 
                                type="text" 
                                value={storeName} 
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter store name"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                              <div>
                                <h4 className="font-bold text-zinc-900 dark:text-white">Maintenance Mode</h4>
                                <p className="text-xs text-zinc-500">When enabled, users will see a maintenance screen.</p>
                              </div>
                              <button 
                                onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isMaintenanceMode ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isMaintenanceMode ? 'left-7' : 'left-1'}`} />
                              </button>
                            </div>

                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                              <button 
                                onClick={() => {
                                  toast.success('System settings saved successfully');
                                }}
                                className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                              >
                                Save System Settings
                              </button>
                            </div>
                          </div>

                          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
                            <h4 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                              <Trash2 className="w-5 h-5" />
                              Danger Zone
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-300 mb-4">Actions here are permanent and cannot be undone.</p>
                            <button 
                              onClick={resetDatabase}
                              disabled={isResettingDatabase}
                              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isResettingDatabase ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Resetting...
                                </>
                              ) : (
                                'Reset System Database'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'auth' && (
                <motion.div 
                  key="auth"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-black"
                >
                  <div className="p-4 flex items-center justify-between">
                    <button onClick={() => setView('main')} className="p-2 -ml-2 text-blue-500 font-medium">Cancel</button>
                    <h2 className="font-bold text-zinc-900 dark:text-white">
                      {authView === 'signin' ? 'Sign In' : authView === 'signup' ? 'Sign Up' : 'Forgot Password'}
                    </h2>
                    <div className="w-12" />
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pt-16 pb-4 space-y-8">
                    {authView === 'signin' && (
                      <>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute -top-8 left-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            Enter your email
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-blue-500 rotate-45" />
                          </motion.div>
                          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username or Email" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute -top-8 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            Your secure password
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-indigo-500 rotate-45" />
                          </motion.div>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                        <button 
                          disabled={isLoading || !email || !password}
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              await signInWithEmailAndPassword(auth, email, password);
                              toast.success('Signed in successfully!');
                              setView('main');
                            } catch (error: any) {
                              toast.error(error.message);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                        <button onClick={() => setAuthView('signup')} className="text-blue-500">Don't have an account? Sign Up</button>
                        <button onClick={() => setAuthView('forgot')} className="text-zinc-500">Forgot password?</button>
                        <button 
                          disabled={isLoading}
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              await signInWithPopup(auth, googleProvider);
                              toast.success('Signed in with Google!');
                              setView('main');
                            } catch (error: any) {
                              console.error('Sign in: Error occurred:', error);
                              if (error.code === 'auth/unauthorized-domain') {
                                toast.error('This domain is not authorized for authentication. Please check your Firebase console.');
                              } else if (error.code === 'auth/operation-not-allowed') {
                                toast.error('Google Sign-In is not enabled. Please enable it in the Firebase console.');
                              } else {
                                toast.error(error.message);
                              }
                            } finally {
                              setIsLoading(false);
                            }
                          }} 
                          className="w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                              Continue with Google
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {authView === 'signup' && (
                      <>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute -top-8 left-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            What's your name?
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-blue-500 rotate-45" />
                          </motion.div>
                          <div className="flex flex-col gap-3">
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                          </div>
                        </div>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="absolute -top-8 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            Your best email
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-indigo-500 rotate-45" />
                          </motion.div>
                          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute -top-8 left-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            Pick a cool username
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-purple-500 rotate-45" />
                          </motion.div>
                          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Create Username" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                          {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
                          {isUsernameAvailable && <p className="text-green-500 text-xs mt-1">Username available</p>}
                        </div>
                        <div className="relative">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute -top-8 left-4 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap z-10"
                          >
                            Make it strong!
                            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-pink-500 rotate-45" />
                          </motion.div>
                          <div className="space-y-3">
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                          Agree to terms of use
                        </label>
                        <button 
                          disabled={isLoading || !!usernameError || !isUsernameAvailable || !agreeTerms || password !== confirmPassword}
                          onClick={async () => {
                            setIsLoading(true);
                            console.log('Sign up: Starting process');
                            try {
                              setAuthError(null);
                              console.log('Sign up: Creating user with email:', email);
                              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                              console.log('Sign up: User created successfully:', userCredential.user.uid);
                              
                              console.log('Sign up: Saving user data to Firestore');
                              await setDoc(doc(db, 'users', userCredential.user.uid), {
                                firstName,
                                lastName,
                                username,
                                email,
                                createdAt: new Date().toISOString()
                              });
                              console.log('Sign up: User data saved successfully');
                              
                              toast.success('Account created successfully!');
                              setView('main');
                            } catch (error: any) {
                              console.error('Sign up: Error occurred:', error);
                              if (error.code === 'auth/email-already-in-use') {
                                setAuthError('Email is already in use. Please sign in instead.');
                                toast.error('Email already in use');
                              } else if (error.code === 'auth/unauthorized-domain') {
                                setAuthError('This domain is not authorized for authentication. Please check your Firebase console.');
                                toast.error('Unauthorized domain');
                              } else {
                                setAuthError(error.message);
                                toast.error(error.message);
                              }
                            } finally {
                              console.log('Sign up: Process finished');
                              setIsLoading(false);
                            }
                          }}
                          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                        </button>
                        <button 
                          disabled={isLoading}
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              await signInWithPopup(auth, googleProvider);
                              toast.success('Signed in with Google!');
                              setView('main');
                            } catch (error: any) {
                              console.error('Sign in: Error occurred:', error);
                              if (error.code === 'auth/unauthorized-domain') {
                                toast.error('This domain is not authorized for authentication. Please check your Firebase console.');
                              } else if (error.code === 'auth/operation-not-allowed') {
                                toast.error('Google Sign-In is not enabled. Please enable it in the Firebase console.');
                              } else {
                                toast.error(error.message);
                              }
                            } finally {
                              setIsLoading(false);
                            }
                          }} 
                          className="w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
                              Continue with Google
                            </>
                          )}
                        </button>
                        <button onClick={() => setAuthView('signin')} className="text-blue-500">Already have an account? Sign In</button>
                      </>
                    )}
                    {authView === 'forgot' && (
                      <>
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                        <button 
                          disabled={isLoading || !email}
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              await sendPasswordResetEmail(auth, email);
                              toast.success('Password reset link sent to your email!');
                              setAuthView('signin');
                            } catch (error: any) {
                              toast.error(error.message);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send link to email'}
                        </button>
                        <button onClick={() => setAuthView('signin')} className="text-blue-500">Remembered password? Sign In</button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {view === 'edit-profile' && (
                <motion.div 
                  key="edit-profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader((TRANSLATIONS[language] || TRANSLATIONS.English).editProfile)}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-8 no-scrollbar" {...getScrollProps('edit-profile')}>
                    {/* Profile Pic Edit */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl">
                          {editPic || userProfile?.photoURL || firebaseUser?.photoURL ? (
                            <img src={editPic || userProfile?.photoURL || firebaseUser?.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-4xl font-bold text-zinc-400">
                              {(editFirstName?.[0] || firebaseUser?.displayName?.[0] || firebaseUser?.email?.[0] || 'U').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-3 rounded-full bg-blue-500 text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>

                    {/* Image Cropper Modal */}
                    <AnimatePresence>
                      {showCropper && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[60] bg-black flex flex-col"
                        >
                          <div className="flex items-center justify-between p-6 bg-black/50 backdrop-blur-md z-10">
                            <button onClick={() => setShowCropper(false)} className="text-white font-medium">Cancel</button>
                            <h3 className="text-white font-bold">Crop Photo</h3>
                            <button onClick={saveCroppedImage} className="text-blue-400 font-bold">Choose</button>
                          </div>
                          <div className="relative flex-1">
                            <Cropper
                              image={image!}
                              crop={crop}
                              zoom={zoom}
                              aspect={1}
                              onCropChange={setCrop}
                              onCropComplete={onCropComplete}
                              onZoomChange={setZoom}
                              cropShape="round"
                              showGrid={false}
                            />
                          </div>
                          <div className="p-8 bg-black/50 backdrop-blur-md z-10">
                            <input
                              type="range"
                              value={zoom}
                              min={1}
                              max={3}
                              step={0.1}
                              aria-labelledby="Zoom"
                              onChange={(e) => setZoom(Number(e.target.value))}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form Fields */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">First Name</label>
                          <input 
                            type="text" 
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value.replace(/\s/g, ''))}
                            className="w-full h-14 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Last Name</label>
                          <input 
                            type="text" 
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value.replace(/\s/g, ''))}
                            className="w-full h-14 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative opacity-60">
                          <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                          <input 
                            type="email" 
                            value={firebaseUser?.email || ''}
                            disabled
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed font-medium"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 px-1 italic">Email cannot be changed for security reasons.</p>
                      </div>
                    </div>

                    <button 
                      disabled={isSavingProfile}
                      onClick={async () => {
                        if (!firebaseUser) return;
                        setIsSavingProfile(true);
                        try {
                          const updatedProfile = {
                            ...userProfile!,
                            firstName: editFirstName,
                            lastName: editLastName,
                            photoURL: editPic
                          };
                          await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile);
                          setUserProfile(updatedProfile);
                          toast.success('Profile updated successfully');
                          setView('main');
                        } catch (error: any) {
                          toast.error('Error updating profile');
                        } finally {
                          setIsSavingProfile(false);
                        }
                      }}
                      className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isSavingProfile ? 'Saving...' : (TRANSLATIONS[language] || TRANSLATIONS.English).done}
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'publisher-profile' && (
                <motion.div 
                  key="publisher-profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-black"
                >
                  {renderHeader('Publisher Profile')}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-8 no-scrollbar">
                    {isLoadingUsers ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-zinc-500 font-medium tracking-wide">Loading profile...</p>
                      </div>
                    ) : allUsers.find(u => u.id === selectedPublisherId) ? (
                      <>
                        {/* Publisher Info */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center space-y-4">
                          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl">
                            {allUsers.find(u => u.id === selectedPublisherId)?.photoURL ? (
                              <img src={allUsers.find(u => u.id === selectedPublisherId)?.photoURL} alt="Publisher" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                              {allUsers.find(u => u.id === selectedPublisherId)?.firstName} {allUsers.find(u => u.id === selectedPublisherId)?.lastName}
                            </h3>
                            <p className="text-zinc-500 font-medium">@{allUsers.find(u => u.id === selectedPublisherId)?.username || 'publisher'}</p>
                          </div>
                        </div>

                        {/* Publisher's Apps */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">Apps & Games</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {apps.filter(app => app.publisherId === selectedPublisherId).map(app => (
                              <div 
                                key={app.id} 
                                onClick={() => {
                                  setSelectedApp(app);
                                  setIsPreviewOpen(true);
                                }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-zinc-900 dark:text-white truncate">{app.name}</h4>
                                  <p className="text-xs text-zinc-500">{app.category}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{app.rating}</span>
                                  </div>
                                </div>
                                <button className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-blue-500 font-bold text-xs">View</button>
                              </div>
                            ))}
                            {apps.filter(app => app.publisherId === selectedPublisherId).length === 0 && (
                              <div className="text-center py-12 text-zinc-500">No apps published by this user yet.</div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20 space-y-4">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                          <User className="w-10 h-10 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500 font-medium">Publisher profile not found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {view === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader((TRANSLATIONS[language] || TRANSLATIONS.English).settings)}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-8 no-scrollbar" {...getScrollProps('settings')}>
                    {/* Personal Information */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">{(TRANSLATIONS[language] || TRANSLATIONS.English).personalInfo}</h3>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        {firebaseUser && (
                          <button 
                            onClick={() => setView('edit-profile')}
                            className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <User className="w-5 h-5" />
                            </div>
                            <span className="flex-1 text-left font-medium text-zinc-900 dark:text-white">{(TRANSLATIONS[language] || TRANSLATIONS.English).editProfile}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                          </button>
                        )}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                              <Bell className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-white">{(TRANSLATIONS[language] || TRANSLATIONS.English).notifications}</span>
                          </div>
                          <Switch checked={isNotificationsEnabled} onChange={setIsNotificationsEnabled} />
                        </div>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">{(TRANSLATIONS[language] || TRANSLATIONS.English).appearance}</h3>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-amber-400/10 text-amber-400' : 'bg-indigo-600/10 text-indigo-600'}`}>
                              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-white">{(TRANSLATIONS[language] || TRANSLATIONS.English).darkMode}</span>
                          </div>
                          <Switch checked={isDarkMode} onChange={setIsDarkMode} />
                        </div>
                      </div>
                    </div>

                    {/* Security & Privacy */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">{(TRANSLATIONS[language] || TRANSLATIONS.English).security}</h3>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setView('faceid-passcode')}
                          className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Lock className="w-5 h-5" />
                          </div>
                          <span className="flex-1 text-left font-medium text-zinc-900 dark:text-white">{(TRANSLATIONS[language] || TRANSLATIONS.English).faceId}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </button>
                      </div>
                    </div>

                    {/* Other */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">{(TRANSLATIONS[language] || TRANSLATIONS.English).other}</h3>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setView('language')}
                          className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-400/10 flex items-center justify-center text-zinc-400">
                            <Globe className="w-5 h-5" />
                          </div>
                          <span className="flex-1 text-left font-medium text-zinc-900 dark:text-white">{(TRANSLATIONS[language] || TRANSLATIONS.English).language}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-400">{language}</span>
                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'faceid-passcode' && (
                <motion.div 
                  key="faceid-passcode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader((TRANSLATIONS[language] || TRANSLATIONS.English).faceId)}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-8" {...getScrollProps('faceid-passcode')}>
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => {
                            setPasscodeStep('enter');
                            setTempPasscode('');
                            setView('set-passcode');
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                        >
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {passcode ? 'Change Passcode' : 'Turn Passcode On'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </button>
                        {passcode && (
                          <button 
                            onClick={() => setPasscode(null)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-red-500 font-medium"
                          >
                            Turn Passcode Off
                          </button>
                        )}
                      </div>
                      <p className="px-4 text-xs text-zinc-500">A passcode protects your account and is required for purchases.</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-4">Biometrics</h3>
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-white">Face ID</span>
                          </div>
                          <Switch checked={isFaceIdEnabled} onChange={setIsFaceIdEnabled} />
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <Fingerprint className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-white">Touch ID</span>
                          </div>
                          <Switch checked={isTouchIdEnabled} onChange={setIsTouchIdEnabled} />
                        </div>
                      </div>
                      <p className="px-4 text-xs text-zinc-500">Use biometrics for faster authentication when purchasing apps.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'set-passcode' && (
                <motion.div 
                  key="set-passcode"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-black"
                >
                  <div className="p-4 flex items-center justify-between">
                    <button onClick={() => { window.navigator.vibrate?.(50); setView('faceid-passcode'); }} className="p-2 -ml-2 text-blue-500 font-medium">Cancel</button>
                    <h2 className="font-bold text-zinc-900 dark:text-white">
                      {passcodeStep === 'enter' ? 'Set Passcode' : 'Confirm Passcode'}
                    </h2>
                    <button onClick={() => { window.navigator.vibrate?.(50); setTempPasscode(''); setPasscodeStep('enter'); }} className="p-2 -mr-2 text-red-500 font-medium">Reset</button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center space-y-12 pb-12 overflow-y-auto">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {passcodeStep === 'enter' ? 'Enter a new passcode' : 'Re-enter your passcode'}
                      </h3>
                    </div>

                    <div className="flex gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className={`w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700 transition-all duration-200 ${tempPasscode.length > i ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white' : ''}`}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            window.navigator.vibrate?.(50);
                            if (num === 'delete') {
                              setTempPasscode(prev => prev.slice(0, -1));
                            } else if (typeof num === 'number' && tempPasscode.length < 4) {
                              const newPass = tempPasscode + num;
                              setTempPasscode(newPass);
                              
                              if (newPass.length === 4) {
                                setTimeout(() => {
                                  if (passcodeStep === 'enter') {
                                    setFirstPasscode(newPass);
                                    setPasscodeStep('confirm');
                                    setTempPasscode('');
                                  } else {
                                    if (newPass === firstPasscode) {
                                      setPasscode(newPass);
                                      setView('faceid-passcode');
                                    } else {
                                      alert('Passcodes do not match. Try again.');
                                      setPasscodeStep('enter');
                                      setTempPasscode('');
                                    }
                                  }
                                }, 300);
                              }
                            }
                          }}
                          className={`aspect-square rounded-full flex items-center justify-center text-2xl font-medium transition-colors ${num === '' ? 'pointer-events-none' : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95'}`}
                        >
                          {num === 'delete' ? <Delete className="w-6 h-6" /> : num}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'language' && (
                <motion.div 
                  key="language"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader((TRANSLATIONS[language] || TRANSLATIONS.English).language)}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 no-scrollbar" {...getScrollProps('language')}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                      {[
                        { name: 'English', native: 'English' },
                        { name: 'Spanish', native: 'Español' },
                        { name: 'French', native: 'Français' },
                        { name: 'German', native: 'Deutsch' },
                        { name: 'Japanese', native: '日本語' },
                      ].map((lang) => (
                        <button 
                          key={lang.name}
                          onClick={() => setLanguage(lang.name)}
                          className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-zinc-900 dark:text-white">{lang.native}</span>
                            <span className="text-xs text-zinc-500">{lang.name}</span>
                          </div>
                          {language === lang.name && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {view === 'purchased' && (
                <motion.div 
                  key="purchased"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader('Purchased')}
                  <div className="flex-1 overflow-y-auto px-4 pb-12" {...getScrollProps('purchased')}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
                      {apps.filter(app => purchasedAppIds.has(app.id)).length > 0 ? (
                        apps.filter(app => purchasedAppIds.has(app.id)).map(app => (
                          <div key={app.id} className="flex items-center gap-4 p-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                              {app.iconUrl ? (
                                <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="text-2xl">📱</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-zinc-900 dark:text-white">{app.name}</p>
                              <p className="text-xs text-zinc-500">Purchased on Mar 15, 2026</p>
                            </div>
                            <button className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-blue-500">
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center space-y-4">
                          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                            <Download className="w-8 h-8 text-zinc-300" />
                          </div>
                          <p className="text-zinc-500">No purchased apps yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'subscriptions' && (
                <motion.div 
                  key="subscriptions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader('Subscriptions')}
                  <div className="flex-1 overflow-y-auto px-4 pb-12" {...getScrollProps('subscriptions')}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm text-center space-y-4">
                      <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto">
                        <Star className="w-10 h-10 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Vision Cloud+</h3>
                        <p className="text-sm text-zinc-500 mt-1">Active Subscription</p>
                      </div>
                      <div className="py-4 border-y border-zinc-100 dark:border-zinc-800">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">$9.99<span className="text-sm font-normal text-zinc-500">/month</span></p>
                        <p className="text-xs text-zinc-400 mt-1">Next billing date: Apr 15, 2026</p>
                      </div>
                      <button className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold">
                        Manage Subscription
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'privacy' && (
                <motion.div 
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader('Privacy')}
                  <div className="flex-1 overflow-y-auto px-4 pb-12" {...getScrollProps('privacy')}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Privacy Policy</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          At Vision Cloud, we take your privacy seriously. This policy describes how we collect, use, and handle your information when you use our services.
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-bold text-zinc-900 dark:text-white">1. Data Collection</h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">We collect information you provide directly to us, such as when you create an account or make a purchase.</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-zinc-900 dark:text-white">2. Data Usage</h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">We use the information we collect to provide, maintain, and improve our services.</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-zinc-900 dark:text-white">3. Security</h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">We use administrative, technical, and physical security measures to help protect your personal information.</p>
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold">
                        Learn More
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'support' && (
                <motion.div 
                  key="support"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderHeader('Support')}
                  <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-6" {...getScrollProps('support')}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                        <HelpCircle className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">How can we help?</h3>
                      <p className="text-sm text-zinc-500">Our support team is available 24/7 to assist you with any questions or issues.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                      {[
                        { label: 'Help Center', sub: 'Articles and guides' },
                        { label: 'Contact Us', sub: 'Chat with an agent' },
                        { label: 'Report a Problem', sub: 'Let us know what went wrong' },
                      ].map((item, i) => (
                        <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                          <div className="text-left">
                            <p className="font-medium text-zinc-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-zinc-500">{item.sub}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Navigation: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void; isTodayEnabled: boolean }> = ({ activeTab, setActiveTab, isTodayEnabled }) => {
  const tabs = [
    ...(isTodayEnabled ? [{ id: 'Today' as const, icon: Star, label: 'Today' }] : []),
    { id: 'Apps' as const, icon: LayoutGrid, label: 'Apps' },
    { id: 'Games' as const, icon: Gamepad2, label: 'Games' },
    { id: 'Search' as const, icon: Search, label: 'Search' },
  ];

  return (
    <>
      {/* Desktop Horizontal Navigation - Google Search Style */}
      <nav className="hidden md:block sticky top-14 z-40 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 relative group transition-colors duration-300 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="desktopNavActive"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Material 3 Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-4 pb-4 pt-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative px-5 py-1">
                  {isActive && (
                    <motion.div 
                      layoutId="navPill"
                      className="absolute inset-0 bg-blue-100 dark:bg-blue-500/20 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-6 h-6 relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'
                  }`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default function App() {
  const [isTodayEnabled, setIsTodayEnabled] = useState(true);
  const [todayApps, setTodayApps] = useState<string[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Today');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(false);
  const [isTouchIdEnabled, setIsTouchIdEnabled] = useState(false);
  const [purchasedAppIds, setPurchasedAppIds] = useState<Set<string>>(new Set());
  const [downloadingApps, setDownloadingApps] = useState<Record<string, number>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authenticatingApp, setAuthenticatingApp] = useState<AppItem | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [view, setView] = useState<'main' | 'settings' | 'purchased' | 'subscriptions' | 'privacy' | 'support' | 'edit-profile' | 'language' | 'faceid-passcode' | 'set-passcode' | 'auth' | 'admin' | 'publisher-profile'>('main');
  const [selectedPublisherId, setSelectedPublisherId] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [storeName, setStoreName] = useState('App Store');

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string;
      email?: string | null;
      emailVerified?: boolean;
      isAnonymous?: boolean;
      tenantId?: string | null;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    if (errInfo.error.includes('the client is offline')) {
      setFirestoreError('Please check your Firebase configuration. The client is offline.');
      // Don't throw for offline errors to avoid crashing the app
      return;
    }
    throw new Error(JSON.stringify(errInfo));
  }

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
          setFirestoreError('Please check your Firebase configuration. The client is offline.');
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsMaintenanceMode(data.maintenanceMode || false);
        setStoreName(data.storeName || 'App Store');
        setIsTodayEnabled(data.isTodayEnabled !== false); // Default to true
        setTodayApps(data.todayApps || []);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/system');
    });

    return () => unsubscribeSettings();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      // Set admin status based on email immediately for hardcoded admins
      const isHardcodedAdmin = firebaseUser.email === 'jessesrek@gmail.com';
      setIsAdmin(isHardcodedAdmin);

      getDoc(doc(db, 'users', firebaseUser.uid)).then(doc => {
        if (doc.exists()) {
          setIsAdmin(doc.data().role === 'admin' || isHardcodedAdmin);
        }
      }).catch(error => {
        // If it's a "client is offline" error, we still keep the hardcoded admin status
        if (!(error instanceof Error && error.message.includes('the client is offline'))) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      });
    } else {
      setIsAdmin(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as UserProfile);
            } else {
              // If profile doesn't exist, create a basic one
              const newProfile: UserProfile = {
                email: user.email || '',
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                username: '',
                photoURL: user.photoURL || ''
              };
              setUserProfile(newProfile);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          });
        } catch (error) {
          console.error('Error setting up user profile listener:', error);
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        setUserProfile(null);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  useEffect(() => {
    setIsLoadingApps(true);
    const unsubscribe = onSnapshot(collection(db, 'apps'), (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppItem));
      setApps(appsData);
      setIsLoadingApps(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'apps');
      setIsLoadingApps(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isTodayEnabled && activeTab === 'Today') {
      setActiveTab('Apps');
    }
  }, [isTodayEnabled, activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredApps = apps.filter(app => {
    if (app.status && app.status !== 'published') return false;
    if (selectedCategory !== 'All' && app.category !== selectedCategory) return false;
    if (activeTab === 'Games') return app.isGame;
    if (activeTab === 'Apps') return !app.isGame;
    return true;
  }).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));

  const searchResults = apps.filter(app => {
    if (app.status && app.status !== 'published') return false;
    return app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           app.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const startDownload = async (appId: string, forceUpdate: boolean = false) => {
    const newPurchased = new Set(purchasedAppIds);
    if ((!newPurchased.has(appId) || forceUpdate) && downloadingApps[appId] === undefined) {
      setDownloadingApps(prev => ({ ...prev, [appId]: 0 }));
      
      // Simulate download progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          clearInterval(interval);
          setDownloadingApps(prev => {
            const next = { ...prev };
            delete next[appId];
            return next;
          });
          if (!forceUpdate) {
            setPurchasedAppIds(prev => new Set(prev).add(appId));
            updateDoc(doc(db, 'apps', appId), { downloads: increment(1) }).catch(console.error);
          } else {
            // Remove from pending updates if we had a real state for it
            // For now, we just simulate the update finishing
            toast.success('App updated successfully');
          }
        } else {
          setDownloadingApps(prev => ({ ...prev, [appId]: Math.min(progress, 99) }));
        }
      }, 300);
    }
  };

  const handleGetApp = async (app: AppItem) => {
    if (passcode || isFaceIdEnabled || isTouchIdEnabled) {
      setAuthenticatingApp(app);
      setIsAuthModalOpen(true);
    } else {
      // No security set, purchase immediately
      startDownload(app.id);
    }
  };

  const handleAuthSuccess = async () => {
    if (authenticatingApp) {
      startDownload(authenticatingApp.id);
    }
    setIsAuthModalOpen(false);
    setAuthenticatingApp(null);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {firestoreError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-bold">{firestoreError}</span>
          <button onClick={() => setFirestoreError(null)} className="ml-4 hover:opacity-70 transition-opacity">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      <Toaster position="top-center" richColors />
      {isMaintenanceMode && !isAdmin ? (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8">
            <Settings className="w-12 h-12 text-blue-500 animate-spin-slow" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">{storeName} is under maintenance</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
            We're currently performing some scheduled maintenance to improve your experience. Please check back soon!
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold"
            >
              Admin Login
            </button>
          </div>
        </div>
      ) : (
        <div className={`min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-500 ${isSearchPageOpen ? 'overflow-hidden' : ''}`}>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isTodayEnabled={isTodayEnabled} />
        
        <div className="flex flex-col min-h-screen">
          <AnimatePresence>
            {!isSearchPageOpen && (
              <motion.header 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                exit={{ y: -100 }}
                className="sticky top-0 z-40 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-14 sm:h-14">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl tracking-tight">Vision Cloud</span>
                      <Cloud className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                    </div>
                    <div className="hidden md:block">
                      <h2 className="text-lg font-bold text-zinc-500 dark:text-zinc-400">{(TRANSLATIONS[language] || TRANSLATIONS.English).welcome}, <span className="text-zinc-900 dark:text-white">{userProfile?.firstName || firebaseUser?.displayName?.split(' ')[0] || 'User'}</span></h2>
                    </div>

                    <div className="flex items-center gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 flex items-center justify-center relative overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={isDarkMode ? 'dark' : 'light'}
                            initial={{ y: 20, opacity: 0, rotate: -45 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: -20, opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            {isDarkMode ? (
                              <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                            ) : (
                              <Moon className="w-5 h-5 text-indigo-600 fill-indigo-600/20" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsProfileOpen(true)}
                        className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden text-zinc-600 dark:text-zinc-400 font-bold"
                      >
                        {userProfile?.photoURL || firebaseUser?.photoURL ? (
                          <img src={userProfile?.photoURL || firebaseUser?.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : firebaseUser ? (
                          (userProfile?.firstName?.[0] || firebaseUser?.displayName?.[0] || firebaseUser?.email?.[0] || 'U').toUpperCase()
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'Search' ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-end justify-between">
                <h1 className="text-4xl font-bold">Search</h1>
              </div>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSearchPageOpen(true)}
                className="w-full h-14 px-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-black/5 dark:shadow-none border border-black/5 dark:border-white/10 flex items-center gap-3 text-zinc-400 transition-all"
              >
                <Search className="w-5 h-5" />
                <span className="text-lg font-medium">Games, Apps, Stories and More</span>
              </motion.button>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Discover</h2>
                <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory no-scrollbar">
                  {isLoadingApps ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="min-w-[85vw] sm:min-w-[320px] snap-start">
                        <SkeletonAppCard />
                      </div>
                    ))
                  ) : (
                    apps.slice(0, 6).map(app => (
                      <div key={app.id} className="min-w-[85vw] sm:min-w-[320px] snap-start">
                        <AppCard 
                          app={app} 
                          isPurchased={purchasedAppIds.has(app.id)}
                          downloadProgress={downloadingApps[app.id]}
                          onGet={handleGetApp}
                          onPreview={(app) => {
                            setSelectedApp(app);
                            setIsPreviewOpen(true);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'Today' ? (
            <motion.div 
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <h1 className="text-4xl font-bold">Today</h1>
                </div>
              </div>

              <div className="space-y-8">
                {isLoadingApps ? (
                  <>
                    <SkeletonFeaturedCard />
                    <SkeletonFeaturedCard />
                  </>
                ) : (
                  <>
                    {(todayApps.length > 0 ? todayApps.map(id => apps.find(a => a.id === id)).filter(Boolean) : apps.slice(0, 5)).map((app, index) => app && (
                      <div key={app.id} className="space-y-2">
                        <p className={`text-sm font-bold uppercase tracking-widest ${index === 0 ? 'text-blue-500' : index === 1 ? 'text-emerald-500' : 'text-purple-500'}`}>
                          {index === 0 ? 'Premiere' : index === 1 ? 'App of the Day' : 'Featured'}
                        </p>
                        <FeaturedCard 
                          app={app} 
                          isPurchased={purchasedAppIds.has(app.id)}
                          downloadProgress={downloadingApps[app.id]}
                          onGet={handleGetApp}
                          onPreview={(app) => {
                            setSelectedApp(app);
                            setIsPreviewOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between">
                <h1 className="text-4xl font-bold">{activeTab}</h1>
              </div>

              {/* Category Filters */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 no-scrollbar">
                {['All', 'Action', 'Productivity', 'RPG', 'Photo & Video', 'Health & Fitness', 'Simulation', 'Social', 'Education', 'Entertainment'].map((category) => (
                  <button 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === category ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Featured Section */}
              <div className="space-y-4">
                {isLoadingApps ? (
                  <SkeletonFeaturedCard />
                ) : filteredApps[0] && (
                  <FeaturedCard 
                    app={filteredApps[0]} 
                    isPurchased={purchasedAppIds.has(filteredApps[0].id)}
                    downloadProgress={downloadingApps[filteredApps[0].id]}
                    onGet={handleGetApp}
                    onPreview={(app) => {
                      setSelectedApp(app);
                      setIsPreviewOpen(true);
                    }}
                  />
                )}
              </div>

              {/* List Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Popular {activeTab}</h2>
                <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory no-scrollbar">
                  {isLoadingApps ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="min-w-[85vw] sm:min-w-[320px] snap-start">
                        <SkeletonAppCard />
                      </div>
                    ))
                  ) : (
                    filteredApps.slice(1).map(app => (
                      <div key={app.id} className="min-w-[85vw] sm:min-w-[320px] snap-start">
                        <AppCard 
                          app={app} 
                          isPurchased={purchasedAppIds.has(app.id)}
                          downloadProgress={downloadingApps[app.id]}
                          onGet={handleGetApp}
                          onPreview={(app) => {
                            setSelectedApp(app);
                            setIsPreviewOpen(true);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Profile Sheet */}
      <PreviewPage 
        app={selectedApp}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        isPurchased={selectedApp ? purchasedAppIds.has(selectedApp.id) : false}
        downloadProgress={selectedApp ? downloadingApps[selectedApp.id] : undefined}
        onGet={handleGetApp}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        isAdmin={isAdmin}
        setActiveTab={setActiveTab}
        setIsProfileOpen={setIsProfileOpen}
        setView={setView}
        onOpenPublisherProfile={(id) => {
          setSelectedPublisherId(id);
          setIsPreviewOpen(false);
          setView('publisher-profile');
          setIsProfileOpen(true);
        }}
      />

      <ProfileSheet 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        language={language}
        setLanguage={setLanguage}
        passcode={passcode}
        setPasscode={setPasscode}
        isFaceIdEnabled={isFaceIdEnabled}
        setIsFaceIdEnabled={setIsFaceIdEnabled}
        isTouchIdEnabled={isTouchIdEnabled}
        setIsTouchIdEnabled={setIsTouchIdEnabled}
        purchasedAppIds={purchasedAppIds}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        apps={apps}
        isAdmin={isAdmin}
        isMaintenanceMode={isMaintenanceMode}
        storeName={storeName}
        setStoreName={setStoreName}
        setIsMaintenanceMode={setIsMaintenanceMode}
        isTodayEnabled={isTodayEnabled}
        setIsTodayEnabled={setIsTodayEnabled}
        todayApps={todayApps}
        setTodayApps={setTodayApps}
        view={view}
        setView={setView}
        initialView={isMaintenanceMode && !firebaseUser ? 'auth' : undefined}
        selectedPublisherId={selectedPublisherId}
        setSelectedPublisherId={setSelectedPublisherId}
        setSelectedApp={setSelectedApp}
        setIsPreviewOpen={setIsPreviewOpen}
        setApps={setApps}
      />

      {/* Full Screen Search Page */}
      <AnimatePresence>
        {isSearchPageOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-zinc-50 dark:bg-black flex flex-col"
          >
            {/* Search Navigation */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto flex items-center gap-4">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSearchPageOpen(false)}
                  className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Games, Apps, Stories and More"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-7xl mx-auto space-y-8">
                {searchQuery ? (
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Results for "{searchQuery}"</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.length > 0 ? (
                        searchResults.map(app => (
                          <AppCard 
                            key={app.id} 
                            app={app} 
                            isPurchased={purchasedAppIds.has(app.id)}
                            downloadProgress={downloadingApps[app.id]}
                            onGet={handleGetApp}
                            onPreview={(app) => {
                              setSelectedApp(app);
                              setIsPreviewOpen(true);
                              setIsSearchPageOpen(false);
                            }}
                          />
                        ))
                      ) : (
                        <div className="col-span-full py-12 text-center text-zinc-500">
                          No results found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Trending Searches</h2>
                      <div className="flex flex-wrap gap-2">
                        {['Action Games', 'Productivity', 'Photo Editor', 'Social Media', 'Fitness'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="px-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Suggested for You</h2>
                      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory no-scrollbar">
                        {apps.slice(0, 3).map(app => (
                          <div key={app.id} className="min-w-[85vw] sm:min-w-[320px] snap-start">
                            <AppCard 
                              app={app} 
                              isPurchased={purchasedAppIds.has(app.id)}
                              downloadProgress={downloadingApps[app.id]}
                              onGet={handleGetApp}
                              onPreview={(app) => {
                                setSelectedApp(app);
                                setIsPreviewOpen(true);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
      )}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthenticatingApp(null);
        }}
        onSuccess={handleAuthSuccess}
        passcode={passcode}
        isFaceIdEnabled={isFaceIdEnabled}
        isTouchIdEnabled={isTouchIdEnabled}
        app={authenticatingApp}
      />
    </div>
  );
}
