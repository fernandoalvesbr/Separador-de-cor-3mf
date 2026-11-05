import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator } from '../src/i18n-core.js';
import { portuguese, english } from '../src/i18n-catalog.js';

const translate = createTranslator(portuguese, english);

test('every Portuguese catalog phrase has its complete English translation', () => {
  for (const [source, expected] of Object.entries(english)) {
    assert.equal(translate(source, 'en'), expected, source);
  }
});

test('whole phrases take precedence over shorter labels and HTML whitespace', () => {
  assert.equal(
    translate('Modelo aberto inteiro. Escolha o tipo de corte e clique em Aplicar corte.', 'en'),
    'Whole model opened. Choose a cut type and click Apply cut.',
  );
  assert.equal(
    translate(
      '  Cria pinos e furos correspondentes, com folga de 0,2 mm. Disponível em cortes por linha,\n    plano quando houver volume suficiente. A separação por cores não usa junções.  ',
      'en',
    ),
    '  Creates matching pins and holes with 0.2 mm clearance. Available for line and plane cuts when there is enough space. Color separation does not use joints.  ',
  );
  assert.equal(translate('🔓 Bloquear mesa', 'en'), '🔓 Lock table');
});

test('dynamic notifications, queues, counts and generated names use English', () => {
  assert.equal(
    translate('Peças giradas -90°. Use Mover para mesa para apoiar a peça.', 'en'),
    'Pieces rotated -90°. Use Move to bed to place the piece on the table.',
  );
  assert.equal(
    translate('12 linha(s) preparada(s). Continue desenhando ou clique em Aplicar corte.', 'en'),
    '12 line(s) ready. Keep drawing or click Apply cut.',
  );
  assert.equal(
    translate(
      '3 corte(s) aplicado(s). 1 linha(s) sem interseção foram ignoradas. Selecione uma parte para continuar cortando.',
      'en',
    ),
    '3 cut(s) applied. 1 line(s) without an intersection were skipped. Select a part to continue cutting.',
  );
  assert.equal(translate('Cor 04 · #DE4343 · A', 'en'), 'Color 04 · #DE4343 · A');
  assert.equal(
    translate('2048 triângulos · 3 materiais · milímetros', 'en'),
    '2048 triangles · 3 materials · millimeters',
  );
});

test('Portuguese remains the default and original English labels can be localized', () => {
  assert.equal(translate('Apply cut'), 'Aplicar corte');
  assert.equal(translate('Apply cut', 'en'), 'Apply cut');
  assert.equal(translate('Português', 'pt-BR'), 'Português');
  assert.equal(
    translate('Whole model opened. Choose a cut type and click Apply cut.', 'pt-BR'),
    'Modelo aberto inteiro. Escolha o tipo de corte e clique em Aplicar corte.',
  );
  assert.equal(
    translate('PrusaSlicer · Bambu Studio · OrcaSlicer', 'en'),
    'PrusaSlicer · Bambu Studio · OrcaSlicer',
  );
});
