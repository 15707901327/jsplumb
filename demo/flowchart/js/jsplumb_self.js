// 标识当前点击的流程图框,默认为none
sessionStorage['currentChartSelected'] = 'none';


//栈,记录用户操作的先后顺序,用来进行撤销操作,数据结构为JSON,其中的copy用来复制部件
//是个二维栈,包括新增/删除/粘贴操作
var chartOperationStack = new Array;
chartOperationStack['add'] = [];
chartOperationStack['delete'] = [];
chartOperationStack['paste'] = [];
chartOperationStack['copy'] = [];

// 记录用户具体操作,有copy,add,delete,paste
var chartRareOperationStack = new Array;
var PJP = {};

PJP.JsPlumb = function () {

    var _this = this;
    this.list = jsPlumb.getAllConnections(); // 获取所有的连接

    // 根蒂根基连接线样式
    this.connectorPaintStyle = {
        lineWidth: 2,
        strokeStyle: "rgb(0,32,80)",
        joinstyle: "round",
        outlineColor: "rgb(251,251,251)",
        outlineWidth: 2
    };
    // 鼠标悬浮在连接线上的样式
    this.connectorHoverStyle = {
        lineWidth: 2,

        strokeStyle: "#216477",
        outlineWidth: 0,
        outlineColor: "rgb(251,251,251)"
    };
    this.hollowCircle = {
        endpoint: ["Dot", {radius: 4}],  //端点的外形
        connectorStyle: this.connectorPaintStyle,//连接线的色彩,大小样式
        connectorHoverStyle: this.connectorHoverStyle,
        paintStyle: {
            strokeStyle: "rgb(178,178,178)",
            fillStyle: "rgb(178,178,178)",
            opacity: 0.5,
            radius: 2,
            lineWidth: 2
        },//端点的色彩样式
        //anchor: "AutoDefault",
        isSource: true,    //是否可以拖动(作为连线出发点)
        //connector: ["Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],  //连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight ]
        connector: ["Flowchart", {cornerRadius: 10}],//设置连线为贝塞尔曲线
        isTarget: true,    //是否可以放置(连线终点)
        maxConnections: -1,    // 设置连接点最多可以连接几条线
        connectorOverlays: [["Diamond", {
            location: 0.5,
            width: 6,
            height: 6
        }], [["Arrow"], {
            location: 1,
            width: 6,
            height: 6
        }]]
    };

    //***********************************元素拖动控制部分************************************

    // 允许元素拖动
    $(".list-content .area").children().draggable({
        //revert: "valid",//拖动之后原路返回
        helper: "clone",//复制自身
        scope: "dragflag"//标识
    });
    $(".droppable").droppable({
        // accept: ".draggable", //只接受来自类.dragable的元素
        activeClass: "drop-active", //开始拖动时放置区域显示
        scope: "dragflag",
        drop: function (event, ui) {

            // 获取鼠标坐标
            var left = parseInt(ui.offset.left - $(this).offset().left);
            var top = parseInt(ui.offset.top - $(this).offset().top) + 4;

            // // setChartLocation(top, left);// 设置坐标

            var name = ui.draggable[0].id;// 返回被拖动元素的ID
            var trueId = PUnits.getGUID();

            /**
             * <div class="group" style="top:150px;left:500px">
             *     <h4>vector</h4>
             *     <ul>
             *         <li id="item_left" class="item"></li>
             *         <li id="item_left2" class="item"></li>
             *         </ul>
             * </div>
             */
            var $div = $("<div class=\"draggable " + name + " new-" + name + "\" id=\"" + trueId + "\"></div>");
            var $h4 = $("<h4>" + $(ui.helper).html() + "</h4>");
            var $ul = $("<ul></ul>");
            var $li1 = $("<li class=\"item\" id=\"" + trueId + "item1\">属性一</li>");
            var $li2 = $("<li class=\"item\" id=\"" + trueId + "item2\">属性二</li>");
            $div.append($h4);
            $div.append($ul);
            $ul.append($li1);
            $ul.append($li2);
            $(this).append($div);

            $("#" + trueId).css("position", "absolute")
                .css("left", left)
                .css("top", top)
                .css("margin", "0px")
                .css("background", "#efefef");

            // 用jsPlumb添加锚点
            jsPlumb.setContainer('chart-container');
            jsPlumb.addEndpoint(trueId + 'item1', {anchor: 'Right'}, _this.hollowCircle);
            jsPlumb.addEndpoint(trueId + 'item1', {anchor: 'Left'}, _this.hollowCircle);
            jsPlumb.addEndpoint(trueId + 'item2', {anchor: 'Right'}, _this.hollowCircle);
            jsPlumb.addEndpoint(trueId + 'item2', {anchor: 'Left'}, _this.hollowCircle);

            jsPlumb.draggable(trueId);
            $("#" + trueId).draggable({containment: "parent"}); //保证拖动不跨界

            // changeValue("#" + trueId); // 双击修改文本

            // list = jsPlumb.getAllConnections();// 获取所有的连接
            //
            // // 设置当前选择的流程框图
            // sessionStorage['currentChartSelected'] = trueId;
            //
            // // 将新拖进来的流程图框JSON数据push进栈
            // chartOperationStack['add'].push(_this.getSingleChartJson(trueId));
            // chartRareOperationStack.push('add');
        }
    });


    // 保存数据等一些基本操作
    $('.fl-btn').click(function (event) {
        // 取被点击按钮的ID
        var flBtnID = $(this).attr('id');
        // var currentListFlag = getChartRightListFlag();// 当前显示的属性面板
        switch (flBtnID) {
            case 'chart-save': // 分享或保存(生成JSON)
                var jsondata = _this.save();
                console.log("流程图json数据：", jsondata);
                break;
            default:
                break;
        }
    });


    $(".cancalline").click(function () {
        $(".fuchuang").css({"display": "none"});
    });


    // 添加对连线的处理
    jsPlumb.bind("dblclick", function (conn, originalEvent) {
        $(".fuchuang").css({"display": "block"});
        var aaa = conn.sourceId;
        var bbb = conn.targetId;
        var ccc = conn.endpoints[0].anchor.type;
        var ddd = conn.endpoints[1].anchor.type;


        // jsPlumb.detach(conn);

        $('.sureaaa').unbind("click");
        $(".sureaaa").click(function () {
            var PageSourceId = aaa;
            var PageTargetId = bbb;
            var innercont = $(".inputcont").val();
            var common = {
                anchors: [ccc, ddd],
                endpoints: ["Blank", "Blank"],
                paintStyle: {
                    lineWidth: 2,
                    strokeStyle: "#002050",
                },
                label: innercont,
                cssClass: PageSourceId + PageTargetId,
                connector: ['Flowchart', {cornerRadius: 10}]
            };

            jsPlumb.connect({
                source: PageSourceId,
                target: PageTargetId,
                overlays: [["Diamond", {
                    location: 0.5,
                    width: 6,
                    height: 6
                }], [["Arrow"], {
                    location: 1,
                    width: 6,
                    height: 6
                }]]
            }, common);

            $("." + PageSourceId + PageTargetId).next().html(innercont);
            $(".fuchuang").css({"display": "none"});
        })
    });


    /************************* 加载图形数据 ************************************/
    if (document.location.hash.substr(1) !== "") {
        var jsonurl = document.location.hash.substr(1) + '.json';
        $.getJSON(jsonurl, function (data) {
            var sss = JSON.stringify(data);
            _this.loadChartByJSON(sss);
            // sessionStorage['currentChartAmount'] = sessionStorage['currentChartAmount'] + 2;
        });
    }
};
Object.assign(PJP.JsPlumb.prototype, {
    /**
     * 生成单个流程图数据,用在新建流程图框时使用
     * @param id 参数ID表示被push进栈的ID
     * @returns {string}
     */
    getSingleChartJson: function (id) {

        var connects = [];

        for (var i in this.list) {
            for (var j in list[i]) {
                connects.push({
                    ConnectionId: list[i][j]['id'],
                    PageSourceId: list[i][j]['sourceId'],
                    PageTargetId: list[i][j]['targetId'],
                    Connectiontext: list[i][j].getLabel(),
                });
            }
        }
        var blocks = []; // 保存方框的样式
        var elem = $("#" + id);
        var rareHTML = elem.html();
        var resultHTML = rareHTML;

        // 去掉在进行复制操作时误复制的img部件
        if (rareHTML.indexOf('<img src=\"img/delete.png\"') != -1) {
            rareHTML = rareHTML.split('<img src=\"img/delete.png\"');
            resultHTML = rareHTML[0];
        }
        if (resultHTML.indexOf('<div style="z-index: 90;" ') != -1) {
            resultHTML = resultHTML.split('<div style="z-index: 90;" ')[0];
        }
        /**********************字体**********************/
            //字体
        var Bfont = elem.css("font");
        //字体颜色
        var fontSize = elem.css('font-size');
        //字体对齐方式
        var fontAlign = elem.css('text-align');
        //字体颜色
        var fontColor = elem.css('color');

        (Bfont == '') ? Bfont = "微软雅黑" : Bfont;
        (fontSize == '') ? fontSize = '12' : fontSize;
        (fontAlign == '') ? fontAlign = 'center' : fontAlign;
        (fontColor == '') ? fontColor = 'rgb(0,0,0)' : fontColor;

        /**********************物件**********************/
            //圆角
        var borderRadius = elem.css('borderRadius');
        var elemType = id.split('-')[0];
        (borderRadius == '') ? borderRadius = '0' : borderRadius;
        //如果当前部件是圆角矩形,且borderRadius为空或者为0就把默认borderradius设置为4,下同
        (elemType == 'roundedRect' && (borderRadius == '' || borderRadius == '0')) ? borderRadius = '4' : borderRadius;
        (elemType == 'circle' && (borderRadius == '' || borderRadius == '0')) ? borderRadius = '15' : borderRadius;
        //填充
        var fillColor = elem.css('backgroundColor');
        (fillColor == '') ? fillColor = 'rgb(255,255,255)' : fillColor;
        //渐近度
        var fillBlurRange = elem.css('boxShadow');//rgb(0, 0, 0) 10px 10px 17px 20px inset
        var fillBlurSplit = fillBlurRange.split(' ');
        (fillBlurRange == '') ? fillBlurRange = '0' : fillBlurRange = fillBlurSplit[5];
        //渐近色
        var fillBlurColor = fillBlurSplit[0] + fillBlurSplit[1] + fillBlurSplit[2];
        //线框样式
        var borderStyle = elem.css('border-left-style');
        (borderStyle == '') ? borderStyle = 'solid' : borderStyle;
        //线框宽度
        var borderWidth = elem.css('border-left-width');
        (borderWidth == '') ? borderWidth = '2' : borderWidth.split('px')[0];
        //线框颜色
        var borderColor = elem.css('border-left-color');
        (borderColor == '') ? borderColor = 'rgb(136,242,75)' : borderColor;

        //阴影数据
        var shadow = elem.css('box-shadow');

        //字体样式数据
        var fontStyle = elem.css('fontStyle');
        var fontWeight = elem.css('fontWeight');
        var fontUnderline = elem.css('textDecoration');

        //文字高度
        var lineHeight = elem.css('line-height');

        blocks.push({
            BlockId: elem.attr('id'),
            BlockContent: resultHTML,
            BlockX: parseInt(elem.css("left"), 10),
            BlockY: parseInt(elem.css("top"), 10),
            BlockWidth: parseInt(elem.css("width"), 10),
            BlockHeight: parseInt(elem.css("height"), 10),
            BlockFont: Bfont,
            BlockFontSize: fontSize,
            BlockFontAlign: fontAlign,
            BlockFontColor: fontColor,
            BlockBorderRadius: borderRadius,
            BlockBackground: fillColor,
            BlockFillBlurRange: fillBlurRange,
            BlockFillBlurColor: fillBlurColor,
            BlockBorderStyle: borderStyle,
            BlockBorderWidth: borderWidth,
            BlockborderColor: borderColor,
            BlockShadow: shadow,
            BlockFontStyle: fontStyle,
            BlockFontWeight: fontWeight,
            BlockFontUnderline: fontUnderline,
            BlockLineHeight: lineHeight
        });

        var serliza = "{" + '"connects":' + JSON.stringify(connects) + ',"block":' + JSON.stringify(blocks) + "}";
        // console.log(serliza);
        return serliza;
    },

    //********************************* 流程图数据操作区域 *********************************
    /**
     * 序列化全部流程图数据,json格式
     * @returns {string}
     */
    save: function () {

        var list = jsPlumb.getAllConnections();

        // 获取连接的参数
        var connects = [];
        for (var i in list) {
            connects.push({
                ConnectionId: list[i]['id'],
                PageSourceId: list[i]['sourceId'],
                PageTargetId: list[i]['targetId'],
                Connectiontext: list[i].getLabel(),
                Firstpoint: list[i].endpoints[0].anchor.type,
                Secondpoint: list[i].endpoints[1].anchor.type
            });
        }

        // 获取样式相关的参数
        var blocks = [];
        $(".droppable .draggable").each(function (idx, elem) {
            var $elem = $(elem);

            var title = $elem.find("h4")[0].innerHTML;
            var items = [];
            $elem.find("ul > li").each(function (id, item) {
                items.push({
                    id: $(item).attr("id"),
                    name: item.innerHTML
                });
            });
            blocks.push({
                BlockId: $elem.attr('id'),
                BlockX: parseInt($elem.css("left"), 10),
                BlockY: parseInt($elem.css("top"), 10),
                BlockWidth: parseInt($elem.css("width"), 10),
                BlockHeight: parseInt($elem.css("height"), 10),
                BlockTitle: title,
                BlockItems: items,
            });

        });

        var serliza = "{" + '"connects":' + JSON.stringify(connects) + ',"block":' + JSON.stringify(blocks) + "}";
        // console.log(serliza);
        return serliza;
    },

    /********************************** 通过json加载流程图 *********************************/
    /**
     * 通过json加载流程图
     * @param data
     * @returns {boolean}
     */
    loadChartByJSON: function (data) {

        // 清空图形显示区
        $("#chart-container").html(' ');

        var unpack = JSON.parse(data);

        // 显示基本图形
        jsPlumb.setContainer('chart-container');
        for (var i = 0; i < unpack['block'].length; i++) {
            var BlockId = unpack['block'][i]['BlockId'];
            var BlockTitle = unpack['block'][i]['BlockTitle'];
            var BlockItems = unpack['block'][i]['BlockItems'];
            var BlockX = unpack['block'][i]['BlockX'];
            var BlockY = unpack['block'][i]['BlockY'];
            var BlockWidth = unpack['block'][i]['BlockWidth'];
            var BlockHeight = unpack['block'][i]['BlockHeight'];


            /**
             * <div class="group" style="top:150px;left:500px">
             *     <h4>vector</h4>
             *     <ul>
             *         <li id="item_left" class="item"></li>
             *         <li id="item_left2" class="item"></li>
             *         </ul>
             * </div>
             */
            var $div = $("<div class=\"draggable\" id=\"" + BlockId + "\"></div>");
            var $h4 = $("<h4>" + BlockTitle + "</h4>");
            $div.append($h4);
            var $ul = $("<ul></ul>");

            $div.append($ul);
            $(".chart-design").append($div);

            $("#" + BlockId)
                .css("position", "absolute")
                .css("left", BlockX)
                .css("top", BlockY)
                .css("width", BlockWidth)
                .css("height", BlockHeight)
                .css("margin", "0px")
                .css("background", "#efefef");

            for (var j = 0; j < BlockItems.length; j++) {
                var $li1 = $("<li class=\"item\" id=\"" + BlockItems[j].id + "\">" + BlockItems[j].name + "</li>");
                $ul.append($li1);

                jsPlumb.addEndpoint(BlockItems[j].id, {anchor: 'Right'}, this.hollowCircle);
                jsPlumb.addEndpoint(BlockItems[j].id, {anchor: 'Left'}, this.hollowCircle);
            }
        }

        // 显示连接
        for (i = 0; i < unpack['connects'].length; i++) {

            var ConnectionId = unpack['connects'][i]['ConnectionId'];
            var PageSourceId = unpack['connects'][i]['PageSourceId'];
            var PageTargetId = unpack['connects'][i]['PageTargetId'];
            var Firstpoint = unpack['connects'][i]['Firstpoint'];
            var Secondpoint = unpack['connects'][i]['Secondpoint'];

            //用jsPlumb添加锚点

            jsPlumb.draggable($("#" + PageSourceId).parent().parent().attr("id"));
            jsPlumb.draggable($("#" + PageTargetId).parent().parent().attr("id"));

            $("#" + PageSourceId).parent().parent().draggable({containment: "parent"}); //保证拖动不跨界
            $("#" + PageTargetId).parent().parent().draggable({containment: "parent"}); //保证拖动不跨界

            var common = {
                anchors: [Firstpoint, Secondpoint],
                endpoints: ["Blank", "Blank"],
                label: unpack['connects'][i]['Connectiontext'],
                paintStyle: {
                    lineWidth: 2,
                    strokeStyle: "#002050",
                },
                connector: ['Flowchart',{cornerRadius: 10}]
            };

            jsPlumb.connect({
                source: PageSourceId,
                target: PageTargetId,
                overlays: [["Diamond", {
                    location: 0.5,
                    width: 12,
                    height: 12
                }], [["Arrow"], {
                    location: 1,
                    width: 6,
                    height: 6
                }]]
            }, common);
        }

        return true;
    }
});

$(function () {
    var jsplumb = new PJP.JsPlumb();
});