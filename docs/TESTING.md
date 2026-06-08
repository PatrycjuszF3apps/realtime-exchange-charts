# Testing

## Running tests

Tests run inside the Docker container defined in `docker-compose.yaml`.

### If the container is already running (e.g. `npm run dev:all` is active)

```bash
docker-compose exec realtime_exchange_charts npm test
docker-compose exec realtime_exchange_charts npm run test:watch
```

### One-shot run (container not started)

```bash
docker-compose run --rm realtime_exchange_charts npm test
```

### Watch mode (container not started)

```bash
docker-compose run --rm realtime_exchange_charts npm run test:watch
```

---

## Test architecture

```
src/
├── client/
│   └── test/                       # Tests for the client app
│       ├── setup.ts                # Global setup — imports @testing-library/jest-dom
│       ├── mocks/
│       │   ├── handlers.ts         # MSW handler definitions (mock API)
│       │   └── server.ts           # MSW setupServer instance (Node)
│       └── hooks/
│           ├── useExchanges.test.ts        # 3 tests
│           ├── useExchangePairs.test.tsx   # 6 tests
│           └── useMarketData.test.tsx      # 11 tests
└── server/
    └── test/                       # (future) Tests for the Express server
```

### Technology stack

| Layer | Library | Role |
|---|---|---|
| Test runner | **vitest** v4 | Running tests, fake timers (`vi.useFakeTimers`) |
| Hook rendering | **@testing-library/react** | `renderHook`, `waitFor`, `act` |
| DOM assertions | **@testing-library/jest-dom** | Matchers like `toBeInTheDocument`, `toBeNull` etc. |
| Environment | **jsdom** | Simulates a browser inside Node |
| API mock | **msw** v2 | Intercepts `fetch` without a running backend |

### Vitest configuration

The configuration is merged into `vite.config.ts` (the `test:` block), so vitest shares the same Vite aliases as the rest of the project:

```ts
// vite.config.ts (excerpt)
test: {
    environment: 'jsdom',
    setupFiles: ['./src/client/test/setup.ts'],
    globals: true,
}
```

### MSW — mock API server

`src/test/mocks/handlers.ts` defines handlers for all four endpoints:

| Endpoint | Mock response |
|---|---|
| `GET /api/market/exchanges` | `['binance', 'kraken', 'coinbase']` |
| `GET /api/market/pairs` | `['BTC/USDT', 'ETH/USDT', 'SOL/USDT']` |
| `GET /api/market/ohlcv` | 2 OHLCV candles as `number[][]` |
| `GET /api/market/ticker` | object with `last`, `percentage`, `high`, `low`, `quoteVolume` |

Each test file starts the MSW server in `beforeAll` / `afterAll` and resets handlers after each test (`afterEach`). Individual tests can override the default handlers via `server.use(...)` — the override only lasts for that test.

---

## What the tests cover (characterization tests)

These tests were written as part of **Stage 0** of the refactoring plan (`3-layers-client-app-architecture.md`). Their purpose is to capture the **current behaviour** of the data hooks before the logic is moved into the `services/` layer in Stages 2–3. If a test breaks during refactoring, it signals an unintentional regression.

### `useExchanges` (3 tests)

- Initial state: `loading=true`, empty `exchanges` array
- After a successful fetch: `loading=false`, `exchanges` contains API data
- Network error: `loading=false`, `exchanges` stays empty (no unhandled rejection)

### `useExchangePairs` (6 tests)

- Initial state: `loading=true`, `pairs=[]`, `error=null`
- Successful fetch: `loading=false`, `pairs` contains data
- `exchange` change: immediate reset of `pairs`, new fetch fires, new data arrives
- API error (5xx): `pairs=[]`, `error` set
- Network error: `pairs=[]`, `error` set
- **`cancelled` flag**: when `exchange` changes before the in-flight response arrives, the stale response must not overwrite the new exchange's state (safety net for Stage 3)

### `useMarketData` (11 tests)

**Data mapping**
- Raw `[ts_ms, o, h, l, c, v]` arrays → `OHLCVBar` with `time` in seconds (`Math.floor(ts / 1000)`)
- Ticker fields: `last`, `percentage` → `change`, `high`, `low`, `quoteVolume` → `volume`
- Missing ticker fields are set to `null`

**Loading flags**
- Initial state: `loading=true`
- Empty `symbol`: immediate `loading=false`, clean `bars`/`ticker`/`error`
- Parameter change: immediate reset of `bars` and `ticker`

**Polling** (fake timers with `shouldAdvanceTime: true`)
- After `POLL_MS` (5 000 ms) a subsequent fetch is triggered
- `loading` stays `false` during background poll refreshes — spinner is only shown on the first load (`initialDone` ref)

**Error handling**
- OHLCV API error sets `error`
- Error during a poll: `error` set, but previous `bars` are **preserved**
- Recovery after an error: `error` cleared, `bars` updated

---

## Fake timers — implementation note

Polling tests use `vi.useFakeTimers({ shouldAdvanceTime: true })`. The `shouldAdvanceTime: true` option keeps fake time advancing in sync with real time (1:1 ratio), so `waitFor` from @testing-library works correctly (its internal `setTimeout` fires in real time). Then `vi.advanceTimersByTimeAsync(5_000)` jumps 5 seconds ahead, triggering the polling `setInterval` — without actually waiting 5 real seconds.
