import { validateLearningSurface } from '../../../../../src/app/features/chat/utils/a2ui-validation';
import { plan, quiz, cards } from '../../../../fixtures/a2ui';
describe('Learning surface trust boundary', () => {
  it('accepts service-built plans, quizzes and catalog cards', () => {
    for (const ui of [plan, quiz, cards])
      expect(() => validateLearningSurface(ui)).not.toThrow();
  });
  it('rejects external navigation, components and functions', () => {
    const ui = structuredClone(cards);
    ui.actions[0].path = 'https://outside.example';
    expect(() => validateLearningSurface(ui)).toThrow();
    const unsafe = structuredClone(plan);
    const create = unsafe.messages[0]['createSurface'] as {
      components: Record<string, unknown>[];
    };
    create.components[1]['component'] = 'WebView';
    expect(() => validateLearningSurface(unsafe)).toThrow();
    create.components[1]['component'] = 'Text';
    create.components[1]['text'] = { '@function': 'openUrl' };
    expect(() => validateLearningSurface(unsafe)).toThrow();
  });
  it('rejects cyclic or oversized component trees', () => {
    const ui = structuredClone(plan);
    const create = ui.messages[0]['createSurface'] as {
      components: Record<string, unknown>[];
    };
    create.components[0]['children'] = ['root'];
    expect(() => validateLearningSurface(ui)).toThrow();
    expect(() =>
      validateLearningSurface({ ...plan, revision: -1 })
    ).toThrow();
  });
});
