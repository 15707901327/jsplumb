var PJP = {};

PJP.JsPlumb = function () {

    var _this = this;

    // 根蒂根基连接线样式
    this.connectorPaintStyle = {
        lineWidth: 2,
        strokeStyle: "rgb(0,32,80)", // 连接线样式
        joinstyle: "round",
        // outlineColor: "rgb(251,251,251)", // 拉动连接线外围样式
        outlineWidth: 2
    };
    // 鼠标悬浮在连接线上的样式
    this.connectorHoverStyle = {
        lineWidth: 2,
        strokeStyle: "#216477",
        outlineWidth: 0,
        // outlineColor: "rgb(251,251,251)" // 连接线外围样式
    };
    this.hollowCircle = {
        endpoint: ["Image", {src: "img/spot_nor.png"}],  //端点的外形
        // connectorStyle: this.connectorPaintStyle, //连接线的色彩,大小样式
        // connectorHoverStyle: this.connectorHoverStyle,
        // paintStyle: {
        //     strokeStyle: "rgb(178,178,178)",
        //     fillStyle: "rgb(178,178,178)",
        //     opacity: 0.5,
        //     radius: 2,
        //     lineWidth: 2
        // },//端点的色彩样式
        //anchor: "AutoDefault",
        isSource: true,    //是否可以拖动(作为连线出发点)
        //connector: ["Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],  //连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight ]
        connector: ["Flowchart", {cornerRadius: 10}],//设置连线为贝塞尔曲线
        isTarget: true,    //是否可以放置(连线终点)
        // maxConnections: -1,    // 设置连接点最多可以连接几条线
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

    // 保存当前添加的节点
    this.currentBlock = [];

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

        _this.connectionDblclick({
            sourceId: conn.sourceId,
            targetId: conn.targetId,
        });


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
    jsPlumb.bind('connection', function (info, originalEvent) {
        _this.connection({
            sourceId: info.sourceId,
            targetId: info.targetId
        });
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
     * 创建流程图节点
     * @param data
     */
    createChart: function (data) {
        var i, j;

        var trueId = data.BlockId;
        // 如果已经存在节点实例，直接返回
        if (document.getElementById(trueId) !== null) {
            return;
        }

        /**
         * <div class="group" style="top:150px;left:500px">
         *     <h4>vector</h4>
         *     <ul>
         *         <li id="item_left" class="item"></li>
         *         <li id="item_left2" class="item"></li>
         *         </ul>
         * </div>
         */
        var $div = $("<div class=\"draggable new-rect\" id=\"" + trueId + "\"></div>");
        $('#chart-container').append($div);
        $("#" + trueId).css("position", "absolute")
            .css("left", data.BlockX)
            .css("top", data.BlockY)
            .css("margin", "0px")
            .css("background", "#efefef");

        var $h4 = $("<h4>" + data.BlockTitle + "</h4>");
        $div.append($h4);

        var $ul = $("<ul></ul>");
        $div.append($ul);

        jsPlumb.setContainer('chart-container');
        for (i = 0; i < data.BlockItems.length; i++) {
            var id = trueId + "_" + data.BlockItems[i].id;
            var $li1 = $("<li class=\"item\" id=\"" + id + "\">" + data.BlockItems[i].name + "</li>");
            $ul.append($li1);

            // 用jsPlumb添加锚点
            jsPlumb.addEndpoint(id, {anchor: 'Right'}, this.hollowCircle);
            jsPlumb.addEndpoint(id, {anchor: 'Left'}, this.hollowCircle);
        }

        // 保存当前创建的节点
        this.currentBlock.push(data.BlockId);

        // 查找并连线
        for (i = 0; i < data.BlockItems.length; i++) {
            var pageSource = data.BlockItems[i].PageSource;
            var pageTarget = data.BlockItems[i].PageTarget;
            if (pageSource) {
                for (j = 0; j < pageSource.length; j++) {
                    if (this.currentBlock.indexOf(pageSource[j].BlockId) > -1) {
                        this._createLine({
                            firstPoint: pageSource[j].Firstpoint,
                            secondPoint: pageSource[j].Secondpoint,
                            source: pageSource[j].BlockId + "_" + pageSource[j].AttributeID,
                            target: trueId + "_" + data.BlockItems[i].id
                        });
                    }
                }
            }
            if (pageTarget) {
                for (j = 0; j < pageTarget.length; j++) {
                    if (this.currentBlock.indexOf(pageTarget[j].BlockId) > -1) {
                        this._createLine({
                            firstPoint: pageTarget[j].Firstpoint,
                            secondPoint: pageTarget[j].Secondpoint,
                            source: trueId + "_" + data.BlockItems[i].id,
                            target: pageTarget[j].BlockId + "_" + pageTarget[j].AttributeID
                        });
                    }
                }
            }
        }

        jsPlumb.draggable(trueId + "");
        $("#" + trueId).draggable({containment: "parent"}); //保证拖动不跨界
    },

    /**
     * 创建连线
     * @param options
     *  firstPoint
     *  secondPoint
     *  source
     *  target
     * @private
     */
    _createLine: function (options) {
        var LineCommon = {
            anchors: [options.firstPoint, options.secondPoint],
            endpoints: ["Blank", "Blank"],
            paintStyle: {
                lineWidth: 2,
                strokeStyle: "#002050",
            },
            connector: ['Flowchart', {cornerRadius: 10}]
        };

        jsPlumb.connect({
            source: options.source,
            target: options.target,
            overlays: [["Diamond", {
                location: 0.5,
                width: 12,
                height: 12
            }], [["Arrow"], {
                location: 1,
                width: 6,
                height: 6
            }]]
        }, LineCommon);
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

            // 保存当前创建的节点
            this.currentBlock.push(BlockId);
        }

        // 显示连接
        for (i = 0; i < unpack['connects'].length; i++) {

            var ConnectionId = unpack['connects'][i]['ConnectionId'];
            var PageSourceId = unpack['connects'][i]['PageSourceId'];
            var PageTargetId = unpack['connects'][i]['PageTargetId'];
            var Firstpoint = unpack['connects'][i]['Firstpoint'];
            var Secondpoint = unpack['connects'][i]['Secondpoint'];

            // 用jsPlumb添加锚点

            jsPlumb.draggable($("#" + PageSourceId).parent().parent().attr("id"));
            jsPlumb.draggable($("#" + PageTargetId).parent().parent().attr("id"));

            $("#" + PageSourceId).parent().parent().draggable({containment: "parent"}); //保证拖动不跨界
            $("#" + PageTargetId).parent().parent().draggable({containment: "parent"}); //保证拖动不跨界

            // 设置连线
            this._createLine({
                firstPoint: Firstpoint,
                secondPoint: Secondpoint,
                source: PageSourceId,
                target: PageTargetId
            });
        }

        return true;
    },

    /********************************** 事件 ************************************************/
    /**
     * 创建连接后触发函数
     * @param data
     */
    connection: function (data) {},

    /**
     * 双击连线
     * @param info
     */
    connectionDblclick(info){}
});