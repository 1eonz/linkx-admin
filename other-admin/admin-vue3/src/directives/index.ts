import type { App } from 'vue';

import loadmore from './loadmore';
import waves from './waves';
import { authDirective, hasPermDirective, hasTextPermDirective } from '@/composables/usePermission';

export function setupDirectives(app: App): void {
  app.directive('loadmore', loadmore);
  app.directive('waves', waves);
  app.directive('has-perm', hasPermDirective);
  app.directive('has-text-perm', hasTextPermDirective);
  app.directive('auth', authDirective);
}
