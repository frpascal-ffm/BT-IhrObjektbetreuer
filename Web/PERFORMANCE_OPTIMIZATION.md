# Performance-Optimierung mit React Query

## Übersicht
Die Anwendung wurde mit React Query optimiert, um unnötige Ladevorgänge zu vermeiden und eine bessere Benutzererfahrung zu bieten.

## Implementierte Optimierungen

### 1. Intelligentes Caching
- **staleTime**: 5-10 Minuten - Daten werden als "frisch" betrachtet
- **gcTime**: 10-30 Minuten - Cache wird länger behalten
- **refetchOnWindowFocus**: false - Kein Refetch beim Fokuswechsel
- **refetchOnMount**: false - Kein Refetch beim Mounten wenn Daten existieren

### 2. Unterschiedliche Cache-Strategien

#### Jobs (häufig geändert)
```typescript
staleTime: 5 * 60 * 1000, // 5 Minuten
gcTime: 10 * 60 * 1000,   // 10 Minuten
```

#### Properties & Employees (selten geändert)
```typescript
staleTime: 10 * 60 * 1000, // 10 Minuten
gcTime: 30 * 60 * 1000,    // 30 Minuten
```

### 3. Visuelle Feedback-Mechanismen

#### Loading States
- **Initial Loading**: Vollständiger Loading-Screen nur beim ersten Laden
- **Background Refetching**: Subtiler Indikator für Hintergrund-Updates
- **Mutation Loading**: Spezifische Loading-States für Aktionen

#### Refresh-Indikatoren
```typescript
{isRefetching && (
  <div className="flex items-center text-sm text-gray-500">
    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
    Aktualisiere...
  </div>
)}
```

### 4. Optimierte QueryClient-Konfiguration

#### Globale Einstellungen
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Vorteile der Optimierung

### 1. Bessere Performance
- **Schnellere Navigation**: Gecachte Daten werden sofort angezeigt
- **Weniger API-Calls**: Reduzierte Server-Last
- **Bessere UX**: Keine unnötigen Loading-Screens

### 2. Intelligente Updates
- **Hintergrund-Updates**: Daten werden im Hintergrund aktualisiert
- **Selektive Invalidierung**: Nur betroffene Queries werden neu geladen
- **Optimistische Updates**: UI wird sofort aktualisiert

### 3. Robuste Fehlerbehandlung
- **Retry-Mechanismus**: Automatische Wiederholung bei Fehlern
- **Exponentieller Backoff**: Intelligente Wartezeiten
- **Graceful Degradation**: App funktioniert auch bei Netzwerkproblemen

## Best Practices

### 1. Query-Keys
- Konsistente Benennung: `['jobs']`, `['properties']`, `['employees']`
- Spezifische Keys für gefilterte Daten: `['jobs', 'status', 'pending']`

### 2. Mutation-Optimierung
```typescript
// Optimistische Updates
queryClient.setQueryData(['jobs'], (oldData) => {
  // Sofortige UI-Updates
  return updatedData;
});

// Selektive Invalidierung
queryClient.invalidateQueries({ queryKey: ['jobs'] });
```

### 3. Error Boundaries
- Globale Fehlerbehandlung
- Benutzerfreundliche Fehlermeldungen
- Automatische Wiederherstellung

## Monitoring & Debugging

### 1. React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In der App-Komponente
<ReactQueryDevtools initialIsOpen={false} />
```

### 2. Performance-Metriken
- **Cache Hit Rate**: Wie oft werden gecachte Daten verwendet
- **Query Frequency**: Häufigkeit der API-Calls
- **Loading Times**: Durchschnittliche Ladezeiten

### 3. Debugging-Tipps
```typescript
// Query-Status überprüfen
const { data, isLoading, isFetching, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: jobsService.getAll,
});

// Cache-Inhalt anzeigen
console.log(queryClient.getQueryData(['jobs']));
```

## Zukünftige Verbesserungen

### 1. Infinite Queries
- Paginierung für große Datensätze
- Virtuelles Scrolling
- Lazy Loading

### 2. Real-time Updates
- WebSocket-Integration
- Live-Updates ohne Polling
- Optimistische UI-Updates

### 3. Offline-Support
- Service Worker Integration
- Offline-First Architektur
- Synchronisation bei Wiederherstellung der Verbindung

## Troubleshooting

### Häufige Probleme

1. **Daten werden nicht aktualisiert**
   - Überprüfen Sie die `staleTime`-Einstellungen
   - Stellen Sie sicher, dass Queries invalidiert werden

2. **Zu viele API-Calls**
   - Reduzieren Sie `refetchOnWindowFocus`
   - Erhöhen Sie `staleTime`

3. **Cache wird nicht geleert**
   - Überprüfen Sie `gcTime`-Einstellungen
   - Verwenden Sie `queryClient.clear()` bei Bedarf

### Debugging-Befehle
```typescript
// Cache leeren
queryClient.clear();

// Spezifische Query invalidieren
queryClient.invalidateQueries({ queryKey: ['jobs'] });

// Cache-Status anzeigen
console.log(queryClient.getQueryCache().getAll());
``` 