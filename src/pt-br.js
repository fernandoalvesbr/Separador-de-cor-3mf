import { createTranslator, observeTranslations } from './i18n-core.js';
import { portuguese, english } from './i18n-catalog.js';

document.getElementById('help-dialog').innerHTML =
  `<button id="close-help" class="close-dialog" aria-label="Fechar ajuda">×</button>
<span class="eyebrow">DO MODELO À IMPRESSÃO</span><h2>Separador de Cor 3MF</h2>
<ol><li><strong>Abra um arquivo 3MF pintado.</strong> O modelo abre inteiro. Escolha o tipo de corte e clique em Aplicar corte para separar.</li>
<li><strong>Selecione as peças.</strong> Use Ctrl/⌘/Shift + clique para selecionar várias, girar ou excluir. Desfazer restaura a última edição.</li>
<li><strong>Corte por linha ou por cor.</strong> Desenhe a linha e aplique o corte. A opção de junções cria pinos e furos para colagem quando a geometria permitir.</li>
<li><strong>Baixe a mesa completa em 3MF.</strong> O arquivo inclui todas as peças com as cores e posições exibidas. Abra no fatiador e mantenha a ordem dos materiais.</li>
<li><strong>Cortes opcionais.</strong> Escolha o eixo e a posição do plano. Cortes exigem malhas fechadas. Regiões de pintura podem ser superfícies abertas, indicadas como VERIFICAR.</li></ol>
<p>Extrusores virtuais criam receitas de mistura para as cores. Escolha de 2 a 8 filamentos físicos. No PrusaSlicer 2.9.6 ou posterior, use Arquivo → Abrir projeto para preservar os extrusores virtuais.</p>
<p>O arquivo contém geometria, pintura e posições. Configure os perfis de impressora, suportes e impressão no fatiador.</p>
<p class="muted">Tudo é processado no seu dispositivo. Atalhos: F para enquadrar, C para cortar e Ctrl+Z para desfazer.</p>`;
document.getElementById('virtual-note').textContent =
  'Ajuste as cores numeradas aos filamentos da impressora, na ordem das posições. Clique nas amostras para editar. As receitas de mistura são estimativas editáveis no fatiador. A visualização mostra as cores desejadas. Selecione uma impressora com o mesmo número de filamentos ao abrir o projeto.';

const translate = createTranslator(portuguese, english);
let language = 'pt-BR';
try {
  if (localStorage.getItem('split3mf-language') === 'en') language = 'en';
} catch {}
const ui = observeTranslations(document, translate, () => language);
function setLanguage(value) {
  language = value === 'en' ? 'en' : 'pt-BR';
  document.getElementById('language-select').value = language;
  document.documentElement.lang = language;
  document.title = language === 'en' ? '3MF Color Separator' : 'Separador de Cor 3MF';
  try {
    localStorage.setItem('split3mf-language', language);
  } catch {}
  ui.refresh();
  // This label is also changed dynamically as pieces are selected. Set its
  // canonical text explicitly after each language change to avoid legacy
  // cached text such as "Moverr" surviving in the button.
  document.getElementById('move-to-bed').textContent =
    language === 'en' ? 'Move to bed' : 'Mover para mesa';
}
window.translateUi = (value) => translate(value, language);
document
  .getElementById('language-select')
  .addEventListener('change', (event) => setLanguage(event.target.value));
setLanguage(language);
