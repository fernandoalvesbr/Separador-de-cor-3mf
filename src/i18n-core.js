const normalize = (value) => value.trim().replace(/\s+/g, ' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createTranslator(portuguese, english) {
  const toEnglish = new Map(Object.entries(portuguese).map(([en, pt]) => [normalize(pt), en]));
  for (const [pt, en] of Object.entries(english)) toEnglish.set(normalize(pt), en);
  const toPortuguese = new Map([...toEnglish].map(([pt, en]) => [en, pt]));
  for (const [en, pt] of Object.entries(portuguese)) toPortuguese.set(normalize(en), pt);
  const expressions = new Map(
    [toEnglish, toPortuguese].map((map) => [
      map,
      new RegExp(
        [...map.keys()]
          .sort((a, b) => b.length - a.length)
          .map(escapeRegex)
          .join('|'),
        'gu',
      ),
    ]),
  );
  return (value, language = 'pt-BR') => {
    if (typeof value !== 'string' || !value.trim()) return value;
    const en = language === 'en',
      map = en ? toEnglish : toPortuguese;
    const text = normalize(value);
    // Match whole phrases first, regardless of HTML indentation or line breaks.
    let translated = map.get(text);
    if (translated === undefined) {
      const rules = en ? englishPatterns : portuguesePatterns;
      translated = text;
      for (const [pattern, replacement] of rules)
        translated = translated.replace(pattern, replacement);
      translated = translated.replace(expressions.get(map), (match) => map.get(match));
    }
    if (translated === text) return value;
    return value.match(/^\s*/)[0] + translated + value.match(/\s*$/)[0];
  };
}

const englishPatterns = [
  [
    /Peças giradas ([-\d.]+)°\. Use Mover para mesa para apoiar a peça\./g,
    'Pieces rotated $1°. Use Move to bed to place the piece on the table.',
  ],
  [
    /(\d+) linha\(s\) preparada\(s\)\. Continue desenhando ou clique em Aplicar corte\./g,
    '$1 line(s) ready. Keep drawing or click Apply cut.',
  ],
  [/\bCor (\d+)/g, 'Color $1'],
  [/\b(\d+) posições\b/g, '$1 slots'],
  [/\btriângulos\b/g, 'triangles'],
  [/\bmateriais\b/g, 'materials'],
  [/\bmilímetros\b/g, 'millimeters'],
  [/arestas abertas/g, 'open edges'],
  [/arestas não manifold/g, 'non-manifold edges'],
  [/arestas inconsistentes/g, 'inconsistent edges'],
  [/Cor de visualização e exportação do material (\d+)/g, 'Material $1 display and export color'],
  [/Cor do material (\d+)/g, 'Material $1 color'],
  [/Cor do filamento físico na posição (\d+)/g, 'Physical filament color for slot $1'],
  [/Posição (\d+):/g, 'Slot $1:'],
  [/Clique para editar/g, 'Click to edit'],
  [/Identificando a pintura em (.+)…/g, 'Resolving paint on $1…'],
  [/Corte (\d+):/g, 'Cut $1:'],
];
const portuguesePatterns = [
  [/\b(\d+) slots\b/g, '$1 posições'],
  [/\btriangles\b/g, 'triângulos'],
  [/\bmaterials\b/g, 'materiais'],
  [/\bmillimeters\b/g, 'milímetros'],
  [/open edges/g, 'arestas abertas'],
  [/non-manifold edges/g, 'arestas não manifold'],
  [/inconsistent edges/g, 'arestas inconsistentes'],
  [/Material (\d+) display and export color/g, 'Cor de visualização e exportação do material $1'],
  [/Material (\d+) color/g, 'Cor do material $1'],
  [/Physical filament color for slot (\d+)/g, 'Cor do filamento físico na posição $1'],
  [/Slot (\d+):/g, 'Posição $1:'],
  [/Click to edit/g, 'Clique para editar'],
  [/Resolving paint on (.+)…/g, 'Identificando a pintura em $1…'],
  [/experimental export/g, 'exportação experimental'],
  [/experimental\)/g, 'experimental)'],
  [/ficheiros/g, 'arquivos'],
  [/ficheiro/g, 'arquivo'],
];

export function observeTranslations(document, translate, getLanguage) {
  const textSources = new WeakMap(),
    attributeSources = new WeakMap();
  const attributes = ['title', 'aria-label', 'placeholder', 'alt', 'content'];
  const options = {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: attributes,
  };
  const observer = new MutationObserver(refresh);
  function render(sourceMap, key, current, write) {
    const previous = sourceMap.get(key);
    const source = previous && current === previous.output ? previous.source : current;
    const output = translate(source, getLanguage());
    sourceMap.set(key, { source, output });
    if (output !== current) write(output);
  }
  function refresh() {
    observer.disconnect();
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest('script,style,[data-no-translate]')) continue;
        render(textSources, node, node.nodeValue, (value) => {
          node.nodeValue = value;
        });
      }
      for (const element of document.querySelectorAll(
        '[title],[aria-label],[placeholder],[alt],meta[name="description"]',
      )) {
        if (element.closest('[data-no-translate]')) continue;
        let sources = attributeSources.get(element);
        if (!sources) {
          sources = new Map();
          attributeSources.set(element, sources);
        }
        for (const attribute of attributes) {
          if (!element.hasAttribute(attribute)) continue;
          render(sources, attribute, element.getAttribute(attribute), (value) =>
            element.setAttribute(attribute, value),
          );
        }
      }
    } finally {
      observer.observe(document.body, options);
    }
  }
  return { refresh, disconnect: () => observer.disconnect() };
}
