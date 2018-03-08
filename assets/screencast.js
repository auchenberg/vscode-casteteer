class ScreencastView {

    constructor() {
        this._canvasElement = document.querySelector('canvas')  
        this._screenElement = document.querySelector('.screen')  
        this._imageElement = new Image();
        this._context = this._canvasElement.getContext('2d');
        this._checkerboardPattern = this._createCheckerboardPattern(this._context);
    }
  
    _screencastFrame(base64Data, metadata) {

      this._imageElement.onload = () => {
        this._pageScaleFactor = metadata.pageScaleFactor;
        this._screenOffsetTop = metadata.offsetTop;
        this._scrollOffsetX = metadata.scrollOffsetX;
        this._scrollOffsetY = metadata.scrollOffsetY;
  
        const deviceSizeRatio = metadata.deviceHeight / metadata.deviceWidth;
        const dimensionsCSS = this._viewportDimensions();
  
        this._imageZoom = Math.min(
            dimensionsCSS.width / this._imageElement.naturalWidth,
            dimensionsCSS.height / (this._imageElement.naturalWidth * deviceSizeRatio));
        
            const bordersSize = 0;

        if (this._imageZoom < 1.01 / window.devicePixelRatio)
          this._imageZoom = 1 / window.devicePixelRatio;
        this._screenZoom = this._imageElement.naturalWidth * this._imageZoom / metadata.deviceWidth;
        this._canvasElement.style.width = metadata.deviceWidth * this._screenZoom + bordersSize + 'px';
        this._canvasElement.style.height = metadata.deviceHeight * this._screenZoom + bordersSize + 'px';

        this._repaint();
  
      };
      this._imageElement.src = 'data:image/jpg;base64,' + base64Data;
    }
  
    _repaint() {
      const model = this._model;
      const config = this._config;
  
      const canvasWidth = this._canvasElement.getBoundingClientRect().width;
      const canvasHeight = this._canvasElement.getBoundingClientRect().height;
      this._canvasElement.width = window.devicePixelRatio * canvasWidth;
      this._canvasElement.height = window.devicePixelRatio * canvasHeight;
  
      this._context.save();
      this._context.scale(window.devicePixelRatio, window.devicePixelRatio);
  
      // Paint top and bottom gutter.
      this._context.save();
      this._context.fillStyle = this._checkerboardPattern;
      this._context.fillRect(0, 0, canvasWidth, this._screenOffsetTop * this._screenZoom);
      this._context.fillRect(
          0, this._screenOffsetTop * this._screenZoom + this._imageElement.naturalHeight * this._imageZoom, canvasWidth,
          canvasHeight);
      this._context.restore();
    
      this._context.drawImage(
          this._imageElement, 0, this._screenOffsetTop * this._screenZoom,
          this._imageElement.naturalWidth * this._imageZoom, this._imageElement.naturalHeight * this._imageZoom);
      this._context.restore();
    }
   
    /**
     * @return {!{width: number, height: number}}
     */
    _viewportDimensions() {
      const gutterSize = 0;
      const bordersSize = 0;
      const width = this._screenElement.offsetWidth - bordersSize - gutterSize;
      const height = this._screenElement.offsetHeight - bordersSize - gutterSize;
      return {width: width, height: height};
    }
  
    /**
     * @param {!CanvasRenderingContext2D} context
     */
    _createCheckerboardPattern(context) {
      const pattern = this._canvasElement;
      const size = 32;
      pattern.width = size * 2;
      pattern.height = size * 2;
      const pctx = pattern.getContext('2d');
  
      pctx.fillStyle = 'rgb(195, 195, 195)';
      pctx.fillRect(0, 0, size * 2, size * 2);
  
      pctx.fillStyle = 'rgb(225, 225, 225)';
      pctx.fillRect(0, 0, size, size);
      pctx.fillRect(size, size, size, size);
      return context.createPattern(pattern, 'repeat');
    }
  

  };



var myScreencastView = new ScreencastView();

window.addEventListener('message', event => {
	switch (event.data.type) {
        case 'Page.screencastFrame':
            console.log('UPDATE CANVAS')          
            myScreencastView._screencastFrame(event.data.params.data, event.data.params.metadata)
        break;
	}
}, false);

document.querySelector('button').addEventListener('click', event => {

    var val = document.querySelector('input').value
    console.log('Sending page.navigate', val)

    window.parent.postMessage({
        type: "Page.navigate",
        params: {
            url: val
        }
    },'*')

}, false);


  