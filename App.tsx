import { useEffect, useMemo, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Import each weight on its own so unused weights stay out of the app.
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { BricolageGrotesque_400Regular } from '@expo-google-fonts/bricolage-grotesque/400Regular';
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';

import { I18nProvider } from './src/i18n';
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
import { TabBar } from './src/ui/TabBar';
import { colors } from './src/ui/theme';

const TABS: TabName[] = ['home', 'decks', 'games'];
const DARK_SCREENS: Route['name'][] = ['amaturufuGame', 'matatuGame', 'quizGame'];

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
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  const nav = useMemo<Nav>(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
      home: () => setStack([{ name: 'home' }]),
      tab: (name) => setStack([{ name }]),
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
        <NavContext.Provider value={nav}>
          <StatusBar style={DARK_SCREENS.includes(route.name) ? 'light' : 'dark'} />
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <CurrentScreen route={route} />
            {tab ? <TabBar active={tab} onSelect={nav.tab} /> : null}
          </View>
        </NavContext.Provider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
