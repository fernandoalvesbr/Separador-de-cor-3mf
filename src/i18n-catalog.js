// UI messages in both languages. Imported file names are kept unchanged.
export const portuguese = {
  Show: 'Mostrar',
  'Piece to cut': 'Peça ativa',
  'Plane direction': 'Direção do plano',
  'Position from center': 'Posição a partir do centro',
  Center: 'Centralizar',
  Tilt: 'Inclinação',
  Azimuth: 'Azimute',
  'Drag plane to': 'Arraste o plano para',
  Move: 'Mover',
  Rotate: 'Girar',
  'New cut face material': 'Material da nova face de corte',
  'Apply cut': 'Aplicar corte',
  'Both halves are kept. Surface paint stays assigned.':
    'As duas partes são mantidas com a pintura original.',
  '↶ Undo': '↶ Desfazer',
  'Undo cut (Ctrl+Z)': 'Desfazer corte (Ctrl+Z)',
  'Your model’s pieces will appear here.': 'As peças do seu modelo aparecerão aqui.',
  'Color regions': 'Regiões de cor',
  'Colors from your 3MF': 'Cores do seu arquivo 3MF',
  'Use virtual extruders': 'Usar extrusores virtuais',
  'Convert every exported color region. No cut required.':
    'Converta cada região de cor exportada. Não é necessário cortar.',
  'Physical filament slots': 'Posições de filamento físico',
  'Target slicer': 'Fatiador de destino',
  Export: 'Exportar',
  'Save painted 3MF': 'Baixar mesa completa em 3MF',
  'Meshes and paint only. Uses your slicer’s current printer.':
    'Inclui todas as peças, cores e posições da mesa. Use o perfil do seu fatiador.',
  'Select the matching printer, then use File → Open Project in PrusaSlicer 2.9.6+.':
    'Selecione a impressora correspondente e use Arquivo → Abrir projeto no PrusaSlicer 2.9.6+.',
  Fit: 'Enquadrar',
  'Fit model (F)': 'Enquadrar modelo (F)',
  Top: 'Superior',
  Front: 'Frontal',
  Right: 'Lateral',
  Edges: 'Arestas',
  Cancel: 'Cancelar',
  'Reading model…': 'Lendo modelo…',
  'Drop your painted 3MF': 'Solte seu arquivo 3MF pintado aqui',
  'DEMO MODEL': 'MODELO DE EXEMPLO',
  CLOSED: 'FECHADA',
  CHECK: 'VERIFICAR',
  'Closed, consistently oriented mesh': 'Malha fechada, com orientação consistente',
  'Dismiss message': 'Fechar mensagem',
  'Close help': 'Fechar ajuda',
  '3D model workspace': 'Área de trabalho 3D',
  'Cut position': 'Posição do corte',
  'About physical filament slots': 'Sobre as posições de filamento físico',
  'Physical filament colors in slot order': 'Cores dos filamentos físicos em ordem',
  'Choose a .3mf model file.': 'Escolha um arquivo de modelo .3mf.',
  'Reading 3MF and resolving paint…': 'Lendo o 3MF e identificando a pintura…',
  'Loading painted demo…': 'Carregando exemplo pintado…',
  'Working…': 'Processando…',
  'Saving geometry and color assignments…': 'Salvando todas as peças e posições da mesa…',
  'Cutting painted surfaces and closing both halves…':
    'Cortando as superfícies pintadas e fechando as duas partes…',
  'Restoring the previous cut…': 'Restaurando o corte anterior…',
  'Last cut undone.': 'Último corte desfeito.',
  'Cut complete. Both pieces are closed. Select either piece to cut again.':
    'Corte concluído. As duas peças estão fechadas. Selecione uma para cortar novamente.',
  'Operation cancelled.': 'Operação cancelada.',
  'Operation cancelled. Current pieces kept; undo history cleared.':
    'Operação cancelada. Peças mantidas e histórico de desfazer limpo.',
  'Drag to orbit · Right-drag to pan · Scroll to zoom':
    'Arraste para girar · Botão direito para deslocar · Role para ampliar',
  'Your next clean cut.': 'Seu modelo, separado por cor.',
  'Painted surfaces. Separate pieces.': 'Superfícies pintadas. Peças separadas.',
  'This browser could not start the 3D viewer. Enable WebGL / hardware acceleration and reload.':
    'O navegador não conseguiu iniciar o visualizador 3D. Ative o WebGL ou a aceleração de hardware e recarregue.',
  'The model worker stopped. Try a smaller file or reload the app.':
    'O processamento parou. Tente um arquivo menor ou recarregue o aplicativo.',
  'Mesh-and-paint 3MF prepared. Use your slicer’s current printer and keep material slots in the same order.':
    'Mesa completa salva em 3MF com todas as peças, cores e posições. Mantenha a ordem dos materiais no fatiador.',
  'Open a model first': 'Abra um modelo primeiro',
  'Select a piece first.': 'Selecione uma peça primeiro.',
  'No painted color regions were found.': 'Nenhuma região de cor pintada foi encontrada.',
  'Unknown operation.': 'Operação desconhecida.',
  'This model exceeds the 1.5 million resolved triangle limit.':
    'O modelo ultrapassa o limite de 1,5 milhão de triângulos.',
  'Paint subdivision exceeds the supported mesh complexity.':
    'A subdivisão da pintura ultrapassa a complexidade de malha permitida.',
  'Enter a valid cut plane.': 'Informe um plano de corte válido.',
  'Choose a valid cut face material (1–255).':
    'Escolha um material válido para a face de corte (1 a 255).',
  'The plane must pass through the interior of the selected piece.':
    'O plano deve atravessar o interior da peça selecionada.',
  'This piece has open, non-manifold, or inconsistently oriented edges. Repair the source mesh before cutting.':
    'A peça tem arestas abertas, não manifold ou com orientação inconsistente. Repare a malha antes de cortar.',
  'The cut could not produce closed pieces. Move or tilt the plane slightly. Your original piece is unchanged.':
    'O corte não produziu peças fechadas. Mova ou incline um pouco o plano. A peça original foi mantida.',
  'Cut validation found a volume mismatch. The original piece is unchanged.':
    'A validação detectou uma diferença de volume. A peça original foi mantida.',
  'Some pieces have open or inconsistent edges. They can be viewed, but must be repaired before cutting.':
    'Algumas peças têm arestas abertas ou inconsistentes. Elas podem ser visualizadas, mas precisam de reparo antes de cortar.',
  'Select at least one piece to export.': 'Selecione ao menos uma peça para exportar.',
  'No printable model geometry was found.': 'Nenhuma geometria imprimível foi encontrada.',
  'Conforming paint exceeds the 1.5 million triangle limit.':
    'A pintura ultrapassa o limite de 1,5 milhão de triângulos.',
};

