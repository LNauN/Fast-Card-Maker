// 模板数据定义 - 每个模板拥有独立的图片文件夹
window.templateData = [
  {
    id: 'standard-card',
    name: '标准卡牌',
    thumbnailUrl: '/assets/images/templates/standard-card/thumbnail.png',
    width: 600,
    height: 800,
    contentLayers: {
      background: 10,
      midground: 50,
      foreground: 100
    },
    layers: [
      {
        id: 'card-bg',
        url: '/assets/images/templates/standard-card/bg.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 5
      },
      {
        id: 'card-frame',
        url: '/assets/images/templates/standard-card/frame.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 100
      }
    ],
    textAreas: [
      { 
        id: 'card-title', 
        x: 50, 
        y: 60, 
        width: 500, 
        height: 80, 
        placeholder: '卡牌名称', 
        fontSize: 36, 
        align: 'center', 
        layer: 'midground',
        hasBackground: true,
        lockPosition: 'top'
      },
      { 
        id: 'card-description', 
        x: 60, 
        y: 620, 
        width: 480, 
        height: 120, 
        placeholder: '卡牌描述文本', 
        fontSize: 18, 
        align: 'left', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'top'
      },
      { 
        id: 'card-attribute', 
        x: 60, 
        y: 760, 
        width: 500, 
        height: 30, 
        placeholder: '属性信息', 
        fontSize: 14, 
        align: 'right', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'bottom'
      }
    ],
    imageAreas: [
      { 
        id: 'main-image', 
        x: 100, 
        y: 160, 
        width: 400, 
        height: 400, 
        placeholder: '主图片',
        shape: 'rectangle', 
        layer: 'midground'
      },
      { 
        id: 'icon-image', 
        x: 480, 
        y: 70, 
        width: 60, 
        height: 60, 
        placeholder: '图标',
        shape: 'circle', 
        layer: 'foreground'
      }
    ]
  },

  {
    id: 'character-card',
    name: '角色卡牌',
    thumbnailUrl: '/assets/images/templates/character-card/thumbnail.png',
    width: 1417,
    height: 827,
    contentLayers: {
      background: 10,
      midground: 50,
      foreground: 100
    },
    layers: [
      {
        id: 'character-bg',
        url: '/assets/images/templates/character-card/bg.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 5
      },
      {
        id: 'character-frame',
        url: '/assets/images/templates/character-card/frame.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 100
      }
    ],
    textAreas: [
      { 
        id: 'character-name', 
        x: 170, 
        y: 70, 
        width: 360, 
        height: 60, 
        placeholder: '角色名称', 
        fontSize: 32, 
        align: 'left', 
        layer: 'midground',
        hasBackground: true,
        lockPosition: 'top',
        fontFamliy: 'FZKATK'
      },
      { 
        id: 'character-title', 
        x: 170, 
        y: 120, 
        width: 360, 
        height: 40, 
        placeholder: '角色称号', 
        fontSize: 18, 
        align: 'left', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'top'
      },
      { 
        id: 'character-bio', 
        x: 170, 
        y: 220, 
        width: 360, 
        height: 360, 
        placeholder: '角色介绍...', 
        fontSize: 16, 
        align: 'left', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'top',
        fontFamily: 'FZKATK',
      }
    ],
    imageAreas: [
      { 
        id: 'character-portrait', 
        x: 60, 
        y: 60, 
        width: 100, 
        height: 100, 
        placeholder: '角色头像',
        shape: 'circle', 
        layer: 'midground'
      },
      { 
        id: 'character-image', 
        x: 60, 
        y: 220, 
        width: 100, 
        height: 160, 
        placeholder: '角色全身图',
        shape: 'diamond', 
        layer: 'midground'
      }
    ]
  },

  {
    id: 'item-card',
    name: '物品卡牌',
    thumbnailUrl: '/assets/images/templates/item-card/thumbnail.png',
    width: 600,
    height: 800,
    contentLayers: {
      background: 10,
      midground: 50,
      foreground: 100
    },
    layers: [
      {
        id: 'item-bg',
        url: '/assets/images/templates/item-card/bg.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 5
      }
    ],
    textAreas: [
      { 
        id: 'item-name', 
        x: 50, 
        y: 520, 
        width: 500, 
        height: 60, 
        placeholder: '物品名称', 
        fontSize: 28, 
        align: 'center', 
        layer: 'midground',
        hasBackground: true,
        lockPosition: 'top'
      },
      { 
        id: 'item-description', 
        x: 50, 
        y: 590, 
        width: 500, 
        height: 160, 
        placeholder: '物品描述', 
        fontSize: 16, 
        align: 'left', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'top'
      },
      { 
        id: 'item-rarity', 
        x: 50, 
        y: 760, 
        width: 500, 
        height: 30, 
        placeholder: '稀有度: 普通', 
        fontSize: 14, 
        align: 'right', 
        layer: 'midground',
        hasBackground: false,
        lockPosition: 'bottom'
      }
    ],
    imageAreas: [
      { 
        id: 'item-image', 
        x: 150, 
        y: 150, 
        width: 300, 
        height: 300, 
        placeholder: '物品图片',
        shape: 'trapezoid',
        trapezoidParams: { topWidth: 240 },
        layer: 'midground'
      }
    ]
  },

  // 角色技能卡牌模板
  {
    id: 'character-skill-card',
    name: '角色技能卡牌',
    thumbnailUrl: '/assets/images/templates/character-skill-card/thumbnail.png',
    width: 600,
    height: 800,
    contentLayers: {
      background: 10,
      midground: 50,
      foreground: 100
    },
    layers: [
      {
        id: 'skill-bg',
        url: '/assets/images/templates/character-skill-card/bg.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 5
      },
      {
        id: 'skill-frame',
        url: '/assets/images/templates/character-skill-card/frame.png',
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        zIndex: 100
      }
    ],
    textAreas: [
      {
        id: 'character-name',
        placeholder: '角色名称',
        x: 150,
        y: 60,
        width: 300,
        height: 40,
        fontSize: 24,
        align: 'center',
        hasBackground: false,
        layer: 'midground'
      },
      {
        id: 'character-title',
        placeholder: '角色称号',
        x: 150,
        y: 100,
        width: 300,
        height: 30,
        fontSize: 16,
        align: 'center',
        hasBackground: false,
        layer: 'midground'
      }
    ],
    verticalGroups: [
      {
        id: 'skills-area',
        x: 60,
        y: 200,
        width: 480,
        spacing: 15,
        layer: 'midground',
        items: [
          {
            id: 'skill-1',
            title: '技能一',
            titleWidth: 100,
            contentPlaceholder: '请输入技能一描述...',
            fontSize: 16,
            titleFontSize: 18,
            titleFontWeight: 'bold',
            fontFamily: 'FZKATK',
            textColor: '#ff0000ff',
            hasBackground: true,
            bgColor: 'rgba(255, 255, 255, 0.7)',
            titleLayer: {
              x: 10,
              y: 5,
              text: 'abc',
              fontFamily: 'FZKATK', // 字体家族
              fontSize: 20,         // 字体大小（覆盖默认）
              fontWeight: 'bold',   // 字重
              textColor: '#5900ffff',     // 文字颜色
              bgUrl: '/assets/images/templates/character-skill-card/title-bg-1.png',
              bgColor: 'rgba(255, 183, 77, 0.8)',
              zIndex: 60
            },
            padding: {
              top: 8,
              right: 12,
              bottom: 8,
              left: 12
            }
          },
          {
            id: 'skill-2',
            title: '技能二',
            titleWidth: 100,
            contentPlaceholder: '请输入技能二描述...',
            fontSize: 16,
            titleFontSize: 18,
            titleFontWeight: 'bold',
            hasBackground: true,
            bgColor: 'rgba(255, 255, 255, 0.7)',
            titleLayer: {
              text: '技能二',
              fontFamily: 'FZKATK',
              fontSize: 20,
              fontWeight: 'bold',
              bgUrl: '/assets/images/templates/character-skill-card/title-bg-2.png',
              bgColor: 'rgba(76, 175, 80, 0.8)',
              zIndex: 60
            },
            padding: {
              top: 8,
              right: 12,
              bottom: 8,
              left: 12
            }
          },
          {
            id: 'skill-3',
            title: '技能三',
            titleWidth: 100,
            contentPlaceholder: '请输入技能三描述...',
            fontSize: 16,
            titleFontSize: 18,
            titleFontWeight: 'bold',
            hasBackground: true,
            bgColor: 'rgba(255, 255, 255, 0.7)',
            titleLayer: {
              text: '技能三',
              bgUrl: '/assets/images/templates/character-skill-card/title-bg-3.png',
              bgColor: 'rgba(66, 165, 245, 0.8)',
              zIndex: 60
            },
            padding: {
              top: 8,
              right: 12,
              bottom: 8,
              left: 12
            }
          }
        ]
      }
    ],
    imageAreas: [
      {
        id: 'character-avatar',
        placeholder: '角色头像',
        x: 225,
        y: 140,
        width: 150,
        height: 150,
        shape: 'circle',
        layer: 'midground'
      }
    ]
  }
];
