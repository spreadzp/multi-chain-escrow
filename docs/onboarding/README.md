# Onboarding — Multi-Chain Escrow

Руководство по запуску и ручному тестированию приложения.

---

## 1. Предварительные требования

- **Node.js** >= 20
- **Docker** + Docker Compose V2 (для Stellar localnet)
- **Solana CLI** (для Solana localnet) — `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
- **Soroban CLI** (для деплоя Stellar контрактов) — `cargo install --locked soroban-cli`
- **Anchor CLI** (для деплоя Solana контрактов) `cargo install --git https://github.com/coral-xyz/anchor avm && avm install 0.31.0 && avm use 0.31.0`

Проверка:
```bash
docker --version
solana --version
soroban --version
anchor --version
```

---

## 2. Запуск локальных блокчейн-сетей

### Stellar Localnet

```bash
# Из корня репозитория
npm run chain:stellar

# Проверка
curl http://localhost:8000/health
# Ожидаемый ответ: {"status":"healthy"}

# Остановка
npm run chain:stellar:stop
```

Сервисы:
- **RPC:** http://localhost:8000 (Soroban RPC)
- **Horizon:** http://localhost:8001
- **Friendbot (faucet):** http://localhost:8002

### Solana Localnet

```bash
# Из корня репозитория
npm run chain:solana

# Проверка
solana cluster-version --url http://localhost:8899

# Остановка
npm run chain:solana:stop
```

Сервисы:
- **RPC:** http://localhost:8899
- **Logs:** `blockchains/solana/.logs/validator.log`

### Финансирование аккаунтов (faucet)

```bash
# Stellar — генерирует и финансирует ключи для ролей (deployer, depositor, beneficiary, resolver)
npm run chain:stellar:faucet

# Solana — аналогично
npm run chain:solana:faucet
```

Ключи сохраняются в:
- `blockchains/stellar/.local-keys/*.json`
- `blockchains/solana/.local-keys/*.json`

---

## 3. Деплой контрактов

### Stellar Escrow Contract

```bash
# Из корня репозитория
cd blockchains/stellar
cargo build --release --target wasm32v1-none
soroban contract deploy \
  --source .local-keys/deployer.json \
  --wasm target/wasm32v1-none/release/escrow.wasm \
  --network local
```

Запишите полученный contract ID в `fe/src/config/contracts.ts` → `stellarLocalContracts.contractId`.

### Solana Escrow Program

```bash
# Из корня репозитория
cd blockchains/solana
anchor build
anchor deploy --provider.cluster localnet
```

Запишите полученный program ID в `fe/src/config/contracts.ts` → `solanaLocalContracts.programId`.

---

## 4. Запуск фронтенда

```bash
cd fe
npm install   # только первый раз
npm run dev
```

Приложение будет доступно по адресу: **http://localhost:3000**

---

## 5. Ручное тестирование в браузере

### 5.1. Подключение кошелька (Mock mode)

Если расширения Phantom (Solana) или Freighter (Stellar) не установлены, приложение использует **Mock wallet** — генерирует случайный адрес для каждой сети.

**Шаги:**

1. Откройте http://localhost:3000
2. В выпадающем списке **Network** выберите сеть:
   - **Stellar Localnet** — для тестирования Stellar
   - **Solana Localnet** — для тестирования Solana
3. Нажмите кнопку **Connect**
4. Появится:
   - Сокращённый адрес кошелька (например, `GKDR...MANH`)
   - Оранжевый бейдж **Mock** — означает, что используется mock-кошелёк
   - Кнопка **Disconnect**

### 5.2. Создание эскроу

1. Подключите кошелёк (см. 5.1)
2. В форме **Create Escrow** заполните:
   - **Beneficiary** — адрес получателя (например, `GBENEFICIARY123`)
   - **Amount** — сумма (например, `100`)
   - **Resolver (optional)** — адрес арбитра (например, `GRESOLVER12345`)
