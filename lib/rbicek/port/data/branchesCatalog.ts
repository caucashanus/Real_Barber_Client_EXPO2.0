import type { BranchContactId } from "@/lib/rbicek/port/data/branchContacts";
import { branchContacts } from "@/lib/rbicek/port/data/branchContacts";

export const CONTACT_PHONE = "+420 608 332 881";
export const CONTACT_EMAIL = "info@realbarber.cz";

export const OPENING_HOURS_WEEKDAYS = "Po-Pá 9-21";
export const OPENING_HOURS_WEEKEND = "So-Ne 10-18";

export type BranchCatalogEntry = {
  id: BranchContactId;
  name: string;
  district: string;
  address: string;
  webUrl: string;
  note: string;
  directions: string;
  mapsUrl: string;
  wazeUrl: string;
  accessible: boolean;
};

export const BRANCHES_CATALOG: BranchCatalogEntry[] = [
  {
    id: "modrany",
    name: "Modřany",
    district: "Praha 12",
    address: "Čs. exilu 40, Praha 12",
    webUrl: "/branches/real-barber-modrany/",
    note: "Mezi kavárnami M3 a Kavafaktura na rušné ulici v Modřanech.",
    directions:
      "Blízko radnice Prahy 12. MHD: zastávka Poliklinika Modřany (autobus 190, 150, 246, 117 nebo tramvaj 27, 17, 3, 92), k salonu cca 3 minuty chůze. Autem: parkování zdarma na hodinu podél silnice naproti salonu.",
    mapsUrl: branchContacts.find((b) => b.id === "modrany")!.mapsUrl,
    wazeUrl: branchContacts.find((b) => b.id === "modrany")!.wazeUrl,
    accessible: true,
  },
  {
    id: "kacerov",
    name: "Kačerov",
    district: "Praha 4",
    address: "Budějovická 615/47, Praha 4",
    webUrl: "/branches/real-barber-kacerov-praha-4/",
    note: "Ve zvýšeném patře nad pizzerií, vlastní vchod schodištěm nebo lávkou z vestibulu MHD.",
    directions:
      "Před stanicí metra Kačerov (linka C), nedaleko DBK Budějovická. Autobusová zastávka Kačerov. Autem: parkoviště v okolí nebo místa před salonem do 18:00 po dobu návštěvy.",
    mapsUrl: branchContacts.find((b) => b.id === "kacerov")!.mapsUrl,
    wazeUrl: branchContacts.find((b) => b.id === "kacerov")!.wazeUrl,
    accessible: true,
  },
  {
    id: "hagibor",
    name: "Hagibor",
    district: "Praha 10",
    address: "Počernická 3492/1a, Praha 10",
    webUrl: "/branches/real-barber-hagibor-strasnice/",
    note: "V novém komplexu developerského projektu Hagibor.",
    directions:
      "Metro Želivského (linka A). Tramvaj: zastávky Krematorium Strašnice nebo Vinohradské hřbitovy, krátká procházka k salonu. Autem: parkování v bílé zóně před salonem.",
    mapsUrl: branchContacts.find((b) => b.id === "hagibor")!.mapsUrl,
    wazeUrl: branchContacts.find((b) => b.id === "hagibor")!.wazeUrl,
    accessible: true,
  },
  {
    id: "barrandov",
    name: "Barrandov",
    district: "Praha 5",
    address: "O. Scheinpflugové 1293/4, Praha 5",
    webUrl:
      "/branches/barbershop-v-praze-real-barber-barrandov-mens-grooming/",
    note: "Na barrandovském náměstí naproti La Zmrzce a Mini Gymu.",
    directions:
      "Zastávka Náměstí Olgy Scheinpflugové, pár kroků od salonu. Autem: parkování v okolí barrandovského náměstí.",
    mapsUrl: branchContacts.find((b) => b.id === "barrandov")!.mapsUrl,
    wazeUrl: branchContacts.find((b) => b.id === "barrandov")!.wazeUrl,
    accessible: true,
  },
];

export function branchNodeId(id: BranchContactId): string {
  return `branch_${id}`;
}

export function branchPickId(id: BranchContactId): string {
  return `branch_pick_${id}`;
}

export function branchChatMessage(branch: BranchCatalogEntry): string {
  const parts = [
    `${branch.address} (${branch.district})`,
    branch.note,
    branch.directions,
    `Otevřeno: ${OPENING_HOURS_WEEKDAYS}, ${OPENING_HOURS_WEEKEND}.`,
  ];

  if (branch.accessible) {
    parts.push("Bezbariérový přístup.");
  }

  return parts.join("\n\n");
}

export const CONTACTS_INTRO =
  `Máte dotaz, připomínku nebo chcete rezervovat termín? Zavolejte ${CONTACT_PHONE} nebo napište na ${CONTACT_EMAIL}.\n\nVšechny pobočky mají stejnou otevírací dobu: ${OPENING_HOURS_WEEKDAYS}, ${OPENING_HOURS_WEEKEND}. Otevřeno každý den včetně svátků.`;
