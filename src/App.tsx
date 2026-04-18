import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  format, 
  addDays, 
  startOfToday, 
  isSameDay, 
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMinutes,
  getDay
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Phone, 
  User, 
  Users,
  UserPlus,
  Scissors, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  Info as InfoIcon,
  Settings,
  Trash2,
  Shield,
  FileText,
  Smartphone,
  Banknote,
  CreditCard,
  Bell,
  BellRing,
  RefreshCw,
  Contact2,
  Mail,
  Ban,
  UserX,
  Share2,
  Navigation,
  Search,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Capacitor
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Contacts } from '@capacitor-community/contacts';

// UI Components
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog, 
  DialogClose,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from './components/Logo';

// Utils & Config
import { BUSINESS_CONFIG, isDateAvailable, getAvailableSlots, getPortugueseHolidays } from './lib/booking-utils';
import { cn } from '@/lib/utils';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { SmartAssistant } from './components/SmartAssistant';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Firebase
import { db, auth, googleProvider } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  addDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
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
  throw new Error(JSON.stringify(errInfo));
}

// Constants
const PUBLISHED_APP_URL = "https://ais-pre-6iflew6h2ylcdia46y4ita-649090712898.europe-west2.run.app";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'privacy' | 'terms' | 'profile' | 'my-bookings'>('main');
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clientsFromDb, setClientsFromDb] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isImportingGoogle, setIsImportingGoogle] = useState(false);
  const isInitialLoad = useRef(true);
  const [blockedContacts, setBlockedContacts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'frequent' | 'inactive'>('all');
  const [agendaSearchTerm, setAgendaSearchTerm] = useState('');
  const [clientToDelete, setClientToDelete] = useState<{ phone: string; name: string } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Service Worker and Notification Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.error('SW Registration failed', err));
    }

    // Capacitor Initialization
    const initCapacitor = async () => {
      try {
        await SplashScreen.hide();
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } catch (e) {
        // Not running in Capacitor
      }
    };
    initCapacitor();
  }, []);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Not running in Capacitor
    }
  };

  const handleShare = async () => {
    if (!selectedDate || !selectedTime || !selectedService) return;
    const dateStr = format(selectedDate, "d 'de' MMMM", { locale: pt });
    try {
      triggerHaptic(ImpactStyle.Medium);
      await Share.share({
        title: 'Minha Marcação - Chico Cabeleireiros',
        text: `Tenho uma marcação para ${selectedService.name} no dia ${dateStr} às ${selectedTime} com Sérgio Ramos no Chico Cabeleireiros.`,
        url: PUBLISHED_APP_URL,
        dialogTitle: 'Partilhar Marcação',
      });
    } catch (e) {
      // Not supported or cancelled
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error("O seu navegador não suporta notificações.", {
        description: "Se estiver no iPhone (iOS), precisa de adicionar esta App ao seu 'Ecrã de Início' primeiro (Partilhar > Adicionar ao Ecrã de Início)."
      });
      return;
    }

    try {
      triggerHaptic(ImpactStyle.Medium);

      // If already granted, just send a test notification
      if (Notification.permission === 'granted') {
        setNotificationPermission('granted');
        toast.success("As notificações já estão ativadas!", {
          description: "A enviar notificação de teste..."
        });
        sendNotification(
          "Chico Cabeleireiros", 
          "Teste de Notificação: O sistema está pronto! ✅"
        );
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success("Notificações ativadas!", {
          description: "Irá receber lembretes e confirmações aqui."
        });
        
        setTimeout(() => {
          sendNotification(
            "Chico Cabeleireiros", 
            "As notificações estão agora ativadas e a funcionar corretamente! ✅"
          );
        }, 1000);
      } else if (permission === 'denied') {
        toast.error("Notificações bloqueadas.", {
          description: "Por favor, ative as notificações nas definições do seu navegador/telemóvel."
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Erro ao ativar notificações.");
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationPermission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon: 'https://picsum.photos/seed/cabeleireiros/192/192',
            badge: 'https://picsum.photos/seed/cabeleireiros/192/192',
            tag: 'chico-cabeleireiros-notif',
            vibrate: [100, 50, 100],
            data: {
              url: PUBLISHED_APP_URL
            }
          } as any);
        });
      } else {
        new Notification(title, { 
          body,
          icon: 'https://picsum.photos/seed/cabeleireiros/192/192'
        });
      }
    }
  };
  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes, 0);
      
      const endDate = addMinutes(startDate, selectedService.duration);

      const formatDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return [
          date.getUTCFullYear(),
          pad(date.getUTCMonth() + 1),
          pad(date.getUTCDate()),
          'T',
          pad(date.getUTCHours()),
          pad(date.getUTCMinutes()),
          pad(date.getUTCSeconds()),
          'Z'
        ].join('');
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Chico Cabeleireiros//NONSGML v1.0//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@chicocabeleireiros.com`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${selectedService.name} - Chico Cabeleireiros`,
        `DESCRIPTION:Marcação de ${selectedService.name} com Sérgio Ramos na Chico Cabeleireiros.`,
        `LOCATION:${BUSINESS_CONFIG.address}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT24H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete de Marcação - Chico Cabeleireiros',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marcacao-chico-barbearia.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Agendamento preparado para o seu calendário!");
    } catch (error) {
      console.error("Error generating ICS:", error);
      toast.error("Não foi possível gerar o ficheiro de calendário.");
    }
  };

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const isAdmin = user?.email === "ramosdrums@gmail.com";

  // Admin Service Management State
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '40' });
  const [isAddingService, setIsAddingService] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  // Admin Profile & Vacation State
  const [vacations, setVacations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const userAppointments = useMemo(() => {
    if (!user) return [];
    return appointments
      .filter(a => a.clientUid === user.uid || (userProfile?.phone && a.clientPhone === userProfile.phone))
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }, [user, appointments, userProfile]);
  const [newVacation, setNewVacation] = useState({ startDate: '', endDate: '', description: '' });
  const [isAddingVacation, setIsAddingVacation] = useState(false);

  // Management State (for rescheduling/cancelling via link)
  const [managedAppointment, setManagedAppointment] = useState<any>(null);

  // Test connection to Firestore
  useEffect(() => {
    if (!db) return;
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'profile', 'main_profile'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          toast.error("Erro de ligação ao servidor. Verifique a sua internet.");
        }
      }
    };
    testConnection();
  }, [db]);

  // Auth Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email === "ramosdrums@gmail.com") {
        setIsAdminMode(true);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Google OAuth Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
        toast.success("Conectado à Google People API!");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle URL parameters for appointment management
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, isAdminMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appointmentId = params.get('appointmentId');
    if (appointmentId && appointments.length > 0) {
      const found = appointments.find(a => a.id === appointmentId);
      if (found) {
        setManagedAppointment(found);
        // Scroll to management section if needed
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [appointments]);

  // Firestore Listeners
  useEffect(() => {
    if (!db) return;
    
    // Appointments Listener
    // SECURITY NOTE: Currently allowing full read access to appointments to calculate availability.
    // In a production environment, sensitive client data should be moved to a private sub-collection
    // or a separate public_availability collection to prevent PII exposure.
    const qApps = query(collection(db, 'appointments'));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Notify admin of NEW appointments (only after initial load)
      if (!isInitialLoad.current && isAdmin) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newApp = change.doc.data();
            sendNotification(
              "Novo Pedido de Marcação! 🔔", 
              `${newApp.clientName} pediu ${newApp.serviceName} para ${format(parseISO(newApp.date), "d 'de' MMMM", { locale: pt })} às ${newApp.time}.`
            );
            toast.info("Novo pedido recebido!", {
              description: `${newApp.clientName} para ${newApp.time}`
            });
          }
        });
      }
      
      setAppointments(apps);
      isInitialLoad.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      toast.error("Erro ao carregar marcações.");
    });

    // Clients Listener
    const qClients = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      const cls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientsFromDb(cls);
    }, (error) => {
      // Only log if admin, as non-admins might not have permission
      if (isAdmin) {
        handleFirestoreError(error, OperationType.LIST, 'clients');
        toast.error("Erro ao carregar base de dados de clientes.");
      }
    });

    // Blocked Contacts Listener
    let unsubBlocked = () => {};
    if (isAdmin) {
      const qBlocked = query(collection(db, 'blocked_contacts'));
      unsubBlocked = onSnapshot(qBlocked, (snapshot) => {
        const blocked = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBlockedContacts(blocked);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'blocked_contacts');
      });
    }

    // Services Listener
    const qServices = query(collection(db, 'services'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      const svcs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setServices(svcs);
      // Set default service if none selected
      if (svcs.length > 0 && !selectedService) {
        setSelectedService(svcs.find(s => s.name?.toLowerCase().includes('corte')) || svcs[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'services');
    });

    // Vacations Listener
    const qVacations = query(collection(db, 'vacations'));
    const unsubVacations = onSnapshot(qVacations, (snapshot) => {
      const vacs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVacations(vacs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vacations');
    });

    // Profile Listener
    const unsubProfile = onSnapshot(doc(db, 'profile', 'main_profile'), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({
          id: docSnap.id,
          ...docSnap.data()
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'profile/main_profile');
    });

    // User Profile Listener
    let unsubUser = () => {};
    if (user) {
      unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          // Pre-fill booking fields if profile exists
          if (data.name) setClientName(data.name);
          if (data.phone) setClientPhone(data.phone);
        } else {
          setUserProfile(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
    }

    return () => {
      unsubApps();
      unsubClients();
      unsubBlocked();
      unsubServices();
      unsubVacations();
      unsubProfile();
      unsubUser();
    };
  }, [db, user]);

  const isDateAvailableDynamic = (date: Date) => {
    // Basic checks from config (weekends, past dates)
    if (!isDateAvailable(date)) return false;

    // Dynamic vacation checks
    const dateStr = format(date, 'yyyy-MM-dd');
    const isOnVacation = vacations.some(v => {
      return dateStr >= v.startDate && dateStr <= v.endDate;
    });

    return !isOnVacation;
  };

  const getAvailableSlotsDynamic = (date: Date) => {
    if (!isDateAvailableDynamic(date)) return [];
    return getAvailableSlots(date);
  };

  // Reminder Logic (Simulated)
  useEffect(() => {
    if (!isAdmin || appointments.length === 0 || !db) return;
    
    const checkReminders = async () => {
      const now = new Date();
      
      for (const app of appointments) {
        if (app.status !== 'booked') continue;
        
        const appDate = parseISO(app.date);
        const [hours, minutes] = app.time.split(':').map(Number);
        const appDateTime = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate(), hours, minutes);
        
        // Client Reminder (24h before)
        if (!app.remindersSent?.client24h) {
          const diffHours = (appDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (diffHours <= 24 && diffHours > 0) {
            const manageLink = `${PUBLISHED_APP_URL}/?appointmentId=${app.id}${app.cancelToken ? `&token=${app.cancelToken}` : ''}`;
            console.log(`[REMINDER] Enviar para Cliente: ${app.clientName} (${app.clientPhone}) - Marcação amanhã às ${app.time}. Gerir marcação: ${manageLink}`);
            try {
              await updateDoc(doc(db, 'appointments', app.id), {
                'remindersSent.client24h': true
              });
              
              const dateStr = format(appDate, "d 'de' MMMM", { locale: pt });
              const message = `Olá ${app.clientName}, lembramos que tem uma marcação amanhã (${dateStr}) às ${app.time} no Chico Cabeleireiros. Pode gerir a sua marcação aqui: ${manageLink}`;
              
              let clientPhone = app.clientPhone.replace(/\D/g, '');
              if (clientPhone.length === 9 && (clientPhone.startsWith('9') || clientPhone.startsWith('2'))) {
                clientPhone = '351' + clientPhone;
              }
              
              const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;

              toast.info(`Lembrete 24h pronto para ${app.clientName}`, {
                description: "Clique para enviar via WhatsApp",
                action: {
                  label: "Enviar WhatsApp",
                  onClick: () => window.open(whatsappUrl, '_blank')
                },
                duration: 10000
              });

              sendNotification(
                "Lembrete de Marcação", 
                `Olá ${app.clientName}, lembramos que tem uma marcação amanhã às ${app.time}.`
              );
            } catch (e) {
              console.error("Error sending 24h reminder:", e);
            }
          }
        }
        
        // Professional Reminder (1h before)
        if (!app.remindersSent?.professional1h) {
          const diffHours = (appDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (diffHours <= 1 && diffHours > 0) {
            console.log(`[REMINDER] Enviar para Sérgio Ramos: Marcação com ${app.clientName} em 1 hora às ${app.time}`);
            try {
              await updateDoc(doc(db, 'appointments', app.id), {
                'remindersSent.professional1h': true
              });
              toast.info(`Lembrete 1h enviado para Sérgio Ramos`);
              sendNotification(
                "Próximo Cliente em 1h", 
                `Sérgio, tem uma marcação com ${app.clientName} às ${app.time}.`
              );
            } catch (e) {
              console.error("Error sending 1h reminder:", e);
            }
          }
        }
      }
    };

    const interval = setInterval(checkReminders, 5 * 60 * 1000); // Check every 5 minutes
    checkReminders();
    
    return () => clearInterval(interval);
  }, [isAdmin, appointments.length, db]);

  const availableSlots = React.useMemo(() => getAvailableSlotsDynamic(selectedDate), [selectedDate, vacations]);
  const takenSlots = React.useMemo(() => appointments
    .filter(app => app.date === format(selectedDate, 'yyyy-MM-dd') && (app.status === 'booked' || app.status === 'pending'))
    .map(app => app.time), [appointments, selectedDate]);

  const clients = React.useMemo(() => {
    const clientsMap: Record<string, any> = {};

    // First, add clients from appointments
    appointments.forEach((curr) => {
      const phone = curr.clientPhone;
      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: curr.clientName,
          phone: phone,
          lastDate: curr.date,
          count: 0
        };
      }
      clientsMap[phone].count += 1;
      if (curr.date > clientsMap[phone].lastDate) {
        clientsMap[phone].lastDate = curr.date;
        clientsMap[phone].name = curr.clientName;
      }
    });

    // Then, merge with clients from database (imported or manual)
    clientsFromDb.forEach((dbClient) => {
      const phone = dbClient.phone;
      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: dbClient.name,
          phone: phone,
          lastDate: dbClient.createdAt || '2000-01-01',
          count: 0,
          isFromDb: true
        };
      } else {
        // If already exists, just mark it as from DB if needed or merge other fields
        clientsMap[phone].isFromDb = true;
        if (dbClient.email) clientsMap[phone].email = dbClient.email;
      }
    });

    // Convert map to array and apply filters/search
    let result = Object.values(clientsMap);

    // Filter by search term
    if (clientSearchTerm) {
      const term = clientSearchTerm.toLowerCase();
      result = result.filter((c: any) => 
        c.name.toLowerCase().includes(term) || 
        c.phone.includes(term)
      );
    }

    // Filter by category
    if (clientFilter === 'frequent') {
      result = result.filter((c: any) => c.count >= 3);
    } else if (clientFilter === 'inactive') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = format(threeMonthsAgo, 'yyyy-MM-dd');
      result = result.filter((c: any) => c.lastDate < threeMonthsAgoStr && c.count > 0);
    }

    return result.sort((a: any, b: any) => {
      const dateA = String(a.lastDate || '');
      const dateB = String(b.lastDate || '');
      return dateB.localeCompare(dateA);
    }) as any[];
  }, [appointments, clientsFromDb, clientSearchTerm, clientFilter]);

  const handleLogin = async () => {
    if (!auth) {
      toast.error("Firebase não configurado.");
      return;
    }
    triggerHaptic(ImpactStyle.Medium);
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        setGoogleAccessToken(credential.accessToken || null);
        setIsGoogleConnected(true);
        if (result.user.email === "ramosdrums@gmail.com") {
          setIsAdminMode(true);
        }
      }
      toast.success("Login efetuado com sucesso!");
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.error("O popup de login foi bloqueado pelo seu navegador.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.info("O login foi cancelado (janela fechada).");
      } else if (error.code === 'auth/cancelled-by-user') {
        toast.info("Login cancelado.");
      } else if (error.code === 'auth/network-request-failed') {
        toast.error("Erro de rede. Verifique a sua ligação.");
      } else {
        console.error("Login error:", error);
        toast.error("Erro ao fazer login.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    triggerHaptic(ImpactStyle.Medium);
    await signOut(auth);
    setGoogleAccessToken(null);
    setIsGoogleConnected(false);
    setIsAdminMode(false);
    toast.success("Sessão terminada.");
  };

  const handleBlockContact = async (phone: string, name: string) => {
    if (!db || !isAdmin) return;
    
    toast(`Bloquear ${name}?`, {
      description: "Este cliente não poderá fazer mais marcações.",
      action: {
        label: "Bloquear",
        onClick: async () => {
          try {
            await setDoc(doc(db!, 'blocked_contacts', phone), {
              phone,
              name,
              blockedAt: new Date().toISOString(),
              reason: 'Uso abusivo'
            });
            toast.success("Contacto bloqueado com sucesso.");
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `blocked_contacts/${phone}`);
          }
        }
      }
    });
  };

  const handleDeleteClient = (phone: string, name: string) => {
    if (!db || !isAdmin) return;
    setClientToDelete({ phone, name });
  };

  const confirmDeleteClient = async (deleteAll: boolean) => {
    if (!clientToDelete || !db) return;
    const { phone } = clientToDelete;

    try {
      if (deleteAll) {
        // 1. Delete from clients collection
        await deleteDoc(doc(db, 'clients', phone));
        
        // 2. Find and delete all appointments for this phone
        const q = query(collection(db, 'appointments'), where('clientPhone', '==', phone));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        toast.success("Contacto e histórico eliminados com sucesso.");
      } else {
        await deleteDoc(doc(db, 'clients', phone));
        toast.success("Registo de cliente eliminado. (Histórico mantido)");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${phone}`);
    } finally {
      setClientToDelete(null);
    }
  };

  const handleUnblockContact = async (phone: string) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'blocked_contacts', phone));
      toast.success("Contacto desbloqueado com sucesso.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blocked_contacts/${phone}`);
    }
  };

  const handleSyncContacts = async () => {
    // Check if Contact Picker API is supported
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name.length > 0) {
            setClientName(contact.name[0]);
          }
          if (contact.tel && contact.tel.length > 0) {
            // Clean phone number: remove spaces and non-numeric chars except +
            const phone = contact.tel[0].replace(/[^\d+]/g, '');
            setClientPhone(phone);
          }
          toast.success("Dados sincronizados com sucesso!");
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error("Não foi possível aceder aos contactos.");
        }
      }
    } else {
      toast.error("A sincronização de contactos não é suportada neste navegador ou dispositivo.");
    }
  };

  const handleImportContacts = async () => {
    triggerHaptic(ImpactStyle.Light);
    
    try {
      // 1. Try Native Contact Picker API (Best UX - allows picking specific contacts)
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel', 'email'];
        const opts = { multiple: true };
        const selectedContacts = await (navigator as any).contacts.select(props, opts);
        
        if (selectedContacts && selectedContacts.length > 0) {
          let importedCount = 0;
          for (const contact of selectedContacts) {
            const name = contact.name?.[0] || '';
            const phone = contact.tel?.[0]?.replace(/[^\d+]/g, '') || '';
            const email = contact.email?.[0] || '';

            if (name && phone) {
              await setDoc(doc(db!, 'clients', phone), {
                name,
                phone,
                email,
                source: 'import',
                createdAt: new Date().toISOString()
              }, { merge: true });
              importedCount++;
            }
          }
          toast.success(`${importedCount} contactos importados com sucesso!`);
          return;
        }
      }

      // 2. Fallback to Google People API if native is not supported or cancelled
      if (googleAccessToken) {
        toast.loading("A importar contactos do Google...", { id: 'google-import' });
        try {
          const response = await fetch(
            'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=1000',
            {
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Accept': 'application/json'
              }
            }
          );

          if (!response.ok) {
            if (response.status === 401) {
              setGoogleAccessToken(null);
              setIsGoogleConnected(false);
              throw new Error("Sessão Google expirada. Por favor, ligue novamente.");
            }
            throw new Error("Erro ao aceder à Google People API.");
          }

          const data = await response.json();
          const connections = data.connections || [];
          
          if (connections.length === 0) {
            toast.dismiss('google-import');
            toast.info("Não foram encontrados contactos na sua conta Google.");
            return;
          }

          let importedCount = 0;
          for (const person of connections) {
            const name = person.names?.[0]?.displayName || '';
            const phone = person.phoneNumbers?.[0]?.value?.replace(/[^\d+]/g, '') || '';
            const email = person.emailAddresses?.[0]?.value || '';

            if (name && phone) {
              await setDoc(doc(db!, 'clients', phone), {
                name,
                phone,
                email,
                source: 'google_import',
                createdAt: new Date().toISOString()
              }, { merge: true });
              importedCount++;
            }
          }
          
          toast.dismiss('google-import');
          toast.success(`${importedCount} contactos importados do Google!`);
        } catch (err: any) {
          toast.dismiss('google-import');
          toast.error(err.message || "Erro ao importar contactos do Google.");
        }
      } else {
        // 3. If no Google token and no native API, ask to connect
        toast.info("A importação direta não é suportada neste navegador. Por favor, sincronize com o seu Gmail para importar contactos.", {
          action: {
            label: "Ligar Gmail",
            onClick: () => handleConnectGoogle()
          },
          duration: 6000
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error importing contacts:", error);
        toast.error("Erro ao importar contactos.");
      }
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleAccessToken(null);
    setIsGoogleConnected(false);
    toast.success("Google Cloud desconectado.");
    triggerHaptic(ImpactStyle.Light);
  };

  const handleConnectGoogle = async () => {
    triggerHaptic(ImpactStyle.Light);
    if (!auth) {
      toast.error("Serviço de autenticação não disponível.");
      return;
    }
    
    setIsLoggingIn(true);
    try {
      // Force account selection to ensure a "fresh" connection
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setIsGoogleConnected(true);
        toast.success("Ligação ao Google Cloud estabelecida!", {
          description: "Agora pode importar os seus contactos e gerir a agenda."
        });
      } else {
        throw new Error("Não foi possível obter o token de acesso.");
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.error("O popup foi bloqueado pelo seu navegador. Por favor, permita popups para este site.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.info("A ligação foi cancelada pelo utilizador.");
      } else {
        console.error("Google Cloud Connection Error:", error);
        toast.error("Erro crítico na ligação ao Google Cloud.");
      }
      setIsGoogleConnected(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleImportGoogleContacts = async () => {
    if (!googleAccessToken) {
      toast.info("A iniciar ligação ao Gmail...");
      await handleConnectGoogle();
      return;
    }

    setIsImportingGoogle(true);
    toast.loading("A sincronizar contactos do Gmail...", { id: 'gmail-sync' });
    
    try {
      // Using People API v1 to fetch connections
      const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired, clear and retry once
        setGoogleAccessToken(null);
        setIsGoogleConnected(false);
        toast.dismiss('gmail-sync');
        toast.error("A sessão do Gmail expirou. Por favor, ligue-se novamente.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss('gmail-sync');
        throw new Error(errorData.error?.message || 'Erro na People API');
      }
      
      const data = await response.json();
      const connections = data.connections || [];
      
      if (connections.length === 0) {
        toast.dismiss('gmail-sync');
        toast.info("Não foram encontrados contactos no seu Gmail.");
        return;
      }

      let importedCount = 0;
      const batch = writeBatch(db!);
      
      for (const person of connections) {
        const name = person.names?.[0]?.displayName;
        const phone = person.phoneNumbers?.[0]?.value?.replace(/[^\d+]/g, '');

        if (name && phone && phone.length >= 9) {
          const clientDoc = doc(db!, 'clients', phone);
          batch.set(clientDoc, {
            name: name,
            phone: phone,
            email: person.emailAddresses?.[0]?.value || '',
            source: 'gmail_sync',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          importedCount++;
        }
      }
      
      if (importedCount > 0) {
        await batch.commit();
        toast.dismiss('gmail-sync');
        toast.success(`${importedCount} contactos sincronizados do Gmail!`, {
          description: "A sua base de dados de clientes foi atualizada."
        });
      } else {
        toast.dismiss('gmail-sync');
        toast.info("Nenhum contacto válido (com número de telefone) foi encontrado no Gmail.");
      }
    } catch (error: any) {
      toast.dismiss('gmail-sync');
      console.error("Gmail Contacts Sync Error:", error);
      toast.error("Falha ao sincronizar contactos do Gmail: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsImportingGoogle(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTime || !clientName || !clientPhone || !selectedService || !acceptedTerms) return;
    if (!db) {
      toast.error("Sistema indisponível no momento.");
      return;
    }
    
    triggerHaptic(ImpactStyle.Heavy);
    setIsBooking(true);
    
    // Check if phone is blocked
    const isBlocked = blockedContacts.some(b => b.phone === clientPhone);
    if (isBlocked) {
      toast.error("Este número de telemóvel está bloqueado para marcações. Por favor, contacte o estabelecimento.");
      setIsBooking(false);
      return;
    }

    // Basic phone validation
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      toast.error("Por favor, insira um número de telefone válido.");
      setIsBooking(false);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const appointmentId = `${dateStr}_${selectedTime}`;
    const cancelToken = Math.random().toString(36).substring(2, 15);

    try {
      const bookingData = {
        date: dateStr,
        time: selectedTime,
        clientName,
        clientPhone,
        clientUid: user?.uid || null,
        status: 'pending',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        professionalName: BUSINESS_CONFIG.professional,
        createdAt: new Date().toISOString(),
        cancelToken,
        remindersSent: {
          client24h: false,
          professional1h: false
        }
      };

      await setDoc(doc(db, 'appointments', appointmentId), {
        ...bookingData,
        createdAt: serverTimestamp()
      });

      // Link/Update client in clients collection to avoid duplicates
      try {
        const clientRef = doc(db, 'clients', clientPhone);
        await setDoc(clientRef, {
          name: clientName,
          phone: clientPhone,
          updatedAt: serverTimestamp(),
          source: 'booking'
        }, { merge: true });
      } catch (e) {
        console.error("Erro ao atualizar base de dados de clientes:", e);
      }
      
      setLastBooking(bookingData);
      setBookingSuccess(true);
      
      // WhatsApp Integration - Using Toast Action for iOS compatibility
      const message = `Olá Sérgio, acabei de fazer um pedido de marcação para o dia ${format(selectedDate, "d 'de' MMMM", { locale: pt })} às ${selectedTime}. Gostaria de confirmar se é possível.`;
      const whatsappUrl = `https://wa.me/${BUSINESS_CONFIG.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      toast.success("Pedido de marcação enviado!", {
        description: "Envie a confirmação via WhatsApp para o Sérgio.",
        action: {
          label: "Enviar WhatsApp",
          onClick: () => window.open(whatsappUrl, '_blank')
        },
        duration: 10000
      });

      setSelectedTime(null);
      setClientName('');
      setClientPhone('');
      setAcceptedTerms(false);

      sendNotification(
        "Marcação Confirmada!", 
        `Obrigado ${clientName}. A sua marcação para ${format(selectedDate, "d 'de' MMMM", { locale: pt })} às ${selectedTime} foi registada.`
      );

      // If rescheduling, cancel the old one
      if (managedAppointment) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        try {
          await updateDoc(doc(db, 'appointments', managedAppointment.id), {
            status: 'cancelled',
            ...(isAdmin ? {} : { cancelToken: token || managedAppointment.cancelToken || '' })
          });
          setManagedAppointment(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `appointments/${managedAppointment.id}`);
        }
      }

      toast.success("Marcação realizada com sucesso!");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appointmentId}`);
    } finally {
      setIsBooking(false);
    }
  };

  const handleAddService = async () => {
    if (!db || !isAdmin) return;
    if (!newService.name || !newService.price || !newService.duration) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    
    setIsAddingService(true);
    try {
      await addDoc(collection(db, 'services'), {
        name: newService.name,
        description: newService.description,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration)
      });
      const addedName = newService.name;
      setNewService({ name: '', description: '', price: '', duration: '40' });
      setIsServiceDialogOpen(false);
      toast.success(`Serviço "${addedName}" adicionado com sucesso!`, {
        description: "O novo serviço já está disponível para marcações.",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'services');
    } finally {
      setIsAddingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success("Serviço removido.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const handleAddVacation = async () => {
    if (!db || !isAdmin) return;
    if (!newVacation.startDate || !newVacation.endDate) {
      toast.error("Preencha as datas de início e fim.");
      return;
    }
    setIsAddingVacation(true);
    try {
      await addDoc(collection(db, 'vacations'), {
        startDate: newVacation.startDate,
        endDate: newVacation.endDate,
        description: newVacation.description
      });
      setNewVacation({ startDate: '', endDate: '', description: '' });
      toast.success("Período de férias adicionado!");
    } catch (error) {
      toast.error("Erro ao adicionar férias.");
    } finally {
      setIsAddingVacation(false);
    }
  };

  const handleDeleteVacation = async (id: string) => {
    if (!db || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'vacations', id));
      toast.success("Período de férias removido.");
    } catch (error) {
      toast.error("Erro ao remover férias.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !isAdmin) return;
    try {
      await setDoc(doc(db, 'profile', 'main_profile'), {
        name: profile?.name || BUSINESS_CONFIG.professional,
        phone: profile?.phone || BUSINESS_CONFIG.phone,
        address: profile?.address || BUSINESS_CONFIG.address,
        email: user.email
      }, { merge: true });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    if (!db || !isAdmin) return;
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'completed'
      });
      toast.success("Marcação concluída.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!db || !isAdmin) return;
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'cancelled'
      });

      // WhatsApp Integration - Using Toast Action for iOS compatibility
      const app = appointments.find(a => a.id === id);
      if (app) {
        const dateStr = format(parseISO(app.date), "d 'de' MMMM", { locale: pt });
        const message = `Olá ${app.clientName}, lamentamos informar que a sua marcação para o dia ${dateStr} às ${app.time} teve de ser cancelada. O administrador Sérgio Ramos entrará em contacto em breve para encontrar uma nova data possível para ambos.`;
        
        let phone = app.clientPhone.replace(/\D/g, '');
        if (phone.length === 9 && (phone.startsWith('9') || phone.startsWith('2'))) {
          phone = '351' + phone;
        }
        
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        toast.error("Marcação cancelada.", {
          description: `Notificar ${app.clientName} via WhatsApp`,
          action: {
            label: "Enviar WhatsApp",
            onClick: () => window.open(whatsappUrl, '_blank')
          },
          duration: 8000
        });
      } else {
        toast.success("Marcação cancelada.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleReactivateReminders = async () => {
    if (!db || !isAdmin) return;
    
    try {
      const q = query(
        collection(db, 'appointments'),
        where('status', '==', 'booked')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.info("Não existem marcações ativas para reativar lembretes.");
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          'remindersSent.client24h': false,
          'remindersSent.professional1h': false
        });
      });

      await batch.commit();
      toast.success("Lembretes reativados para todas as marcações ativas!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments/batch-update');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const batch = writeBatch(db);
      
      // Delete profile
      batch.delete(doc(db, 'profile', 'main_profile'));
      
      // Delete all appointments
      const appDocs = await getDocs(collection(db, 'appointments'));
      appDocs.forEach(d => batch.delete(d.ref));
      
      // Delete all services
      const svcDocs = await getDocs(collection(db, 'services'));
      svcDocs.forEach(d => batch.delete(d.ref));
      
      // Delete all vacations
      const vacDocs = await getDocs(collection(db, 'vacations'));
      vacDocs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      
      toast.success("Conta e todos os dados foram apagados com sucesso.");
      await signOut(auth);
      setIsAdminMode(false);
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'account-deletion/batch');
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    if (!db || !isAdmin) return;
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'booked'
      });
      
      // WhatsApp Integration - Using Toast Action for iOS compatibility
      const app = appointments.find(a => a.id === id);
      if (app) {
        const dateStr = format(parseISO(app.date), "d 'de' MMMM", { locale: pt });
        const message = `Olá ${app.clientName}, a sua marcação para o dia ${dateStr} às ${app.time} foi CONFIRMADA! Ficamos à sua espera no Chico Cabeleireiros.`;
        
        let phone = app.clientPhone.replace(/\D/g, '');
        if (phone.length === 9 && (phone.startsWith('9') || phone.startsWith('2'))) {
          phone = '351' + phone;
        }
        
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        toast.success("Marcação confirmada!", {
          description: `Enviar confirmação para ${app.clientName}`,
          action: {
            label: "Enviar WhatsApp",
            onClick: () => window.open(whatsappUrl, '_blank')
          },
          duration: 8000
        });
      } else {
        toast.success("Marcação confirmada com sucesso!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };


  const handleClientCancel = async () => {
    if (!db || !managedAppointment) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    try {
      await updateDoc(doc(db, 'appointments', managedAppointment.id), {
        status: 'cancelled',
        // If admin, we don't need token. If client, we use token from URL or existing one
        ...(isAdmin ? {} : { cancelToken: token || managedAppointment.cancelToken || '' })
      });
      toast.success("Marcação cancelada com sucesso.");
      setManagedAppointment(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${managedAppointment.id}`);
    }
  };

  if (!isAuthReady && auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    if (!clientName || !clientPhone) {
      toast.error("Por favor preencha o nome e o telefone.");
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: clientName,
        phone: clientPhone,
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });

      // Also link to clients collection to avoid duplicates
      try {
        await setDoc(doc(db, 'clients', clientPhone), {
          name: clientName,
          phone: clientPhone,
          email: user.email,
          updatedAt: serverTimestamp(),
          source: 'manual'
        }, { merge: true });
      } catch (e) {
        console.error("Erro ao vincular cliente no registo:", e);
      }

      toast.success("Registo concluído com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const MyBookingsView = () => {
    const [localPhone, setLocalPhone] = useState(searchPhone || userProfile?.phone || '');
    const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(!!(searchPhone || userProfile?.phone));

    const historyData = useMemo(() => {
      const phoneToMatch = localPhone.replace(/\D/g, '');
      if (!phoneToMatch || phoneToMatch.length < 9) return [];
      
      return appointments
        .filter(a => a.clientPhone.replace(/\D/g, '') === phoneToMatch)
        .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
    }, [appointments, localPhone]);

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (localPhone.length >= 9) {
        setSearchPhone(localPhone);
        setIsPhoneSubmitted(true);
        triggerHaptic(ImpactStyle.Light);
      } else {
        toast.error("Por favor, introduza um número de telemóvel válido.");
      }
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto py-8 px-4 space-y-8"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-heading font-bold">Minhas Marcações</h1>
          <Button variant="ghost" onClick={() => setCurrentView('main')} className="rounded-full">
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>

        {!isPhoneSubmitted ? (
          <Card className="border-none shadow-xl shadow-primary/5 bg-card rounded-3xl overflow-hidden p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold">Consultar Histórico</h2>
              <p className="text-muted-foreground">
                Introduza o seu número de telemóvel para ver todas as suas marcações efetuadas no Chico Cabeleireiros.
              </p>
            </div>
            <form onSubmit={handleSearch} className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="search-phone">Telemóvel</Label>
                <Input 
                  id="search-phone"
                  type="tel"
                  placeholder="Ex: 912 345 678" 
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  className="rounded-xl py-6 text-lg"
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 text-lg font-bold shadow-lg shadow-primary/20">
                Procurar Marcações
              </Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Resultados para {localPhone}</h2>
                  <p className="text-xs text-muted-foreground">Personalizado para o seu contacto</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPhoneSubmitted(false)}
                className="rounded-full text-xs"
              >
                Alterar Número
              </Button>
            </div>

            {historyData.length > 0 ? (
              <div className="space-y-4">
                {historyData.map((app) => (
                  <Card key={app.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm",
                        app.status === 'booked' ? "bg-primary text-primary-foreground" : 
                        app.status === 'completed' ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}>
                        <p className="text-[10px] font-bold uppercase leading-none mb-1 opacity-80">{format(parseISO(app.date), 'MMM', { locale: pt })}</p>
                        <p className="text-xl font-bold leading-none">{format(parseISO(app.date), 'dd')}</p>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold truncate text-lg">{app.serviceName}</p>
                          <p className="text-sm font-mono font-bold text-primary">{app.time}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3 text-primary" /> {app.professionalName || BUSINESS_CONFIG.professional}
                          </p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase py-0.5 px-3 rounded-full border-none font-bold",
                            app.status === 'booked' ? "bg-blue-100 text-blue-700" : 
                            app.status === 'pending' ? "bg-amber-100 text-amber-700" :
                            app.status === 'completed' ? "bg-green-100 text-green-700" : "bg-muted/50 text-muted-foreground"
                          )}>
                            {app.status === 'booked' ? 'Confirmado' : 
                             app.status === 'pending' ? 'Pendente' :
                             app.status === 'completed' ? 'Realizado' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                      
                      {(app.status === 'booked' || app.status === 'pending') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setManagedAppointment(app);
                            setCurrentView('main');
                            triggerHaptic(ImpactStyle.Medium);
                          }}
                          className="rounded-full h-10 w-10 text-primary hover:bg-primary/10"
                        >
                          <Settings className="w-5 h-5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-muted/20 text-center py-20 rounded-3xl">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xl text-foreground">Sem histórico encontrado</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Não encontrámos marcações associadas ao contacto <strong>{localPhone}</strong>.</p>
                  </div>
                  <Button variant="default" onClick={() => setCurrentView('main')} className="rounded-full px-8">Agendar a Primeira Visita</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const RegistrationBox = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto mt-10 p-6 bg-card rounded-3xl shadow-2xl border border-border/50"
    >
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold">Completar Registo</h2>
          <p className="text-sm text-muted-foreground">
            Para podermos gerir as suas marcações, precisamos apenas do seu nome e contacto.
          </p>
        </div>
      </div>

      <form onSubmit={handleRegisterUser} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reg-name">Nome Completo</Label>
          <Input 
            id="reg-name"
            placeholder="Ex: João Silva" 
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="rounded-xl py-6"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-phone">Telemóvel</Label>
          <Input 
            id="reg-phone"
            type="tel"
            placeholder="Ex: 912 345 678" 
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="rounded-xl py-6"
            required
          />
        </div>
        <Button type="submit" className="w-full rounded-xl py-6 text-lg font-bold shadow-lg shadow-primary/20">
          Concluir Registo
        </Button>
      </form>
    </motion.div>
  );

  const PrivacyPolicy = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 px-4 space-y-8"
    >
      <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-4">
        <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      <div className="space-y-4">
        <h1 className="text-4xl font-heading font-bold">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: 11 de Abril de 2026</p>
      </div>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">1. Informações que Recolhemos</h2>
        <p>Recolhemos apenas as informações necessárias para o agendamento dos seus serviços:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Nome completo para identificação da marcação.</li>
          <li>Número de telemóvel para envio de lembretes e contacto em caso de alteração.</li>
          <li>Histórico de marcações para melhoria do serviço prestado.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2. Como Utilizamos os seus Dados</h2>
        <p>Os seus dados são utilizados exclusivamente para:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Confirmar e gerir os seus agendamentos.</li>
          <li>Enviar notificações de lembrete via SMS ou WhatsApp (quando aplicável).</li>
          <li>Permitir que o profissional Sérgio Ramos organize a sua agenda de trabalho.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3. Segurança dos Dados</h2>
        <p>Utilizamos tecnologias seguras (Firebase/Google Cloud) para armazenar e proteger as suas informações contra acessos não autorizados.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">4. Permissões e Dados Sensíveis</h2>
        <p>Para proporcionar uma melhor experiência, a aplicação poderá solicitar acesso a funcionalidades do seu dispositivo. Estas permissões são solicitadas de forma clara e apenas quando necessário:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Notificações:</strong> Para envio de confirmações e lembretes de marcação.</li>
          <li><strong>Localização:</strong> Poderá ser solicitada para ajudar a calcular a rota até ao nosso estabelecimento (opcional).</li>
          <li><strong>Câmara/Galeria:</strong> Poderá ser solicitada caso deseje personalizar a sua foto de perfil (opcional).</li>
        </ul>
        <p className="text-sm italic">Pode revogar estas permissões a qualquer momento através das definições do seu sistema operativo.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">5. Os Seus Direitos</h2>
        <p>Pode solicitar a retificação ou eliminação dos seus dados a qualquer momento, contactando-nos diretamente no salão ou através do número de telemóvel fornecido.</p>
      </section>
    </motion.div>
  );

  const TermsOfService = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 px-4 space-y-8"
    >
      <Button variant="ghost" onClick={() => setCurrentView('main')} className="mb-4">
        <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      <div className="space-y-4">
        <h1 className="text-4xl font-heading font-bold">Políticas e Regras de Agendamento</h1>
        <p className="text-muted-foreground">Última atualização: 11 de Abril de 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
        <p>Ao utilizar esta aplicação de agendamento, concorda com os presentes termos e condições.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2. Política de Agendamento</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Os agendamentos são submetidos para aprovação e a confirmação final será efetuada pelo administrador.</li>
          <li>Receberá uma notificação assim que a sua marcação for confirmada.</li>
          <li>Certifique-se de que os seus dados de contacto (nome e telefone) estão corretos.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3. Política de Cancelamento e Reagendamento</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cancelamentos ou alterações devem ser efetuados com um mínimo de <strong>24 horas de antecedência</strong>.</li>
          <li>Pode cancelar ou reagendar diretamente através da aplicação na secção "As Minhas Marcações".</li>
          <li>Cancelamentos tardios (menos de 24h) ou faltas não justificadas prejudicam o profissional e outros clientes.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">4. Pontualidade e Faltas (No-Show)</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Existe uma tolerância de <strong>15 minutos</strong> para atrasos.</li>
          <li>Após 15 minutos de atraso, a marcação poderá ser cancelada ou o serviço poderá ser simplificado para não atrasar o cliente seguinte.</li>
          <li>Em caso de falta sem aviso prévio (No-Show), o sistema poderá restringir futuros agendamentos automáticos.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">5. Regras do Salão</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ambiente livre de fumo.</li>
          <li>Agradecemos que mantenha o telemóvel em modo silencioso para um ambiente relaxante.</li>
          <li>Crianças devem estar acompanhadas por um adulto responsável.</li>
          <li>Não é permitida a entrada de animais (exceto cães-guia).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">6. Pagamentos</h2>
        <p>Os pagamentos são efetuados no local após a prestação do serviço. Aceitamos os seguintes métodos:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Dinheiro</li>
          <li>MBWay</li>
          <li>Revolut</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">7. Direitos de Autor</h2>
        <p>Todo o conteúdo desta aplicação, incluindo o logótipo "Chico Cabeleireiros", design e textos, são propriedade intelectual de Sérgio Ramos e Chico Cabeleireiros.</p>
      </section>
    </motion.div>
  );

  const handleUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName,
        phone: editPhone,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const ProfileView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 px-4 space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">O Meu Perfil</h1>
        {user && (
          <Button variant="ghost" onClick={() => setCurrentView('main')} className="rounded-full">
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        )}
      </div>

      {user ? (
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-primary/5 bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-2xl font-heading truncate">{userProfile?.name || user.displayName || 'Cliente'}</CardTitle>
                  {!isEditingProfile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditName(userProfile?.name || user.displayName || '');
                        setEditPhone(userProfile?.phone || '');
                        setIsEditingProfile(true);
                      }}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription className="truncate">
                  {user.email}
                  {userProfile?.phone && <span className="block text-sm mt-1 text-primary font-medium">{userProfile.phone}</span>}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-4 px-6">
              {isEditingProfile ? (
                <form onSubmit={handleUpdateUserProfile} className="space-y-4 py-4 border-t border-border/50">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input 
                      id="edit-name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telemóvel</Label>
                    <Input 
                      id="edit-phone" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)} 
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 rounded-xl">Guardar Alterações</Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)} className="rounded-xl">Cancelar</Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="bg-muted/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Visitas</p>
                    <p className="text-3xl font-heading font-bold">{userAppointments.filter(a => a.status === 'completed' || a.status === 'booked').length}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Membro Desde</p>
                    <p className="text-sm font-bold pt-2">{userProfile?.createdAt ? format(new Date(userProfile.createdAt.seconds * 1000), 'MMM yyyy', { locale: pt }) : 'Recente'}</p>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-muted/20 border-t border-border/50 px-6 py-4">
              <Button variant="ghost" onClick={handleLogout} className="w-full text-destructive hover:bg-destructive/5 rounded-xl">
                <LogOut className="w-4 h-4 mr-2" /> Terminar Sessão
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Histórico de Marcações</h2>
              <Badge variant="outline" className="rounded-full">{userAppointments.length}</Badge>
            </div>
            
            {userAppointments.length > 0 ? (
              <div className="space-y-3">
                {userAppointments.map((app) => (
                  <Card key={app.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0",
                        app.status === 'booked' ? "bg-primary/20 text-primary" : 
                        app.status === 'completed' ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}>
                        <p className="text-[10px] font-bold uppercase leading-none">{format(parseISO(app.date), 'MMM', { locale: pt })}</p>
                        <p className="text-lg font-bold leading-none">{format(parseISO(app.date), 'dd')}</p>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold truncate">{app.serviceName}</p>
                          <p className="text-sm font-mono font-bold text-muted-foreground">{app.time}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> {app.professionalName || BUSINESS_CONFIG.professional}
                          </p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase py-0 px-2 rounded-full border-none",
                            app.status === 'booked' ? "bg-primary/10 text-primary" : 
                            app.status === 'completed' ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
                          )}>
                            {app.status === 'booked' ? 'Confirmado' : 
                             app.status === 'pending' ? 'Pendente' :
                             app.status === 'completed' ? 'Realizado' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-transparent text-center py-12 rounded-3xl">
                <CardContent className="space-y-2">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Nenhuma marcação encontrada</p>
                  <p className="text-sm text-muted-foreground">As suas próximas marcações aparecerão aqui.</p>
                  <Button variant="link" onClick={() => setCurrentView('main')}>Agendar agora</Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Utilidades</h2>
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0 divide-y divide-border/50">
                <div className="flex items-center justify-between p-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <BellRing className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Notificações</span>
                  </div>
                  <Button 
                    variant={notificationPermission === 'granted' ? "outline" : "default"} 
                    size="sm" 
                    onClick={requestNotificationPermission}
                    className="rounded-full text-xs h-8"
                  >
                    {notificationPermission === 'granted' ? "Ativadas" : "Ativar"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">App Web</span>
                  </div>
                  <Badge variant="outline" className="rounded-full bg-green-50 text-green-700 border-green-200">Standalone</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold">Ainda não tem sessão iniciada</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Inicie sessão para gerir as suas marcações, ver o histórico e receber notificações personalizadas.
            </p>
          </div>
          <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full max-w-xs rounded-2xl py-6 shadow-lg shadow-primary/20">
            {isLoggingIn ? "A iniciar..." : "Iniciar Sessão com Google"}
          </Button>
        </div>
      )}

      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Informações</h2>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/50">
            <button onClick={() => setCurrentView('privacy')} className="w-full flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors text-left">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Política de Privacidade</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setCurrentView('terms')} className="w-full flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Termos e Condições</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
          Versão 1.0.0 • Chico Cabeleireiros
        </p>
      </div>
    </motion.div>
  );

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center space-y-6 z-[100]">
        <Logo className="scale-150 animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium uppercase tracking-widest">A carregar...</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">Chico Cabeleireiros</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col px-safe overflow-x-hidden">
      {/* Desktop Navigation - Hidden on Mobile */}
      <header className="hidden md:block bg-background/90 sticky top-0 z-[60] backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <button onClick={() => setCurrentView('main')} className="flex items-center gap-3 group">
              <Logo showText={false} className="scale-110 transition-transform group-hover:scale-125" />
              <div className="text-left">
                <h1 className="text-xl font-heading font-bold tracking-tight">CHICO</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-50">CABELEIREIROS</p>
              </div>
            </button>
            <nav className="flex items-center gap-8">
              <button 
                onClick={() => setCurrentView('main')} 
                className={cn("text-xs font-bold uppercase tracking-widest transition-colors hover:text-primary", currentView === 'main' ? "text-primary" : "text-muted-foreground")}
              >
                Início
              </button>
              <button 
                onClick={() => setCurrentView('my-bookings')} 
                className={cn("text-xs font-bold uppercase tracking-widest transition-colors hover:text-primary", currentView === 'my-bookings' ? "text-primary" : "text-muted-foreground")}
              >
                Minhas Marcações
              </button>
              <button 
                onClick={() => setCurrentView('profile')} 
                className={cn("text-xs font-bold uppercase tracking-widest transition-colors hover:text-primary", currentView === 'profile' ? "text-primary" : "text-muted-foreground")}
              >
                Perfil
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={cn("rounded-full uppercase text-[10px] font-bold tracking-widest h-10 px-6", isAdminMode ? "bg-primary text-primary-foreground" : "text-muted-foreground border border-border/50")}
              >
                {isAdminMode ? 'Sair Gestão' : 'Gestão Interna'}
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-bold">{userProfile?.name || user.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="icon" onClick={handleLogout} className="rounded-full h-10 w-10 border-destructive/20 text-destructive hover:bg-destructive/5">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="rounded-full px-8 h-12 font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                Iniciar Sessão
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header - Hidden on Desktop */}
      <header className="md:hidden bg-background/80 border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl pt-safe px-safe">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="w-10">
            {currentView !== 'main' && (
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('main')} className="rounded-full">
                <ChevronLeft className="w-6 h-6 text-primary" />
              </Button>
            )}
          </div>
          
          <div className="flex-1 text-center">
            <Logo showText={false} className="justify-center scale-75" />
            <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              {isAdminMode ? 'Administração' : 'Chico Cabeleireiros'}
            </h1>
          </div>

          <div className="flex items-center gap-2 w-auto justify-end">
            {!isAdminMode && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-green-600 rounded-full hover:bg-green-50"
                onClick={() => {
                  triggerHaptic(ImpactStyle.Light);
                  window.open(`https://wa.me/${BUSINESS_CONFIG.phone.replace(/\D/g, '')}`, '_blank');
                }}
              >
                <WhatsAppIcon className="w-6 h-6" />
              </Button>
            )}
            {user ? (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive rounded-full">
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="rounded-full text-primary"
              >
                <Lock className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-6 pb-40 flex-1 w-full">
        {currentView === 'privacy' ? (
          <PrivacyPolicy />
        ) : currentView === 'terms' ? (
          <TermsOfService />
        ) : currentView === 'profile' ? (
          <ProfileView />
        ) : currentView === 'my-bookings' ? (
          <MyBookingsView />
        ) : user && !userProfile && !isAdmin ? (
          <RegistrationBox />
        ) : (
          <div className="space-y-12">
            {managedAppointment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-heading font-bold text-primary">Gerir Marcação</h2>
                  {managedAppointment.status === 'pending' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] py-0">A aguardar aprovação</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tem uma marcação para <strong>{format(parseISO(managedAppointment.date), "d 'de' MMMM", { locale: pt })}</strong> às <strong>{managedAppointment.time}</strong>.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setManagedAppointment(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
              >
                Fechar
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="destructive" 
                className="rounded-xl"
                onClick={handleClientCancel}
              >
                Cancelar Marcação
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl"
                onClick={() => {
                  // Pre-fill fields for rescheduling
                  setClientName(managedAppointment.clientName);
                  setClientPhone(managedAppointment.clientPhone);
                  const service = services.find(s => s.id === managedAppointment.serviceId);
                  if (service) setSelectedService(service);
                  toast.info("Escolha uma nova data e hora para reagendar.");
                }}
              >
                Reagendar (Escolher nova data)
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Web Hero Section */}
        {!isAdminMode && currentView === 'main' && (
          <section className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden group">
            <div className="absolute inset-0">
              <img 
                src="https://picsum.photos/seed/barber-chair/1920/1080" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Chico Cabeleireiros Hero"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative h-full flex flex-col justify-center px-8 md:px-20 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 max-w-2xl"
              >
                <Badge className="bg-secondary text-secondary-foreground border-none px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase">
                  Excelência desde há anos
                </Badge>
                <h1 className="text-5xl md:text-8xl font-heading font-black text-white leading-[0.9] tracking-tighter">
                  ESTILO & <br />
                  <span className="text-secondary italic font-light">TRADIÇÃO</span>
                </h1>
                <p className="text-white/70 text-lg md:text-xl max-w-lg font-medium leading-relaxed">
                  Agende a sua visita ao Chico Cabeleireiros na Cruz de Pau. 
                  O seu estilo em boas mãos com Sérgio Ramos.
                </p>
                <div className="flex gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="rounded-full px-10 h-14 bg-white text-black hover:bg-white/90 text-sm font-bold uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                    onClick={() => {
                      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Marcar Agora
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="rounded-full px-10 h-14 border-white/30 text-white hover:bg-white/10 text-sm font-bold uppercase tracking-widest backdrop-blur-sm transition-all"
                    onClick={() => {
                      window.open(BUSINESS_CONFIG.mapsLink, '_blank');
                    }}
                  >
                    Ver Localização
                  </Button>
                </div>
              </motion.div>
            </div>
            
            {/* Vertical Rail Text */}
            <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden lg:flex items-center gap-4 vertical-rl rotate-180">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.5em]">PRECISÃO • CUIDADO • ESTILO • ARTE</span>
              <div className="h-24 w-[1px] bg-white/20" />
            </div>
          </section>
        )}

        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            <motion.div
              key="client"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-16"
            >
              {/* Hero / Info - Grid optimized for wide screens */}
              <section className="grid lg:grid-cols-2 gap-10">
                <Card className="border-none shadow-2xl shadow-black/5 bg-card rounded-[2.5rem] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">O Salão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <div className="font-medium">
                            {profile?.address || BUSINESS_CONFIG.address}
                          </div>
                          <p className="text-sm text-muted-foreground">Cruz de Pau, Seixal</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 gap-2"
                          onClick={() => {
                            triggerHaptic(ImpactStyle.Light);
                            window.open(BUSINESS_CONFIG.mapsLink, '_blank');
                          }}
                        >
                          <Navigation className="w-3 h-3" />
                          DIREÇÃO
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <a 
                        href={`tel:${(profile?.phone || BUSINESS_CONFIG.phone).replace(/\s/g, '')}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {profile?.phone || BUSINESS_CONFIG.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <button 
                        type="button"
                        onClick={() => setCurrentView('terms')}
                        className="text-sm font-medium hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30"
                      >
                        Políticas de Agendamento e Cancelamento
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      <div className="space-y-2">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Pagamento</span>
                        <div className="flex flex-wrap gap-2">
                          {/* Dinheiro */}
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <div className="w-6 h-6 flex items-center justify-center bg-emerald-100 rounded-full">
                              <img 
                                src="https://img.icons8.com/color/48/euro-precision.png" 
                                alt="€" 
                                className="w-4 h-4 object-contain"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/40x40/10b981/ffffff?text=€";
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">DINHEIRO</span>
                          </div>

                          {/* MBWay */}
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/MB_WAY_logo.png/200px-MB_WAY_logo.png" 
                              alt="MBWay" 
                              className="h-5 w-auto object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/100x40/ff0055/ffffff?text=MBWAY";
                              }}
                            />
                            <span className="text-[11px] font-bold text-slate-700">MBWAY</span>
                          </div>

                          {/* Revolut */}
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Revolut_Logo.png/200px-Revolut_Logo.png" 
                              alt="Revolut" 
                              className="h-5 w-auto object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/100x40/000000/ffffff?text=REVOLUT";
                              }}
                            />
                            <span className="text-[11px] font-bold text-slate-700">REVOLUT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-primary/10 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Scissors className="w-32 h-32 rotate-12" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading text-primary-foreground">Horário</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/60 font-medium">Segunda - Sexta</span>
                      <span className="font-bold">10h - 13h | 15h - 19h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/60 font-medium">Sábado</span>
                      <span className="font-bold">10h - 13h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/60 font-medium">Domingo & Feriados</span>
                      <span className="text-white font-black uppercase tracking-widest">Fechado</span>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-primary-foreground/20 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-primary-foreground/60 text-[10px] uppercase font-bold tracking-widest">Corte Simples</span>
                        <span className="font-heading text-3xl text-white">{BUSINESS_CONFIG.price.toFixed(2)}€</span>
                      </div>
                      
                      {vacations.length > 0 ? (
                        <div className="space-y-2">
                          {vacations.map(v => (
                            <div key={v.id} className="bg-white/10 p-3 rounded-xl text-white text-[10px] flex items-center gap-2 border border-white/10">
                              <InfoIcon className="w-3.5 h-3.5 text-white/80" />
                              <span className="font-bold uppercase tracking-widest">Férias: {format(parseISO(v.startDate), "d 'de' MMM", { locale: pt })} a {format(parseISO(v.endDate), "d 'de' MMM", { locale: pt })}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/10 p-3 rounded-xl text-white text-[10px] flex items-center gap-2 border border-white/10">
                          <InfoIcon className="w-3.5 h-3.5 text-white/80" />
                          <span className="font-bold uppercase tracking-widest">Férias: 16 a 30 de Agosto</span>
                        </div>
                      )}

                      <div className="text-[10px] text-primary-foreground/50 uppercase tracking-widest text-center pt-2">
                        * Intervalos de 40 minutos
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Booking Section */}
              <section id="booking-section" className="grid lg:grid-cols-12 gap-12 pt-8">
                {/* Calendar */}
                <div className="lg:col-span-5 space-y-6">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 ml-1">
                    1. Escolha o dia
                  </h2>
                  
                  {!isDateAvailableDynamic(selectedDate) && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-sm flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Indisponível</p>
                        <p>Este dia não está disponível para marcações (Fim de semana, Feriado ou Férias).</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          triggerHaptic(ImpactStyle.Light);
                        }
                      }}
                      disabled={(date) => !isDateAvailableDynamic(date)}
                      modifiers={{
                        holiday: (date) => getPortugueseHolidays(date.getFullYear()).includes(format(date, 'yyyy-MM-dd')),
                        sunday: (date) => getDay(date) === 0
                      }}
                      modifiersStyles={{
                        holiday: { color: 'rgb(239 68 68)', fontWeight: 'bold' },
                        sunday: { color: 'rgb(156 163 175)' }
                      }}
                      className="w-full"
                      classNames={{
                        root: "w-full",
                        months: "w-full",
                        month: "w-full space-y-4",
                        table: "w-full border-collapse",
                        weekdays: "flex w-full",
                        weekday: "flex-1 text-muted-foreground font-normal text-[0.8rem] text-center",
                        week: "flex w-full mt-2",
                        day: "flex-1 h-auto aspect-square",
                      }}
                      locale={pt}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 ml-1">
                      2. Escolha o serviço
                    </h2>
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            triggerHaptic(ImpactStyle.Light);
                          }}
                          className={cn(
                            "flex justify-between items-center p-5 rounded-2xl border transition-all text-left active:scale-[0.98]",
                            selectedService?.id === service.id
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                              : "bg-card text-foreground border-border/60 hover:border-primary/50"
                          )}
                        >
                          <div>
                            <p className="font-bold">{service.name}</p>
                            <p className={cn("text-xs", selectedService?.id === service.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                              {service.duration} min • {service.description || 'Sem descrição'}
                            </p>
                          </div>
                          <span className="font-bold">{service.price.toFixed(2)}€</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slots */}
                <div className="lg:col-span-7 space-y-6">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 ml-1">
                    3. Escolha a hora
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => {
                        const isTaken = takenSlots.includes(slot);
                        const isSelected = selectedTime === slot;
                        
                        return (
                          <button
                            key={slot}
                            disabled={isTaken}
                            onClick={() => {
                              setSelectedTime(slot);
                              setAcceptedTerms(false);
                              triggerHaptic(ImpactStyle.Medium);
                            }}
                            className={cn(
                              "py-4 px-2 rounded-2xl text-sm font-bold transition-all border active:scale-[0.95]",
                              isTaken 
                                ? "bg-muted/30 text-muted-foreground/20 border-border/30 cursor-not-allowed" 
                                : isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10 scale-105"
                                  : "bg-card text-foreground border-border/60 hover:border-primary/50"
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl text-gray-500">
                        Não há horários disponíveis para este dia.
                      </div>
                    )}
                  </div>

                  {/* Booking Form */}
                  {selectedTime && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 mb-12 p-6 bg-card rounded-2xl shadow-lg border border-border space-y-4"
                    >
                      <h3 className="text-xl font-heading">Confirmar Marcação</h3>
                      <p className="text-sm text-muted-foreground">
                        Para o dia <span className="font-bold text-foreground">{format(selectedDate, "d 'de' MMMM", { locale: pt })}</span> às <span className="font-bold text-foreground">{selectedTime}</span>.
                      </p>
                      
                      <div className="space-y-4 pt-2">
                        {isAdmin && clients.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Procurar Cliente Existente</Label>
                            <Select onValueChange={(phone) => {
                              const client = clients.find(c => c.phone === phone);
                              if (client) {
                                setClientName(client.name);
                                setClientPhone(client.phone);
                                toast.success(`Cliente ${client.name} selecionado`);
                              }
                            }}>
                              <SelectTrigger className="rounded-xl border-primary/20 bg-primary/5 h-10">
                                <SelectValue placeholder="Selecionar da base de dados..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {clients.slice(0, 15).map(c => (
                                  <SelectItem key={c.phone} value={c.phone}>
                                    {c.name} ({c.phone})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex justify-between items-end gap-2">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input 
                              id="name" 
                              placeholder="Ex: João Silva" 
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              className="rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors h-12"
                            />
                          </div>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="icon"
                            className="rounded-xl border-green-500/50 text-green-600 hover:bg-green-50 shrink-0 h-12 w-12"
                            onClick={handleSyncContacts}
                            title="Sincronizar via Contactos/WhatsApp"
                          >
                            <Phone className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Número de Telemóvel</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="Ex: 912345678" 
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors h-12"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox 
                          id="terms" 
                          checked={acceptedTerms} 
                          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                          className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <label
                          htmlFor="terms"
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Li e aceito a <button type="button" onClick={() => setCurrentView('terms')} className="underline hover:text-primary transition-colors">política de agendamento e cancelamento</button>
                        </label>
                      </div>

                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                        onClick={handleBook}
                        disabled={isBooking || !clientName || !clientPhone || !acceptedTerms}
                      >
                        {isBooking ? 'A processar...' : 'Confirmar Marcação'}
                      </Button>

                      <p className="text-[10px] text-center text-muted-foreground mt-2">
                        Ao confirmar, aceita a nossa <button type="button" onClick={() => setCurrentView('terms')} className="underline hover:text-primary transition-colors">Política de Agendamento e Cancelamento</button>.
                      </p>
                    </motion.div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Tabs defaultValue="agenda" className="w-full" onValueChange={() => triggerHaptic(ImpactStyle.Medium)}>
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-8 touch-pan-x">
                  <TabsList className="flex w-max min-w-full bg-muted/80 p-1 rounded-2xl backdrop-blur-sm">
                    <TabsTrigger value="agenda" className="rounded-xl py-2 px-4 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Agenda
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="rounded-xl py-2 px-4 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                      <BellRing className="w-3.5 h-3.5" />
                      Pedidos
                      {appointments.filter(a => a.status === 'pending').length > 0 && (
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="services" className="rounded-xl py-2 px-4 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                      <Scissors className="w-3.5 h-3.5" />
                      Serviços
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="rounded-xl py-2 px-4 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                      <Users className="w-3.5 h-3.5" />
                      Clientes
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-xl py-2 px-4 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                      <User className="w-3.5 h-3.5" />
                      Perfil
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="agenda" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Agenda de {profile?.name || BUSINESS_CONFIG.professional}</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="bg-card px-4 py-1 rounded-md border border-border font-medium">
                        {format(selectedDate, "d 'de' MMMM", { locale: pt })}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-12 gap-6">
                    <Card className="md:col-span-4 border-none shadow-sm h-fit">
                      <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Calendário</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date);
                              setSelectedTime(null);
                              setAcceptedTerms(false);
                            }
                          }}
                          modifiers={{
                            holiday: (date) => getPortugueseHolidays(date.getFullYear()).includes(format(date, 'yyyy-MM-dd')),
                            sunday: (date) => getDay(date) === 0
                          }}
                          modifiersStyles={{
                            holiday: { color: 'rgb(239 68 68)', fontWeight: 'bold' },
                            sunday: { color: 'rgb(156 163 175)' }
                          }}
                          className="rounded-md border"
                          locale={pt}
                        />
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-8 border-none shadow-sm">
                      <CardHeader className="pb-2 border-b border-border/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Procurar marcação por nome ou telemóvel..." 
                            value={agendaSearchTerm}
                            onChange={(e) => setAgendaSearchTerm(e.target.value)}
                            className="pl-10 rounded-xl border-none bg-muted/50 focus:bg-background transition-all"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {!user ? (
                          <div className="p-12 text-center space-y-6">
                            <Lock className="w-12 h-12 mx-auto text-muted-foreground/30" />
                            <div className="space-y-2">
                              <p className="text-muted-foreground">Acesso restrito a administradores.</p>
                              <Button onClick={handleLogin} className="bg-primary text-primary-foreground w-full max-w-xs">Fazer Login com Google</Button>
                            </div>
                          </div>
                        ) : !isAdmin ? (
                          <div className="p-12 text-center space-y-4">
                            <XCircle className="w-12 h-12 mx-auto text-destructive/30" />
                            <p className="text-muted-foreground">Não tem permissões de administrador ({user.email}).</p>
                            <Button variant="outline" onClick={handleLogout}>Sair</Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {/* Special Days Notice */}
                            {!isDateAvailable(selectedDate) && (
                              <div className="p-4 bg-primary/10 text-primary text-sm font-medium flex items-center gap-2">
                                <InfoIcon className="w-4 h-4" />
                                Dia Indisponível (Férias ou Descanso)
                              </div>
                            )}

                            {availableSlots
                              .filter(slot => {
                                if (!agendaSearchTerm) return true;
                                const appointment = appointments.find(
                                  app => app.date === format(selectedDate, 'yyyy-MM-dd') && app.time === slot && (app.status === 'booked' || app.status === 'pending')
                                );
                                if (!appointment) return false;
                                const term = agendaSearchTerm.toLowerCase();
                                return appointment.clientName.toLowerCase().includes(term) || appointment.clientPhone.includes(term);
                              })
                              .map((slot) => {
                                const appointment = appointments.find(
                                  app => app.date === format(selectedDate, 'yyyy-MM-dd') && app.time === slot && (app.status === 'booked' || app.status === 'pending')
                                );

                              return (
                                <div key={slot} className={cn(
                                  "flex items-center p-4 hover:bg-muted/50 transition-colors",
                                  appointment?.status === 'pending' && "bg-amber-50/50"
                                )}>
                                  <div className="w-20 font-mono font-bold text-muted-foreground/50">{slot}</div>
                                  <div className="flex-1">
                                    {appointment ? (
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-bold">{appointment.clientName}</p>
                                            <Badge variant="outline" className="text-[10px] py-0">{appointment.serviceName}</Badge>
                                            {appointment.status === 'pending' && (
                                              <Badge variant="secondary" className="text-[10px] py-0 bg-amber-100 text-amber-700 border-amber-200">Pendente</Badge>
                                            )}
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="h-6 w-6 text-destructive hover:bg-destructive/10 p-0"
                                              onClick={() => handleBlockContact(appointment.clientPhone, appointment.clientName)}
                                              title="Bloquear Cliente"
                                            >
                                              <Ban className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {appointment.clientPhone}
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          {appointment.status === 'pending' && (
                                            <Button 
                                              size="sm" 
                                              variant="default" 
                                              className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 rounded-lg flex items-center gap-1.5"
                                              onClick={() => handleConfirmAppointment(appointment.id)}
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              Confirmar
                                            </Button>
                                          )}
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => {
                                              setClientName(appointment.clientName);
                                              setClientPhone(appointment.clientPhone);
                                              const service = services.find(s => s.id === appointment.serviceId);
                                              if (service) setSelectedService(service);
                                              setManagedAppointment(appointment);
                                              setIsAdminMode(false);
                                              toast.info("A reagendar marcação de " + appointment.clientName + ". Escolha a nova data/hora.");
                                            }}
                                            title="Reagendar"
                                          >
                                            <CalendarIcon className="w-5 h-5" />
                                          </Button>
                                          {appointment.status === 'booked' && (
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={() => handleCompleteAppointment(appointment.id)}
                                            >
                                              <CheckCircle2 className="w-5 h-5" />
                                            </Button>
                                          )}
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                          >
                                            <XCircle className="w-5 h-5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground/30 italic text-sm">Livre</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Pedidos de Confirmação</h2>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {appointments.filter(a => a.status === 'pending').length} Pendentes
                    </Badge>
                  </div>

                  <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold">Data/Hora</TableHead>
                          <TableHead className="font-bold">Cliente</TableHead>
                          <TableHead className="font-bold">Serviço</TableHead>
                          <TableHead className="text-right font-bold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments
                          .filter(a => a.status === 'pending')
                          .sort((a, b) => {
                            const dateA = String(a.date || '');
                            const dateB = String(b.date || '');
                            const timeA = String(a.time || '');
                            const timeB = String(b.time || '');
                            return dateA.localeCompare(dateB) || timeA.localeCompare(timeB);
                          })
                          .map((app) => (
                            <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="font-bold">{format(parseISO(app.date), "dd/MM/yyyy")}</span>
                                  <span className="text-xs text-muted-foreground">{app.time}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold">{app.clientName}</span>
                                  <span className="text-xs text-muted-foreground">{app.clientPhone}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-medium">{app.serviceName || 'Corte'}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl h-9"
                                    onClick={() => handleCancelAppointment(app.id)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1.5" /> Rejeitar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 px-4"
                                    onClick={() => handleConfirmAppointment(app.id)}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {appointments.filter(a => a.status === 'pending').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-48 text-center">
                              <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                <CheckCircle2 className="w-10 h-10 opacity-20" />
                                <p>Não existem pedidos de confirmação pendentes.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Gestão de Serviços</h2>
                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                      <DialogTrigger render={<Button className="bg-primary text-primary-foreground" />}>
                        Novo Serviço
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                          <DialogDescription>Defina os detalhes do serviço que será oferecido aos clientes.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Nome do Serviço</Label>
                            <Input value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="Ex: Coloração" />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} placeholder="Breve descrição" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Preço (€)</Label>
                              <Input type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} placeholder="13.50" />
                            </div>
                            <div className="space-y-2">
                              <Label>Duração (min)</Label>
                              <Input type="number" value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})} placeholder="40" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddService} disabled={isAddingService}>
                            {isAddingService ? 'A guardar...' : 'Guardar Serviço'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card className="border-none shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <p className="font-bold">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </TableCell>
                            <TableCell>{service.duration} min</TableCell>
                            <TableCell>{service.price.toFixed(2)}€</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteService(service.id)}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold">Base de Dados de Clientes</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {isGoogleConnected ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-green-500 text-green-600 hover:bg-green-50 flex items-center gap-2"
                            onClick={handleImportGoogleContacts}
                            disabled={isImportingGoogle}
                          >
                            <Users className="w-4 h-4" />
                            {isImportingGoogle ? "A sincronizar..." : "Sincronizar Gmail"}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl text-muted-foreground hover:text-destructive"
                            onClick={handleDisconnectGoogle}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            Desconectar
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2"
                          onClick={handleConnectGoogle}
                          disabled={isLoggingIn}
                        >
                          <Users className="w-4 h-4" />
                          {isLoggingIn ? "A ligar..." : "Sincronizar com Gmail"}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2"
                        onClick={handleImportContacts}
                      >
                        <UserPlus className="w-4 h-4" />
                        Importar Local
                      </Button>
                      <Badge variant="outline" className="px-3 py-1 h-9">
                        {clients.length} Clientes
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Procurar por nome ou telemóvel..." 
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 bg-card"
                      />
                    </div>
                    <Select value={clientFilter} onValueChange={(val: any) => setClientFilter(val)}>
                      <SelectTrigger className="rounded-xl border-border/50 bg-card">
                        <SelectValue placeholder="Filtrar por categoria" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Todos os Clientes</SelectItem>
                        <SelectItem value="frequent">Clientes Frequentes (3+ visitas)</SelectItem>
                        <SelectItem value="inactive">Inativos (+3 meses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="border-none shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Cliente</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Última Marcação</TableHead>
                          <TableHead className="text-right">Total Visitas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client: any) => (
                          <TableRow key={client.phone}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>
                              <a 
                                href={`tel:${client.phone}`} 
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </a>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {client.count > 0 
                                ? format(parseISO(client.lastDate), "d 'de' MMM, yyyy", { locale: pt })
                                : client.isFromDb ? "Importado" : "Sem marcações"}
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                              <Badge variant="secondary">{client.count}</Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => {
                                  setClientName(client.name);
                                  setClientPhone(client.phone);
                                  setIsAdminMode(false);
                                  toast.info(`A preencher marcação para ${client.name}. Escolha a data e hora.`);
                                }}
                                title="Marcar para este cliente"
                              >
                                <CalendarIcon className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteClient(client.phone, client.name)}
                                title="Eliminar Cliente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleBlockContact(client.phone, client.name)}
                                title="Bloquear Cliente"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {clients.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Ainda não existem clientes registados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Blocked Contacts Section */}
                  <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-destructive" />
                      <h3 className="text-lg font-bold text-destructive">Contactos Bloqueados</h3>
                    </div>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telemóvel</TableHead>
                            <TableHead>Data do Bloqueio</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blockedContacts.map((contact: any) => (
                            <TableRow key={contact.phone}>
                              <TableCell className="font-medium">{contact.name}</TableCell>
                              <TableCell>{contact.phone}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(parseISO(contact.blockedAt), "d 'de' MMM, yyyy", { locale: pt })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-xl text-xs"
                                  onClick={() => handleUnblockContact(contact.phone)}
                                >
                                  Desbloquear
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {blockedContacts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Não existem contactos bloqueados.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Profile Data */}
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Dados do Profissional
                        </CardTitle>
                        <CardDescription>Gerencie as informações que aparecem no salão.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="prof-name">Nome Profissional</Label>
                            <Input 
                              id="prof-name" 
                              value={profile?.name || BUSINESS_CONFIG.professional} 
                              onChange={(e) => setProfile({...profile, name: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prof-phone">Telemóvel</Label>
                            <Input 
                              id="prof-phone" 
                              value={profile?.phone || BUSINESS_CONFIG.phone} 
                              onChange={(e) => setProfile({...profile, phone: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prof-address">Morada</Label>
                            <Input 
                              id="prof-address" 
                              value={profile?.address || BUSINESS_CONFIG.address} 
                              onChange={(e) => setProfile({...profile, address: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl">
                            Guardar Alterações
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Vacation Management */}
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          Gestão de Férias
                        </CardTitle>
                        <CardDescription>Adicione períodos em que o salão estará fechado.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Início</Label>
                              <Input 
                                type="date" 
                                value={newVacation.startDate} 
                                onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fim</Label>
                              <Input 
                                type="date" 
                                value={newVacation.endDate} 
                                onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição (Opcional)</Label>
                            <Input 
                              placeholder="Ex: Férias de Verão" 
                              value={newVacation.description} 
                              onChange={(e) => setNewVacation({...newVacation, description: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <Button 
                            onClick={handleAddVacation} 
                            disabled={isAddingVacation}
                            className="w-full bg-primary text-primary-foreground rounded-xl"
                          >
                            {isAddingVacation ? "A adicionar..." : "Adicionar Férias"}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Períodos Agendados</h4>
                          {vacations.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Nenhum período de férias registado.</p>
                          ) : (
                            <div className="space-y-2">
                              {vacations.map((v) => (
                                <div key={v.id} className="flex justify-between items-center p-3 bg-card border border-border rounded-xl shadow-sm">
                                  <div>
                                    <p className="font-bold text-sm">
                                      {format(parseISO(v.startDate), "d 'de' MMM", { locale: pt })} - {format(parseISO(v.endDate), "d 'de' MMM", { locale: pt })}
                                    </p>
                                    {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteVacation(v.id)}
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Advanced Settings */}
                  <div className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <BellRing className="w-5 h-5 text-primary" />
                          Configurações de Lembretes
                        </CardTitle>
                        <CardDescription>Ações globais para o sistema de notificações.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Reativar Lembretes</p>
                            <p className="text-xs text-muted-foreground">Define todos os lembretes de marcações ativas como "não enviados".</p>
                          </div>
                          <Dialog>
                            <DialogTrigger render={<Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto flex items-center gap-2" />}>
                              <RefreshCw className="w-4 h-4" />
                              Reativar Agora
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl">
                              <DialogHeader>
                                <DialogTitle>Confirmar Reativação</DialogTitle>
                                <DialogDescription>
                                  Tem a certeza que deseja reativar os lembretes para todas as marcações ativas? 
                                  Isto fará com que o sistema envie novos lembretes (24h antes para clientes e 1h antes para o profissional) mesmo que já tenham sido enviados anteriormente.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="flex gap-2 sm:justify-end mt-4">
                                <DialogClose render={<Button variant="ghost" className="rounded-xl" />}>
                                  Cancelar
                                </DialogClose>
                                <DialogClose render={<Button className="rounded-xl bg-primary" onClick={handleReactivateReminders} />}>
                                  Confirmar Reativação
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <Contact2 className="w-5 h-5 text-primary" />
                          Gestão de Contactos
                        </CardTitle>
                        <CardDescription>Importe ou sincronize a sua base de dados de clientes.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Sincronizar Gmail</p>
                            <p className="text-xs text-muted-foreground">Importe contactos diretamente da sua conta Google/Gmail.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto flex items-center gap-2"
                            onClick={handleImportGoogleContacts}
                            disabled={isImportingGoogle}
                          >
                            <Mail className="w-4 h-4" />
                            {isGoogleConnected ? "Sincronizar Gmail" : "Ligar Gmail"}
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Importar da Agenda</p>
                            <p className="text-xs text-muted-foreground">Adicione múltiplos contactos do seu telemóvel à base de dados.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto flex items-center gap-2"
                            onClick={handleImportContacts}
                          >
                            <Smartphone className="w-4 h-4" />
                            Importar da Agenda
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <Bell className="w-5 h-5 text-primary" />
                          Notificações Push
                        </CardTitle>
                        <CardDescription>Ative as notificações para receber lembretes e confirmações.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Estado das Notificações</p>
                            <p className="text-xs text-muted-foreground">
                              {notificationPermission === 'granted' 
                                ? "As notificações estão ativadas neste dispositivo." 
                                : notificationPermission === 'denied' 
                                ? "As notificações foram bloqueadas. Por favor, ative-as nas definições do navegador."
                                : "Ative as notificações para não perder as suas marcações."}
                            </p>
                          </div>
                          <Button 
                            variant={notificationPermission === 'granted' ? "outline" : "default"} 
                            className="rounded-xl w-full sm:w-auto flex items-center gap-2"
                            onClick={requestNotificationPermission}
                            disabled={notificationPermission === 'granted'}
                          >
                            <BellRing className="w-4 h-4" />
                            {notificationPermission === 'granted' ? "Ativadas" : "Ativar Notificações"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm border-destructive/20 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="text-xl font-heading flex items-center gap-2 text-destructive">
                          <Trash2 className="w-5 h-5" />
                          Zona de Perigo
                        </CardTitle>
                        <CardDescription>Ações irreversíveis para a sua conta e dados.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/50 rounded-2xl border border-destructive/20 gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-destructive">Apagar Conta e Dados</p>
                            <p className="text-xs text-muted-foreground">Apaga permanentemente o seu perfil, serviços, férias e todas as marcações.</p>
                          </div>
                          <Dialog>
                            <DialogTrigger render={<Button variant="destructive" className="rounded-xl w-full sm:w-auto shadow-lg shadow-destructive/20" />}>
                              Apagar Tudo
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-destructive">Apagar Permanentemente?</DialogTitle>
                                <DialogDescription>
                                  Esta ação é **irreversível**. Todos os seus dados, incluindo o perfil profissional, lista de serviços, períodos de férias e histórico de marcações serão eliminados imediatamente.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="bg-destructive/10 p-4 rounded-2xl text-destructive text-xs font-medium">
                                Atenção: Não poderá recuperar estes dados após a confirmação.
                              </div>
                              <DialogFooter className="flex gap-2 sm:justify-end mt-4">
                                <DialogClose render={<Button variant="ghost" className="rounded-xl" />}>
                                  Cancelar
                                </DialogClose>
                                <DialogClose render={<Button variant="destructive" className="rounded-xl" onClick={handleDeleteAccount} />}>
                                  Sim, Apagar Tudo
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        )}
      </main>

      {/* Success Dialog */}
      <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              <DialogHeader className="flex flex-col items-center pt-2">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="bg-amber-100 p-4 rounded-full mb-4"
                >
                  <Clock className="w-12 h-12 text-amber-600" />
                </motion.div>
                <DialogTitle className="text-3xl text-center font-heading">Pedido Enviado!</DialogTitle>
                <DialogDescription className="text-center pt-2 text-base">
                  Obrigado, <span className="font-bold text-foreground">{lastBooking?.clientName}</span>. O seu pedido para o dia {lastBooking?.date ? format(parseISO(lastBooking.date), "d 'de' MMMM", { locale: pt }) : ''} às {lastBooking?.time} foi enviado para aprovação.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted/50 p-5 rounded-2xl space-y-4 text-sm border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Serviço:</span> 
                  <span className="font-semibold text-base">{lastBooking?.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço:</span> 
                  <span className="font-bold text-lg text-primary">{lastBooking?.price?.toFixed(2)}€</span>
                </div>
                
                <div className="pt-3 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Pagamento no Local:</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1.5 rounded-lg border border-border/50">
                      <div className="w-4 h-4 flex items-center justify-center bg-emerald-100 rounded-full text-[10px] font-bold text-emerald-700">€</div>
                      <span className="text-[10px] font-bold">DINHEIRO</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1.5 rounded-lg border border-border/50">
                      <img src="https://logo.clearbit.com/mbway.pt" alt="MB" className="w-3 h-3 object-contain" referrerPolicy="no-referrer" />
                      <span className="text-[10px] font-bold">MBWAY</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground shrink-0">Local:</span> 
                    <a 
                      href={BUSINESS_CONFIG.mapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-right text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      {BUSINESS_CONFIG.address}
                    </a>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 pt-2">
                <Button 
                  variant="default"
                  className="w-full rounded-2xl py-7 bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-base font-bold"
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    window.open(BUSINESS_CONFIG.mapsLink, '_blank');
                  }}
                >
                  <Navigation className="w-5 h-5" />
                  DIREÇÃO
                </Button>

                <Button 
                  variant="outline"
                  className="w-full rounded-2xl py-7 border-green-500 text-green-600 hover:bg-green-50 flex items-center justify-center gap-3 text-base font-bold"
                  onClick={() => {
                    triggerHaptic(ImpactStyle.Medium);
                    const dateStr = lastBooking?.date ? format(parseISO(lastBooking.date), "d 'de' MMMM", { locale: pt }) : '';
                    const message = `Olá Sérgio, acabei de fazer um pedido de marcação para o dia ${dateStr} às ${lastBooking?.time}. Gostaria de confirmar se é possível.`;
                    window.open(`https://wa.me/${BUSINESS_CONFIG.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                >
                  <WhatsAppIcon className="w-6 h-6" />
                  FALAR NO WHATSAPP
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="rounded-2xl py-6 border-primary/20 text-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 h-auto"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-xs">Partilhar</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="rounded-2xl py-6 border-primary/20 text-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 h-auto"
                    onClick={handleAddToCalendar}
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-xs">Calendário</span>
                  </Button>
                </div>
                <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                  <Button 
                    variant="ghost"
                    className="w-full rounded-2xl py-6 text-primary font-bold bg-primary/5"
                    onClick={() => setBookingSuccess(false)}
                  >
                    Excelente!
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="w-full rounded-2xl py-6 text-destructive hover:bg-destructive/5 font-medium text-xs"
                    onClick={() => {
                      if (lastBooking) {
                        const appointmentId = `${lastBooking.date}_${lastBooking.time}`;
                        const found = appointments.find(a => a.id === appointmentId);
                        if (found) {
                          setManagedAppointment(found);
                          setBookingSuccess(false);
                          toast.info("Pode agora cancelar ou reagendar a sua marcação.");
                        } else {
                          setBookingSuccess(false);
                          toast.error("Não foi possível encontrar a marcação para cancelar.");
                        }
                      }
                    }}
                  >
                    Enganei-me / Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="max-w-4xl mx-auto px-4 py-12 border-t border-border text-center text-muted-foreground text-sm pb-32">
        <div className="flex justify-center gap-6 mb-4">
          <button onClick={() => setCurrentView('privacy')} className="hover:text-primary transition-colors">Política de Privacidade</button>
          <button onClick={() => setCurrentView('terms')} className="hover:text-primary transition-colors">Políticas e Regras</button>
        </div>
        <p>&copy; {new Date().getFullYear()} {BUSINESS_CONFIG.name}. Todos os direitos reservados.</p>
        <p className="mt-1 text-[10px] uppercase tracking-widest opacity-50">Propriedade Intelectual de Sérgio Ramos.</p>
      </footer>

      {/* iOS Style Bottom Tab Bar - Hidden on Desktop Screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 pb-safe px-safe">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-around">
          <button 
            onClick={() => { 
              setIsAdminMode(false); 
              setCurrentView('main'); 
              triggerHaptic(ImpactStyle.Light);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              !isAdminMode && currentView === 'main' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Reservar</span>
          </button>

          {!isAdminMode && (
            <button 
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setManagedAppointment(null);
                setCurrentView('my-bookings');
              }}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                currentView === 'my-bookings' ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Clock className="w-6 h-6" />
              <span className="text-[10px] font-medium">Minhas</span>
            </button>
          )}

          {!isAdminMode && (
            <button 
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setCurrentView('profile');
              }}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                !isAdminMode && currentView === 'profile' ? "text-primary" : "text-muted-foreground"
              )}
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          )}

          {user && (
            <button 
              onClick={() => { 
                setIsAdminMode(true); 
                setCurrentView('main'); 
                triggerHaptic(ImpactStyle.Light);
              }}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isAdminMode ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-medium">Gestão</span>
            </button>
          )}
        </div>
      </nav>
      {/* Botão Flutuante do WhatsApp para Clientes */}
      {!isAdminMode && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic(ImpactStyle.Medium);
            window.open(`https://wa.me/${BUSINESS_CONFIG.phone.replace(/\D/g, '')}`, '_blank');
          }}
          className="fixed bottom-28 right-6 z-[60] bg-green-500 text-white p-4 rounded-full shadow-2xl shadow-green-500/40 flex items-center justify-center border-2 border-white/20 backdrop-blur-sm"
          title="Falar no WhatsApp"
        >
          <WhatsAppIcon className="w-7 h-7" />
        </motion.button>
      )}

      {/* Smart Assistant - Gemini Function Calling */}
      <SmartAssistant />

      {/* Diálogo de Confirmação de Eliminação de Cliente */}
      <Dialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl mx-4">
          <DialogHeader>
            <DialogTitle>Eliminar {clientToDelete?.name}?</DialogTitle>
            <DialogDescription>
              Deseja apagar apenas o registo de cliente ou também todo o histórico de marcações associado a este contacto?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => confirmDeleteClient(false)} className="rounded-xl w-full sm:w-auto">
              Apenas Registo
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteClient(true)} className="rounded-xl w-full sm:w-auto">
              Eliminar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" expand={false} richColors />
    </div>
  );
}
