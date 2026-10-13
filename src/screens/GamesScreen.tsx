import { useI18n } from '../i18n';
import { GameTickets } from '../ui/GameTickets';
import { LanguageToggle } from '../ui/LanguageToggle';
import { Screen } from '../ui/Screen';

export function GamesScreen() {
  const { t } = useI18n();
  return (
    <Screen tabbed title={t('tabGames')} right={<LanguageToggle />}>
      <GameTickets />
    </Screen>
  );
}
