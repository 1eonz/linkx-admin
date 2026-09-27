export interface LxTabItem {
  key: string;
  title: string;
  closable?: boolean;
}

export interface LxTabsBarProps {
  tabs?: LxTabItem[];
  modelValue?: string;
}
