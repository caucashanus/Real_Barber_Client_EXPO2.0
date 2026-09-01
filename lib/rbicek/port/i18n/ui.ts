import type { WidgetLocale } from "@/lib/rbicek/port/types/config";
import { withoutDashes } from "@/lib/rbicek/port/i18n/locale";

const UI = {
  chatAria: {
    cs: "Chat s Rbíčkem",
    en: "Chat with Rbíček",
    uk: "Чат з Rbíčkem",
  },
  send: {
    cs: "Odeslat",
    en: "Send",
    uk: "Надіслати",
  },
  placeholderOperator: {
    cs: "Napište svůj dotaz operátorovi...",
    en: "Write your question for the operator...",
    uk: "Напишіть своє питання оператору...",
  },
  placeholderMessage: {
    cs: "Napište zprávu...",
    en: "Write a message...",
    uk: "Напишіть повідомлення...",
  },
  closeExpanded: {
    cs: "Zavřít rozbalený widget",
    en: "Close expanded widget",
    uk: "Закрити розгорнутий віджет",
  },
  backToChat: {
    cs: "Zpět do chatu",
    en: "Back to chat",
    uk: "Назад до чату",
  },
  historyTitle: {
    cs: "Historie konverzací",
    en: "Conversation history",
    uk: "Історія розмов",
  },
  shrinkWidget: {
    cs: "Zmenšit widget",
    en: "Shrink widget",
    uk: "Зменшити віджет",
  },
  expandWidget: {
    cs: "Rozbalit widget",
    en: "Expand widget",
    uk: "Розгорнути віджет",
  },
  close: {
    cs: "Zavřít",
    en: "Close",
    uk: "Закрити",
  },
  newConversation: {
    cs: "Začít znovu",
    en: "Start over",
    uk: "Почати знову",
  },
  assistantTitle: {
    cs: "Asistent Rbíček",
    en: "Assistant Rbíček",
    uk: "Асистент Rbíček",
  },
  shrink: {
    cs: "Zmenšit",
    en: "Shrink",
    uk: "Зменшити",
  },
  expand: {
    cs: "Rozbalit",
    en: "Expand",
    uk: "Розгорнути",
  },
  historyEmpty: {
    cs: "Zatím nemáte uložené konverzace. Nový chat začněte tlačítkem níže.",
    en: "You have no saved conversations yet. Start a new chat with the button below.",
    uk: "Поки немає збережених розмов. Почніть новий чат кнопкою нижче.",
  },
  historyItem: {
    cs: "Rbíček · {date}",
    en: "Rbíček · {date}",
    uk: "Rbíček · {date}",
  },
  loginBanner: {
    cs: "Přihlaste se a spravujte rezervace rychleji. Uvidíte historii návštěv i stav rezervací.",
    en: "Sign in to manage bookings faster. You will see visit history and booking status.",
    uk: "Увійдіть, щоб швидше керувати бронюваннями. Побачите історію візитів і статус бронювань.",
  },
  loginHere: {
    cs: "Přihlaste se zde.",
    en: "Sign in here.",
    uk: "Увійдіть тут.",
  },
  openChat: {
    cs: "Otevřít chat s Rbíčkem",
    en: "Open chat with Rbíček",
    uk: "Відкрити чат з Rbíčкем",
  },
  closeChat: {
    cs: "Zavřít chat",
    en: "Close chat",
    uk: "Закрити чат",
  },
  maps: { cs: "Mapy", en: "Maps", uk: "Мапи" },
  waze: { cs: "Waze", en: "Waze", uk: "Waze" },
  navigate: { cs: "Navigovat", en: "Navigate", uk: "Маршрут" },
  detail: { cs: "Detail", en: "Details", uk: "Деталі" },
  nextBranches: {
    cs: "Další pobočky",
    en: "More branches",
    uk: "Наступні філії",
  },
  prevBranches: {
    cs: "Předchozí pobočky",
    en: "Previous branches",
    uk: "Попередні філії",
  },
  book: { cs: "Objednat", en: "Book", uk: "Записатися" },
  nearestSlot: {
    cs: "Nejbližší termín",
    en: "Nearest time",
    uk: "Найближчий термін",
  },
  shiftToday: {
    cs: "Směna",
    en: "Shift",
    uk: "Зміна",
  },
  nextSlots: {
    cs: "Další termíny",
    en: "More times",
    uk: "Наступні терміни",
  },
  prevSlots: {
    cs: "Předchozí termíny",
    en: "Previous times",
    uk: "Попередні терміни",
  },
  profile: { cs: "Profil", en: "Profile", uk: "Профіль" },
  waitlist: {
    cs: "Čekací listina",
    en: "Waitlist",
    uk: "Список очікування",
  },
  fullyBooked: {
    cs: "Dnes plno",
    en: "Full today",
    uk: "Сьогодні зайнято",
  },
  nextBarbers: {
    cs: "Další barbeři",
    en: "More barbers",
    uk: "Наступні барбери",
  },
  prevBarbers: {
    cs: "Předchozí barbeři",
    en: "Previous barbers",
    uk: "Попередні барбери",
  },
  nextPromos: {
    cs: "Další akce",
    en: "More offers",
    uk: "Наступní акції",
  },
  prevPromos: {
    cs: "Předchozí akce",
    en: "Previous offers",
    uk: "Попередні акції",
  },
  today: { cs: "Dnes", en: "Today", uk: "Сьогодні" },
  tomorrow: { cs: "Zítra", en: "Tomorrow", uk: "Завтра" },
  dayAfter: { cs: "Pozítří", en: "Day after tomorrow", uk: "Післязавтра" },
} as const;

export type UiKey = keyof typeof UI;

export function tUi(key: UiKey, locale: WidgetLocale | undefined): string {
  const row = UI[key];
  const lang: WidgetLocale =
    locale === "en" || locale === "uk" ? locale : "cs";
  return withoutDashes(row[lang]);
}

export function tUiReplace(
  key: UiKey,
  locale: WidgetLocale | undefined,
  vars: Record<string, string>,
): string {
  let text = tUi(key, locale);
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }
  return text;
}
