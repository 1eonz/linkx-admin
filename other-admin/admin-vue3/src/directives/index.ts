import type { App } from 'vue';

import loadmore from './loadmore';
import waves from './waves';

export function setupDirectives(app: App): void {
  app.directive('loadmore', loadmore);
  app.directive('waves', waves);
}
