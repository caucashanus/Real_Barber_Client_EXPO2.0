import type { WidgetLocale } from "@/lib/rbicek/port/types/config";
import { withoutDashes } from "@/lib/rbicek/port/i18n/locale";

const SYSTEM = {
  handedOver: {
    cs: "Konverzace přešla na operátora.",
    en: "The conversation was handed over to an operator.",
    uk: "Розмову передано оператору.",
  },
  returnedToQueue: {
    cs: "Konverzace je zpět ve frontě.",
    en: "The conversation is back in the queue.",
    uk: "Розмову повернуто в чергу.",
  },
  closed: {
    cs: "Konverzace je uzavřena.",
    en: "The conversation is closed.",
    uk: "Розмову закрито.",
  },
  taken: {
    cs: "Operátor převzal konverzaci.",
    en: "An operator took over the conversation.",
    uk: "Оператор прийняв розмову.",
  },
  update: {
    cs: "Aktualizace konverzace.",
    en: "Conversation update.",
    uk: "Оновлення розмови.",
  },
  operatorEnded: {
    cs: "Konverzace s operátorem byla ukončena.",
    en: "The conversation with the operator has ended.",
    uk: "Розмову з оператором завершено.",
  },
  teamWorkingFull: {
    cs: "Dnes pracují, ale jsou plně obsazeni. Zapište se na čekací listinu u konkrétního holiče:",
    en: "They are working today but are fully booked. Join the waitlist for a specific barber:",
    uk: "Сьогодні працюють, але повністю зайняті. Запишіться в список очікування до конкретного барбера:",
  },
  teamWorking: {
    cs: "Dnes pracují:",
    en: "Working today:",
    uk: "Сьогодні працюють:",
  },
  slotsIntro: {
    cs: "Nejbližší volné termíny:",
    en: "Nearest available times:",
    uk: "Найближчі вільні терміни:",
  },
  promoIntro: {
    cs: "Aktuální akce a kupóny:",
    en: "Current offers and coupons:",
    uk: "Поточні акції та купони:",
  },
  sendFailed: {
    cs: "Zprávu se nepodařilo odeslat. Zkuste to znovu, nebo volejte +420 608 332 881.",
    en: "The message could not be sent. Try again, or call +420 608 332 881.",
    uk: "Не вдалося надіслати повідомлення. Спробуйте ще раз або зателефонуйте +420 608 332 881.",
  },
  handoffSummary: {
    cs: "Shrnutí předchozí konverzace ve widgetu:",
    en: "Summary of the previous widget conversation:",
    uk: "Підсумок попередньої розмови у віджеті:",
  },
  slotsEmpty: {
    cs: "V nejbližších dnech jsme nenašli volné termíny. Zkuste jinou pobočku, podívejte se kdo dnes pracuje, nebo se pište na čekací listinu u konkrétního holiče.",
    en: "We found no free times in the coming days. Try another branch, see who is working today, or join a barber waitlist.",
    uk: "Найближчими днями вільних термінів немає. Спробуйте іншу філію, подивіться хто сьогодні працює, або запишіться в список очікування до барбера.",
  },
  slotsFew: {
    cs: "Našli jsme jen pár termínů. Když vám nevyhovují, zkuste jinou pobočku nebo holiče.",
    en: "We found only a few times. If they do not suit you, try another branch or barber.",
    uk: "Знайшли лише кілька термінів. Якщо не підходять, спробуйте іншу філію або барбера.",
  },
  slotsFallback: {
    cs: "Termíny se teď nepodařilo načíst. Objednejte se prosím na webu nebo volejte +420 608 332 881.",
    en: "Times could not be loaded. Please book on the website or call +420 608 332 881.",
    uk: "Не вдалося завантажити терміни. Запишіться на сайті або зателефонуйте +420 608 332 881.",
  },
  teamFallback: {
    cs: "Rozpis směn se teď nepodařilo načíst. Podívejte se na web realbarber.cz/tym nebo volejte +420 608 332 881.",
    en: "The shift schedule could not be loaded. See realbarber.cz/tym or call +420 608 332 881.",
    uk: "Не вдалося завантажити розклад змін. Дивіться realbarber.cz/tym або телефонуйте +420 608 332 881.",
  },
  teamEmpty: {
    cs: "Dnes nemáme v systému nikoho ve směně. Zkuste volné termíny nebo jinou pobočku.",
    en: "Nobody is on shift in the system today. Try free times or another branch.",
    uk: "Сьогодні в системі нікого немає на зміні. Спробуйте вільні терміни або іншу філію.",
  },
  branchesFallback: {
    cs: "Seznam poboček se teď nepodařilo načíst. Navštivte realbarber.cz/kontakty nebo volejte +420 608 332 881.",
    en: "The branch list could not be loaded. Visit realbarber.cz/kontakty or call +420 608 332 881.",
    uk: "Не вдалося завантажити список філій. Відвідайте realbarber.cz/kontakty або зателефонуйте +420 608 332 881.",
  },
  promoEmpty: {
    cs: "Momentálně nemáme žádné aktivní akce ani kupóny k zobrazení. Sledujte web nebo aplikaci Real Barber.",
    en: "There are no active offers or coupons to show right now. Check the Real Barber website or app.",
    uk: "Зараз немає активних акцій чи купонів. Стежте за сайтом або додатком Real Barber.",
  },
  promoFallback: {
    cs: "Akce a kupóny se teď nepodařilo načíst. Podívejte se na web realbarber.cz nebo do aplikace Real Barber.",
    en: "Offers and coupons could not be loaded. See realbarber.cz or the Real Barber app.",
    uk: "Не вдалося завантажити акції та купони. Дивіться realbarber.cz або додаток Real Barber.",
  },
  showCoupon: {
    cs: "Zobrazit kupón",
    en: "Show coupon",
    uk: "Показати купон",
  },
  showOffer: {
    cs: "Zobrazit akci",
    en: "Show offer",
    uk: "Показати акцію",
  },
  contactOperatorChip: {
    cs: "Živý operátor",
    en: "Live operator",
    uk: "Живий оператор",
  },
  connectOperator: {
    cs: "Spojit s operátorem",
    en: "Connect to operator",
    uk: "З'єднати з оператором",
  },
  contactOperatorMessage: {
    cs: "Napište nebo zavolejte na tel. {phone}",
    en: "Message or call {phone}",
    uk: "Напишіть або зателефонуйте на {phone}",
  },
  contactOffHours: {
    cs: "Teď jsme mimo pracovní dobu ({hours}). Ozveme se vám v provozní době, nebo nás kontaktujte níže.",
    en: "We are outside working hours ({hours}). We will get back during business hours, or contact us below.",
    uk: "Зараз ми поза робочим часом ({hours}). Відповімо в робочий час, або зв'яжіться нижче.",
  },
  call: { cs: "Hovor", en: "Call", uk: "Дзвінок" },
  welcomeHub: {
    cs: "Dobrý den! Jsem Rbíček, Váš osobní asistent.\nVyberte téma níže, nebo napište, s čím potřebujete pomoct.",
    en: "Hello! I am Rbíček, your personal assistant.\nPick a topic below, or type what you need help with.",
    uk: "Добрий день! Я Rbíček, ваш особистий асистент.\nОберіть тему нижче або напишіть, з чим потрібна допомога.",
  },
  welcomeNamed: {
    cs: "Zdravím {name}! Jsem Rbíček.\nVyberte téma níže, nebo napište, s čím potřebujete pomoct.",
    en: "Hi {name}! I am Rbíček.\nPick a topic below, or type what you need help with.",
    uk: "Вітаю, {name}! Я Rbíček.\nОберіть тему нижче або напишіть, з чим потрібна допомога.",
  },
  welcomeLogged: {
    cs: "Zdravím! Jsem Rbíček, váš asistent Real Barber.\nVyberte téma níže, nebo napište, s čím potřebujete pomoct.",
    en: "Hi! I am Rbíček, your Real Barber assistant.\nPick a topic below, or type what you need help with.",
    uk: "Вітаю! Я Rbíček, ваш асистент Real Barber.\nОберіть тему нижче або напишіть, з чим потрібна допомога.",
  },
} as const;

export type SystemKey = keyof typeof SYSTEM;

export function tSystem(
  key: SystemKey,
  locale: WidgetLocale | undefined,
  vars?: Record<string, string>,
): string {
  const row = SYSTEM[key];
  const lang: WidgetLocale =
    locale === "en" || locale === "uk" ? locale : "cs";
  let text = withoutDashes(row[lang]);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
  }
  return text;
}
