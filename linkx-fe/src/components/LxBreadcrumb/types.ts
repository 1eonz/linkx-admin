export interface LxBreadcrumbItem {
  title: string;
  to?: string;
}

export interface LxBreadcrumbProps {
  items?: LxBreadcrumbItem[];
  separator?: string;
}
