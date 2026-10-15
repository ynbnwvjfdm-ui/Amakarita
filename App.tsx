import { useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Import each weight on its own so unused weights stay out of the app.
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';

import { I18nProvider } from './src/i18n';
import { ProgressProvider } from './src/progressStore';
import { Nav, NavContext, Route, TabName } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { DeckListScreen } from './src/screens/DeckListScreen';
import { DeckScreen } from './src/screens/DeckScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { QuizSetupScreen } from './src/screens/QuizSetupScreen';
import { QuizGameScreen } from './src/screens/QuizGameScreen';
import { AmaturufuSetupScreen } from './src/screens/AmaturufuSetupScreen';
import { AmaturufuGameScreen } from './src/screens/AmaturufuGameScreen';
import { MatatuSetupScreen } from './src/screens/MatatuSetupScreen';
import { MatatuGameScreen } from './src/screens/MatatuGameScreen';
import { IbisakuzoSetupScreen } from './src/screens/IbisakuzoSetupScreen';
import { IbisakuzoGameScreen } from './src/screens/IbisakuzoGameScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { TabBar } from './src/ui/TabBar';
import { useReducedMotion } from './src/ui/motion';
import { colors } from './src/ui/theme';

const TABS: TabName[] = ['home', 'decks', 'games'];
const DARK_SCREENS: Route['name'][] = ['amaturufuGame', 'matatuGame', 'quizGame', 'ibisakuzoGame', 'review'];

function CurrentScreen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'decks':
      return <DeckListScreen />;
    case 'deck':
      return <DeckScreen deckId={route.deckId} />;
    case 'games':
      return <GamesScreen />;
    case 'quizSetup':
      return <QuizSetupScreen />;
    case 'quizGame':
      return <QuizGameScreen config={route.config} />;
    case 'amaturufuSetup':
      return <AmaturufuSetupScreen />;
    case 'amaturufuGame':
      return <AmaturufuGameScreen config={route.config} />;
    case 'matatuSetup':
      return <MatatuSetupScreen />;
    case 'matatuGame':
      return <MatatuGameScreen config={route.config} />;
    case 'ibisakuzoSetup':
      return <IbisakuzoSetupScreen />;
    case 'ibisakuzoGame':
      return <IbisakuzoGameScreen config={route.config} />;
    case 'review':
      return <ReviewScreen />;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const reduced = useReducedMotion();
  // Which way the last move went: a new screen comes in from the right, going back from the left, a tab fades.
  const [way, setWay] = useState<'in' | 'back' | 'tab'>('tab');

  const nav = useMemo<Nav>(
    () => ({
      push: (r) => {
        setWay('in');
        setStack((s) => [...s, r]);
      },
      pop: () => {
        setWay('back');
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      },
      replace: (r) => {
        setWay('in');
        setStack((s) => [...s.slice(0, -1), r]);
      },
      home: () => {
        setWay('back');
        setStack([{ name: 'home' }]);
      },
      tab: (name) => {
        setWay('tab');
        setStack([{ name }]);
      },
    }),
    [],
  );

  // Android back button goes back one screen, except on a tab.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      nav.pop();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const route = stack[stack.length - 1];
  const tab = TABS.find((t) => t === route.name);
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ProgressProvider>
          <NavContext.Provider value={nav}>
            <StatusBar style={DARK_SCREENS.includes(route.name) ? 'light' : 'dark'} />
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <Animated.View
                key={`${stack.length}:${route.name}`}
                style={{ flex: 1 }}
                entering={reduced ? undefined : way === 'tab' ? FadeIn.duration(200) : (way === 'in' ? FadeInRight : FadeInLeft).duration(280)}
              >
                <CurrentScreen route={route} />
              </Animated.View>
              {tab ? <TabBar active={tab} onSelect={nav.tab} /> : null}
            </View>
          </NavContext.Provider>
        </ProgressProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
