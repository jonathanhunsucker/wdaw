export function buildCellStyles(base) {
  const styles = {};

  styles.cellStyles = Object.assign(base, {borderStyle: 'ridge'});
  styles.currentBeatStyles = Object.assign({}, styles.cellStyles, {backgroundColor: 'lightgrey'});
  styles.rightAlignStyles = Object.assign({}, styles.cellStyles, {textAlign: 'right'});

  return styles;
};
