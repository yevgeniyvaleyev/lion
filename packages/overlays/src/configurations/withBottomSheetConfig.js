export const withBottomSheetConfig = () => ({
  hasBackdrop: true,
  preventsScroll: true,
  trapsKeyboardFocus: true,
  hidesOnEsc: true,
  hidesOnOutsideEsc: true,
  placementMode: 'global',
  viewportConfig: {
    placement: 'bottom',
  },
  handlesAccessibility: true,
});
