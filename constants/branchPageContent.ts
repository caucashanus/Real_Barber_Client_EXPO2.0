import type { BranchInternalId } from '@/constants/crmBranchIds';

export type BranchDirectionsSectionContent = {
  title: string;
  paragraphs: string[];
};

export type BranchPageContent = {
  aboutParagraphs: string[];
  directionsIntro: string;
  directionsSections: BranchDirectionsSectionContent[];
  directionsVideoUrl?: string;
  parkingMapVimeoId?: string;
  managerTitle: string;
  managerParagraphs: string[];
};

function mateoManagerParagraphs(branchLocative: string): string[] {
  return [
    `Jmenuji se Mateo a jsem vedoucí pobočky ${branchLocative}.`,
    'Mým cílem je, aby se každý zákazník cítil, že je u nás v dobrých rukou. Každý střih a každá úprava, které provádíme, jsou způsobem, jak ukázat svou vášeň a dovednosti k řemeslu. Věřím, že kvalita našich služeb je základem úspěchu. Moje práce není jen o tom, jak správně použít nůžky a dobře ostříhat.',
    'Jsem tu také proto, abych vedl a podporoval svůj tým. Naslouchám jim, chápu jejich potřeby a snažím se vytvořit pozitivní pracovní prostředí. Spokojený tým je klíčem k tomu, aby byli spokojení i naši zákazníci. Jsem přesvědčený, že neustálé zlepšování je důležité. Proto v rámci RB organizujeme pravidelná školení a workshopy, kde se všichni můžeme učit nové techniky a zdokonalovat své dovednosti.',
    'Chci, aby každý v našem týmu měl možnost růstu a rozvoje. Vedení této pobočky je pro mě velkou výzvou i radostí. Každý den se snažím, aby naši zákazníci odcházeli spokojení a rádi se k nám vraceli. To je pro mě největší odměna.',
  ];
}

