# Student Duty Hub

MVP-веб-приложение для учета посещаемости, дежурств, штрафов, бонусов и статистики в студенческих группах.

Стек:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma
- PostgreSQL
- NextAuth Credentials
- React Hook Form + Zod
- Recharts
- PWA shell: `manifest`, installable icon route, service worker registration

## Что уже реализовано

- Роли и маршруты для `ADMIN`, `CURATOR`, `GROUP_MANAGER`, `TEACHER`, `STUDENT`
- Prisma-модель с группами, студентами, расписанием, attendance, duty booking/assignment, point transactions, audit log
- Credentials auth с role-aware session
- Mobile-first shell с desktop sidebar и нижней навигацией на телефоне
- Импорт расписания через абстракцию `ScheduleImportAdapter` и mock adapter
- Быстрый mobile flow для посещаемости по паре
- Ручное и автоматическое назначение дежурных
- Бронирование дежурства студентом
- Оценка уборки преподавателем с автоматическим созданием штрафов/бонусов
- Групповая и личная статистика
- Seed-данные для демонстрации сценариев
- Audit log для критичных действий

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Подготовьте `.env`:

```bash
copy .env.example .env
```

3. Поднимите PostgreSQL.

Вариант через Docker:

```bash
docker compose up -d
```

4. Примените Prisma migration:

```bash
npm run db:migrate:deploy
```

5. Заполните базу демонстрационными данными:

```bash
npm run db:seed
```

6. Запустите dev-сервер:

```bash
npm run dev
```

7. Откройте:

```text
http://localhost:3000
```

## Railway

Проект готов к Node.js deployment на Railway:

1. создайте проект и сервис PostgreSQL;
2. задайте `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`;
3. задеплойте приложение;
4. после деплоя при необходимости загрузите данные:

```bash
npm run db:seed
```

`npm start` уже применяет миграции автоматически. Если нужно перенести не демо-данные, а текущее локальное состояние, загрузите SQL-дамп в Railway Postgres вместо запуска сида.

## Demo-аккаунты

- `admin@example.com` / `demo12345`
- `manager@example.com` / `demo12345`
- `teacher@example.com` / `demo12345`
- `is1@example.com` / `demo12345`

## Структура проекта

```text
.
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ actions/
│  │  ├─ admin.ts
│  │  ├─ attendance.ts
│  │  └─ duties.ts
│  ├─ app/
│  │  ├─ (auth)/login/
│  │  ├─ (app)/admin/
│  │  ├─ (app)/manager/
│  │  ├─ (app)/teacher/
│  │  ├─ (app)/student/
│  │  ├─ api/auth/[...nextauth]/
│  │  ├─ icon.tsx
│  │  ├─ layout.tsx
│  │  └─ manifest.ts
│  ├─ components/
│  │  ├─ admin/
│  │  ├─ app-shell/
│  │  ├─ attendance/
│  │  ├─ auth/
│  │  ├─ duties/
│  │  ├─ forms/
│  │  ├─ providers/
│  │  ├─ shared/
│  │  └─ statistics/
│  ├─ lib/
│  │  ├─ auth/
│  │  ├─ config/
│  │  ├─ server/
│  │  ├─ audit.ts
│  │  ├─ constants.ts
│  │  ├─ date.ts
│  │  └─ db.ts
│  ├─ modules/
│  │  ├─ admin/
│  │  ├─ attendance/
│  │  ├─ duties/
│  │  ├─ groups/
│  │  ├─ schedule/
│  │  ├─ statistics/
│  │  └─ students/
│  └─ types/
├─ public/
│  └─ sw.js
├─ docker-compose.yml
└─ .env.example
```

## Ключевые файлы

- `prisma/schema.prisma` — полная доменная модель и RBAC-структура
- `prisma/seed.ts` — тестовые группы, пользователи, расписание, attendance, penalties/bonuses
- `src/lib/auth/options.ts` — NextAuth credentials + session enrichment role/group context
- `src/modules/duties/service.ts` — auto-selection, booking rules, evaluation flow, point transactions
- `src/modules/attendance/service.ts` — batch attendance save и absence requests
- `src/modules/schedule/service.ts` — preview/confirm import через adapter abstraction
- `src/modules/statistics/service.ts` — group/student analytics и red zone logic
- `src/components/attendance/attendance-editor.tsx` — mobile-first attendance UI
- `src/components/duties/duty-planner.tsx` — manual/auto duty planning UI
- `src/components/duties/teacher-evaluation-form.tsx` — mobile flow для teacher evaluation

## Prisma model coverage

Схема включает:

- `User`
- `Role`
- `StudentProfile`
- `TeacherProfile`
- `Group`
- `GroupMembership`
- `ScheduleImport`
- `ScheduleItem`
- `LessonDay`
- `LessonPair`
- `AttendanceRecord`
- `AbsenceRequest`
- `AbsenceReason`
- `DutyAssignment`
- `DutyBooking`
- `DutyReplacement`
- `CleaningComplexity`
- `CleaningEvaluation`
- `PointTransaction`
- `PenaltyReason`
- `BonusReason`
- `AuditLog`
- `Notification`
- `AppSetting`

## Как работает автоназначение дежурных

Функция: `calculateDutyCandidates(groupId, date, count, complexityCode)`

Учитывает:

- только присутствующих студентов по attendance на день
- fallback на полный список группы, если attendance за день еще не заполнен
- плановые отсутствия на день
- уже созданные assignments на эту дату
- окно недавних дежурств через настройку `duty.lookbackDays`
- текущий balance и общее число дежурств
- активные бронирования на эту дату

Результат:

- отсортированный список кандидатов
- top `count` для автоподбора
- explainable reasons по каждому кандидату

## Mock import расписания

Пока реализован mock adapter, который принимает:

- JSON-массив записей
- или CSV с заголовками

Ожидаемые поля:

```json
[
  {
    "groupName": "ИС-21",
    "date": "2026-04-09",
    "pairNumber": 1,
    "subject": "Базы данных",
    "teacherName": "Ирина Петрова",
    "room": "A-101",
    "startTime": "08:30",
    "endTime": "10:00"
  }
]
```

Архитектура расширения:

- добавляете новый adapter в `src/modules/schedule/adapters/`
- регистрируете его в `src/modules/schedule/service.ts`
- UI и confirm flow менять не нужно

## Assumptions

- У пользователя одна primary system role, а привязка к группе хранится в `GroupMembership`.
- В MVP absence request по умолчанию может учитываться автоматически, но approval-архитектура уже заложена.
- Подмена дежурного фиксируется через `DutyReplacement`, а статистика replacement учитывается в student aggregates.
- Базовые правила баллов вынесены в таблицы `CleaningComplexity`, `PenaltyReason`, `BonusReason` и глобальные `AppSetting`.
- Если attendance за день еще не заполнен, duty auto-selection использует fallback на roster группы, чтобы не блокировать сценарий полностью.
- `NextAuth` реализован через credentials provider для быстрого MVP-старта; OAuth можно добавить позже без смены app shell.

## Что еще можно расширить

1. Добавить полноценный parser для реального формата расписания.
2. Сделать CRUD-экраны для ролей и справочников.
3. Вынести point rules в richer admin UI с versioning.
4. Добавить push/notification center и inbox.
5. Добавить фильтрацию и сортировку на основе TanStack Table.
6. Поддержать soft delete, архивные периоды и отчетность по семестрам.
7. Добавить тесты:
   серверные unit tests для `duties/service.ts`
   integration tests для attendance и import flows
   e2e на mobile сценарии

## Полезные команды

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run db:migrate:deploy
npm run db:seed
npm run db:studio
```
