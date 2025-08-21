const TemplateManager = (function() {
  let state, config, eventBus;
  let templateList = [];
  
  // 初始化模块
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
  }
  
  // 加载模板列表
  function loadTemplates() {
    if (window.templateData && Array.isArray(window.templateData) && window.templateData.length > 0) {
      templateList = window.templateData;
      renderTemplateGallery();
      return;
    }
    
    // 模板加载失败处理
    setTimeout(() => {
      const loadingEl = document.getElementById('templateLoading');
      if (loadingEl) {
        loadingEl.innerHTML = `
          <i class="fa fa-exclamation-triangle text-yellow-500 mr-2"></i>
          模板加载失败，请检查模板数据文件
        `;
      }
    }, 3000);
  }
  
  // 渲染模板画廊
  function renderTemplateGallery() {
    const galleryEl = document.getElementById('templateGallery');
    if (!galleryEl) return;
    
    // 移除加载提示
    const loadingEl = document.getElementById('templateLoading');
    if (loadingEl) {
      loadingEl.remove();
    }
    
    templateList.forEach((template, index) => {
      const templateItem = document.createElement('div');
      templateItem.className = `template-item ${index === 0 ? 'selected' : ''}`;
      templateItem.dataset.templateId = template.id;
      
      const img = document.createElement('img');
      img.src = template.thumbnailUrl;
      img.alt = `${template.name} 缩略图`;
      img.className = 'w-full h-24 object-cover';
      
      // 图片加载失败处理
      img.onerror = function() {
        console.warn(`模板缩略图加载失败: ${template.thumbnailUrl}`);
        this.src = config.fallbackImage;
      };
      
      const name = document.createElement('div');
      name.className = 'p-1 text-center text-xs text-gray-700 truncate';
      name.textContent = template.name;
      
      templateItem.appendChild(img);
      templateItem.appendChild(name);
      galleryEl.appendChild(templateItem);
      
      templateItem.addEventListener('click', () => selectTemplate(template));
    });
    
    // 默认选择第一个模板
    if (templateList.length > 0) {
      selectTemplate(templateList[0]);
    }
  }
  
  // 选择模板
  function selectTemplate(template) {
    if (!template) return;
    
    UIManager.showLoadingState();
    
    // 重置状态
    state.templateLayers = [];
    state.userContent = {
      textContent: {},
      imageContent: {},
      imageTransforms: {}
    };
    
    // 更新选中状态
    document.querySelectorAll('.template-item').forEach(item => {
      item.classList.remove('selected');
    });
    const selectedEl = document.querySelector(`[data-template-id="${template.id}"]`);
    if (selectedEl) {
      selectedEl.classList.add('selected');
    }
    
    // 更新当前模板
    state.currentTemplate = template;
    
    // 触发模板选择事件
    eventBus.emit('templateSelected', template);
  }
  
  // 加载模板图层
  function loadTemplateLayers(template) {
    if (!template || !Array.isArray(template.layers)) return Promise.resolve();
    
    // 按zIndex排序图层
    const sortedLayers = [...template.layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    const loadPromises = sortedLayers.map(layer => {
      return new Promise((resolve) => {
        if (!layer.url) {
          console.warn('图层URL不存在，将跳过');
          resolve();
          return;
        }
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          state.templateLayers.push({...layer, image: img});
          resolve();
        };
        img.onerror = () => {
          console.warn(`图层加载失败: ${layer.url}`);
          resolve(); // 即使单个图层失败，仍继续加载其他图层
        };
        img.src = layer.url;
      });
    });
    
    return Promise.all(loadPromises)
      .then(() => {
        UIManager.hideLoadingState();
      })
      .catch(error => {
        console.error('图层加载过程出错:', error);
        UIManager.hideLoadingState();
      });
  }
  
  // 获取当前模板
  function getCurrentTemplate() {
    return state.currentTemplate;
  }
  
  // 获取模板列表
  function getTemplateList() {
    return [...templateList];
  }
  
  return {
    init,
    loadTemplates,
    selectTemplate,
    loadTemplateLayers,
    getCurrentTemplate,
    getTemplateList
  };
})();
