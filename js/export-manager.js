const ExportManager = (function() {
  let state, config, eventBus;
  
  // 初始化模块
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
    bindEventListeners();
  }
  
  // 绑定事件监听器
  function bindEventListeners() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadCardWithBleed);
    }
  }
  
  // 下载带出血线的卡牌
  function downloadCardWithBleed() {
    if (!state.currentTemplate || !state.canvas) return;
    
    try {
      // 创建临时画布
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        console.error('无法创建临时画布上下文');
        return;
      }
      
      // 计算出血区域尺寸
      const cardWidth = state.currentTemplate.width || 600;
      const cardHeight = state.currentTemplate.height || 800;
      const bleedSize = cardWidth * config.bleedRatio;
      const { top: bleedTop, right: bleedRight, bottom: bleedBottom, left: bleedLeft } = AppConfig.bleed;
      const totalWidth = cardWidth + bleedLeft + bleedRight;
      const totalHeight = cardHeight + bleedTop + bleedBottom;
      
      tempCanvas.width = totalWidth;
      tempCanvas.height = totalHeight;
      
      // 1. 绘制扩展背景（包含出血区域）
      tempCtx.fillStyle = AppConfig.solidColor;
      tempCtx.fillRect(0, 0, totalWidth, totalHeight);
      
      // 2. 绘制卡牌内容（偏移出血线位置）
      tempCtx.drawImage(
        state.canvas, 
        bleedLeft,  // x坐标：左出血宽度
        bleedTop,   // y坐标：上出血宽度
        cardWidth, 
        cardHeight
      );
      
      // 3. 绘制出血线和裁切标记
      drawBleedElements(tempCtx, totalWidth, totalHeight, AppConfig.bleed, cardWidth, cardHeight);
      
      // 4. 执行下载
      const link = document.createElement('a');
      link.download = `card-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
      
      // 清理临时资源
      setTimeout(() => tempCanvas.remove(), 100);
    } catch (error) {
      console.error('下载卡牌时出错:', error);
      alert('下载失败，请重试');
    }
  }
  
  // 绘制出血线和裁切标记
  function drawBleedElements(ctx, canvasWidth, canvasHeight, bleed, cardWidth, cardHeight) {
    // 使用四个方向的出血值
    const { top: bleedTop, right: bleedRight, bottom: bleedBottom, left: bleedLeft } = bleed;
    const cardX = bleedLeft;
    const cardY = bleedTop;
    const markLength = Math.max(Math.max(bleedTop, bleedRight, bleedBottom, bleedLeft) / 2, 5);
    
    // 绘制出血区域边界（红色虚线）
    ctx.strokeStyle = config.bleedLineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardWidth, cardHeight);
    ctx.stroke();
    
    // 绘制裁切标记（四角的实线标记）
    ctx.strokeStyle = config.cropMarkColor;
    ctx.setLineDash([]); // 实线
    ctx.lineWidth = 1;
    
    // 左上角标记
    ctx.beginPath();
    ctx.moveTo(cardX - markLength, cardY);
    ctx.lineTo(cardX, cardY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX, cardY - markLength);
    ctx.lineTo(cardX, cardY);
    ctx.stroke();
    
    // 右上角标记
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY);
    ctx.lineTo(cardX + cardWidth + markLength, cardY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY - markLength);
    ctx.lineTo(cardX + cardWidth, cardY);
    ctx.stroke();
    
    // 左下角标记
    ctx.beginPath();
    ctx.moveTo(cardX - markLength, cardY + cardHeight);
    ctx.lineTo(cardX, cardY + cardHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + cardHeight);
    ctx.lineTo(cardX, cardY + cardHeight + markLength);
    ctx.stroke();
    
    // 右下角标记
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY + cardHeight);
    ctx.lineTo(cardX + cardWidth + markLength, cardY + cardHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY + cardHeight);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight + markLength);
    ctx.stroke();
  }
  
  return {
    init,
    downloadCardWithBleed
  };
})();
