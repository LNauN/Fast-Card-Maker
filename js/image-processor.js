const ImageProcessor = (function() {
  let state, config, eventBus;
  
  // 初始化模块
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
  }
  
  // 创建图片上传区域
  function createImageUploadField(area) {
    if (!area.id) return;
    
    // 初始化变换信息
    state.userContent.imageTransforms[area.id] = { x: 0, y: 0, scale: 1 };
    
    const containerEl = document.getElementById('imageUploadsContainer');
    if (!containerEl) return;
    
    const uploadGroup = document.createElement('div');
    uploadGroup.className = 'mb-8';
    
    const shapeNames = {
      'rectangle': '矩形',
      'diamond': '菱形',
      'trapezoid': '梯形',
      'circle': '圆形'
    };
    
    const title = document.createElement('p');
    title.className = 'block text-sm font-medium text-gray-700 mb-2';
    title.textContent = `${area.placeholder || '图片区域'} (${shapeNames[area.shape] || '未知形状'}, 层级: ${area.layer || '默认'})`;
    
    const dropArea = document.createElement('div');
    dropArea.className = 'upload-area mb-4 border-2 border-dashed border-gray-300 p-4 text-center hover:border-primary transition-colors';
    dropArea.dataset.areaId = area.id;
    
    const icon = document.createElement('i');
    icon.className = 'fa fa-cloud-upload text-2xl text-gray-400 mb-2';
    
    const text = document.createElement('p');
    text.className = 'text-gray-500 text-sm mb-2';
    text.textContent = '点击或拖拽图片到此处上传';
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'hidden';
    input.dataset.areaId = area.id;
    
    // 绑定事件
    dropArea.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0], area);
      }
    });
    
    // 拖拽事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add('bg-blue-50'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove('bg-blue-50'), false);
    });
    
    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length) handleImageUpload(files[0], area);
    }, false);
    
    // 变换控制
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mt-3 grid grid-cols-3 gap-3 text-sm';
    
    const xControl = document.createElement('div');
    xControl.innerHTML = `
      <label class="block text-gray-600 mb-1">X 位置</label>
      <input type="number" id="pos-x-${area.id}" class="input-field w-full p-1 border border-gray-300 rounded" value="0">
    `;
    
    const yControl = document.createElement('div');
    yControl.innerHTML = `
      <label class="block text-gray-600 mb-1">Y 位置</label>
      <input type="number" id="pos-y-${area.id}" class="input-field w-full p-1 border border-gray-300 rounded" value="0">
    `;
    
    const scaleControl = document.createElement('div');
    scaleControl.innerHTML = `
      <label class="block text-gray-600 mb-1">缩放 (%)</label>
      <input type="number" id="scale-${area.id}" class="input-field w-full p-1 border border-gray-300 rounded" value="100" min="10" max="500">
    `;
    
    // 移除按钮
    const removeBtn = document.createElement('button');
    removeBtn.className = 'mt-3 text-sm text-red-500 hover:text-red-700';
    removeBtn.innerHTML = '<i class="fa fa-trash mr-1"></i>移除图片';
    removeBtn.addEventListener('click', () => {
      if (state.userContent.imageContent[area.id]) {
        delete state.userContent.imageContent[area.id];
      }
      if (state.userContent.imageTransforms[area.id]) {
        delete state.userContent.imageTransforms[area.id];
      }
      dropArea.classList.remove('hidden');
      eventBus.emit('contentUpdated');
    });
    
    controlsContainer.appendChild(xControl);
    controlsContainer.appendChild(yControl);
    controlsContainer.appendChild(scaleControl);
    dropArea.appendChild(icon);
    dropArea.appendChild(text);
    dropArea.appendChild(input);
    
    uploadGroup.appendChild(title);
    uploadGroup.appendChild(dropArea);
    uploadGroup.appendChild(controlsContainer);
    uploadGroup.appendChild(removeBtn);
    
    containerEl.appendChild(uploadGroup);
    
    // 为控件添加事件监听器
    const xInput = document.getElementById(`pos-x-${area.id}`);
    if (xInput) {
      xInput.addEventListener('input', (e) => {
        updateImageTransform(area.id, parseInt(e.target.value) || 0, null, null);
      });
    }
    
    const yInput = document.getElementById(`pos-y-${area.id}`);
    if (yInput) {
      yInput.addEventListener('input', (e) => {
        updateImageTransform(area.id, null, parseInt(e.target.value) || 0, null);
      });
    }
    
    const scaleInput = document.getElementById(`scale-${area.id}`);
    if (scaleInput) {
      scaleInput.addEventListener('input', (e) => {
        updateImageTransform(area.id, null, null, parseInt(e.target.value) / 100 || 1);
      });
    }
  }
  
  // 处理图片上传
  function handleImageUpload(file, area) {
    if (!file || !area || !area.id) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        state.userContent.imageContent[area.id] = img;
        
        const initialScale = 1;
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        const initialX = (scaledWidth - (area.width || 0)) / 2;
        const initialY = (scaledHeight - (area.height || 0)) / 2;
        
        state.userContent.imageTransforms[area.id] = {
          x: initialX || 0,
          y: initialY || 0, 
          scale: initialScale
        };
        
        const dropArea = document.querySelector(`.upload-area[data-area-id="${area.id}"]`);
        if (dropArea) {
          dropArea.classList.add('hidden');
        }
        
        // 更新输入框
        const xInput = document.getElementById(`pos-x-${area.id}`);
        if (xInput) {
          xInput.value = Math.round(state.userContent.imageTransforms[area.id].x);
        }
        
        const yInput = document.getElementById(`pos-y-${area.id}`);
        if (yInput) {
          yInput.value = Math.round(state.userContent.imageTransforms[area.id].y);
        }
        
        const scaleInput = document.getElementById(`scale-${area.id}`);
        if (scaleInput) {
          scaleInput.value = Math.round(state.userContent.imageTransforms[area.id].scale * 100);
        }
        
        eventBus.emit('contentUpdated');
      };
      
      img.onerror = function() {
        console.error('图片加载失败');
        alert('图片加载失败，请尝试其他图片');
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      console.error('文件读取失败');
      alert('文件读取失败，请重试');
    };
    
    reader.readAsDataURL(file);
  }
  
  // 更新图片变换信息
  function updateImageTransform(areaId, x, y, scale) {
    if (!state.currentTemplate || !areaId) return;
    
    const area = (state.currentTemplate.imageAreas || []).find(a => a.id === areaId);
    if (!area) {
      console.warn(`未找到ID为${areaId}的图片区域`);
      return;
    }
    
    const image = state.userContent.imageContent[areaId];
    if (!image) return;
    
    // 确保变换对象存在
    if (!state.userContent.imageTransforms[areaId]) {
      state.userContent.imageTransforms[areaId] = { x: 0, y: 0, scale: 1 };
    }
    
    // 更新变换值
    if (x !== null && x !== undefined) state.userContent.imageTransforms[areaId].x = x;
    if (y !== null && y !== undefined) state.userContent.imageTransforms[areaId].y = y;
    if (scale !== null && scale !== undefined) state.userContent.imageTransforms[areaId].scale = scale;
    
    // 更新输入框
    const xInput = document.getElementById(`pos-x-${areaId}`);
    if (xInput) {
      xInput.value = Math.round(state.userContent.imageTransforms[areaId].x);
    }
    
    const yInput = document.getElementById(`pos-y-${areaId}`);
    if (yInput) {
      yInput.value = Math.round(state.userContent.imageTransforms[areaId].y);
    }
    
    const scaleInput = document.getElementById(`scale-${areaId}`);
    if (scaleInput) {
      scaleInput.value = Math.round(state.userContent.imageTransforms[areaId].scale * 100);
    }
    
    eventBus.emit('contentUpdated');
  }
  
  // 渲染图片元素
  function renderImage(element) {
    const imageArea = element.area;
    const image = element.image;
    const transforms = element.transforms || { x: 0, y: 0, scale: 1 };
    
    if (!image) return;
    
    const scaledWidth = image.width * transforms.scale;
    const scaledHeight = image.height * transforms.scale;
    
    // 创建裁剪路径
    CanvasManager.createShapeClipPath(imageArea);
    
    // 绘制图片
    state.canvasCtx.drawImage(
      image,
      0, 0,
      image.width, image.height,
      (imageArea.x || 0) - transforms.x,
      (imageArea.y || 0) - transforms.y,
      scaledWidth, scaledHeight
    );
    
    state.canvasCtx.restore();
  }
  
  // 阻止默认行为
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  return {
    init,
    createImageUploadField,
    handleImageUpload,
    updateImageTransform,
    renderImage
  };
})();
