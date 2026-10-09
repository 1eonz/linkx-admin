import { expect, test } from '@playwright/test';

test.describe('lx-ui LxVirtualTree 文档示例', () => {
  test('文档站 favicon 使用可加载的 SVG 资源', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');

    const icon = page.locator('link[rel="icon"]');
    await expect(icon).toHaveAttribute('type', 'image/svg+xml');
    await expect(icon).toHaveAttribute('href', '/favicon.svg');

    const iconUrl = new URL((await icon.getAttribute('href'))!, page.url());
    const response = await page.request.get(iconUrl.toString());
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  });

  test('选择规则和外观主题使用独立的演示分组', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    await expect(page.getByRole('group', { name: '选择方式' })).toContainText('父子独立勾选');
    await expect(page.getByRole('group', { name: '外观主题' })).toContainText('HUD 深色主题');
    await expect(page.getByRole('group', { name: '选择方式' })).not.toContainText('HUD 深色主题');
  });

  test('HUD 主题只作用于树预览，次级说明文字保持可读对比度', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();

    const demo = page.locator('.virtual-tree-demo');
    const preview = page.locator('.virtual-tree-demo__preview');
    await expect(preview).toHaveClass(/lx-theme-hud/);
    await expect(preview).toHaveCSS('background-color', 'rgb(11, 18, 32)');
    await expect(demo).not.toHaveClass(/lx-theme-hud/);
    const note = page.locator('.virtual-tree-demo__note');
    const contrast = await note.evaluate((element) => {
      const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (color: string) => {
        const values = channels(color).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * (values[0] ?? 0) + 0.7152 * (values[1] ?? 0) + 0.0722 * (values[2] ?? 0);
      };
      let ancestor = element.parentElement;
      let backgroundColor = 'rgb(255, 255, 255)';
      while (ancestor) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const values = candidate.match(/[\d.]+/g)?.map(Number) ?? [];
        if ((values[3] ?? 1) > 0) {
          backgroundColor = candidate;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      const foreground = luminance(getComputedStyle(element).color);
      const background = luminance(backgroundColor);
      const values = [foreground, background].sort((left, right) => right - left);

      return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
    });

    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('文档站暗色主题下筛选和树画布跟随深色表面', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');
    await page.locator('.VPNavBarAppearance button').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const expectedSurface = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--vp-c-bg-alt)';
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    const expectedSelectedSurface = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--vp-c-brand-soft)';
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });

    await expect(page.locator('.lx-virtual-tree__filter')).toHaveCSS('background-color', expectedSurface);
    await expect(page.locator('.lx-virtual-tree__viewport')).toHaveCSS('background-color', expectedSurface);
    await expect(page.locator('.lx-virtual-tree__row.is-checked').first()).toHaveCSS(
      'background-color',
      expectedSelectedSurface,
    );
  });

  test('树具备可访问名称并可通过方向键操作', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    const tree = page.getByRole('tree', { name: '组织结构' });
    await expect(tree).toBeVisible();
    const firstRow = tree.getByRole('treeitem').first();
    await firstRow.focus();
    await firstRow.press('ArrowRight');

    await expect(tree.getByRole('treeitem').nth(1)).toBeFocused();
  });

  test('筛选树同步展开语义、方向键和过滤后的同级位置', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');

    const tree = page.getByRole('tree', { name: '组织结构' });
    const filter = page.getByRole('textbox', { name: '过滤节点' });
    await expect(filter).toHaveAttribute('type', 'text');
    await expect(filter).toHaveAttribute('inputmode', 'search');
    await filter.fill('执勤单元 01');

    const filteredParent = tree.locator('[data-lx-tree-key="region-3"]');
    const filteredChild = tree.locator('[data-lx-tree-key="unit-3-1"]');
    await expect(page.locator('.lx-virtual-tree__filter-status')).toHaveText(
      '筛选匹配到 12 个节点；路径祖先不计入数量。',
    );
    await expect(filteredParent).toHaveAttribute('aria-expanded', 'true');
    await expect(filteredParent).toHaveAttribute('aria-posinset', '3');
    await expect(filteredParent).toHaveAttribute('aria-setsize', '12');
    await expect(filteredChild).toHaveAttribute('aria-posinset', '1');
    await expect(filteredChild).toHaveAttribute('aria-setsize', '1');

    await filteredParent.focus();
    await filteredParent.press('ArrowRight');
    await expect(filteredChild).toBeFocused();

    await filteredParent.locator('.lx-virtual-tree__toggle').click();
    await expect(filteredParent).toHaveAttribute('aria-expanded', 'false');
    await expect(filteredChild).toBeHidden();

    await filteredParent.focus();
    await filteredParent.press('ArrowRight');
    await expect(filteredParent).toHaveAttribute('aria-expanded', 'true');
    await expect(filteredChild).toBeVisible();
  });

  test('级联勾选在操作点说明范围并反馈实际选择数量', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');

    const tree = page.getByRole('tree', { name: '组织结构' });
    const parentCheckbox = tree.getByRole('checkbox', { name: '选择 辖区单位 01' });
    const scope = page.locator('.lx-virtual-tree__selection-scope');
    await expect(scope).toContainText('包括当前筛选隐藏的节点');
    await expect(parentCheckbox).toHaveAttribute('aria-description', /全部未禁用下级节点/);

    await parentCheckbox.check();
    await expect(page.getByRole('status')).toContainText('本次新增 20 项，当前共选中 21 项。');
  });

  test('375px 下树内重复操作目标至少 44px 且清除筛选可点按', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    const tree = page.getByRole('tree', { name: '组织结构' });
    const expandButton = tree.getByRole('button', { name: '收起节点' }).first();
    const checkbox = tree.getByRole('checkbox').first();
    const checkboxControl = tree.locator('.lx-virtual-tree__checkbox-control').first();
    await expect(expandButton).toHaveAttribute('tabindex', '-1');
    await expect(checkbox).toHaveAttribute('tabindex', '-1');
    const expandBox = await expandButton.boundingBox();
    const checkboxBox = await checkboxControl.boundingBox();
    const checkboxVisualBox = await checkbox.boundingBox();
    if (!expandBox || !checkboxBox || !checkboxVisualBox) {
      throw new Error('树内操作目标未进入可视区域');
    }
    expect(expandBox.width).toBeGreaterThanOrEqual(44);
    expect(expandBox.height).toBeGreaterThanOrEqual(44);
    expect(checkboxBox.width).toBeGreaterThanOrEqual(44);
    expect(checkboxBox.height).toBeGreaterThanOrEqual(44);
    expect(checkboxVisualBox.width).toBe(14);
    expect(checkboxVisualBox.height).toBe(14);

    const filter = page.getByRole('textbox', { name: '过滤节点' });
    await filter.fill('执勤单元 01');
    const clearButton = page.getByRole('button', { name: '清除过滤' });
    const clearBox = await clearButton.boundingBox();
    if (!clearBox) throw new Error('清除过滤按钮未进入可视区域');
    expect(clearBox.width).toBeGreaterThanOrEqual(44);
    expect(clearBox.height).toBeGreaterThanOrEqual(44);
    await clearButton.click();
    await expect(filter).toHaveValue('');
    await expect(filter).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('桌面复选框保持设计稿中的 14px 视觉尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    const checkbox = page.getByRole('tree', { name: '组织结构' }).getByRole('checkbox').first();
    const checkboxControl = page.locator('.lx-virtual-tree__checkbox-control').first();
    const visualBox = await checkbox.boundingBox();
    const controlBox = await checkboxControl.boundingBox();
    if (!visualBox || !controlBox) throw new Error('树复选框未进入可视区域');

    expect(visualBox.width).toBe(14);
    expect(visualBox.height).toBe(14);
    expect(controlBox.width).toBe(24);
    expect(controlBox.height).toBe(24);
  });

  test('桌面过滤清除按钮保持 24px 命中区', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    const filter = page.getByRole('textbox', { name: '过滤节点' });
    await filter.fill('执勤单元 01');
    const clearButton = page.getByRole('button', { name: '清除过滤' });
    const clearBox = await clearButton.boundingBox();
    if (!clearBox) throw new Error('桌面清除过滤按钮未进入可视区域');
    expect(clearBox.width).toBe(24);
    expect(clearBox.height).toBe(24);
  });

  test('窄屏行高与虚拟滚动同步变化并恢复当前节点焦点', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();
    await page.getByRole('button', { name: '展开全部' }).click();

    const tree = page.getByRole('tree', { name: '组织结构' });
    const viewport = tree;
    const lastRow = tree.locator('[data-lx-tree-key="unit-12-20"]');
    await expect(page.locator('.virtual-tree-demo__status')).toHaveText('已展开全部分支');
    await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(lastRow).toBeVisible();
    await expect(lastRow).toHaveCSS('height', '32px');
    await lastRow.focus();
    await expect(lastRow).toBeFocused();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(lastRow).toHaveCSS('height', '44px');
    await expect(lastRow).toBeFocused();

    const geometry = await viewport.evaluate((element) => {
      const children = Array.from(element.children) as HTMLElement[];
      const rows = Array.from(element.querySelectorAll<HTMLElement>('[role="treeitem"]'));
      const firstSpacer = children[0];
      const lastSpacer = children[children.length - 1];
      const viewportRect = element.getBoundingClientRect();
      const lastRow = element.querySelector<HTMLElement>('[data-lx-tree-key="unit-12-20"]');
      if (!firstSpacer || !lastSpacer || !lastRow) throw new Error('虚拟树窗口几何信息缺失');

      return {
        scrollTop: element.scrollTop,
        renderedRows: rows.length,
        contentHeight:
          Number.parseFloat(firstSpacer.style.height || '0') +
          rows.reduce((height, row) => height + row.getBoundingClientRect().height, 0) +
          Number.parseFloat(lastSpacer.style.height || '0'),
        lastRowContentTop:
          lastRow.getBoundingClientRect().top - viewportRect.top - element.clientTop + element.scrollTop,
        lastRowBottom: lastRow.getBoundingClientRect().bottom,
        viewportBottom: viewportRect.bottom,
      };
    });

    expect(geometry.scrollTop).toBeGreaterThan(0);
    expect(geometry.renderedRows).toBeLessThan(252);
    expect(geometry.contentHeight).toBe(252 * 44);
    expect(geometry.lastRowContentTop).toBe(251 * 44);
    expect(geometry.lastRowBottom).toBeLessThanOrEqual(geometry.viewportBottom + 1);
  });

  test('375px 和 320px 下正文与代码块不溢出，宽表由自身滚动', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxvirtualtree');
    await expect(page.locator('.virtual-tree-demo')).toBeVisible();

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      await expect(page.locator('.lx-doc-table-scroll-hint')).toBeVisible();
      const propsTable = page.locator('.vp-doc h2#props + .lx-doc-table-scroll-hint + table');
      await expect(propsTable).toHaveAttribute('tabindex', '0');
      await expect(propsTable).toHaveAttribute('aria-describedby', 'lx-doc-table-scroll-hint');
      const layout = await page.evaluate(() => {
        const article = document.querySelector<HTMLElement>('.vp-doc');
        if (!article) throw new Error('文档正文未找到');
        const articleRect = article.getBoundingClientRect();

        return {
          viewportWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          articleClientWidth: article.clientWidth,
          articleScrollWidth: article.scrollWidth,
          articleLeft: articleRect.left,
          articleRight: articleRect.right,
          codeBlocks: Array.from(article.querySelectorAll<HTMLElement>("[class*='language-']")).map((block) => {
            const rect = block.getBoundingClientRect();
            return { left: rect.left, right: rect.right };
          }),
          tables: Array.from(article.querySelectorAll<HTMLTableElement>('table')).map((table) => ({
            overflowX: getComputedStyle(table).overflowX,
            clientWidth: table.clientWidth,
            scrollWidth: table.scrollWidth,
          })),
        };
      });

      expect(layout.viewportWidth).toBe(width);
      expect(layout.documentScrollWidth).toBeLessThanOrEqual(width);
      expect(layout.articleScrollWidth).toBeLessThanOrEqual(layout.articleClientWidth);
      expect(layout.codeBlocks.length).toBeGreaterThan(0);
      for (const block of layout.codeBlocks) {
        expect(block.left).toBeGreaterThanOrEqual(layout.articleLeft - 1);
        expect(block.right).toBeLessThanOrEqual(layout.articleRight + 1);
      }
      expect(layout.tables.some((table) => table.overflowX === 'auto' && table.scrollWidth > table.clientWidth)).toBe(
        true,
      );
    }
  });

  test('叶子项与分支项按节点层级稳定缩进', async ({ page }) => {
    await page.goto('/components/lxvirtualtree');
    await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click();

    const tree = page.getByRole('tree', { name: '组织结构' });
    const parentRow = tree.getByRole('treeitem').nth(0);
    const childRow = tree.getByRole('treeitem').nth(1);
    const parentCheckbox = await parentRow.locator('input[type="checkbox"]').boundingBox();
    const childCheckbox = await childRow.locator('input[type="checkbox"]').boundingBox();
    if (!parentCheckbox || !childCheckbox) throw new Error('树节点复选框未进入可视区域');

    expect(Math.round(childCheckbox.x - parentCheckbox.x)).toBe(16);
  });
});
