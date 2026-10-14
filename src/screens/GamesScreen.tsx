import { useI18n } from '../i18n';
import { GameTickets } from '../ui/GameTickets';
import { Screen } from '../ui/Screen';
import { HeaderActions } from '../ui/Profiles';

export function GamesScreen() {
  const { t } = useI18n();
  return (
    <Screen tabbed title={t('tabGames')} right={<HeaderActions />}>
      <GameTickets />
    </Screen>
  );
}
