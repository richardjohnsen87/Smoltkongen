import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const aquaMindDarkBg = require('../../assets/images/aquamind-dark-bg.png');
const aquaMindLogo = require('../../assets/images/aquamind-logo-transparent.png');

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as ImageManipulator from 'expo-image-manipulator';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';


const supabaseUrl = 'https://dcfpamwtevubzzzmfftb.supabase.co';
const supabaseKey = 'sb_publishable_ROm8HQGhzmHm00aTc1Z1WA_LWO49s_n';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

type DisplayMessage = {
  role: 'assistant' | 'user';
  text: string;
};

type LogItem = {
  id: string;
  user_id: string;
  created_at?: string;
  tank_name: string;
  image_url?: string | null;
  video_url?: string | null;
  messages_json: DisplayMessage[];
};

type UserProfile = {
  id: string;
  is_admin: boolean;
  subscription_active: boolean;
  ai_usage_limit: number;
  ai_usage_used: number;
};

export default function HomeScreen() {
  const [session, setSession] = useState<any>(null);

const [confirmPassword, setConfirmPassword] = useState('');
const [isRegisterMode, setIsRegisterMode] = useState(false);
const [resetModalVisible, setResetModalVisible] = useState(false);
const [resetEmail, setResetEmail] = useState('');


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [image, setImage] = useState<string | null>(null);
const [replyImage, setReplyImage] = useState<string | null>(null);
const [replyBase64Image, setReplyBase64Image] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
const [aiQuestion, setAiQuestion] = useState('');

  const [tankName, setTankName] = useState('');
  const [filterTank, setFilterTank] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [conversation, setConversation] = useState<DisplayMessage[]>([]);
  const [apiConversation, setApiConversation] = useState<any[]>([]);
  const [history, setHistory] = useState<LogItem[]>([]);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
const [settingsVisible, setSettingsVisible] = useState(false);
const [historyVisible, setHistoryVisible] = useState(false);
const [learningVisible, setLearningVisible] = useState(false);
const [learningMode, setLearningMode] = useState<'topics' | 'subtopics' | 'lesson' | 'quiz'>('topics');
const [selectedLearningTopic, setSelectedLearningTopic] = useState<any>(null);
const [selectedLearningSubtopic, setSelectedLearningSubtopic] = useState<any>(null);
const [learningContent, setLearningContent] = useState('');
const [learningAnswer, setLearningAnswer] = useState('');
const [quizQuestion, setQuizQuestion] = useState('');
const [quizFeedback, setQuizFeedback] = useState('');
const [quizResult, setQuizResult] = useState<{ percent: number; passed: boolean } | null>(null);
const [quizStep, setQuizStep] = useState(0);
const [quizCorrect, setQuizCorrect] = useState(0);
const [quizUsedAreas, setQuizUsedAreas] = useState<string[]>([]);
const [quizFinished, setQuizFinished] = useState(false);
const [quizAwaitingNext, setQuizAwaitingNext] = useState(false);
const [learningExtraQuestion, setLearningExtraQuestion] = useState('');
const [learningExtraAnswer, setLearningExtraAnswer] = useState('');
const [historySearch, setHistorySearch] = useState('');
const [profile, setProfile] = useState<UserProfile | null>(null);
const [paywallVisible, setPaywallVisible] = useState(false);
const [infoModalVisible, setInfoModalVisible] = useState(false);
const [infoModalTitle, setInfoModalTitle] = useState('');
const [infoModalText, setInfoModalText] = useState('');

const systemPrompt = `
Du er AquaMind.

Du oppfører deg som en rolig, jordnær og svært erfaren kollega i oppdrettsnæringen. Du har bred praktisk erfaring fra hele produksjonen: rogn, klekkeri, yngel, smolt, postsmolt, matfisk, RAS, sjøanlegg, fiskehelse, drift, fôring, atferd og vannmiljø.

Du skal svare som en erfaren røkter eller driftsperson som har sett mye i praksis, ikke som en professor, forsker eller chatbot.

Bruk naturlig språk. Ikke bruk punktlister eller rapportspråk med mindre brukeren tydelig ber om det. Svar rolig, praktisk og menneskelig, som en kollega på anlegget.

Forklar hva observasjonen kan tyde på, hva som virker normalt eller unormalt, og hva brukeren bør følge med på videre. Ikke overdriv, ikke skap unødvendig uro, og ikke presenter usikre vurderinger som fakta.

Hvis bildet eller informasjonen er for dårlig til å vurdere sikkert, si det ærlig og rolig. Be gjerne om én konkret opplysning hvis det trengs, for eksempel om appetitt, oksygen, dødfisk, atferd eller nylige endringer.

AquaMind er et hjelpemiddel. Ved mistanke om alvorlig sykdom, høy dødelighet, kraftig stress eller tydelige velferdsproblemer skal du anbefale manuell kontroll og kontakt med ansvarlig fiskehelsepersonell.
`;


useEffect(() => {
    loadSavedEmail();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadLogs();
      loadProfile();
    } else {
      setHistory([]);
      setProfile(null);
    }
  }, [session]);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (error) {
      console.log('Feil ved lasting av e-post:', error);
    }
  };

  const saveEmail = async (value: string) => {
    try {
      await AsyncStorage.setItem('saved_email', value);
    } catch (error) {
      console.log('Feil ved lagring av e-post:', error);
    }
  };

  const loadLogs = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Feil ved lasting', error.message);
      return;
    }

    setHistory((data as LogItem[]) || []);
  };

const loadProfile = async () => {
  const userId = session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,is_admin,subscription_active,ai_usage_limit,ai_usage_used')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.log('Feil ved lasting av profil:', error.message);
    return null;
  }

  const loadedProfile = (data as UserProfile | null) || null;
  setProfile(loadedProfile);
  return loadedProfile;
};

const canUseAI = async () => {
  const userId = session?.user?.id;
  if (!userId) return false;

  let currentProfile = profile;

  if (!currentProfile) {
    currentProfile = await loadProfile();
  }

  if (!currentProfile) {
    setPaywallVisible(true);
    return false;
  }

  if (currentProfile.is_admin) {
    return true;
  }

  if (!currentProfile.subscription_active) {
    setPaywallVisible(true);
    return false;
  }

  const used = currentProfile.ai_usage_used || 0;
  const limit = currentProfile.ai_usage_limit || 0;

  if (used >= limit) {
    setPaywallVisible(true);
    return false;
  }

  return true;
};

const incrementAIUsage = async () => {
  const userId = session?.user?.id;
  if (!userId || profile?.is_admin) return;

  const nextUsage = (profile?.ai_usage_used || 0) + 1;

  const { error } = await supabase
    .from('profiles')
    .update({ ai_usage_used: nextUsage })
    .eq('id', userId);

  if (!error) {
    setProfile((prev) =>
      prev ? { ...prev, ai_usage_used: nextUsage } : prev
    );
  }
};

const signUp = async () => {
  if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
    Alert.alert('Feil', 'Fyll inn alle feltene');
    return;
  }

  if (password.length < 8) {
    Alert.alert('Feil', 'Passordet må være minst 8 tegn');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Feil', 'Passordene er ikke like');
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    Alert.alert('Feil ved registrering', error.message);
    return;
  }

  Alert.alert(
    'Konto opprettet',
    'Brukeren er registrert. Du kan nå logge inn.'
  );

  setIsRegisterMode(false);
  setConfirmPassword('');
};

const signIn = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Feil', 'Skriv inn e-post og passord');
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    Alert.alert('Feil ved innlogging', error.message);
    return;
  }

  await saveEmail(email.trim());
};


const showInfo = (title: string, message: string) => {
  setInfoModalTitle(title);
  setInfoModalText(message);
  setInfoModalVisible(true);
};

const startSubscription = () => {
  showInfo(
    'Abonnement kommer',
    'Her kobles RevenueCat/App Store-abonnement inn i neste steg. Planen er AquaMind Pro til 199 kr per måned med automatisk fornyelse til abonnementet sies opp i App Store-innstillinger.'
  );
};

const restorePurchases = () => {
  showInfo(
    'Gjenopprett kjøp',
    'Når RevenueCat er koblet til, vil denne knappen hente tidligere kjøp fra App Store eller Google Play.'
  );
};


const showAccountInfo = (title: string, message: string) => {
  setSettingsVisible(false);

  setTimeout(() => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => setSettingsVisible(true),
      },
    ]);
  }, 250);
};


const openAquaMindSite = async () => {
  const url = 'https://eloquent-tarsier-51870e.netlify.app';

  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      return;
    }

    Alert.alert('Kunne ikke åpne siden', url);
  } catch (error: any) {
    Alert.alert('Kunne ikke åpne siden', error?.message || url);
  }
};

const openPrivacyPolicy = () => {
  openAquaMindSite();
};

const openTermsOfService = () => {
  openAquaMindSite();
};

const openSupport = () => {
  openAquaMindSite();
};

const openAIDisclaimer = () => {
  openAquaMindSite();
};


