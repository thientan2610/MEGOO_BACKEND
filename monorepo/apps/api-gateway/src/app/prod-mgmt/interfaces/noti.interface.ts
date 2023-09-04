export interface INoti {
  type: 'outOfStock' | 'runningOutOfStock' | 'expiringSoon' | 'expired';
  itemId: string;
  groupId: string;
}
