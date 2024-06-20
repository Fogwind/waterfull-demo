// https://zj.v.api.aa1.cn/api/so-baidu-img/?msg=%E5%85%8D%E8%B4%B9%E6%8E%A5%E5%8F%A3&page=2
var pageNum = 1;
var searchWords = '';
jQuery('#search-btn').on('click', function(e) {
    var val = jQuery('#query-words').val();
    if(val && val.trim()) {
        pageNum = 1;
        searchWords = val;
        getImgs({
            msg: searchWords,
            page: pageNum
        });
    }
});


window.addEventListener('scroll',throttle(function(e) {
    var scrollTop = window.scrollY;
    var wHeight = window.innerHeight;
    var listRoot = jQuery('.list-root');

    if(listRoot.height() <= scrollTop + wHeight + 30) {
        getImgs({
            msg: searchWords,
            page: ++pageNum
        });
    }
},1000,{leading:false}));
function getImgs(paranm) {
    $.ajax({
        type: "GET",
        url: "https://zj.v.api.aa1.cn/api/so-baidu-img/",
        data: {
            msg: paranm.msg,
            page: paranm.page
        },
        success: function(res) {
            appendList(res.data);
        },
        error: function(err) {

        }
    });
}

function appendList(data) {
    for(var i = 0; i < data.length; i++) {
        var img = new Image();
        img.setAttribute('data-i',i);
        img.onload = function(e) {
            var imgW = e.target.naturalWidth;
            var imgH = e.target.naturalHeight;
            var columnDoms = document.querySelectorAll('.list-column');
            var minJ = 0;
            for(var j = 0; j < columnDoms.length; j++) {
                if(columnDoms[j].offsetHeight <= columnDoms[minJ].offsetHeight) {
                    minJ = j;
                }
            }
            columnDoms[minJ].appendChild(renderItem(data[Number(e.target.getAttribute('data-i'))]));
            
        };
        img.src = data[i].hoverUrl;
    }
}

function renderItem(item) {
    var tpl = `<div class="list-item">
                <div class="list-item-imgbox">
                    <img class="list-item-img" src="{{img}}" />
                </div>
                
                <div class="list-item-title">
                    {{title}}
                </div>
            </div>`;
    
    var htmlStr = tpl.replace(/\{\{(\w+)\}\}/g,function(m,p) {
        var res = '';

        if(p === 'img') {
            res = item.hoverUrl;
        } else if(p === 'title') {
            res = item.oriTitle;
        }
        return res;
    });

    var div = document.createElement('div');
    div.innerHTML = htmlStr;

    return div.firstChild;
}

// https://www.underscorejs.cn/throttle
function throttle(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};
  
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
  
    var throttled = function() {
      var _now = Date.now();
      if (!previous && options.leading === false) previous = _now;
      var remaining = wait - (_now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = _now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  
    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };
  
    return throttled;
}