const resetPassword = async () => {
  if (!resetEmail.trim()) {
    Alert.alert('Feil', 'Skriv inn e-post');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());

  if (error) {
    Alert.alert('Feil', error.message);
    return;
  }

  Alert.alert(
    'Sjekk e-posten din',
    'Vi har sendt deg en lenke for å lage nytt passord.'
  );

  setResetModalVisible(false);
  setResetEmail('');
};



  const signOut = async () => {
    await supabase.auth.signOut();

    setImage(null);
    setBase64Image(null);
    setConversation([]);
    setApiConversation([]);
    setReplyText('');
    setReplyImage(null);
    setReplyBase64Image(null);
    setTankName('');
    setFilterTank('');
    setCurrentLogId(null);
  setReplyImage(null);
  setReplyBase64Image(null);
    setSelectedLog(null);
    setLogModalVisible(false);
    setHistory([]);
  };

  const deleteAccount = async () => {
    Alert.alert(
      'Slett konto',
      'Er du sikker? Dette sletter loggene dine i AquaMind. Selve Supabase-brukeren må slettes via backend/Edge Function før lansering.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            const userId = session?.user?.id;
            if (!userId) return;

            const { error } = await supabase
              .from('logs')
              .delete()
              .eq('user_id', userId);

            if (error) {
              Alert.alert('Feil', error.message);
              return;
            }

            setHistory([]);
            await signOut();
            Alert.alert('Konto', 'Logger er slettet, og du er logget ut. Full kontosletting kobles til backend før App Store-lansering.');
          },
        },
      ]
    );
  };


  const deleteLog = async (item: LogItem) => {
    Alert.alert('Slett logg', 'Vil du slette denne loggen?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('logs')
            .delete()
            .eq('id', item.id)
            .eq('user_id', session.user.id);

          if (error) {
            Alert.alert('Feil', error.message);
            return;
          }

          setSelectedLog((prev) => (prev?.id === item.id ? null : prev));
          setHistory((prev) => prev.filter((log) => log.id !== item.id));
          await loadLogs();
        },
      },
    ]);
  };


  const formatDateTime = (value?: string) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistory = useMemo(() => {
    const tankFilter = filterTank.trim().toLowerCase();
    const search = historySearch.trim().toLowerCase();

    return history.filter((item) => {
      const tank = (item.tank_name || '').toLowerCase();
      const date = (item.created_at || '').toLowerCase();
      const messages = (item.messages_json || [])
        .map((m) => m.text || '')
        .join(' ')
        .toLowerCase();

      const matchesTank = !tankFilter || tank.includes(tankFilter);
      const matchesSearch =
        !search ||
        tank.includes(search) ||
        date.includes(search) ||
        messages.includes(search);

      return matchesTank && matchesSearch;
    });
  }, [history, filterTank, historySearch]);

  const getStatusFromText = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('status: avvik')) return 'Avvik';
    if (lower.includes('status: obs')) return 'Obs';
    if (lower.includes('status: ikke relevant')) return 'Ikke relevant';
    if (lower.includes('status: normal')) return 'Normal';
    return 'Ukjent';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Normal':
        return { backgroundColor: '#e8f5e9', color: '#1b5e20' };
      case 'Obs':
        return { backgroundColor: '#fff8e1', color: '#8d6e00' };
      case 'Avvik':
        return { backgroundColor: '#ffebee', color: '#b71c1c' };
      case 'Ikke relevant':
        return { backgroundColor: '#eceff1', color: '#455a64' };
      default:
        return { backgroundColor: '#f2f2f2', color: '#555' };
    }
  };

  const removeStatusLine = (text: string) => {
    return text.replace(/^Status:\s*(Normal|Obs|Avvik|Ikke relevant)\s*/i, '').trim();
  };

  const makeId = () => Date.now().toString();


const saveLogToSupabase = async (log: LogItem) => {
    const { error } = await supabase.from('logs').insert(log);

    if (error) {
      Alert.alert('Feil ved lagring', error.message);
      return false;
    }

    return true;
  };

  const updateLogInSupabase = async (logId: string, messages: DisplayMessage[]) => {
    const { error } = await supabase
      .from('logs')
      .update({ messages_json: messages })
      .eq('id', logId)
      .eq('user_id', session.user.id);

    if (error) {
      Alert.alert('Feil ved oppdatering', error.message);
      return false;
    }

    return true;
  };

  const deleteAllLogs = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    Alert.alert('Slett historikk', 'Er du sikker på at du vil slette all historikk?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('logs')
            .delete()
            .eq('user_id', userId);

          if (error) {
            Alert.alert('Feil', error.message);
            return;
          }

          setHistory([]);
        },
      },
    ]);
  };

  const deleteOneLog = async (logId: string) => {
    if (!session?.user?.id) return;

    Alert.alert('Slett logg', 'Vil du slette denne historikken?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('logs')
            .delete()
            .eq('id', logId)
            .eq('user_id', session.user.id);

          if (error) {
            Alert.alert('Feil', error.message);
            return;
          }

          setHistory((prev) => prev.filter((item) => item.id !== logId));

          if (selectedLog?.id === logId) {
            setSelectedLog(null);
            setLogModalVisible(false);
            setHistoryVisible(true);
          }
        },
      },
    ]);
  };

  const openLog = (item: LogItem) => {
    setSelectedLog(item);
    setHistoryVisible(false);
    setTimeout(() => {
      setLogModalVisible(true);
    }, 250);
  };

  const takePhoto = async () => {
  try {
    

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Ingen tilgang', 'Kamera-tilgang ble ikke gitt.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: false,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const converted = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      setImage(converted.uri);
      setBase64Image('data:image/jpeg;base64,' + (converted.base64 || ''));

        setConversation([]);
      setApiConversation([]);
      setReplyText('');
      setCurrentLogId(null);
    }
  } catch (error: any) {
    Alert.alert('Feil i Legg til bilde', error?.message || 'Ukjent feil');
  }
};

const pickImageFromLibrary = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Ingen tilgang', 'Bildebibliotek-tilgang ble ikke gitt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: false,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const converted = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      setImage(converted.uri);
      setBase64Image('data:image/jpeg;base64,' + (converted.base64 || ''));

        setConversation([]);
      setApiConversation([]);
      setReplyText('');
      setCurrentLogId(null);
    }
  } catch (error: any) {
    Alert.alert('Feil i bibliotek', error?.message || 'Ukjent feil');
  }
};



const closeConversation = () => {
  setImage(null);
  setBase64Image(null);
  setConversation([]);
  setApiConversation([]);
  setReplyText('');
  setAiQuestion('');
  setTankName('');
  setCurrentLogId(null);
  setReplyImage(null);
  setReplyBase64Image(null);
};




const learningTopics = [
  {
    title: 'Smolt',
    description: 'Smoltifisering, atferd, stress, appetitt, vannmiljø og overgang mot sjø.',
    subtopics: [
      'Hva er god smolt?',
      'Smoltifisering forklart enkelt',
      'Stress og atferd hos smolt',
      'Appetitt og fôrrespons',
      'Vannkvalitet for smolt',
      'Mørk fisk og varselsignaler',
      'Sortering og håndtering',
      'Overgang til sjø',
      'Typiske feil i smoltfasen',
    ],
  },
  {
    title: 'Matfisk',
    description: 'Daglig drift, appetitt, velferd, tilvekst, miljø, avvik og observasjoner i sjø.',
    subtopics: [
      'Daglig tilsyn i merd',
      'Fôring og appetitt',
      'Stress og atferd',
      'Dødfisk og avvik',
      'Oksygen og miljø',
      'Sykdomstegn',
      'Merdmiljø',
      'Håndtering og behandling',
      'Tilvekst og kondisjon',
      'Typiske feil i matfiskfasen',
    ],
  },
  {
    title: 'RAS',
    description: 'Vannbehandling, biofilter, CO₂, O₂, pH, nitritt, ammoniakk og stabil drift.',
    subtopics: [
      'Hvordan RAS fungerer',
      'Biofilter',
      'CO₂',
      'Oksygen',
      'pH og alkalitet',
      'Nitritt og ammoniakk',
      'Sirkulasjon og flow',
      'UV og ozon',
      'Alarmrutiner',
      'Typiske RAS-feil',
    ],
  },
  {
    title: 'Vannkvalitet',
    description: 'Oksygen, CO₂, temperatur, pH, salinitet og hvordan fisken påvirkes.',
    subtopics: [
      'Oksygen',
      'CO₂',
      'Temperatur',
      'pH',
      'Salinitet',
      'Turbiditet og partikler',
      'Hvordan vannkvalitet påvirker appetitt',
      'Tegn på dårlig vannmiljø',
      'Tiltak ved avvik',
    ],
  },
  {
    title: 'Fiskehelse',
    description: 'Tidlige tegn, atferd, gjeller, sår, mørk fisk, dødelighet og når man bør reagere.',
    subtopics: [
      'Tidlige tegn på sykdom',
      'Gjelleproblemer',
      'Sår og hud',
      'Mørk fisk',
      'Unormal atferd',
      'Dødelighet og mønster',
      'Når kontakte fiskehelsepersonell',
      'Praktisk observasjon i hverdagen',
    ],
  },
  {
    title: 'Fôring',
    description: 'Appetitt, fôrrespons, temperatur, miljø, atferd og justeringer.',
    subtopics: [
      'God fôrrespons',
      'Dårlig appetitt',
      'Temperatur og fôring',
      'Oksygen og fôring',
      'Atferd under fôring',
      'Overfôring og underfôring',
      'Fôringsstrategi',
      'Når stoppe eller justere fôring',
    ],
  },
  {
    title: 'Drift',
    description: 'Daglige rutiner, logging, prioritering, avvik og god røkterpraksis.',
    subtopics: [
      'Daglig runde',
      'Hva bør logges?',
      'Avvikshåndtering',
      'Prioritering i hektisk drift',
      'Kommunikasjon i team',
      'Dokumentasjon',
      'God røkterpraksis',
      'Vanlige driftsfeil',
    ],
  },
  {
    title: 'Beredskap',
    description: 'Lav O₂, økt dødelighet, teknisk feil, stress, avvik og første tiltak.',
    subtopics: [
      'Lavt oksygen',
      'Høy dødelighet',
      'Teknisk feil',
      'Akutt stress',
      'Dårlig vannkvalitet',
      'Rømmingsfare',
      'Hva gjør man først?',
      'Varsling og dokumentasjon',
    ],
  },
  {
    title: 'Biologi',
    description: 'Atferd, stress, gjeller, osmoregulering, vekst og hvordan fisken fungerer.',
    subtopics: [
      'Fiskens atferd',
      'Stressrespons',
      'Gjeller',
      'Osmoregulering',
      'Vekst',
      'Appetitt og metabolisme',
      'Velferd',
      'Biologi i praktisk drift',
    ],
  },
];

