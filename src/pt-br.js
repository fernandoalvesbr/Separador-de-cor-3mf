const labels = {
  'Show': 'Mostrar', 'Piece to cut': 'Cor selecionada', 'Plane direction': 'Direção do plano',
  'Position from center': 'Posição a partir do centro', 'Center': 'Centralizar', 'Tilt': 'Inclinação',
  'Azimuth': 'Azimute', 'Drag plane to': 'Arraste o plano para', 'Move': 'Mover', 'Rotate': 'Girar',
  'New cut face material': 'Material da nova face de corte', 'Apply cut': 'Aplicar corte',
  'Both halves are kept. Surface paint stays assigned.': 'As duas partes são mantidas com a pintura original.',
  '↶ Undo': '↶ Desfazer', 'Undo cut (Ctrl+Z)': 'Desfazer corte (Ctrl+Z)',
  'Your model’s pieces will appear here.': 'As peças do seu modelo aparecerão aqui.',
  'Color regions': 'Regiões de cor', 'Colors from your 3MF': 'Cores do seu arquivo 3MF',
  'Use virtual extruders': 'Usar extrusores virtuais',
  'Convert every exported color region. No cut required.': 'Converta cada região de cor exportada. Não é necessário cortar.',
  'Physical filament slots': 'Posições de filamento físico', 'Target slicer': 'Fatiador de destino',
  'Export': 'Exportar', 'Save painted 3MF': 'Baixar mesa completa em 3MF',
  'Meshes and paint only. Uses your slicer’s current printer.': 'Inclui todas as peças, cores e posições da mesa. Use o perfil do seu fatiador.',
  'Select the matching printer, then use File → Open Project in PrusaSlicer 2.9.6+.': 'Selecione a impressora correspondente e use Arquivo → Abrir projeto no PrusaSlicer 2.9.6+.',
  'Fit': 'Enquadrar', 'Fit model (F)': 'Enquadrar modelo (F)', 'Top': 'Superior', 'Front': 'Frontal',
  'Right': 'Lateral', 'Edges': 'Arestas', 'Cancel': 'Cancelar', 'Reading model…': 'Lendo modelo…',
  'Drop your painted 3MF': 'Solte seu arquivo 3MF pintado aqui', 'DEMO MODEL': 'MODELO DE EXEMPLO',
  'CLOSED': 'FECHADA', 'CHECK': 'VERIFICAR', 'Closed, consistently oriented mesh': 'Malha fechada, com orientação consistente',
  'Dismiss message': 'Fechar mensagem', 'Close help': 'Fechar ajuda', '3D model workspace': 'Área de trabalho 3D',
  'Cut position': 'Posição do corte', 'About physical filament slots': 'Sobre as posições de filamento físico',
  'Physical filament colors in slot order': 'Cores dos filamentos físicos em ordem',
  'Choose a .3mf model file.': 'Escolha um arquivo de modelo .3mf.',
  'Reading 3MF and resolving paint…': 'Lendo o 3MF e identificando a pintura…',
  'Loading painted demo…': 'Carregando exemplo pintado…', 'Working…': 'Processando…',
  'Saving geometry and color assignments…': 'Salvando todas as peças e posições da mesa…',
  'Cutting painted surfaces and closing both halves…': 'Cortando as superfícies pintadas e fechando as duas partes…',
  'Restoring the previous cut…': 'Restaurando o corte anterior…', 'Last cut undone.': 'Último corte desfeito.',
  'Cut complete. Both pieces are closed. Select either piece to cut again.': 'Corte concluído. As duas peças estão fechadas. Selecione uma para cortar novamente.',
  'Operation cancelled.': 'Operação cancelada.',
  'Operation cancelled. Current pieces kept; undo history cleared.': 'Operação cancelada. Peças mantidas e histórico de desfazer limpo.',
  'Drag to orbit · Right-drag to pan · Scroll to zoom': 'Arraste para girar · Botão direito para deslocar · Role para ampliar',
  'Your next clean cut.': 'Seu modelo, separado por cor.', 'Painted surfaces. Separate pieces.': 'Superfícies pintadas. Peças separadas.',
  'This browser could not start the 3D viewer. Enable WebGL / hardware acceleration and reload.': 'O navegador não conseguiu iniciar o visualizador 3D. Ative o WebGL ou a aceleração de hardware e recarregue.',
  'The model worker stopped. Try a smaller file or reload the app.': 'O processamento parou. Tente um arquivo menor ou recarregue o aplicativo.',
  'Mesh-and-paint 3MF prepared. Use your slicer’s current printer and keep material slots in the same order.': 'Mesa completa salva em 3MF com todas as peças, cores e posições. Mantenha a ordem dos materiais no fatiador.',
  'Open a model first': 'Abra um modelo primeiro',
  'Select a piece first.': 'Selecione uma peça primeiro.',
  'No painted color regions were found.': 'Nenhuma região de cor pintada foi encontrada.',
  'Unknown operation.': 'Operação desconhecida.',
  'This model exceeds the 1.5 million resolved triangle limit.': 'O modelo ultrapassa o limite de 1,5 milhão de triângulos.',
  'Paint subdivision exceeds the supported mesh complexity.': 'A subdivisão da pintura ultrapassa a complexidade de malha permitida.',
  'Enter a valid cut plane.': 'Informe um plano de corte válido.',
  'Choose a valid cut face material (1–255).': 'Escolha um material válido para a face de corte (1 a 255).',
  'The plane must pass through the interior of the selected piece.': 'O plano deve atravessar o interior da peça selecionada.',
  'This piece has open, non-manifold, or inconsistently oriented edges. Repair the source mesh before cutting.': 'A peça tem arestas abertas, não manifold ou com orientação inconsistente. Repare a malha antes de cortar.',
  'The cut could not produce closed pieces. Move or tilt the plane slightly. Your original piece is unchanged.': 'O corte não produziu peças fechadas. Mova ou incline um pouco o plano. A peça original foi mantida.',
  'Cut validation found a volume mismatch. The original piece is unchanged.': 'A validação detectou uma diferença de volume. A peça original foi mantida.',
  'Some pieces have open or inconsistent edges. They can be viewed, but must be repaired before cutting.': 'Algumas peças têm arestas abertas ou inconsistentes. Elas podem ser visualizadas, mas precisam de reparo antes de cortar.',
  'Select at least one piece to export.': 'Selecione ao menos uma peça para exportar.',
  'No printable model geometry was found.': 'Nenhuma geometria imprimível foi encontrada.',
  'Conforming paint exceeds the 1.5 million triangle limit.': 'A pintura ultrapassa o limite de 1,5 milhão de triângulos.',
};
function translate(value) {
  const key = value.trim().replace(/\s+/g, ' ');
  if (labels[key]) return value.replace(value.trim(), labels[key]);
  return value.replace(/ficheiros/g, 'arquivos').replace(/ficheiro/g, 'arquivo')
    .replace(/Resolving paint on (.+)…/g, 'Identificando a pintura em $1…')
    .replace(/experimental export/g, 'exportação experimental').replace(/experimental\)/g, 'experimental)')
    .replace(/separam-se sozinhas/g, 'são separadas automaticamente')
    .replace(/triangles/g, 'triângulos').replace(/materials/g, 'materiais').replace(/millimeters/g, 'milímetros')
    .replace(/(\d+) slots/g, '$1 posições').replace(/open edges/g, 'arestas abertas')
    .replace(/non-manifold edges/g, 'arestas não manifold').replace(/inconsistent edges/g, 'arestas inconsistentes')
    .replace(/Material (\d+) display and export color/g, 'Cor de visualização e exportação do material $1')
    .replace(/Material (\d+) color/g, 'Cor do material $1')
    .replace(/Physical filament color for slot (\d+)/g, 'Cor do filamento físico na posição $1')
    .replace(/Slot (\d+):/g, 'Posição $1:').replace(/Click to edit/g, 'Clique para editar');
}
function localize() {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    if (node.parentElement?.closest('script,style')) continue;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  for (const element of document.querySelectorAll('[title],[aria-label]')) {
    for (const attr of ['title', 'aria-label']) {
      const value = element.getAttribute(attr);
      if (value && translate(value) !== value) element.setAttribute(attr, translate(value));
    }
  }
}
document.documentElement.lang = 'pt-BR';
document.getElementById('help-dialog').innerHTML = `<button id="close-help" class="close-dialog" aria-label="Fechar ajuda">×</button>
<span class="eyebrow">DO MODELO À IMPRESSÃO</span><h2>Separador de Cor 3MF</h2>
<ol><li><strong>Abra um arquivo 3MF pintado.</strong> As regiões de cor são detectadas e separadas automaticamente.</li>
<li><strong>Escolha uma cor.</strong> Mova a barra de afastamento. Cada cor guarda sua posição enquanto você organiza as demais.</li>
<li><strong>Organize sua mesa.</strong> Use a lista para alternar entre as peças. Gire, amplie e inspecione o modelo no visualizador.</li>
<li><strong>Baixe a mesa completa em 3MF.</strong> O arquivo inclui todas as peças com as cores e posições exibidas. Abra no fatiador e mantenha a ordem dos materiais.</li>
<li><strong>Cortes opcionais.</strong> Escolha o eixo e a posição do plano. Cortes exigem malhas fechadas. Regiões de pintura podem ser superfícies abertas, indicadas como VERIFICAR.</li></ol>
<p>Extrusores virtuais criam receitas de mistura para as cores. Escolha de 2 a 8 filamentos físicos. No PrusaSlicer 2.9.6 ou posterior, use Arquivo → Abrir projeto para preservar os extrusores virtuais.</p>
<p>O arquivo contém geometria, pintura e posições. Configure os perfis de impressora, suportes e impressão no fatiador.</p>
<p class="muted">Tudo é processado no seu dispositivo. Atalhos: F para enquadrar, C para cortar e Ctrl+Z para desfazer.</p>`;
document.getElementById('virtual-note').textContent = 'Ajuste as cores numeradas aos filamentos da impressora, na ordem das posições. Clique nas amostras para editar. As receitas de mistura são estimativas editáveis no fatiador. A visualização mostra as cores desejadas. Selecione uma impressora com o mesmo número de filamentos ao abrir o projeto.';
localize();
new MutationObserver(localize).observe(document.body, {
  subtree: true, childList: true, characterData: true, attributes: true,
  attributeFilter: ['title', 'aria-label'],
});
