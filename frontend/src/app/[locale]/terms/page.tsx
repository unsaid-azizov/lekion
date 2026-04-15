export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm text-foreground/90 leading-relaxed">
      <h1 className="text-2xl font-bold text-foreground">Пользовательское соглашение</h1>
      <p className="text-muted-foreground text-xs">Последнее обновление: апрель 2026 г.</p>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">1. Общие положения</h2>
        <p>
          Настоящее Пользовательское соглашение регулирует использование сервиса Lekion (lekion.ru) —
          каталога лезгинских специалистов и бизнесов. Регистрируясь на сайте, вы подтверждаете
          согласие с условиями настоящего соглашения.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">2. Обработка персональных данных</h2>
        <p>
          Сервис обрабатывает персональные данные пользователей в соответствии с Федеральным законом
          от 27.07.2006 № 152-ФЗ «О персональных данных».
        </p>
        <p>
          Все данные пользователей хранятся исключительно на серверах, расположенных на территории
          Российской Федерации (г. Москва). Трансграничная передача персональных данных не осуществляется.
        </p>
        <p>
          Персональные данные не передаются третьим лицам, не используются для обучения систем
          искусственного интеллекта и не применяются в рекламных целях.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">3. Состав обрабатываемых данных</h2>
        <p>В рамках работы сервиса обрабатываются следующие данные:</p>
        <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
          <li>Имя и фамилия</li>
          <li>Адрес электронной почты (не публикуется)</li>
          <li>Фотография профиля</li>
          <li>Профессия, город, страна</li>
          <li>Номер телефона и/или Telegram (при указании)</li>
          <li>Краткая информация о деятельности</li>
          <li>Геолокация (при указании)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">4. Цели обработки данных</h2>
        <p>
          Данные используются исключительно для отображения профиля пользователя в публичном каталоге
          и обеспечения работы сервиса.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">5. Права пользователя</h2>
        <p>Пользователь вправе в любое время:</p>
        <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
          <li>Отозвать согласие на обработку персональных данных</li>
          <li>Запросить удаление своих данных</li>
          <li>Скрыть свой профиль с карты</li>
          <li>Получить информацию об обрабатываемых данных</li>
        </ul>
        <p>
          Для реализации прав обратитесь к администратору сервиса. После отзыва согласия профиль
          и все связанные данные будут удалены в течение 30 дней.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">6. Правила использования</h2>
        <p>Пользователь обязуется:</p>
        <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
          <li>Указывать достоверные сведения о себе</li>
          <li>Не размещать информацию, нарушающую законодательство РФ</li>
          <li>Не использовать сервис для рассылки спама или рекламы</li>
          <li>Не предпринимать действий, нарушающих работу сервиса</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-base text-foreground">7. Контакты</h2>
        <p>
          По всем вопросам, связанным с обработкой персональных данных и условиями использования
          сервиса, обращайтесь к администратору проекта Lekion.
        </p>
      </section>
    </div>
  );
}
