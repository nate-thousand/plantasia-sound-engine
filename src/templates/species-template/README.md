# Species Template

Copy this folder to `src/species/<your-species-id>/` to create a new Sound World plugin.

## Files

| File | Responsibility |
|------|----------------|
| `index.ts` | `SoundWorld` implementation — lifecycle, note routing, ecology |
| `metadata.ts` | Identity, generative preferences, supported controls |
| `synth.ts` | Tone.js voice graph |
| `effects.ts` | Effects chain and level mapping |
| `generator.ts` | Thin adapter to shared `Generator` |
| `expressionProfile.ts` | Performance engine weights |
| `performanceApply.ts` | Apply routed performance targets to DSP |

## Steps

1. Copy `src/templates/species-template/` → `src/species/<id>/`
2. Find/replace `Template` / `template-species` with your species name and ID
3. Implement `synth.ts` and `effects.ts`
4. Set `status: 'active'` in metadata when ready
5. Register in `src/species/registerBuiltinSpecies.ts`:
   ```typescript
   registry.register({ factory: createYourSpeciesSoundWorld });
   ```
6. Run `npm run test:registry` and `npm run test:species`

See [docs/CREATING_A_SPECIES.md](../../docs/CREATING_A_SPECIES.md) for the full checklist.
