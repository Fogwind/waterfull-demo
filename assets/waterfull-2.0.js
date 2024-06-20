// https://zj.v.api.aa1.cn/api/so-baidu-img/?msg=%E5%85%8D%E8%B4%B9%E6%8E%A5%E5%8F%A3&page=2
/****
 * 如果后端不返回图片宽高
 */
var listRootDom = document.querySelector('#column_root');
var pageNum = 1;
var searchWords = '';
var listDataCache = setColumn(listRootDom); // 记录列表项的尺寸，位置信息
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

var preScrollTop = 0; // 上次滚动事件的scrollTop 用来判断滚动方向
var columnIndexRange = {};
var columnsHeight = []; // 保存每列的高度
for(var s = 0; s < listDataCache.length; s++) {
    columnIndexRange[s] = {};
    columnsHeight[s] = 0;
}

window.addEventListener('scroll',throttle(function(e) {
    var scrollTop = window.scrollY;
    var wHeight = window.innerHeight;
    var listRoot = jQuery(listRootDom);
    var listRootOffsetTop = getOffsetTopToBody(listRootDom);
    var columnDoms = document.querySelectorAll('.list-column');
    // 到达最短列底部时加载下一页
    var minColumnH = Math.min(...columnsHeight);
    if(minColumnH <= scrollTop - listRootOffsetTop  + wHeight + 150) {
        getImgs({
            msg: searchWords,
            page: ++pageNum
        });
    }
    /**渲染_offsetY在 600+wHeight+600 范围内的列表项 */
    // 向上滚动
    if(scrollTop - preScrollTop > 0) {
        if(scrollTop - listRootOffsetTop >= 600) {
            for(var i = 0; i < columnDoms.length; i++) {
                columnIndexRange[i].startI = Number(columnDoms[i].firstChild.getAttribute('data-coli'));
                columnIndexRange[i].endI = Number(columnDoms[i].lastChild.getAttribute('data-coli'));
                // _offsetY符合条件的都加
                for(var n = columnIndexRange[i].endI+1; n < Math.min(columnIndexRange[i].endI+10,listDataCache[i].length); n++) {
                    if(listDataCache[i][n] && listDataCache[i][n]['_offsetY'] <= scrollTop + wHeight + 600) {
                        columnDoms[i].append(renderNewItem(listDataCache[i][n]));
                    }
                }
                
                columnDoms[i].querySelectorAll('.list-item').forEach(function(ele,index) {
                    var columnI = Number(ele.getAttribute('data-coli'));
                    // 上部缓冲区
                    if(listDataCache[i][columnI]['_offsetY']+listDataCache[i][columnI]['_height'] < scrollTop - listRootOffsetTop - 600) {
                        ele.remove();
                    }
                });
                
            }


        }
    }
    // 向下滚动
    if(scrollTop - preScrollTop < 0) {
        if(listRoot.height() + listRootOffsetTop > scrollTop + wHeight + 600) {
            for(var i = 0; i < columnDoms.length; i++) {
                columnIndexRange[i].startI = Number(columnDoms[i].firstChild.getAttribute('data-coli'));
                columnIndexRange[i].endI = Number(columnDoms[i].lastChild.getAttribute('data-coli'));
                // _offsetY符合条件的都加
                for(var m = columnIndexRange[i].startI-1; m >= Math.max(columnIndexRange[i].startI-10,0); m--) {

                    if(listDataCache[i][m] && listDataCache[i][m]['_offsetY'] + listDataCache[i][m]['_height'] >= scrollTop - listRootOffsetTop - 600) {
                        columnDoms[i].insertBefore(renderNewItem(listDataCache[i][m]),columnDoms[i].firstChild);
                    }
                }
                
                // 下部缓冲区
                columnDoms[i].querySelectorAll('.list-item').forEach(function(ele,index) {
                    var columnI = Number(ele.getAttribute('data-coli'));
                    if(listDataCache[i][columnI]['_offsetY'] > scrollTop + wHeight + 600) {
                        ele.remove();
                    }
                });
                
            }
        }
    }

    preScrollTop = scrollTop;

},150));

/**获取某个元素距离body元素顶部的距离 */
function getOffsetTopToBody(ele) {
    var offsetY = ele.offsetTop;
    if(ele.offsetParent.nodeName !== 'BODY') {
        offsetY = offsetY + getOffsetTopToBody(ele.offsetParent);
    }
    return offsetY;
}
/**设置列数*/
function setColumn(columnRoot) {
    var columnNum = Number(columnRoot.getAttribute('data-column'));

    var res = [];

    for(var i = 0; i < columnNum; i++) {
        res[i] = [];
    }

    return res;
}

function getImgs(paranm) {
    $.ajax({
        type: "GET",
        url: "https://zj.v.api.aa1.cn/api/so-baidu-img/",
        data: {
            msg: paranm.msg,
            page: paranm.page
        },
        success: function(res) {
            appendNewList(res.data);
        },
        error: function(err) {

        }
    });
}

/**
 * 使用递归，当前一项的图片加载完成再加载下一项的图片，一项一项的向列表中添加项
 */
function appendNewList(data) {
    if(!data.length) return;
    var columnDoms = document.querySelectorAll('.list-column');
    var img = new Image();
    img.onload = function(e) {
        var imgW = e.target.naturalWidth;
        var imgH = e.target.naturalHeight;
        
        var minJ = 0;
        for(var j = 0; j < columnDoms.length; j++) {
            if(columnDoms[j].offsetHeight < columnDoms[minJ].offsetHeight) {
                minJ = j;
            }
        }
        var curDataColumnI = listDataCache[minJ].length;
        var curData = data.shift();
        var preColumnHeight = columnDoms[minJ].offsetHeight || 0;
        curData['_offsetY'] = preColumnHeight;
        var curItemDom = renderNewItem(curData,curDataColumnI);
        
        columnDoms[minJ].appendChild(curItemDom);

        curData['_height'] = curItemDom.offsetHeight;
        curData['_imgHeight'] = imgH;
        curData['_imgWidth'] = imgW;
        curData['_marginBottom'] = 10;
        curData['_columnIndex'] = curDataColumnI;
        
        // 10px是列表项之间的间隔
        columnDoms[minJ].style.height = (preColumnHeight + curData['_height'] + 10) + 'px';
        columnsHeight[minJ] = (preColumnHeight + curData['_height'] + 10);
        // curItemDom.style = 'transform:translate(0,'+ preColumnHeight + 'px);'
        listDataCache[minJ].push(curData);

        appendNewList(data);
    };
    img.src = data[0].thumbnailUrl;
    
}

function renderNewItem(item,i) {
    var coli = i >= 0 ? i : item['_columnIndex'];
    var tpl = `<div class="list-item" data-coli="{{index}}" style="{{style}}">
                <div class="list-item-imgbox">
                    <img class="list-item-img" src="{{img}}" />
                </div>
                
                <div class="list-item-title">
                    {{title}}
                </div>
            </div>`;
    
    var htmlStr = tpl.replace(/\{\{(\w+)\}\}/g,function(m,p) {
        var res = '';
        if(p === 'index') {
            res = coli;
        }else if(p === 'style') {
            res = 'transform:translate(0,'+ item['_offsetY'] + 'px);'
        } else if(p === 'img') {
            res = item.thumbnailUrl;
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
