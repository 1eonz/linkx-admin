import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Plugin } from 'vite';

import { getPreviewData, previewThirdApps } from './preview-data';
import { previewMenu, previewMenuPermissions } from './preview-menu';

interface PreviewGroupTag {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const initialTags: PreviewGroupTag[] = [
  { id: 'preview-001', name: '值班通知', icon: 'fas fa-bell', color: '#409eff' },
  { id: 'preview-002', name: '巡逻动态', icon: 'fas fa-map-marker-alt', color: '#67c23a' },
  { id: 'preview-003', name: '协同处置', icon: 'fas fa-users', color: '#e6a23c' },
  { id: 'preview-004', name: '会议安排', icon: 'fas fa-calendar', color: '#909399' },
  { id: 'preview-005', name: '系统公告', icon: 'fas fa-bullhorn', color: '#f56c6c' },
];

const previewImages: Record<string, string> = {
  '/mock/images/duty-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="320" viewBox="0 0 680 320">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9efff"/><stop offset="1" stop-color="#f4fbff"/></linearGradient></defs>
    <rect width="680" height="320" rx="16" fill="url(#sky)"/><circle cx="560" cy="72" r="34" fill="#f4c96b" opacity=".92"/>
    <path d="M0 228 86 178l64 34 90-88 78 54 80-71 101 71 66-36 115 78v100H0Z" fill="#a8d7df"/>
    <path d="M0 253 112 208l86 39 88-61 78 43 99-72 87 63 61-28 69 37v91H0Z" fill="#75b9b4"/>
    <path d="M0 272h680v48H0Z" fill="#4d9b91"/><path d="M392 271v-84l24-19 24 19v84m32 0v-108l29-24 29 24v108m34 0v-76l21-17 21 17v76" fill="#f4fbff" opacity=".8"/>
    <rect x="34" y="30" width="212" height="28" rx="14" fill="#ffffff" opacity=".86"/><circle cx="52" cy="44" r="5" fill="#168a7b"/>
    <text x="68" y="49" fill="#35646b" font-size="14" font-family="Microsoft YaHei,sans-serif">市局指挥中心 · 勤务安排</text>
    <text x="36" y="113" fill="#17465b" font-size="34" font-weight="700" font-family="Microsoft YaHei,sans-serif">应急值守安排</text>
    <text x="38" y="143" fill="#426c78" font-size="16" font-family="Microsoft YaHei,sans-serif">重点时段在岗信息与交接提醒</text>
    <rect x="38" y="166" width="106" height="34" rx="17" fill="#167f83"/><text x="57" y="189" fill="#ffffff" font-size="14" font-family="Microsoft YaHei,sans-serif">今日值守</text>
  </svg>`,
  '/mock/images/patrol-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="320" viewBox="0 0 680 320">
    <defs><linearGradient id="field" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7f4ec"/><stop offset="1" stop-color="#d7eee4"/></linearGradient></defs>
    <rect width="680" height="320" rx="16" fill="url(#field)"/><path d="M0 230 90 204l78 23 77-86 72 50 95-70 76 48 88-67 104 69v149H0Z" fill="#acd4bd"/>
    <path d="M0 270 118 228l90 29 85-50 79 39 87-61 80 54 67-31 74 28v64H0Z" fill="#75b795"/>
    <path d="M390 270c18-61 56-89 100-75 31 10 42 34 62 21 21-14 25-42 55-46" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-dasharray="4 15"/>
    <circle cx="392" cy="269" r="10" fill="#d05a49" stroke="#ffffff" stroke-width="5"/><circle cx="608" cy="170" r="10" fill="#d05a49" stroke="#ffffff" stroke-width="5"/>
    <path d="M501 132c-18 0-32 14-32 31 0 25 32 56 32 56s32-31 32-56c0-17-14-31-32-31Zm0 42a11 11 0 1 1 0-22 11 11 0 0 1 0 22Z" fill="#167f68"/>
    <rect x="34" y="30" width="204" height="28" rx="14" fill="#ffffff" opacity=".88"/><circle cx="52" cy="44" r="5" fill="#167f68"/>
    <text x="68" y="49" fill="#35645a" font-size="14" font-family="Microsoft YaHei,sans-serif">巡防动态 · 实时路线</text>
    <text x="36" y="113" fill="#174c3e" font-size="34" font-weight="700" font-family="Microsoft YaHei,sans-serif">平安巡防提示</text>
    <text x="38" y="143" fill="#426e61" font-size="16" font-family="Microsoft YaHei,sans-serif">重点区域巡查与联动任务</text>
    <rect x="38" y="166" width="106" height="34" rx="17" fill="#167f68"/><text x="57" y="189" fill="#ffffff" font-size="14" font-family="Microsoft YaHei,sans-serif">路线巡查</text>
  </svg>`,
};

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of request) raw += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  if (!raw) return undefined;
  return JSON.parse(raw) as unknown;
}