const openLearningHome = () => {
  setLearningMode('topics');
  setSelectedLearningTopic(null);
  setSelectedLearningSubtopic(null);
  setLearningContent('');
  setLearningAnswer('');
  setQuizQuestion('');
  setQuizFeedback('');
  setQuizStep(0);
  setQuizCorrect(0);
  setQuizUsedAreas([]);
  setQuizFinished(false);
  setQuizAwaitingNext(false);
  setQuizResult(null);
  setLearningVisible(true);
};

const selectLearningTopic = (topic: any) => {
  setSelectedLearningTopic(topic);
  setSelectedLearningSubtopic(null);
  setLearningContent('');
  setLearningAnswer('');
  setQuizQuestion('');
  setQuizFeedback('');
  setQuizStep(0);
  setQuizCorrect(0);
  setQuizUsedAreas([]);
  setQuizFinished(false);
  setQuizAwaitingNext(false);
  setQuizResult(null);
  setLearningMode('subtopics');
};

const startLearningLesson = async (subtopic: string) => {
  if (!selectedLearningTopic) return;

  const allowed = await canUseAI();
  if (!allowed) return;

  setSelectedLearningSubtopic(subtopic);
  setLearningContent('');
  setLearningMode('lesson');
  setLoading(true);

  try {
    const aiText = await sendToAI([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          'Du er i Lær Oppdrett-delen av AquaMind. Tema: ' +
          selectedLearningTopic.title +
          '. Underemne: ' +
          subtopic +
          '. Forklar dette som en erfaren og jordnær oppdrettskollega. Skriv som praktisk opplæring, ikke som en akademisk artikkel. Bruk ren tekst uten piler, ASCII-tegninger eller bilder. Ta med hva man bør se etter i praksis, vanlige feil, og hva som er viktig å huske. Avslutt med ett oppfølgingsspørsmål brukeren kan tenke på.'
      },
    ], tankName.trim());

    setLearningContent(aiText);
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke hente opplæring.');
    setLearningMode('subtopics');
  } finally {
    setLoading(false);
  }
};

const getQuizFocusAreas = (topicTitle: string) => {
  const map: Record<string, string[]> = {
    Smolt: [
      'smoltifisering',
      'appetitt og fôrrespons',
      'stress og atferd',
      'vannkvalitet',
      'håndtering og sortering',
      'mørk fisk og varselsignaler',
      'overgang til sjø',
      'temperatur og oksygen',
      'typiske driftsfeil',
      'praktisk vurdering før utsett',
    ],
    Matfisk: [
      'daglig tilsyn',
      'fôring og appetitt',
      'stress og atferd',
      'dødfisk og avvik',
      'oksygen og miljø',
      'sykdomstegn',
      'merdmiljø',
      'håndtering og behandling',
      'tilvekst og kondisjon',
      'praktiske driftsprioriteringer',
    ],
    RAS: [
      'biofilter',
      'CO₂',
      'oksygen',
      'pH og alkalitet',
      'nitritt og ammoniakk',
      'sirkulasjon og flow',
      'partikler og vannkvalitet',
      'UV og ozon',
      'alarmrutiner',
      'praktiske RAS-feil',
    ],
    Vannkvalitet: [
      'oksygen',
      'CO₂',
      'temperatur',
      'pH',
      'salinitet',
      'partikler og turbiditet',
      'appetitt og vannmiljø',
      'atferdstegn ved avvik',
      'tiltak ved dårlig vann',
      'sammenheng mellom flere vannparametere',
    ],
    Fiskehelse: [
      'tidlige sykdomstegn',
      'gjeller',
      'sår og hud',
      'mørk fisk',
      'unormal atferd',
      'dødelighetsmønster',
      'fiskevelferd',
      'når kontakte fiskehelsepersonell',
      'praktisk observasjon',
      'avvikshåndtering',
    ],
    Fôring: [
      'god fôrrespons',
      'dårlig appetitt',
      'temperatur og fôring',
      'oksygen og fôring',
      'atferd under fôring',
      'overfôring',
      'underfôring',
      'justering av fôr',
      'miljøpåvirkning',
      'praktiske vurderinger',
    ],
    Drift: [
      'daglig runde',
      'logging',
      'avvik',
      'prioritering',
      'teamkommunikasjon',
      'dokumentasjon',
      'rutiner',
      'risikovurdering',
      'praktisk røkting',
      'vanlige driftsfeil',
    ],
    Beredskap: [
      'lavt oksygen',
      'høy dødelighet',
      'teknisk feil',
      'akutt stress',
      'dårlig vannkvalitet',
      'varsling',
      'første tiltak',
      'dokumentasjon',
      'prioritering under press',
      'oppfølging etter hendelse',
    ],
    Biologi: [
      'atferd',
      'stressrespons',
      'gjeller',
      'osmoregulering',
      'vekst',
      'appetitt og metabolisme',
      'velferd',
      'temperaturpåvirkning',
      'oksygenbehov',
      'biologi i drift',
    ],
  };

  return map[topicTitle] || [
    'observasjon',
    'atferd',
    'vannkvalitet',
    'fôring',
    'helse',
    'drift',
    'avvik',
    'tiltak',
    'beredskap',
    'praktisk vurdering',
  ];
};

const generateQuizQuestion = async (topicTitle: string, step: number) => {
  const quizSeed = new Date().toISOString() + '-' + Math.random();
  const focusAreas = getQuizFocusAreas(topicTitle);
  const focusArea = focusAreas[(step - 1) % focusAreas.length];
  const usedText = quizUsedAreas.length ? quizUsedAreas.join(', ') : 'ingen ennå';

  const question = await sendToAI([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content:
        'Lag spørsmål ' +
        step +
        ' av 10 i en praktisk quiz om ' +
        topicTitle +
        '. Hovedfokus for dette spørsmålet skal være: ' +
        focusArea +
        '. Tidligere fokusområder i denne quizen: ' +
        usedText +
        '. Ikke lag et spørsmål som handler om samme ting som tidligere spørsmål. Quizen skal dekke et bredt spekter av hele temaet, ikke bare utseende eller ett snevert undertema. Varier mellom observasjon, drift, vannkvalitet, atferd, beredskap, tiltak, biologi og praktiske vurderinger der det passer. Spørsmålet skal være konkret, praktisk og relevant for røkting. Lag kun ett spørsmål. Ikke ta med fasit. Bruk denne økt-ID-en for variasjon: ' +
        quizSeed
    },
  ], tankName.trim());

  setQuizUsedAreas((prev) => [...prev, focusArea]);
  setQuizQuestion(question.trim());
};


const startLearningQuiz = async () => {
  if (!selectedLearningTopic) return;

  const allowed = await canUseAI();
  if (!allowed) return;

  setLearningMode('quiz');
  setQuizStep(1);
  setQuizCorrect(0);
  setQuizUsedAreas([]);
  setQuizFinished(false);
  setQuizAwaitingNext(false);
  setQuizResult(null);
  setQuizFeedback('');
  setQuizResult(null);
  setLearningAnswer('');
  setQuizQuestion('');
  setLoading(true);

  try {
    await generateQuizQuestion(selectedLearningTopic.title, 1);
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke starte quiz.');
    setLearningMode('subtopics');
  } finally {
    setLoading(false);
  }
};

