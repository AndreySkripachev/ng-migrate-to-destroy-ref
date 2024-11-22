# Migration scripts for Angular

Contains schemas for automatic migrations to new Angular features

## Installation

```bash
npm i -D frontend_fan-angular-migrations
```

## Available migrations

### `DestroyRef`

A schema that converts deprecated patterns for tracking Angular structure destruction to use DestroyRef and takeUntilDestroyed().

The following patterns are currently supported:

- Decorator and RxJS operator (e.g. `@Destroyable` and `takeUntilDestroy(this)`)

To migrate, run the following script:

```bash
ng g frontend_fan-angular-migrations:destroy-ref
```
