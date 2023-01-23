# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0](https://github.com/akki0256/discord-interaction/compare/v1.0.1...v2.0.0) - (2023-01-21)

## [2.0.1](https://github.com/akki0256/discord-interaction/compare/v2.0.0...v2.0.1) - (2023-01-21)

### Typings

**BaseCommand:**
 - Fix `resetCoolTime()` parameter
 - Fix `getCoolTime()` parameter
 - Fix `getLastUseDiff()` parameter
 - Fix `isInCoolTime()` parameter

**DiscordInteractions:**
 - Fix `loadInteractions()` return value
 - Fix `registerCommands()` return value

### Added
**DiscordInteractions:**
 - Add `deleteNoLoadInteractions()`

## [2.0.2](https://github.com/akki0256/discord-interaction/compare/v2.0.1...v2.0.2) - (2023-01-21)

### Typings
 - Fix `loadInteractions()` parameter

## [2.0.3](https://github.com/akki0256/discord-interaction/compare/v2.0.2...v2.0.3) - (2023-01-21)
 
### Fixed
 - Fix typo

## [2.0.4](https://github.com/akki0256/discord-interaction/compare/v2.0.3...v2.0.4) - (2023-01-21)

### Added
**DiscordInteractions:**
 - Add `setGuildOnly()`
 - Add `resetGuildOnly()`

## [2.1.0](https://github.com/akki0256/discord-interaction/compare/v2.0.4...v2.1.0) - (2023-01-23)

### Added
 - Add `DiscordInteractions#fileLoad`
 - Add `BaseInteraction.isCommand()`

### Bug Fixes
 - Fix `DiscordInteractions.#getAllPath()` return value