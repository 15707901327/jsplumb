var PJP = {};

/**
 * 流程图实例
 * @param options
 * @constructor
 */
PJP.JsPlumb = function (options) {

    options = options || {};
    this.containerId = options.containerId !== undefined ? options.containerId : "pjp-container";
    this.container = document.getElementById(this.containerId);

    // 设置根节点
    jsPlumb.setContainer(this.container);

    var _this = this;

    this.overlays = [
        [["Arrow"], {
            location: 1,
            width: 6,
            height: 6
        }],
        ["Custom", {
            create: function (component) {
                return $("<div class='custom_overlay'></div>");
            },
            location: 0.5,
        }]
    ];

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
        connectorOverlays: this.overlays,
        scope: "myscope"
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
                overlays: this.overlays
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

    // 折叠事件
    $("#chart-container").on("click", ".group-container", function (e) {

        var target = e.target;
        var parentId = target.parentNode.parentNode.getAttribute("id");

        if ($(target).hasClass("node-collapse")) {
            var collapsed = $(target.parentNode.parentNode).hasClass("collapsed");

            jsPlumb[collapsed ? "removeClass" : "addClass"](target.parentNode.parentNode, "collapsed");
            jsPlumb[collapsed ? "expandGroup" : "collapseGroup"](parentId);
        }
    });
    $("#chart-container").on("click", ".del", function (e) {

        var target = e.target;
        var parentId = target.parentNode.parentNode.getAttribute("id");
        jsPlumb.removeGroup(parentId, true);

        // 删除当前记录创建的id
        var index = _this.currentBlock.indexOf(parentId);
        if (index > -1) {
            _this.currentBlock.splice(index, 1);
        }
    });
    // 添加组时创建
    jsPlumb.bind("group:add", function (info) {
        console.log(info);
    });

    /************************* 加载图形数据 ************************************/
    if (document.location.hash.substr(1) !== "") {
        var jsonurl = "data/" + document.location.hash.substr(1) + '.json';
        $.getJSON(jsonurl, function (data) {
            var sss = JSON.stringify(data);
            _this.loadChartByJSON(sss);
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

        var groupId = data.BlockId;

        // 创建节点
        this._createNode(data);

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
                            target: groupId + "_" + data.BlockItems[i].id
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
                            source: groupId + "_" + data.BlockItems[i].id,
                            target: pageTarget[j].BlockId + "_" + pageTarget[j].AttributeID
                        });
                    }
                }
            }
        }
    },

    /**
     * 创建流程图节点
     * @param data
     * @private
     */
    _createNode(data) {
        var groupId = data.BlockId;
        // 如果已经存在节点实例，直接返回
        if (document.getElementById(groupId) !== null) {
            return;
        }

        /**
         * <div id="foo" class="group-container">
         *     <div class="title" id="title1">数组一</div>
         *     <div class="node-collapse"></div>
         *     <ul>
         *         <li id="item1">属性一</li>
         *         <li id="item2">属性二</li>
         *         <li>属性三</li>
         *         <li>属性四</li>
         *         </ul>
         * </div>
         */
        var $div = $("<div class=\"group-container\" id=\"" + groupId + "\"></div>");
        $($div).css("left", data.BlockX).css("top", data.BlockY);
        $(this.container).append($div);

        var $title = $("<div class=\"title\"><span>" + data.BlockTitle + "</span></div>");
        $div.append($title);
        $title.append("<div class=\"node-collapse\"></div>");
        $title.append("<div class=\"del\"></div>");

        jsPlumb.addGroup({
            el: document.getElementById(groupId),
            id: groupId,
            score: "myscore"
        });

        for (var i = 0; i < data.BlockItems.length; i++) {

            var nodeId = data.BlockItems[i].id + "";
            var id = nodeId.indexOf(data.BlockId) === 0 ? data.BlockItems[i].id : (data.BlockId + "_" + data.BlockItems[i].id);
            var $item = $("<div class=\"item\" id=\"" + id + "\">" + data.BlockItems[i].name + "</div>");
            $div.append($item);

            jsPlumb.addToGroup(groupId, $item[0]);

            // 用jsPlumb添加锚点
            jsPlumb.addEndpoint(id, {anchor: 'Right'}, this.hollowCircle);
            jsPlumb.addEndpoint(id, {anchor: 'Left'}, this.hollowCircle);
        }

        // 保存当前创建的节点
        this.currentBlock.push(data.BlockId);
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
            connector: ['Flowchart', {cornerRadius: 10}]
        };

        jsPlumb.connect({
            source: options.source,
            target: options.target,
            overlays: this.overlays
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
        $(".group-container").each(function (idx, elem) {
            var $elem = $(elem);

            var title = $elem.find(".title")[0].innerHTML;
            var items = [];
            $elem.find(".item").each(function (id, item) {
                items.push({
                    id: $(item).attr("id"),
                    name: item.innerHTML
                });
            });
            blocks.push({
                BlockId: $elem.attr('id'),
                BlockX: parseInt($elem.css("left"), 10),
                BlockY: parseInt($elem.css("top"), 10),
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
        for (var i = 0; i < unpack['block'].length; i++) {
            this._createNode(unpack['block'][i]);
        }

        // 显示连接
        for (i = 0; i < unpack['connects'].length; i++) {

            var ConnectionId = unpack['connects'][i]['ConnectionId'];
            var PageSourceId = unpack['connects'][i]['PageSourceId'];
            var PageTargetId = unpack['connects'][i]['PageTargetId'];
            var Firstpoint = unpack['connects'][i]['Firstpoint'];
            var Secondpoint = unpack['connects'][i]['Secondpoint'];

            // 用jsPlumb添加锚点
            jsPlumb.draggable($("#" + PageSourceId).parent(), {});
            jsPlumb.draggable($("#" + PageTargetId).parent(), {});

            // $("#" + PageSourceId).parent().draggable({containment: "parent"}); //保证拖动不跨界
            // $("#" + PageTargetId).parent().draggable({containment: "parent"}); //保证拖动不跨界

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
    connection: function (data) {
    },

    /**
     * 双击连线
     * @param info
     */
    connectionDblclick(info) {
    }
});