import type { A2uiSurfaceDto } from '../models/chat.models';
export const LEARNING_CATALOG =
  'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';
export const LEARNING_COMPONENTS = [
  'Column',
  'Text',
  'Card',
  'Button',
  'CheckBox',
  'ChoicePicker',
  'Divider',
];
const keys: Record<string, string[]> = {
  Column: ['id', 'component', 'children'],
  Text: ['id', 'component', 'text'],
  Card: ['id', 'component', 'child'],
  Button: ['id', 'component', 'child', 'variant', 'action'],
  CheckBox: ['id', 'component', 'label', 'value'],
  ChoicePicker: [
    'id',
    'component',
    'label',
    'options',
    'value',
    'variant',
  ],
  Divider: ['id', 'component'],
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid interactive content');
  return value as Record<string, unknown>;
}
function dynamic(value: unknown) {
  if (typeof value === 'string' && value.length <= 6000) return;
  if (typeof value === 'boolean') return;
  const ref = record(value);
  if (
    Object.keys(ref).length !== 1 ||
    typeof ref['@path'] !== 'string' ||
    !/^\/(feedback|selection|step_[0-5])$/.test(ref['@path'])
  )
    throw new Error('Unsupported binding');
}
export function validateLearningSurface(ui: A2uiSurfaceDto): void {
  if (
    ui.version !== '1.0' ||
    !/^[a-f0-9-]{36}$/i.test(ui.surfaceId) ||
    !Number.isInteger(ui.revision) ||
    ui.revision < 0 ||
    JSON.stringify(ui).length > 60000 ||
    ui.messages.length !== 1 ||
    ui.actions.length > 16
  )
    throw new Error('Unsupported interactive content');
  const envelope = record(ui.messages[0]);
  const create = record(envelope['createSurface']);
  if (
    envelope['version'] !== '1.0' ||
    Object.keys(envelope).some(
      (key) => !['version', 'createSurface'].includes(key)
    ) ||
    Object.keys(create).some(
      (key) =>
        ![
          'surfaceId',
          'catalogId',
          'components',
          'dataModel',
        ].includes(key)
    ) ||
    create['surfaceId'] !== ui.surfaceId ||
    create['catalogId'] !== LEARNING_CATALOG
  )
    throw new Error('Unsupported catalog');
  const nodes = create['components'];
  if (!Array.isArray(nodes) || nodes.length > 90)
    throw new Error('Invalid component tree');
  const actionIds = new Set<string>();
  for (const action of ui.actions) {
    if (
      !/^[a-zA-Z0-9_]{1,80}$/.test(action.id) ||
      actionIds.has(action.id) ||
      !['prompt', 'navigate', 'quiz', 'progress'].includes(
        action.type
      )
    )
      throw new Error('Invalid action');
    actionIds.add(action.id);
    if (
      action.type === 'navigate' &&
      !/^\/workshops\/overview\?workshop=[a-f0-9]{24}$/i.test(
        action.path || ''
      )
    )
      throw new Error('Unsafe navigation');
    if (
      action.type === 'prompt' &&
      (!action.prompt || action.prompt.length > 1000)
    )
      throw new Error('Invalid follow-up');
  }
  const graph = new Map<string, string[]>();
  for (const value of nodes) {
    const node = record(value);
    const name = node['component'];
    const id = node['id'];
    if (
      typeof name !== 'string' ||
      !keys[name] ||
      typeof id !== 'string' ||
      !/^(root|n\d{1,2})$/.test(id) ||
      graph.has(id) ||
      Object.keys(node).some((key) => !keys[name].includes(key))
    )
      throw new Error('Unsupported component');
    for (const key of ['text', 'label', 'value'])
      if (key in node) dynamic(node[key]);
    let refs: string[] = [];
    if (name === 'Column') {
      if (
        !Array.isArray(node['children']) ||
        !node['children'].every((child) => typeof child === 'string')
      )
        throw new Error('Invalid children');
      refs = node['children'];
    }
    if (name === 'Card' || name === 'Button') {
      if (typeof node['child'] !== 'string')
        throw new Error('Invalid child');
      refs = [node['child']];
    }
    if (name === 'Button') {
      const action = record(node['action']);
      const event = record(action['event']);
      if (
        Object.keys(action).length !== 1 ||
        typeof event['name'] !== 'string' ||
        !actionIds.has(event['name']) ||
        Object.keys(event).some(
          (key) => !['name', 'context'].includes(key)
        )
      )
        throw new Error('Unsupported action');
      for (const [key, binding] of Object.entries(
        record(event['context'])
      )) {
        if (!/^(selection|step_[0-5])$/.test(key))
          throw new Error('Invalid action input');
        dynamic(binding);
      }
    }
    if (name === 'ChoicePicker') {
      const options = node['options'];
      if (
        !Array.isArray(options) ||
        options.length < 2 ||
        options.length > 5
      )
        throw new Error('Invalid choices');
      options.forEach((option) => {
        const row = record(option);
        if (
          typeof row['label'] !== 'string' ||
          row['label'].length > 500 ||
          !/^[0-4]$/.test(String(row['value']))
        )
          throw new Error('Invalid choice');
      });
    }
    graph.set(id, refs);
  }
  const data = record(create['dataModel']);
  for (const [key, value] of Object.entries(data)) {
    if (key === 'feedback') {
      if (typeof value !== 'string' || value.length > 6000)
        throw new Error('Invalid feedback');
    } else if (key === 'selection') {
      if (
        !Array.isArray(value) ||
        value.length > 1 ||
        value.some(
          (item) => typeof item !== 'string' || !/^[0-4]$/.test(item)
        )
      )
        throw new Error('Invalid selection');
    } else if (
      !/^step_[0-5]$/.test(key) ||
      typeof value !== 'boolean'
    )
      throw new Error('Invalid interactive state');
  }
  const visited = new Set<string>();
  function visit(id: string, path: Set<string>) {
    if (path.has(id) || path.size > 12 || !graph.has(id))
      throw new Error('Invalid component graph');
    if (visited.has(id)) return;
    visited.add(id);
    const next = new Set(path);
    next.add(id);
    graph.get(id)!.forEach((child) => visit(child, next));
  }
  visit('root', new Set());
  if (visited.size !== graph.size)
    throw new Error('Unreachable components');
}
