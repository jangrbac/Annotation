/**
 * Code extracted from pdf.js' viewer.js file. This contains code that is relevant to building the text overlays. I
 * have removed dependencies on viewer.js and viewer.html.
 *
 *   -- Vivin Suresh Paliath (http://vivin.net)
 */
// mouse down

var DOWNclickX = 0;
var DOWNclickY = 0;
// mouse up
var UPclickX = 0;
var UPclickY = 0;
// top point from text
var TOPpoint = 0;
// font size
var FONTheight = 0;
 
 function mouseDown(element) {
	// funkcija ki dobi zacetne koordinate potega miske
	DOWNclickX = element.pageX;
	DOWNclickY = element.pageY;
	console.log("DOWN: pageX:" + DOWNclickX + ", pageY:" + DOWNclickY);
}

function mouseUp(element) {
	// funkcija ki dobi koncne koordinate potega miske
	UPclickX = element.pageX;
	UPclickY = element.pageY;
	console.log("UP: pageX:" + UPclickX + ", pageY:" + UPclickY);
}

function getSelectionText() {
	/* intiPDF1(); */
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    //return text;
    console.log("getSelectionText(): " +text);

    var parentEl=getSelectionParentElement();
	
	highlighting();
}

function getSelectionParentElement() {
    var parentEl = null, sel;
    if (window.getSelection) {
        sel = window.getSelection();
        //console.log("-1:" +sel.rangeCount);
        //parentEl = sel.getRangeAt(0).commonAncestorContainer;
        parentEl = sel.getRangeAt(0).startContainer;
             
        if (sel.rangeCount) {
            //console.log("0:" +parentEl.tagName);
            if (parentEl.nodeType != 1) {
                parentEl = parentEl.parentNode;
                //console.log("1:" +parentEl.tagName);
            }else if(parentEl.tagName=="DIV"){
                sel.rangeCount
                parentEl = sel.getRangeAt(0);
            
                parentEl = parentEl.parentNode;
                //console.log("1.5:" +parentEl.tagName);
            }
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        parentEl = sel.createRange().parentElement();
       //console.log("2" +parentEl.tagName);
    }
	
	// get parameters for drawing rectangle
	TOPpoint = String(parentEl.style.top).replace("px", "");
	FONTheight = String(parentEl.style.fontSize).replace("px", "");
	
    console.log("getSelectionParentElementTop: "+ parentEl.style.top);
	console.log("getSelectionParentElementLeft: "+ parentEl.style.left);
	console.log("getSelectionParentElementWidth: "+ parentEl.style.canvasWidth);
	console.log("getSelectionParentElementFontSize: "+ parentEl.style.fontSize);
    //console.log("getSelectionParentElement: "+ parentEl.className);
   
    return parentEl;
}

function highlighting(){
	console.log("HIGHLIGHTTT!!!!!");
	var canvas = document.getElementById('myCanvas');
	var ctx = canvas.getContext('2d');
	
	var X = DOWNclickX;
	var Y = TOPpoint;
	var width = (UPclickX - DOWNclickX);
	var height = FONTheight;
	console.log("x: " + X + " ,y: " + Y + " ,width: " + width + " ,height: " + height);
	ctx.beginPath();
	//ctx.globalAlpha = 0.5;
	ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
	ctx.fillRect(X, Y, width, height);
	//ctx.fillRect(50, 0, 100, 100);
	//ctx.fillStyle = 'yellow';
	ctx.fill();
}

var CustomStyle = (function CustomStyleClosure() {

    // As noted on: http://www.zachstronaut.com/posts/2009/02/17/
    //              animate-css-transforms-firefox-webkit.html
    // in some versions of IE9 it is critical that ms appear in this list
    // before Moz
    var prefixes = ['ms', 'Moz', 'Webkit', 'O'];
    var _cache = { };

    function CustomStyle() {
    }

    CustomStyle.getProp = function get(propName, element) {
        // check cache only when no element is given
        if (arguments.length == 1 && typeof _cache[propName] == 'string') {
            return _cache[propName];
        }

        element = element || document.documentElement;
        var style = element.style, prefixed, uPropName;

        // test standard property first
        if (typeof style[propName] == 'string') {
            return (_cache[propName] = propName);
        }

        // capitalize
        uPropName = propName.charAt(0).toUpperCase() + propName.slice(1);

        // test vendor specific properties
        for (var i = 0, l = prefixes.length; i < l; i++) {
            prefixed = prefixes[i] + uPropName;
            if (typeof style[prefixed] == 'string') {
                return (_cache[propName] = prefixed);
            }
        }

        //if all fails then set to undefined
        return (_cache[propName] = 'undefined');
    };

    CustomStyle.setProp = function set(propName, element, str) {
        var prop = this.getProp(propName);
        if (prop != 'undefined')
            element.style[prop] = str;
    };

    return CustomStyle;
})();

var TextLayerBuilder = function textLayerBuilder(textLayerDiv, pageIdx) {
    var textLayerFrag = document.createDocumentFragment();

    this.textLayerDiv = textLayerDiv;
    this.layoutDone = false;
    this.divContentDone = false;
    this.pageIdx = pageIdx;
    this.matches = [];

    this.beginLayout = function textLayerBuilderBeginLayout() {
        this.textDivs = [];
        this.renderingDone = false;
    };

    this.endLayout = function textLayerBuilderEndLayout() {
        this.layoutDone = true;
        this.insertDivContent();
    };

    this.renderLayer = function textLayerBuilderRenderLayer() {
        var textDivs = this.textDivs;
        var bidiTexts = this.textContent.bidiTexts;
        var textLayerDiv = this.textLayerDiv;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        // No point in rendering so many divs as it'd make the browser unusable
        // even after the divs are rendered
        var MAX_TEXT_DIVS_TO_RENDER = 100000;
        if (textDivs.length > MAX_TEXT_DIVS_TO_RENDER)
            return;

        for (var i = 0, ii = textDivs.length; i < ii; i++) {
            var textDiv = textDivs[i];
            if ('isWhitespace' in textDiv.dataset) {
                continue;
            }
            textLayerFrag.appendChild(textDiv);

            ctx.font = textDiv.style.fontSize + ' ' + textDiv.style.fontFamily;
            var width = ctx.measureText(textDiv.textContent).width;

            if (width > 0) {
                var textScale = textDiv.dataset.canvasWidth / width;

                var transform = 'scale(' + textScale + ', 1)';
                if (bidiTexts[i].dir === 'ttb') {
                    transform = 'rotate(90deg) ' + transform;
                }
                CustomStyle.setProp('transform', textDiv, transform);
                CustomStyle.setProp('transformOrigin', textDiv, '0% 0%');

                textLayerDiv.appendChild(textDiv);
            }
        }

        this.renderingDone = true;

        textLayerDiv.appendChild(textLayerFrag);
    };

    this.setupRenderLayoutTimer = function textLayerSetupRenderLayoutTimer() {
        // Schedule renderLayout() if user has been scrolling, otherwise
        // run it right away
        var RENDER_DELAY = 200; // in ms
        var self = this;
        //0 was originally PDFView.lastScroll
        if (Date.now() - 0 > RENDER_DELAY) {
            // Render right away
            this.renderLayer();
        } else {
            // Schedule
            if (this.renderTimer)
                clearTimeout(this.renderTimer);
            this.renderTimer = setTimeout(function () {
                self.setupRenderLayoutTimer();
            }, RENDER_DELAY);
        }
    };

    this.appendText = function textLayerBuilderAppendText(geom) {
        var textDiv = document.createElement('div');

        // vScale and hScale already contain the scaling to pixel units
        var fontHeight = geom.fontSize * Math.abs(geom.vScale);
        textDiv.dataset.canvasWidth = geom.canvasWidth * geom.hScale;
        textDiv.dataset.fontName = geom.fontName;

        textDiv.style.fontSize = fontHeight + 'px';
        textDiv.style.fontFamily = geom.fontFamily;
        textDiv.style.left = geom.x + 'px';
        textDiv.style.top = (geom.y - fontHeight) + 'px';

        // The content of the div is set in the `setTextContent` function.

        this.textDivs.push(textDiv);
    };

    this.insertDivContent = function textLayerUpdateTextContent() {
        // Only set the content of the divs once layout has finished, the content
        // for the divs is available and content is not yet set on the divs.
        if (!this.layoutDone || this.divContentDone || !this.textContent)
            return;

        this.divContentDone = true;

        var textDivs = this.textDivs;
        var bidiTexts = this.textContent.bidiTexts;

        for (var i = 0; i < bidiTexts.length; i++) {
            var bidiText = bidiTexts[i];
            var textDiv = textDivs[i];
            if (!/\S/.test(bidiText.str)) {
                textDiv.dataset.isWhitespace = true;
                continue;
            }

            textDiv.textContent = bidiText.str;
            // bidiText.dir may be 'ttb' for vertical texts.
            textDiv.dir = bidiText.dir === 'rtl' ? 'rtl' : 'ltr';
        }

        this.setupRenderLayoutTimer();
    };

    this.setTextContent = function textLayerBuilderSetTextContent(textContent) {
        this.textContent = textContent;
        this.insertDivContent();
    };
};

/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @return {Object} The object with horizontal (sx) and vertical (sy)
 scales. The scaled property is set to false if scaling is
 not required, true otherwise.
 */
function getOutputScale() {
    var pixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;
    return {
        sx: pixelRatio,
        sy: pixelRatio,
        scaled: pixelRatio != 1
    };
}