# Push → detail rezervace (manuální test)

**Očekávaný payload (data):** `reservationId` nebo (`entityType: "reservation"` + `entityId`). Legacy: `deeplink` / `deepLink` / `route`.

**Cílová route v appce:** `/screens/trip-detail?id=<id>` (scheme: `realbarber` → `realbarber:///screens/trip-detail?id=...`).

## Checklist

1. **App ukončená (swipe away) → tap na push**  
   Otevře se app a po chvíli má naskočit detail rezervace (cold start + `getLastNotificationResponseAsync`).

2. **App na pozadí (home) → tap na push**  
   App do popředí, navigace na stejný detail (`addNotificationResponseReceivedListener`).

3. **App v popředí → tap na banner / notifikaci**  
   Stejná navigace (listener).

4. **Chybějící ID**  
   Payload bez `reservationId` / bez platného `entityId` u rezervace → app se nerozbije, navigace se nespustí (v dev konzoli `[push] no reservation route in payload`).

5. **Neexistující rezervace**  
   Platné ID, které API nevrátí v seznamu → `trip-detail` zobrazí stav „nenalezeno“ (existující chování obrazovky).
