# Выпуск Raid Atlas

## Подготовка

1. Обновить `VERSION` (формат `major.minor.patch`), `CHANGELOG.md`, ссылки и имя установщика в обоих README.
2. Добавить `docs/releases/<версия>.md` с изменениями, проверками и ограничениями.
3. Запустить `node --test tests/*.test.cjs` и `node checks/exit-audit.cjs`.
4. Собрать `zsh build.sh` и проверить интерфейс через изолированный native harness из [BUILDING.md](BUILDING.md). Проверить иконку, версию и ресурсы пакета.
5. Выполнить `zsh package.sh`. Скрипт создаёт чистую Universal-сборку, проверяет подпись и DMG, пишет SHA-256.

Не выдавать ad-hoc подпись за Developer ID или notarization. Проверку Rosetta описывать отдельно от физического Intel Mac. Условия выходов и приближённость маршрутов сохранять в примечаниях к релизу.

## Публикация готовой локальной сборки

Использовать чистый коммит, прошедший проверки, и новый тег `v<версия>`. Не передвигать опубликованные теги и не подменять выпущенные установщики.

```sh
VERSION=$(cat VERSION)
git tag "v$VERSION"
git push origin "v$VERSION"
cp packaging/Установка.txt releases/INSTALL-RU.txt
gh release create "v$VERSION" --verify-tag --draft \
  --title "Raid Atlas $VERSION — macOS" \
  --notes-file "docs/releases/$VERSION.md" \
  "releases/Raid-Atlas-$VERSION-mac-universal.dmg" \
  "releases/Raid-Atlas-$VERSION-mac-universal.dmg.sha256" \
  releases/INSTALL-RU.txt
```

При обновлении промо загрузить MP4 и SRT в этот же черновик. Проверить состав вложений, ссылки, контрольную сумму и текст, затем опубликовать:

```sh
gh release edit "v$VERSION" --draft=false --latest
```

## Сборка через GitHub Actions

Workflow **Prepare macOS release** запускается вручную с существующим тегом. Он проверяет совпадение тега с `VERSION`, выполняет тесты, собирает и проверяет DMG, создаёт **черновик** с установщиком, SHA-256 и инструкцией. Он не публикует релиз автоматически и не перезаписывает существующие релизы.

Эта CI-сборка не равнозначна ручной проверке интерфейса и не предоставляет Developer ID/notarization. Перед публикацией скачать и проверить именно получившийся установщик. Промо создаётся отдельно по [инструкции](../promo/README.md).
