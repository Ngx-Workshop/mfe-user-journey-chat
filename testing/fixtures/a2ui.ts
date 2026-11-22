import type { A2uiSurfaceDto } from '../../src/app/features/chat/models/chat.models';
export const plan = {
  version: '1.0',
  surfaceId: '46de1790-cb2e-4123-afe1-9d1495dc4795',
  revision: 0,
  fallback: 'Learn dependency injection',
  actions: [
    {
      id: 'action0',
      type: 'prompt',
      label: 'Help with this step',
      prompt: 'Explain Angular providers',
    },
    {
      id: 'save_progress',
      type: 'progress',
      label: 'Save checklist',
      fields: ['step_0'],
    },
  ],
  messages: [
    {
      version: '1.0',
      createSurface: {
        surfaceId: '46de1790-cb2e-4123-afe1-9d1495dc4795',
        catalogId:
          'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['n0', 'n1', 'n3', 'n5', 'n6'],
          },
          {
            id: 'n0',
            component: 'Text',
            text: 'Learn dependency injection',
          },
          {
            id: 'n1',
            component: 'CheckBox',
            label: 'Understand providers',
            value: {
              '@path': '/step_0',
            },
          },
          {
            id: 'n2',
            component: 'Text',
            text: 'Help with this step',
          },
          {
            id: 'n3',
            component: 'Button',
            child: 'n2',
            variant: 'primary',
            action: {
              event: {
                name: 'action0',
                context: {},
              },
            },
          },
          {
            id: 'n4',
            component: 'Text',
            text: 'Save checklist',
          },
          {
            id: 'n5',
            component: 'Button',
            child: 'n4',
            variant: 'primary',
            action: {
              event: {
                name: 'save_progress',
                context: {
                  step_0: {
                    '@path': '/step_0',
                  },
                },
              },
            },
          },
          {
            id: 'n6',
            component: 'Text',
            text: {
              '@path': '/feedback',
            },
          },
        ],
        dataModel: {
          step_0: false,
          feedback:
            'Check off steps as you go, then save your checklist.',
        },
      },
    },
  ],
} satisfies A2uiSurfaceDto;
export const quiz = {
  version: '1.0',
  surfaceId: '3a7e05d8-26f7-48f9-8a25-4ae15f94782b',
  revision: 0,
  fallback: 'DI practice',
  actions: [
    {
      id: 'check_answer',
      type: 'quiz',
      label: 'Check answer',
      answer: '0',
      explanation: 'Angular injects services.',
      fields: ['0', '1'],
    },
  ],
  messages: [
    {
      version: '1.0',
      createSurface: {
        surfaceId: '3a7e05d8-26f7-48f9-8a25-4ae15f94782b',
        catalogId:
          'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['n0', 'n1', 'n2', 'n4', 'n5'],
          },
          {
            id: 'n0',
            component: 'Text',
            text: 'DI practice',
          },
          {
            id: 'n1',
            component: 'Text',
            text: 'What does Angular inject?',
          },
          {
            id: 'n2',
            component: 'ChoicePicker',
            label: 'Your answer',
            options: [
              {
                label: 'Services',
                value: '0',
              },
              {
                label: 'CSS',
                value: '1',
              },
            ],
            value: {
              '@path': '/selection',
            },
            variant: 'mutuallyExclusive',
          },
          {
            id: 'n3',
            component: 'Text',
            text: 'Check answer',
          },
          {
            id: 'n4',
            component: 'Button',
            child: 'n3',
            variant: 'primary',
            action: {
              event: {
                name: 'check_answer',
                context: {
                  selection: {
                    '@path': '/selection',
                  },
                },
              },
            },
          },
          {
            id: 'n5',
            component: 'Text',
            text: {
              '@path': '/feedback',
            },
          },
        ],
        dataModel: {
          selection: [],
          feedback:
            'Choose an answer, then check your understanding.',
        },
      },
    },
  ],
} satisfies A2uiSurfaceDto;
export const cards = {
  version: '1.0',
  surfaceId: '143b501d-2ad6-4c6f-9a2b-207b8484f534',
  revision: 0,
  fallback: 'Angular workshops',
  actions: [
    {
      id: 'open_6acaffbb4d4ddb09fe84ff6d',
      type: 'navigate',
      label: 'Open workshop',
      path: '/workshops/overview?workshop=6acaffbb4d4ddb09fe84ff6d',
    },
  ],
  messages: [
    {
      version: '1.0',
      createSurface: {
        surfaceId: '143b501d-2ad6-4c6f-9a2b-207b8484f534',
        catalogId:
          'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['n0', 'n6'],
          },
          {
            id: 'n0',
            component: 'Text',
            text: 'Angular workshops',
          },
          {
            id: 'n1',
            component: 'Text',
            text: 'Angular basics',
          },
          {
            id: 'n2',
            component: 'Text',
            text: 'Learn Angular',
          },
          {
            id: 'n3',
            component: 'Text',
            text: 'Open workshop',
          },
          {
            id: 'n4',
            component: 'Button',
            child: 'n3',
            variant: 'primary',
            action: {
              event: {
                name: 'open_6acaffbb4d4ddb09fe84ff6d',
                context: {},
              },
            },
          },
          {
            id: 'n5',
            component: 'Column',
            children: ['n1', 'n2', 'n4'],
          },
          {
            id: 'n6',
            component: 'Card',
            child: 'n5',
          },
        ],
        dataModel: {},
      },
    },
  ],
} satisfies A2uiSurfaceDto;
