/**
 * Statické pobočky pro sekci "Kudy k nám?" – Modřany, Kačerov, Hagibor, Barrandov.
 * source je volitelný – když chybí, na kartě i v detailu se nezobrazí video.
 */
export interface KudyKNamVideoItem {
  id: string;
  title: string;
  /** Lokální require(...) nebo { uri: '...' } (např. CDN); když chybí, karta/detail bez videa */
  source?: number | { uri: string } | null;
  /** Odkaz na Google Mapy – zobrazí se v detailu jako „Otevřít v Mapách“ */
  mapsUrl?: string | null;
  /** Odkaz na Waze – zobrazí se v detailu jako „Otevřít ve Waze“ */
  wazeUrl?: string | null;
  /** Odkaz na Uber – zobrazí se v detailu jako „Jeďte s Uber“ */
  uberUrl?: string | null;
  /** Statický text doprava a parkování – zobrazí se v detailu v sekci Doprava a parkování */
  description?: string | null;
  /** Česká verze popisu dopravy a parkování */
  descriptionCs?: string | null;
}

const MODRANY_DESCRIPTION = `is located at Československého exilu 40, near the new Prague 12 town hall, making it easily accessible from various parts of the city. For those travelling by public transport, we are situated close to the Poliklinika Modřany bus stop (lines 190, 150, 246, 117) or the tram stop of the same name (lines 27, 17, 3, 92), just 3 minutes on foot. For clients who prefer to travel by car, you will find several parking options nearby; the most convenient is free parking for one hour along the road opposite the salon – we recommend having a parking disc in your car.`;
const MODRANY_DESCRIPTION_CS = `Pobočka se nachází v Československého exilu 40, v blízkosti nové radnice Prahy 12, s dobrou dostupností z různých částí města. MHD: zastávka Poliklinika Modřany (autobusy 190, 150, 246, 117) nebo tramvajová zastávka stejného jména (linky 27, 17, 3, 92), cca 3 minuty pěšky. Pro zákazníky autem je v okolí několik možností parkování; nejpohodlnější je hodinové parkování zdarma na protější straně ulice – doporučujeme mít v autě parkovací disk.`;

const KACEROV_DESCRIPTION = `is located in the heart of Prague 4, in front of Kačerov metro station on the second floor above a well-known pizzeria, with our own entrance. We are also close to the DBK Budějovická shopping and entertainment centre. For clients who prefer public transport, we are a few metres from Kačerov metro station (line C) and Kačerov bus stop with three platforms and many lines – platform A (333, 113, 956), platform B (960, 138, 215, 193, 189), platform C (139, 196, 150, 106, 157, 910) – a key transport hub for nearby train lines. This location ensures comfortable access from various parts of the city. For clients travelling by car, we recommend using one of the nearby car parks or the spaces right in front of the salon; please use these only until 18:00 and only for the duration of your visit; they are just a few metres from our salon entrance.`;
const KACEROV_DESCRIPTION_CS = `Pobočka se nachází v srdci Prahy 4, před stanicí metra Kačerov, ve druhém patře nad známou pizzerií, s vlastním vchodem. V blízkosti je i obchodní a zábavní centrum DBK Budějovická. MHD: pár metrů od stanice metra Kačerov (linka C) a autobusové zastávky Kačerov se třemi nástupišti – nástupiště A (333, 113, 956), B (960, 138, 215, 193, 189), C (139, 196, 150, 106, 157, 910). Autem doporučujeme jedno z nedalekých parkovišť nebo místa před salónem; prosím využívejte je jen do 18:00 a pouze na dobu návštěvy.`;

const HAGIBOR_DESCRIPTION = `is located in the new Hagibor residence complex. The nearest metro station is Želivského on line A; you can also use tram lines stopping at Krematorium Strašnice and Vinohradské hřbitovy, from where it is a short walk to us. For customers arriving by car, there is convenient parking in the white zone right in front of the salon.`;
const HAGIBOR_DESCRIPTION_CS = `Pobočka se nachází v rezidenčním komplexu Hagibor. Nejblíže je stanice metra Želivského (linka A); lze využít i tramvaje zastávky Krematorium Strašnice a Vinohradské hřbitovy, odtud je to k nám pár minut pěšky. Pro zákazníky autem je pohodlné parkování v bílé zóně přímo před salónem.`;

