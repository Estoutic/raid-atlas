# Источники Raid Atlas

Локальная некоммерческая сборка, данные получены 16.11.2026.

## Карты и иллюстрации

- Векторные карты Завода, Таможни, Берега, Леса, Резерва, Маяка, Развязки, Эпицентра, Улиц и Терминала: Shebuka и участники проекта Escape from Tarkov SVG Maps, https://github.com/the-hideout/tarkov-dev-svg-maps . Файлы: https://assets.tarkov.dev/maps/svg/Factory.svg и https://assets.tarkov.dev/maps/svg/Customs.svg . Лицензия CC BY-NC-SA 4.0: https://creativecommons.org/licenses/by-nc-sa/4.0/ . Исходное уведомление авторов сохранено в sources/svg-readme.md.
- Готовые объёмные изображения: RE3MR, https://reemr.se/ . Customs: https://maps.reemr.se/Customs/re3mrCustoms2.png ; Factory: https://www.re3mr.com/maps/Factory/FactorybyRe3mr.png . Лицензия CC BY-NC-SA 4.0. Исходные подписи авторов сохранены в изображениях.
- Дополнительная карта Таможни из пользовательского HTML: https://maps.reemr.se/Customs/re3mrCustomsCardinalNDay.png . Автор помечает её как deprecated на https://reemr.se/customs/ . Используется выбранный пользователем стиль; подписи и геометрия требуют проверки актуальности.
- Для Factory и обновлённой Customs подготовлены копии шириной 6144 пикселя для отображения в WebKit. Масштаб пропорциональный, содержимое и авторские подписи сохранены. Исходники сохранены в комплекте исходного кода. Новые интерактивные метки рисуются отдельным слоем; координаты вручную привязаны к печатным обозначениям выходов. SVG включены в каталог; при отображении переключаются этажи. Маски проходимости вычисляются во время работы из SVG с изменением цветов. Производные от карт материалы распространяются по той же CC BY-NC-SA 4.0; необходимо сохранять атрибуцию.

## Квесты и координаты

tarkov.dev community API: https://tarkov.dev/api ; JSON-каталоги: https://json.tarkov.dev/endpoints . Использован набор PvE и русские переводы. Координатная конфигурация: https://github.com/the-hideout/tarkov-dev/blob/main/src/data/maps.json . Данные включены для работы без сети. Автоматического обновления нет.

Escape from Tarkov и игровые материалы принадлежат Battlestate Games. Приложение не является официальным продуктом. Оно не получает координаты из игры и не подключается к игровому процессу.

## Исследованные альтернативы

https://github.com/ConocoFieldsForever/atlas — требует извлечения ресурсов установленной игры; этот подход не используется. Код Atlas в сборку не включён. https://eftmap.com/customs/ — просмотрщик настоящей 3D-карты, актуальность и полнота не подтверждены; его ресурсы не включены.

## Новые изображения атласа

RE3MR: Берег, Лес, Резерв, Маяк, Развязка, Эпицентр, Улицы Таркова, Лабиринт, Ледокол и Терминал. Точные URL: sources/render-assets.json. Для просмотра созданы пропорциональные JPEG-копии до 4096 пикселей и миниатюры. Содержимое и авторские подписи сохранены. Эти производные изображения распространяются по CC BY-NC-SA 4.0: https://creativecommons.org/licenses/by-nc-sa/4.0/ .

## Настоящие модели Завода

TKL / EFT Library: https://eftlibrary.com/map/factory . © 2024–2026 TKL; команда HJ, SY, JY. Лицензия карт и моделей: CC BY-NC-ND 4.0, https://creativecommons.org/licenses/by-nc-nd/4.0/ . Модели четырёх этажей включены без изменений. Оригинальные GLB, URL и SHA-256: sources/tkl/manifest.json. Копия модели для загрузки без сети закодирована в base64; после декодирования байты идентичны оригиналу. Положение камеры и освещение задаются просмотрщиком. Маршрут отображается отдельным слоем аннотаций поверх исходной модели; её геометрия и материалы не изменяются. Лицензия CC BY-NC-SA других карт не распространяется на модели TKL.

Three.js r170: https://github.com/mrdoob/three.js/tree/r170 , MIT. Draco decoder: https://github.com/google/draco , Apache 2.0. Тексты уведомлений включены в app/web/vendor и Resources/licenses внутри приложения. esbuild используется только при сборке, MIT; файл лицензии находится в npm-пакете.

## Маршруты поверх объёмных видов

Ручная регистрация по ориентирам и ограничения описаны в sources/calibration/README.md. Аннотации рассчитываются из схемы и рисуются отдельно. Условный участок сигнального выхода использует линию железной дороги из SVG Shebuka; производные от карты остаются CC BY-NC-SA 4.0. Условия зелёного сигнала сверены с https://escapefromtarkov.fandom.com/wiki/Customs .


## Именованные переходы (0.6)

Резерв и Эпицентр: вручную сопоставленные площадки переходов по опубликованным SVG Shebuka, изображениям RE3MR и квестовым зонам tarkov.dev. Подробная привязка источников и ограничения — sources/transitions/README.md. Эти координаты и аннотации производны от карт и распространяются по CC BY-NC-SA 4.0. Оригинальные изображения и модели остаются без изменений.

## Underground floor presentation (0.7)

Reserve and Ground Zero underground images are generated at runtime from the bundled Shebuka/tarkov.dev SVGs, retaining their underground floor layers and shared definitions/styles. Other floor groups are omitted; geometry is unchanged. Named stair labels and route overlays are separate annotations. These derived map views retain CC BY-NC-SA 4.0 attribution. Factory exit buttons are independent screen overlays; the original TKL model files remain unchanged.

## Additional interior floor views (0.8)

The runtime SVG floor-layer presentation is extended to all 17 additional catalog levels of Customs, Shoreline, Reserve, Interchange, Ground Zero and Streets of Tarkov: 12 above-ground floor plans and 5 underground plans. These are filtered views of the already bundled Shebuka/tarkov.dev SVG geometry and retain CC BY-NC-SA 4.0 attribution. There is no newly generated geometry; Factory continues using its unchanged TKL models.

## Interior labels (0.9)

Building/shop labels and keyed-door coordinates come from the bundled tarkov.dev map configuration and maps API catalog. Russian key names come from the bundled localization data. Room numbers are parsed only from explicit room/office/apartment names; street numbers and key codes are not treated as room numbers. Source door positions are unchanged and label offsets use leader lines. Building names are translated where applicable. Customs dorm labels distinguish the two published door clusters; Ground Zero upper-building labels use the previously documented staircase anchors. Additional Streets address labels use keyed-door address metadata at the same building footprint. These map-derived annotations retain the map's CC BY-NC-SA 4.0 attribution.
