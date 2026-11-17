# Разработка Raid Atlas

## Сборка из исходников

Для сборки нужны macOS и Xcode Command Line Tools со Swift. Готовые каталог, JavaScript-просмотрщик, изображения и модели уже включены.

```sh
git clone https://github.com/Estoutic/raid-atlas.git
cd raid-atlas
zsh build.sh
open 'dist/Raid Atlas.app'
```

Установочный образ с SHA-256:

```sh
zsh package.sh
```

Результат находится в `releases/`. Скрипт создаёт чистую временную сборку Universal; `build.sh` также принимает переменную `RAID_ATLAS_BUNDLE` с отдельным путём к пакету приложения.

После изменения данных каталога сначала выполни `python3 prepare.py`, затем повтори сборку. Для изменения Three.js-просмотрщика нужны Node.js/npm и `zsh build-tools/rebuild-model-viewer.sh`. Генераторы калибровки в `sources/calibration/` дополнительно используют NumPy и SciPy.

## Проверки

Алгоритмы и данные (Node.js 22+; установка npm-зависимостей не нужна):

```sh
node --test tests/*.test.cjs
node checks/exit-audit.cjs
```

Проверка собранного интерфейса на Mac:

```sh
'dist/Raid Atlas.app/Contents/MacOS/RaidAtlas' \
  --test-exit-audit --small --test-report /tmp/raid-atlas-exits.json
```

Тест использует отдельное непостоянное хранилище и не меняет пользовательские отметки. После проверки сохраняет JSON и PNG, затем закрывает тестовое окно. Дополнительные флаги: `--test-exit-levels`, `--test-atlas`, `--test-place-search`, `--test-shell`.

На базовой сборке 0.10.1 прошли 39 Node-тестов и проверка выходов всех 12 карт в 14 вариантах обзора. [Аудит привязок и ограничения](../sources/exit-audit.md) · [Отчёт интерфейса](../checks/exit-audit-ui.json) · [Отчёт этажей](../checks/exit-audit-floors.json).


## Версия и выпуск

Номер в `VERSION` используется в названии DMG, Info.plist и заголовке окна. См. [процесс выпуска](RELEASING.md).
