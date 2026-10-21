export const PROFILE_GDPR_DOCUMENT_TITLE = 'GDPR – Zásady ochrany osobních údajů';

export type ProfileGdprSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const PROFILE_GDPR_SECTIONS: ProfileGdprSection[] = [
  {
    heading: '1. Úvod',
    paragraphs: [
      'Společnost Real Barber s.r.o. nakládá s vašimi osobními údaji v souladu s platnou legislativou, zejména dle Nařízení Evropského parlamentu a Rady (EU) č. 2016/679, obecně známého jako GDPR. Tento dokument objasňuje zásady ochrany osobních údajů, včetně popisu shromažďovaných údajů, účelu jejich zpracování, osob, kterým mohou být tyto údaje poskytovány, a práv, která máte v souvislosti s ochranou vašich osobních údajů.',
    ],
  },
  {
    heading: '2. Kontakty',
    paragraphs: [
      'Správce osobních údajů v České republice je společnost Real Barber s.r.o., IČ: 19674104, se sídlem na adrese: Československého exilu 2288/40, 143 00 Praha 4. Tato společnost bude dále označována jako „Správce“ nebo „my“.',
      'Email: info@realbarber.cz',
      'Tel.: +420 608 332 881',
    ],
  },
  {
    heading: '3. Kategorie osobních údajů',
    paragraphs: [
      'Shromažďujeme a zpracováváme pouze osobní údaje, které nám poskytnete v souvislosti s využíváním našich služeb, a to v následujících kategoriích:',
    ],
  },
  {
    heading: '3.1. Identifikační údaje',
    paragraphs: [
      'Zahrnují jméno, příjmení, titul, rodné číslo nebo datum narození, adresu trvalého pobytu, druh a číslo dokladu totožnosti (občanský průkaz nebo pas), stát, orgán vydání a doba platnosti dokladu. V případě fyzických osob podnikatelů zahrnují také daňové identifikační číslo (DIČ) a identifikační číslo (IČ).',
    ],
  },
  {
    heading: '3.2. Kontaktní údaje',
    paragraphs: [
      'Patří sem vaše kontaktní informace, jako je e-mailová adresa, telefonní číslo a kontaktní adresa.',
    ],
  },
  {
    heading: '3.3. Údaje o zboží a využívání služeb',
    paragraphs: [
      'Tyto údaje zahrnují informace o zboží a službách, které jste od nás zakoupili, nebo s nimiž jste jednali (včetně záznamů telefonických hovorů či jiné komunikace). Dále mohou zahrnovat údaje o návštěvě našich internetových stránek, jako jsou IP adresa, cookies a další online identifikátory.',
    ],
  },
  {
    heading: '4. Právní základ pro zpracování',
    paragraphs: ['Vaše osobní údaje zpracováváme na základě těchto právních důvodů:'],
    bullets: [
      'Souhlas: Vámi poskytnutý souhlas při vyplnění formuláře nebo jiné formy komunikace.',
      'Plnění smlouvy: Zpracování údajů nezbytné pro plnění smluvních povinností vyplývajících z našich dohod.',
      'Zákonné povinnosti: Splnění zákonných požadavků, jako jsou daňové a účetní povinnosti.',
      'Oprávněné zájmy: Ochrana našich oprávněných zájmů, například ochrana našich práv nebo řízení vztahů se zákazníky.',
    ],
  },
  {
    paragraphs: [
      'Hlavní právní předpisy zahrnují zákon č. 89/2012 Sb., občanský zákoník, zákon o účetnictví, zákon o DPH, zákon o ochraně spotřebitele a další.',
    ],
  },
  {
    heading: '5. Nakládání s osobními údaji',
    paragraphs: [
      'Osobní údaje zpracováváme manuálně i elektronicky pomocí automatizovaných systémů. Používáme technická, organizační a personální opatření pro ochranu údajů, jejichž účinnost pravidelně kontrolujeme.',
    ],
  },
  {
    heading: '6. Příjemci a zpracovatelé osobních údajů',
    paragraphs: ['Vaše osobní údaje mohou být poskytnuty následujícím subjektům:'],
    bullets: [
      'Externím spolupracovníkům a dodavatelům za účelem plnění smlouvy.',
      'Poskytovatelům technických a softwarových služeb.',
      'Marketingovým agenturám a poskytovatelům reklamy za účelem zpracování marketingových kampaní.',
      'Poskytovatelům mzdové agendy, bezpečnostním agenturám a advokátním kancelářím v případě potřeby.',
    ],
  },
  {
    heading: '7. Předávání osobních údajů do třetích zemí',
    paragraphs: ['Vaše osobní údaje nejsou předávány mimo Evropskou unii.'],
  },
  {
    heading: '8. Doba uchování osobních údajů',
    paragraphs: [
      'Vaše osobní údaje uchováváme po dobu nezbytně nutnou k plnění právních povinností, smluvních závazků nebo na základě vašeho souhlasu. Osobní údaje zpracovávané na základě souhlasu jsou uchovávány po dobu trvání souhlasu nebo do jeho odvolání.',
    ],
  },
  {
    heading: '9. Vaše práva v souvislosti s ochranou osobních údajů',
    paragraphs: ['Máte následující práva týkající se zpracování vašich osobních údajů:'],
  },
  {
    heading: '9.1. Právo na přístup k osobním údajům',
    paragraphs: [
      'Máte právo získat potvrzení o tom, zda zpracováváme vaše osobní údaje, a pokud ano, získat přístup k těmto údajům, včetně informací o účelu zpracování, kategoriích zpracovávaných údajů, příjemcích a době uchování.',
    ],
  },
  {
    heading: '9.2. Právo na opravu osobních údajů',
    paragraphs: [
      'Pokud zjistíte, že některé z vašich osobních údajů, které zpracováváme, jsou nepřesné nebo neúplné, máte právo požadovat jejich opravu nebo doplnění.',
    ],
  },
  {
    heading: '9.3. Právo na výmaz osobních údajů („právo být zapomenut“)',
    paragraphs: ['Máte právo požadovat, abychom vaše osobní údaje vymazali, pokud:'],
    bullets: [
      'údaje již nejsou potřebné pro účel, pro který byly shromážděny;',
      'odvoláte souhlas a neexistuje žádný další právní důvod pro zpracování;',
      'vznesete námitku proti zpracování a neexistují žádné převažující oprávněné důvody;',
      'osobní údaje byly zpracovány protiprávně;',
      'osobní údaje musí být vymazány ke splnění právní povinnosti.',
    ],
  },
  {
    heading: '9.4. Právo na omezení zpracování',
    paragraphs: ['Máte právo požadovat, abychom omezili zpracování vašich osobních údajů, pokud:'],
    bullets: [
      'popíráte přesnost údajů – zpracování bude omezeno do doby, než přesnost ověříme;',
      'údaje jsou zpracovávány protiprávně, ale místo výmazu žádáte pouze jejich omezené zpracování;',
      'údaje již nepotřebujeme pro účely zpracování, ale potřebujete je pro určení, výkon nebo obhajobu právních nároků;',
      'vznesete námitku proti zpracování na základě oprávněného zájmu – omezení platí do doby, než ověříme, zda převažují naše oprávněné důvody.',
    ],
  },
  {
    heading: '9.5. Právo na přenositelnost osobních údajů',
    paragraphs: [
      'Pokud zpracováváme vaše osobní údaje automatizovaně na základě souhlasu nebo smlouvy, máte právo získat tyto údaje ve strukturovaném, běžně používaném a strojově čitelném formátu, abyste je mohli předat jinému správci. Rovněž máte právo požadovat, abychom je přímo předali jinému správci, pokud je to technicky proveditelné.',
    ],
  },
  {
    heading: '9.6. Právo vznést námitku',
    paragraphs: [
      'Máte právo kdykoli vznést námitku proti zpracování vašich osobních údajů z důvodů oprávněného zájmu, včetně profilování. Pokud se vaše údaje zpracovávají pro účely přímého marketingu, máte právo vznést námitku kdykoli, a vaše údaje již nebudou pro tyto účely zpracovávány.',
    ],
  },
  {
    heading: '9.7. Právo odvolat souhlas',
    paragraphs: [
      'Pokud jste nám udělili souhlas se zpracováním vašich osobních údajů, máte právo tento souhlas kdykoli odvolat. Odvoláním souhlasu však není dotčena zákonnost zpracování, které bylo na základě souhlasu prováděno před jeho odvoláním.',
    ],
  },
  {
    heading: '9.8. Právo podat stížnost u dozorového úřadu',
    paragraphs: [
      'Máte právo podat stížnost u dozorového úřadu, pokud se domníváte, že zpracování vašich osobních údajů není v souladu s právními předpisy na ochranu osobních údajů. V České republice je dozorovým úřadem Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, tel. +420 234 665 111.',
    ],
  },
  {
    heading: '9.9. Uplatnění práv',
    paragraphs: [
      'Veškeré žádosti týkající se vašich práv můžete zasílat na naše kontakty uvedené výše. Na žádosti odpovídáme bez zbytečného odkladu, obvykle do 30 dnů. V případě složitějších žádostí si vyhrazujeme právo tuto lhůtu prodloužit o další dva měsíce, přičemž vás o tom budeme informovat včetně důvodu prodloužení.',
    ],
  },
  {
    heading: '10. Osobní údaje zaměstnanců a uchazečů o zaměstnání',
    paragraphs: [
      'Tato část popisuje, jak zpracováváme osobní údaje našich zaměstnanců a uchazečů o zaměstnání, a zahrnuje následující kategorie údajů:',
    ],
    bullets: [
      'Identifikační údaje: jméno, příjmení, datum narození, rodné číslo.',
      'Kontaktní údaje: adresa trvalého bydliště, telefonní číslo, e-mailová adresa.',
      'Další osobní údaje: informace o vzdělání, rodinný stav, údaje o zdravotním pojištění, fotografie, číslo občanského průkazu.',
    ],
  },
  {
    paragraphs: [
      'Zpracováváme tyto údaje z důvodů plnění pracovních smluv, právních povinností (daňové, účetní) a oprávněných zájmů (např. ochrana majetku a zdraví).',
    ],
  },
  {
    heading: '11. Internetové stránky a cookies',
    paragraphs: [
      'Na našich webových stránkách používáme cookies a další technologie, které nám pomáhají zlepšovat uživatelský komfort a analyzovat návštěvnost. Cookies jsou malé textové soubory ukládané do vašeho zařízení, které nám umožňují vás při dalších návštěvách rozpoznat.',
      'Pokud si nepřejete, aby cookies byly ukládány, můžete jejich ukládání zakázat ve vašem prohlížeči. Mějte však na paměti, že některé funkce webových stránek nemusí fungovat správně, pokud cookies zakážete.',
    ],
  },
  {
    heading: '12. Změny zásad ochrany osobních údajů',
    paragraphs: [
      'Vyhrazujeme si právo tyto zásady kdykoliv aktualizovat. Veškeré změny budou zveřejněny na této stránce, abyste měli vždy aktuální informace o ochraně vašich osobních údajů.',
    ],
  },
  {
    heading: 'Smazání účtu a osobních údajů (Real Barber aplikace)',
    paragraphs: [
      'Pokud chcete smazat svůj účet v aplikaci Real Barber a přidružené údaje, postupujte takto:',
      'Napište nám žádost na e‑mail: info@realbarber.cz',
      'Do zprávy uveďte:',
    ],
    bullets: [
      'že žádáte o smazání účtu',
      'identifikátor účtu: e‑mail nebo telefon, kterým se v aplikaci přihlašujete',
      'volitelně: jméno a příjmení (pro rychlejší dohledání)',
    ],
  },
  {
    heading: 'Co bude smazáno',
    paragraphs: ['Po ověření žádosti smažeme váš účet a přidružená data, zejména:'],
    bullets: [
      'profilové údaje (např. jméno, kontakt),',
      'uživatelsky nahraná média (např. fotografie účesů),',
      'další data uložená v souvislosti s používáním aplikace.',
    ],
  },
  {
    heading: 'Doba vyřízení',
    paragraphs: ['Žádosti vyřizujeme obvykle do 5 dnů od přijetí.'],
  },
  {
    heading: 'Důležité informace',
    paragraphs: [
      'V některých případech můžeme být povinni uchovat vybrané záznamy po dobu vyžadovanou právními předpisy (např. účetní a daňové povinnosti). V takovém případě budou takové údaje omezeny na nezbytné minimum a uchovány pouze po nezbytnou dobu.',
      'Pokud máte problém s přístupem do aplikace a nemůžete žádost odeslat přímo z ní, můžete použít výše uvedený e‑mail.',
    ],
  },
];
