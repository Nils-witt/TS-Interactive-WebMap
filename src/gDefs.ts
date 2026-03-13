export const STATUS_LABELS: Record<number, string> = {
    1: 'Funk Frei',
    2: 'Einsatzbereit',
    3: 'Einsatz übernommen',
    4: 'Am Einsatzort',
    5: 'Sprechwunsch',
    6: 'Nicht Einsatzbereit',
    7: 'Zum Transportziel',
    8: 'Transportziel erreicht',
    9: 'Priorisierter Sprechwunsch',
};

export const STATUS_COLORS: Record<number, 'success' | 'primary' | 'warning' | 'error' | 'default'> = {
    1: 'success',
    2: 'success',
    3: 'primary',
    4: 'primary',
    5: 'warning',
    6: 'error',
    7: 'primary',
    8: 'success',
    9: 'error',
};