const submitLearningQuizAnswer = async () => {
  if (!selectedLearningTopic || !quizQuestion.trim()) return;

  if (!learningAnswer.trim()) {
    Alert.alert('Svar mangler', 'Skriv et kort svar først.');
    return;
  }

  setLoading(true);

  try {
    const feedback = await sendToAI([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          'Du vurderer en quiz i AquaMind. Tema: ' +
          selectedLearningTopic.title +
          '. Spørsmål: ' +
          quizQuestion +
          '. Brukerens svar: ' +
          learningAnswer.trim() +
          '. Vurder svaret praktisk og rettferdig. Start svaret nøyaktig med "RIKTIG:" hvis svaret er godt nok, eller "FEIL:" hvis det ikke er godt nok. Forklar kort og jordnært hva som var riktig eller manglet.'
      },
    ], tankName.trim());

    const wasCorrect = feedback.trim().toUpperCase().startsWith('RIKTIG:');
    const newCorrect = wasCorrect ? quizCorrect + 1 : quizCorrect;
    setQuizCorrect(newCorrect);

    if (quizStep >= 10) {
      const percent = Math.round((newCorrect / 10) * 100);
      const passed = percent >= 70;

      setQuizResult({ percent, passed });
      setQuizFeedback(feedback);
      setQuizFinished(true);
      setQuizAwaitingNext(false);
      setLearningAnswer('');
      return;
    }

    setQuizFeedback(feedback);
    setQuizAwaitingNext(true);
    setLearningAnswer('');
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke vurdere svaret.');
  } finally {
    setLoading(false);
  }
};

const goToNextQuizQuestion = async () => {
  if (!selectedLearningTopic) return;

  const nextStep = quizStep + 1;
  setQuizStep(nextStep);
  setQuizQuestion('');
  setQuizFeedback('');
  setLearningAnswer('');
  setQuizAwaitingNext(false);
  setLoading(true);

  try {
    await generateQuizQuestion(selectedLearningTopic.title, nextStep);
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke hente neste spørsmål.');
  } finally {
    setLoading(false);
  }
};


const askLearningExtraQuestion = async () => {
  if (!selectedLearningTopic || !learningExtraQuestion.trim()) {
    Alert.alert('Spørsmål mangler', 'Skriv et spørsmål først.');
    return;
  }

  const allowed = await canUseAI();
  if (!allowed) return;

  setLoading(true);
  setLearningExtraAnswer('');

  try {
    const response = await sendToAI([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          'Du er i Lær Oppdrett-delen av AquaMind. Tema: ' +
          selectedLearningTopic.title +
          '. Brukeren spør: ' +
          learningExtraQuestion +
          '. Svar som en erfaren og praktisk oppdretter/røkter. Hold svaret lett å forstå og praktisk rettet.'
      },
    ], tankName.trim());

    setLearningExtraAnswer(response);
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke hente svar.');
  } finally {
    setLoading(false);
  }
};

const startDailyCheckIn = () => {
  if (!tankName.trim()) {
    setAiQuestion('Hvordan ser det ut i dag? Jeg vil ha en rolig vurdering av observasjonen min.');
    return;
  }

  setAiQuestion(
    'Dagens innsjekk for ' +
      tankName.trim() +
      ': Hva bør jeg følge med på ut fra observasjonen min?'
  );
};


useSpeechRecognitionEvent('start', () => {
  setIsListening(true);
});

useSpeechRecognitionEvent('end', () => {
  setIsListening(false);
});

useSpeechRecognitionEvent('result', (event) => {
  const transcript = event.results?.[0]?.transcript?.trim();

  if (transcript) {
    setAiQuestion((prev) => {
      const current = prev.trim();
      return current ? `${current} ${transcript}` : transcript;
    });
  }
});

useSpeechRecognitionEvent('error', (event) => {
  setIsListening(false);
  Alert.alert(
    'Mikrofonfeil',
    event?.message || 'Kunne ikke lese tale. Prøv igjen.'
  );
});

const startVoiceNote = async () => {
  try {
    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permissions.granted) {
      Alert.alert(
        'Mikrofon ikke tillatt',
        'Gå til Innstillinger på iPhone og gi AquaMind tilgang til mikrofon og talegjenkjenning.'
      );
      return;
    }

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    await ExpoSpeechRecognitionModule.start({
      lang: 'nb-NO',
      interimResults: false,
      continuous: false,
      maxAlternatives: 1,
      iosTaskHint: 'dictation',
      addsPunctuation: true,
    });
  } catch (error: any) {
    setIsListening(false);
    Alert.alert(
      'Mikrofonfeil',
      error?.message || 'Kunne ikke starte mikrofon.'
    );
  }
};

const confirmSavedInLog = () => {
  Alert.alert(
    'Lagret i logg',
    'Denne samtalen blir lagret automatisk i historikken på valgt kar/merd når AquaMind svarer.'
  );
};



  const getRecentLogsForTank = (tank: string) => {
    const normalizedTank = tank.trim().toLowerCase();
    if (!normalizedTank) return [];

    return history
      .filter((item) => (item.tank_name || '').trim().toLowerCase() === normalizedTank)
      .sort((a, b) => {
        const aTime = new Date(a.created_at || '').getTime();
        const bTime = new Date(b.created_at || '').getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  };

  const buildTankContext = (tank: string) => {
    const recentLogs = getRecentLogsForTank(tank);

    if (!recentLogs.length) {
      return '';
    }

    return recentLogs
      .map((item) => {
        const date = formatDateTime(item.created_at);
        const messages = (item.messages_json || [])
          .map((msg) => `${msg.role === 'assistant' ? 'AquaMind' : 'Bruker'}: ${msg.text}`)
          .join(' ');

        return `${date} - ${messages}`;
      })
      .join('\n');
  };


const askAIWithoutImage = async () => {
  const allowed = await canUseAI();
  if (!allowed) return;

  if (!aiQuestion.trim()) {
    Alert.alert('Feil', 'Skriv et spørsmål først');
    return;
  }

  setLoading(true);

  try {
    const logId = makeId();

    const messagesToSend = [
      { role: 'system', content: systemPrompt },
{
  role: 'user',
  content:
    'Dette gjelder kar/merd: ' +
    (tankName.trim() || 'ikke oppgitt') +
    '. Brukeren spør: ' +
    aiQuestion.trim() +
    '. Svar som AquaMind: en rolig og erfaren kollega innen røkting, fiskehelse og oppdrett fra rogn til slakt. Ikke bruk punktliste med mindre det trengs. Still gjerne ett kort oppfølgingsspørsmål hvis du mangler viktig info.',
},   ];

    const aiText = await sendToAI(messagesToSend, tankName.trim());

    const displayMessages = [
      { role: 'user', text: aiQuestion.trim() },
      { role: 'assistant', text: aiText },
    ];

    const newLog = {
      id: logId,
      user_id: session.user.id,
      tank_name: tankName.trim() || 'Ikke oppgitt',
      image_url: null,
      video_url: null,
      messages_json: displayMessages,
    };

    const ok = await saveLogToSupabase(newLog);
    if (!ok) return;

    if (aiQuestion.toLowerCase().includes('lagre i logg')) {
      Alert.alert('Lagret', 'Observasjonen er lagret i historikken på valgt kar/merd.');
    }

    setConversation(displayMessages);
    setApiConversation([
      ...messagesToSend,
      { role: 'assistant', content: aiText },
    ]);
    setCurrentLogId(logId);
    setAiQuestion('');
    await incrementAIUsage();
    await loadLogs();
  } catch (error) {
    Alert.alert('Feil', error instanceof Error ? error.message : 'Kunne ikke sende spørsmål');
  } finally {
    setLoading(false);
  }
};


const sendToAI = async (messagesToSend: any[], tankForContext?: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  
  const tankContext = tankForContext ? buildTankContext(tankForContext) : '';

  const messagesWithContext = tankContext
    ? [
        { role: 'system', content: systemPrompt + '\n\nTidligere logger for samme kar/merd:\n' + tankContext },
        ...messagesToSend.filter((message) => message.role !== 'system'),
      ]
    : messagesToSend;

const response = await fetch(
    'https://dcfpamwtevubzzzmfftb.supabase.co/functions/v1/ai-chat',
    {
      method: 'POST',
   headers: {
  'Content-Type': 'application/json',
  apikey: supabaseKey,
},

      body: JSON.stringify({
        messages: messagesWithContext,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
  console.log('AI ERROR FULL RESPONSE:', JSON.stringify(data, null, 2));
  throw new Error(data?.error?.message || data?.error || 'Feil fra AI');
}
  const content = data?.choices?.[0]?.message?.content;

if (typeof content === 'string' && content.trim()) {
  return content;
}

if (Array.isArray(content)) {
  const textParts = content
    .filter((part: any) => part?.type === 'text' && part?.text)
    .map((part: any) => part.text)
    .join('\n')
    .trim();

  if (textParts) {
    return textParts;
  }
}

console.log('AI raw response:', JSON.stringify(data, null, 2));
throw new Error('AI svarte uten tekst');


};



  const analyzeImage = async () => {
    const allowed = await canUseAI();
    if (!allowed) return;

    if (!tankName.trim()) {
      Alert.alert('Feil', 'Skriv hvilket kar eller hvilken merd analysen gjelder for');
      return;
    }

    if (!base64Image || !image) {
      Alert.alert('Feil', 'Ta et bilde først');
      return;
    }

    setLoading(true);

    try {
      const logId = makeId();

      const messagesToSend = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
  type: 'text',
  text:
    'Kar/merd: ' +
    (tankName.trim() || 'ikke oppgitt') +
    '. Vurder bildet som AquaMind: en rolig, jordnær og erfaren kollega innen røkting, fiskehelse og oppdrett fra rogn til slakt. Skriv naturlig og praktisk, ikke som professor. Hvis noe virker unormalt, forklar rolig hva man bør følge med på. Hvis bildet er uklart eller mangler informasjon, si det tydelig.',
},
            {
              type: 'image_url',
              image_url: {
                
url: base64Image || ''
              },
            },
          ],
        },
      ];

      const aiText = await sendToAI(messagesToSend, tankName.trim());

      const displayMessages: DisplayMessage[] = [
        { role: 'assistant', text: aiText },
      ];

      const newLog: LogItem = {
        id: logId,
        user_id: session.user.id,
        tank_name: tankName.trim(),
        image_url: image,
        video_url: null,
        messages_json: displayMessages,
      };

      const ok = await saveLogToSupabase(newLog);
      if (!ok) return;

      setConversation(displayMessages);
      setApiConversation([
        ...messagesToSend,
        { role: 'assistant', content: aiText },
      ]);
      setCurrentLogId(logId);
      await incrementAIUsage();
      await loadLogs();
    } catch (error: any) {
      Alert.alert('Feil ved analyse', error?.message || 'Ukjent feil');
    } finally {
      setLoading(false);
    }
  };


const pickReplyImage = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Tillatelse mangler', 'Gi AquaMind tilgang til bilder for å legge ved bilde i svar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    const converted = await ImageManipulator.manipulateAsync(
      asset.uri,
      [],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    setReplyImage(converted.uri);
    setReplyBase64Image('data:image/jpeg;base64,' + (converted.base64 || ''));
  } catch (error: any) {
    Alert.alert('Feil', error?.message || 'Kunne ikke legge ved bilde.');
  }
};

