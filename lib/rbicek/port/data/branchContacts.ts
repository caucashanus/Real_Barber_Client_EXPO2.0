import {
  getBranchNavigateMapsQuery,
  googleMapsSearchUrl,
  wazeNavigateUrl,
} from "@/lib/rbicek/port/lib/branchNavigate";

export type BranchContactId = "modrany" | "kacerov" | "hagibor" | "barrandov";

export type BranchContact = {
  id: BranchContactId;
  address: string;
  note: string;
  mapsUrl: string;
  wazeUrl: string;
};

/** Data z seo-starter-2 `contactBranches.ts` + tipy k nalezení vchodu. */
export const branchContacts: BranchContact[] = [
  {
    id: "modrany",
    address: "Čs. exilu 40, Praha 12",
    note: "Mezi kavárnami M3 a Kavafaktura. MHD Poliklinika Modřany, cca 3 min chůze. Parkování zdarma na hodinu naproti salonu.",
    mapsUrl: "https://maps.app.goo.gl/DKTJCpA6WgT7u68L6",
    wazeUrl:
      "https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-modrany-mens-grooming?to=place.ChIJ6Q_nzAaRC0cR4EJPg5U9Glo",
  },
  {
    id: "kacerov",
    address: "Budějovická 615/47, Praha 4",
    note: "Ve zvýšeném patře nad pizzerií. Vlastní vchod: schodiště vpravo od rohu budovy nebo lávka z vestibulu MHD nad úroveň metra.",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=place_id:ChIJIx7FF5CTC0cR0uT54costJI",
    wazeUrl:
      "https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-kacerov-mens-grooming?to=place.ChIJIx7FF5CTC0cR0uT54costJI",
  },
  {
    id: "hagibor",
    address: "Počernická 3492/1a, Praha 10",
    note: "Komplex Hagibor. Metro Želivského, tramvaj Krematorium Strašnice nebo Vinohradské hřbitovy. Parkování v bílé zóně před salonem.",
    mapsUrl: "https://maps.app.goo.gl/oB16u2pG1CQWVB4P8",
    wazeUrl:
      "https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-hagibor-mens-grooming?to=place.ChIJbQLiTIaTC0cRKaiGOPFx2nk",
  },
  {
    id: "barrandov",
    address: "nám. O. Scheinpflugové 4, Praha 5",
    note: "Na barrandovském náměstí naproti La Zmrzce a Mini Gymu, pár kroků od zastávky Náměstí Olgy Scheinpflugové.",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=place_id:ChIJBZGxYziXC0cRL0mQgxS4CzM",
    wazeUrl:
      "https://www.waze.com/en/live-map/directions/cz/hlavni-mesto-praha/barbershop-v-praze-real-barber-barrandov-mens-grooming?to=place.ChIJBZGxYziXC0cRL0mQgxS4CzM",
  },
];

function branchNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolveBranchContactId(name: string): BranchContactId | null {
  const key = branchNameKey(name);
  for (const id of ["modrany", "kacerov", "hagibor", "barrandov"] as const) {
    if (key.includes(id)) return id;
  }
  return null;
}

export function getBranchContact(name: string): BranchContact | undefined {
  const id = resolveBranchContactId(name);
  if (!id) return undefined;
  return branchContacts.find((b) => b.id === id);
}

/** Google / Waze URL: preferujeme přímé deeplinky, jinak generujeme z adresy. */
export function branchGoogleMapsUrl(
  name: string,
  address?: string | null,
): string {
  const contact = getBranchContact(name);
  if (contact?.mapsUrl) return contact.mapsUrl;
  const query = getBranchNavigateMapsQuery(name, address ?? contact?.address);
  return query ? googleMapsSearchUrl(query) : googleMapsSearchUrl(name);
}

export function branchWazeUrl(name: string, address?: string | null): string {
  const contact = getBranchContact(name);
  if (contact?.wazeUrl) return contact.wazeUrl;
  const query = getBranchNavigateMapsQuery(name, address ?? contact?.address);
  return query ? wazeNavigateUrl(query) : wazeNavigateUrl(name);
}

/** Ulice pro kartu (městská část je zvlášť v district). */
export function branchStreetAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return trimmed;
  const comma = trimmed.indexOf(",");
  if (comma === -1) return trimmed;
  return trimmed.slice(0, comma).trim();
}
