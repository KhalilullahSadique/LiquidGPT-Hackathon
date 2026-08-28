/**
 * Russian strings.
 *
 * Written as natural Russian rather than a word-for-word calque of the English. Anything
 * missing here falls back to the English entry, so a partial locale can never render blank.
 *
 * Russian needs three plural forms where English needs two, hence the extra
 * `date.daysAgo.few` / `.many` entries — selected by Intl.PluralRules, not by hand.
 */
export const suggestions = [
  "Кто такой Халилулла?",
  "Кто тебя создал?",
  "С чем работает Халилулла Седик?",
  "Какие проекты сделал Халилулла?",
  "Объясни замыкания в JavaScript на примере",
  "Напиши скрипт на Python для переименования файлов в папке",
  "Чем SQL отличается от NoSQL?",
];

export default {
  "header.toggleSidebar": "Показать или скрыть панель",
  "header.newChat": "Новый чат",
  "header.newChatAria": "Новый чат",
  "header.deleteChat": "Удалить чат",
  "header.deleteChatAria": "Удалить чат",
  "header.confirmTitle": "Удалить этот чат?",
  "header.confirmBody":
    "Чат и все его сообщения будут удалены из этого браузера. Отменить это действие нельзя.",
  "header.cancel": "Отмена",
  "header.delete": "Удалить",

  "sidebar.history": "История чатов",
  "sidebar.close": "Закрыть панель",
  "sidebar.newChat": "Новый чат",
  "sidebar.emptyTitle": "Чатов пока нет",
  "sidebar.emptyBody": "Начните новый чат — он появится здесь",
  "sidebar.confirmDelete": "Подтвердить удаление «{title}»",
  "sidebar.cancelDelete": "Отменить удаление",
  "sidebar.delete": "Удалить «{title}»",

  "date.today": "Сегодня",
  "date.yesterday": "Вчера",
  "date.daysAgo.one": "{count} день назад",
  "date.daysAgo.few": "{count} дня назад",
  "date.daysAgo.many": "{count} дней назад",
  "date.daysAgo.other": "{count} дня назад",

  "empty.welcome": "Добро пожаловать в LiquidGPT",
  "empty.body": "Начните разговор — напишите сообщение ниже.",
  "empty.developedBy": "Разработчик —",

  "chat.thinking": "Думаю...",
  "chat.storageFull":
    "Хранилище браузера переполнено. Этот чат больше не сохраняется — удалите несколько чатов, чтобы освободить место.",
  "chat.storageFailed": "Не удалось сохранить этот чат в хранилище браузера.",

  "input.label": "Сообщение для LiquidGPT",
  "input.placeholder": "Написать LiquidGPT...",
  "input.send": "Отправить сообщение",
  "input.stop": "Остановить генерацию",
  "input.counter": "{count}/{max} символов",
  "input.hintSuggesting": "Нажмите End или выберите вопрос, затем Enter — чтобы отправить",
  "input.hintTyping": "Enter — отправить, Shift+Enter — новая строка",
  "input.hintMobile": "Нажмите на вопрос, чтобы начать",
  "input.truncated": "Обрезано до {max} символов.",
  "input.nearLimit": "Приближается лимит символов",
  "input.suggestionsLabel": "Готовые вопросы",

  "message.assistant": "ИИ-ассистент",
  "message.fellBack": "ИИ-ассистент · резервная модель {model}",
  "message.copy": "Копировать",
  "message.copied": "Скопировано",
  "message.copyFailed": "Не удалось",

  "model.label": "Модель:",
  "model.aria": "Модель",

  "theme.label": "Тёмная тема",
  "theme.toggle": "Переключить тёмную тему",

  "language.label": "Язык:",
  "language.aria": "Язык интерфейса",

  "banner.dismiss": "Закрыть сообщение",

  "crash.title": "Что-то пошло не так",
  "crash.body": "Произошла непредвиденная ошибка. Сохранённые чаты не пострадали.",
  "crash.reload": "Перезагрузить",

  "error.cancelled": "Запрос отменён.",
  "error.provider": "Провайдер вернул ошибку.",
  "error.noCompletions": "Провайдер не вернул ни одного ответа.",
  "error.truncated": "Ответ упёрся в лимит токенов, не успев начаться.",
  "error.empty": "Провайдер вернул пустой ответ.",
  "error.timeout": "Сервер не ответил за {seconds} с при обращении к {provider}.",
  "error.network":
    "Не удалось связаться с сервером LiquidGPT. Проверьте подключение и попробуйте снова.",
  "error.exhaustedRetries": "Попытки исчерпаны.",
  "error.noModel": "Не настроена ни одна рабочая модель.",
  "error.notConfigured":
    "На сервере не настроен API-ключ. Добавьте GEMINI_API_KEY в файл .env (или в переменные окружения Vercel) и перезапустите приложение.",
  "error.allFailed": "Все модели ({count}) не ответили. Последняя ошибка: {message}",
  "error.unexpected": "Произошла непредвиденная ошибка.",
};