function isTagInput(value: unknown): value is Omit<PreviewGroupTag, 'id'> {
  if (!value || typeof value !== 'object') return false;
  const input = value as Record<string, unknown>;
  return typeof input.name === 'string' && typeof input.icon === 'string' && typeof input.color === 'string';
}

function isIdList(value: unknown): value is Array<string | number> {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' || typeof id === 'number');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isThirdAppInput(input: Record<string, unknown>): boolean {
  const name = input.systemName ?? input.clientName;
  return (
    typeof name === 'string' &&
    typeof input.clientId === 'string' &&
    typeof input.clientSecret === 'string' &&
    (typeof input.tokenTime === 'number' || typeof input.tokenTime === 'string') &&
    (typeof input.refreshTokenTime === 'number' || typeof input.refreshTokenTime === 'string') &&
    typeof input.status === 'number'
  );
}

/** 为本地页面预览提供内存数据；未知接口返回 501，绝不会转发到后端。 */
export function mockPreviewPlugin(): Plugin {
  const tags = initialTags.map((tag) => ({ ...tag }));
  let nextId = 6;
  let nextThirdAppId = previewThirdApps.length + 1;

  return {
    name: 'linkx-mock-preview',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'head-prepend',
            children: `
              if (window.location.pathname === '/login') {
                ['vue_admin_template_token', 'is_admin', 'back_user_id', 'back_username'].forEach((key) => {
                  localStorage.removeItem(key);
                });
              } else {
                localStorage.setItem('vue_admin_template_token', 'linkx-local-mock-token');
                localStorage.setItem('is_admin', 'true');
                localStorage.setItem('back_user_id', '1');
                localStorage.setItem('back_username', 'Mock预览管理员');
              }
            `,
          },
        ],
      };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url;
        if (!requestUrl?.startsWith('/linkx/admin')) return next();

        void (async () => {
          const url = new URL(requestUrl, 'http://localhost');
          const path = url.pathname.replace(/^\/linkx\/admin/, '') || '/';
          const method = request.method ?? 'GET';
          const image = previewImages[path];
          if (method === 'GET' && image) {
            response.statusCode = 200;
            response.setHeader('content-type', 'image/svg+xml; charset=utf-8');
            response.setHeader('cache-control', 'no-store');
            response.setHeader('x-content-type-options', 'nosniff');
            response.end(image);
            return;
          }
          const requestBody = request.headers['content-type']?.includes('application/json')
            ? await readJson(request)
            : undefined;
          const ok = (data: unknown = null) => ({ code: 0, msg: '操作成功', data });
          const normalizedPath = decodeURIComponent(path);

          if (path.endsWith('/oauth/v2/login') && method === 'POST') {
            const username =
              requestBody && typeof requestBody === 'object' && 'username' in requestBody
                ? String(requestBody.username)
                : '本地预览';
            sendJson(
              response,
              200,
              ok({
                accessToken: 'linkx-local-mock-token',
                userName: username,
                userId: '1',
                idCardNum: '',
                isAdmin: true,
              }),
            );
            return;
          }
          if (path.endsWith('/oauth/v2/permissions')) {
            sendJson(response, 200, ok({ type: 1, menus: previewMenuPermissions, actions: [] }));
            return;
          }
          if (path === '/api/menu/list') {
            sendJson(response, 200, ok(previewMenu));
            return;
          }
          if (path === '/api/globals/list') {
            const mock = getPreviewData(method, path, url, requestBody);
            sendJson(response, 200, ok(mock.data));
            return;
          }
          if (path === '/base/v1/globals/getGlobalsList') {
            const mock = getPreviewData(method, path, url, requestBody);
            sendJson(response, 200, ok(mock.data));
            return;
          }
          if (path === '/api/msip/license/info') {
            sendJson(
              response,
              200,
              ok({
                status: 1,
                LINKXBS: '1',
                LINKXGCF: '1',
                LINKXTCF: '1',
                LINKXBCF: '1',
                LINKXACF: '1',
                LINKXNDI: '1',
              }),
            );
            return;
          }
          if (path === '/collaboration/v1/base/version') {
            sendJson(
              response,
              200,
              ok({
                jx: { serviceVersion: '本地 Mock' },
                eagent: { serviceVersion: '本地 Mock' },
                linkx: { serviceVersion: '本地 Mock' },
              }),
            );
            return;
          }
          if (path === '/auth/v1/user/adminuser/bind/im-user' && method === 'GET') {
            sendJson(response, 200, ok(null));
            return;
          }
          if (path.endsWith('/oauth/v2/keepalive') || path.endsWith('/oauth/v2/logout')) {
            sendJson(response, 200, ok());
            return;
          }
          if (path === '/collaboration/v1/tags/page' && method === 'GET') {
            const name = url.searchParams.get('name')?.trim() ?? '';
            const pageNum = Math.max(1, Number(url.searchParams.get('pageNum')) || 1);
            const pageSize = Math.max(1, Number(url.searchParams.get('pageSize')) || 10);
            const filtered = tags.filter((tag) => tag.name.includes(name));
            const start = (pageNum - 1) * pageSize;
            sendJson(response, 200, ok({ records: filtered.slice(start, start + pageSize), total: filtered.length }));
            return;
          }
          if (path === '/collaboration/v1/tags' && method === 'POST') {
            if (!isTagInput(requestBody)) {
              sendJson(response, 400, { code: 400, msg: '标签数据格式错误', data: null });
              return;
            }
            tags.push({ id: `preview-${String(nextId++).padStart(3, '0')}`, ...requestBody });
            sendJson(response, 200, ok());
            return;
          }
          if (
            (normalizedPath === '/collaboration/v1/client/create ' ||
              normalizedPath === '/collaboration/v1/client/create') &&
            method === 'POST'
          ) {
            const input = asRecord(requestBody);
            if (!isThirdAppInput(input)) {
              sendJson(response, 400, { code: 400, msg: '应用数据格式错误', data: null });
              return;
            }
            const name = String(input.systemName ?? input.clientName);
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const id = `preview-client-${String(nextThirdAppId++).padStart(3, '0')}`;
            previewThirdApps.push({
              id,
              clientName: name,
              systemName: name,
              clientId: String(input.clientId),
              clientSecret: String(input.clientSecret),
              clientType: String(input.clientType ?? ''),
              tokenTime: Number(input.tokenTime),
              refreshTokenTime: Number(input.refreshTokenTime),
              status: Number(input.status),
              expired: String(input.expired ?? ''),
              remark: String(input.remark ?? ''),
              grantTime: now,
              grantUserName: 'Mock管理员',
              gmtCreated: now,
              gmtModified: now,
            });
            sendJson(response, 200, ok(id));
            return;
          }
          if (path === '/collaboration/v1/client/update' && method === 'PUT') {
            const input = asRecord(requestBody);
            if (!isThirdAppInput(input) || typeof input.id !== 'string') {
              sendJson(response, 400, { code: 400, msg: '应用数据格式错误', data: null });
              return;
            }
            const index = previewThirdApps.findIndex((item) => item.id === input.id);
            if (index < 0) {
              sendJson(response, 404, { code: 404, msg: '应用不存在', data: null });
              return;
            }
            const name = String(input.systemName ?? input.clientName);
            previewThirdApps[index] = {
              ...previewThirdApps[index],
              ...input,
              id: input.id,
              clientName: name,
              systemName: name,
              clientId: String(input.clientId),
              clientSecret: String(input.clientSecret),
              clientType: String(input.clientType ?? ''),
              tokenTime: Number(input.tokenTime),
              refreshTokenTime: Number(input.refreshTokenTime),
              status: Number(input.status),
              expired: String(input.expired ?? ''),
              remark: String(input.remark ?? ''),
              gmtModified: new Date().toISOString().slice(0, 19).replace('T', ' '),
            };
            sendJson(response, 200, ok());
            return;
          }
          if (path === '/collaboration/v1/client/delete' && method === 'DELETE') {
            const id = url.searchParams.get('id');
            const index = previewThirdApps.findIndex((item) => item.id === id);
            if (index >= 0) previewThirdApps.splice(index, 1);
            sendJson(response, 200, ok());
            return;
          }
          if (path === '/collaboration/v1/client/detail' && method === 'GET') {
            const id = url.searchParams.get('id');
            const item = previewThirdApps.find((entry) => entry.id === id);
            if (!item) sendJson(response, 404, { code: 404, msg: '应用不存在', data: null });
            else sendJson(response, 200, ok(item));
            return;
          }
          if (path === '/collaboration/v1/tags/delete/list' && method === 'DELETE') {
            const ids = requestBody;
            if (!isIdList(ids)) {
              sendJson(response, 400, { code: 400, msg: '标签 ID 列表格式错误', data: null });
              return;
            }
            const idSet = new Set(ids.map(String));
            for (let index = tags.length - 1; index >= 0; index -= 1) {
              if (idSet.has(tags[index].id)) tags.splice(index, 1);
            }
            sendJson(response, 200, ok());
            return;
          }

          const detailMatch = path.match(/^\/collaboration\/v1\/tags\/([^/]+)$/);
          if (detailMatch) {
            const id = decodeURIComponent(detailMatch[1]);
            const index = tags.findIndex((tag) => tag.id === id);
            if (method === 'GET') {
              if (index < 0) sendJson(response, 404, { code: 404, msg: '标签不存在', data: null });
              else sendJson(response, 200, ok(tags[index]));
              return;
            }
            if (method === 'PUT') {
              if (index < 0 || !isTagInput(requestBody)) {
                sendJson(response, index < 0 ? 404 : 400, {
                  code: index < 0 ? 404 : 400,
                  msg: '标签无法更新',
                  data: null,
                });
                return;
              }
              tags[index] = { id, ...requestBody };
              sendJson(response, 200, ok());
              return;
            }
            if (method === 'DELETE') {
              if (index >= 0) tags.splice(index, 1);
              sendJson(response, 200, ok());
              return;
            }
          }

          const previewData = getPreviewData(method, path, url, requestBody);
          if (previewData.handled) {
            sendJson(response, 200, ok(previewData.data));
            return;
          }

          sendJson(response, 501, {
            code: 501,
            msg: `本地 Mock 未配置接口：${method} ${path}`,
            data: null,
          });
        })().catch((error: unknown) => {
          sendJson(response, 400, {
            code: 400,
            msg: error instanceof Error ? error.message : '本地 Mock 请求解析失败',
            data: null,
          });
        });
      });
    },
  };
}
