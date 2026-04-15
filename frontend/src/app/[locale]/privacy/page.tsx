export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm text-foreground/90 leading-relaxed">
      <h1 className="text-2xl font-bold text-foreground">Политика конфиденциальности</h1>
      <p className="text-muted-foreground text-xs">Последнее обновление: апрель 2026 г.</p>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">1. Что мы собираем</h2>
        <p>
          При регистрации через Google или Яндекс мы получаем ваше имя, фамилию и адрес электронной почты.
          Дополнительно вы можете указать профессию, город, страну, номер телефона, Telegram, фото профиля и краткое описание.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">2. Как мы используем данные</h2>
        <p>
          Данные используются исключительно для отображения вашего профиля в каталоге Lekion — справочнике лезгинских специалистов и бизнесов.
          Мы не продаём, не передаём третьим лицам и не используем ваши данные в рекламных целях.
          Данные не используются для обучения систем искусственного интеллекта.
        </p>
        <p>
          Все данные хранятся на серверах на территории Российской Федерации (г. Москва)
          в соответствии с требованиями Федерального закона № 152-ФЗ «О персональных данных».
          Трансграничная передача данных не осуществляется.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">3. Видимость профиля</h2>
        <p>
          После одобрения модератором ваш профиль становится публично доступным на сайте lekion.ru.
          Вы можете скрыть себя с карты или удалить аккаунт в любое время — для этого свяжитесь с администратором.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">4. Cookies</h2>
        <p>
          Мы используем cookies только для поддержания сессии авторизации. Сторонние трекеры или рекламные cookies не используются.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">5. Ваши права</h2>
        <p>
          Вы вправе запросить удаление всех ваших данных, обратившись к администратору через Telegram или email.
          После удаления ваш профиль и все связанные данные будут безвозвратно удалены.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">6. Контакты</h2>
        <p>
          По вопросам конфиденциальности пишите администратору проекта.
        </p>
      </section>
    </div>
  );
}