export const english = {
  'Cortar peças': 'Cut pieces',
  'Peça ativa': 'Active piece',
  'Tipo de corte': 'Cut type',
  'Separar por cores': 'Separate by colors',
  'Linha desenhada no ambiente': 'Line drawn in workspace',
  'Plano: eixo e posição': 'Plane: axis and position',
  'Adicionar linhas de corte': 'Add cut lines',
  'Remover última linha': 'Remove last line',
  'Limpar linhas': 'Clear lines',
  'Aplicar corte': 'Apply cut',
  'Criar junções para colagem': 'Create glue joints',
  Peças: 'Pieces',
  'Selecionar todas': 'Select all',
  'Excluir selecionadas': 'Delete selected',
  'Girar selecionadas': 'Rotate selected',
  'Mover para mesa': 'Move to bed',
  Desfazer: 'Undo',
  Idioma: 'Language',
  Português: 'Portuguese',
  'Mesa desbloqueada': 'Table unlocked',
  'Desbloquear mesa': 'Unlock table',
  'Bloquear mesa': 'Lock table',
  Arestas: 'Edges',
  Enquadrar: 'Fit',
  Superior: 'Top',
  Frontal: 'Front',
  Lateral: 'Right',
  'Abrir ficheiro': 'Open file',
  'Como funciona': 'How it works',
  'BANCADA 3D': '3D WORKSPACE',
  'Peças prontas para imprimir.': 'Pieces ready to print.',
  'O seu modelo, separado por cor.': 'Your model, separated by color.',
  'Pintura preservada. Peças prontas para imprimir.': 'Paint preserved. Pieces ready to print.',
  'Você escolhe onde cortar.': 'You choose where to cut.',
  'Abra o modelo inteiro, selecione as peças e aplique':
    'Open the whole model, select pieces, and apply',
  'cortes por cor ou por uma linha no ambiente.': 'color or line cuts in the workspace.',
  'Clique na peça para selecionar': 'Click a piece to select',
  'Separador de Cor 3MF': '3MF Color Separator',
  'Separador de Cor': 'Color Separator',
  'Escolha uma vista (superior, frontal ou lateral), arraste uma linha sobre a peça e':
    'Choose a top, front, or right view, drag a line across the piece, and',
  'clique em Aplicar corte.': 'click Apply cut.',
  'Cria pinos e furos correspondentes, com folga de 0,2 mm. Disponível em cortes por linha,':
    'Creates matching pins and holes with 0.2 mm clearance. Available for line and',
  'plano quando houver volume suficiente. A separação por cores não usa junções.':
    'plane cuts when there is enough space. Color separation does not use joints.',
  'O modelo só é separado ao aplicar o corte. A pintura original é preservada.':
    'The model is only separated when you apply a cut. Original paint is preserved.',
  'Ctrl, ⌘ ou Shift + clique adiciona ou remove peças da seleção.':
    'Ctrl, ⌘, or Shift-click adds or removes pieces from the selection.',
  'Eixo de rotação': 'Rotation axis',
  'Ângulo (graus)': 'Angle (degrees)',
  'Direção do afastamento na mesa': 'Table offset direction',
  'Clique em uma peça no ambiente e arraste as setas X, Y e Z para movê-la. Cada peça':
    'Click a piece in the workspace and drag the X, Y, and Z arrows to move it. Each piece',
  'mantém sua posição na exportação.': 'keeps its position on export.',
  'Todas as peças da mesa': 'All table pieces',
  'Somente as peças selecionadas': 'Selected pieces only',
  'Junções não estão disponíveis na separação por cores':
    'Joints are unavailable for color separation',
  'Baixar peças selecionadas em 3MF': 'Download selected pieces as 3MF',
  'Exporta somente a peça selecionada, com sua cor e posição na mesa.':
    'Exports only the selected piece with its color and table position.',
  'Exporta todas as peças, com suas cores e posições na mesa.':
    'Exports all pieces with their colors and table positions.',
  'Peça selecionada movida para a mesa.': 'Selected piece moved to the table.',
  'Excluindo peças selecionadas…': 'Deleting selected pieces…',
  'Peças excluídas. Use Desfazer para restaurar.': 'Pieces deleted. Use Undo to restore them.',
  'Informe um ângulo válido.': 'Enter a valid angle.',
  'Girando peças…': 'Rotating pieces…',
  'Selecione apenas uma peça para cortar por linha ou plano.':
    'Select only one piece for a line or plane cut.',
  'Corte aplicado. Use Desfazer para restaurar a peça.':
    'Cut applied. Use Undo to restore the piece.',
  'corte(s) aplicado(s).': 'cut(s) applied.',
  'linha(s) sem interseção foram ignoradas.': 'line(s) without an intersection were skipped.',
  'Selecione uma parte para continuar cortando.': 'Select a part to continue cutting.',
  'Corte aplicado com': 'Cut applied with',
  'junção(ões) para colagem.': 'joint(s) for gluing.',
  'Afastar somente as peças selecionadas': 'Move selected pieces only',
  'Mesa bloqueada: clique para liberar a navegação': 'Table locked: click to enable navigation',
  'Mesa desbloqueada: clique para travar a navegação': 'Table unlocked: click to lock navigation',
  'Mesa bloqueada · Clique na peça e arraste as setas para mover':
    'Table locked · Click a piece and drag the arrows to move',
  'Modelo aberto inteiro. Escolha o tipo de corte e clique em Aplicar corte.':
    'Whole model opened. Choose a cut type and click Apply cut.',
  'Abra o 3MF.': 'Open the 3MF.',
  'cortes por cor ou por uma linha': 'color or line cuts',
  'no ambiente.': 'in the workspace.',
  'Largue um ficheiro .3mf aqui para começar': 'Drop a .3mf file here to begin',
  'Encostar a base da peça selecionada em Z = 0': 'Place the selected piece base at Z = 0',
  'Cores separadas como superfícies abertas: será necessário repará-las no fatiador antes de imprimir ou cortar novamente.':
    'Colors separated as open surfaces: repair them in your slicer before printing or cutting again.',
  'DO MODELO À IMPRESSÃO': 'FROM MODEL TO PRINT',
  'Abra um arquivo 3MF pintado.': 'Open a painted 3MF file.',
  'O modelo abre inteiro. Escolha o tipo de corte e clique em Aplicar corte para separar.':
    'The whole model opens intact. Choose a cut type and click Apply cut to separate it.',
  'Selecione as peças.': 'Select pieces.',
  'Use Ctrl/⌘/Shift + clique para selecionar várias, girar ou excluir. Desfazer restaura a última edição.':
    'Use Ctrl/⌘/Shift-click to select multiple pieces, rotate, or delete them. Undo restores the last edit.',
  'Corte por linha ou por cor.': 'Cut by line or by color.',
  'Desenhe a linha e aplique o corte. A opção de junções cria pinos e furos para colagem quando a geometria permitir.':
    'Draw the line and apply the cut. The joint option creates pins and holes for gluing when the geometry allows it.',
  'Baixe a mesa completa em 3MF.': 'Download the complete table as 3MF.',
  'O arquivo inclui todas as peças com as cores e posições exibidas. Abra no fatiador e mantenha a ordem dos materiais.':
    'The file includes all pieces with their displayed colors and positions. Open it in your slicer and keep the material order.',
  'Cortes opcionais.': 'Optional cuts.',
  'Escolha o eixo e a posição do plano. Cortes exigem malhas fechadas. Regiões de pintura podem ser superfícies abertas, indicadas como VERIFICAR.':
    'Choose the plane axis and position. Cuts require closed meshes. Painted regions can be open surfaces, marked as CHECK.',
  'Extrusores virtuais criam receitas de mistura para as cores. Escolha de 2 a 8 filamentos físicos. No PrusaSlicer 2.9.6 ou posterior, use Arquivo → Abrir projeto para preservar os extrusores virtuais.':
    'Virtual extruders create mixing recipes for colors. Choose 2 to 8 physical filaments. In PrusaSlicer 2.9.6 or later, use File → Open Project to preserve virtual extruders.',
  'O arquivo contém geometria, pintura e posições. Configure os perfis de impressora, suportes e impressão no fatiador.':
    'The file contains geometry, paint, and positions. Configure printer profiles, supports, and print settings in your slicer.',
  'Tudo é processado no seu dispositivo. Atalhos: F para enquadrar, C para cortar e Ctrl+Z para desfazer.':
    'Everything is processed on your device. Shortcuts: F to fit, C to cut, and Ctrl+Z to undo.',
  'Os ficheiros ficam no seu dispositivo': 'Files stay on your device',
  'Os arquivos ficam no seu dispositivo': 'Files stay on your device',
  'Ver um exemplo': 'View an example',
  'processamento local': 'local processing',
  'Abra um modelo primeiro': 'Open a model first',
  'Regiões de cor': 'Color regions',
  'Cores do seu arquivo 3MF': 'Colors from your 3MF file',
  'Fatiador de destino': 'Target slicer',
  Exportar: 'Export',
  'Baixar mesa completa em 3MF': 'Download complete table as 3MF',
  'Inclui todas as peças, cores e posições da mesa. Use o perfil do seu fatiador.':
    'Includes all pieces, colors, and table positions. Use your slicer profile.',
  'Abrir arquivo': 'Open file',
  'Separe modelos 3MF pintados por cor diretamente no navegador. Seus ficheiros nunca saem do dispositivo.':
    'Separate painted 3MF models by color directly in your browser. Your files never leave your device.',
  'Separador de Cor 3MF — início': '3MF Color Separator — home',
  'Abra o modelo inteiro, selecione as peças e aplique':
    'Open the whole model, select pieces, and apply',
  'cortes por cor ou por uma linha no ambiente.': 'color or line cuts in the workspace.',
  'Largue um arquivo .3mf aqui para começar': 'Drop a .3mf file here to begin',
  'Escolha uma vista (superior, frontal ou lateral), arraste uma linha sobre a peça e clique em Aplicar corte.':
    'Choose a top, front, or right view, drag a line across the piece, and click Apply cut.',
  'Cria pinos e furos correspondentes, com folga de 0,2 mm. Disponível em cortes por linha, plano quando houver volume suficiente. A separação por cores não usa junções.':
    'Creates matching pins and holes with 0.2 mm clearance. Available for line and plane cuts when there is enough space. Color separation does not use joints.',
  'Clique em uma peça no ambiente e arraste as setas X, Y e Z para movê-la. Cada peça mantém sua posição na exportação.':
    'Click a piece in the workspace and drag the X, Y, and Z arrows to move it. Each piece keeps its position on export.',
  'Horizontal — eixo X': 'Horizontal — X axis',
  'Vertical — eixo Y': 'Vertical — Y axis',
  'Altura — eixo Z': 'Height — Z axis',
  'Afastar somente a cor selecionada': 'Move only the selected color',
  'Criar pinos e furos para facilitar a colagem': 'Create pins and holes to make gluing easier',
  'Modelo aberto inteiro. Escolha o tipo de corte e clique em Aplicar corte.':
    'Whole model opened. Choose a cut type and click Apply cut.',
  'Exemplo aberto inteiro. Use Aplicar corte para separar.':
    'Whole example opened. Use Apply cut to separate it.',
  'Escolha uma vista, desenhe quantas linhas precisar e clique em Aplicar corte.':
    'Choose a view, draw as many lines as needed, and click Apply cut.',
  'Desenhe quantas linhas precisar e clique em Aplicar corte.':
    'Draw as many lines as needed, then click Apply cut.',
  'Parar desenho': 'Stop drawing',
  'Aplicando corte…': 'Applying cuts…',
  'Desenhe a linha de corte primeiro.': 'Draw the cut line first.',
  'Baixar mesa com extrusores virtuais': 'Download table with virtual extruders',
  'Mesa desbloqueada · Arraste o fundo para girar · Role para ampliar':
    'Table unlocked · Drag the background to orbit · Scroll to zoom',
  'Mesa bloqueada': 'Table locked',
  'Ajuste as cores numeradas aos filamentos da impressora, na ordem das posições. Clique nas amostras para editar. As receitas de mistura são estimativas editáveis no fatiador. A visualização mostra as cores desejadas. Selecione uma impressora com o mesmo número de filamentos ao abrir o projeto.':
    'Match the numbered colors to your printer filaments in slot order. Click the swatches to edit them. Mixing recipes are estimates you can edit in the slicer. The preview shows the desired colors. Select a printer with the same filament count when opening the project.',
  'Selecione pelo menos uma peça.': 'Select at least one piece.',
  'Informe um eixo e um ângulo válidos.': 'Enter a valid axis and angle.',
  'Desenhe pelo menos uma linha de corte.': 'Draw at least one cut line.',
  'Plano de corte inválido.': 'Invalid cut plane.',
  'As linhas precisam atravessar o interior da peça selecionada.':
    'The lines must pass through the interior of the selected piece.',
  'Nenhum corte deste lote foi aplicado.': 'No cuts in this batch were applied.',
  'As peças selecionadas já têm uma única cor.': 'The selected pieces already have a single color.',
  'Posição inválida para uma peça da mesa.': 'Invalid position for a table piece.',
  'Para criar junções por cor, a peça precisa ser uma malha fechada.':
    'Color joints require a closed mesh.',
  'Esta geometria não permite junções por cor automáticas. Divida-a primeiro com cortes por linha em partes mais simples.':
    'This geometry does not support automatic color joints. First divide it into simpler parts using line cuts.',
  'Não foi possível fechar os volumes de cor para criar junções. A peça original foi mantida.':
    'The color volumes could not be closed to create joints. The original piece was kept.',
  'Falha na validação dos volumes de cor.': 'Color volume validation failed.',
  'Não foi possível criar uma junção fechada. A peça original foi mantida.':
    'A closed joint could not be created. The original piece was kept.',
  'Sem espaço seguro para junções neste corte (mínimo: pino de 1,2 mm e parede de 0,8 mm). Mova a linha ou desmarque as junções.':
    'There is not enough safe space for joints in this cut (minimum: 1.2 mm pin and 0.8 mm wall). Move the line or disable joints.',
  'A opção de junções cria pinos e furos para colagem quando a geometria permitir.':
    'The joint option creates pins and holes for gluing when the geometry allows it.',
};