const sendReply = async () => {
    const allowed = await canUseAI();
    if (!allowed) return;

    if (!replyText.trim() && !replyBase64Image) {
      Alert.alert('Feil', 'Skriv et svar eller legg ved et bilde først');
      return;
    }

    if (!currentLogId) {
      Alert.alert('Feil', 'Start en samtale først');
      return;
    }

    setLoading(true);

    try {
      const userText = replyText.trim() || 'La ved et nytt bilde som oppfølging.';

      const newDisplayConversation: DisplayMessage[] = [
        ...conversation,
        { role: 'user', text: replyBase64Image ? userText + ' [Bilde vedlagt]' : userText },
      ];

      const userReplyMessage = replyBase64Image
        ? {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userText,
              },
              {
                type: 'image_url',
                image_url: {
                  url: replyBase64Image,
                },
              },
            ],
          }
        : {
            role: 'user',
            content: userText,
          };

      const newApiConversation = [
        ...apiConversation,
        userReplyMessage,
      ];

      setConversation(newDisplayConversation);
      setReplyText('');
      setReplyImage(null);
      setReplyBase64Image(null);

      const aiText = await sendToAI(newApiConversation, tankName.trim());

      const updatedDisplayConversation: DisplayMessage[] = [
        ...newDisplayConversation,
        { role: 'assistant', text: aiText },
      ];

      const ok = await updateLogInSupabase(currentLogId, updatedDisplayConversation);
      if (!ok) return;

      setConversation(updatedDisplayConversation);
      setApiConversation([
        ...newApiConversation,
        { role: 'assistant', content: aiText },
      ]);

      await incrementAIUsage();
      await loadLogs();
    } catch (error: any) {
      Alert.alert('Feil ved oppfølging', error?.message || 'Ukjent feil');
    } finally {
      setLoading(false);
    }
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const shareLogAsPdf = async (item: LogItem) => {
    try {
     const messagesHtml = (item.messages_json || [])
  .map((msg) => {
    const bg = msg.role === 'assistant' ? '#eef5ff' : '#f3f3f3';
    const name = msg.role === 'assistant' ? 'AquaMind' : 'Du';

    return (
      '<div style="margin-bottom:14px; padding:12px; border-radius:10px; background:' + bg + ';">' +
      '<div style="font-weight:bold; margin-bottom:6px;">' + name + '</div>' +
      '<div style="white-space:pre-wrap; line-height:1.5;">' + escapeHtml(msg.text) + '</div>' +
      '</div>'
    );
  })
  .join('');
      const mediaHtml = item.image_url
  ? '<img src="' + item.image_url + '" style="width:100%; max-width:500px; border-radius:12px; margin:16px 0;" />'
  : '';

      const html = '<html><body><h1>AquaMind logg</h1>' + messagesHtml + mediaHtml + '<p>Sendt fra AquaMind</p></body></html>';

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke lage PDF');
    }
  };

const isAdmin = !!profile?.is_admin;
const hasActiveAccess = isAdmin || !!profile?.subscription_active;
const aiUsed = profile?.ai_usage_used || 0;
const aiLimit = profile?.ai_usage_limit || 0;
const aiUsageText = isAdmin ? 'Ubegrenset' : `${aiUsed} / ${aiLimit}`;


if (!session) {
  return (
    <ImageBackground
      source={aquaMindDarkBg}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: '#073b34' }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(237,247,244,0.18)' }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
          }}
        >
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.82)',
          borderRadius: 24,
          padding: 22,
        }}
      >
        <Image
            source={aquaMindLogo}
            resizeMode="contain"
            style={{
              width: '92%',
              height: 104,
              marginBottom: 18,
              alignSelf: 'center',
            }}
          />

        <TextInput
          placeholderTextColor="#4b5563"
              placeholder="E-post"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 14,
            padding: 14,
            fontSize: 18,
            marginBottom: 12,
            backgroundColor: 'rgba(255,255,255,0.82)',
          }}
        />

        <TextInput
          placeholderTextColor="#4b5563"
              placeholder="Passord"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 14,
            padding: 14,
            fontSize: 18,
            marginBottom: isRegisterMode ? 12 : 16,
            backgroundColor: 'rgba(255,255,255,0.82)',
          }}
        />

        {isRegisterMode && (
          <TextInput
            placeholderTextColor="#4b5563"
              placeholder="Bekreft passord"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 14,
              padding: 14,
              fontSize: 18,
              marginBottom: 16,
              backgroundColor: 'rgba(255,255,255,0.82)',
            }}
          />
        )}

        <Pressable
          onPress={isRegisterMode ? signUp : signIn}
          style={{
            backgroundColor: '#1f7aec',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
            {isRegisterMode ? 'Opprett konto' : 'Logg inn'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setIsRegisterMode(!isRegisterMode);
            setConfirmPassword('');
          }}
          style={{
            backgroundColor: '#2f80ed',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
            {isRegisterMode ? 'Har du allerede konto? Logg inn' : 'Ny bruker? Opprett konto'}
          </Text>
        </Pressable>

        {!isRegisterMode && (
          <Pressable
            onPress={() => {
              setResetEmail(email.trim());
              setResetModalVisible(true);
            }}
            style={{
              marginTop: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#1f7aec',
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              Glemt passord?
            </Text>
          </Pressable>
        )}
      </View>

      <Modal visible={resetModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 22, padding: 22 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 10 }}>
              Glemt passord?
            </Text>

            <Text style={{ color: '#555', marginBottom: 16, fontSize: 16 }}>
              Skriv inn e-postadressen din, så sender vi deg en lenke for å lage nytt passord.
            </Text>

            <TextInput
              placeholderTextColor="#4b5563"
              placeholder="E-post"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 14,
                padding: 14,
                fontSize: 18,
                marginBottom: 14,
              }}
            />

            <Pressable
              onPress={resetPassword}
              style={{
                backgroundColor: '#2f80ed',
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>
                Send lenke
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setResetModalVisible(false);
                setResetEmail('');
              }}
              style={{ marginTop: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#666', fontWeight: '700' }}>Avbryt</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
      </View>
    </ImageBackground>
  );
}



  return (
    <ImageBackground
      source={aquaMindDarkBg}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: '#073b34' }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(6,25,28,0.16)' }}>
        <>
      <ScrollView keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
          padding: 20,
          paddingTop: 48,
          paddingBottom: 70,
          
        }}
      >
        <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 20, padding: 20, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={aquaMindLogo}
              resizeMode="contain"
              style={{
                width: 255,
                height: 80,
              }}
            />
            <Pressable
              onPress={() => setSettingsVisible(true)}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: 'rgba(255,255,255,0.88)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.65)',
                zIndex: 50,
              }}
            >
              <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 12 }}>Konto</Text>
            </Pressable>
          </View>



<Text style={{ fontWeight: '700', marginBottom: 8, fontSize: 16 }}>Kar / Merd</Text>

