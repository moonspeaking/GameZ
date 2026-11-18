# Руководство разработчика (Developer & Contributor Guide)

Инструкции по тестированию, отладке, добавлению новых законов, настройке голосования Совета и развитию симулятора «30 Years Underground».

---

## 1. Запуск и локальная разработка

В проекте намеренно отсутствуют этапы компиляции, упаковки (bundlers) и менеджеры пакетов (npm, webpack, vite):
* **Быстрый запуск**: Достаточно открыть файл [underground.html](file:///Users/Apple/Documents/GameZ/underground.html) в браузере или выполнить в терминале macOS:
  ```bash
  open underground.html
  ```
* **Локальный сервер для тестирования на мобильных устройствах**:
  ```bash
  python3 -m http.server 8080
  # Откройте: http://localhost:8080/underground.html
  ```

---

## 2. Тестирование через `test_all_interactions.html`

Файл [test_all_interactions.html](file:///Users/Apple/Documents/GameZ/test_all_interactions.html) содержит автоматизированный проверочный сценарий, который при открытии тестирует:
1. Завершение анимации пролога (`finishPrologue()`).
2. Переключение множителей скоростей (`setSpeed(5)`, `setSpeed(30)`, `setSpeed(1)`).
3. Циклическое переключение всех камер (`cycleCamera()`).
4. Последовательное применение всех 9 сюжетных глав (`applyChapter1()` ... `applyChapter8()`).
5. **Интерактивное размещение чертежей и снос**: проверка `isValidPlacement()`, размещение `placeBlueprint()`, рендеринг и демонтаж `demolishAt()`.
6. **Режимы игры (`setGameMode`)**: переключение между Демократией, Комендантом и Анархией.
7. **Интерактивные законы Белой Доски**: рендеринг `renderWhiteboardLaws()` и расчёт коэффициентов.
8. **Демократический Совет**: запуск `startCouncilVote()` и подсчёт голосов.
9. **Автономное строительство**: `evaluateAutonomousBuilding()` и `autoPlaceRoom()`.
10. **Систему сохранений `SaveSystem`**: сохранение и загрузку состояния с учётом режима и законов.
11. **Эмуляцию мобильных жестов**: генерацию событий `touchstart`, `touchmove`, `touchend`.

### Запуск тестов:
1. Откройте [test_all_interactions.html](file:///Users/Apple/Documents/GameZ/test_all_interactions.html) в браузере.
2. Откройте консоль разработчика (`F12` или `Cmd + Option + I`).
3. Убедитесь в наличии финального лога:
   ```text
   Testing Game Modes (Democracy, Overseer, Anarchy)...
   Mode: overseer
   Mode: anarchy
   Mode: democracy
   Testing Whiteboard Laws & Directives...
   Strict rationing rates OK
   Testing Council Voting in Democracy...
   Testing Autonomous Construction Evaluation...
   Testing SaveSystem save and load...
   Save status: true
   Load status: true
   All interactive functions executed cleanly!
   ```

---

## 3. Практические руководства (How-To)

### 3.1. Как добавить новый закон на Белую Доску

1. Добавьте свойство по умолчанию в `G.laws`:
   ```javascript
   G.laws.defenseProtocol = 'active'; // 'active' | 'passive'
   ```
2. Добавьте карточку в конфигурацию `lawsConfig` внутри `renderWhiteboardLaws()`:
   ```javascript
   {
     key: 'defenseProtocol',
     title: '6. ПРОТОКОЛ ОБОРОНЫ ШЛЮЗА',
     desc: 'Порядок дежурств вооружённых часовых на верхнем ярусе.',
     options: [
       { val: 'active', label: '🎯 Усиленные караулы (+15 защита, -расход патронов)' },
       { val: 'passive', label: '🔒 Пассивная оборона (только гермозамки)' }
     ]
   }
   ```
3. Учтите влияние закона в суточном расчёте `calcResourceRates()` или `onNewDay()`.

---

### 3.2. Как настроить предпочтения колонистов при голосовании

Логика генерации голосов находится в функции `startCouncilVote()`:
```javascript
if (c.role === 'ELEC' || c.id === 'ray') {
  // Рэй всегда голосует за энергетическую безопасность
  if (prompt.includes('энерг') || prompt.includes('генератор')) {
    vote = 'A';
    quote = '«Энергия — жизнь нашего бункера! Поддерживаю.»';
  }
}
```

---

### 3.3. Консоль отладки режимов

В консоли разработчика браузера доступны методы управления режимами:
* `setGameMode('democracy');` — активировать режим демократии и Совета.
* `setGameMode('overseer');` — перейти в режим прямого управления Коменданта.
* `evaluateAutonomousBuilding();` — принудительно запустить заседание Совета по авто-стройке.
* `openWhiteboardModal();` — открыть интерактивную Белую Доску законов.
