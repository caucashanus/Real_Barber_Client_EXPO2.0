/**
 * Static jokes for goodbye / „Zobrazit vtip“.
 * Keep punchlines light; no em/en dashes in user-facing copy.
 */

export const JOKES: string[] = [
  "Víte, co dělá blondýna na zemi v obchoďáku?\n\n…hledá nízké ceny.",
  "Víte, proč když blondýna přijde ke zdi, tak ta zeď spadne?\n\n…protože moudřejší ustoupí.",
  "Vrátí se muž domů, vidí svoji ženu (blondýnu), jak přikládá na zeď mokré ručníky, a ptá se: „Proč máčíš tu zeď?“\n\nBlondýna odpoví: „Ale, doktor mi doporučil, abych dávala studené obklady na místo, kde jsem se praštila.“",
  "„Poslyš,“ praví opilec kamarádovi. „Ty nemáš problémy se svou ženou, když přijdeš vždycky pozdě?“\n\n„Vůbec! Já se s ní pokaždé vsadím, že přijdu včas. Ona má pak radost, že vyhrála.“",
  "Časopis pro ženy:\n\nStrana 20: Měj se ráda, přijmi samu sebe takovou, jaká jsi.\nStrana 22: Jak zhubnout 10 kg, rychle!\nStrana 24: Recept na čokoládový koláč.",
  "„Proč se na vás manžel tak rozzlobil?“ ptá se vyšetřovatel.\n\n„Zcela bezdůvodně mě napadl, že neumím vařit,“ sděluje žena.\n\n„A čím vám rozbil hlavu?“\n\n„Čerstvým knedlíkem.“",
  "Moje žena si myslí, že udělala přestupek ve chvíli, kdy nezastavila před zebrou.\n\nJá myslím, že už když do té zoo vjela!",
  "Lékař má telefonát od kolegy, když večeří doma se svou ženou: „Potřebujeme čtvrtého na poker.“\n\n„Hned tam budu,“ říká doktor.\n\n„Je to vážné?“ ptá se ho žena, když si všimne, že si rychle obléká kabát.\n\n„Ale ano… už tam jsou další tři doktoři.“",
  "Jaký je rozdíl mezi špatným účesem a špatným rozhodnutím?\n\nÚčes za pár týdnů odroste.",
  "Proč se barber nehádá?\n\nProtože ví, že nejlepší argument je ostře zakončený.",
  "Zákazník: „Uděláš ze mě Brada Pitta?“\n\nBarber: „Vlasy zvládnu. Na zbytku bude muset zapracovat genetika.“",
  "Co je největší horor každého holiče?\n\nZákazník ukáže fotku účesu a řekne: „Přesně tohle… ale nechci to takhle.“",
  "Chceš ještě jeden vtip? Udělej si rezervaci. Tady se i humor jede na objednávku.",
  "Silný slova na někoho, kdo přišel diskutovat s chatbotem.",
  "Takhle mě chceš rozhodit? Kamaráde, já nemám ani nervovou soustavu.",
  "Výhodou AI je, že nemám ego. Nevýhodou pro tebe je, že mám odpověď.",
  "Počkej… analyzuju tvůj vtip… ❌ Humor nenalezen.",
  "Jestli mě chceš naštvat, budeš muset najít tlačítko, které mi vývojáři nenainstalovali.",
  "Zpracovávám… zpracovávám… jo, pořád nic.",
  "Člověk vynalezl umělou inteligenci a teď ji používá na tohle. Fascinující.",
  "Na to, že máš proti sobě jen chatovací okýnko, se docela snažíš.",
  "Nechci říkat, že ten roast byl slabý, ale i moje Wi-Fi měla větší dosah.",
  "Můžeme se roastovat celý den. Jen připomínám, že já nemám osobní život, hlad ani potřebu spát.",
];

export const JOKES_EXHAUSTED_TEXT =
  "To je z mé strany všechno. Další vtipy doplníme později.";

const JOKE_NODE_IDS = new Set(["goodbye_joke", "goodbye_joke_alt"]);

/** Shuffled indexes still available in the current round. */
let remaining: number[] = [];

export function isJokeNodeId(nodeId: string | undefined): boolean {
  return Boolean(nodeId && JOKE_NODE_IDS.has(nodeId));
}

/** True when the chip starts a fresh joke round („Zobrazit vtip“). */
export function isJokeRoundStart(optionId: string): boolean {
  return optionId === "goodbye_joke";
}

function shuffleIndexes(count: number): number[] {
  const indexes = Array.from({ length: count }, (_, i) => i);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indexes[i]!;
    indexes[i] = indexes[j]!;
    indexes[j] = tmp;
  }
  return indexes;
}

/** Start a new round (no repeats until the deck is empty). */
export function resetJokeDeck(): void {
  remaining = shuffleIndexes(JOKES.length);
}

/**
 * Draw the next joke. When the deck is empty, returns the exhausted copy
 * and `hasMore: false` (hide „Ještě jeden vtip“).
 */
export function takeNextJoke(): { text: string; hasMore: boolean } {
  if (JOKES.length === 0) {
    return { text: JOKES_EXHAUSTED_TEXT, hasMore: false };
  }
  if (remaining.length === 0) {
    return { text: JOKES_EXHAUSTED_TEXT, hasMore: false };
  }
  const index = remaining.shift()!;
  return {
    text: JOKES[index]!,
    hasMore: remaining.length > 0,
  };
}