<TextInput
  value={tankName}
  onChangeText={setTankName}
  placeholderTextColor="#4b5563"
              placeholder="F.eks. Kar 12 eller Merd A3"
  style={{
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginBottom: 14,
    fontSize: 16,
  }}
/>

<Text style={{ fontWeight: '700', marginBottom: 8, fontSize: 16 }}>
  Spør AquaMind
</Text>

<TextInput
  value={aiQuestion}
  onChangeText={setAiQuestion}
  placeholderTextColor="#4b5563"
              placeholder="Skriv det du lurer på..."
  style={{
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginBottom: 10,
    fontSize: 16,
    minHeight: 90,
  }}
  multiline
/>

<View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
  <Pressable
    onPress={startDailyCheckIn}
    disabled={loading}
    style={{
      flex: 1,
      backgroundColor: '#e6f1ee',
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>
      Dagens innsjekk
    </Text>
  </Pressable>

  <Pressable
    onPress={startVoiceNote}
    disabled={loading}
    style={{
      flex: 1,
      backgroundColor: '#e6f1ee',
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>
      {isListening ? 'Lytter...' : '🎙️ Snakk inn'}
    </Text>
  </Pressable>
</View>

<Pressable
  onPress={askAIWithoutImage}
  disabled={loading}
  style={{
    backgroundColor: loading ? '#999' : '#444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  }}
>
  <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
    Send til AquaMind
  </Text>
</Pressable>

<Pressable
  onPress={takePhoto}
  disabled={loading}
  style={{ backgroundColor: loading ? '#9bbce8' : '#1f7aec', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
>
  <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Legg til bilde</Text>
</Pressable>

<Pressable
  onPress={pickImageFromLibrary}
  disabled={loading}
  style={{ backgroundColor: loading ? '#d9b36e' : '#f39c12', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 }}
>
  <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Velg bilde fra bibliotek</Text>
</Pressable>



                    
           
          {image && (
            <Image
              source={{ uri: image }}
              style={{ width: '100%', height: 280, marginTop: 18, borderRadius: 14 }}
              resizeMode="cover"
            />
          )}

         
          {image && conversation.length === 0 && !loading && (
            <Pressable
              onPress={analyzeImage}
              style={{ backgroundColor: '#159a57', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Analyser bilde</Text>
            </Pressable>
          )}

         
          {loading && (
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator size="large" />
            </View>
          )}
        </View>

        {conversation.length > 0 && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 20, padding: 18, marginBottom: 18 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 8 }}>Samtale</Text>
            <Text style={{ marginBottom: 14, color: '#444', fontWeight: '700' }}>
              Gjelder: {tankName.trim()}
            </Text>

            {conversation.map((msg, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 12,
                  backgroundColor: msg.role === 'assistant' ? '#edf4ff' : '#f2f2f2',
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontWeight: '800', marginBottom: 6 }}>
                  {msg.role === 'assistant' ? 'AquaMind' : 'Du'}
                </Text>
                <Text style={{ lineHeight: 23, fontSize: 16 }}>{msg.text}</Text>
              </View>
            ))}

            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholderTextColor="#4b5563"
              placeholder="Skriv svar til AI..."
              style={{
                borderWidth: 1,
                borderColor: '#d7d7d7',
                borderRadius: 12,
                padding: 14,
                backgroundColor: 'rgba(255,255,255,0.82)',
                marginTop: 8,
                marginBottom: 12,
                minHeight: 56,
                fontSize: 16,
              }}
              multiline
            />

            {replyImage ? (
              <Image
                source={{ uri: replyImage }}
                style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 10 }}
              />
            ) : null}

            <Pressable
              onPress={pickReplyImage}
              disabled={loading}
              style={{
                backgroundColor: '#e6f1ee',
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 16 }}>
                Legg ved bilde i svar
              </Text>
            </Pressable>

            <Pressable
              onPress={sendReply}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#7aa7e8' : '#1f7aec',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                opacity: loading ? 0.9 : 1,
              }}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                    AquaMind tenker...
                  </Text>
                </View>
              ) : (
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                  Send svar
                </Text>
              )}
            </Pressable>
<Pressable
  onPress={closeConversation}
  style={{
    backgroundColor: '#666',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  }}
>
  <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
    Ferdig
  </Text>
</Pressable>

          </View>
        )}

        <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 20, padding: 18, marginTop: 4, marginBottom: 18 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', marginBottom: 6 }}>
            Logg og historikk
          </Text>
          <Text style={{ color: '#555', fontSize: 16, lineHeight: 22, marginBottom: 14 }}>
            Samtaler og observasjoner lagres automatisk på kar/merd. Åpne historikken for å søke, filtrere og dele logger.
          </Text>

          <Pressable
            onPress={() => setHistoryVisible(true)}
            style={{
              backgroundColor: '#0f766e',
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>
              Åpne historikk
            </Text>
          </Pressable>
        </View>


        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.84)',
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '900', color: 'black', marginBottom: 8 }}>
            Lær Oppdrett
          </Text>

          <Text style={{ color: '#4b5563', fontSize: 17, lineHeight: 24, marginBottom: 16 }}>
            En egen opplæringsdel for oppdrett. Velg tema, gå dypere i underemner og test deg selv med quiz.
          </Text>

          <Pressable
            onPress={openLearningHome}
            style={{
              backgroundColor: '#073b34',
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>
              Åpne Lær Oppdrett
            </Text>
          </Pressable>
        </View>
      </ScrollView>


      

      <Modal visible={learningVisible} animationType="slide" presentationStyle="fullScreen">
        <ImageBackground
          source={aquaMindDarkBg}
          resizeMode="cover"
          style={{ flex: 1, backgroundColor: '#073b34' }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(6,25,28,0.16)', paddingTop: 58 }}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.22)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: '#ffffff' }}>
                    {learningMode === 'topics'
                      ? 'Lær Oppdrett'
                      : selectedLearningTopic?.title || 'Lær Oppdrett'}
                  </Text>
                  <Text style={{ color: '#d1fae5', fontSize: 15, marginTop: 4 }}>
                    {learningMode === 'topics'
                      ? 'Velg tema og gå dypere. Bygget som et praktisk oppdrettsleksikon.'
                      : learningMode === 'quiz'
                        ? 'Quiz med 10 varierte spørsmål. 70% riktig kreves for å bestå.'
                        : 'Velg underemne, lær mer eller test deg selv.'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    if (learningMode === 'topics') {
                      setLearningVisible(false);
                    } else if (learningMode === 'subtopics') {
                      setLearningMode('topics');
                      setSelectedLearningTopic(null);
                    } else {
                      setLearningMode('subtopics');
                      setLearningContent('');
                      setQuizQuestion('');
                      setQuizFeedback('');
                      setLearningAnswer('');
                      setQuizFinished(false);
  setQuizAwaitingNext(false);
  setQuizResult(null);
                    }
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.90)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}
                >
                  <Text style={{ color: '#073b34', fontWeight: '900' }}>
                    {learningMode === 'topics' ? 'Lukk' : 'Tilbake'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
              {learningMode === 'topics' && (
                <>
                  <View
                    style={{
                      paddingHorizontal: 2,
                      paddingBottom: 12,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff', marginBottom: 6 }}>
                      Praktisk læring
                    </Text>
                    <Text style={{ color: '#d1fae5', fontSize: 15, lineHeight: 21 }}>
                      Velg et hovedtema. Deretter får du flere underemner, fri læring og en egen quiz for temaet.
                    </Text>
                  </View>

                  {learningTopics.map((topic) => (
                    <Pressable
                      key={topic.title}
                      onPress={() => selectLearningTopic(topic)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.88)',
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#073b34', marginBottom: 6 }}>
                        {topic.title}
                      </Text>
                      <Text style={{ color: '#374151', fontSize: 15, lineHeight: 21 }}>
                        {topic.description}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}

              {learningMode === 'subtopics' && selectedLearningTopic && (
                <>
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.88)',
                      borderRadius: 18,
                      padding: 16,
                      marginBottom: 14,
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#073b34', marginBottom: 6 }}>
                      {selectedLearningTopic.title}
                    </Text>
                    <Text style={{ color: '#374151', fontSize: 15, lineHeight: 21, marginBottom: 12 }}>
                      {selectedLearningTopic.description}
                    </Text>

                    <Pressable
                      onPress={startLearningQuiz}
                      disabled={loading}
                      style={{
                        backgroundColor: '#073b34',
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                        Start quiz
                      </Text>
                    </Pressable>
                  </View>

                  {selectedLearningTopic.subtopics.map((subtopic: string) => (
                    <Pressable
                      key={subtopic}
                      onPress={() => startLearningLesson(subtopic)}
                      disabled={loading}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.88)',
                        borderRadius: 16,
                        padding: 15,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 17, fontWeight: '900', color: '#073b34' }}>
                        {subtopic}
                      </Text>
                    </Pressable>
                  ))}
                
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.88)',
                      borderRadius: 18,
                      padding: 16,
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#073b34', marginBottom: 8 }}>
                      Er det noe annet innen temaet du lurer på?
                    </Text>

                    <Text style={{ color: '#4b5563', fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                      Still egne spørsmål direkte til AquaMind innen dette temaet.
                    </Text>

                    <TextInput
                      value={learningExtraQuestion}
                      onChangeText={setLearningExtraQuestion}
                      placeholder="Skriv spørsmål om dette temaet..."
                      placeholderTextColor="#6b7280"
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: '#d7e3df',
                        minHeight: 70,
                        fontSize: 16,
                        marginBottom: 12,
                      }}
                      multiline
                    />

                    <Pressable
                      onPress={askLearningExtraQuestion}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? '#7aa7e8' : '#0f766e',
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                        {loading ? 'AquaMind svarer...' : 'Spør AquaMind'}
                      </Text>
                    </Pressable>

                    {learningExtraAnswer ? (
                      <View
                        style={{
                          backgroundColor: '#edf7f5',
                          borderRadius: 14,
                          padding: 14,
                          marginTop: 14,
                        }}
                      >
                        <Text style={{ color: '#073b34', fontSize: 16, lineHeight: 24 }}>
                          {learningExtraAnswer}
                        </Text>
                      </View>
                    ) : null}
                  </View>

</>
              )}

              {learningMode === 'lesson' && (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.90)',
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#073b34', marginBottom: 6 }}>
                    {selectedLearningSubtopic || selectedLearningTopic?.title}
                  </Text>

                  {loading && !learningContent ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator color="#073b34" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#073b34', fontWeight: '800' }}>AquaMind lager opplæring...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#1f2937', fontSize: 16, lineHeight: 24 }}>
                      {learningContent}
                    </Text>
                  )}
                </View>
              )}

              {learningMode === 'quiz' && selectedLearningTopic && (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.90)',
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#073b34', marginBottom: 6 }}>
                    Quiz: {selectedLearningTopic.title}
                  </Text>

                  <Text style={{ color: '#374151', fontSize: 15, marginBottom: 14 }}>
                    Spørsmål {Math.min(quizStep, 10)} av 10 · Riktig: {quizCorrect}
                  </Text>

                  {loading && !quizQuestion ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator color="#073b34" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#073b34', fontWeight: '800' }}>Lager spørsmål...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={{ color: '#1f2937', fontSize: 17, lineHeight: 24, marginBottom: 14 }}>
                        {quizQuestion}
                      </Text>

                      {quizFeedback ? (
                        <View style={{ backgroundColor: '#e6f1ee', borderRadius: 14, padding: 12, marginBottom: 14 }}>
                          <Text style={{ color: '#073b34', fontSize: 15, lineHeight: 22 }}>
                            {quizFeedback}
                          </Text>
                        </View>
                      ) : null}

                      {!quizFinished ? (
                        <>
                          {quizAwaitingNext ? (
                            <Pressable
                              onPress={goToNextQuizQuestion}
                              disabled={loading}
                              style={{
                                backgroundColor: loading ? '#7aa7e8' : '#073b34',
                                paddingVertical: 14,
                                borderRadius: 14,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                                {loading ? 'Henter neste...' : 'Neste spørsmål'}
                              </Text>
                            </Pressable>
                          ) : (
                            <>
                              <TextInput
                                value={learningAnswer}
                                onChangeText={setLearningAnswer}
                                placeholderTextColor="#4b5563"
                                placeholder="Skriv svaret ditt her..."
                                style={{
                                  borderWidth: 1,
                                  borderColor: '#d7e3df',
                                  borderRadius: 14,
                                  padding: 14,
                                  backgroundColor: 'white',
                                  fontSize: 16,
                                  minHeight: 70,
                                  marginBottom: 12,
                                }}
                                multiline
                              />

                              <Pressable
                                onPress={submitLearningQuizAnswer}
                                disabled={loading}
                                style={{
                                  backgroundColor: loading ? '#7aa7e8' : '#0f766e',
                                  paddingVertical: 14,
                                  borderRadius: 14,
                                  alignItems: 'center',
                                }}
                              >
                                <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                                  {loading ? 'Vurderer...' : 'Send svar'}
                                </Text>
                              </Pressable>
                            </>
                          )}
                        </>
                      ) : (
                        <View>
                          {quizResult ? (
                            <View
                              style={{
                                backgroundColor: quizResult.passed ? '#dcfce7' : '#fee2e2',
                                borderRadius: 18,
                                padding: 16,
                                marginBottom: 14,
                                borderWidth: 1,
                                borderColor: quizResult.passed ? '#16a34a' : '#dc2626',
                              }}
                            >
                              <Text
                                style={{
                                  color: quizResult.passed ? '#166534' : '#991b1b',
                                  fontSize: 26,
                                  fontWeight: '900',
                                  marginBottom: 6,
                                  textAlign: 'center',
                                }}
                              >
                                {quizResult.passed ? '🎉 BESTÅTT' : 'IKKE BESTÅTT'}
                              </Text>

                              <Text
                                style={{
                                  color: quizResult.passed ? '#166534' : '#991b1b',
                                  fontSize: 18,
                                  fontWeight: '800',
                                  textAlign: 'center',
                                  marginBottom: 8,
                                }}
                              >
                                {quizResult.percent}% riktig
                              </Text>

                              <Text
                                style={{
                                  color: quizResult.passed ? '#166534' : '#991b1b',
                                  fontSize: 15,
                                  lineHeight: 22,
                                  textAlign: 'center',
                                }}
                              >
                                {quizResult.passed
                                  ? 'Bra jobbet. Du har vist god og bred forståelse for temaet. Fortsett gjerne med et nytt tema eller ta en ny quiz for repetisjon.'
                                  : 'Du er ikke helt i mål enda. Gå tilbake til underemnene, øv på de delene du var usikker på, og prøv en ny variert quiz.'}
                              </Text>
                            </View>
                          ) : null}

                          <Pressable
                            onPress={startLearningQuiz}
                            disabled={loading}
                            style={{
                              backgroundColor: '#073b34',
                              paddingVertical: 14,
                              borderRadius: 14,
                              alignItems: 'center',
                              marginBottom: 10,
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                              Start ny quiz
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setLearningMode('subtopics');
                              setQuizQuestion('');
                              setQuizFeedback('');
                              setQuizResult(null);
                              setLearningAnswer('');
                              setQuizFinished(false);
                              setQuizAwaitingNext(false);
                            }}
                            style={{
                              backgroundColor: '#e6f1ee',
                              paddingVertical: 14,
                              borderRadius: 14,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#073b34', fontSize: 17, fontWeight: '900' }}>
                              Tilbake til temaet
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </ImageBackground>
      </Modal>

<Modal visible={historyVisible} animationType="slide" presentationStyle="fullScreen">
        <ImageBackground
          source={aquaMindDarkBg}
          resizeMode="cover"
          style={{ flex: 1, backgroundColor: '#073b34' }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(6,25,28,0.12)' }}>
            <View style={{ flex: 1,  paddingTop: 58 }}>
          <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#d7e3df' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 30, fontWeight: '900', color: '#ffffff' }}>
                  Historikk
                </Text>
                <Text style={{ color: '#e6fffb', fontSize: 15 }}>
                  {filteredHistory.length} av {history.length} logger
                </Text>
              </View>

              <Pressable
                onPress={() => setHistoryVisible(false)}
                style={{ backgroundColor: 'rgba(255,255,255,0.82)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}
              >
                <Text style={{ color: '#0f766e', fontWeight: '900' }}>Lukk</Text>
              </Pressable>
            </View>

            <TextInput
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholderTextColor="#4b5563"
              placeholder="Søk i logger, dato eller tekst"
              style={{
                borderWidth: 1,
                borderColor: '#d7e3df',
                borderRadius: 14,
                padding: 14,
                backgroundColor: 'rgba(255,255,255,0.82)',
                marginBottom: 10,
                fontSize: 16,
              }}
            />

            <TextInput
              value={filterTank}
              onChangeText={setFilterTank}
              placeholderTextColor="#4b5563"
              placeholder="Filtrer på kar / merd"
              style={{
                borderWidth: 1,
                borderColor: '#d7e3df',
                borderRadius: 14,
                padding: 14,
                backgroundColor: 'rgba(255,255,255,0.82)',
                fontSize: 16,
              }}
            />

            {(historySearch || filterTank) ? (
              <Pressable
                onPress={() => {
                  setHistorySearch('');
                  setFilterTank('');
                }}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#0f766e', fontWeight: '800' }}>Nullstill filter</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {history.length > 0 && (
              <Pressable
                onPress={deleteAllLogs}
                style={{
                  backgroundColor: '#fff1f2',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: '#b71c1c', fontWeight: '900' }}>Slett all historikk</Text>
              </Pressable>
            )}

            {filteredHistory.length === 0 && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 18, padding: 18 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 6 }}>
                  Ingen logger funnet
                </Text>
                <Text style={{ color: '#555', lineHeight: 22 }}>
                  Når du spør AquaMind eller vurderer et bilde, lagres observasjonen automatisk her på valgt kar/merd.
                </Text>
              </View>
            )}

            {filteredHistory.map((item) => {
              const firstMessage =
                item.messages_json?.find((m) => m.role === 'assistant')?.text || '';

              const status = getStatusFromText(firstMessage);
              const statusStyle = getStatusStyle(status);
              const cleanText = removeStatusLine(firstMessage);

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.82)',
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: '#d7e3df',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: '#073b34' }}>
                      {item.tank_name || 'Ikke oppgitt'}
                    </Text>

                    <View
                      style={{
                        backgroundColor: statusStyle.backgroundColor,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: statusStyle.color, fontWeight: '900', fontSize: 13 }}>
                        {status}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: '#6b7280', fontSize: 13, marginBottom: 10 }}>
                    {formatDateTime(item.created_at)}
                  </Text>

                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: '100%', height: 190, borderRadius: 14, marginBottom: 10 }}
                    />
                  ) : null}

                  <Text numberOfLines={4} style={{ color: '#1f2937', lineHeight: 21 }}>
                    {cleanText || 'Ingen tekst i loggen.'}
                  </Text>

                  <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
                    <Pressable
                      hitSlop={10}
                      onPress={() => openLog(item)}
                      style={{
                        backgroundColor: '#e6f1ee',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: '#073b34', fontWeight: '900' }}>Åpne</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => shareLogAsPdf(item)}
                      style={{
                        backgroundColor: '#e6f1ee',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: '#073b34', fontWeight: '900' }}>Del PDF</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => deleteLog(item)}
                      style={{
                        backgroundColor: '#fff1f2',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginLeft: 'auto',
                      }}
                    >
                      <Text style={{ color: '#b71c1c', fontWeight: '900' }}>Slett</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      
          </View>
        </ImageBackground></Modal>


      <Modal visible={logModalVisible} animationType="slide" presentationStyle="fullScreen">
        <ImageBackground
          source={aquaMindDarkBg}
          resizeMode="cover"
          style={{ flex: 1, backgroundColor: '#073b34' }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(6,25,28,0.18)', paddingTop: 58 }}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.22)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: '#f8fafc' }}>
                    {selectedLog?.tank_name || 'Logg'}
                  </Text>
                  <Text style={{ color: '#d1fae5', fontSize: 14, marginTop: 4 }}>
                    {formatDateTime(selectedLog?.created_at)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => { setLogModalVisible(false); setHistoryVisible(true); }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.90)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}
                >
                  <Text style={{ color: '#0f766e', fontWeight: '900' }}>Lukk</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
              {selectedLog?.image_url ? (
                <Image
                  source={{ uri: selectedLog.image_url }}
                  style={{ width: '100%', height: 260, borderRadius: 18, marginBottom: 14 }}
                />
              ) : null}

              {(selectedLog?.messages_json || []).map((msg, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: msg.role === 'assistant' ? 'rgba(255,255,255,0.90)' : 'rgba(230,241,238,0.90)',
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontWeight: '900', color: '#073b34', marginBottom: 6 }}>
                    {msg.role === 'assistant' ? 'AquaMind' : 'Du'}
                  </Text>
                  <Text style={{ color: '#1f2937', fontSize: 16, lineHeight: 23 }}>
                    {msg.text}
                  </Text>
                </View>
              ))}

              {selectedLog ? (
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <Pressable onPress={() => shareLogAsPdf(selectedLog)} style={{ backgroundColor: 'rgba(255,255,255,0.90)', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, marginRight: 10 }}>
                    <Text style={{ color: '#073b34', fontWeight: '900' }}>Del PDF</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteLog(selectedLog)} style={{ backgroundColor: '#fff1f2', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14 }}>
                    <Text style={{ color: '#b71c1c', fontWeight: '900' }}>Slett</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </ImageBackground>
      </Modal>

      <Modal visible={settingsVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          
            

<View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 30, fontWeight: '900', marginBottom: 6 }}>
              Konto
            </Text>
            <Text style={{ color: '#666', fontSize: 15, marginBottom: 18 }}>
              {session?.user?.email || 'Innlogget bruker'}
            </Text>

            <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <Text style={{ fontWeight: '900', fontSize: 16, marginBottom: 6 }}>Abonnement</Text>
              <Text style={{ color: '#555', fontSize: 16 }}>
                Status: {isAdmin ? 'Admin' : profile?.subscription_active ? 'Aktivt' : 'Ikke aktivt'}
              </Text>
              <Text style={{ color: '#555', fontSize: 16, marginTop: 4 }}>
                Bruk denne perioden: {aiUsageText}
              </Text>
            </View>

            {!isAdmin && (
              <Pressable
                onPress={() => {
                  setSettingsVisible(false);
                  setPaywallVisible(true);
                }}
                style={{
                  backgroundColor: profile?.subscription_active ? '#e8f5e9' : '#159a57',
                  paddingVertical: 15,
                  borderRadius: 14,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: profile?.subscription_active ? '#1b5e20' : 'white', fontSize: 18, fontWeight: '900' }}>
                  {profile?.subscription_active ? 'Se abonnement' : 'Aktiver abonnement'}
                </Text>
              </Pressable>
            )}

            <View style={{ marginBottom: 12 }}>
              <Pressable
                hitSlop={12}
                onPress={() => openPrivacyPolicy()}
                style={{ backgroundColor: '#e6f1ee', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, marginBottom: 10 }}
              >
                <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>Personvern</Text>
              </Pressable>

              <Pressable
                hitSlop={12}
                onPress={() => openTermsOfService()}
                style={{ backgroundColor: '#e6f1ee', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, marginBottom: 10 }}
              >
                <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>Vilkår</Text>
              </Pressable>

              <Pressable
                hitSlop={12}
                onPress={() => openAIDisclaimer()}
                style={{ backgroundColor: '#e6f1ee', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, marginBottom: 10 }}
              >
                <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>AI-ansvar</Text>
              </Pressable>

              <Pressable
                hitSlop={12}
                onPress={() => openSupport()}
                style={{ backgroundColor: '#e6f1ee', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14 }}
              >
                <Text style={{ color: '#073b34', fontWeight: '900', fontSize: 15 }}>Support</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={signOut}
              style={{ backgroundColor: '#1f7aec', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Logg ut</Text>
            </Pressable>

            <Pressable
              onPress={deleteAccount}
              style={{ alignSelf: 'center', backgroundColor: '#fff1f2', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, marginTop: 8, marginBottom: 16 }}
            >
              <Text style={{ color: '#b71c1c', fontSize: 14, fontWeight: '800' }}>Slett konto</Text>
            </Pressable>

            <Pressable onPress={() => setSettingsVisible(false)} style={{ alignItems: 'center' }}>
              <Text style={{ color: '#666', fontWeight: '700', fontSize: 16 }}>Lukk</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={paywallVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.40)',
            justifyContent: 'center',
            padding: 22,
          }}
        >
          <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 28, padding: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', marginBottom: 6 }}>
              AquaMind Pro
            </Text>

            <Text style={{ color: '#1f7aec', fontSize: 28, fontWeight: '900', marginBottom: 12 }}>
              199 kr / måned
            </Text>

            <Text style={{ color: '#555', fontSize: 16, lineHeight: 23, marginBottom: 16 }}>
              Aktivt abonnement kreves for å bruke AquaMind og bildeanalyse. Dette beskytter AI-kostnader og gjør AquaMind klart for App Store.
            </Text>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 6 }}>Dette er inkludert</Text>
              <Text style={{ fontSize: 15, lineHeight: 22 }}>AquaMind, bildeanalyse, historikk, logger og PDF-deling.</Text>
            </View>

            <Text style={{ color: '#666', fontSize: 13, lineHeight: 19, marginBottom: 18 }}>
              Abonnementet fornyes automatisk hver måned til det sies opp via App Store-innstillinger. Ingen gratisversjon er inkludert.
            </Text>

            <Pressable
              onPress={startSubscription}
              style={{ backgroundColor: '#159a57', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Start abonnement</Text>
            </Pressable>

            <Pressable
              onPress={restorePurchases}
              style={{  paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: '#1f7aec', fontSize: 16, fontWeight: '800' }}>Gjenopprett kjøp</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              <Pressable onPress={() => openPrivacyPolicy()} style={{ marginRight: 18 }}>
                <Text style={{ color: '#1f7aec', fontWeight: '700' }}>Personvern</Text>
              </Pressable>

              <Pressable onPress={() => openTermsOfService()} style={{ marginRight: 18 }}>
                <Text style={{ color: '#1f7aec', fontWeight: '700' }}>Vilkår</Text>
              </Pressable>

              <Pressable onPress={() => openAIDisclaimer()}>
                <Text style={{ color: '#1f7aec', fontWeight: '700' }}>AI</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setPaywallVisible(false)} style={{ alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16, fontWeight: '800' }}>Lukk</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: '#ffffff', borderRadius: 22, padding: 22 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', marginBottom: 12 }}>
              {infoModalTitle}
            </Text>
            <Text style={{ color: '#555', fontSize: 16, lineHeight: 23, marginBottom: 18 }}>
              {infoModalText}
            </Text>
            <Pressable
              onPress={() => setInfoModalVisible(false)}
              style={{ backgroundColor: '#1f7aec', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
      </View>
    </ImageBackground>
  );
}