const UBER_MODRANY =
  'https://m.uber.com/looking?drop[0]={"addressLine1":"Barbershop v Praze - Real Barber Modřany / mens grooming","addressLine2":"Čs. exilu 40, Praha 12","id":"ChIJ6Q_nzAaRC0cR4EJPg5U9Glo","source":"SEARCH","latitude":50.0046293,"longitude":14.4164811,"provider":"google_places"}&effect=';
const UBER_KACEROV =
  'https://m.uber.com/looking?drop[0]={"addressLine1":"Barbershop v Praze - Real Barber Kačerov / mens grooming","addressLine2":"Budějovická 615/47, Praha 4","id":"ChIJIx7FF5CTC0cR0uT54costJI","source":"SEARCH","latitude":50.0420162,"longitude":14.4597433,"provider":"google_places"}&effect=';
const UBER_HAGIBOR =
  'https://m.uber.com/looking?drop[0]={"addressLine1":"Barbershop v Praze - Real Barber Hagibor / mens grooming","addressLine2":"Strašnice 10, Praha 10","id":"ChIJbQLiTIaTC0cRKaiGOPFx2nk","source":"SEARCH","latitude":50.07833609999999,"longitude":14.4836596,"provider":"google_places"}&effect=';
const UBER_BARRANDOV =
  'https://m.uber.com/go/home?drop[0]={"addressLine1":"Barbershop v Praze - Real Barber Barrandov / mens grooming","addressLine2":"nám. O. Scheinpflugové 1293/4, Praha 5-Hlubočepy","id":"ChIJBZGxYziXC0cRL0mQgxS4CzM","source":"SEARCH","latitude":50.030374699999996,"longitude":14.3612731,"provider":"google_places"}&effect=';

const BARRANDOV_DESCRIPTION_CS = `Pobočka na nám. O. Scheinpflugové na Praze 5-Hlubočepy. MHD i autem dobře dostupná; v okolí jsou možnosti parkování.`;

export const KUDY_K_NAM_VIDEOS: KudyKNamVideoItem[] = [
  {
    id: 'modrany',
    title: 'Modřany',
    source: null,
    mapsUrl: 'https://maps.app.goo.gl/7Qf76jRtVHv8nsvj9',
    wazeUrl:
      'https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-modrany-mens-grooming?to=place.ChIJ6Q_nzAaRC0cR4EJPg5U9Glo',
    uberUrl: UBER_MODRANY,
    description: MODRANY_DESCRIPTION,
    descriptionCs: MODRANY_DESCRIPTION_CS,
  },
  {
    id: 'kacerov',
    title: 'Kačerov',
    source: null,
    mapsUrl: 'https://maps.app.goo.gl/q8L2ukJKsfvD3BYz6',
    wazeUrl:
      'https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-kacerov-mens-grooming?place=ChIJIx7FF5CTC0cR0uT54costJI',
    uberUrl: UBER_KACEROV,
    description: KACEROV_DESCRIPTION,
    descriptionCs: KACEROV_DESCRIPTION_CS,
  },
  {
    id: 'hagibor',
    title: 'Hagibor',
    source: null,
    mapsUrl: 'https://maps.app.goo.gl/TY9ptGK7P2qv7j1A7',
    wazeUrl:
      'https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-hagibor-mens-grooming?place=ChIJbQLiTIaTC0cRKaiGOPFx2nk',
    uberUrl: UBER_HAGIBOR,
    description: HAGIBOR_DESCRIPTION,
    descriptionCs: HAGIBOR_DESCRIPTION_CS,
  },
  {
    id: 'barrandov',
    title: 'Barrandov',
    source: null,
    mapsUrl: 'https://maps.app.goo.gl/WYLrkp582cbsPUyK6',
    wazeUrl:
      'https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-barrandov-mens-grooming?to=place.ChIJBZGxYziXC0cRL0mQgxS4CzM',
    uberUrl: UBER_BARRANDOV,
    descriptionCs: BARRANDOV_DESCRIPTION_CS,
  },
];