3. Нажмите **Create Escrow**
4. В правой части появится карточка эскроу:
   - ID эскроу (например, `mock...4muq`)
   - Статус: **created** (синий бейдж)
   - Сумма, Depositor, Beneficiary, Resolver
   - Кнопка **Refund** (доступна только depositor'у)
5. В блоке **Activity** появится событие **Deposited**

### 5.3. Refund (возврат)

Кнопка **Refund** доступна только если:
- Подключённый кошелёк = depositor
- Статус эскроу = `created`

1. Нажмите **Refund** на карточке эскроу
2. Статус изменится: `created` → `refunded` (серый бейдж)
3. Кнопки действий исчезнут
4. В Activity появится событие **Refunded**

### 5.4. Release (выплата)

Кнопка **Release** доступна только если:
- Подключённый кошелёк = beneficiary ИЛИ resolver
- Статус эскроу = `created`

> **Важно:** В mock mode адрес кошелька генерируется случайно, поэтому вы не можете подключиться как beneficiary. Для тестирования Release нужно:
> - Использовать реальный кошелёк (Phantom/Freighter)
> - Или изменить mock-адрес в коде на адрес beneficiary

**Тестирование Release с реальным кошельком:**

1. Установите расширение Freighter (Stellar) или Phantom (Solana)
2. Создайте эскроу, указав адрес из расширения как beneficiary
3. Переподключитесь кошельком расширения
4. Нажмите **Release** на карточке эскроу
5. Статус изменится: `created` → `released` (зелёный бейдж)

### 5.5. Переключение сетей (Chain Switch)

1. Создайте эскроу на Stellar Localnet
2. Переключите сеть на **Solana Localnet** в выпадающем списке
3. Кошелёк отключится (нужно переподключиться)
4. Нажмите **Connect** — подключится с новым mock-адресом для Solana
5. Список эскроу покажет только Solana-эскроу
6. В Activity сохранятся события с обеих сетей
7. Переключитесь обратно на **Stellar Localnet**
8. Переподключитесь — Stellar-эскроу снова появятся (если адрес совпадает)

> **Примечание:** В mock mode каждый раз генерируется новый случайный адрес, поэтому эскроу от предыдущей сессии не будут видны. В реальном режиме (с расширением) адрес сохраняется.

### 5.6. Страница "How it works"

1. Нажмите **How it works** в навигации
2. Страница показывает:
   - Описание ролей: Depositor, Beneficiary, Resolver
   - Жизненный цикл эскроу: Create → Release / Refund
   - Статусные переходы: `created → released`, `created → refunded`
   - Сравнение Solana vs Stellar (таблица)

---

## 6. Проверка on-chain sync (EPIC-10)

### Что работает автоматически:

- **Poll loop** — каждые 5 секунд SyncManager опрашивает адаптер и обновляет Zustand store
- **Event subscription** — адаптер подписывается на события эскроу (Deposited, Released, Refunded)
- **Store patching** — события мгновенно обновляют статус эскроу в UI
- **Chain switch** — при переключении сети sync перезапускается для новой цепочки
- **Error handling** — при сетевой ошибке показывается сообщение, UI продолжает работать

### Как проверить sync:

1. Откройте приложение в двух вкладках браузера
2. В первой вкладке создайте эскроу
3. Во второй вкладке подключитесь к той же сети
4. Дождитесь poll (до 5 секунд) — эскроу появится во второй вкладке
5. В первой вкладке выполните Refund
6. Во второй вкладке статус обновится:
   - Мгновенно (через event subscription) — если обе вкладки используют один mock-адаптер
   - В течение 5 секунд (через poll) — если используются разные адаптеры

---

## 7. Запуск тестов

### Unit/E2E тесты sync layer (EPIC-10)

```bash
cd fe

# Все sync тесты
npx vitest run src/sync/__tests__/

# Только E2E
npx vitest run src/sync/__tests__/e2e-sync.test.ts

# С выводом
npx vitest run src/sync/__tests__/ --reporter=verbose
```

Ожидаемый результат: **75 тестов проходят** (8 файлов).

### Полные тесты фронтенда

```bash
cd fe
npx vitest run
```

### Сборка

```bash
cd fe
npm run build
```

---

## 8. Структура проекта

```
stellar-solana-interview/
├── blockchains/
│   ├── stellar/          # Stellar Soroban контракт + скрипты
│   │   ├── contracts/escrow/
│   │   ├── scripts/      # start-network.sh, stop-network.sh, faucet.ts
│   │   └── docker-compose.yml
│   └── solana/           # Solana Anchor программа + скрипты
│       ├── programs/escrow/
│       └── scripts/      # start-validator.sh, stop-validator.sh, faucet.ts
├── fe/                   # Next.js фронтенд
│   └── src/
│       ├── app/          # Pages (/, /how-it-works)
│       ├── config/       # chains.ts, contracts.ts
│       ├── features/
│       │   ├── escrow/   # Adapter, components, hooks, domain, store
│       │   ├── wallet/   # Wallet providers, store, UI
│       │   └── activity/ # Activity feed
│       └── sync/         # SyncManager, lifecycle, events, error-handling
└── docs/                 # Документация
    └── onboarding/       # Это руководство
```

---

## 9. Известные ограничения (Mock mode)

- **Случайные адреса** — mock-кошелёк генерирует новый адрес при каждом подключении
- **In-memory хранилище** — эскроу не сохраняются между перезагрузками страницы
- **Нет Release** — невозможно протестировать Release, так как mock-адрес не совпадает с beneficiary/resolver
- **Дублирование событий** — mock-адаптер эмитит события дважды (известный баг)
- **Chain switch error** — при переключении сети может появиться "No wallet address set" от старого адаптера

Для полноценного тестирования с реальными транзакциями:
1. Запустите локальные блокчейн-сети (см. раздел 2)
2. Задеплойте контракты (см. раздел 3)
3. Установите расширения кошельков (Phantom, Freighter)
4. Используйте реальные адреса из расширений
