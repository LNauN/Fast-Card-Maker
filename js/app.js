// 应用配置
const AppConfig = {
  solidColor: '#ffffff',
  textBgColor: 'rgba(255, 255, 255, 0.8)',
  textBorderColor: 'rgba(0, 0, 0, 0.1)',
  bleedRatio: 0.05,
  bleedLineColor: '#FF5252',
  cropMarkColor: '#666666',
  fallbackImage: '/assets/images/fallback/default-template.png'
};

// 应用状态管理
const AppState = {
  canvas: null,
  canvasCtx: null,
  currentTemplate: null,
  templateLayers: [],
  userContent: {
    textContent: {},
    imageContent: {},
    imageTransforms: {}
  }
};

// 模块间通信事件系统
const EventBus = {
  events: {},
  
  on: function(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },
  
  emit: function(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  },
  
  off: function(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }
};

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化各模块
  CanvasManager.init(AppState, AppConfig);
  TemplateManager.init(AppState, AppConfig, EventBus);
  UIManager.init(AppState, AppConfig, EventBus);
  ImageProcessor.init(AppState, AppConfig, EventBus);
  TextProcessor.init(AppState, AppConfig, EventBus);
  ExportManager.init(AppState, AppConfig, EventBus);
  
  // 加载模板
  TemplateManager.loadTemplates();
  
  // 注册全局事件监听
  registerGlobalEvents();
});

// 注册全局事件
function registerGlobalEvents() {
  // 模板选择事件
  EventBus.on('templateSelected', (template) => {
    UIManager.updateEditorUI();
    CanvasManager.resizeCanvas(template.width, template.height);
    TemplateManager.loadTemplateLayers(template)
      .then(() => {
        CanvasManager.renderCard();
        UIManager.enableActionButtons();
      });
  });
  
  // 内容更新事件
  EventBus.on('contentUpdated', () => {
    CanvasManager.renderCard();
  });
  
  // 重置事件
  EventBus.on('resetCard', () => {
    // 重置用户内容
    AppState.userContent = {
      textContent: {},
      imageContent: {},
      imageTransforms: {}
    };
    
    // 更新UI
    UIManager.updateTextFields();
    UIManager.updateImageUploads();
    CanvasManager.renderCard();
    UIManager.disableActionButtons();
  });
}
