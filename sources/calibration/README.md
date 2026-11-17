# Привязка маршрутов к объёмным видам

Это ручная визуальная регистрация опубликованных карт, а не точное преобразование из игрового движка.

Таможня: 21 ориентир связывает SVG Shebuka с двумя изображениями RE3MR. Точки приблизительно сняты по входам, дорожным ориентирам и зданиям; центры подписей выходов не используются как универсальная проекция. Внутри выпуклой оболочки применяется непрерывная кусочно-аффинная интерполяция, снаружи — аффинная оценка с граничной поправкой. `build.py` требует NumPy и SciPy; готовый `projection-data.js` включён. Автоматически проверяются соответствие опорным точкам, непрерывность и отсутствие перевёрнутых треугольников. Это не подтверждает точность между ориентирами: карты отличаются по рельефу и актуальности.

Завод: визуальная привязка горизонтальных координат схемы к TKL по расположению силосов, офисов и коридоров. Масштабы X/Z и смещение в `build-tools/factory-viewer.js`; разные модели этажей имеют разные смещения X. Высота слоя задаётся отдельно. Линия рисуется поверх модели, чтобы не исчезать за стенами; это не доказательство, что через видимую стену можно пройти. Исходная геометрия TKL не меняется. Для уточнения геометрии и высот нужно сверяться со схемой и игрой.

Сигнальный выход Таможни: центр из tarkov.dev находится за краем SVG, а зона захватывает участок снайперов. Обычная сетка остаётся неизменной. Маршрут заканчивается за 62 единицы до конца первого пути `#Railway path` в опубликованной SVG (498.628, 57.797). Это ориентир подхода, не точная граница игровой сигнальной зоны. Следующие 42 единицы пути, до (525.184, 25.258), показываются отдельно и условно после зелёного сигнала. Пользователь должен дождаться уведомления о сигнальной зоне и подтверждения активации в игре. Последний участок входит в опубликованный контур выхода; нельзя трактовать любую часть этого контура как безопасный проход.

Источники: https://assets.tarkov.dev/maps/svg/Customs.svg ; https://escapefromtarkov.fandom.com/wiki/Customs ; изображения RE3MR и модели TKL — см. THIRD_PARTY.md. Проверки выполнены в приложении; игрового прохождения не было.


## Additional maps (0.5)

`build-extra.py` generates registrations for Shoreline, Woods, Reserve, Lighthouse, Interchange, Ground Zero and Streets from the paired coordinates recorded in that file; `extra-points.json` contains the source/target values and a no-fold audit. Landmark sources are the bundled published SVG/config and original RE3MR atlases. Ambiguous legacy markers are excluded from interpolation. Interchange floor panels have independent affine registrations. On other single-image maps, selected-floor annotations project onto the shared footprint. These are approximate visual registrations, not game geometry.

The original atlases are not warped or altered; computed path annotations are a separate layer. Automatic navigation still uses SVG coordinates and does not use the raster projection. Manual plans on Labyrinth, Icebreaker and Terminal store image coordinates and explicitly do not calculate walkable paths.
