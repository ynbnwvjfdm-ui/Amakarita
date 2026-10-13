import { useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from './src/i18n';
import { Nav, NavContext, Route } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { DeckListScreen } from './src/screens/DeckListScreen';
import { DeckScreen } from './src/screens/DeckScreen';
import { AmaturufuSetupScreen } from './src/screens/AmaturufuSetupScreen';
import { AmaturufuGameScreen } from './src/screens/AmaturufuGameScreen';

function CurrentScreen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'decks':
      return <DeckListScreen />;
    case 'deck':
      return <DeckScreen deckId={route.deckId} />;
    case 'amaturufuSetup':
      return <AmaturufuSetupScreen />;
    case 'amaturufuGame':
      return <AmaturufuGameScreen config={route.config} />;
  }
}

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  const nav = useMemo<Nav>(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
      home: () => setStack([{ name: 'home' }]),
    }),
    [],
  );

  // Android back button goes back one screen, except on the home screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      nav.pop();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  const route = stack[stack.length - 1];
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <NavContext.Provider value={nav}>
          <StatusBar style={route.name === 'amaturufuGame' ? 'light' : 'dark'} />
          <CurrentScreen route={route} />
        </NavContext.Provider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