const BRANCH_PAGE_CONTENT: Record<BranchInternalId, BranchPageContent> = {
  modrany: {
    aboutParagraphs: [
      'Tato provozovna je naše první ❤️, otevřeli jsme ji 23.10. 2022 s třemi obsluhy. Po necelém roce náš tým sčítal sedm holičů a my se rozhodli pro výstavbu druhého patra. Dnes máme na této lokaci sedm křesel, dvě patra barber zóny a dva mycí boxy s masáží v obou patrech.',
    ],
    directionsIntro:
      'Naše pobočka Real Barber – Modřany je snadno dostupná jak veřejnou dopravou, tak autem.',
    directionsSections: [
      {
        title: 'Veřejná doprava',
        paragraphs: [
          'Pro ty, kteří cestují veřejnou dopravou, jsme situováni blízko stanice autobusu (linka 190, 150, 246, 117) nebo tramvajové zastávky Poliklinika Modřany (linka 27, 17, 3, 92), odkud je to k nám pouhé 3 minuty chůze.',
        ],
      },
      {
        title: 'Autem',
        paragraphs: [
          'Pro návštěvníky přijíždějící autem je k dispozici několik možností parkování v blízkém okolí. Doporučujeme hodinové parkování zdarma na protější straně ulice – doporučujeme mít v autě parkovací disk.',
        ],
      },
    ],
    parkingMapVimeoId: '1054933503',
    managerTitle: 'Manažer Rejlis',
    managerParagraphs: [
      'Jmenuji se Filip Rejlek a jsem vedoucí pobočky v Modřanech. Mým cílem a naší ideologií, značky Real Barber, je přistupovat ke každému zákazníkovi individuálně, lidsky a profesionálně.',
      'Vedení této pobočky v Modřanech je pro mě velká zodpovědnost ale i vášeň. Udělám vše co je v mých silách pro to, aby každý zákazník odcházel spokojený a holiči měli možnost se rozvíjet a růst k lepšímu.',
    ],
  },
  kacerov: {
    aboutParagraphs: [
      'Nachází v srdci části Prahy 4, před stanicí metra Kačerov v druhém patře nad známou pizzerií, ovšem ale s naším vlastním bočním vchodem. Taktéž jsme nedaleko obchodního a zábavního centra DBK Budějovická.',
    ],
    directionsIntro:
      'Naše pobočka Real Barber – Kačerov je snadno dostupná jak veřejnou dopravou, tak autem.',
    directionsSections: [
      {
        title: 'Metrem',
        paragraphs: [
          'Pokud preferujete cestování metrem, můžete využít linku C (červená linka). Nejbližší stanice je zastávka Kačerov, která je současně i vlakové nádraží, stanice se nachází jen krátkou chůzí od našeho salonu.',
        ],
      },
      {
        title: 'Autem',
        paragraphs: [
          'Pro návštěvníky přijíždějící autem je k dispozici několik možností parkování v blízkém okolí. Parkovací místa před salonem prosím využívejte pouze do 18:00 a pouze na dobu Vaší návštěvy.',
        ],
      },
    ],
    parkingMapVimeoId: '1059789515',
    managerTitle: 'Manažer Mateo',
    managerParagraphs: mateoManagerParagraphs('na Kačerově'),
  },
  hagibor: {
    aboutParagraphs: [
      'Nacházíme se v srdci moderní čtvrti Hagibor, v Praze 10, jen pár kroků od hlavní dopravní tepny, u stanice metra Želivského. Náš barbershop se nachází v přízemí nově postavené budovy s vlastním pohodlným vchodem z ulice.',
    ],
    directionsIntro:
      'Naše pobočka Real Barber - Hagibor je snadno dostupná jak veřejnou dopravou, tak autem.',
    directionsSections: [
      {
        title: 'Veřejná doprava',
        paragraphs: [
          'Nejbližší stanice metra je Želivského na lince A; můžete také využít tramvajové linky, které zastavují na stanici Krematorium Strašnice a Vinohradské hřbitovy, odkud je to krátká procházka k nám.',
        ],
      },
      {
        title: 'Autem',
        paragraphs: [
          'Pro zákazníky, kteří přijedou autem, je k dispozici pohodlné parkování v bílé zóně přímo před salonem.',
        ],
      },
    ],
    directionsVideoUrl: 'https://s3.xrb.cz/crm/media/1773073073455-tvywkt.mov',
    parkingMapVimeoId: '1169647063',
    managerTitle: 'Manažer Mateo',
    managerParagraphs: mateoManagerParagraphs('na Hagiboru'),
  },
  barrandov: {
    aboutParagraphs: [
      'Pobočka Real Barber Barrandov se nachází na náměstí O. Scheinpflugové v Praze 5-Hlubočepy. Moderně vybavený salon s důrazem na precizní střihy a přátelskou atmosféru.',
    ],
    directionsIntro:
      'Naše pobočka Real Barber – Barrandov je snadno dostupná jak veřejnou dopravou, tak autem.',
    directionsSections: [
      {
        title: 'Veřejná doprava',
        paragraphs: [
          'Pobočka je dobře dostupná MHD z centra i okolních částí Prahy 5. V blízkosti jsou tramvajové a autobusové zastávky.',
        ],
      },
      {
        title: 'Autem',
        paragraphs: [
          'V okolí jsou možnosti parkování; doporučujeme využít mapu parkovacích zón v blízkosti salonu.',
        ],
      },
    ],
    directionsVideoUrl: 'https://s3.xrb.cz/crm/media/1773074185651-zz8p6f.mp4',
    parkingMapVimeoId: '1134576899',
    managerTitle: 'Manažer Zlatej',
    managerParagraphs: [
      'Jmenuji se Zlatej a jsem vedoucí pobočky na Barrandově.',
      'Mým cílem a filozofií značky Real Barber je přistupovat ke každému zákazníkovi individuálně, s respektem a lidskostí. Každý člověk, který k nám přijde, je originál – a proto si zaslouží přístup na míru.',
      'Vedení této pobočky beru jako velkou zodpovědnost i vášeň. Udělám maximum pro to, aby se naši zákazníci vždy rádi vraceli a aby naši barbeři měli prostor růst, učit se a zlepšovat.',
    ],
  },
};

export function getBranchPageContent(
  internalId: BranchInternalId | undefined
): BranchPageContent | null {
  if (!internalId) return null;
  return BRANCH_PAGE_CONTENT[internalId] ?? null;
}
