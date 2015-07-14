
// Create Base64 Object
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

// IE9 fallback
var modalTemplate = 
  '  <div class="modal fade" id="export-svg-modal">\n'
+ '    <div class="modal-dialog">\n'
+ '      <div class="modal-content">\n'
+ '        <div class="modal-header">\n'
+ '          <button type="button" class="close" data-dismiss="modal"><span>&times;</span>   </button>\n'
+ '          <h4 class="modal-title"><strong>Right Click <span class="fa fa-arrow-right"></span> Save As...</strong></h4>\n'
+ '        </div>\n'
+ '        <div class="modal-body" style="text-align: center;">\n'
+ '          <img style="max-width: 100%; max-height: 100%;"></img>\n'
+ '        </div>\n'
+ '        <div class="modal-footer">\n'
+ '          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n'
+ '        </div>\n'
+ '      </div><!-- /.modal-content -->\n'
+ '    </div><!-- /.modal-dialog -->\n'
+ '  </div><!-- /.modal -->\n';

function showModal(dataUri) {
  var modal = $("body").append(modalTemplate);
  $('#export-svg-modal .modal-body img').attr("src", dataUri);
  $('#export-svg-modal').on("hidden.bs.modal", function () {
    $('#export-svg-modal').remove();
  })
  $('#export-svg-modal').modal({});
}

function preprocess(selection, options, standalone, callback) {
  var xml;
  var svg = selection[0];
  var cssFile = options.css;
  
  var transform = selection.children("g").attr("transform");
  selection.children("g").removeAttr("transform");
  
  $.ajax(cssFile).done(function (css) {
    var bbox = svg.getBBox();
    
    var margin = 20;
    selection.children("g").attr("transform", "translate(" + (margin - bbox.x) + "," + (margin - bbox.y) + ")");
    
    var serializer = new XMLSerializer();
    var xml = serializer.serializeToString(svg);

    var childrenStart = xml.indexOf(">");
    var childrenEnd = xml.lastIndexOf("<");
    
    var xmlContent = '<style type="text/css" >\n'
                    + '<![CDATA[\n'
                    + css.htmlEscape()
                    + ']]>\n'
                    + '</style>\n'
                    + xml.substring(childrenStart + 1, childrenEnd);
    
    if (standalone) {
      xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
          + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
          + '<svg xmlns="http://www.w3.org/2000/svg" width="'  + (bbox.width  + margin * 2)
                                                                + '" height="' + (bbox.height + margin * 2) + '">\n';
    } else {
      //xml = '<svg>';
      xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
          + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
          + '<svg xmlns="http://www.w3.org/2000/svg">\n';
    }
    
    xml += xmlContent + '</svg>\n';
    
    callback(xml, { width: bbox.width + 2 * margin, height: bbox.height + 2 * margin });
    
    selection.children("g").attr("transform", transform);
  });
}

$.fn.exportSvg = function (options) {
  preprocess(this, options, true, function (xml, size) {
    try {
      // Without blob firefox gives errors
      var blob = new Blob([xml], { type: 'plain/text' });
      saveAs(blob, "graph.svg");
    } catch (err) {
      //IE9 fallback
      showModal('data:image/svg+xml;base64,' + Base64.encode(xml));
    }
  });
}

$.fn.exportSvgAsPng = function (options) {
  preprocess(this, options, false, function (xml, size) {
    var canvas = document.createElement('canvas');
    canvas.id     = "svg-export-to-png";
    canvas.width  = size.width;
    canvas.height = size.height;
    canvas.style.zIndex     = 8000;
    canvas.style.position   = "absolute";
    canvas.style.visibility = "hidden";
    
    document.body.appendChild(canvas);
    
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.fillStyle = "black";
    
    canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true, ignoreClear: true });
    
    canvas.toBlob(function (blob) {
      try {
        saveAs(blob, "graph.png");
      } catch (err) {
        //IE9 fallback
        showModal(canvas.toDataURL());
      }
    });
    
    canvas.parentNode.removeChild(canvas);
  });
}
